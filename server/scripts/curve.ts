// read-only: wait for the live server to run the new commit, then check health, the Telegram draft route, receipts and the wallet audit
const S = 'https://unnamed-server.onrender.com'; const want = '7444124e'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(20000) }); return { status: r.status, j: await r.json().catch(() => null) } } catch (e: any) { return { status: 0, j: { err: String(e?.message || e) } } } }
const t0 = Date.now(); let h: any = null
while (Date.now() - t0 < 660_000) { h = (await get('/health')).j; if (h?.commit === want) break; await new Promise((r) => setTimeout(r, 15000)) }
console.log('HEALTH after', Math.round((Date.now() - t0) / 1000), 's', JSON.stringify({ commit: h?.commit, ok: h?.ok, alerts: h?.alerts, standby: h?.standby, stream: h?.stream?.connected }))
const d = await get('/tg/draft/' + 'f'.repeat(32)); console.log('TG DRAFT (unknown id)', d.status, JSON.stringify(d.j))
const rc = (await get('/receipts')).j; console.log('RECEIPTS', rc?.launches, rc?.soldSol)
const w = (await get('/admin/wallet?key=' + encodeURIComponent(K))).j; console.log('WALLET', JSON.stringify(w))
const vs = (await get('/vaults')).j; console.log('VAULTS', Array.isArray(vs) ? vs.map((v: any) => v.symbol + ' paused ' + v.paused + ' ' + (v.pauseWhy || '')).join(' | ') : JSON.stringify(vs))
