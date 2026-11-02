// Telegram alerts for the operator: a launch went live, the sniper report, big sales into buys, a chest paused because someone else traded
// from the vault wallet, books fitted to the wallet, errors. Off unless TELEGRAM_BOT_TOKEN is set (Render env — never in the repo).
// The chat: TELEGRAM_CHAT_ID if set, else the first chat that sends /start to the bot (kept in DATA_DIR/telegram.json); every other chat is
// told the bot is private. Messages are batched (one send per ~1.5 s, ≤ 3.8k chars) and errors are deduped (same error ≤ once per 10 min),
// so a loop of failures is one line, not a flood. Sending never throws into the caller and never blocks a trade.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import * as EV from './events.ts'

const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || ''
const FILE = () => (process.env.DATA_DIR || './data') + '/telegram.json'
const api = (m: string) => `https://api.telegram.org/bot${TOKEN()}/${m}`
type St = { chat?: number | string; offset?: number }
let st: St = (() => { try { return existsSync(FILE()) ? JSON.parse(readFileSync(FILE(), 'utf8')) : {} } catch { return {} } })()
const persist = () => { try { mkdirSync(process.env.DATA_DIR || './data', { recursive: true }); writeFileSync(FILE(), JSON.stringify(st)) } catch {} }
export const enabled = () => !!TOKEN()
export const chat = () => process.env.TELEGRAM_CHAT_ID || st.chat || null
export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const links = (mint: string, venue?: string) => [`<a href="https://dexscreener.com/solana/${mint}">dex</a>`, venue === 'pump' ? `<a href="https://pump.fun/coin/${mint}">pump</a>` : '', `<a href="https://solscan.io/token/${mint}">solscan</a>`, `<a href="https://app.banker.cash/#coin/${mint}">banker</a>`].filter(Boolean).join(' · ')

const q: string[] = []; let flushT: any = null; let sending = false; const recent = new Map<string, number>()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function call(method: string, body: any, timeoutMs = 15_000): Promise<any> {
  const r = await fetch(api(method), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) })
  const j: any = await r.json().catch(() => null); if (!r.ok || !j?.ok) { const e: any = new Error(`telegram ${method}: ${r.status} ${j?.description || ''}`.trim()); e.status = r.status; e.retryAfter = j?.parameters?.retry_after; throw e }
  return j.result
}
/** queue one alert. `key` + `everyMs`: the same key is sent at most once per window (errors). Text is HTML (escape what you interpolate). */
export function send(text: string, key?: string, everyMs = 0) {
  if (!enabled() || !text) return
  if (key && everyMs) { const t = recent.get(key) || 0; if (Date.now() - t < everyMs) return; recent.set(key, Date.now()); if (recent.size > 500) for (const [k, t2] of recent) if (Date.now() - t2 > 3.6e6) recent.delete(k) }
  q.push(text.slice(0, 3800)); if (q.length > 60) q.splice(0, q.length - 60)
  if (!flushT) flushT = setTimeout(flush, +(process.env.TELEGRAM_BATCH_MS || 1500))
}
export async function flush() {
  flushT = null; const c = chat(); if (!c || !q.length) return   // not paired yet: the queue waits (≤60) and goes out once someone sends /start
  if (sending) { flushT = setTimeout(flush, 1000); return }
  sending = true
  try {
    while (q.length) {
      let body = ''; while (q.length && body.length + q[0].length + 2 <= 3800) body += (body ? '\n\n' : '') + q.shift()
      if (!body) body = q.shift()!
      try { await call('sendMessage', { chat_id: c, text: body, parse_mode: 'HTML', disable_web_page_preview: true }) }
      catch (e: any) { if (e.status === 429) { q.unshift(body); await sleep(Math.min(30, e.retryAfter || 5) * 1000); continue } if (e.status === 400 && /parse/i.test(e.message)) { await call('sendMessage', { chat_id: c, text: body.replace(/<[^>]+>/g, ''), disable_web_page_preview: true }).catch(() => {}) } }
      if (q.length) await sleep(1100)
    }
  } finally { sending = false }
}

// ---- which logged events become alerts ----
const ALERT_VAULT = /sniper report|refunded|platform fees claimed|switched off by the operator|re-armed|auto-armed|armed by the server|claim skipped|credited .* unattributed|moved .* chest/i
/** a log line → its dedupe key: numbers, signatures and addresses dropped, so "x failed 0x1 (4kP…)" and "x failed 0x1 (9aB…)" are one key */
export const errKey = (msg: string) => msg.replace(/\S+…/g, '#').replace(/[1-9A-HJ-NP-Za-km-z]{20,}/g, '#').replace(/\d+(\.\d+)?/g, '#').slice(0, 120)
const errTimes: number[] = []; let errHeld = 0
export function route(e: EV.Ev) {
  if (e.kind === 'error') {
    const key = 'err:' + errKey(e.msg), every = +(process.env.TELEGRAM_ERR_EVERY_MS || 600_000); if (Date.now() - (recent.get(key) || 0) < every) return
    // a storm of different errors: ≤ 20 an hour, the rest counted and mentioned with the next one that goes out
    const now = Date.now(); while (errTimes.length && now - errTimes[0] > 3.6e6) errTimes.shift(); if (errTimes.length >= 20) { errHeld++; return } errTimes.push(now)
    send(`⚠️ ${esc(e.msg)}${errHeld ? ` <i>(+${errHeld} more errors held back this hour — /admin/events has them)</i>` : ''}`, key, every); errHeld = 0
  }
  else if (e.kind === 'vault' && ALERT_VAULT.test(e.msg)) send(`${/sniper report/i.test(e.msg) ? '🎯' : '🏦'} ${esc(e.msg)}`)
}

// ---- /start pairing + /status ----
let statusFn: (() => Promise<string>) | null = null
export const setStatus = (f: () => Promise<string>) => { statusFn = f }
const HELP = 'BANKER alerts. /status — vault wallet and chests · /help — this'
export async function handle(u: any) {
  const m = u?.message; const id = m?.chat?.id; const text = String(m?.text || '').trim(); if (id == null || !text.startsWith('/')) return
  const cmd = text.split(/[\s@]/)[0].toLowerCase(); const mine = chat() != null && String(chat()) === String(id)
  if (cmd === '/start') {
    if (chat() == null) { st.chat = id; persist(); await call('sendMessage', { chat_id: id, text: `paired ✓ — BANKER alerts come here now (launches, sniper reports, big sales, pauses, errors).\n${HELP}` }).catch(() => {}); EV.log('vault', `telegram alerts paired with chat ${String(id).slice(0, 4)}…`); flush().catch(() => {}); return }
    await call('sendMessage', { chat_id: id, text: mine ? `already paired. ${HELP}` : 'this bot is private.' }).catch(() => {}); return
  }
  if (!mine) return
  if (cmd === '/status') { let s = 'status unavailable'; try { if (statusFn) s = await statusFn() } catch (e: any) { s = 'status failed: ' + esc(String(e?.message || e).slice(0, 120)) } await call('sendMessage', { chat_id: id, text: s, parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => {}); return }
  if (cmd === '/help') await call('sendMessage', { chat_id: id, text: HELP }).catch(() => {})
}
let polling = false
/** long-polls getUpdates for /start, /status. Two server instances during a deploy both poll: Telegram answers the loser 409 — it waits. */
export async function start() {
  if (!enabled() || polling) return; polling = true; EV.onLog(route)
  for (;;) {
    try {
      const ups: any[] = await call('getUpdates', { offset: st.offset || 0, timeout: 50, allowed_updates: ['message'] }, 65_000)
      for (const u of ups) { st.offset = u.update_id + 1; persist(); await handle(u).catch(() => {}) }
      if (q.length && chat() && !flushT && !sending) flush().catch(() => {})
    } catch (e: any) { await sleep(e?.status === 409 ? 15_000 : e?.status === 401 || e?.status === 404 ? 600_000 : 5_000) }   // 401/404: bad token — check again in 10 min
    if (process.env.TELEGRAM_POLL === '0') return
  }
}
/** tests */
export const _reset = () => { q.length = 0; recent.clear(); errTimes.length = 0; errHeld = 0; st = {}; if (flushT) clearTimeout(flushT); flushT = null; sending = false }
export const _queue = () => q.slice()
