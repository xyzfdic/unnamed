// Move day copy: OLD=<url of the old server> NEW=<url of the new one> ADMIN_KEY=<same on both> node --experimental-strip-types scripts/move.ts
// Both servers must already be on STANDBY=1 (the script checks). Prints what was copied; then set STANDBY=0 on the NEW one only.
const OLD = (process.env.OLD || '').replace(/\/$/, ''), NEW = (process.env.NEW || '').replace(/\/$/, ''), K = process.env.ADMIN_KEY || ''
if (!OLD || !NEW || !K) { console.log('set OLD, NEW and ADMIN_KEY'); process.exit(1) }
const health = async (u: string) => (await fetch(u + '/health', { signal: AbortSignal.timeout(20000) })).json() as Promise<any>
const [ho, hn] = await Promise.all([health(OLD), health(NEW)])
console.log('old', ho.commit, 'standby', !!ho.standby, 'vault wallet', ho.vaultWallet, '| new', hn.commit, 'standby', !!hn.standby, 'vault wallet', hn.vaultWallet)
if (!ho.standby || !hn.standby) { console.log('both servers must be on STANDBY=1 before the copy — nothing copied'); process.exit(1) }
if (ho.vaultWallet !== hn.vaultWallet) { console.log('the two servers use different vault wallets (VAULT_KEY) — nothing copied'); process.exit(1) }
const ex: any = await (await fetch(`${OLD}/admin/export?key=${encodeURIComponent(K)}${process.env.ALL === '1' ? '&all=1' : ''}`, { signal: AbortSignal.timeout(120000) })).json()
if (!ex?.files) { console.log('export failed', JSON.stringify(ex).slice(0, 200)); process.exit(1) }
console.log('exported', ex.count, 'files', (ex.bytes / 1e6).toFixed(2), 'MB')
const r: any = await (await fetch(`${NEW}/admin/import?key=${encodeURIComponent(K)}${process.env.FORCE === '1' ? '&force=1' : ''}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ex), signal: AbortSignal.timeout(300000) })).json()
console.log('import', JSON.stringify(r))
