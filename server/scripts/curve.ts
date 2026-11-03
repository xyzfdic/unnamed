const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const want = 'a6d7c1bc'; let h: any = null
for (let i = 0; i < 26; i++) { h = await (await fetch(S + '/health', { signal: AbortSignal.timeout(20000) })).json().catch(() => null); if (String(h?.commit || '').startsWith(want)) break; await new Promise((r) => setTimeout(r, 25000)) }
console.log('COMMIT', h?.commit, 'standby', h?.standby, 'alerts', JSON.stringify(h?.alerts), 'mints', JSON.stringify(h?.mints))
const ev: any = await (await fetch(S + '/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 7 * 3600_000), { signal: AbortSignal.timeout(20000) })).json().catch(() => null)
const all = (ev?.events || []).filter((e: any) => !/ capture \d/.test(e.msg))
console.log('events 7h', all.length, 'errors', all.filter((e: any) => e.kind === 'error').length, '429', all.filter((e: any) => /429|rate.?limit|too many/i.test(e.msg)).length)
for (const e of all.filter((e: any) => e.kind === 'error' || /launch|bundle|landed|armed|429/i.test(e.msg)).slice(-40)) console.log(new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 240))
