// read-only report pull: the live pump chest now, its activity since 11:51, vault-wallet txs since 11:52 that the server didn't make, the wallet split
import { PublicKey } from '@solana/web3.js'
const { conn } = await import('../src/chain.ts')
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''; const B = 'BANKYubgHd48UQt2VFtEytyE8QyeBHhiuptC3tHmfVPH', MINT = 'fe3hPZHUdMkRdL54pwdUSkgBY4LkH5esocrbSjVBANK'
const get = async (p: string) => { try { const r = await fetch(S + p, { signal: AbortSignal.timeout(30000) }); return await r.json().catch(() => null) } catch (e: any) { return { err: String(e?.message || e) } } }
const v: any = await get('/vault/mint/' + MINT)
console.log('CHEST', JSON.stringify({ chest: v?.chest, tokens: v?.tokens, supply: v?.supply, price: v?.live?.price, vwap30: v?.live?.vwap30, stretch: v?.live?.stretch, score: v?.score, devPaid: v?.devPaid, report: v?.report, sniper: v?.sniper, paused: v?.paused, pauseWhy: v?.pauseWhy, fitted: v?.fitted, dev: v?.dev, armed: v?.armed }))
const m: any = await get('/market/' + MINT); console.log('MARKET', JSON.stringify({ priceSol: m?.priceSol, mcapUsd: m?.mcapUsd, liqSol: m?.liqSol, onCurve: m?.onCurve, vol1h: m?.vol1h }).slice(0, 300))
const since = Date.parse('2026-11-03T11:51:30Z')
for (const a of (v?.activity || []).filter((a: any) => a.t > since && a.kind !== 'cut').slice(0, 40)) console.log('ACT', new Date(a.t).toISOString().slice(11, 19), a.kind, a.sol != null ? (+a.sol).toFixed(4) : '', String(a.msg || '').slice(0, 150))
const sigs = (await conn.getSignaturesForAddress(new PublicKey(B), { limit: 300 })).filter((s) => (s.blockTime || 0) * 1000 > since + 30_000).reverse()
let n = 0
for (const s of sigs) {
  const tx: any = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' }).catch(() => null); if (!tx) continue
  const keys = tx.transaction.message.accountKeys.map((k: any) => k.pubkey.toBase58()); const i = keys.indexOf(B); const dSol = i >= 0 ? (tx.meta.postBalances[i] - tx.meta.preBalances[i]) / 1e9 : 0
  const tb = (arr: any[]) => (arr || []).filter((b: any) => b.owner === B && b.mint === MINT).reduce((a: number, b: any) => a + (+b.uiTokenAmount.uiAmount || 0), 0); const dTok = tb(tx.meta.postTokenBalances) - tb(tx.meta.preTokenBalances)
  const progs = [...new Set(tx.transaction.message.instructions.map((x: any) => (x.programId?.toBase58?.() || String(x.programId)).slice(0, 6)))].join(',')
  const cb = tx.transaction.message.instructions.some((x: any) => (x.programId?.toBase58?.() || '') === 'ComputeBudget111111111111111111111111111111')
  const outs = tx.transaction.message.instructions.filter((x: any) => x.program === 'system' && x.parsed?.type === 'transfer' && x.parsed.info.source === B).map((x: any) => `${(x.parsed.info.lamports / 1e9).toFixed(4)}→${x.parsed.info.destination.slice(0, 6)}`)
  const isCut = outs.length === 1 && /→9VZFDK/.test(outs[0]) && Math.abs(dTok) < 1 && progs === 'Comput,111111'
  if (isCut) continue
  n++; console.log('TX', new Date((s.blockTime || 0) * 1000).toISOString().slice(11, 19), s.signature.slice(0, 10), s.err ? 'ERR' : 'ok', 'sol', dSol.toFixed(4), 'coins', (dTok / 1e6).toFixed(2) + 'M', 'progs', progs, cb ? '' : 'NO-CU(wallet-style)', outs.length ? 'OUT ' + outs.join(' ') : '')
}
console.log('TX count (excl. creator-cut transfers)', n, 'of', sigs.length)
console.log('WALLET', JSON.stringify(await get('/admin/wallet?key=' + encodeURIComponent(K))))
const ev: any = await get('/admin/events?key=' + encodeURIComponent(K) + '&since=' + since); for (const e of (ev?.events || []).filter((e: any) => !/capture \d/.test(e.msg))) console.log('EV', new Date(e.t).toISOString().slice(11, 19), e.kind, String(e.msg).slice(0, 200))
