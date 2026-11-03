// Telegram alerts: pairing (first /start wins, everyone else is refused), /status only for the paired chat, errors deduped, only the
// vault events worth a ping get through, batching, HTML escaping, and nothing at all without a token. fetch is faked — no network.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'alert-')); process.env.TELEGRAM_BOT_TOKEN = '1:test'; process.env.TELEGRAM_BATCH_MS = '5'
const calls = []
globalThis.fetch = async (url, opt) => { const m = String(url).split('/').pop(); const body = JSON.parse(opt.body); calls.push({ url: String(url), m, body }); return { ok: true, status: 200, json: async () => ({ ok: true, result: m === 'getUpdates' ? [] : {} }) } }
const AL = await import('../src/alert.ts')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sent = (chat) => calls.filter((c) => c.m === 'sendMessage' && (chat == null || c.body.chat_id === chat))

test('alerts wait until paired; the first /start pairs and gets them; any other chat is refused', async () => {
  AL.send('launch one'); await sleep(30); assert.equal(sent().length, 0, 'not paired: nothing sent'); assert.equal(AL._queue().length, 1)
  await AL.handle({ update_id: 1, message: { chat: { id: 111 }, text: '/start' } }); await sleep(30)
  assert.match(sent(111)[0].body.text, /paired/); assert.ok(sent(111).some((c) => c.body.text.includes('launch one')), 'the queued alert went out')
  assert.ok(calls.every((c) => c.url.startsWith('https://api.telegram.org/bot1:test/')), 'only the Telegram API')
  await AL.handle({ update_id: 2, message: { chat: { id: 222 }, text: '/start' } }); assert.match(sent(222)[0].body.text, /private/)
  AL.setStatus(async () => 'wallet 10.55 SOL')
  await AL.handle({ update_id: 3, message: { chat: { id: 222 }, text: '/status' } }); assert.equal(sent(222).length, 1, 'a stranger gets no status')
  await AL.handle({ update_id: 4, message: { chat: { id: 111 }, text: '/status@bankerdotcashbot' } }); assert.equal(sent(111).at(-1).body.text, 'wallet 10.55 SOL')
  assert.equal(String(AL.chat()), '111')
})

test('errors are deduped by shape (numbers and addresses ignored); only the vault events worth a ping pass; one batched message', async () => {
  calls.length = 0
  AL.route({ t: 1, kind: 'error', msg: 'BANK vault trade failed: custom 0x1 (4kPz9aB1…)' })
  AL.route({ t: 2, kind: 'error', msg: 'BANK vault trade failed: custom 0x1 (9aBcQ7Lm…)' })
  AL.route({ t: 3, kind: 'error', msg: 'chests fitted to the wallet: 1.2 SOL booked → 0.9 held' })
  AL.route({ t: 4, kind: 'vault', msg: 'BANK sniper report: 49 buys · 37.20 SOL from 37 wallets in the first minute · chest sold 6.400 SOL into them' })
  AL.route({ t: 5, kind: 'vault', msg: 'BANK fast sell not sent (not a fast-path coin) — falling back' })
  AL.route({ t: 6, kind: 'vault', msg: 'pump launch build took 4.2 s' })
  await sleep(40)
  const s = sent(); assert.equal(s.length, 1, 'batched into one message'); const text = s[0].body.text
  assert.equal(text.split('vault trade failed').length - 1, 1, 'the same failure twice is one line'); assert.match(text, /fitted/); assert.match(text, /sniper report/)
  assert.doesNotMatch(text, /fast sell not sent|build took/); assert.equal(s[0].body.parse_mode, 'HTML')
})

test('interpolated text is escaped; links point at the coin', () => {
  assert.equal(AL.esc('<b>&'), '&lt;b&gt;&amp;')
  const l = AL.links('Mint111', 'pump'); assert.match(l, /dexscreener\.com\/solana\/Mint111/); assert.match(l, /pump\.fun\/coin\/Mint111/)
  assert.doesNotMatch(AL.links('Mint111', 'launchlab'), /pump\.fun/)
})

test('without a token nothing is queued or sent', async () => {
  const tok = process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_BOT_TOKEN; calls.length = 0
  try { assert.equal(AL.enabled(), false); AL.send('x'); AL.route({ t: 1, kind: 'error', msg: 'boom' }); await sleep(20); assert.equal(calls.length, 0) }
  finally { process.env.TELEGRAM_BOT_TOKEN = tok }
})

test('the evening summary goes out once a day, after the hour, in Houston time', async () => {
  AL.setDaily(async () => 'BANKER · last 24 h')
  const at = (iso) => Date.parse(iso)
  assert.equal(await AL.dailyTick(at('2026-11-03T02:00:00Z')), false, '8 pm in Houston: not yet')
  assert.equal(await AL.dailyTick(at('2026-11-03T03:05:00Z')), true, '9:05 pm: sent')
  assert.equal(await AL.dailyTick(at('2026-11-03T04:30:00Z')), false, 'once per day')
  assert.equal(await AL.dailyTick(at('2026-11-04T03:01:00Z')), true, 'next evening')
  await sleep(30); assert.equal(sent(111).map((c) => c.body.text).join('\n').split('last 24 h').length - 1, 2, 'two summaries went out (batched together here)')
})
