// Launch from Telegram (paired chat only). The bot walks through a launch — name, ticker, image, venue, socials, how much the chest buys,
// the chest's SOL, your own buy — and saves it as a draft. Its last message is a button that opens app.banker.cash inside Phantom with the
// form filled in: one tap, one Phantom signature. The bot never signs and never holds a key: the creator is the wallet in Phantom.
// Also: /receipts, /report <ticker>, /pause <ticker> [min], /resume <ticker>, /withdraw <ticker> (a preview + a link; the withdrawal itself
// is signed in the app). Drafts live 2 h in DATA_DIR/tgdrafts and are read by the app at GET /tg/draft/<id> (the id is 128 random bits).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import * as AL from './alert.ts'

export type Draft = { id: string; at: number; step: Step; name?: string; symbol?: string; image?: { b64: string; mime: string }; venue?: 'pump' | 'launchlab'; twitter?: string; website?: string; telegram?: string; pct?: number; buyNow?: boolean; chest?: number; dev?: number }
type Step = 'name' | 'symbol' | 'image' | 'venue' | 'socials' | 'pct' | 'chest' | 'dev' | 'ready'
export type Deps = {
  list: () => any[]; receipts: () => any; withdrawPreview: (id: string) => Promise<any>; pause: (id: string, ms: number) => any; solForPct: (pct: number, dev: number) => number
}
let D: Deps | null = null
const APP = () => (process.env.APP_URL || 'https://app.banker.cash').replace(/\/$/, '')
const DIR = () => (process.env.DATA_DIR || './data') + '/tgdrafts'
const TTL = 2 * 3.6e6
let cur: Draft | null = null
const pending = new Map<string, { id: string; ms: number; sym: string; at: number }>()   // confirm buttons for /pause

const say = (chat: any, text: string, extra: any = {}) => AL.call('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra }).catch(() => null)
const kb = (rows: [string, string][][]) => ({ reply_markup: { inline_keyboard: rows.map((r) => r.map(([text, data]) => (data.startsWith('http') ? { text, url: data } : { text, callback_data: data }))) } })
const sol = (x: number) => (Math.round(x * 1000) / 1000).toString()
const save = (d: Draft) => { mkdirSync(DIR(), { recursive: true }); writeFileSync(`${DIR()}/${d.id}.json`, JSON.stringify(d)) }
function sweep() { try { if (!existsSync(DIR())) return; for (const f of readdirSync(DIR())) { const p = `${DIR()}/${f}`; if (Date.now() - statSync(p).mtimeMs > TTL) unlinkSync(p) } } catch {} }
/** the app reads a ready draft (no auth: the id is the secret, it expires in 2 h) */
export function getDraft(id: string) {
  if (!/^[a-f0-9]{32}$/.test(id)) return null; const p = `${DIR()}/${id}.json`; if (!existsSync(p)) return null
  const d: Draft = JSON.parse(readFileSync(p, 'utf8')); if (Date.now() - d.at > TTL || d.step !== 'ready') return null
  const { step: _s, ...out } = d; return out
}
export const phantomLink = (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(APP())}`
const findBySymbol = (sym: string) => { const s = sym.replace(/^\$/, '').toUpperCase(); return (D?.list() || []).filter((v) => String(v.symbol || '').toUpperCase() === s).sort((a, b) => (b.report?.armedAt || 0) - (a.report?.armedAt || 0))[0] || null }

const HELP = '/launch — launch a coin (you sign once in Phantom)\n/receipts — every launch so far\n/report TICKER — one launch\n/pause TICKER [minutes] · /resume TICKER\n/withdraw TICKER — what a withdrawal would pay\n/cancel — drop the launch in progress'
export function init(deps: Deps) { D = deps; AL.setBot(onUpdate, HELP); setInterval(sweep, 10 * 60_000) }

const ASK: Record<Step, [string, any?]> = {
  name: ['<b>new launch</b> — what\'s the coin\'s name? (/cancel any time)'],
  symbol: ['ticker? (letters and numbers, up to 10)'],
  image: ['send the coin\'s image (a photo, or an image file)'],
  venue: ['where does it launch?', kb([[['pump.fun', 'v:pump'], ['BANKER launchpad', 'v:launchlab']]])],
  socials: ['X handle and website? send them in one message, like <code>@handle site.com t.me/group</code> — or skip', kb([[['skip', 's:skip']]])],
  pct: ['how much of the supply does the chest buy at launch?', null],
  chest: ['SOL in the chest on top, for dip buys?', kb([[['0.25', 'c:0.25'], ['0.5', 'c:0.5'], ['1', 'c:1'], ['2', 'c:2']]])],
  dev: ['your own buy at launch?', kb([[['none', 'd:0'], ['0.5', 'd:0.5'], ['1', 'd:1'], ['2', 'd:2']]])],
  ready: [''],
}
async function ask(chat: any, d: Draft) {
  if (d.step === 'pct') return say(chat, ASK.pct[0], kb([[['10%', 'p:10'], ['15%', 'p:15'], ['20%', 'p:20'], ['25%', 'p:25']], ...(d.venue === 'launchlab' ? [[['none — fees fill it (free)', 'p:fees']]] as [string, string][][] : [])]))
  if (d.step === 'ready') return ready(chat, d)
  const [t, extra] = ASK[d.step]; return say(chat, t, extra || {})
}
async function ready(chat: any, d: Draft) {
  d.at = Date.now(); save(d); cur = null
  const vaultBuy = d.buyNow === false ? 0 : D!.solForPct(d.pct || 10, d.dev || 0); const total = (d.dev || 0) + vaultBuy + (d.chest || 0) + (d.venue === 'launchlab' ? 0.1 : 0.02)
  const url = `${APP()}/#/launch/${d.id}`
  const lines = [`<b>${AL.esc(d.name)} ($${AL.esc(d.symbol)})</b> on ${d.venue === 'pump' ? 'pump.fun' : 'the BANKER launchpad'}`,
    d.buyNow === false ? 'chest buys: none at launch — the 2% fee fills it' : `chest buys ${d.pct}% of supply ≈ ${sol(vaultBuy)} SOL`, `chest SOL on top: ${sol(d.chest || 0)}`, `your buy: ${sol(d.dev || 0)} SOL`,
    [d.twitter, d.website, d.telegram].filter(Boolean).length ? 'links: ' + [d.twitter, d.website, d.telegram].filter(Boolean).map(AL.esc).join(' · ') : '',
    `<b>total ≈ ${sol(total)} SOL</b> from the wallet you sign with (exact number on the sign screen)`, '', 'tap below: BANKER opens in Phantom with this filled in → Launch → approve once. the link works for 2 hours.']
  return say(chat, lines.filter((x) => x !== '').join('\n'), kb([[['✍️ sign in Phantom', phantomLink(url)]], [['open in a browser instead', url]], [['start over', 'x:restart']]]))
}
function socials(text: string, d: Draft) {
  for (const t of text.split(/[\s,]+/).filter(Boolean)) {
    if (/t\.me\//i.test(t)) d.telegram = t.startsWith('http') ? t : 'https://' + t
    else if (t.startsWith('@') || /(x|twitter)\.com\//i.test(t)) d.twitter = t.startsWith('@') ? 'https://x.com/' + t.slice(1) : t.startsWith('http') ? t : 'https://' + t
    else if (/\./.test(t)) d.website = t.startsWith('http') ? t : 'https://' + t
  }
}
async function image(chat: any, m: any, d: Draft) {
  const ph = Array.isArray(m.photo) && m.photo.length ? m.photo.slice().sort((a: any, b: any) => (b.file_size || 0) - (a.file_size || 0)).find((p: any) => (p.file_size || 0) <= 5e6) || m.photo[0] : null
  const doc = m.document && /^image\//.test(m.document.mime_type || '') ? m.document : null
  const f = ph || doc; if (!f) return say(chat, 'that isn\'t an image — send a photo or an image file')
  if ((f.file_size || 0) > 5e6) return say(chat, 'that image is over 5 MB — send a smaller one')
  try {
    const info = await AL.call('getFile', { file_id: f.file_id }); const buf = await AL.download(info.file_path)
    const mime = doc?.mime_type || (/\.png$/i.test(info.file_path) ? 'image/png' : /\.webp$/i.test(info.file_path) ? 'image/webp' : /\.gif$/i.test(info.file_path) ? 'image/gif' : 'image/jpeg')
    d.image = { b64: buf.toString('base64'), mime }; d.step = 'venue'; return ask(chat, d)
  } catch (e: any) { return say(chat, 'couldn\'t get that image from Telegram (' + AL.esc(String(e?.message || e).slice(0, 60)) + ') — send it again') }
}
async function onCallback(chat: any, cq: any) {
  await AL.call('answerCallbackQuery', { callback_query_id: cq.id }).catch(() => {})
  const data = String(cq.data || ''); const [k, v] = [data.slice(0, 1), data.slice(2)]
  if (data === 'x:restart') { cur = newDraft(); return ask(chat, cur) }
  if (k === 'z') { const p = pending.get(v); pending.delete(v); if (!p || Date.now() - p.at > 10 * 60_000) return say(chat, 'that button expired — send /pause again'); try { D!.pause(p.id, p.ms); return say(chat, p.ms ? `⏸ <b>${AL.esc(p.sym)}</b> paused for ${Math.round(p.ms / 60000)} min — no sales or buys until then. /resume ${AL.esc(p.sym)} to undo` : `▶️ <b>${AL.esc(p.sym)}</b> trading again`) } catch (e: any) { return say(chat, AL.esc(String(e?.message || e).slice(0, 120))) } }
  if (k === 'n') { pending.delete(v); return say(chat, 'ok, nothing changed') }
  const d = cur; if (!d) return say(chat, 'no launch in progress — /launch to start one')
  if (k === 'v' && d.step === 'venue') { d.venue = v === 'pump' ? 'pump' : 'launchlab'; d.step = 'socials'; return ask(chat, d) }
  if (k === 's' && d.step === 'socials') { d.step = 'pct'; return ask(chat, d) }
  if (k === 'p' && d.step === 'pct') { if (v === 'fees') { d.buyNow = false; d.pct = 10 } else { d.buyNow = true; d.pct = Math.min(50, Math.max(5, +v || 10)) } d.step = 'chest'; return ask(chat, d) }
  if (k === 'c' && d.step === 'chest') { d.chest = Math.min(10, Math.max(0.05, +v || 0.5)); d.step = 'dev'; return ask(chat, d) }
  if (k === 'd' && d.step === 'dev') { d.dev = Math.min(5, Math.max(0, +v || 0)); d.step = 'ready'; return ask(chat, d) }
}
const newDraft = (): Draft => ({ id: randomBytes(16).toString('hex'), at: Date.now(), step: 'name' })
export async function onUpdate(u: any) {
  if (!D) return
  const cq = u?.callback_query; const m = u?.message || cq?.message; const chat = m?.chat?.id; if (chat == null) return
  if (cq) return onCallback(chat, cq)
  const text = String(m.text || '').trim(); const [cmd, ...args] = text.split(/\s+/); const c = cmd.toLowerCase().split('@')[0]
  if (c === '/launch') { cur = newDraft(); return ask(chat, cur) }
  if (c === '/cancel') { const had = !!cur; cur = null; return say(chat, had ? 'launch dropped' : 'nothing in progress') }
  if (c === '/receipts') { const r = D.receipts(); return say(chat, [`<b>${r.launches} launches</b> · snipers put in ${sol(r.sniperSol)} SOL in the first minute · chests sold ${sol(r.soldSol)} SOL into ${r.sales} buys · fees ${sol(r.feesSol)} SOL`, ...r.rows.slice(0, 8).map((x: any) => `• ${AL.esc(x.symbol)} (${x.venue === 'pump' ? 'pump' : 'launchpad'}) · sold ${sol(x.soldSol)} SOL${x.sniper ? ` · snipers ${sol(x.sniper.buySol)}` : ''}`), `${APP()}/#/receipts`].join('\n')) }
  if (c === '/report' || c === '/withdraw' || c === '/pause' || c === '/resume') {
    if (!args[0]) return say(chat, `which coin? like <code>${c} BANKER</code>`)
    const v = findBySymbol(args[0]); if (!v) return say(chat, `no live chest with the ticker ${AL.esc(args[0])}`)
    if (c === '/report') { const r = v.report || {}; const sn = v.sniper; const price = v.live?.price || 0; const res = v.chest + v.tokens * price - (r.staked || 0)
      return say(chat, [`<b>${AL.esc(v.symbol)}</b> · ${v.venue === 'pump' ? 'pump.fun' : 'launchpad'}`, `put in ${sol(r.staked || 0)} SOL${r.launchBuySol ? ` (${sol(r.launchBuySol)} bought coins at launch)` : ''}`, sn ? `snipers: ${sn.buys} buys · ${sol(sn.buySol)} SOL from ${sn.wallets} wallets · chest sold ${sol(sn.soldInto)} into them` : '',
        `sold into buys ${sol(r.soldSol || 0)} SOL in ${r.sales || 0} sales${r.taxSol ? ` · fees in ${sol(r.taxSol)} SOL` : ''}`, `holds ${sol(v.chest)} SOL + ${Math.round(v.tokens).toLocaleString('en-US')} coins`, r.fitted ? 'result: — (SOL moved in or out of the vault wallet outside this chest, so its own result isn\'t reliable)' : `result so far ${res >= 0 ? '+' : ''}${sol(res)} SOL (coins at today's price)`, AL.links(v.mint, v.venue)].filter(Boolean).join('\n')) }
    if (c === '/withdraw') { const p = await D.withdrawPreview(v.id).catch((e: any) => ({ ok: false, why: String(e?.message || e) }))
      return say(chat, p.ok ? `withdrawing <b>${AL.esc(v.symbol)}</b> pays ≈ ${sol(p.sol)} SOL to ${String(p.to).slice(0, 4)}…${String(p.to).slice(-4)}${p.sells ? ` (its ${Math.round(p.tokens).toLocaleString('en-US')} coins are sold first)` : ''}. it's signed in the app:` : `can't withdraw <b>${AL.esc(v.symbol)}</b>: ${AL.esc(p.why)}`, p.ok ? kb([[['open My launches', `${APP()}/#/mine`]]]) : {}) }
    const ms = c === '/resume' ? 0 : Math.min(24 * 60, Math.max(5, +(args[1] || 60) || 60)) * 60_000; const key = randomBytes(6).toString('hex'); pending.set(key, { id: v.id, ms, sym: v.symbol, at: Date.now() })
    return say(chat, ms ? `pause <b>${AL.esc(v.symbol)}</b> for ${ms / 60000} min? the chest won't sell into buys or buy dips until then.` : `let <b>${AL.esc(v.symbol)}</b> trade again now?`, kb([[[ms ? 'pause' : 'resume', 'z:' + key], ['cancel', 'n:' + key]]]))
  }
  const d = cur
  if (!d) return text.startsWith('/') ? say(chat, 'unknown command.\n' + HELP) : undefined
  if (d.step === 'image') return image(chat, m, d)
  if (!text) return
  if (d.step === 'name') { const n = text.slice(0, 32).trim(); if (n.length < 2) return say(chat, 'a name needs at least 2 characters'); d.name = n; d.step = 'symbol'; return ask(chat, d) }
  if (d.step === 'symbol') { const s = text.replace(/^\$/, '').toUpperCase(); if (!/^[A-Z0-9]{1,10}$/.test(s)) return say(chat, 'ticker: letters and numbers only, up to 10'); d.symbol = s; d.step = 'image'; return ask(chat, d) }
  if (d.step === 'socials') { if (/^skip$/i.test(text)) { d.step = 'pct'; return ask(chat, d) } socials(text, d); d.step = 'pct'; return ask(chat, d) }
  return say(chat, 'tap one of the buttons above, or /cancel')
}
/** tests */
export const _cur = () => cur
export const _reset = () => { cur = null; pending.clear() }
