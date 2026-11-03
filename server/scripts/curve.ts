const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const ev: any = await (await fetch(S + '/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 20 * 60_000), { signal: AbortSignal.timeout(20000) })).json().catch(() => null)
for (const e of (ev?.events || []).filter((e: any) => !/ capture \d/.test(e.msg))) console.log(new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 300), e.data ? JSON.stringify(e.data).slice(0, 200) : '')
const h: any = await (await fetch(S + '/health')).json().catch(() => null); console.log('COMMIT', h?.commit, 'mints', JSON.stringify(h?.mints))
