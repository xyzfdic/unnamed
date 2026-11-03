// read-only: the dev wallet of the live pump chest, and its state
const v: any = await (await fetch('https://unnamed-server.onrender.com/vault/mint/fe3hPZHUdMkRdL54pwdUSkgBY4LkH5esocrbSjVBANK', { signal: AbortSignal.timeout(20000) })).json().catch(() => null)
console.log('DEV', v?.dev); console.log('STATE', JSON.stringify({ chest: v?.chest, tokens: v?.tokens, paused: v?.paused, pauseWhy: v?.pauseWhy, price: v?.live?.price, sold: v?.score?.captured, devPaid: v?.devPaid }))
