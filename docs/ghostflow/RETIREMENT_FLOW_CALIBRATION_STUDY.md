# Retirement Flow Calibration Study (GhostFlow v1.2e-calibration)

**Status:** Research-only — **no score wiring**, no `buildSnapshot` score merge, **no production artifact mutation**, no UI/runtime changes.  
**Run date:** 2026-05-20  
**Related:** [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) · [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) · production artifact [`retirementFlowPressureProxy.v1.json`](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json)

---

## 1. Purpose

Characterize **quarterly ICI Table 1 retirement market asset levels** (structural assets, not payroll flow) since **2007:Q1**, compute QoQ/YoY total-asset growth distributions, compare candidate score mappings, and preview passive/composite impact versus the current **MOCK** `retirementFlowPressureProxy` (**58**).

Supports the v1.2e mapping decision. Does **not** change the Research Composite.

---

## 2. Source and methodology

| Item | Value |
|------|--------|
| **Source** | ICI *Retirement Market Statistics* — **Table 1** (retirement market assets, billions USD) |
| **Workbook** | Operator-local `ret_25_q4_data.xls` (not committed) |
| **Parser** | `loadTable1RowsFromXls` → `buildQuarterlySeries` in [`lib/ghostflow/research/retirementFlowHistory.ts`](../lib/ghostflow/research/retirementFlowHistory.ts) |
| **Since filter** | **2007:Q1** (pre-2007 **annual** rows excluded from quarterly distributions) |
| **Total assets** | Sum of IRAs + DC plans + private DB + state/local DB + federal DB + annuities |
| **Script** | `npm run ghostflow:retirement-flow-history-study -- --xls <path>` |
| **Tests** | Pure CSV fixture — [`retirementFlowHistoryQuarterly.csv`](../lib/ghostflow/__tests__/fixtures/retirementFlowHistoryQuarterly.csv) |

---

## 3. Study run (ICI XLS)

| Metric | Value |
|--------|--------|
| **Date/quarter range** | **2007:Q1** → **2025:Q4** |
| **N quarterly observations** | **76** |
| **Table 1 rows read** | 109 |
| **Skipped / excluded periods** | 33 (annual years 1974–2006 and pre-`since` quarters) |

### Production artifact cross-check (2025:Q4)

| Field | Artifact | Study | Match |
|-------|----------|-------|-------|
| QoQ total asset growth | **2.1%** | **2.1%** | yes |
| YoY total asset growth | **11.2%** | **11.2%** | yes |
| Total assets | **49.1T** | **49.1T** (49,124B) | yes |

---

## 4. Current quarter (2025:Q4)

| Field | Value |
|-------|--------|
| **Total retirement market assets** | **49.1T** |
| **IRA assets** | **19.2T** (**39.1%** of total) |
| **DC plan assets** | **14.2T** (**28.9%** of total) |
| **QoQ total asset growth** | **2.1%** |
| **YoY total asset growth** | **11.2%** |

---

## 5. Growth distributions (since 2007:Q1)

### QoQ total asset growth (%)

| Stat | Value |
|------|--------|
| min | **-12.0** |
| p25 | **-0.3** |
| median | **2.1** |
| p75 | **4.5** |
| max | **11.0** |
| mean | **1.6** |
| **Current (2025:Q4) percentile** | **48.7** |

### YoY total asset growth (%)

| Stat | Value |
|------|--------|
| min | **-21.4** |
| p25 | **2.0** |
| median | **8.5** |
| p75 | **11.3** |
| max | **26.9** |
| mean | **6.1** |
| **Current (2025:Q4) percentile** | **74.3** |

**Context:** Current QoQ is near the historical median; YoY is elevated (upper quartile) but not extreme.

---

## 6. Candidate mapping comparison (latest quarter)

Research previews only — **not implemented** in `scoring.ts` or artifacts.

| Mapping | Latest R | Quarters ≥70 | Quarters ≥80 | Median R | p90 R |
|---------|----------|--------------|--------------|----------|-------|
| QoQ growth percentile | **49** | 30.3% | 19.7% | 49.5 | 90 |
| YoY growth percentile | **74** | 28.9% | 19.7% | 47.5 | 89 |
| Blended 60% QoQ + 40% YoY percentile | **59** | 22.4% | 11.8% | 50.0 | 81 |
| Capped QoQ percentile (cap 75) | **49** | 30.3% | 0% | 49.5 | 75 |
| Manual bands on QoQ % | **58** | 31.6% | 10.5% | 58.0 | 76 |

**Note:** Manual QoQ bands happen to align with MOCK **58** for Q4 2025 (2.1% QoQ); this is coincidental, not wired.

---

## 7. Score-impact preview (MOCK 58 baseline)

Passive formula weight on retirement: **0.20**. Peers fixed at `buildGhostFlowSnapshot(GHOSTFLOW_REFERENCE_AS_OF)`; only `retirementFlowPressureProxy` (R) varies.

| Scenario | R | Passive | Composite | Band |
|----------|---|---------|-----------|------|
| **MOCK (current)** | **58** | **58** | **62** | Crowded / Reflexive |
| QoQ growth percentile | 49 | 56 | 61 | Crowded / Reflexive |
| YoY growth percentile | 74 | 61 | 64 | Crowded / Reflexive |
| Blended 60/40 percentile | 59 | 58 | 62 | Crowded / Reflexive |
| Manual bands on QoQ | 58 | 58 | 62 | Crowded / Reflexive |
| R=0 (floor) | 0 | 46 | 56 | Elevated Flow Pressure |
| R=100 (ceiling) | 100 | 66 | 66 | Crowded / Reflexive |

Wiring any percentile mapper would move passive ±3–6 points versus MOCK at current levels; composite band is often unchanged at these magnitudes.

---

## 8. Caveats

1. **Quarterly structural assets**, not live retirement-flow or payroll contribution telemetry.
2. **Market returns dominate** reported asset growth; contributions are not isolated.
3. **Lagged release** — Q4 2025 data published 2026-03-26; not real-time.
4. **Overlap risk** with other ICI-based GhostFlow artifacts (equity fund flows, etc.) — avoid double-counting if ever scored.
5. **Semantic mismatch:** “Retirement Asset Growth Proxy” ≠ “retirement-flow pressure” as named in the composite contract.

---

## 9. Recommendation preview

**Likely remain display-only** unless mapping and product explicitly approve score use in a future gate (**v1.2f**). No mapper selected in v1.2e. See [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md).

---

## 10. Reproduce

```bash
npm run ghostflow:retirement-flow-history-study -- --xls path/to/ret_25_q4_data.xls
npm run ghostflow:retirement-flow-history-study -- --xls path/to/ret_25_q4_data.xls --since 2007:Q1
```

Requires **Python 3** + **xlrd** for `.xls` parse. Optional `--out` writes research JSON (not committed by default).
