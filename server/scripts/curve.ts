// read-only: wait for the live server to run the new commit, then print health, the live chests, one withdraw preview and the vault wallet audit
const S = 'https://unnamed-server.onrender.com'; const want = 'b9267334'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { return await (await fetch(S + p, { signal: AbortSignal.timeout(20000) })).json() } catch (e: any) { return { err: String(e?.message || e) } } }
const t0 = Date.now(); let h: any = null
while (Date.now() - t0 < 660_000) { h = await get('/health'); if (h?.commit === want) break; await new Promise((r) => setTimeout(r, 15000)) }
console.log('HEALTH after', Math.round((Date.now() - t0) / 1000), 's', JSON.stringify({ commit: h?.commit, ok: h?.ok, vaultWallet: h?.vaultWallet, alerts: h?.alerts, stream: h?.stream }))
const vs: any[] = await get('/vaults'); console.log('VAULTS', Array.isArray(vs) ? vs.length : JSON.stringify(vs))
if (Array.isArray(vs)) { for (const v of vs) console.log(' ', v.symbol, v.venue, 'chest', v.chest, 'tokens', Math.round(v.tokens), 'paused', v.paused, 'fitted', v.fitted, 'report', JSON.stringify(v.report)); if (vs[0]) console.log('PREVIEW', vs[0].symbol, JSON.stringify(await get('/vault/withdraw-preview?id=' + encodeURIComponent(vs[0].id)))) }
const rc: any = await get('/receipts'); console.log('RECEIPTS', rc?.launches, 'launches · snipers', rc?.sniperSol, '· sold', rc?.soldSol, 'in', rc?.sales, 'sales · fees', rc?.feesSol, '· rows', (rc?.rows || []).map((r: any) => `${r.symbol}/${r.venue} sold ${r.soldSol} sniper ${r.sniper?.buySol ?? '-'}`).join(' | '))
console.log('WALLET', JSON.stringify(await get('/admin/wallet?key=' + encodeURIComponent(K))))
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 2 * 3600e3))
const es: any[] = ev?.events || []; console.log('EVENTS 2h', es.length, 'errors', es.filter((e) => e.kind === 'error').length)
for (const e of es.slice(-25)) console.log(' ', new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 200))
