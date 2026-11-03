# Vamp scan · 2026-11-03T12:04:05.059Z · 125 coins on the board · 12 name families · 9 vamps flagged

## Flagged

| vamp | original | score | age | mcap | evidence |
|---|---|---|---|---|---|
| NORTHKOREA `DUyMLm…` | NORTHKOREA `GiabvA…` | 1 | 1 min | $1K | same ticker · same name · launched 1 min after the original · same deployer wallet · 29% of the original's mcap |
| opa `BHuyUF…` | opa `9mqfen…` | 1 | 1 min | $0K | same ticker · same name · launched 0 min after the original · same deployer wallet · 11% of the original's mcap |
| AI `HuXo7W…` | AI `8ozpQf…` | 0.85 | 1 min | $0K | same ticker · same name · launched 1.7 h after the original · 0% of the original's mcap |
| zkSNARK `81UzTc…` | zkSNARK `D1DPJq…` | 0.8 | 75 min | $2K | same ticker · same name · launched 6 min after the original |
| SPHERE `5rJThQ…` | SPHERE `31SYoq…` | 0.75 | 2 min | $46K | same ticker · same name · launched 9.8 h after the original · 6% of the original's mcap |
| PUMP `Hxqh7F…` | PUMP `pumpCm…` | 0.65 | 14 min | $68K | same ticker · same name · 0% of the original's mcap |
| PUMP `4xwBns…` | PUMP `pumpCm…` | 0.65 | 1 min | $4K | same ticker · same name · 0% of the original's mcap |
| PUMP `F2yp5S…` | PUMP `pumpCm…` | 0.65 | 1 min | $0K | same ticker · same name · 0% of the original's mcap |
| PUMP `J2gawo…` | PUMP `pumpCm…` | 0.65 | 1 min | $3K | same ticker · same name · 0% of the original's mcap |

## Families (clusters with 2+ coins; leader = where the flow is)

- **sphere** → 👑 SPHERE ($736K, score 201.6) · SPHERE ($46K, score 0, vamp)
- **mamesuke** → 👑 MAMESUKE ($1489K, score 455.7) · 豆助 ($15K, score 0.3) · 豆助 ($4K, score 0)
- **wasted** → 👑 WASTED ($1276K, score 164.5) · Wanted ($3K, score 0.1)
- **pump** → 👑 PUMP ($1904025K, score 1098505.1) · PUMP ($68K, score 1, vamp) · PUMP ($4K, score 0, vamp) · PUMP ($0K, score 0, vamp) · PUMP ($3K, score 0, vamp)
- **mogging** → 👑 MOGGING ($15K, score 0.3) · MOGGING ($3K, score 0)
- **ai** → 👑 AI ($64K, score 9.7) · AI ($0K, score 0, vamp)
- **zksnark** → 👑 zkSNARK ($2K, score 0.1) · zkSNARK ($2K, score 0, vamp)
- **capy** → 👑 CAPY ($578K, score 111.3) · CAPY ($275K, score 49)
- **ansem** → 👑 ANSEM ($40258K, score 2851.5) · ANSEM ($41K, score 5.4)
- **northkorea** → 👑 NORTHKOREA ($4K, score 0) · NORTHKOREA ($1K, score 0, vamp) · NORTHKOREA ($0K, score 0)
- **opa** → 👑 opa ($3K, score 0) · opa ($0K, score 0, vamp)
- **goat** → 👑 $GOAT ($5K, score 0) · $GOAT ($0K, score 0)

A flag needs: younger AND smaller than the original, a copied ticker/name, and (unless both are exact copies) one more signal — launched inside 48h, same deployer, or same image. Review: every row above should read as an obvious copy to a human; anything that does not is a false positive to fix in `server/src/vamp.ts`.
