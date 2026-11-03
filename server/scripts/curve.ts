const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const want = '7b657216'; let h: any = null
for (let i = 0; i < 28; i++) { h = await (await fetch(S + '/health', { signal: AbortSignal.timeout(20000) })).json().catch(() => null); if (String(h?.commit || '').startsWith(want)) break; await new Promise((r) => setTimeout(r, 25000)) }
console.log('COMMIT', h?.commit, 'vaults', h?.vaults, 'alerts', h?.alerts, 'curve', JSON.stringify(h?.curve))
await new Promise((r) => setTimeout(r, 15000))   // the platform warm-up runs 8 s after boot
const pl: any = await (await fetch(S + '/ll/platform', { signal: AbortSignal.timeout(20000) })).json().catch((e) => ({ err: String(e) }))
console.log('PLATFORM ready', pl?.ready, 'chain', JSON.stringify(pl?.chain), 'setup', pl?.setup, 'walletSol', pl?.walletSol)
const ev: any = await (await fetch(S + '/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 20 * 60_000), { signal: AbortSignal.timeout(20000) })).json().catch(() => null)
const all = (ev?.events || []).filter((e: any) => !/ capture \d/.test(e.msg))
console.log('events 20m', all.length, 'errors', all.filter((e: any) => e.kind === 'error').length, '429', all.filter((e: any) => /429|too many/i.test(e.msg)).length)
for (const e of all.filter((e: any) => e.kind === 'error').slice(-15)) console.log(new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 220))
