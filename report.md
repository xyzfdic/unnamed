# Real-flow backtest · 80 coins · 2026-11-07T16:35Z

Flow rebuilt from 1-min candles so a constant-product pool reproduces each candle (net SOL = S·(√(close/open)−1), gross = candle volume), replayed through the vault rules with a 30% chest. real = actual last/first price; none final should track it (replay sanity check). Caveat: the chest is new SOL entering the coin, so part of the mm/floor uplift is simply capital; the drawdown and desk/dip numbers are the cleaner signal. Coins are the most active of the day (survivorship bias) — the daily run accumulates a broader set over time.

| mode | final (avg) | final (median) | peak | max drawdown | vault P&L (SOL) | final beats no-vault | drawdown beats no-vault |
|---|---|---|---|---|---|---|---|
| none | 10.027x | 1.239x | 14.026x | 63% | 0 | — | — |
| floor | 10.733x | 1.766x | 14.88x | 58% | -10.1 | 79/80 | 80/80 |
| mm | 10.778x | 1.758x | 14.916x | 58% | -14.09 | 80/80 | 80/80 |

| coin | venue | pool SOL | hours | vol SOL | real | none final | mm final | none DD | mm DD | mm vault | captured | desk | dips |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XTEN / SOL | pumpswap | 618.8 | 10.1 | 392397 | 2.378x | 2.982x | 3.405x | 2% | 2% | 185.65→352.06 | 9.8 | 0 | 0 |
| SLINGFOLIO / SOL | pumpswap | 518 | 1.2 | 84702 | 2.445x | 2.608x | 3.041x | 5% | 5% | 155.4→273.18 | 8.91 | 0 | 0 |
| ZEC / SOL | pumpswap | 636.9 | 1 | 73051 | 2.224x | 2.32x | 2.733x | 5% | 4% | 191.08→312.58 | 10.95 | 0 | 0 |
| debtdog / SOL | pumpswap | 557.5 | 0.9 | 62259 | 2.306x | 2.412x | 2.833x | 5% | 5% | 167.25→279.97 | 9.5 | 0 | 0 |
| Alice / SOL | pumpswap | 540.8 | 0.7 | 47260 | 2.285x | 2.372x | 2.79x | 3% | 3% | 162.23→268.92 | 9.37 | 0 | 0 |
| PREDICT / SOL | pumpswap | 851.6 | 1.2 | 43209 | 1.181x | 1.211x | 1.521x | 1% | 1% | 255.49→294.54 | 13.4 | 0 | 0 |
| AODF / SOL | pumpswap | 31182.2 | 16.7 | 37514 | 0x | 0x | 0.039x | 100% | 97% | 9354.67→3753.19 | 74.72 | 0 | 1233.08 |
| HODL / SOL | pumpswap | 131.9 | 16.6 | 35396 | 52.023x | 53.569x | 57.257x | 53% | 51% | 39.56→974.38 | 5.15 | 0 | 18.63 |
| scamsem / PUMP | pumpswap | 319.2 | 14.4 | 33911 | 1.108x | 1.239x | 1.794x | 65% | 57% | 95.77→118.4 | 8.22 | 0 | 34.81 |
| RIPPING / SOL | pumpswap | 17.3 | 2 | 30771 | 403.11x | 478.009x | 488.642x | 69% | 68% | 5.19→1079.08 | 0.92 | 0 | 3.11 |
| BOOMER / SPYx | raydium-launchlab | 132.6 | 22.1 | 6899 | 1.367x | 1.498x | 2.067x | 77% | 72% | 39.79→49.35 | 4.07 | 0 | 13.18 |
| apeGoat / SOL | pump-fun | 68.7 | 1.7 | 6816 | 77.944x | 78.557x | 81.212x | 26% | 26% | 20.6→672.79 | 1.85 | 0 | 1.78 |
| Alice / NVDAx | raydium-launchlab | 131.1 | 16.7 | 6253 | 1.907x | 2.044x | 2.691x | 72% | 68% | 39.34→64.76 | 3.2 | 0 | 11.76 |
| BUOY / SOL | raydium-launchlab | 134.1 | 114.8 | 5305 | 1.629x | 1.752x | 2.151x | 81% | 78% | 40.23→55.93 | 17.42 | 0 | 17.11 |
| Chonky / SOL | raydium-launchlab | 133.9 | 20.9 | 4482 | 2.125x | 2.23x | 2.967x | 73% | 67% | 40.18→67.17 | 4.22 | 0 | 15.31 |
| DACITY / TTWO | raydium-launchlab | 157.5 | 233.5 | 4374 | 2.386x | 2.474x | 2.953x | 55% | 53% | 47.25→82.42 | 24.77 | 0 | 24.45 |
| SQRL / DOGE | raydium-launchlab | 110.1 | 17.9 | 4350 | 1.002x | 1.09x | 1.493x | 83% | 79% | 33.03→34.25 | 2.61 | 0 | 6.01 |
| Return / RAY | raydium-launchlab | 150.1 | 94.6 | 3897 | 2.252x | 2.339x | 3.125x | 66% | 60% | 45.03→81.63 | 11.58 | 0 | 25.21 |
| Yacht / SOL | raydium-launchlab | 112.7 | 20.6 | 3868 | 1.188x | 1.274x | 1.749x | 79% | 74% | 33.81→38 | 2.64 | 0 | 7.93 |
| RUGSEM / scamsem | pump-fun | 36 | 14.4 | 3206 | 0.5x | 0.662x | 1.128x | 85% | 78% | 10.8→8.46 | 0.98 | 0 | 4.96 |
| Casino / DKNG | raydium-launchlab | 113.1 | 21.8 | 3063 | 1.255x | 1.325x | 1.84x | 73% | 66% | 33.93→40.39 | 3.02 | 0 | 9.59 |
| Pooh / SOL | raydium-launchlab | 103.3 | 21.3 | 3050 | 0.969x | 1.04x | 1.471x | 76% | 71% | 31→32.33 | 2.58 | 0 | 7.31 |
| scamgoor / scamsem | pump-fun | 16.8 | 14.4 | 2945 | 2.727x | 3.442x | 4.481x | 87% | 85% | 5.05→11.44 | 0.58 | 0 | 2.68 |
| SIZE / SOL | raydium-launchlab | 117.5 | 15.8 | 2582 | 1.193x | 1.257x | 1.758x | 73% | 67% | 35.26→41.05 | 3.4 | 0 | 10.15 |
| Sweep / SOL | raydium-launchlab | 104.1 | 15.9 | 2344 | 1.032x | 1.089x | 1.591x | 69% | 60% | 31.24→33.79 | 2.83 | 0 | 10.19 |
| Chimps / SOL | pump-fun | 16 | 7.9 | 2305 | 1.657x | 2.127x | 2.939x | 77% | 72% | 4.8→7.34 | 0.6 | 0 | 2.52 |
| whal / SOL | raydium-launchlab | 107.4 | 20.6 | 2138 | 0.972x | 1.02x | 1.415x | 77% | 71% | 32.23→32.99 | 2.32 | 0 | 5.72 |
| kfc / SOL | pump-fun | 87.3 | 0.9 | 2107 | 68.722x | 68.859x | 71.834x | 75% | 72% | 26.19→780.28 | 2.4 | 0 | 4.82 |
| VYNEX / PUMP | pump-fun | 20.1 | 19.8 | 1993 | 4.525x | 5.041x | 6.219x | 78% | 73% | 6.04→18.92 | 0.56 | 0 | 2.74 |
| PAYDAY / SOL | pump-fun | 13.8 | 7.6 | 1985 | 2.043x | 2.573x | 3.367x | 87% | 83% | 4.15→7.23 | 0.39 | 0 | 1.66 |
| Molly / SOL | pump-fun | 18 | 23.8 | 1950 | 1.284x | 1.591x | 2.264x | 81% | 77% | 5.4→6.99 | 0.46 | 0 | 2.35 |
| UEHI / SPCXx | raydium-launchlab | 112.3 | 12.5 | 1885 | 0.9x | 0.94x | 1.368x | 64% | 57% | 33.7→34.96 | 2.87 | 0 | 8.76 |
| LUNA / SOL | raydium-launchlab | 206.9 | 0.8 | 1867 | 1.958x | 1.978x | 2.559x | 51% | 45% | 62.08→95.76 | 3.74 | 0 | 12.88 |
| CLEFT / SOL | pump-fun | 15.7 | 10.7 | 1857 | 2.735x | 3.223x | 4.187x | 81% | 77% | 4.72→9.99 | 0.43 | 0 | 2.18 |
| FATCAT / SPYx | raydium-launchlab | 111.5 | 13.9 | 1851 | 0.991x | 1.032x | 1.427x | 69% | 62% | 33.45→35.24 | 2.45 | 0 | 5.84 |
| MRNA / MRNA | raydium-launchlab | 163 | 15.1 | 1835 | 1.694x | 1.717x | 2.243x | 48% | 41% | 48.9→70.1 | 4.01 | 0 | 10.3 |
| SEASHELL / MUSK4 | raydium-launchlab | 111.3 | 17 | 1801 | 0.83x | 0.866x | 1.21x | 62% | 55% | 33.39→33.07 | 2.69 | 0 | 5.06 |
| ISK / ANTHRP | raydium-launchlab | 141.7 | 20.7 | 1735 | 1.014x | 1.037x | 1.438x | 69% | 63% | 42.52→44.78 | 2.8 | 0 | 7.39 |
| TJR / QQQx | raydium-launchlab | 110.9 | 21.1 | 1715 | 1.107x | 1.141x | 1.536x | 63% | 58% | 33.28→37.66 | 2.45 | 0 | 5.02 |
| LAURA / MSTRx | raydium-launchlab | 105.2 | 21.4 | 1711 | 1.016x | 1.057x | 1.514x | 62% | 55% | 31.55→33.78 | 2.46 | 0 | 8.21 |
| ROCCO / TTWO | raydium-launchlab | 135.9 | 48.6 | 1707 | 1.312x | 1.336x | 1.774x | 69% | 62% | 40.77→48.51 | 6.23 | 0 | 9.89 |
| Pooh / SOL | raydium-launchlab | 103 | 13.8 | 1682 | 0.994x | 1.034x | 1.466x | 71% | 65% | 30.91→32.45 | 2.56 | 0 | 7.28 |
| scamhil / scamsem | pump-fun | 15.8 | 14.6 | 1626 | 1.391x | 1.685x | 2.353x | 86% | 82% | 4.75→6.53 | 0.47 | 0 | 1.98 |
| MINERS / Diamond | pump-fun | 12.4 | 27 | 1615 | 2.1x | 2.563x | 3.373x | 89% | 87% | 3.71→6.41 | 1.24 | 0 | 2.39 |
| NIGGA / SOL | raydium-launchlab | 113.6 | 19.2 | 1548 | 1.317x | 1.362x | 1.875x | 57% | 48% | 34.07→42.73 | 2.77 | 0 | 8.89 |
| scamsem / SOL | pump-fun | 15.1 | 20 | 1462 | 3.527x | 3.971x | 4.959x | 83% | 79% | 4.52→12.94 | 0.72 | 0 | 2.13 |
| Azure / HIMS | pump-fun | 16 | 10.1 | 1451 | 1.446x | 1.722x | 2.454x | 79% | 74% | 4.81→6.22 | 0.43 | 0 | 2.23 |
| HABIBI / SOL | pump-fun | 15.2 | 21.7 | 1424 | 1.1x | 1.357x | 1.961x | 84% | 79% | 4.56→5.46 | 0.48 | 0 | 1.95 |
| T&amp;B6900 / GRND | pump-fun | 19.2 | 2.4 | 1372 | 2.131x | 2.391x | 3.164x | 76% | 71% | 5.76→9.97 | 0.55 | 0 | 2.28 |
| JIM / SOL | raydium-launchlab | 106.9 | 12.5 | 1367 | 0.97x | 1.006x | 1.394x | 74% | 68% | 32.06→33.59 | 2.57 | 0 | 5.68 |
| fone / SOL | pump-fun | 16 | 4.8 | 1362 | 4.491x | 4.94x | 6.11x | 71% | 66% | 4.8→15.31 | 0.45 | 0 | 2.19 |
| COOKD / SOL | pump-fun | 14.1 | 11.3 | 1354 | 2.134x | 2.488x | 3.324x | 77% | 72% | 4.24→7.55 | 0.48 | 0 | 1.97 |
| GHOST / SOL | pump-fun | 16.6 | 14.2 | 1339 | 3.064x | 3.419x | 4.372x | 68% | 63% | 4.97→12.76 | 0.6 | 0 | 2.29 |
| Jarothy / SOL | pump-fun | 20.7 | 7.6 | 1280 | 2.45x | 2.682x | 3.51x | 72% | 65% | 6.22→12.79 | 0.65 | 0 | 2.58 |
| memecoin / SOL | pump-fun | 18.9 | 3.7 | 1279 | 1.008x | 1.182x | 1.721x | 81% | 75% | 5.67→5.94 | 0.44 | 0 | 2.01 |
| DNA / scamsem | pump-fun | 10.8 | 14 | 1269 | 2.266x | 2.703x | 3.545x | 87% | 84% | 3.23→6.01 | 0.32 | 0 | 1.38 |
| cutie / RDDT | pump-fun | 15.7 | 20.7 | 1266 | 0.982x | 1.188x | 1.764x | 88% | 84% | 4.72→4.73 | 0.42 | 0 | 1.94 |
| Scamsem / SOL | raydium-launchlab | 103.1 | 16.7 | 1215 | 1.048x | 1.08x | 1.512x | 58% | 50% | 30.94→34.62 | 2.66 | 0 | 7.02 |
| ILY / SPCX | pump-fun | 19.9 | 14.6 | 1133 | 0.713x | 0.838x | 1.218x | 71% | 64% | 5.96→5.8 | 0.35 | 0 | 1.28 |
| MINT / SOL | raydium-launchlab | 18.2 | 6.9 | 1071 | 0.759x | 0.894x | 1.302x | 90% | 87% | 5.45→4.86 | 0.34 | 0 | 1.26 |
| CHARITY / SOL | raydium-launchlab | 115.9 | 6.6 | 1042 | 0.734x | 0.754x | 1.092x | 58% | 49% | 34.76→32.69 | 1.9 | 0 | 5.15 |
| FATCAT / SOL | raydium-launchlab | 105.4 | 18.7 | 1032 | 0.876x | 0.898x | 1.272x | 62% | 54% | 31.62→31.81 | 2.16 | 0 | 5.43 |
| Float / SOL | raydium-launchlab | 103.7 | 13.9 | 1019 | 1.016x | 1.04x | 1.419x | 56% | 49% | 31.12→33.78 | 2.4 | 0 | 4.73 |
| FLOAT / SOL | raydium-launchlab | 101.6 | 15 | 985 | 0.949x | 0.972x | 1.348x | 51% | 43% | 30.49→32.38 | 1.93 | 0 | 4.6 |
| AGARTHA / MNST | raydium-launchlab | 114.5 | 18.3 | 975 | 0.98x | 1.001x | 1.416x | 54% | 47% | 34.35→36.86 | 2.5 | 0 | 7.17 |
| INCOME / PRIVACY | raydium-launchlab | 111.6 | 15.8 | 956 | 0.927x | 0.952x | 1.322x | 42% | 35% | 33.49→35.31 | 2.18 | 0 | 5.02 |
| Scamsum / SOL | raydium-launchlab | 99.5 | 13.3 | 912 | 0.98x | 1.008x | 1.392x | 57% | 50% | 29.84→31.72 | 1.85 | 0 | 4.49 |
| MAX / METAx | raydium-launchlab | 118.1 | 20.1 | 905 | 0.886x | 0.905x | 1.268x | 53% | 45% | 35.43→36.41 | 2.29 | 0 | 5.35 |
| TESTICLE / OPENAI | raydium-launchlab | 76.5 | 6.7 | 902 | 1.074x | 1.109x | 1.515x | 71% | 65% | 22.94→25.01 | 1.88 | 0 | 4.1 |
| UEHI / FRONTIER | raydium-launchlab | 101.5 | 1.4 | 899 | 0.874x | 0.9x | 1.295x | 52% | 44% | 30.44→31.35 | 2.29 | 0 | 6.4 |
| POOH / SOL | raydium-launchlab | 105 | 4.7 | 899 | 0.88x | 0.905x | 1.219x | 38% | 32% | 31.49→32.45 | 2.2 | 0 | 2.6 |
| Scamcoin / SOL | raydium-launchlab | 101.6 | 10.6 | 897 | 0.993x | 1.015x | 1.395x | 64% | 57% | 30.48→32.31 | 2.15 | 0 | 4.67 |
| CHARITY / SOL | raydium-launchlab | 100 | 4.9 | 881 | 0.979x | 1.001x | 1.378x | 54% | 47% | 30.01→32.22 | 2.18 | 0 | 4.6 |
| PINU / PRIVACY | raydium-launchlab | 110.5 | 2.6 | 873 | 0.916x | 0.936x | 1.303x | 56% | 48% | 33.14→34.38 | 2.27 | 0 | 5.04 |
| LIKEJOSE / SPCXx | raydium-launchlab | 106.4 | 16.2 | 808 | 0.951x | 0.97x | 1.358x | 61% | 53% | 31.91→33.47 | 2.05 | 0 | 5.41 |
| scamlon / SOL | raydium-launchlab | 100.1 | 4.1 | 766 | 0.976x | 0.994x | 1.366x | 48% | 40% | 30.03→32.27 | 2.27 | 0 | 4.53 |
| WMNST / SOL | raydium-launchlab | 104.7 | 7 | 763 | 0.881x | 0.897x | 1.256x | 57% | 50% | 31.4→31.93 | 2.22 | 0 | 4.79 |
| greg / SOL | raydium-launchlab | 104.5 | 11.5 | 707 | 1.061x | 1.084x | 1.48x | 52% | 45% | 31.34→34.67 | 1.96 | 0 | 4.71 |
| MMC / SOL | raydium-launchlab | 101.9 | 3 | 697 | 0.944x | 0.96x | 1.337x | 45% | 37% | 30.57→32.58 | 1.8 | 0 | 4.56 |
| FISH / SOL | raydium-launchlab | 100.1 | 3.6 | 642 | 0.977x | 0.993x | 1.374x | 42% | 35% | 30.04→32.71 | 1.81 | 0 | 4.49 |