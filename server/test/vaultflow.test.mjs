// The one-signature launch, server side, end to end with the chain faked: build (stake inside the create) → bundle lands → arm books the
// stake from the create tx and the block-zero buy from the vault tx, exactly once, even when the app's arm and autoArm race.
// LaunchLab is mocked (module mock); the shared Connection object is patched per method. Run with --experimental-test-module-mocks.
import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { Keypair, PublicKey, VersionedTransaction, TransactionMessage, SystemProgram, SystemInstruction, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'vaultflow-'))
const SHARED = Keypair.generate(); process.env.VAULT_KEY = bs58.encode(SHARED.secretKey)
process.env.FOREIGN_GRACE_MS = '0'; process.env.PROFIT_ONLY = '1'; process.env.PROFIT_LAUNCH_BUY_SOL = '9'; process.env.TEST_MAX_CHEST_SOL = '10'; process.env.VAMPS = '0'
const dev = Keypair.generate(); process.env.TEST_RECLAIM_WALLETS = dev.publicKey.toBase58(); let mintKp = Keypair.generate(); let MINT = mintKp.publicKey.toBase58(); const BANKY = SHARED.publicKey.toBase58()
const bh = '11111111111111111111111111111111'
const DEVPK = dev.publicKey.toBase58()

// ---- fake chain ----
const parsed = new Map()          // sig → parsed tx (keys + pre/post lamports)
let pendingFees = 0, claimBuilt = 0
let poolLive = false, vaultTokens = 0, blockhashValid = false, tradeN = 0, reuseMint = null
const createSigs = []             // signatures in the order they landed on the mint
const land = (tx, deltas) => { const sig = bs58.encode(tx.signatures[0]); const keys = [...new Set([...tx.message.staticAccountKeys.map((k) => k.toBase58()), ...Object.keys(deltas)])]
  // parsed instructions the way the RPC returns them: system transfers decoded, everything else opaque
  const instructions = TransactionMessage.decompile(tx.message).instructions.map((ix) => { if (!ix.programId.equals(SystemProgram.programId)) return { programId: ix.programId }; try { const d = SystemInstruction.decodeTransfer(ix); return { program: 'system', parsed: { type: 'transfer', info: { source: d.fromPubkey.toBase58(), destination: d.toPubkey.toBase58(), lamports: Number(d.lamports) } } } } catch { return { program: 'system', parsed: { type: 'other' } } } })
  parsed.set(sig, { blockTime: Math.floor(Date.now() / 1000), meta: { err: null, innerInstructions: [], preBalances: keys.map(() => 100e9), postBalances: keys.map((k) => 100e9 + Math.round((deltas[k] || 0) * 1e9)) }, transaction: { message: { instructions, accountKeys: keys.map((k) => ({ pubkey: new PublicKey(k) })) } } }); return sig }

mock.module('../src/launchlab.ts', { namedExports: {
  PLATFORM_ID: Keypair.generate().publicKey, TAX_BPS: 200, CURVE_CUSTOM: false,
  status: () => ({ venue: 'launchlab' }), isOurs: () => true, platformKeypair: () => SHARED, platformVaultSol: async () => pendingFees, buildClaimVault: async () => { claimBuilt++; throw new Error('claim built') },
  poolIdOf: (m) => new PublicKey(m),   // stand-in: the pool account is the mint here (getAccountInfo below answers for it)
  pool: async (m) => (poolLive && m === MINT ? { poolId: 'POOL', status: 0, creator: DEVPK, liqSol: 45, priceSol: 1e-7, realB: 0n } : null),
  quote: (_s, solIn) => ({ tokens: solIn * 27e6, after: { virtualA: 1073025605596382n, virtualB: 30000852951n, realA: 0n, realB: BigInt(Math.round((0.5 + solIn) * 0.977e9)) } }),
  buildTrade: async (owner) => new VersionedTransaction(new TransactionMessage({ payerKey: owner, recentBlockhash: bh, instructions: [SystemProgram.transfer({ fromPubkey: owner, toPubkey: new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'), lamports: 5e6 + (++tradeN) })] }).compileToV0Message()),   // unique per build, like a real one
  buildLaunch: async (devPk, _meta, devBuy) => {
    mintKp = reuseMint || Keypair.generate(); MINT = mintKp.publicKey.toBase58()   // every launch is a new coin (as with the real mint pool) — unless a test hands back a reclaimed one
    const txs = [new VersionedTransaction(new TransactionMessage({ payerKey: devPk, recentBlockhash: bh, instructions: [SystemProgram.createAccount({ fromPubkey: devPk, newAccountPubkey: mintKp.publicKey, lamports: 1e6, space: 82, programId: SystemProgram.programId })] }).compileToV0Message())]
    const restamp = (b) => { for (const t of txs) { t.message.recentBlockhash = b; t.sign([mintKp]) } return txs.map((t) => Buffer.from(t.serialize()).toString('base64')) }
    const addTransfer = async (to, lamports) => { const m = TransactionMessage.decompile(txs[0].message); m.instructions.push(SystemProgram.transfer({ fromPubkey: devPk, toPubkey: to, lamports })); txs[0] = new VersionedTransaction(m.compileToV0Message()); return txs[0].serialize().length }
    return { mint: MINT, poolId: 'POOL', txs: restamp(bh), restamp, addTransfer, devTokens: devBuy * 30e6, devCostSol: devBuy, afterDev: { virtualA: 1073025605596382n, virtualB: 30000852951n, realA: 0n, realB: 0n }, permTax: 0 }
  },
} })

const C = await import('../src/chain.ts')
Object.assign(C.conn, {
  getLatestBlockhash: async () => ({ blockhash: bh, lastValidBlockHeight: 1 }),
  getParsedTransaction: async (sig) => parsed.get(sig) || null,
  getSignatureStatuses: async (sigs) => ({ value: sigs.map((s) => (parsed.has(s) ? { confirmationStatus: 'confirmed', err: null } : null)) }),
  getSignaturesForAddress: async () => createSigs.map((signature) => ({ signature, slot: 7, err: null })).reverse(),
  getTokenSupply: async () => ({ value: { uiAmount: 1e9, decimals: 6 } }),
  getParsedTokenAccountsByOwner: async () => ({ value: vaultTokens ? [{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: vaultTokens, amount: String(vaultTokens * 1e6) } } } } } }] : [] }),
  getAccountInfo: async (pk) => (poolLive && pk.toBase58() === MINT ? { data: Buffer.alloc(0), owner: SystemProgram.programId, lamports: 1, executable: false } : null), getBalance: async () => 0,
  isBlockhashValid: async () => ({ value: blockhashValid }),
})
const V = await import('../src/vault.ts')

const STAKE = 7.79, BUY = 7.29
async function launch() {
  const v = V.create(DEVPK, STAKE, undefined, 'mm', 0.3, 'launchlab', BUY, 20)
  const b = await V.buildLaunch({ dev: DEVPK, name: 'Bank', symbol: 'BANK', uri: 'u', devBuySol: 0.5, vaultId: v.id, vaultBuySol: BUY, fundInBundle: true, auth: { sessionWallet: DEVPK } })
  return { v, b }
}

test('build: the stake rides inside the create (dev → shared vault wallet) and nothing is booked before it lands', async () => {
  const { v, b } = await launch()
  assert.equal(b.fundSol, STAKE)
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64'))
  const m = TransactionMessage.decompile(ct.message); const tr = m.instructions.at(-1)
  assert.ok(tr.programId.equals(SystemProgram.programId)); assert.equal(tr.keys[0].pubkey.toBase58(), DEVPK); assert.equal(tr.keys[1].pubkey.toBase58(), BANKY)
  assert.equal(Number(tr.data.readBigUInt64LE(4)), Math.round(STAKE * 1e9))
  assert.ok(ct.signatures[1].some((x) => x), 'mint signed after the stake went in')
  assert.ok(b.vaultTx, 'the vault buy is signed for the bundle'); assert.ok(b.vaultSpend > 7 && b.vaultSpend <= BUY)
})

test('arm after landing: stake booked from the create, block-zero buy booked once — even with two arms racing', async () => {
  const { v, b } = await launch()
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64')); ct.sign([dev])
  const vt = VersionedTransaction.deserialize(Buffer.from(b.vaultTx, 'base64'))
  const createSig = land(ct, { [DEVPK]: -(STAKE + 0.5 + 0.02), [BANKY]: +STAKE }); createSigs.push(createSig)
  land(vt, { [BANKY]: -(b.vaultSpend + 0.005 + 0.00001) })
  poolLive = true; vaultTokens = 197e6
  const [a1, a2] = await Promise.all([V.arm(v.id, MINT, 'BANK', 'Bank', { sessionWallet: DEVPK }, createSig), V.arm(v.id, MINT, 'BANK', 'Bank', { sessionWallet: DEVPK })])
  assert.equal(a1.armed, true); assert.equal(a2.armed, true)
  const expect = STAKE - (b.vaultSpend + 0.005 + 0.00001)
  assert.ok(Math.abs(a2.chest - expect) < 1e-6, `chest ${a2.chest} vs ${expect}`)
  assert.equal(a2.activity.filter((x) => x.kind === 'stake').length, 1, 'stake booked once')
  assert.equal(a2.activity.filter((x) => (x.msg || '').includes('· booked')).length, 1, 'vault buy booked once')
  poolLive = false; createSigs.length = 0
})

test('arm without the create signature finds it on chain (the app never got that far) — and a closed vault never re-arms', async () => {
  const { v, b } = await launch()
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64')); ct.sign([dev])
  const vt = VersionedTransaction.deserialize(Buffer.from(b.vaultTx, 'base64'))
  const vaultSig = land(vt, { [BANKY]: -(b.vaultSpend + 0.005) }); const createSig = land(ct, { [DEVPK]: -(STAKE + 0.52), [BANKY]: +STAKE })
  createSigs.push(vaultSig, createSig)  // same slot; the vault buy listed first must be skipped (it moves SOL out, not in)
  poolLive = true; vaultTokens = 197e6
  const a = await V.arm(v.id, MINT, 'BANK', 'Bank', { sessionWallet: DEVPK })
  assert.equal(a.armed, true); assert.ok(Math.abs(a.chest - (STAKE - b.vaultSpend - 0.005)) < 1e-6, 'chest = stake − vault buy')
  poolLive = false; createSigs.length = 0
})

test('a retry after a launch that landed late is refused with the live mint (no second coin for one chest)', async () => {
  const { v } = await launch(); poolLive = true
  await assert.rejects(V.buildLaunch({ dev: DEVPK, name: 'Bank', symbol: 'BANK', uri: 'u', devBuySol: 0.5, vaultId: v.id, vaultBuySol: BUY, fundInBundle: true, auth: { sessionWallet: DEVPK } }), new RegExp('already live: ' + MINT))
  poolLive = false
})

test('the stake can only come from the vault owner: someone else building on this vault is refused', async () => {
  const v = V.create(DEVPK, STAKE, undefined, 'mm', 0.3, 'launchlab', BUY, 20); const other = Keypair.generate().publicKey.toBase58()
  await assert.rejects(V.buildLaunch({ dev: other, name: 'X', symbol: 'X', uri: 'u', devBuySol: 0, vaultId: v.id, vaultBuySol: BUY, fundInBundle: true, auth: { sessionWallet: other } }), /not your vault/)
})

test('the server arms on its own the moment the bundle lands (no arm call from the app)', async () => {
  const { v, b } = await launch()
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64')); ct.sign([dev])
  const vt = VersionedTransaction.deserialize(Buffer.from(b.vaultTx, 'base64'))
  createSigs.length = 0; const createSig = land(ct, { [DEVPK]: -(STAKE + 0.52), [BANKY]: +STAKE }); land(vt, { [BANKY]: -(b.vaultSpend + 0.005) }); createSigs.push(createSig)
  poolLive = true; vaultTokens = 197e6
  let armed = null; for (let i = 0; i < 40 && !armed; i++) { await new Promise((r) => setTimeout(r, 200)); armed = V.list().find((x) => x.id === v.id) || null }
  assert.ok(armed, 'armed by the landing watcher'); assert.ok(Math.abs(armed.chest - (STAKE - b.vaultSpend - 0.005)) < 1e-6, 'stake in, vault buy out')
  assert.equal(armed.activity.filter((x) => x.kind === 'stake').length, 1)
  poolLive = false; createSigs.length = 0
})

test('a second build while the first can still land is refused (two coins, two buys on one stake); allowed once its blockhash is gone', async () => {
  const { v } = await launch(); blockhashValid = true
  await assert.rejects(V.buildLaunch({ dev: DEVPK, name: 'Bank', symbol: 'BANK', uri: 'u', devBuySol: 0.5, vaultId: v.id, vaultBuySol: BUY, fundInBundle: true, auth: { sessionWallet: DEVPK } }), /can still land/)
  blockhashValid = false
  const b2 = await V.buildLaunch({ dev: DEVPK, name: 'Bank', symbol: 'BANK', uri: 'u', devBuySol: 0.5, vaultId: v.id, vaultBuySol: BUY, fundInBundle: true, auth: { sessionWallet: DEVPK } })
  assert.ok(b2.vaultTx)
})

test('parallel /vault/fund calls on one stake book it once; a stake tx cannot be booked into a second vault', async () => {
  const v = V.create(DEVPK, 2, undefined, 'mm', 0.3, 'launchlab', 1, 10); const w = V.create(DEVPK, 2, undefined, 'mm', 0.3, 'launchlab', 1, 10)
  const t = new VersionedTransaction(new TransactionMessage({ payerKey: dev.publicKey, recentBlockhash: bh, instructions: [SystemProgram.transfer({ fromPubkey: dev.publicKey, toPubkey: SHARED.publicKey, lamports: 2e9 })] }).compileToV0Message()); t.sign([dev])
  const sig = land(t, { [DEVPK]: -2, [BANKY]: +2 })
  const rs = await Promise.allSettled(Array.from({ length: 10 }, () => V.fund(v.id, sig)))
  assert.ok(rs.some((r) => r.status === 'fulfilled'))
  const after = await V.fund(v.id, sig); assert.ok(Math.abs(after.chest - 2) < 1e-9, 'booked once: ' + after.chest)
  await assert.rejects(V.fund(w.id, sig), /already booked/)
})

test('only the dev\'s own transfer counts: SOL someone else sent to the shared wallet is not a stake', async () => {
  const v = V.create(DEVPK, 2, undefined, 'mm', 0.3, 'launchlab', 1, 10); const other = Keypair.generate()
  const t = new VersionedTransaction(new TransactionMessage({ payerKey: dev.publicKey, recentBlockhash: bh, instructions: [SystemProgram.transfer({ fromPubkey: other.publicKey, toPubkey: SHARED.publicKey, lamports: 3e9 })] }).compileToV0Message()); t.sign([dev, other])
  const sig = land(t, { [BANKY]: +3 })
  await assert.rejects(V.fund(v.id, sig), /no SOL from the vault owner/)
})

test('a reclaimed …BANK mint handed to a second vault launches for that vault (the first vault lets go of it)', async () => {
  const A = await launch(); const M = mintKp; reuseMint = M   // A's launch never landed; its mint goes back to the pool
  const B = await launch(); reuseMint = null; assert.equal(B.b.mint, A.b.mint)
  const ct = VersionedTransaction.deserialize(Buffer.from(B.b.txs[0], 'base64')); ct.sign([dev]); const vt = VersionedTransaction.deserialize(Buffer.from(B.b.vaultTx, 'base64'))
  createSigs.length = 0; const cs = land(ct, { [DEVPK]: -(STAKE + 0.52), [BANKY]: +STAKE }); land(vt, { [BANKY]: -(B.b.vaultSpend + 0.005) }); createSigs.push(cs)
  poolLive = true; vaultTokens = 197e6
  const armed = await V.arm(B.v.id, B.b.mint, 'BANK', 'Bank', { sessionWallet: DEVPK }, cs)
  assert.equal(armed.armed, true); assert.ok(Math.abs(armed.chest - (STAKE - B.b.vaultSpend - 0.005)) < 1e-6)
  await assert.rejects(V.arm(A.v.id, A.b.mint, 'BANK', 'Bank', { sessionWallet: DEVPK }), /did not launch that coin|not on chain|another chest/)
  poolLive = false; createSigs.length = 0
})

test('two builds fired in parallel on one vault: one is refused (one stake can never back two launch buys)', async () => {
  const v = V.create(DEVPK, STAKE, undefined, 'mm', 0.3, 'launchlab', BUY, 20)
  const req = () => V.buildLaunch({ dev: DEVPK, name: 'Bank', symbol: 'BANK', uri: 'u', devBuySol: 0.5, vaultId: v.id, vaultBuySol: BUY, fundInBundle: true, auth: { sessionWallet: DEVPK } })
  const rs = await Promise.allSettled([req(), req()])
  assert.equal(rs.filter((r) => r.status === 'fulfilled').length, 1)
  assert.match(String(rs.find((r) => r.status === 'rejected').reason), /busy/)
})

test('a deposit counts only the signed-in depositor\'s own transfer, once', async () => {
  const { v, b } = await launch()
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64')); ct.sign([dev]); const vt = VersionedTransaction.deserialize(Buffer.from(b.vaultTx, 'base64'))
  createSigs.length = 0; const cs = land(ct, { [DEVPK]: -(STAKE + 0.52), [BANKY]: +STAKE }); land(vt, { [BANKY]: -(b.vaultSpend + 0.005) }); createSigs.push(cs)
  poolLive = true; vaultTokens = 197e6
  const a = await V.arm(v.id, MINT, 'BANK', 'Bank', { sessionWallet: DEVPK }, cs); const c0 = a.chest
  const t = new VersionedTransaction(new TransactionMessage({ payerKey: dev.publicKey, recentBlockhash: bh, instructions: [SystemProgram.transfer({ fromPubkey: dev.publicKey, toPubkey: SHARED.publicKey, lamports: 1e9 })] }).compileToV0Message()); t.sign([dev])
  const sig = land(t, { [DEVPK]: -1, [BANKY]: +1 })
  await assert.rejects(V.deposit(v.id, DEVPK, sig, Keypair.generate().publicKey.toBase58()), /another wallet/)
  const d = await V.deposit(v.id, DEVPK, sig, DEVPK); assert.ok(Math.abs(d.chest - (c0 + 1)) < 1e-9)
  await assert.rejects(V.deposit(v.id, DEVPK, sig, DEVPK), /already booked/)
  poolLive = false; createSigs.length = 0
})

test('the full withdrawal (TEST_RECLAIM) is only for the owner\'s wallets', () => {
  assert.equal(V.reclaimAllowed(DEVPK), true)
  assert.equal(V.reclaimAllowed(Keypair.generate().publicKey.toBase58()), false)
})

test('the vault wallet cannot be a vault\'s own dev (a stake from it to itself would be booked as new money)', () => {
  assert.throws(() => V.create(BANKY, 1, undefined, 'mm', 0.3, 'launchlab', 0.5, 15), /own wallet/)
})
test('books never above the wallet: chests are scaled down to what the shared wallet holds (outside spends), never up', async () => {
  const a = await V.sharedAudit(); assert.ok(a.ledgersSol > 0.2, 'some chest booked by the earlier tests')
  const real = C.conn.getBalance; C.conn.getBalance = async () => Math.round(a.ledgersSol / 2 * 1e9)
  try {
    const r = await V.fitLedgers(true); assert.equal(r.fitted, true, JSON.stringify(r))
    const b = await V.sharedAudit(); assert.ok(b.ledgersSol <= a.ledgersSol / 2 + 1e-6 && b.ledgersSol > a.ledgersSol / 2 - 0.02, `${b.ledgersSol} vs ${a.ledgersSol / 2}`)
    C.conn.getBalance = async () => Math.round(a.ledgersSol * 3 * 1e9); const r2 = await V.fitLedgers(true); assert.equal(r2.fitted, false, 'a wallet above the books never raises a chest')
  } finally { C.conn.getBalance = real }
})

// ---- SOL in no chest (the vault wallet's 10+ SOL the owner moves himself) is never paid out or spent by a chest ----
const landLegacy = (raw) => { const t = Transaction.from(raw); const sig = bs58.encode(t.signature); const tr = t.instructions.find((ix) => ix.programId.equals(SystemProgram.programId)); const d = SystemInstruction.decodeTransfer(tr)
  const from = d.fromPubkey.toBase58(), to = d.toPubkey.toBase58(), sol = Number(d.lamports) / 1e9; paid.push({ from, to, sol })
  parsed.set(sig, { blockTime: Math.floor(Date.now() / 1000), meta: { err: null, innerInstructions: [], preBalances: [100e9, 100e9], postBalances: [100e9 - Math.round((sol + 0.000005) * 1e9), 100e9 + Math.round(sol * 1e9)] }, transaction: { message: { instructions: [], accountKeys: [from, to].map((k) => ({ pubkey: new PublicKey(k) })) } } }); return sig }
const paid = []
test('SOL in no chest is never paid out: the full withdrawal ("Close & withdraw all") pays the chest\'s own ledger, not the wallet', async () => {
  const { v, b } = await launch()
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64')); ct.sign([dev]); const vt = VersionedTransaction.deserialize(Buffer.from(b.vaultTx, 'base64'))
  createSigs.length = 0; const cs = land(ct, { [DEVPK]: -(STAKE + 0.52), [BANKY]: +STAKE }); land(vt, { [BANKY]: -(b.vaultSpend + 0.005) }); createSigs.push(cs)
  poolLive = true; vaultTokens = 0
  const a = await V.arm(v.id, MINT, 'BANK', 'Bank', { sessionWallet: DEVPK }, cs); const chest = a.chest; assert.ok(chest > 0.3 && chest < 0.6, 'chest ' + chest)
  const audit0 = await V.sharedAudit(); const FREE = 10.42; const realBal = C.conn.getBalance, realSend = C.conn.sendRawTransaction
  C.conn.getBalance = async () => Math.round((audit0.ledgersSol + FREE) * 1e9); C.conn.sendRawTransaction = async (raw) => landLegacy(raw)
  process.env.TEST_RECLAIM = '1'
  try {
    const pv = await V.withdrawPreview(v.id)
    assert.equal(pv.ok, true, pv.why); assert.ok(Math.abs(pv.sol - (chest - 0.001)) < 1e-6, `preview ${pv.sol} vs chest ${chest}`)
    assert.ok(pv.wallet && Math.abs(pv.wallet.free - FREE) < 1e-3, 'the owner sees what sits in no chest: ' + JSON.stringify(pv.wallet))
    const r = await V.refund(v.id, { sessionWallet: DEVPK })
    assert.ok(r.sol <= chest && r.sol > chest - 0.002, `paid ${r.sol}, chest was ${chest}`)
    assert.equal(paid.length, 1); assert.equal(paid[0].from, BANKY); assert.equal(paid[0].to, DEVPK); assert.ok(paid[0].sol <= chest, 'the transfer itself is ≤ the chest')
    const after = V.list().find((x) => x.id === v.id); assert.ok(!after || after.chest < 0.001, 'chest emptied')
    const pv2 = await V.withdrawPreview(v.id); assert.equal(pv2.ok, false); assert.match(pv2.why, /empty/)
    await assert.rejects(V.refund(v.id, { sessionWallet: DEVPK }), /nothing to refund|never pays out/)
    assert.equal(paid.length, 1, 'no second payout')
  } finally { C.conn.getBalance = realBal; C.conn.sendRawTransaction = realSend; delete process.env.TEST_RECLAIM; poolLive = false; createSigs.length = 0 }
})
test('a chest of ~0 in a wallet holding 10 SOL cannot buy with it: the keeper refuses any spend past the chest', async () => {
  const KEEP = await import('../src/keeper.ts'); const k = Keypair.generate()
  const t = () => { const x = new Transaction().add(SystemProgram.transfer({ fromPubkey: k.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 })); x.feePayer = k.publicKey; x.recentBlockhash = bh; return x }
  assert.throws(() => KEEP.sign({ id: 'empty-' + Date.now(), chest: 0, sk: k }, t(), 'trade', 1), /per-tx cap/)
  assert.throws(() => KEEP.sign({ id: 'empty2-' + Date.now(), chest: 0, sk: k }, t(), 'desk_fill', 0.05), /per-tx cap/)
  assert.throws(() => KEEP.sign({ id: 'empty3-' + Date.now(), chest: 0.13, sk: k }, t(), 'launch', 5), /exceeds the funded stake/)
})
test('someone else trading from the vault wallet pauses that chest (no sales into buys); the server\'s own signed swaps never do', async () => {
  const KEEP = await import('../src/keeper.ts')
  const id = V.list().find((x) => x.armed)?.id; assert.ok(id, 'an armed vault from the tests above'); const raw = V._get(id)
  const own = KEEP.sign({ id, chest: 1, sk: SHARED }, new Transaction({ feePayer: SHARED.publicKey, recentBlockhash: bh }).add(SystemProgram.transfer({ fromPubkey: SHARED.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 })), 'trade', 0)
  assert.equal(V.seeSwap(id, { trader: BANKY, sig: bs58.encode(own.signature), side: 'sell', sol: 0.5 }), false, 'own sale')
  assert.equal(V.seeSwap(id, { trader: Keypair.generate().publicKey.toBase58(), sig: bs58.encode(Buffer.alloc(64, 7)), side: 'buy', sol: 2 }), false, 'a stranger buying is just a buy')
  assert.equal(V.list().find((x) => x.id === id).paused, 0)
  assert.equal(V.seeSwap(id, { trader: BANKY, sig: bs58.encode(Buffer.alloc(64, 9)), side: 'buy', sol: 3.2 }), true, 'a buy from the vault wallet the keeper never signed')
  const p = V.list().find((x) => x.id === id); assert.ok(p.paused > Date.now() + 10 * 60_000, 'paused ~15 min'); assert.match(p.activity[0].msg, /paused: someone else traded/)
  const n0 = tradeN; await V.onBuy(raw, 2, { priceSol: 1e-7, liqSol: 45, mcapUsd: 1e5 }, 1e-7, Date.now()); assert.equal(tradeN, n0, 'no sale built while paused')
  raw._foreignUntil = 0
})
test('the platform fee claim is skipped (one warning, nothing sent) when the vault wallet cannot pay its network fees', async () => {
  const EV = await import('../src/events.ts'); const t0 = Date.now() - 1; const real = C.conn.getBalance
  pendingFees = 0.4; claimBuilt = 0; C.conn.getBalance = async () => 0.002e9
  try {
    assert.equal(await V.claimPlatformFees(true), 0); assert.equal(await V.claimPlatformFees(true), 0)
    assert.equal(claimBuilt, 0, 'no claim tx built on an empty wallet')
    const ev = EV.since(t0); assert.equal(ev.filter((e) => /claim skipped/.test(e.msg)).length, 1, 'one warning, not one per cycle'); assert.equal(ev.filter((e) => /^platform fee claim: /.test(e.msg)).length, 0)
    C.conn.getBalance = async () => 1e9; assert.equal(await V.claimPlatformFees(true), 0); assert.equal(claimBuilt, 1, 'with SOL in the wallet the claim goes ahead')
  } finally { C.conn.getBalance = real; pendingFees = 0 }
})

test('the launch report hides the result when a chest holds less than its own books say (SOL left the wallet outside its trades)', async () => {
  const { v, b } = await launch()
  const ct = VersionedTransaction.deserialize(Buffer.from(b.txs[0], 'base64')); ct.sign([dev]); const vt = VersionedTransaction.deserialize(Buffer.from(b.vaultTx, 'base64'))
  createSigs.length = 0; const cs = land(ct, { [DEVPK]: -(STAKE + 0.52), [BANKY]: +STAKE }); land(vt, { [BANKY]: -(b.vaultSpend + 0.005) }); createSigs.push(cs)
  poolLive = true; vaultTokens = 197e6
  const real = C.conn.getBalance; C.conn.getBalance = async () => 1000e9   // a wallet well above the books: no fitting in this test
  try { await V.arm(v.id, MINT, 'BANK', 'Bank', { sessionWallet: DEVPK }, cs) } finally { C.conn.getBalance = real; poolLive = false; createSigs.length = 0 }
  const id = v.id; assert.equal(V.list().find((x) => x.id === id).report.fitted, false, 'a fresh chest\'s books add up'); const raw = V._get(id); const keep = raw.score ? { ...raw.score } : null
  raw.score = { ...(raw.score || { captured: 0, captures: 0, deskBought: 0, deskFills: 0, dipBought: 0, dips: 0, redeployed: 0, floor0: 0 }) }; raw.score.captured += 5   // books: +5 SOL sold, wallet never got it
  try { const p = V.list().find((x) => x.id === id); assert.equal(p.report.fitted, true); assert.equal(p.fitted, true) }
  finally { raw.score = keep }
  assert.equal(V.list().find((x) => x.id === id).report.fitted, false)
})
