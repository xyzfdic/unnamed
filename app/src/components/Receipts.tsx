import React, { useEffect, useState } from 'react'
import * as K from '../lib/desk'
import { S, ago, short } from '../lib/fmt'

/** Every launch with a chest: snipers in the first minute (read off the chain), what the chest sold into buys, fees in — each row links to
 *  the coin and to the vault wallet on solscan, so anyone can check. No per-coin profit: these are what the chests did, from real tx deltas. */
export default function Receipts({ go }: { go: (p: string) => void }) {
  const [r, setR] = useState<K.Receipts | null>(null); const [err, setErr] = useState('')
  useEffect(() => { const f = () => K.receipts().then((x) => { setR(x); setErr('') }).catch((e) => setErr(String(e?.message || e))); f(); const i = setInterval(f, 30000); return () => clearInterval(i) }, [])
  const post = r ? 'https://x.com/intent/post?text=' + encodeURIComponent(`${r.launches} launches on BANKER so far.\n\nsnipers put ${S(r.sniperSol, 1)} SOL in during the first minute. the chests sold ${S(r.soldSol, 1)} SOL into buys across ${r.sales} sales${r.feesSol > 0 ? `, plus ${S(r.feesSol, 1)} SOL in fees` : ''}.\n\nevery tx on chain:`) + '&url=' + encodeURIComponent('https://app.banker.cash/#/receipts') : ''
  return <div className="rc">
    <div className="card" style={{ padding: 16 }}>
      <div className="row"><h2 style={{ margin: 0, fontSize: 18 }}>Launch receipts</h2><span className="sp" />{r && <a className="btn sm" href={post} target="_blank" rel="noreferrer">Post on X ↗</a>}</div>
      <div className="nm" style={{ marginTop: 4, maxWidth: 640, lineHeight: 1.5 }}>Every coin launched with a chest. Snipers are read off the chain for the first minute; sales and fees are booked from the chest's own transactions. Check any row on solscan.</div>
      <div className="tiles rc-tiles">
        <div className="tile"><div className="l">Launches</div><div className="v num">{r ? r.launches : '—'}</div></div>
        <div className="tile"><div className="l">Snipers put in · first minute</div><div className="v num">{r ? S(r.sniperSol, 2) + ' SOL' : '—'}</div></div>
        <div className="tile"><div className="l">Chests sold into buys</div><div className="v num up">{r ? S(r.soldSol, 2) + ' SOL' : '—'}</div><div className="s">{r ? `${r.sales} sales · ${S(r.soldIntoSnipers, 2)} into snipers` : ''}</div></div>
        <div className="tile"><div className="l">Fees into chests</div><div className="v num up">{r ? S(r.feesSol, 3) + ' SOL' : '—'}</div><div className="s">2% of launchpad trades</div></div>
      </div>
    </div>
    <div className="card rc-table"><table><thead><tr><th>Coin</th><th>Launched</th><th className="r">Snipers · 1st min</th><th className="r">Sold into snipers</th><th className="r">Sold into buys</th><th className="r">Fees in</th><th className="r">Check</th></tr></thead><tbody>
      {(!r || !r.rows.length) && <tr><td colSpan={7} className="empty">{err ? 'Server unreachable' : r ? 'No launches yet.' : 'Loading…'}</td></tr>}
      {r?.rows.map((x) => <tr key={x.mint}>
        <td className="tk" style={{ cursor: 'pointer' }} onClick={() => go('coin/' + x.mint)}>{x.symbol || short(x.mint, 4)} <span className={'tag' + (x.venue === 'pump' ? '' : ' live')}>{x.venue === 'pump' ? 'pump.fun' : 'launchpad'}</span><div className="nm">{short(x.mint, 4)}</div></td>
        <td className="dim">{x.launchedAt ? ago(x.launchedAt) + ' ago' : '—'}</td>
        <td className="r num">{x.sniper ? <>{S(x.sniper.buySol, 2)} SOL<div className="nm">{x.sniper.buys} buys · {x.sniper.wallets} wallets</div></> : <span className="dim">—</span>}</td>
        <td className="r num">{x.sniper ? S(x.sniper.soldInto, 3) + ' SOL' : <span className="dim">—</span>}</td>
        <td className="r num up">{S(x.soldSol, 3)} SOL<div className="nm">{x.sales} sales</div></td>
        <td className="r num">{x.feesSol > 0 ? S(x.feesSol, 3) + ' SOL' : <span className="dim">—</span>}</td>
        <td className="r"><a href={`https://solscan.io/token/${x.mint}`} target="_blank" rel="noreferrer">coin ↗</a> · <a href={`https://solscan.io/account/${x.vaultWallet}`} target="_blank" rel="noreferrer">chest ↗</a></td>
      </tr>)}
    </tbody></table></div>
  </div>
}
