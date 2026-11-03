// read-only: wait for f39dc72a, then the withdraw preview for the live pump chest
const S = 'https://unnamed-server.onrender.com'
const get = async (p: string) => { try { return await (await fetch(S + p, { signal: AbortSignal.timeout(20000) })).json() } catch (e: any) { return { err: String(e?.message || e) } } }
const t0 = Date.now(); let h: any = null; while (Date.now() - t0 < 600_000) { h = await get('/health'); if (h?.commit === 'f39dc72a') break; await new Promise((r) => setTimeout(r, 10000)) }
console.log('HEALTH after', Math.round((Date.now() - t0) / 1000), 's', h?.commit)
const v: any = await get('/vault/mint/fe3hPZHUdMkRdL54pwdUSkgBY4LkH5esocrbSjVBANK'); console.log('STATE', JSON.stringify({ id: v?.id, chest: v?.chest, tokens: v?.tokens, paused: v?.paused, pauseWhy: v?.pauseWhy, armed: v?.armed }))
console.log('PREVIEW', JSON.stringify(await get('/vault/withdraw-preview?id=' + encodeURIComponent(v?.id || ''))))
