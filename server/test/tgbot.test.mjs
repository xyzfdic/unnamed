// Launch from Telegram: the bot walks a launch (name → ticker → image → venue → socials → chest buy → chest SOL → own buy), saves a draft
// and answers with a button that opens the app in Phantom — it never signs anything. Only the paired chat is served. Plus /pause with a
// confirm button, /report, /receipts. Telegram's API and the vault are faked.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'tgbot-')); process.env.TELEGRAM_BOT_TOKEN = '1:test'; process.env.TELEGRAM_CHAT_ID = '111'; process.env.TELEGRAM_BATCH_MS = '5'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
const calls = []
globalThis.fetch = async (url, opt) => {
  const u = String(url); if (u.includes('/file/bot')) return { ok: true, status: 200, arrayBuffer: async () => PNG }
  const m = u.split('/').pop(); const body = opt?.body ? JSON.parse(opt.body) : {}; calls.push({ m, body })
  return { ok: true, status: 200, json: async () => ({ ok: true, result: m === 'getFile' ? { file_path: 'photos/file_7.png' } : {} }) }
}
const AL = await import('../src/alert.ts'); const TG = await import('../src/tgbot.ts')
const paused = []; const vault = { id: 'v1', symbol: 'BANKER', venue: 'pump', mint: 'Mint1111111111111111111111111111111111111111', chest: 0.5, tokens: 1e6, live: { price: 1e-7 }, report: { staked: 1, launchBuySol: 0.5, soldSol: 2.5, sales: 9, taxSol: 0, fitted: false, armedAt: 1 }, sniper: { buys: 7, buySol: 6.5, wallets: 7, soldInto: 0.66 } }
TG.init({ list: () => [vault], receipts: () => ({ launches: 1, sniperSol: 6.5, soldSol: 2.5, sales: 9, feesSol: 0, rows: [{ symbol: 'BANKER', venue: 'pump', soldSol: 2.5, sniper: { buySol: 6.5 } }] }), withdrawPreview: async () => ({ ok: false, why: 'this chest has traded, so it stays with the coin' }), pause: (id, ms) => paused.push([id, ms]), solForPct: (pct) => pct * 0.33 })
const msg = (text, chat = 111) => AL.handle({ message: { chat: { id: chat }, text } })
const tap = (data, chat = 111) => AL.handle({ callback_query: { id: 'q' + Math.random(), data, message: { chat: { id: chat } } } })
const last = (chat = 111) => calls.filter((c) => c.m === 'sendMessage' && c.body.chat_id === chat).at(-1)?.body

test('a full launch in chat ends in a Phantom link to a draft the app can read — the bot signs nothing', async () => {
  await msg('/launch'); assert.match(last().text, /name/)
  await msg('Glass Frog'); assert.match(last().text, /ticker/)
  await msg('glass!'); assert.match(last().text, /letters and numbers/, 'bad ticker refused')
  await msg('$glass'); assert.match(last().text, /image/)
  await msg('not a picture'); assert.match(last().text, /isn't an image/)
  await AL.handle({ message: { chat: { id: 111 }, photo: [{ file_id: 'small', file_size: 900 }, { file_id: 'big', file_size: 40000 }] } })
  assert.equal(calls.find((c) => c.m === 'getFile').body.file_id, 'big', 'the largest size under 5 MB'); assert.match(last().text, /where does it launch/)
  await tap('v:pump'); assert.match(last().text, /X handle/)
  await msg('@glassfrog glassfrog.xyz t.me/glassfrog'); assert.match(last().text, /supply/)
  assert.equal(JSON.stringify(last().reply_markup).includes('fees fill it'), false, 'no "fees fill it" on pump.fun (no trading fee there)')
  await tap('p:20'); await tap('c:0.5'); await tap('d:0.5')
  const r = last(); assert.match(r.text, /Glass Frog \(\$GLASS\)/); assert.match(r.text, /total ≈/)
  const btn = r.reply_markup.inline_keyboard.flat(); const ph = btn.find((b) => b.url?.startsWith('https://phantom.app/ul/browse/'))
  assert.ok(ph, 'a Phantom button'); const app = decodeURIComponent(ph.url.split('/browse/')[1].split('?')[0]); const id = app.split('#/launch/')[1]
  assert.match(app, /^https:\/\/app\.banker\.cash\/#\/launch\/[a-f0-9]{32}$/)
  const d = TG.getDraft(id); assert.ok(d); assert.equal(d.name, 'Glass Frog'); assert.equal(d.symbol, 'GLASS'); assert.equal(d.venue, 'pump'); assert.equal(d.pct, 20); assert.equal(d.chest, 0.5); assert.equal(d.dev, 0.5); assert.equal(d.buyNow, true)
  assert.equal(d.twitter, 'https://x.com/glassfrog'); assert.equal(d.website, 'https://glassfrog.xyz'); assert.equal(d.telegram, 'https://t.me/glassfrog')
  assert.equal(Buffer.from(d.image.b64, 'base64').equals(PNG), true); assert.equal(d.image.mime, 'image/png')
  assert.equal(TG.getDraft('../etc'), null); assert.equal(TG.getDraft('f'.repeat(32)), null)
  assert.equal(calls.some((c) => /sendTransaction|sign/i.test(c.m)), false)
})

test('launchpad: "fees fill it" means no buy at launch; a half-done draft is not readable by the app', async () => {
  await msg('/launch'); const id = TG._cur().id; assert.equal(TG.getDraft(id), null, 'not ready yet')
  await msg('Bank'); await msg('BANK'); await AL.handle({ message: { chat: { id: 111 }, document: { file_id: 'doc', file_size: 1000, mime_type: 'image/webp' } } })
  await tap('v:launchlab'); await tap('s:skip'); assert.ok(JSON.stringify(last().reply_markup).includes('fees fill it'))
  await tap('p:fees'); await tap('c:1'); await tap('d:0')
  const d = TG.getDraft(id); assert.equal(d.buyNow, false); assert.equal(d.venue, 'launchlab'); assert.equal(d.image.mime, 'image/webp'); assert.match(last().text, /none at launch/)
})

test('only the paired chat: a stranger gets nothing from /launch, /pause or a button', async () => {
  const n = calls.length; await msg('/launch', 999); await msg('/pause BANKER', 999); await tap('v:pump', 999)
  assert.equal(calls.slice(n).filter((c) => c.m === 'sendMessage').length, 0); assert.equal(paused.length, 0)
})

test('/pause asks first and pauses only on the button; /resume; /report and /receipts answer from the vault', async () => {
  await msg('/pause banker 30'); const kbd = last().reply_markup.inline_keyboard.flat(); assert.match(last().text, /pause <b>BANKER<\/b> for 30 min/)
  assert.equal(paused.length, 0, 'nothing until confirmed'); await tap(kbd.find((b) => b.text === 'pause').callback_data); assert.deepEqual(paused[0], ['v1', 30 * 60_000])
  await tap(kbd.find((b) => b.text === 'pause').callback_data); assert.equal(paused.length, 1, 'a button works once')
  await msg('/resume BANKER'); await tap(last().reply_markup.inline_keyboard.flat().find((b) => b.text === 'resume').callback_data); assert.deepEqual(paused[1], ['v1', 0])
  await msg('/pause NOPE'); assert.match(last().text, /no live chest/)
  await msg('/report BANKER'); assert.match(last().text, /sold into buys 2\.5 SOL in 9 sales/); assert.match(last().text, /snipers: 7 buys/)
  await msg('/receipts'); assert.match(last().text, /1 launches/)
  await msg('/withdraw BANKER'); assert.match(last().text, /can't withdraw/)
})
