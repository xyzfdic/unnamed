// read-only: quality of today's waitlist spike — aggregates only (no wallets or handles printed)
import { PublicKey } from '@solana/web3.js'
const { conn } = await import('../src/chain.ts')
const S = 'https://unnamed-server.onrender.com'; const K = process.env.ADMIN_KEY || ''
const w: any = await (await fetch(S + '/admin/waitlist?key=' + encodeURIComponent(K), { signal: AbortSignal.timeout(30000) })).json(); const rows: any[] = w?.rows || []
const hr = (t: number) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).format(t)
const today = rows.filter((r) => r.t > Date.parse('2026-11-02T06:00:00Z')); const before = rows.filter((r) => r.t <= Date.parse('2026-11-02T06:00:00Z'))
const byHr: Record<string, number> = {}; for (const r of today) byHr[hr(r.t)] = (byHr[hr(r.t)] || 0) + 1
console.log('TODAY BY HOUR (Houston)', Object.entries(byHr).sort().map(([h, n]) => `${h.slice(-2)}h:${n}`).join(' '))
const gaps = today.map((r) => r.t).sort((a, b) => a - b).map((t, i, a) => i ? t - a[i - 1] : 0).slice(1); gaps.sort((a, b) => a - b)
console.log('GAP BETWEEN SIGNUPS today: median', gaps.length ? (gaps[gaps.length >> 1] / 1000).toFixed(1) : '-', 's · under 2 s:', gaps.filter((g) => g < 2000).length, 'of', gaps.length)
const uaCount: Record<string, number> = {}; for (const r of today) uaCount[r.ua || ''] = (uaCount[r.ua || ''] || 0) + 1
const top = Object.entries(uaCount).sort((a, b) => b[1] - a[1]); console.log('DISTINCT USER AGENTS today', top.length, '· top 3:', top.slice(0, 3).map(([u, n]) => `${n}× ${u.slice(0, 70)}`).join(' || '))
const xs = today.map((r) => String(r.x || '')).filter(Boolean); console.log('X HANDLES today', xs.length, 'of', today.length, '· ending in 4+ digits', xs.filter((x) => /\d{4,}$/.test(x)).length, '· before today: handles', before.filter((r) => r.x).length, 'of', before.length)
async function empties(list: any[]) { let empty = 0, n = 0, low = 0; for (let i = 0; i < list.length; i += 100) { const ks = list.slice(i, i + 100).map((r) => { try { return new PublicKey(r.wallet) } catch { return null } }).filter(Boolean) as PublicKey[]; const infos = await conn.getMultipleAccountsInfo(ks).catch(() => null); if (!infos) continue; for (const a of infos) { n++; if (!a) empty++; else if (a.lamports < 0.01e9) low++ } await new Promise((r) => setTimeout(r, 400)) } return { n, empty, low } }
const et = await empties(today), eb = await empties(before)
console.log('WALLETS today: checked', et.n, '· never used (no account)', et.empty, '· under 0.01 SOL', et.low, '|| before today: checked', eb.n, '· never used', eb.empty, '· under 0.01', eb.low)
