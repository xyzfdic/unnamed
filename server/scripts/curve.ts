// read-only: what the failed launchpad launches on Nov 3 (~12:30 UTC) were — chest records + the dev wallet on chain (public RPC)
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const RPC = 'https://api.mainnet-beta.solana.com'
const rpc = async (method: string, params: any[]) => { for (let i = 0; i < 5; i++) { const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json()).catch(() => null); if (r?.result !== undefined) return r.result; await new Promise((ok) => setTimeout(ok, 1500 * (i + 1))) } return null }
const DEV = '9VZFDKgCqY73JX1BRrJ5TRgABpawLvb3o9hBRXDSS6tt', BANKY = 'BANKYubgHd48UQt2VFtEytyE8QyeBHhiuptC3tHmfVPH'
const since = Date.parse('2026-11-03T11:00:00Z')
const ex: any = await (await fetch(S + '/admin/export?key=' + encodeURIComponent(K), { signal: AbortSignal.timeout(30000) })).json().catch((e) => ({ err: String(e) }))
const raw = ex?.files?.['vaults.json']; if (!raw) console.log('no vaults.json', Object.keys(ex?.files || {}).slice(0, 20), ex?.err)
const vaults: any = raw ? JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) : {}
const list: any[] = Array.isArray(vaults) ? vaults : Object.values(vaults.vaults || vaults)
for (const v of list) {
  const acts = (v.activity || []).filter((a: any) => a.t >= since)
  if (!acts.length && v.dev !== DEV) continue
  if (!acts.length) continue
  console.log('\nVAULT', String(v.id).slice(0, 8), 'dev', String(v.dev).slice(0, 4), 'venue', v.venue, 'stake', v.stakeSol, 'chest', v.chest, 'armed', v.armed, 'closed', !!v.closedAt, 'mint', String(v.mint || '').slice(0, 6), 'vaultBuySol', v.vaultBuySol, 'devBuy', v.devBuySol, 'fundInBundle', v.fundInBundle, 'pending', JSON.stringify(v.pendingLaunch || null).slice(0, 200))
  for (const a of acts.slice().sort((a: any, b: any) => a.t - b.t).slice(0, 30)) console.log('  ', new Date(a.t).toISOString().slice(11, 19), a.kind, String(a.msg || '').slice(0, 220), a.sig ? 'sig ' + String(a.sig).slice(0, 10) : '')
  if (v.pendingLaunch?.sig) console.log('  pending sig status', JSON.stringify(await rpc('getSignatureStatuses', [[v.pendingLaunch.sig], { searchTransactionHistory: true }])))
}
for (const w of [DEV, BANKY]) console.log('\nBAL', w.slice(0, 4), ((await rpc('getBalance', [w]))?.value ?? NaN) / 1e9)
const sigs: any[] = (await rpc('getSignaturesForAddress', [DEV, { limit: 60 }])) || []
console.log('\nDEV wallet txs 11:30–13:00 UTC')
for (const s of sigs.filter((s) => s.blockTime && s.blockTime * 1000 >= Date.parse('2026-11-03T11:30:00Z') && s.blockTime * 1000 <= Date.parse('2026-11-03T13:00:00Z')).reverse()) {
  const t: any = await rpc('getTransaction', [s.signature, { maxSupportedTransactionVersion: 0, encoding: 'json' }])
  const keys = (t?.transaction?.message?.accountKeys || []).map((k: any) => typeof k === 'string' ? k : k.pubkey); const i = keys.indexOf(DEV)
  console.log(new Date(s.blockTime * 1000).toISOString().slice(11, 19), s.signature.slice(0, 8), s.err ? 'ERR ' + JSON.stringify(s.err) : 'ok', i >= 0 ? `dev ${(t.meta.preBalances[i] / 1e9).toFixed(4)} → ${(t.meta.postBalances[i] / 1e9).toFixed(4)}` : '', (t?.meta?.logMessages || []).filter((l: string) => /Instruction: \w+/.test(l)).map((l: string) => l.replace(/.*Instruction: /, '')).slice(0, 6).join(','))
  await new Promise((ok) => setTimeout(ok, 400))
}
const h: any = await (await fetch(S + '/health')).json().catch(() => null); console.log('\nCOMMIT', h?.commit, 'rpc', h?.rpc, 'landing', h?.beta?.landing, 'keeper', JSON.stringify(h?.beta?.keeper).slice(0, 200))
