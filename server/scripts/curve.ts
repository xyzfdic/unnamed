// read-only: the launch just made — events (25 min), newest vaults with activity, wallet
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(30000) }); return await r.json().catch(() => null) } catch (e: any) { return { err: String(e?.message || e) } } }
const h: any = await get('/health'); console.log('COMMIT', h?.commit)
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 25 * 60_000)); for (const e of (ev?.events || [])) console.log('EV', new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 240), e.data ? JSON.stringify(e.data).slice(0, 160) : '')
const vs: any = await get('/vaults'); for (const v of (Array.isArray(vs) ? vs : []).sort((a: any, b: any) => (b.report?.armedAt || 0) - (a.report?.armedAt || 0)).slice(0, 3)) {
  console.log('VAULT', v.symbol, v.venue, 'mint', v.mint, 'stake', v.stakeSol, 'pct', v.pct, 'vaultBuySol', v.vaultBuySol, 'chest', v.chest, 'tokens', Math.round(v.tokens), 'armedAt', v.report?.armedAt ? new Date(v.report.armedAt).toISOString() : '-', 'dev', String(v.dev).slice(0, 6))
  for (const a of (v.activity || []).slice(0, 10)) console.log('   ', new Date(a.t).toISOString().slice(11, 19), a.kind, a.sol ?? '', String(a.msg || '').slice(0, 200))
}
for (const w of ['7BAdBZxhisBAJH8PGMADKp8thz8yqk2AmaoHZq92mmvb', '5MHbsDZaNTzNLhcn7JNNgQ2zTm2ooyr4xHXEV1uwxrqt', 'HuZGx4k41dCPuXR4PnBNdHNXJ4WzbUnDxo9wvU3VpXAY']) { const d: any = await get('/dev/' + w); const fresh = (Array.isArray(d) ? d : []).filter((v: any) => Date.now() - v.createdAt < 2 * 3600e3); if (fresh.length) console.log('DEV', w.slice(0, 6), fresh.map((v: any) => `${v.id.slice(0, 6)} ${v.venue} stake ${v.stakeSol} vaultBuy ${v.vaultBuySol} pct ${v.pct} armed ${v.armed} chest ${v.chest} tok ${Math.round(v.tokens)} mint ${String(v.mint || '').slice(0, 6)} · ${String(v.activity?.[0]?.msg || '').slice(0, 120)}`).join(' || ')) }
console.log('WALLET', JSON.stringify(await get('/admin/wallet?key=' + encodeURIComponent(K))))
