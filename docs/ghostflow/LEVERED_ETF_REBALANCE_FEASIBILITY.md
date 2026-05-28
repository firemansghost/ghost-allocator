# Levered ETF Rebalance Pressure — Feasibility Memo (GhostFlow v1.1a)

**Status:** Research / feasibility only — no scoring, merge, artifact JSON, UI, or script changes.  
**Target (future):** Replace static MOCK `leveredEtfRebalancePressure` with a **public manual proxy** for estimated levered/inverse ETF rebalance pressure.  
**Related:** [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) (CFTC score wiring remains separate; do not conflate)

---

## Feasibility rating: **YELLOW**

| Criterion | Assessment |
|-----------|------------|
| Public provenance | **Partial** — issuer fund pages and ETF directories publish AUM; no official daily “rebalance dollars” series |
| Manual refresh | **Feasible** — weekly artifact with per-fund AUM + index move is operator-manageable (6 funds × 2 fields minimum) |
| Mapping to 0–100 | **Unresolved** — needs v1.1b design and optional historical study (v1.1e) |
| Labeling honesty | **Achievable** if copy states *estimate / proxy*, not measured flow or gamma |

**Why not RED:** AUM and index returns are available without proprietary terminals; GhostFlow already ships manual public artifacts (ICI, CBOE VIX, breadth).  
**Why not GREEN:** Rebalance math is model-dependent; inverse daily-reset mechanics differ; AUM timestamps lag; issuers do not publish exact rebalance notional.

---

## 1. Current state

| Item | Value |
|------|--------|
| Score sub-input key | `leveredEtfRebalancePressure` |
| Status | **MOCK** — static **55** in [`mockGhostflowSnapshot.ts`](../data/ghostflow/mockGhostflowSnapshot.ts) |
| Passive pillar weight | **15%** (smallest passive sub-input) in [`scoring.ts`](../lib/ghostflow/scoring.ts) |
| Score merge | **None** — value always from mock snapshot |
| Dedicated signal card | **None** today (watchlist lists future “Levered ETF AUM and rebalance estimates”) |

**Passive Pressure formula (unchanged):**

```
0.25 × etfFundFlowImpulse
+ 0.20 × systematicStrategyPressure   (MOCK 62; CFTC display-only separate)
+ 0.20 × optionsVolatilityAmplifier
+ 0.20 × retirementFlowPressureProxy  (MOCK 58)
+ 0.15 × leveredEtfRebalancePressure  (MOCK 55)
```

**Score-input mix (with current public artifacts):** 6 PUBLIC · 1 DERIVED (`modelZoneProximity`) · 3 MOCK (includes levered **55**).

**UI touchpoints (unchanged by v1.1a):** [`GhostFlowScoreCard.tsx`](../components/ghostflow/GhostFlowScoreCard.tsx) — “Levered ETF rebalance pressure” (MOCK badge); methodology and score-driver placeholder copy.

**CFTC boundary:** v1.1 does **not** reopen CFTC score wiring ([v1.0b decision](./CFTC_TFF_MAPPING_DECISION.md)). `systematicStrategyPressure` stays MOCK in the composite.

---

## 2. Candidate purpose

**Question:** Can GhostFlow replace MOCK `leveredEtfRebalancePressure` with a defensible public/manual proxy?

**Answer:** **Yes, as an approximate mechanical-pressure estimate** — not as precise rebalance flow, options gamma, or a market forecast.

Daily-reset levered and inverse ETFs must trade underlying exposure to maintain stated leverage. On large index moves, **estimated rebalance notional** scales roughly with:

- fund **AUM** (assets under management),
- **leverage factor** (2× or 3×),
- **absolute underlying index return** over the measurement window.

GhostFlow would aggregate across a small, liquid universe and map to 0–100 in a later phase. v1.1a does **not** lock the mapper.

---

## 3. Recommended MVP ETF universe (Tier 1)

**Design rule:** One levered complex per benchmark — avoid double-counting duplicate 3× products on the same index (e.g. UPRO **and** SPXL).

| Ticker | Issuer | Leverage | Direction | Underlying index |
|--------|--------|----------|-----------|------------------|
| **TQQQ** | ProShares | 3× | Long | Nasdaq-100 |
| **SQQQ** | ProShares | 3× | Inverse | Nasdaq-100 |
| **UPRO** | ProShares | 3× | Long | S&P 500 |
| **SPXU** | ProShares | 3× | Inverse | S&P 500 |
| **TNA** | Direxion | 3× | Long | Russell 2000 |
| **TZA** | Direxion | 3× | Inverse | Russell 2000 |

**Rationale:** Highest-liquidity 3× equity index pairs covering large-cap, growth/tech-heavy, and small-cap mechanical pressure. Six tickers keep manual refresh bounded (~6 AUM fields + 3 index moves per period if moves are shared by pair).

### Per-row data needs (for future artifact)

| Field | Notes |
|-------|--------|
| Issuer | ProShares / Direxion — stable product URLs |
| Leverage factor | Fixed per ticker from prospectus (3×) |
| Long / inverse | Enum; drives rebalance direction narrative |
| Underlying index | Nasdaq-100, S&P 500, Russell 2000 |
| **AUM / net assets (USD)** | Manual extract; record row-level `asOf` |
| **Underlying index return %** | Over artifact window (daily or weekly) |
| **Estimated rebalance notional (USD)** | Model output per row (v1.1b formula) |

---

## 4. Deferred universe (Tier 2 — document only)

Exclude from v1 aggregate to prevent overlapping exposure on the same benchmark:

| Pair | Leverage | Reason deferred |
|------|----------|-----------------|
| **SPXL / SPXS** | 3× S&P 500 | Duplicates UPRO / SPXU (Direxion vs ProShares same beta bucket) |
| **SSO / SDS** | 2× S&P 500 | Overlaps 3× S&P complex; lower leverage, redundant index |
| **QLD / QID** | 2× Nasdaq-100 | Overlaps TQQQ / SQQQ |

Tier 2 may be added in a later methodology revision with explicit de-duplication rules.

---

## 5. Candidate data sources

### Primary (manual extract — recommended production path)

| Source | Use | Notes |
|--------|-----|-------|
| **ProShares fund pages** | AUM, facts, rebalance policy quotes | Official; HTML copy/paste; cite URL in artifact `source` |
| **Direxion fund pages** | AUM for TNA / TZA | Same pattern |

### Cross-check (operator, not automated scrape)

| Source | Use | Notes |
|--------|-----|-------|
| **ETF.com** (VettaFi) | Net assets, volume | Fast sanity check |
| **ETFdb** | AUM, holdings summary | Second source when issuer page date unclear |
| **Yahoo Finance** | `totalAssets`, fund price | Convenient; can lag issuer; unofficial API |

### Index move (underlying return)

| Source | Use | Notes |
|--------|-----|-------|
| **Stooq** daily CSV | Index or ETF proxy returns (`spy.us`, `qqq.us`, `iwm.us`, or index symbols) | Ghost Regime already documents Stooq patterns; API-key gate possible — manual CSV download acceptable for GhostFlow artifact |
| **Index ETF proxies** | SPY, QQQ, IWM daily % | Aligns one proxy per benchmark when index symbol inconvenient |

**Cadence recommendation (feasibility):**

- **Weekly** artifact `asOf` (week-ending date) with summed or representative daily estimated pressure — consistent with ICI ETF issuance artifact.
- **Daily** refresh is optional stretch (heavier operator load); defer to v1.1b.

**Explicitly out of scope for v1.1a:** Live GhostFlow runtime fetch, cron, scraping issuer HTML in production, SEC N-PORT as primary source (too slow).

---

## 6. Candidate proxy formula (proposal only — v1.1b)

Simplified per-fund estimate for a single day (illustrative):

```
estimatedRebalanceNotionalUsd ≈ AUM_usd × (leverageFactor - 1) × |underlyingIndexReturn|
```

- **Long** 3× fund on a down day: must buy exposure (magnitude scales with \|return\|).
- **Inverse** 3× fund on an up day: similar magnitude logic with opposite exposure; v1.1b must document whether scoring uses **absolute** pressure only (like CFTC magnitude score) or signed pressure.

**Aggregate (v1.1b):**

```
aggregateRebalanceNotionalUsd = sum(estimatedRebalanceNotionalUsd) over Tier-1 rows
```

Optional normalizations (mapping inputs, not final choices):

- `aggregateRebalancePctOfUniverseAum = 100 × aggregate / sum(AUM)`
- Compare to SPY+QQQ+IWM volume for mapping option B

---

## 7. Candidate artifact schema outline (future — not v1.1a)

**Future file:** `data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json`

```json
{
  "artifactVersion": "1",
  "signalId": "levered-etf-rebalance",
  "asOf": "YYYY-MM-DD",
  "publishedAt": "YYYY-MM-DD",
  "updateFrequency": "weekly",
  "dataQuality": "verified_manual",
  "source": {
    "name": "ProShares + Direxion fund pages; Stooq index returns",
    "url": "https://www.proshares.com/...",
    "note": "Manual extract: per-fund AUM as of date; index return over window"
  },
  "methodologyNote": "Estimated rebalance notional proxy; not issuer-reported flow",
  "universeDefinition": "tier1_six_tickers_v1",
  "etfRows": [
    {
      "ticker": "TQQQ",
      "issuer": "ProShares",
      "direction": "long",
      "leverageFactor": 3,
      "underlyingIndex": "Nasdaq-100",
      "aumMillionsUsd": 0,
      "underlyingIndexReturnPct": 0,
      "estimatedRebalanceNotionalMillionsUsd": 0,
      "usedInAggregate": true
    }
  ],
  "observations": {
    "aggregateRebalanceNotionalMillionsUsd": 0,
    "aggregateRebalancePctOfUniverseAum": 0,
    "mappedPressureScore": 0
  }
}
```

Pure validator/mapper module (future v1.1b): `lib/ghostflow/artifacts/leveredEtfRebalancePressure.ts`.

---

## 8. Candidate mapping options (no final choice in v1.1a)

| ID | Idea | Pros | Cons |
|----|------|------|------|
| **A** | Aggregate estimated rebalance as **% of total universe AUM** → linear 0–100 | Simple, unitless | Thresholds arbitrary without history |
| **B** | Dollar pressure / **SPY + QQQ + IWM** volume (or combined liquidity proxy) | Normalizes vs market capacity | Extra data; weekly volume stale |
| **C** | **Percentile** of aggregate pressure after historical study | Regime-adaptive | Needs history pipeline (cf. CFTC v1.0a) |
| **D** | **Manual banding** for v1 (operator buckets by $bn estimate) | Fast MVP | Subjective; weak audit trail |

**Score-wiring preview (if MOCK 55 replaced at 15% passive weight, mapping unknown):**

- Passive delta ≈ `0.15 × (newScore − 55)`
- Composite delta ≈ `0.075 × (newScore − 55)`
- Example: mapped score **70** → passive **+2.25**, composite **+1.1** (band may unchanged)

Defer numeric claims until v1.1b picks mapping and a sample refresh week.

---

## 9. Risks and caveats

1. **AUM staleness** — fund-page date may not align with index move window.
2. **Inverse mechanics** — daily-reset inverse funds have path-dependent decay; magnitude-only scoring hides direction.
3. **Estimate ≠ actual trades** — issuers use rebalance bands and buffers; intraday path matters.
4. **Not a prediction** — research/education framing only; not allocation advice.
5. **Not full derivatives exposure** — excludes options, single-stock levered ETPs, VIX levered products.
6. **Public data quality** — Yahoo/ETF directory errors; require dual-source check before `verified_manual`.
7. **Labeling** — distinct from ICI **fund flow** and CFTC **positioning**; use “levered ETF rebalance **estimate**” in future copy.
8. **Universe concentration** — six tickers are a liquid slice, not the full levered ETF complex.

---

## 10. Proposed phases (v1.1 track)

| Phase | Deliverable | Scope |
|-------|-------------|--------|
| **v1.1a** | This feasibility memo + roadmap | **Docs only** — **current** |
| **v1.1b** | Artifact design memo, example JSON, pure validator/mapper, tests | No production JSON |
| **v1.1c** | Production artifact candidate + `ghostflow:validate-artifacts` | `leveredEtfRebalancePressure.v1.json` |
| **v1.1d** | Display-only public signal card | `buildSnapshot` display path only (cf. CFTC v0.9f) |
| **v1.1e** | Mapping decision record (if needed) | Docs only — after optional calibration |
| **v1.1f** | Score-wiring gate (if product-approved) | `buildSnapshot` merge, rename copy, PUBLIC badge, tests |

**Parallel (unchanged):** **v1.0c** CFTC score wiring — separate product gate per [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md).

---

## 11. Not implemented in v1.1a

- No changes to `lib/ghostflow/scoring.ts`, `buildSnapshot.ts`, or UI components
- No `data/ghostflow/artifacts/*.json` or `mockGhostflowSnapshot.ts` edits
- No `package.json` scripts
- No spike script or network automation
- MOCK **55** and composite weights unchanged

---

## Related documents

- [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) — v1.1b artifact schema, formula, validation (design only)  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase tracking and open questions  
- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) — parallel feasibility pattern (YELLOW)  
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — future operator row when artifact exists
