// read-only: every vault-wallet tx in the last 30 min — SOL and coin change, which programs, and transfers out (to where)
import { PublicKey } from '@solana/web3.js'
const { conn } = await import('../src/chain.ts')
const B = 'BANKYubgHd48UQt2VFtEytyE8QyeBHhiuptC3tHmfVPH', MINT = 'fe3hPZHUdMkRdL54pwdUSkgBY4LkH5esocrbSjVBANK'
const sigs = (await conn.getSignaturesForAddress(new PublicKey(B), { limit: 120 })).filter((s) => (s.blockTime || 0) * 1000 > Date.now() - 40 * 60_000).reverse()
console.log('TXS', sigs.length)
for (const s of sigs) {
  const tx: any = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' }).catch(() => null); if (!tx) { console.log(s.signature.slice(0, 8), 'unreadable'); continue }
  const keys = tx.transaction.message.accountKeys.map((k: any) => k.pubkey.toBase58()); const i = keys.indexOf(B); const dSol = i >= 0 ? (tx.meta.postBalances[i] - tx.meta.preBalances[i]) / 1e9 : 0
  const tb = (arr: any[]) => (arr || []).filter((b: any) => b.owner === B && b.mint === MINT).reduce((a: number, b: any) => a + (+b.uiTokenAmount.uiAmount || 0), 0); const dTok = tb(tx.meta.postTokenBalances) - tb(tx.meta.preTokenBalances)
  const signer0 = keys[0]; const progs = [...new Set(tx.transaction.message.instructions.map((x: any) => x.programId?.toBase58?.() || x.programId).map((p: string) => p.slice(0, 6)))].join(',')
  const outs = tx.transaction.message.instructions.filter((x: any) => x.program === 'system' && x.parsed?.type === 'transfer' && x.parsed.info.source === B).map((x: any) => `${(x.parsed.info.lamports / 1e9).toFixed(4)}→${x.parsed.info.destination.slice(0, 6)}`)
  console.log(new Date((s.blockTime || 0) * 1000).toISOString().slice(11, 19), s.signature.slice(0, 8), s.err ? 'ERR' : 'ok', 'sol', dSol.toFixed(4), 'coins', (dTok / 1e6).toFixed(2) + 'M', 'payer', signer0.slice(0, 6), 'progs', progs, outs.length ? 'OUT ' + outs.join(' ') : '')
}
