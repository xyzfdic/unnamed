# Real-flow backtest · 69 coins · 2026-11-13T18:12Z

Flow rebuilt from 1-min candles so a constant-product pool reproduces each candle (net SOL = S·(√(close/open)−1), gross = candle volume), replayed through the vault rules with a 30% chest. real = actual last/first price; none final should track it (replay sanity check). Caveat: the chest is new SOL entering the coin, so part of the mm/floor uplift is simply capital; the drawdown and desk/dip numbers are the cleaner signal. Coins are the most active of the day (survivorship bias) — the daily run accumulates a broader set over time.

| mode | final (avg) | final (median) | peak | max drawdown | vault P&L (SOL) | final beats no-vault | drawdown beats no-vault |
|---|---|---|---|---|---|---|---|
| none | 3.244x | 1.228x | 7.313x | 61% | 0 | — | — |
| floor | 3.835x | 1.711x | 8.116x | 56% | 29.81 | 69/69 | 67/69 |
| mm | 3.853x | 1.691x | 8.121x | 56% | 28.6 | 69/69 | 67/69 |

| coin | venue | pool SOL | hours | vol SOL | real | none final | mm final | none DD | mm DD | mm vault | captured | desk | dips |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ANTH / SOL | pumpswap | 493 | 14.6 | 479832 | 2.98x | 4.219x | 4.678x | 2% | 2% | 147.89→354.49 | 7.9 | 0 | 0 |
| FOOD / SOL | pumpswap | 380.9 | 16.7 | 117327 | 4.254x | 4.734x | 5.666x | 71% | 67% | 114.28→358.71 | 9.4 | 0 | 34.26 |
| PICO / SOL | pumpswap | 205.2 | 1 | 91553 | 3.786x | 5.142x | 5.66x | 1% | 1% | 61.55→171.73 | 3.26 | 0 | 0 |
| AI / SOL | pumpswap | 574 | 1 | 76106 | 2.384x | 2.508x | 2.936x | 5% | 4% | 172.2→295.23 | 9.84 | 0 | 0 |
| JENSWAN / SOL | pumpswap | 674.2 | 0.8 | 57138 | 1.828x | 1.893x | 2.27x | 4% | 3% | 202.27→293.64 | 11.48 | 0 | 0 |
| inuhao / SOL | pumpswap | 689.6 | 16.7 | 54211 | 2.222x | 2.285x | 2.891x | 45% | 42% | 206.87→361.17 | 14.68 | 0 | 42.78 |
| mihao / SOL | pumpswap | 2870.2 | 16.7 | 45688 | 0.881x | 0.884x | 1.157x | 25% | 22% | 861.05→865.6 | 41.51 | 0 | 0 |
| AI / NVDAx | pumpswap | 469.2 | 16.7 | 15120 | 0.373x | 0.401x | 0.73x | 86% | 75% | 140.75→108.37 | 9.07 | 0 | 44.8 |
| RWA / OPNW | raydium-launchlab | 170.5 | 65.8 | 7996 | 1.149x | 1.228x | 1.691x | 85% | 80% | 51.16→55.14 | 8.69 | 0 | 16.55 |
| CHAIRMAN / FOOD | pump-fun | 38.9 | 17.6 | 5154 | 18.824x | 20.166x | 22.725x | 82% | 80% | 11.66→112.22 | 1.55 | 0 | 6.73 |
| Sakura / Punch | pump-fun | 19 | 9 | 3372 | 3.101x | 3.923x | 5.067x | 89% | 86% | 5.7→12.94 | 0.66 | 0 | 3.17 |
| SI / NVDAx | pump-fun | 18.5 | 20 | 3227 | 0.699x | 1.086x | 1.573x | 88% | 84% | 5.56→5.44 | 0.31 | 0 | 1.75 |
| RUGME / SOL | pump-fun | 89.7 | 0.3 | 3006 | 67.374x | 67.514x | 69.496x | 16% | 16% | 26.92→753.28 | 2.7 | 0 | 0 |
| SHIT / SOL | pump-fun | 20.3 | 17.1 | 2537 | 1.698x | 2.095x | 2.919x | 84% | 79% | 6.1→11.42 | 0.58 | 0 | 3.21 |
| Tek / SOL | pump-fun | 25.4 | 7.5 | 2530 | 2.367x | 2.746x | 3.582x | 61% | 55% | 7.61→16.73 | 0.68 | 0 | 3.19 |
| Claude / SOL | pump-fun | 23.9 | 8.7 | 2383 | 0.466x | 0.64x | 1.008x | 83% | 77% | 7.18→5.56 | 0.51 | 0 | 2.11 |
| Toy / SOL | pump-fun | 16.5 | 17.2 | 2243 | 1.639x | 2.076x | 2.864x | 85% | 81% | 4.96→7.7 | 0.46 | 0 | 2.38 |
| BREAD / SOL | pump-fun | 21.9 | 1.9 | 2070 | 1.25x | 1.526x | 2.183x | 82% | 77% | 6.57→8.01 | 0.65 | 0 | 2.88 |
| LEAP / SOL | pump-fun | 15.6 | 11.8 | 1985 | 1.117x | 1.47x | 2.042x | 84% | 80% | 4.69→5.57 | 0.52 | 0 | 1.77 |
| NEXUS / SOL | pump-fun | 15 | 17.8 | 1939 | 4.325x | 4.992x | 6.146x | 69% | 65% | 4.5→13.04 | 0.46 | 0 | 2.04 |
| SI / NVDAx | raydium-launchlab | 103.1 | 19.9 | 1938 | 0.899x | 0.948x | 1.395x | 67% | 60% | 30.94→31.32 | 2.43 | 0 | 8.61 |
| BUX / TTWO | pump-fun | 21 | 20.2 | 1904 | 2.742x | 3.124x | 4.144x | 81% | 77% | 6.3→14.29 | 0.9 | 0 | 3.59 |
| JHOEL / SOL | pump-fun | 14.4 | 5.6 | 1861 | 7.833x | 8.711x | 9.9x | 72% | 67% | 4.32→19.58 | 0.39 | 0 | 1.16 |
| LocketSnug / SOL | pump-fun | 16.5 | 3.1 | 1824 | 1.139x | 1.446x | 2.086x | 69% | 62% | 4.94→6.07 | 0.41 | 0 | 2.15 |
| paperfox / HYPE | pump-fun | 17.1 | 5.1 | 1775 | 0.936x | 1.188x | 1.69x | 84% | 80% | 5.14→5.67 | 0.51 | 0 | 1.71 |
| MIGUELITO / SOL | pump-fun | 15.7 | 5.8 | 1773 | 2.616x | 3.07x | 4.005x | 69% | 65% | 4.72→9.79 | 0.46 | 0 | 2.2 |
| BREAD / SOL | pump-fun | 20.9 | 2.3 | 1736 | 2.869x | 3.215x | 4.132x | 74% | 69% | 6.28→16.02 | 0.6 | 0 | 2.69 |
| Wizardio / SOL | pump-fun | 13.4 | 3.9 | 1663 | 1.372x | 1.749x | 2.437x | 81% | 76% | 4.03→5.34 | 0.41 | 0 | 1.76 |
| SU / AMD | pump-fun | 18.2 | 22 | 1651 | 0.698x | 0.901x | 1.369x | 88% | 84% | 5.47→5.04 | 0.49 | 0 | 1.96 |
| Microshit / MSFTx | pump-fun | 17.2 | 6.8 | 1648 | 1.18x | 1.444x | 2.056x | 83% | 79% | 5.16→6.5 | 0.42 | 0 | 1.99 |
| RINGSPAD / SOL | raydium-launchlab | 15.8 | 69.1 | 1613 | 4.913x | 5.49x | 6.471x | 88% | 84% | 4.75→15.73 | 2.33 | 0 | 3.31 |
| X / SPCX | pump-fun | 26.2 | 19.7 | 1555 | 2.87x | 3.122x | 3.988x | 64% | 60% | 7.87→19.94 | 0.83 | 0 | 3.13 |
| SPSC / WLFI | pump-fun | 34.8 | 22.2 | 1533 | 0.778x | 0.869x | 1.29x | 78% | 73% | 10.43→9.95 | 0.9 | 0 | 2.94 |
| Mihao / mihao | pump-fun | 16.8 | 22.3 | 1512 | 1.782x | 2.079x | 2.9x | 81% | 77% | 5.03→7.44 | 0.52 | 0 | 2.54 |
| TEMPO / SOL | pump-fun | 15.6 | 3.8 | 1488 | 1.055x | 1.309x | 1.947x | 85% | 80% | 4.69→5.05 | 0.37 | 0 | 2.1 |
| UwU-Chan / HYPE | pump-fun | 18.8 | 4.1 | 1481 | 1.065x | 1.269x | 1.839x | 78% | 72% | 5.63→6.19 | 0.51 | 0 | 2.15 |
| Jensenify / NVDA | pump-fun | 15.7 | 14.2 | 1479 | 1.013x | 1.257x | 1.788x | 82% | 77% | 4.72→5.31 | 0.46 | 0 | 1.64 |
| jacket / NVDAx | pump-fun | 18.7 | 19 | 1472 | 0.693x | 0.857x | 1.273x | 81% | 75% | 5.61→5.1 | 0.43 | 0 | 1.57 |
| UNEMPLOYED / SOL | pump-fun | 13.6 | 8.4 | 1470 | 1.518x | 1.865x | 2.468x | 86% | 82% | 4.07→5.6 | 0.29 | 0 | 1.16 |
| QUATS / SPCX | pump-fun | 15.3 | 18.3 | 1460 | 1.018x | 1.268x | 1.887x | 84% | 79% | 4.6→4.92 | 0.49 | 0 | 2.14 |
| Origami / HYPE | pump-fun | 17.7 | 4.8 | 1429 | 0.966x | 1.17x | 1.59x | 89% | 86% | 5.3→5.54 | 0.3 | 0 | 0.93 |
| LSTR / TTWO | pump-fun | 16 | 17.9 | 1425 | 0.966x | 1.186x | 1.594x | 87% | 84% | 4.8→5.14 | 0.41 | 0 | 0.88 |
| MOON / SOL | raydium-launchlab | 106.3 | 20 | 1251 | 0.936x | 0.969x | 1.346x | 64% | 57% | 31.89→33.05 | 2.59 | 0 | 5.52 |
| AI / NVDA | raydium-launchlab | 96.5 | 18.7 | 1143 | 0.928x | 0.96x | 1.341x | 66% | 59% | 28.94→29.85 | 2.23 | 0 | 5.07 |
| Together / SOL | raydium-launchlab | 39.1 | 49.9 | 1040 | 7.226x | 7.391x | 8.307x | 55% | 51% | 11.72→49.52 | 3.08 | 0 | 3.71 |
| zPEPE / ZEC | raydium-launchlab | 149.5 | 63.7 | 964 | 2.922x | 2.934x | 3.277x | 29% | 24% | 44.84→82.57 | 11.46 | 0 | 3.71 |
| Cling / SOL | raydium-launchlab | 17.3 | 5.5 | 678 | 0.976x | 1.075x | 1.484x | 81% | 76% | 5.19→5.34 | 0.28 | 0 | 0.9 |
| ECLIPSE / SOL | raydium-launchlab | 101.8 | 9.1 | 597 | 0.924x | 0.938x | 1.267x | 45% | 39% | 30.54→31.64 | 1.68 | 0 | 2.49 |
| SHIELD / SOL | raydium-launchlab | 24.9 | 1.4 | 565 | 7.688x | 7.79x | 8.955x | 45% | 41% | 7.47→31.56 | 0.7 | 0 | 2.02 |
| ASPH / SOL | raydium-launchlab | 25.9 | 45 | 530 | 5.003x | 5.138x | 6.107x | 68% | 60% | 7.77→27.93 | 1.47 | 0 | 2.94 |
| FROCK / SOL | raydium-launchlab | 104.1 | 5.8 | 514 | 0.895x | 0.906x | 1.228x | 35% | 29% | 31.22→32.22 | 1.82 | 0 | 2.57 |
| BACKBURN / SOL | raydium-launchlab | 17.7 | 5.4 | 508 | 0.957x | 1.034x | 1.545x | 80% | 74% | 5.3→5.36 | 0.59 | 0 | 1.99 |
| GLASSMINT / SOL | raydium-launchlab | 14.8 | 2.9 | 465 | 1.036x | 1.144x | 1.523x | 38% | 32% | 4.44→5.14 | 0 | 0 | 0.32 |
| NVIDIUSSY / NVDAx | raydium-launchlab | 95.9 | 1.9 | 451 | 0.968x | 0.985x | 1.317x | 29% | 24% | 28.77→31 | 1.83 | 0 | 2.38 |
| RING0 / SOL | raydium-launchlab | 78.9 | 17.8 | 378 | 0.855x | 0.867x | 1.227x | 55% | 47% | 23.67→23.68 | 1.38 | 0 | 3.53 |
| COMET / SOL | raydium-launchlab | 17.1 | 23.8 | 373 | 0.897x | 0.949x | 1.365x | 77% | 71% | 5.13→5.08 | 0.41 | 0 | 1.21 |
| BOTNET / SOL | raydium-launchlab | 108.2 | 0.5 | 318 | 1.032x | 1.039x | 1.38x | 34% | 28% | 32.47→35.67 | 2.07 | 0 | 2.69 |
| Builders / SOL | raydium-launchlab | 101.6 | 3.3 | 305 | 0.933x | 0.94x | 1.267x | 38% | 31% | 30.48→31.94 | 1.86 | 0 | 2.52 |
| longevity / SOL | raydium-launchlab | 121.5 | 5.4 | 280 | 0.635x | 0.641x | 0.943x | 36% | 28% | 36.44→32.85 | 0 | 0 | 2.59 |
| NVIDIUSSY / NVDA | raydium-launchlab | 96.9 | 0.3 | 263 | 0.908x | 0.919x | 1.228x | 9% | 8% | 29.07→30.06 | 0 | 0 | 0 |
| BUILDER / SOL | raydium-launchlab | 107.1 | 12.2 | 260 | 0.985x | 0.991x | 1.325x | 29% | 23% | 32.14→34.79 | 1.99 | 0 | 2.66 |
| OUTCRY / SOL | raydium-launchlab | 69 | 4.5 | 245 | 0.995x | 0.999x | 1.383x | 49% | 41% | 20.7→22.36 | 1.25 | 0 | 3.1 |
| HOP / SOL | raydium-launchlab | 104 | 6.8 | 219 | 0.862x | 0.867x | 1.182x | 39% | 32% | 31.21→31.63 | 1.89 | 0 | 2.57 |
| SI / NVDA | raydium-launchlab | 99.4 | 1.7 | 214 | 0.892x | 0.897x | 1.169x | 17% | 15% | 29.82→30.25 | 1.56 | 0 | 0 |
| BuilderCat / SOL | raydium-launchlab | 99.8 | 13.2 | 176 | 0.969x | 0.969x | 1.311x | 35% | 29% | 29.94→32.25 | 1.25 | 0 | 2.35 |
| SA / SOL | raydium-launchlab | 26.8 | 12.4 | 136 | 0.819x | 0.836x | 1.203x | 69% | 62% | 8.04→7.81 | 0.47 | 0 | 1.35 |
| opcode / SOL | raydium-launchlab | 71.5 | 1.9 | 129 | 0.789x | 0.794x | 1.101x | 42% | 36% | 21.44→20.94 | 1.11 | 0 | 1.73 |
| RIVET / SOL | raydium-launchlab | 17.5 | 3.4 | 117 | 1.109x | 1.126x | 1.52x | 60% | 54% | 5.24→5.88 | 0.43 | 0 | 0.82 |
| MOKA / SOL | raydium-launchlab | 21.8 | 0.3 | 99 | 0.685x | 0.696x | 1.033x | 61% | 53% | 6.53→5.96 | 0.35 | 0 | 1.07 |