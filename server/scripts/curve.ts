// read-only: this morning's pump coin tape (every swap the server saw, public on-chain data) for a policy replay
const r = await fetch('https://unnamed-server.onrender.com/tape/fe3hPZHUdMkRdL54pwdUSkgBY4LkH5esocrbSjVBANK', { signal: AbortSignal.timeout(60000) }); const t = await r.text()
console.log('TAPE ' + t.split('\n').filter(Boolean).length + ' lines'); console.log(t)
