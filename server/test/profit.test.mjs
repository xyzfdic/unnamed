import test from 'node:test'
import assert from 'node:assert/strict'
import * as MM from '../src/mm.ts'
import { readFileSync } from 'node:fs'

const PO = { ...MM.P, profitOnly: true, profitMinVolSol: 10, profitVolMult: 20, profitMargin: 0.04, warmupMs: 0 }
const mk = (o = {}) => ({ chest: 2, tokens: 0, supply: 1e9, pct: 5, avgCost: 0, mode: 'mm', ceiling: 0.3, samples: [], high15: [], ema5: null, ema15: null, spentEpisode: 0, tranchesFired: [], lastBuy: 0, trimmedToday: 0, trimDay: 0, buyTimes: [], lastCapture: 0, ...o })
// market with a given SOL volume in the last hour (SOL at $180)
const mkt = (p, volSol) => ({ priceSol: p, mcapUsd: p * 1e9 * 180, liqSol: 60, vol1h: volSol * 180 })

test('volume in SOL comes from the market USD figure at the market\'s own SOL price', () => {
  assert.ok(Math.abs(MM.volSol({ supply: 1e9 }, mkt(1e-7, 42)) - 42) < 1e-6)
  assert.equal(MM.volSol({ supply: 1e9 }, { ...mkt(1e-7, 42), volSol: 7 }), 7)
})
test('profit-only: no desk bid when the last hour traded under 10 SOL, and the bid is at most 1/20 of the hour', () => {
  const s = mk({ samples: [{ t: 0, p: 1e-7, v: 1 }] })
  assert.equal(MM.deskBid(s, 0.2, 1e6, PO, 0.5, 1e-7, 60, 5), 0, 'thin hour → no bid')
  const b = MM.deskBid(s, 0.2, 1e6, PO, 0.5, 1e-7, 60, 40); assert.ok(b > 0 && b <= 40 / 20 + 1e-9, `bid ${b}`)
  assert.ok(MM.deskBid(s, 0.2, 1e6, MM.P, 0.5, 1e-7, 60, 0) > 0, 'mode off: unchanged (volume not required)')
})
test('profit-only: dip buys and accumulation need the volume too', () => {
  const buyRoom = (vol) => MM.profitRoom(vol, PO)
  assert.equal(buyRoom(9.99), 0); assert.equal(buyRoom(100), 5); assert.equal(MM.profitRoom(0, MM.P), Infinity)
  const s = mk({ tokens: 0, pct: 5, samples: [{ t: 0, p: 1e-7, v: 1 }], samplesLong: [{ t: 0, p: 1e-7, v: 1 }] })
  assert.equal(MM.accumulate(s, mkt(1e-7, 3), 1e-7, 1e6, PO, 0.5), null, 'thin hour → no accumulation')
  const a = MM.accumulate(s, mkt(1e-7, 200), 1e-7, 1e6, PO, 0.5); assert.ok(a > 0, 'enough volume → allowed')
})
test('profit-only: nothing is ever sold under cost × 1.04', () => {
  assert.equal(MM.sellFloor(1e-7, PO), 1.04e-7); assert.equal(MM.sellFloor(1e-7, MM.P), 0); assert.equal(MM.sellFloor(0, PO), 0)
  // inventory bought at 1.0: a big buy at 1.02 is not trimmed, at 1.10 it may be
  const s = mk({ tokens: 5e7, avgCost: 1e-7, samples: Array.from({ length: 30 }, (_, i) => ({ t: i * 1000, p: 1e-7, v: 1 })) })
  for (let i = 0; i < 50; i++) { s.nextCaptureAt = 0; assert.equal(MM.capture(s, mkt(1.02e-7, 500), 1.02e-7, 5, 1e6 + i, PO, 0, 0.5), 0) }
  // leg tokens bought at 1.0 (cost 5 SOL for 5e7): never sold at 1.03 even if legTakeProfit were lower than the margin
  const l = mk({ tokens: 5e7, avgCost: 1e-7, mmTok: 5e7, mmCost: 5 })
  assert.equal(MM.capture(l, mkt(1.03e-7, 500), 1.03e-7, 5, 1e6, { ...PO, legTakeProfit: 0.01 }, 1, 0.5), 0)
  assert.ok(MM.capture(l, mkt(1.2e-7, 500), 1.2e-7, 5, 2e6, PO, 1, 0.5) > 0, 'well above cost → the leg exits')
})
test('initials: until the launch buy is back, each incoming buy gets a slice of the vault sold into it — a share of that buy, not the max', () => {
  const IN = { ...PO, initialsFrac: 0.5, initialsMinBuy: 0.05 }
  const s = mk({ tokens: 1.2e8, avgCost: 3.3e-8, launchSpend: 4, invGot: 0, samples: [{ t: 0, p: 4e-8, v: 1 }] })
  const t = MM.capture(s, mkt(4e-8, 50), 4e-8, 1.0, 1e6, IN, 0.99, 0.5)
  assert.ok(Math.abs(t * 4e-8 - 0.5) < 1e-6, `sold ${t * 4e-8} SOL into a 1 SOL buy`)
  assert.equal(MM.capture(s, mkt(3.3e-8, 50), 3.3e-8, 1.0, 1e6, IN, 0.99, 0.5), 0, 'never under cost +1%')
  assert.equal(MM.capture(s, mkt(4e-8, 50), 4e-8, 0.01, 1e6, IN, 0.99, 0.5), 0, 'dust buys are left alone')
  s.invGot = 3.9; const t2 = MM.capture(s, mkt(4e-8, 50), 4e-8, 2.0, 1e6, IN, 0.99, 0.5)
  assert.ok(t2 * 4e-8 <= 0.1 * 1.03 + 1e-9, 'never more than what is left to recover')
  s.invGot = 4; assert.equal(MM.initialsOn(s, IN), false, 'initials back → normal policy')
})
test('take: after the launch buy is back, every buy still gets a slice sold into it — only above cost +margin, capped per sale', () => {
  const TK = { ...PO, initialsFrac: 0.5, takeFrac: 0.4, takeMaxTokFrac: 0.08, initialsMinBuy: 0.05, profitMargin: 0.04 }
  const s = mk({ tokens: 1e9, avgCost: 3e-8, launchSpend: 3, invGot: 3.2 })
  assert.equal(MM.initialsOn(s, TK), false); assert.equal(MM.takeOn(s, TK), true)
  const t = MM.capture(s, mkt(4e-8, 50), 4e-8, 1.0, 1e6, TK, 0.99, 0.5)
  assert.ok(Math.abs(t * 4e-8 - 0.4) < 1e-6, `sold ${t * 4e-8} SOL into a 1 SOL buy`)
  assert.equal(MM.capture(s, mkt(3.1e-8, 50), 3.1e-8, 1.0, 1e6, TK, 0.99, 0.5), 0, 'under cost +4% → nothing')
  const big = MM.capture(s, mkt(4e-8, 500), 4e-8, 50, 1e6, TK, 0.99, 0.5); assert.ok(big <= 1e9 * 0.08 + 1, 'one sale ≤ 8% of what the vault holds')
  assert.equal(MM.takeOn(s, { ...TK, takeFrac: 0 }), false, 'off → normal policy')
})
test('dynamic share: grows with the buy, ~10% small → 30% at 2 SOL+, never above 30%; drives initials and take', () => {
  const D = { ...PO, dynMin: 0.10, dynMax: 0.30, dynRefSol: 2, initialsFrac: 0.5, takeFrac: 0.4, initialsMinBuy: 0.05, profitMargin: 0.04, takeMaxTokFrac: 1 }
  const sh = (x) => MM.sellShare(x, false, D)
  assert.ok(sh(0.05) >= 0.10 && sh(0.05) < 0.15, `0.05 → ${sh(0.05)}`)
  assert.ok(sh(0.1) > 0.13 && sh(0.1) < 0.17, `0.1 → ${sh(0.1)}`)
  assert.ok(sh(0.5) > 0.20 && sh(0.5) < 0.25, `0.5 → ${sh(0.5)}`)
  assert.equal(sh(2), 0.3); assert.equal(sh(50), 0.3)
  for (let x = 0.01; x < 10; x *= 1.7) assert.ok(sh(x) <= 0.3 && sh(x * 1.7) >= sh(x), 'monotone, capped')
  assert.equal(MM.sellShare(1, true, { ...D, dynMax: 0 }), 0.5, 'off → fixed initials share')
  const s = mk({ tokens: 1e9, avgCost: 3e-8, launchSpend: 4, invGot: 0 })
  const t = MM.capture(s, mkt(4e-8, 50), 4e-8, 2, 1e6, D, 0.99, 0.5); assert.ok(Math.abs(t * 4e-8 - 0.6) < 1e-6, `initials sells 30% of a 2 SOL buy: ${t * 4e-8}`)
  s.invGot = 5; const t2 = MM.capture(s, mkt(4e-8, 50), 4e-8, 0.1, 1e6, D, 0.99, 0.5); assert.ok(Math.abs(t2 * 4e-8 - 0.1 * sh(0.1)) < 1e-6, 'take uses the same curve')
})
test('a chest that bought at launch does not buy its bag back toward the target (live Oct 30: accumulation into dumps); tax-funded chests still do', () => {
  const base = { tokens: 0, pct: 5, samples: [{ t: 0, p: 1e-7, v: 1 }], samplesLong: [{ t: 0, p: 1e-7, v: 1 }] }
  assert.ok(MM.accumulate(mk(base), mkt(1e-7, 200), 1e-7, 1e6, PO, 0.5) > 0, 'tax-funded: allowed')
  assert.equal(MM.accumulate(mk({ ...base, launchSpend: 5.1 }), mkt(1e-7, 200), 1e-7, 1e6, PO, 0.5), null, 'bought at launch: no rebuild')
  assert.ok(MM.accumulate(mk({ ...base, launchSpend: 5.1 }), mkt(1e-7, 200), 1e-7, 1e6, { ...PO, accumAfterLaunch: true }, 0.5) > 0, 'switch on: allowed')
})

// ---- inventory band: a launch-bought chest that sold most of its coins buys some back on pullbacks, and sells smaller slices ----
test('buy-back: only under target, only ≥10% under what it sold at, never above VWAP, never in a crash, capped by size, chest and the hour\'s sales', async () => {
  const MM = await import('../src/mm.ts'); const now = Date.now(); const P = { ...MM.P, invTargetPct: 8, rebuyDiscount: 0.10, rebuyMaxSol: 0.5, rebuyBudgetFrac: 0.35, maxLegSol: 0 }
  const base = () => ({ mode: 'mm', launchSpend: 7.2, supply: 1e9, tokens: 48e6, chest: 10.7, avgCost: 1e-8, pct: 20, samples: [{ t: now - 60_000, p: 1.2e-7, v: 1 }, { t: now - 30_000, p: 1.0e-7, v: 1 }], sales: [{ t: now - 10 * 60_000, sol: 10, tok: 80e6 }], mmCost: 0, cooldownUntil: 0 })
  const m = { priceSol: 1e-7, liqSol: 60, mcapUsd: 1e5 }
  const sold = 10 / 80e6   // 1.25e-7 per coin
  assert.equal(MM.rebuy(base(), m, sold * 0.95, now, -0.05, P), null, 'only 5% under the sale price: no')
  const s = base(); const sp = MM.rebuy(s, m, sold * 0.85, now, -0.08, P); assert.ok(sp > 0 && sp <= 0.5 && sp <= s.chest * 0.05 + 1e-9, 'a capped buy 15% under: ' + sp)
  assert.equal(MM.rebuy({ ...base(), tokens: 90e6 }, m, sold * 0.85, now, -0.08, P), null, 'at 9% of supply (over the 8% target): no')
  assert.equal(MM.rebuy(base(), m, sold * 0.85, now, -0.25, P), null, 'a crash (−25%) is left to the dip tranches')
  assert.equal(MM.rebuy({ ...base(), samples: [{ t: now - 30_000, p: 0.9e-7, v: 1 }] }, m, sold * 0.85, now, -0.08, P), null, 'above the recent average: no')
  assert.equal(MM.rebuy({ ...base(), launchSpend: 0 }, m, sold * 0.85, now, -0.08, P), null, 'a fee-funded chest accumulates its own way')
  assert.equal(MM.rebuy({ ...base(), sales: [] , activity: [] }, m, sold * 0.85, now, -0.08, P), null, 'no sales this hour: no buy-back')
  const hr = { ...base(), rebuys: [{ t: now - 5 * 60_000, sol: 3.48 }] }; assert.equal(MM.rebuy(hr, m, sold * 0.85, now, -0.08, P), null, 'the hour\'s budget (35% of 10 SOL sold) is used up')
  const t = base(); MM.onRebuy(t, 0.5, 4e6, now); assert.equal(MM.rebuy(t, m, sold * 0.85, now + 10_000, -0.08, P), null, 'every ≥45 s'); assert.ok(t.mmTok === 4e6 && t.mmCost === 0.5, 'booked as the mm leg (sold again only at a profit)')
  const seeded = { ...base(), sales: undefined, activity: [{ t: now - 60_000, kind: 'capture', sol: 2, tokens: 16e6 }, { t: now - 2 * 3.6e6, kind: 'capture', sol: 5, tokens: 1e6 }] }
  assert.ok(Math.abs(MM.salesHour(seeded, now).sol - 2) < 1e-9, 'sales from before the restart are read from the activity (last hour only)')
})
test('inventory skew: under target the slice sold into a buy shrinks with the holding (never under a quarter); at or over target unchanged', async () => {
  const MM = await import('../src/mm.ts'); const P = { ...MM.P, invTargetPct: 8 }
  assert.equal(MM.invSkew({ launchSpend: 7, supply: 1e9, tokens: 100e6 }, P), 1)
  assert.ok(Math.abs(MM.invSkew({ launchSpend: 7, supply: 1e9, tokens: 40e6 }, P) - 0.5) < 1e-9)
  assert.equal(MM.invSkew({ launchSpend: 7, supply: 1e9, tokens: 5e6 }, P), 0.25)
  assert.equal(MM.invSkew({ launchSpend: 0, supply: 1e9, tokens: 5e6 }, P), 1, 'fee-funded chests untouched')
})

test('shipped params keep ammo for the run: on a steady pump the chest still holds ≥45% of its launch coins at 4× and takes most of its SOL above 2×', () => {
  // the Dockerfile's MM_* values, so this follows what is live
  const env = Object.fromEntries([...readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8').matchAll(/\b(MM_[A-Z_]+)=([0-9.]+)/g)].map((m) => [m[1], +m[2]]))
  const P = { ...MM.P, profitOnly: true, captureOn: true, warmupMs: 0, profitMinVolSol: 0, initialsFrac: env.MM_INITIALS_FRAC, takeFrac: env.MM_TAKE_FRAC, dynMin: env.MM_DYN_MIN, dynMax: env.MM_DYN_MAX,
    dynRefSol: env.MM_DYN_REF_SOL, sniperFrac: env.MM_SNIPER_FRAC, sniperWindowMs: env.MM_SNIPER_WINDOW_MS, sniperKeep: env.MM_SNIPER_KEEP, sniperMinBuy: env.MM_SNIPER_MIN_BUY, captureDayCap: env.MM_CAPTURE_DAY_CAP }
  assert.ok(P.dynMax <= 0.2 && P.sniperFrac <= 0.4, 'slices stay small')
  let x = 30, y = 1073e6; const fee = 0.0125
  const buy = (sol) => { const k = x * y; const nx = x + sol * (1 - fee); const ny = k / nx; const t = y - ny; x = nx; y = ny; return t }
  const sell = (tok) => { const k = x * y; const ny = y + tok; const nx = k / ny; const out = x - nx; x = nx; y = ny; return out * (1 - fee) }
  buy(0.5); const vTok = buy(7); const cost0 = 7 / vTok, t0 = 1e9
  const s = mk({ chest: 0.9, tokens: vTok, pct: 20, avgCost: cost0, launchSpend: 7, invGot: 0, mmSpent: 0, mmGot: 0, mmTok: 0, mmCost: 0, sales: [], launchAt: t0, launchTok: vTok, sniperTax: true })
  let lo = 0, hi = 0, heldAt4 = null; const sizes = [0.3, 1.2, 0.5, 0.8, 2, 0.4, 0.6, 1.5]
  for (let i = 0; i < 4000 && x / y / cost0 < 8; i++) {
    const t = t0 + 3000 + i * 4000, sol = sizes[i % sizes.length]; MM.observe(s, x / y, t, P); buy(sol); const p = x / y
    const tok = MM.capture(s, { priceSol: p, mcapUsd: p * 1e9 * 180, liqSol: x, vol1h: 1e6 }, p, sol, t, P, 0.99, 0.5)
    if (tok > 0) { const g = sell(tok); s.tokens -= tok; MM.bookSell(s, tok, g, t); s.chest += g; if (p / cost0 < 2) lo += g; else hi += g }
    if (heldAt4 == null && x / y / cost0 >= 4) heldAt4 = s.tokens / vTok
  }
  assert.ok(heldAt4 >= 0.45, `holds ${(heldAt4 * 100).toFixed(0)}% of its coins at 4×`)
  assert.ok(hi > 2 * lo, `SOL taken above 2× (${hi.toFixed(2)}) is over twice what it took under 2× (${lo.toFixed(2)})`)
  assert.ok(lo > 0.5, 'still takes profit early')
})
