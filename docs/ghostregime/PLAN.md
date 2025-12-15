# GhostRegime v1 Architecture Plan

## Overview

GhostRegime v1 is a market regime classifier + allocation system that operates in two modes:
- **Replay mode**: Loads historical data from CSV seed file (dates ≤ 2025-11-28 UTC)
- **Computed mode**: Calculates regime + allocations for dates > 2025-11-28 UTC using Option B voting + VAMS

## Option B Voting Rules

### Risk Axis Votes (4 votes)

1. **SPY TR_63**: 
   - ≥ +0.02 → RiskOn (+1)
   - ≤ −0.02 → RiskOff (-1)
   - else 0

2. **HYG/IEF ratio TR_63**:
   - ≥ +0.01 → RiskOn (+1)
   - ≤ −0.01 → RiskOff (-1)
   - else 0

3. **VIX TR_21**:
   - ≤ −0.10 → RiskOn (+1)
   - ≥ +0.10 → RiskOff (-1)
   - else 0

4. **EEM/SPY ratio TR_63**:
   - ≥ +0.01 → RiskOn (+1)
   - ≤ −0.01 → RiskOff (-1)
   - else 0

**Tie-breaker**: If risk_score == 0, use sign of TR_21(SPY): (≥0 RiskOn else RiskOff)

### Inflation Axis Core Votes (4 votes)

1. **PDBC TR_63**:
   - ≥ +0.02 → Inflation (+1)
   - ≤ −0.02 → Disinflation (-1)
   - else 0
   - (Proxy allowed: DBC from Stooq)

2. **TIP/IEF ratio TR_63**:
   - ≥ +0.005 → Inflation (+1)
   - ≤ −0.005 → Disinflation (-1)
   - else 0
   - (TIP ETF from Stooq, IEF from Stooq)

3. **TLT TR_63**:
   - ≥ +0.01 → Disinflation (+1)
   - ≤ −0.01 → Inflation (-1)
   - else 0

4. **UUP TR_63**:
   - ≥ +0.01 → Disinflation (+1)
   - ≤ −0.01 → Inflation (-1)
   - else 0

**Tie-breaker**: If infl_total_score_pre_tiebreak (core + satellites) == 0, use sign of TR_21(PDBC):
- Compute TR_21 from close-to-close returns on PDBC (or DBC proxy if PDBC unavailable)
- If PDBC is proxied to DBC, compute TR_21 on DBC data but label as PDBC
- Rule: `>= 0` → Inflation (+1), `< 0` → Disinflation (-1) (configurable via `TIEBREAK_RULE`: `GTE_ZERO` or `GT_ZERO`)
- If `TIEBREAK_RULE=GT_ZERO`, then exact 0 → Disinflation (for workbook parity)
- If TR_21 cannot be computed (insufficient data), mark row as stale=true with stale_reason="MISSING_TIEBREAK_INPUT" (do not substitute 0)
- Debug output includes: series_used, window, start_date, end_date, start_close, end_close, input_value (full precision), input_value_display (6 decimals)

### Regime Mapping

- RiskOn + Disinflationary → **GOLDILOCKS**
- RiskOn + Inflationary → **REFLATION**
- RiskOff + Inflationary → **INFLATION**
- RiskOff + Disinflationary → **DEFLATION**

### Risk Regime Mapping

- GOLDILOCKS / REFLATION ⇒ **RISK ON**
- INFLATION / DEFLATION ⇒ **RISK OFF**

## VAMS Calculation

**Surrogate VAMS** (computed forward only; replay uses workbook states):

- **Drivers**: 
  - Stocks: SPY
  - Gold: GLD
  - BTC: BTC-USD (post cutover)

- **VAMS Score**:
  - `mom = 0.6 * TR_126 + 0.4 * TR_252` (close-to-close returns, NOT total return)
  - `vol = stdev(daily_returns, 63) * sqrt(252)`
  - `score = mom / vol`

- **State Thresholds**:
  - score ≥ +0.50 → state = 2
  - score ≤ −0.50 → state = −2
  - else state = 0

- **State → Scale**:
  - 2 → 1
  - 0 → 0.5
  - −2 → 0

## Allocation Targets

- **Stocks target**: 0.6 if RISK ON else 0.3
- **Gold target**: 0.3 always
- **BTC target**: 0.10 if RISK ON else 0.05

**Allocation Math**:
- `Actual_i = Target_i × Scale_i`
- `Cash = 1 − Σ Actuals`
- Clamp cash to [0,1], adjust residual for rounding drift; sum must equal 1 within 1e-6.

## Satellites (Bundle B)

```yaml
satellites:
  - series: "Cleveland Fed Inflation Nowcast YoY"
    source_type: "daily"
    axis: "inflation"
    signal_definition: "delta_7d_nowcast_yoy_pp"
    thresholds:
      inflation_vote_gte_pp: 0.05
      disinflation_vote_lte_pp: -0.05
    ttl_days: 7
    half_life_days: 3
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "Truflation YoY"

  - series: "Truflation YoY"
    source_type: "daily"
    axis: "inflation"
    signal_definition: "delta_7d_truflation_yoy_pp"
    thresholds:
      inflation_vote_gte_pp: 0.05
      disinflation_vote_lte_pp: -0.05
    ttl_days: 7
    half_life_days: 3
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "Commodity Nowcast Basket"

  - series: "Commodity Nowcast Basket (Energy+Metals)"
    source_type: "daily"
    axis: "inflation"
    signal_definition: "tr_21_basket"
    thresholds:
      inflation_vote_gte: 0.02
      disinflation_vote_lte: -0.02
    ttl_days: 7
    half_life_days: 3
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "None"

  - series: "ISM Manufacturing Prices Paid"
    source_type: "monthly"
    axis: "inflation"
    signal_definition: "level_index"
    thresholds:
      inflation_vote_gte: 55
      disinflation_vote_lte: 45
    ttl_days: 35
    half_life_days: 14
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "ISM Services Prices Paid"

  - series: "ISM Services Prices Paid"
    source_type: "monthly"
    axis: "inflation"
    signal_definition: "level_index"
    thresholds:
      inflation_vote_gte: 55
      disinflation_vote_lte: 45
    ttl_days: 35
    half_life_days: 14
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "NFIB Price Plans"

  - series: "NFIB Price Plans"
    source_type: "monthly"
    axis: "inflation"
    signal_definition: "level_index"
    thresholds:
      inflation_vote_gte: 30
      disinflation_vote_lte: 20
    ttl_days: 35
    half_life_days: 14
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "ISM Manufacturing Prices Paid"

  - series: "Freight Pulse (BDI or Freightos)"
    source_type: "weekly"
    axis: "inflation"
    signal_definition: "tr_63_series"
    thresholds:
      inflation_vote_gte: 0.10
      disinflation_vote_lte: -0.10
    ttl_days: 21
    half_life_days: 10
    vote_weight: 1.0
    vote_mapping: { "+1": "Inflation", "0": "None", "-1": "Disinflation" }
    fallback: "Commodity Nowcast Basket (Energy+Metals)"

satellite_combine_rules:
  decay_formula: "effective_vote = raw_vote * vote_weight * (0.5 ^ (age_days / half_life_days)); if age_days > ttl_days then effective_vote=0"
  cap_rule: "infl_sat_score_capped = clamp(sum(effective_vote_i), -1, +1)"
  apply_to_axis: "inflation"
  final_inflation_score: "infl_total_score = infl_core_score + infl_sat_score_capped"
  tie_breaker_after_satellites: "if infl_total_score == 0 use sign(TR_21(PDBC)) with >=0 inflationary else disinflationary"
```

## Flip Watch

**Persistence Guard**:
- 2-day confirmation unless strong margin
- Strong margin: immediate flip allowed when `abs(score) >= 2` (risk axis score OR inflation total score)

**Flip Watch Statuses**:
- `NONE`: No pending flip
- `BREWING`: Score changed but < 2-day threshold
- `PENDING_CONFIRMATION`: Day 1-2 of pending flip
- `STRONG_FLIP`: `abs(score) >= 2` → immediate flip allowed

## Stress Override

**Trigger**: VIX > 30 AND TR_63(HYG/IEF) <= -0.02 forces RiskOff

## Blob Storage

**Keys** (versioned by model version):
- `{MODEL_VERSION}/ghostregime_history.jsonl` (append-only)
- `{MODEL_VERSION}/ghostregime_latest.json` (snapshot)
- `{MODEL_VERSION}/ghostregime_meta.json` (integrity/version)

**Environment Variables**:
- `BLOB_READ_WRITE_TOKEN` (required)
- `NEXT_PUBLIC_GHOSTREGIME_MODEL_VERSION="ghostregime-v1.0.1"` (default)
- `NEXT_PUBLIC_GHOSTREGIME_CUTOVER_DATE_UTC="2025-11-28"`

**Persistence Rules**:
- Only persist rows when `stale=false`
- Stale rows are returned but not written to Blob storage
- First successful non-stale run creates versioned Blob objects

**Atomic Update Rules**:
- Single-writer behavior: If concurrent writes occur, return latest row with `stale=true` rather than corrupting history
- Stale behavior: If market data missing, return latest with `stale=true`, `stale_reason="MARKET_DATA_UNAVAILABLE"`

## Data Windows

**Trading-day windows**: 21/63/126/252 are trading-day windows using close-to-close returns (NOT total return).

- **ETFs/VIX**: Data series naturally skips weekends/market holidays → TR_21/TR_63/TR_126/TR_252 windows are automatically "trading-day-ish" (just take last N observations)
- **BTC**: Uses calendar observations (21/63/126/252 calendar days) - this is fine per spec

## Market Data Providers

**Default v1.0.2 provider stack**:
- **ETFs (SPY, GLD, HYG, IEF, EEM, TLT, UUP, TIP)**: Stooq daily CSV
- **VIX**: CBOE VIX History CSV (https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv)
- **BTC spot**: Stooq (btcusd)
- **PDBC**: AlphaVantage compact mode (last ~100 trading days, sufficient for TR_63/TR_21) with DBC/Stooq fallback proxy

**Provider Notes**:
- VIX provider is CBOE CSV (not Stooq, not FRED) for reliable daily close data
- PDBC uses AlphaVantage `outputsize=compact` to avoid premium tier requirement (free tier supports compact)
- All core symbols fetch >= 400 observations for VAMS calculations (SPY, GLD, BTC)
- PDBC only needs ~70+ observations for TR_63/TR_21, so compact mode is sufficient
- If any source is down/rate-limited: return `stale=true` and keep serving `ghostregime_latest.json`



