// Move day: export the data dir from the old server, import into a new one. Refused unless the new server is on STANDBY (not trading),
// unless both share VAULT_SECRET + vault wallet (else the chest keys and mint pool can't be decrypted), unless the export came from a
// server on standby (a trading server's snapshot goes stale at once), and never over existing vault data without force. No path escapes.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const A = mkdtempSync(join(tmpdir(), 'move-a-')), B = mkdtempSync(join(tmpdir(), 'move-b-'))
process.env.VAULT_SECRET = 'same-secret'
const MV = await import('../src/move.ts')
const W = 'BANKYubgHd48UQt2VFtEytyE8QyeBHhiuptC3tHmfVPH'
writeFileSync(join(A, 'vaults.json'), JSON.stringify({ v1: { chest: 0.13 } })); writeFileSync(join(A, 'keeper.json'), '{}'); writeFileSync(join(A, 'mints.json'), '{"enc":"x"}')
mkdirSync(join(A, 'tape'), { recursive: true }); writeFileSync(join(A, 'tape', 'M.jsonl'), '{"t":1}\n')

test('export from a server on standby, import into a fresh server on standby: every file arrives byte for byte (tapes only with all=1)', () => {
  process.env.DATA_DIR = A; process.env.STANDBY = '1'
  const ex = MV.exportData(false, W); assert.equal(ex.standby, true); assert.ok(ex.files['vaults.json'] && ex.files['mints.json'] && !ex.files['tape/M.jsonl'], Object.keys(ex.files).join(','))
  assert.ok(MV.exportData(true, W).files['tape/M.jsonl'])
  process.env.DATA_DIR = B; const r = MV.importData(JSON.parse(JSON.stringify(ex)), W); assert.equal(r.written, 3)
  assert.equal(readFileSync(join(B, 'vaults.json'), 'utf8'), readFileSync(join(A, 'vaults.json'), 'utf8'))
  assert.throws(() => MV.importData(ex, W), /already has vault data/, 'never over existing data without force')
  assert.equal(MV.importData(ex, W, true).written, 3)
})

test('refused: a target that is trading, a different VAULT_SECRET or vault wallet, an export from a trading server, a path that escapes', () => {
  process.env.DATA_DIR = A; process.env.STANDBY = '1'; const ex = MV.exportData(false, W)
  process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'move-c-'))
  delete process.env.STANDBY; assert.throws(() => MV.importData(ex, W), /STANDBY=1/); process.env.STANDBY = '1'
  assert.throws(() => MV.importData(ex, 'OtherWallet1111111111111111111111111111111'), /differ from the old server/)
  process.env.VAULT_SECRET = 'other'; assert.throws(() => MV.importData(ex, W), /differ from the old server/); process.env.VAULT_SECRET = 'same-secret'
  assert.throws(() => MV.importData({ ...ex, standby: false }, W), /still trading/)
  assert.throws(() => MV.importData({ ...ex, files: { '../escape.json': 'e30=' } }, W), /refused path/)
  assert.throws(() => MV.importData({ ...ex, files: { '/etc/x': 'e30=' } }, W), /refused path/)
  assert.equal(existsSync(join(process.env.DATA_DIR, 'vaults.json')), false, 'nothing written by a refused import')
})
