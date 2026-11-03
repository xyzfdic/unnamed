// read-only: the stuck launches — server events (15 min), the owner's dev vaults made in the last hour, wallet balances
import { PublicKey } from '@solana/web3.js'
const { conn } = await import('../src/chain.ts')
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(30000) }); return await r.json().catch(() => null) } catch (e: any) { return { err: String(e?.message || e) } } }
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + (Date.now() - 20 * 60_000)); for (const e of (ev?.events || [])) console.log('EV', new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 220))
const h: any = await get('/health'); console.log('COMMIT', h?.commit)
for (const w of ['7BAdBZxhisBAJH8PGMADKp8thz8yqk2AmaoHZq92mmvb', '5MHbsDZaNTzNLhcn7JNNgQ2zTm2ooyr4xHXEV1uwxrqt', 'HuZGx4k41dCPuXR4PnBNdHNXJ4WzbUnDxo9wvU3VpXAY']) {
  const bal = await conn.getBalance(new PublicKey(w)).catch(() => -1); const vs: any = await get('/dev/' + w); const fresh = (Array.isArray(vs) ? vs : []).filter((v: any) => Date.now() - v.createdAt < 3 * 3600e3)
  console.log('DEV', w.slice(0, 6), 'bal', (bal / 1e9).toFixed(4), 'vaults <3h', fresh.length, fresh.map((v: any) => `${v.id.slice(0, 6)} ${v.venue} stake ${v.stakeSol} armed ${v.armed} chest ${v.chest} mint ${String(v.mint || '').slice(0, 6)} last: ${String(v.activity?.[0]?.msg || '').slice(0, 90)}`).join(' || '))
  const sigs = await conn.getSignaturesForAddress(new PublicKey(w), { limit: 6 }).catch(() => []); console.log('   recent txs', sigs.map((s: any) => `${new Date((s.blockTime || 0) * 1000).toISOString().slice(11, 19)} ${s.err ? 'ERR' : 'ok'}`).join(' · '))
}
const bs = await conn.getSignaturesForAddress(new PublicKey('BANKYubgHd48UQt2VFtEytyE8QyeBHhiuptC3tHmfVPH'), { limit: 6 }).catch(() => []); console.log('BANKY recent', bs.map((s: any) => `${new Date((s.blockTime || 0) * 1000).toISOString().slice(11, 19)} ${s.err ? 'ERR ' + JSON.stringify(s.err) : 'ok'}`).join(' · '))
const tf: any = await (await fetch('https://bundles.jito.wtf/api/v1/bundles/tip_floor').catch(() => null))?.json().catch(() => null); console.log('JITO TIP FLOOR', JSON.stringify(tf?.[0] || tf).slice(0, 300))
