// read-only: wait for the new commit, then the live pump chest — holdings, last moves, events since deploy
const S = 'https://unnamed-server.onrender.com'; const want = '43244723'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(30000) }); return await r.json().catch(() => null) } catch (e: any) { return { err: String(e?.message || e) } } }
const t0 = Date.now(); let h: any = null; while (Date.now() - t0 < 600_000) { h = await get('/health'); if (h?.commit === want) break; await new Promise((r) => setTimeout(r, 15000)) }
console.log('HEALTH after', Math.round((Date.now() - t0) / 1000), 's', h?.commit); await new Promise((r) => setTimeout(r, 90_000))
const v: any = await get('/vault/mint/fe3hPZHUdMkRdL54pwdUSkgBY4LkH5esocrbSjVBANK')
console.log('CHEST', v?.symbol, 'chest', v?.chest?.toFixed(4), 'tokens', Math.round(v?.tokens || 0), 'pct', ((v?.tokens || 0) / (v?.supply || 1e9) * 100).toFixed(2) + '%', 'price', v?.live?.price, 'vwap30', v?.live?.vwap30, 'stretch', v?.live?.stretch, 'sold', v?.score?.captured?.toFixed(3), 'sales', v?.score?.captures, 'devPaid', v?.devPaid?.toFixed(4))
for (const a of (v?.activity || []).slice(0, 12)) console.log('  ', new Date(a.t).toISOString().slice(11, 19), a.kind, a.sol != null ? (+a.sol).toFixed(4) : '', String(a.msg || '').slice(0, 140))
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 6 * 60_000)); for (const e of (ev?.events || []).filter((e: any) => !/capture/.test(e.msg)).slice(-12)) console.log('EV', new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 200))
console.log('WALLET', JSON.stringify(await get('/admin/wallet?key=' + encodeURIComponent(K))))
