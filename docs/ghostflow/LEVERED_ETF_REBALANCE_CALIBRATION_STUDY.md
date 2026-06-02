# Levered ETF Rebalance Calibration Study (GhostFlow v1.1e-calibration)

**Status:** Research-only calibration support — **no score wiring**, no `buildSnapshot` merge, **not production artifact mutation**.  
**Study type:** **Fixed-current-AUM return-sensitivity study** — **not true historical AUM calibration**.  
**Run date:** 2026-05-20  
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

Operator full-history run was blocked by Stooq API-key gate in this environment. A **smoke** run on the test fixture confirms plumbing and production cross-check.

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

After a full run, paste distribution, mapping, and percentile tables into §7–8 of this memo.

---

## 7. Full-history results (pending operator run)

| Metric | Value |
|--------|--------|
| Aligned sessions (N) | _pending — run with Stooq or full returns CSV_ |
| Date range | _pending_ |
| Skipped sessions | _pending_ |
| Latest %AUM percentile (fixed-AUM) | _pending_ |

---

## 8. Score-impact preview (peers fixed, levered MOCK 55 baseline)

From smoke fixture latest mappings (illustrative only):

| Case | L | Passive | Composite | Band |
|------|---|---------|-----------|------|
| MOCK (current) | **55** | **58** | **62** | Crowded / Reflexive |
| linear x20 (latest) | 100 | 65 | 66 | Crowded / Reflexive |
| capped x20 (latest) | 80 | 62 | 64 | Crowded / Reflexive |
| percentile (latest) | 88 | 63 | 65 | Crowded / Reflexive |

Wiring is **not approved**. Under uncapped linear ×20, a single large-return session can push L to **100** and composite +4 vs MOCK baseline.

---

## 9. Recommendation

1. **Stay display-only** — artifact card remains informational; `mappingStatus: not_final`.
2. **Treat fixed-current-AUM output as a stress test only** — not true historical AUM calibration.
3. **Do not proceed to v1.1f score wiring** unless product explicitly approves after a **full-history** run and mapping review.
4. If wiring is ever approved, prefer **percentile (F)** or **capped linear (D)** over uncapped ×k linear — consistent with [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md).
5. **Parallel track:** collect weekly production artifacts over time for rolling-forward calibration (clean provenance).

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
