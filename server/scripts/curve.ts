// read-only overnight check: health, vault wallet, chests, waitlist count (aggregate), events and errors of the last 10 h
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(30000) }); return await r.json().catch(() => null) } catch (e: any) { return { err: String(e?.message || e) } } }
const h: any = await get('/health'); console.log('HEALTH', JSON.stringify({ commit: h?.commit, ok: h?.ok, alerts: h?.alerts, standby: h?.standby, gate: h?.gate, stream: h?.stream, invites: h?.invites }))
console.log('WALLET', JSON.stringify(await get('/admin/wallet?key=' + encodeURIComponent(K))))
const vs: any = await get('/vaults'); console.log('VAULTS', Array.isArray(vs) ? vs.length + ' · ' + vs.map((v: any) => `${v.symbol} chest ${v.chest.toFixed(3)} tok ${Math.round(v.tokens)} paused ${v.paused}`).join(' | ') : JSON.stringify(vs))
const w: any = await get('/admin/waitlist?key=' + encodeURIComponent(K)); const rows: any[] = w?.rows || []; const since = Date.now() - 10 * 3.6e6
const recent = rows.filter((r) => r.t > since); console.log('WAITLIST', w?.count, '+', w?.offsite, '=', w?.total, '· last 10 h', recent.length, '· with lang', recent.filter((r) => r.lang).length, '· langs', JSON.stringify(recent.reduce((a: any, r: any) => { const k = r.lang || '-'; a[k] = (a[k] || 0) + 1; return a }, {})), '· from', JSON.stringify(recent.reduce((a: any, r: any) => { const k = r.from || '-'; a[k] = (a[k] || 0) + 1; return a }, {})))
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + since); const es: any[] = ev?.events || []
console.log('EVENTS 10h', es.length, 'errors', es.filter((e) => e.kind === 'error').length, 'kinds', JSON.stringify(ev?.stats?.kinds || {}))
const byMsg: Record<string, number> = {}; for (const e of es.filter((e) => e.kind === 'error')) { const k = String(e.msg).replace(/\d+(\.\d+)?/g, '#').slice(0, 110); byMsg[k] = (byMsg[k] || 0) + 1 }
for (const [k, n] of Object.entries(byMsg).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log('  ERR', n, '×', k)
for (const e of es.filter((e) => e.kind !== 'error').slice(-15)) console.log('  ', new Date(e.t).toISOString().slice(5, 16), e.kind, String(e.msg).slice(0, 160))
const rc: any = await get('/receipts'); console.log('RECEIPTS', rc?.launches, 'launches · sold', rc?.soldSol)
