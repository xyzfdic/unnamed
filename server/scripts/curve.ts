// read-only: what the live server saw of the launch in progress — events of the last 25 min, vaults created/unarmed, wallet
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(30000) }); return await r.json().catch(() => null) } catch (e: any) { return { err: String(e?.message || e) } } }
const since = Date.now() - 25 * 60_000
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + since); const es: any[] = ev?.events || []
console.log('EVENTS 25m', es.length)
for (const e of es) console.log(' ', new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 260), e.data ? JSON.stringify(e.data).slice(0, 200) : '')
const h: any = await get('/health'); console.log('HEALTH', JSON.stringify({ commit: h?.commit, jito: h?.jito, sender: h?.sender, rpc: h?.rpc, stream: h?.stream?.connected, mints: h?.mints, launch: h?.launch }).slice(0, 600))
console.log('WALLET', JSON.stringify(await get('/admin/wallet?key=' + encodeURIComponent(K))))
