// read-only: the full waitlist + on-chain facts per wallet, ENCRYPTED to a one-off public key (the private key never leaves the operator's
// workspace) — this output lands on a branch, so no wallet or handle is ever written in the clear
import { PublicKey } from '@solana/web3.js'
import { publicEncrypt, randomBytes, createCipheriv, constants } from 'node:crypto'
const { conn } = await import('../src/chain.ts')
const PUB = `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAutshzNN9ibrPCAWGknj4
4ha+3hIyG24dx2/tWahJAPruBlZQpQ7nrh5Z8Eu3RY4A51NX0VV7WDNnwHQ0h++0
L1NS5+BsxLLuIdkN5+NuWGkhHw3i8GRtmSx56R1jZJPuL/mSafvnreL0VvKMuWhf
A/l7pErJjAfe7txGSXfIkcV5+7fS5fZ/5od+ia+ExWAhi4xaB5EgK9OeekItwRoi
ltMulQiR6I/EEBDz5mSiLfgcvoryjasz3TQuUU4LH2ib4xocRSJIGS54wJqkkjfl
sW2vclXXp+Q04iG7dz9kAitOzf/iZyid5MkN8kZVpf2qftqSS9fLtvsY56gpP0Ol
AdcXPIXuqdv97Ce2KHQtWQzeJDKlJwESTXmHiPZJeNfB9KB4i+15MRGMxmrLUut8
TJFyLEmRaCj2y6XWnIbGiuEnF00mDnSm1EpX5AFy/qZ0s0W+tuyGAvso9P0vKegd
lM/Cy4Vn0U4BEl874Oc+bqWTDh9mc4qnPJHWexMr0QJPAgMBAAE=
-----END PUBLIC KEY-----`
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { return await (await fetch(S + p, { signal: AbortSignal.timeout(30000) })).json() } catch (e: any) { return { err: String(e?.message || e) } } }
const w: any = await get('/admin/waitlist?key=' + encodeURIComponent(K)); const rows: any[] = w?.rows || []
const red: any = await get('/invite/redeemed?key=' + encodeURIComponent(K)); const vs: any = await get('/vaults')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const facts: Record<string, any> = {}
for (let i = 0; i < rows.length; i += 100) { const chunk = rows.slice(i, i + 100); const ks = chunk.map((r) => { try { return new PublicKey(r.wallet) } catch { return null } })
  const infos = await conn.getMultipleAccountsInfo(ks.filter(Boolean) as PublicKey[]).catch(() => null); let j = 0
  for (const [n, k] of ks.entries()) { if (!k) { facts[chunk[n].wallet] = { bad: true }; continue } const a = infos ? infos[j++] : undefined; facts[chunk[n].wallet] = { exists: !!a, sol: a ? a.lamports / 1e9 : 0 } }
  await sleep(400) }
let done = 0
for (const r of rows) { const f = facts[r.wallet]; if (!f?.exists) continue
  try { const sigs = await conn.getSignaturesForAddress(new PublicKey(r.wallet), { limit: 1000 }); f.txs = sigs.length; f.oldest = sigs.length ? sigs[sigs.length - 1].blockTime || null : null; f.newest = sigs.length ? sigs[0].blockTime || null : null } catch (e: any) { f.txErr = String(e?.message || e).slice(0, 40) }
  done++; await sleep(250) }
const plain = Buffer.from(JSON.stringify({ at: Date.now(), offsite: w?.offsite, rows, facts, redeemed: red, vaultDevs: Array.isArray(vs) ? vs.map((v: any) => v.dev) : [] }))
const key = randomBytes(32), iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', key, iv); const ct = Buffer.concat([c.update(plain), c.final()]); const tag = c.getAuthTag()
const ek = publicEncrypt({ key: PUB, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key)
console.log('ROWS', rows.length, 'checked activity for', done)
console.log('ENC ' + JSON.stringify({ k: ek.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64'), ct: ct.toString('base64') }))
