import React, { useEffect, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import * as K from '../lib/desk'
import { S } from '../lib/fmt'

const PUMP = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
const curveOf = (mint: string) => { try { return PublicKey.findProgramAddressSync([new TextEncoder().encode('bonding-curve'), new PublicKey(mint).toBytes()], PUMP)[0].toBase58() } catch { return '' } }
export type LaunchedInfo = { mint: string; symbol: string; venue: 'pump' | 'launchlab'; vaultId?: string; sig?: string; at: number }

/** Shown the moment a launch lands: the contract address to copy, where to watch it, and the chest selling into the first buyers, live. */
export default function Launched({ info, onClose }: { info: LaunchedInfo; onClose: () => void }) {
  const { mint, symbol, venue } = info
  const [copied, setCopied] = useState(false); const [v, setV] = useState<K.VaultPub | null>(null); const [pair, setPair] = useState(venue === 'pump' ? curveOf(mint) : '')
  const [, tick] = useState(0)
  useEffect(() => { if (venue === 'launchlab') K.llPool(mint).then((p: any) => p?.poolId && setPair(p.poolId)).catch(() => {}) }, [mint, venue])
  // the chest's sales into the first buyers, every 2 s for the first 3 minutes (the sniper report lands at ~3 min)
  useEffect(() => { if (!info.vaultId) return; let stop = false
    const f = () => K.vaultGet(info.vaultId!).then((x) => { if (!stop && x) setV(x) }).catch(() => {}); f()
    const i = setInterval(() => { if (Date.now() - info.at > 240_000) return; f(); tick((n) => n + 1) }, 2000); return () => { stop = true; clearInterval(i) } }, [info.vaultId, info.at])
  const sales = useMemo(() => (v?.activity || []).filter((a) => a.kind === 'capture' && a.t >= info.at - 5000), [v, info.at])
  const soldSol = sales.reduce((a, x) => a + (x.sol || 0), 0)
  const secs = Math.floor((Date.now() - info.at) / 1000)
  const copy = () => { const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500) }
    try { navigator.clipboard.writeText(mint).then(done, () => { selectCa(); done() }) } catch { selectCa(); done() } }
  const selectCa = () => { const el = document.getElementById('ca-text'); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r) }
  const links: [string, string][] = [
    ...(venue === 'pump' ? [['pump.fun', `https://pump.fun/coin/${mint}`]] as [string, string][] : []),
    ['dexscreener', `https://dexscreener.com/solana/${mint}`],
    ...(pair ? [['axiom', `https://axiom.trade/meme/${pair}`]] as [string, string][] : []),
    ['solscan', `https://solscan.io/token/${mint}`],
    ...(info.sig ? [['launch tx', `https://solscan.io/tx/${info.sig}`]] as [string, string][] : []),
  ]
  const post = 'https://x.com/intent/post?text=' + encodeURIComponent(`$${symbol} is live${venue === 'pump' ? ' on pump.fun' : ''}, with a chest that sells into snipers and buys the dips.\n\nCA: ${mint}\n\nbanker.cash`)
  return <div className="modal" onClick={onClose}><div className="box launched" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${symbol} is live`}>
    <div className="row"><h2>{symbol} is live</h2><span className="sp" /><span className="tag live">{venue === 'pump' ? 'pump.fun' : 'BANKER launchpad'}</span></div>
    <div className="lbl" style={{ marginBottom: -6 }}>Contract address</div>
    <div className="ca-box"><code id="ca-text" className="num">{mint}</code><button className="btn sm pri" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button></div>
    <div className="ca-links">{links.map(([n, h]) => <a key={n} href={h} target="_blank" rel="noreferrer">{n} ↗</a>)}</div>
    {info.vaultId && <div className="note" aria-live="polite">
      <div className="row"><b>{v?.armed ? 'Chest is on' : 'Chest switching on…'}</b><span className="sp" /><span className="num dim">{secs < 600 ? `${secs}s since launch` : ''}</span></div>
      <div className="row" style={{ marginTop: 6 }}><span>Sold into buyers so far</span><span className="sp" /><b className="num up" style={{ fontSize: 18 }}>{S(soldSol, 3)} SOL</b></div>
      <div className="nm">{sales.length ? `${sales.length} sale${sales.length === 1 ? '' : 's'}${sales.some((a) => /^sniper tax/.test(a.msg || '')) ? ' · sniper tax: half of each early buy' : ''}` : v?.armed ? 'waiting for the first buys' : 'the chest arms itself a few seconds after the launch lands'}{v?.sniper ? ` · first minute: ${v.sniper.buys} buys, ${S(v.sniper.buySol, 2)} SOL from ${v.sniper.wallets} wallets` : ''}</div>
    </div>}
    <div className="row"><a className="btn" href={post} target="_blank" rel="noreferrer">Post on X ↗</a><span className="sp" /><button className="btn pri" onClick={onClose}>Done</button></div>
  </div></div>
}
