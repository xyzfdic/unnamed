// read-only: waitlist breakdown — aggregates only (no wallets or handles printed: this output lands on a branch)
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const get = async (p: string) => { try { return await (await fetch(S + p, { signal: AbortSignal.timeout(30000) })).json() } catch (e: any) { return { err: String(e?.message || e) } } }
const w: any = await get('/admin/waitlist?key=' + encodeURIComponent(K)); const rows: any[] = w?.rows || []
console.log('WAITLIST here', w?.count, '· offsite', w?.offsite, '· total', w?.total, w?.err ? 'ERR ' + w.err : '')
const day = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t)
const byDay: Record<string, number> = {}; for (const r of rows) byDay[day(r.t)] = (byDay[day(r.t)] || 0) + 1
console.log('BY DAY (Houston)', Object.entries(byDay).sort().map(([d, n]) => `${d}: ${n}`).join(' · '))
const withX = rows.filter((r) => r.x).length; console.log('WITH X HANDLE', withX, 'of', rows.length)
const ua = (s: string) => /iPhone|iPad/i.test(s) ? 'iphone' : /Android/i.test(s) ? 'android' : /Mobile/i.test(s) ? 'other mobile' : s ? 'desktop' : 'unknown'
const dev: Record<string, number> = {}; for (const r of rows) dev[ua(r.ua || '')] = (dev[ua(r.ua || '')] || 0) + 1; console.log('DEVICES', JSON.stringify(dev))
const inapp = rows.filter((r) => /Phantom|Solflare|Backpack|Twitter|TwitterAndroid|Instagram|FBAN|FBAV/i.test(r.ua || '')).length; console.log('FROM IN-APP BROWSERS (wallet / x / ig)', inapp)
const first = rows.length ? Math.min(...rows.map((r) => r.t)) : 0, last = rows.length ? Math.max(...rows.map((r) => r.t)) : 0
console.log('FIRST', first ? new Date(first).toISOString() : '-', 'LAST', last ? new Date(last).toISOString() : '-')
const xs = rows.map((r) => String(r.x || '').toLowerCase()).filter(Boolean); console.log('DUPLICATE X HANDLES', xs.length - new Set(xs).size)
const red: any = await get('/invite/redeemed?key=' + encodeURIComponent(K)); const redList: any[] = Array.isArray(red) ? red : (red?.rows || red?.redeemed || [])
const redW = new Set(redList.map((x: any) => x.wallet || x.owner || x).filter((x: any) => typeof x === 'string'))
const wl = new Set(rows.map((r) => r.wallet)); console.log('INVITES REDEEMED', redList.length, '· of them on the waitlist', [...redW].filter((x) => wl.has(x)).length, red?.err ? 'ERR ' + red.err : '', Array.isArray(red) ? '' : 'keys:' + Object.keys(red || {}).join(','))
const rc: any = await get('/receipts'); const vs: any[] = await get('/vaults'); const devs = new Set((Array.isArray(vs) ? vs : []).map((v) => v.dev)); console.log('WAITLIST WALLETS THAT LAUNCHED A LIVE CHEST', [...devs].filter((d) => wl.has(d)).length, '· launches total', rc?.launches)
