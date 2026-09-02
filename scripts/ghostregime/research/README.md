# GhostRegime R7 allocation-research harness

Research-only machinery for the preregistered R7 allocation study.

This directory does **not** write production state, call market-data providers, refresh GhostRegime, or change 60/30/10.

## Frozen-data requirement

R7B1/R7C consume a private frozen snapshot, not live feeds.

- Snapshot ID: `r7b0-20260902-210842Z`
- Location (untracked): `.local/ghostregime-r7/r7b0-20260902-210842Z/`
- Manifest SHA-256: `bb68cdfbbfa854bfa7edeed226e42d2e5a1328e201bc821efcb43a274a63ca00`

Private CSVs, `MANIFEST.json`, `HASHES.sha256`, and raw provider files must stay untracked.

## Signal vs return separation

- **Signal panel**: raw close / VIX index level only. Feeds votes, inflation tie-break, VAMS, and allocations.
- **Return panel**: adjusted/TR ETF closes plus Coinbase session-aligned BTC marks. Feeds portfolio returns only.
- Never feed adjusted closes into GhostRegime vote/VAMS functions.
- Never use raw BIL as the primary cash/performance series.

## Production cutover vs research adapter

`computeGhostRegime()` rejects dates at or before `CUTOVER_DATE_UTC` (`2025-11-28`). R7 history begins in 2016.

R7 therefore uses a **research-only** adapter in `model-state.ts` that orchestrates existing production pures:

1. `computeOptionBVotes`
2. `DefaultSatelliteDataProvider` + `ACTIVE_SATELLITE_CONFIGS` + `resolveSatelliteData` / `processSatellites`
3. inflation PDBC TR21 tie-break (`getDataForSymbol`, `getLastNObservations`, `TR_21`, `TIEBREAK_RULE`)
4. `classifyRegime` / `mapToRiskRegime` / `applyStressOverride`
5. `computeAllVamsStates` / `computeAllocations`

It does not mutate the production cutover, add a bypass flag, or change `engine.ts`.

Post-cutover parity (every eligible SPY session after `2025-11-28` through `2026-09-01`) compares the adapter to production `computeGhostRegime()` on the frozen signal panel. Expected: zero allocation-relevant mismatches.

## T / T+1 / T+2 execution

1. After close T, compute published target `A_T` and queue it.
2. Interval T → T+1: previously executed holdings earn the interval return. `A_T` does **not** earn T → T+1.
3. At close T+1: apply the interval return, compute drifted pre-trade weights, execute pending `A_T` only if the published target changed, charge cost, then queue `A_{T+1}`.
4. First eligible return interval for `A_T` is T+1 → T+2.

## Self-financing drift

`w_pre_i = w_held_i * (1 + r_i) / (1 + marketReturn)`

If there is no rebalance, next held weights are `w_pre`.

A missing return for any economically held asset is a hard error (`MISSING_HELD_ASSET_RETURN`). Held returns are never defaulted to zero.

## Market return vs net return

- `marketReturn = Σ held_i × asset_return_i`
- `NAV_after_market = NAV_before × (1 + marketReturn)`
- `NAV_after_cost = NAV_after_market × (1 - costFraction)`
- `netPortfolioReturn = NAV_after_cost / NAV_before - 1`

All reported performance metrics use after-cost daily portfolio returns (`netPortfolioReturn`) for the selected cost scenario. At 0 bps, `netPortfolioReturn == marketReturn`. At 5/10 bps, `netPortfolioReturn` includes the NAV haircut.

## Panel alignment

Ordinary ETF signal series (SPY, GLD, HYG, IEF, EEM, PDBC, TIP, TLT, UUP) and every return series (SPY, GLD, IEF, BIL, BTC-USD) must match the frozen XNYS session calendar exactly. BTC signal remains calendar-daily. VIX preserves its documented extra source observations.

## Event-driven GhostRegime rebalance

Dynamic strategies rebalance only when

`max_i |published_target_new_i - last_executed_published_target_i| > ALLOCATION_TOLERANCE`

Market drift alone does not trigger a rebalance.

## Static annual benchmark rebalance

Primary static benchmarks rebalance on the first eligible XNYS session close of each calendar year. Monthly first-session rebalance is a later sensitivity and is not run on the real panel in R7B1. `SPY_100` has no scheduled rebalance.

## Cost definition

- `delta_i = target_i - pretrade_i` over all investable sleeves, including BIL
- `gross_two_sided = Σ |delta_i|`
- `one_way_turnover = 0.5 * gross_two_sided`
- `cost_fraction = (cost_bps / 10000) * gross_two_sided`
- `NAV_after_cost = NAV_after_market * (1 - cost_fraction)`
- No extra cash transaction leg after BIL is included
- Primary study cost is 0 bps; 5 and 10 bps are later sensitivities

## Initial allocation

First valid model signal is S0. The first executable close is the next XNYS session S1. The initial target is established at S1 with turnover = 0 and transaction cost = 0. Inception is portfolio establishment, not a model rebalance (`inception = true`, `rebalanced = false`). The first portfolio return is S1 → S2. All primary comparisons share that inception. Longer standalone benchmark histories may be labeled separately later.

## Time under water

`TUW_maxDD` and `TUW_longest` are reported in **calendar days** (`tuwMaxDdCalendarDays`, `tuwLongestCalendarDays`). Do not later label them trading days.

## Candidate preregistration

Frozen primary candidates: `P0_CURRENT` … `P6_HOUSE_601525`. No BTC-zero entry in the primary ranking. No-BTC remains a later sensitivity.

Ablations: `STATIC_601030`, `REGIME_ONLY`, `VAMS_ONLY`, `COMBINED`, `SPY_100`.

Holdout is frozen before outcomes: calendar `2024-09-01` → `2026-09-01`; first eligible session `2024-09-03`.

## R7B1 does not run the real candidate study

Validate-only mode may use the real snapshot for:

- manifest / hash / schema / calendar checks
- VIX extra-date audit
- BTC stale-mark validation
- post-cutover model-state parity

It must not compute real-panel CAGR, drawdown, Sharpe, or P0–P6 rankings. Portfolio/metrics code is unit-tested on synthetic fixtures only. R7C is the first real performance run.

## Command

```bash
npm run ghostregime:r7:validate -- --snapshot .local/ghostregime-r7/r7b0-20260902-210842Z
```

There is no `ghostregime:r7:study` command in R7B1.
