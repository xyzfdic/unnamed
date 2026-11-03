// Move day (e.g. Ohio → Frankfurt): the server's state lives in DATA_DIR on the host's disk — chests and their books, the keeper's hourly
// caps, booked signatures, the …BANK mint pool, invites, waitlist, events. Render can't move a service between regions, so a new service
// is made and the data is copied across. The one rule: two servers must never trade at once — both would sign from the same vault
// wallet and each would read the other's trades as foreign. STANDBY=1 makes a server serve reads only: no ticks, no stream, no claims,
// no signing, every write refused. The order: old → STANDBY=1 · export from it · import into the new one (on STANDBY=1) · new → STANDBY=0.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { createHmac } from 'node:crypto'

const DIR = () => process.env.DATA_DIR || './data'
export const STANDBY = () => process.env.STANDBY === '1'
const BIG = /^(tape|px|meta)\//   // swap tapes, price logs, self-hosted metadata: large and rebuilt or re-served — included with all=1
const SAFE = /^[A-Za-z0-9_.\-]+(\/[A-Za-z0-9_.\-]+)*$/
/** same VAULT_SECRET (decrypts the chest keys and the mint pool) and same vault wallet on both servers, or the copy is refused */
export const fingerprint = (vaultPub: string | null) => createHmac('sha256', process.env.VAULT_SECRET || '').update('banker-move:' + (vaultPub || '')).digest('hex').slice(0, 24)

function walk(root: string, d = root, out: string[] = []) {
  if (!existsSync(d)) return out
  for (const n of readdirSync(d)) { const f = join(d, n); const st = statSync(f); if (st.isDirectory()) walk(root, f, out); else if (st.isFile()) out.push(relative(root, f).split(sep).join('/')) }
  return out
}
export function exportData(all: boolean, vaultPub: string | null) {
  const root = DIR(); const files: Record<string, string> = {}; let bytes = 0
  for (const rel of walk(root).sort()) { if (!all && BIG.test(rel)) continue; if (!SAFE.test(rel)) continue; const b = readFileSync(join(root, rel)); bytes += b.length; files[rel] = b.toString('base64') }
  return { at: Date.now(), standby: STANDBY(), fp: fingerprint(vaultPub), vaultWallet: vaultPub, count: Object.keys(files).length, bytes, files }
}
export function importData(b: any, vaultPub: string | null, force = false) {
  if (!STANDBY()) throw new Error('import only into a server on STANDBY=1 — it must not be trading while its data is replaced')
  if (!b || typeof b.files !== 'object') throw new Error('no files in the body')
  if (b.fp !== fingerprint(vaultPub)) throw new Error('VAULT_SECRET or VAULT_KEY differ from the old server — copy its environment exactly, then import again')
  if (!b.standby && !force) throw new Error('the export was taken from a server that was still trading — set STANDBY=1 on the old server first, export again')
  const root = DIR(); if (existsSync(join(root, 'vaults.json')) && !force) throw new Error('this server already has vault data — pass force=1 to overwrite it')
  const rels = Object.keys(b.files); for (const rel of rels) if (!SAFE.test(rel) || rel.split('/').includes('..')) throw new Error('refused path: ' + rel.slice(0, 60))
  let bytes = 0
  for (const rel of rels) { const buf = Buffer.from(String(b.files[rel]), 'base64'); const f = join(root, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, buf); bytes += buf.length }
  return { written: rels.length, bytes, next: 'restart this service with STANDBY=0 (it loads the data at boot) — only after the old server is on STANDBY=1' }
}
