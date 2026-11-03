// Nov 3: a rate-limited read of our platform config was taken as "not on chain", the create went out under Raydium's platform while the
// vault's block-zero buy named ours — the buy failed inside the bundle and Jito dropped every launchpad launch. The platform a launch uses
// must be read, not guessed, and the vault buy must name the same one.
import test from 'node:test'
import assert from 'node:assert/strict'
import { LAUNCHPAD_PLATFORM } from '@raydium-io/raydium-sdk-v2'
import * as C from '../src/chain.ts'
import * as LL from '../src/launchlab.ts'

const stub = (f) => { const o = C.conn.getAccountInfo; C.conn.getAccountInfo = f; return () => { C.conn.getAccountInfo = o } }
const e429 = () => { throw new Error('failed to get info about account: Error: 429 Too Many Requests') }

test('RPC failing (429) → unknown, never "missing": the build is retried, it does not fall back to Raydium\'s platform', async () => {
  LL._platformCache(false); let calls = 0; const undo = stub(async () => { calls++; e429() })
  try {
    assert.equal(await LL.platform(), null)
    await assert.rejects(LL.launchPlatform(), /429/, 'a 429-shaped error, so ride429 and the app build again')
    assert.ok(calls >= 3, 'retried before giving up'); assert.equal(LL._platformCache(), false)
  } finally { undo() }
})
test('one 429 then the account → our platform, cached for good (no more reads per launch)', async () => {
  const { PlatformConfig } = await import('@raydium-io/raydium-sdk-v2')
  LL._platformCache(false); let calls = 0; const acct = { data: Buffer.alloc(PlatformConfig.span), owner: LL.PROGRAM, lamports: 1, executable: false }   // zeroed config: decodes
  const undo = stub(async () => { calls++; if (calls === 1) e429(); return acct })
  try {
    assert.ok((await LL.launchPlatform()).equals(LL.PLATFORM_ID), 'ours'); assert.equal(calls, 2, 'one retry after the 429'); assert.equal(LL._platformCache(), true)
    await LL.launchPlatform(); assert.equal(calls, 2, 'cached: no read on the next launch')
  } finally { undo(); LL._platformCache(false) }
})
test('chain answers "no such account" → Raydium\'s platform (ours not set up yet), and nothing is cached', async () => {
  LL._platformCache(false); const undo = stub(async () => null)
  try { assert.ok((await LL.launchPlatform()).equals(LAUNCHPAD_PLATFORM)); assert.equal(LL._platformCache(), false) } finally { undo() }
})
test('cached → our platform with no RPC call at all', async () => {
  LL._platformCache(true); const undo = stub(async () => { throw new Error('should not be called') })
  try { assert.ok((await LL.launchPlatform()).equals(LL.PLATFORM_ID)) } finally { undo(); LL._platformCache(false) }
})
test('the vault\'s block-zero buy names the platform the create used (vault.ts passes built.platformId)', async () => {
  const { readFileSync } = await import('node:fs'); const src = readFileSync(new URL('../src/vault.ts', import.meta.url), 'utf8')
  const calls = src.match(/LL\.buildTrade\([^\n]*fromCreate: true[^\n]*/g) || []
  assert.ok(calls.length >= 1); for (const c of calls) assert.match(c, /platformId: built\.platformId/)
})
