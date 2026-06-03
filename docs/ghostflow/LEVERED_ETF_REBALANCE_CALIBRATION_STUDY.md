# Levered ETF Rebalance Calibration Study (GhostFlow v1.1e-calibration)

**Status:** Research-only calibration support — **no score wiring**, no `buildSnapshot` merge, **not production artifact mutation**.  
**Study type:** **Fixed-current-AUM return-sensitivity study** — **not true historical AUM calibration**.  
**Run date:** 2026-06-02 (full-history Stooq run; smoke fixture 2026-05-20)  
**Related:** [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) · production artifact [`leveredEtfRebalancePressure.v1.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json)

---

## 1. Purpose

Before any **v1.1f** score-wiring gate, characterize how **aggregate rebalance pressure (% of universe AUM)** would behave over history if **AUM were frozen** at the current production snapshot and only **QQQ / SPY / IWM** session returns varied.

This supports mapping decisions in [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md). It does **not** change the Research Composite (`leveredEtfRebalancePressure` remains **MOCK 55**).

---

## 2. Feasibility rating: **YELLOW**

| Track | Rating | Notes |
|-------|--------|-------|
| Historical QQQ / SPY / IWM daily returns | **GREEN** | Stooq CSV (with `STOOQ_API_KEY`) or operator `--returns-csv` |
| True historical six-ticker AUM series | **RED** (automated public) | Issuer pages lack downloadable multi-year AUM; scrape-prone directories |
| **Fixed-current-AUM return-sensitivity** | **GREEN** (stress test) | MVP implemented; formula cross-check passes |
| Sparse AUM checkpoints | **YELLOW** (future) | `--aum-mode csv-checkpoints` documented; not required for this PR |
| Rolling weekly artifacts | **GREEN** (slow) | Complements stress test over time; no new automation |

---

## 3. Data mode and sources

| Item | Value |
|------|--------|
| **AUM mode** | `fixed-current` — six-ticker AUM from production artifact snapshot (48,347.86M universe) |
| **Return source (full run)** | Stooq daily close-to-close % for `qqq.us`, `spy.us`, `iwm.us` (GhostFlow-local fetch; **not** GhostRegime `marketData`) |
| **Return source (CI / smoke)** | [`lib/ghostflow/__tests__/fixtures/leveredEtfProxyReturns.csv`](../lib/ghostflow/__tests__/fixtures/leveredEtfProxyReturns.csv) |
| **Since filter (recommended full run)** | `2010-02-11` (TQQQ-era) or `2015-01-01` |
| **Script** | `npm run ghostflow:levered-etf-rebalance-history-study` |
| **Helpers** | [`lib/ghostflow/research/leveredEtfRebalanceHistory.ts`](../lib/ghostflow/research/leveredEtfRebalanceHistory.ts) |

### Data gaps

- **No time-varying AUM** in MVP — early sessions are overstated/understated vs reality as funds grew.
- **No issuer-reported rebalance flow** — mechanical formula only.
- **Six-ticker Tier-1 universe** — not the full levered ETF complex.
- **Stooq gate** — without `STOOQ_API_KEY`, use `--returns-csv` (see runbook below).

---

## 4. Methodology

1. Load production AUM per ticker (read-only) into a fixed resolver.
2. Ingest daily `qqqPct`, `spyPct`, `iwmPct` per session date.
3. **Skip** any session missing any of the three proxy returns.
4. Build six Tier-1 rows; recompute row notionals via `computeEstimatedRebalanceNotional`.
5. Aggregate via `computeAggregateLeveredEtfRebalanceMetrics` (same as production validator).
6. Compare mapping candidates on `aggregateRebalancePctOfUniverseAum`.
7. Score-impact preview varies only `leveredEtfRebalancePressure` (L); peers from `buildGhostFlowSnapshot(GHOSTFLOW_REFERENCE_AS_OF)` (public artifact merges, levered still MOCK **55**).

---

## 5. Smoke validation run (fixture CSV, N = 4)

A **smoke** run on the test fixture confirms plumbing and production cross-check. Full-history results are in §7 (Stooq, since 2010-02-11).

| Metric | Value |
|--------|--------|
| Return file | `lib/ghostflow/__tests__/fixtures/leveredEtfProxyReturns.csv` |
| Date range | **2026-05-20** → **2026-05-23** |
| Aligned sessions (N) | **4** |
| Skipped sessions | **0** |

### Production artifact cross-check (2026-05-22)

| Field | Artifact | Study (fixed AUM) | Match |
|-------|----------|-------------------|-------|
| `aggregateRebalancePctOfUniverseAum` | **2.78%** | **2.78%** | yes |
| `aggregateAbsRebalanceNotionalMillionsUsd` | **1,343.67M** | **1,343.67M** | yes |
| `dominantDirection` | buy_underlying | buy_underlying | yes |

### Latest fixture session (2026-05-23)

| Field | Value |
|-------|--------|
| % of universe AUM | **7.5%** |
| Percentile vs fixture history | **87.5th** |
| Dominant direction | sell_underlying |

### Fixture distributions (not representative of full market history)

| Series | min | median | max | mean |
|--------|-----|--------|-----|------|
| % of AUM | 0.62 | 2.9 | 7.5 | 3.5 |
| Abs notional (M) | 301 | 1,423 | 3,624 | 1,693 |

### Fixture mapping comparison (latest session 7.5% AUM)

| Mapping | Latest score | % sessions ≥70 | % sessions ≥80 | median | p90 |
|---------|--------------|----------------|----------------|--------|-----|
| linear x10 | 75 | 25% | 0% | 29.5 | 62 |
| linear x20 | 100 | 25% | 25% | 59 | 89 |
| manual bands | 90 | 25% | 25% | 64 | 83 |
| capped x20 (80) | 80 | 25% | 25% | 59 | 75 |
| percentile rank | 88 | 25% | 25% | 50.5 | 81 |

**Do not use fixture percentiles for product decisions** — run full history (below).

---

## 6. Full-history runbook (operator)

```bash
# Preferred: Stooq (set STOOQ_API_KEY), long sample
npm run ghostflow:levered-etf-rebalance-history-study -- --since 2010-02-11

# Or reproducible CSV (columns: date, qqqPct, spyPct, iwmPct)
npm run ghostflow:levered-etf-rebalance-history-study -- --returns-csv path/to/returns.csv --since 2010-02-11

# Optional operator-local JSON (do not commit by default)
npm run ghostflow:levered-etf-rebalance-history-study -- --since 2015-01-01 --out data/ghostflow/research/leveredEtfSessions.v1.json
```

Full-history run completed 2026-06-02 via Stooq (`STOOQ_API_KEY`). Results below.

---

## 7. Full-history results (fixed-current-AUM return-sensitivity)

**Command:** `npm run ghostflow:levered-etf-rebalance-history-study -- --since 2010-02-11`  
**Return source:** Stooq daily close-to-close % — `qqq.us`, `spy.us`, `iwm.us`  
**AUM mode:** `fixed-current` (production artifact snapshot; **not** time-varying AUM)

| Metric | Value |
|--------|--------|
| Proxy return rows loaded | **4,099** |
| **Aligned sessions (N)** | **4,099** |
| Skipped sessions | **0** |
| **Date range** | **2010-02-12** → **2026-06-02** |

### Latest session (2026-06-02)

| Field | Value |
|-------|--------|
| `aggregateRebalancePctOfUniverseAum` | **2.8%** |
| `aggregateAbsRebalanceNotionalMillionsUsd` | **1,351.85M** |
| `aggregateEstimatedRebalanceNotionalMillionsUsd` | **+1,351.85M** |
| `dominantDirection` | **buy_underlying** |
| Percentile vs fixed-AUM history (% AUM) | **38.7th** |

Production week **2026-05-22** reproduces artifact **2.78% / 1,343.67M / buy_underlying** within tolerance.

### Direction mix (full history)

| Direction | % of sessions |
|-----------|----------------|
| buy_underlying | **53.6%** |
| sell_underlying | **41.5%** |
| mixed | **4.9%** |
| flat | **0%** |

### Distributions

| Series | min | p25 | median | p75 | max | mean |
|--------|-----|-----|--------|-----|-----|------|
| % of universe AUM | 0.09 | 1.8 | **3.9** | 7.6 | **75.98** | 5.6 |
| Abs notional (M USD) | 42 | 856 | **1,901** | 3,666 | **36,733** | 2,720 |

Early-era sessions use **today’s AUM** against **2010–2015 returns**, so tails (e.g. COVID March 2020) are **overstated** versus true historical AUM — another reason this is a stress test, not ground truth.

### Top 5 sessions by % of universe AUM

| Date | % AUM | Abs notional (M) | Dominant direction |
|------|-------|------------------|------------------|
| 2020-03-16 | **75.98%** | 36,733 | sell_underlying |
| 2025-04-09 | **74.59%** | 36,065 | buy_underlying |
| 2020-03-12 | **59.3%** | 28,670 | sell_underlying |
| 2020-03-13 | **53.77%** | 25,996 | buy_underlying |
| 2020-03-24 | **50.9%** | 24,609 | buy_underlying |

### Bottom 5 sessions by % of universe AUM

| Date | % AUM | Abs notional (M) | Dominant direction |
|------|-------|------------------|------------------|
| 2016-04-14 | **0.09%** | 44 | mixed |
| 2017-11-10 | **0.09%** | 42 | sell_underlying |
| 2010-03-12 | **0.12%** | 60 | buy_underlying |
| 2011-06-13 | **0.12%** | 60 | mixed |
| 2015-05-15 | **0.12%** | 56 | buy_underlying |

### Full-history mapping comparison (latest session 2.8% AUM)

| Mapping | Latest score | % sessions ≥70 | % sessions ≥80 | % sessions ≥90 | median | p90 |
|---------|--------------|----------------|----------------|----------------|--------|-----|
| **linear x10** on %AUM | **28** | 28.2% | 23.5% | 19.6% | 39 | 100 |
| **linear x20** on %AUM | **56** | 54.2% | 49.7% | 45.2% | 79 | 100 |
| **manual bands** on %AUM | **60** | 49.5% | 40.6% | 28.0% | 68 | 90 |
| **capped linear x20** (cap 80) | **56** | 54.2% | 49.7% | **0%** | 79 | 80 |
| **percentile rank** %AUM | **39** | 30.5% | 20.5% | 10.5% | 50 | 90 |

**Readout:** Uncapped **linear ×20** would score **≥70** on **54%** of sessions (median mapped score **79**). Latest production-like week (**2.8% AUM**) maps to **L ≈ 56** under ×20 — near MOCK **55** by coincidence — but its **fixed-AUM percentile is only ~39th**, not “elevated vs history.” **Percentile** mapping for the latest week (**39**) sits **below** MOCK **55**.

---

## 8. Score-impact preview (peers fixed, levered MOCK 55 baseline)

From **full-history latest session** mappings (2026-06-02, 2.8% AUM). Not score wiring.

| Case | L | Passive | Composite | Band |
|------|---|---------|-----------|------|
| MOCK (current) | **55** | **58** | **62** | Crowded / Reflexive |
| linear x10 (latest) | **28** | **54** | **60** | Elevated Flow Pressure |
| linear x20 (latest) | **56** | **58** | **62** | Crowded / Reflexive |
| manual bands (latest) | **60** | **59** | **63** | Crowded / Reflexive |
| capped x20 (latest) | **56** | **58** | **62** | Crowded / Reflexive |
| percentile rank (latest) | **39** | **55** | **61** | Crowded / Reflexive |

Wiring is **not approved**. Uncapped linear ×20 is **too hot** on history (~half of sessions ≥70). Latest-week ×20 ≈ MOCK is **not** calibration. Prefer **percentile** or **capped** mapping if v1.1f is ever approved.

---

## 9. Recommendation

1. **Stay display-only** — artifact card remains informational; `mappingStatus: not_final`; `leveredEtfRebalancePressure` remains **MOCK 55**.
2. **Treat fixed-current-AUM output as a stress test only** — not true historical AUM calibration (AUM frozen; COVID-era tails overstated).
3. **Do not proceed to v1.1f score wiring** without explicit product approval — full-history run is complete; policy unchanged.
4. **Reject uncapped linear ×20 for score use** — **54%** of sessions would map ≥70; median **79**; p90 hits **100**.
5. If wiring is ever approved, prefer **percentile** or **capped linear (cap 80)** — latest week percentile score **39** vs ×20 **56** shows mappers diverge; percentile avoids arbitrary scale.
6. **Parallel track:** collect weekly production artifacts over time for rolling-forward calibration (clean provenance).

---

## 10. Caveats

1. **Not issuer-reported flow** — estimated mechanical notional from AUM × leverage formula.
2. **Not exact trade demand** — ignores intraday path, creation/redemption, basket drift.
3. **Not gamma / 0DTE** — options overlay excluded.
4. **AUM history is the weak link** — MVP freezes AUM; percentiles reflect return volatility, not fund growth.
5. **Fixed-current-AUM history is not true historical calibration** — label all console and memo output accordingly.
6. **Six-ticker universe** — Tier-1 subset only.
7. **Direction** — display shows `dominantDirection`; most candidate mappers use magnitude (% AUM) only.

---

## Related documents

- [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) — v1.1e policy (display-only)  
- [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) — parallel research pattern (true public history for CFTC)  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase tracking
