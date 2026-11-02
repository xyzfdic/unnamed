// read-only: every chest the live server runs (newest first) with its numbers, the coin's price now, its sniper report; the shared wallet
// audit; and the last events about launches / foreign trades / book fits
const S = 'https://unnamed-server.onrender.com'; const AK = process.env.ADMIN_KEY || ''
const j = (p: string) => fetch(S + p, { signal: AbortSignal.timeout(20000) }).then((r) => r.json()).catch((e) => ({ err: String(e) }))
const h: any = await j('/health'); console.log('HEALTH', h.commit, h.ok)
const vs: any = await j('/vaults'); const list = (Array.isArray(vs) ? vs : []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
for (const v of list) {
  const m: any = v.mint ? await j('/market/' + v.mint) : {}
  const px = m?.priceSol || 0; const worth = (v.chest || 0) + (v.tokens || 0) * px
  const acts = v.activity || []; const kinds: Record<string, number> = {}; for (const a of acts) kinds[a.kind] = (kinds[a.kind] || 0) + (a.sol || 0)
  console.log('VAULT', JSON.stringify({ id: v.id, symbol: v.symbol, name: v.name, venue: v.venue, mint: v.mint, dev: v.dev, created: new Date(v.createdAt || 0).toISOString(), armed: v.armed, fitted: v.fitted,
    stake: v.stakeSol, launchBuy: v.vaultBuySol, chest: +(+v.chest).toFixed(4), tokens: Math.round(v.tokens || 0), priceSol: px, mcapSol: px ? +(px * 1e9).toFixed(1) : null, bondedOrLiq: m?.liqSol ?? null,
    worthSol: +worth.toFixed(4), resultSol: +(worth - (v.stakeSol || 0)).toFixed(4), taxClaimed: v.taxClaimed, score: v.score, mm: v.mm, devPaid: v.devPaid,
    sniper: v.sniper ? { buys: v.sniper.buys, sol: v.sniper.sol, wallets: v.sniper.wallets, launchBlockSol: v.sniper.launchBlockSol, chestSold: v.sniper.chestSold } : null,
    activityKinds: kinds, firstActivity: acts.length ? new Date(acts[acts.length - 1].t).toISOString() : null, notes: acts.filter((a: any) => a.kind === 'note' && /paused|fitted|stop|failed/.test(a.msg || '')).slice(0, 4).map((a: any) => String(a.msg).slice(0, 140)) }))
}
const w: any = await j('/admin/wallet?key=' + AK); console.log('AUDIT', JSON.stringify(w).slice(0, 500))
const e: any = await j('/admin/events?key=' + AK + '&since=' + (Date.now() - 4 * 86400_000))
for (const x of e.events || []) if (/armed|sniper report|did not sign|fitted|launch|refus|stake booked|switched off|reconciled/i.test(x.msg || '') && !/ capture /.test(x.msg || '')) console.log('EV', new Date(x.t).toISOString().slice(5, 19), x.kind, String(x.msg || '').slice(0, 220))
console.log('EVSTATS', JSON.stringify(e.stats || {}).slice(0, 300), 'n', (e.events || []).length, 'oldest', e.events?.[0] ? new Date(e.events[0].t).toISOString() : null)
process.exit(0)
