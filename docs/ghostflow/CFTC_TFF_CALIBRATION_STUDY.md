# CFTC TFF Calibration Study (GhostFlow v1.0a)

**Status:** Research only — no score wiring, no `buildSnapshot` merge, no changes to production artifacts.  
**Run date:** 2026-05-20 (via `npm run ghostflow:cftc-tff-history-study`)  
**Related:** [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) · [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) · production artifact [`systematicFlowProxy.v1.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.json)

---

## 1. Purpose

Before replacing the MOCK `systematicStrategyPressure` input (**62**) with the CFTC TFF leveraged-funds basket proxy, characterize **historical crowding** and test whether the current **linear mapping** (`basketScore = clamp(round(abs(basketNetPctOi) × 5), 0, 100)`) is well calibrated or too aggressive.

GhostFlow v0.9f shows the proxy as a **display-only** public card. This study does **not** change the Research Composite.

---

## 2. Methodology

| Item | Value |
|------|--------|
| Dataset | CFTC Traders in Financial Futures (TFF) — **Futures Only** |
| PRE dataset ID | `gpe5-46if` |
| SODA endpoint | `https://publicreporting.cftc.gov/resource/gpe5-46if.json` |
| Access | Unauthenticated PRE/SODA (operator script only) |
| Filter | `futonly_or_combined = 'FutOnly'` |
| Trader class | **Leveraged Funds** long/short/spread vs `open_interest_all` |
| Basket | OI-weighted net % across three MVP contracts |
| Alignment | One row per `report_date_as_yyyy_mm_dd` per contract; **week skipped** if any MVP code missing |
| Basket math | Reuses `computeBasketMetrics` / `mapBasketNetPctOiToPressureScore` from [`lib/ghostflow/artifacts/systematicFlowProxy.ts`](../lib/ghostflow/artifacts/systematicFlowProxy.ts) |
| Script | `npm run ghostflow:cftc-tff-history-study` → [`scripts/ghostflow/cftc-tff-history-study.ts`](../scripts/ghostflow/cftc-tff-history-study.ts) |
| Helpers | [`lib/ghostflow/research/cftcTffHistory.ts`](../lib/ghostflow/research/cftcTffHistory.ts) |

### Contract universe (score basket)

| Code | Contract |
|------|----------|
| `13874A` | E-mini S&P 500 |
| `209742` | Nasdaq Mini |
| `239742` | Russell E-mini |

VIX (`1170E1`) is **not** included in the basket score (optional appendix only).

### Missing / stale handling

- **No forward-fill** across missing contracts.
- If any MVP contract is absent for a report date, that week is **skipped** and counted in `skippedWeeks`.
- Early TFF history has many partial weeks (especially before all three mini/index codes align).

---

## 3. Data range and alignment

| Metric | Value |
|--------|--------|
| Raw report dates seen | 1,041 |
| **Aligned weeks (N)** | **575** |
| Skipped weeks | 466 |
| **Aligned date range** | **2006-06-20** → **2026-05-19** |
| Rows fetched (MVP codes) | 2,659 |

First aligned week: **2006-06-20**. Skips before that are dominated by missing `13874A` / `209742` / `239742` on the same Tuesday report.

---

## 4. Latest / current week (production artifact week)

| Field | Value |
|-------|--------|
| Report date (`asOf`) | 2026-05-19 |
| Report week | 2026 Report Week 20 |
| `basketNetPctOi` | **-18.5%** |
| `basketAbsNetPctOi` | **18.5%** |
| `basketDirection` | **net_short** |
| `basketScore` (mapping A) | **93** |
| Percentile of \|net % OI\| vs history | **91.5th** |
| Percentile of signed net % OI | **8.5th** (among most net-short weeks) |

Production artifact cross-check: script reproduces **-18.5% / score 93 / net_short** for 2026-05-19.

---

## 5. Distribution tables (aligned weeks, mapping A)

### Signed basket net % OI

| Stat | Value |
|------|--------|
| min | -25.5% |
| p25 | -15.9% |
| median | -10.9% |
| p75 | -6.3% |
| max | +5.2% |
| mean | -10.6% |

### Absolute basket net % OI (crowding magnitude)

| Stat | Value |
|------|--------|
| min | 0% |
| p25 | 6.4% |
| median | 10.9% |
| p75 | 15.9% |
| max | 25.5% |
| mean | 10.8% |

### `basketScore` under mapping A (`abs(netPctOi) × 5`, capped 0–100)

| Stat | Value |
|------|--------|
| min | 0 |
| p25 | 32 |
| median | 55 |
| p75 | 80 |
| max | 100 |
| mean | 53.7 |

### Weeks at or above score thresholds (mapping A)

| Threshold | Weeks | % of aligned history |
|-----------|-------|----------------------|
| ≥ 70 | 202 | **35.1%** |
| ≥ 80 | 145 | **25.2%** |
| ≥ 90 | 68 | **11.8%** |

**Interpretation:** The fixed ×5 mapping spends **roughly one quarter** of history at ≥80 and **~12%** at ≥90. The current week (**93**) is high but not unique (68 historical weeks ≥90).

### Direction mix

| Direction | % of weeks |
|-----------|------------|
| net_short | **93.0%** |
| net_long | 2.1% |
| flat | 4.9% |

Leveraged-funds positioning in this basket is **predominantly net short** over the sample (magnitude scoring ignores sign).

### Extremes

**Top 5 net-short weeks (lowest signed % OI):**

| Date | net % OI | score | direction |
|------|----------|-------|-----------|
| 2007-03-20 | -25.5% | 100 | net_short |
| 2007-03-27 | -25.3% | 100 | net_short |
| 2022-08-16 | -24.3% | 100 | net_short |
| 2007-04-03 | -23.9% | 100 | net_short |
| 2007-04-10 | -23.2% | 100 | net_short |

**Top 5 net-long weeks (highest signed % OI):**

| Date | net % OI | score | direction |
|------|----------|-------|-----------|
| 2007-01-16 | +5.2% | 26 | net_long |
| 2018-12-24 | +4.4% | 22 | net_long |
| 2007-01-09 | +4.3% | 22 | net_long |
| 2022-01-25 | +4.0% | 20 | net_long |
| 2018-02-06 | +3.0% | 15 | net_long |

---

## 6. Mapping comparison (full aligned history)

Latest week scores under each mapping:

| Mapping | Latest score | % weeks ≥70 | % weeks ≥80 | % weeks ≥90 | Median | p90 |
|---------|--------------|-------------|-------------|-------------|--------|-----|
| **A — Fixed** `abs(netPctOi)×5` | **93** | 35.1% | 25.2% | 11.8% | 55 | 91 |
| **B — Percentile** rank of abs(netPctOi) | 92 | 30.3% | 20.2% | 10.8% | 50 | 90 |
| **C — Capped linear** (cap 80) | 80 | 35.1% | 25.2% | **0%** | 55 | 80 |
| **D — Z-score** `50+15z` on abs(netPctOi) | 70 | 9.2% | 0.9% | 0% | 50 | 69 |

**Implications:**

- **A (current):** Simple and matches production artifact; **elevated** frequency of 80+ scores; current week **93** is ~91st percentile on crowding magnitude.
- **B:** Adapts to history; similar tail frequency to A but scores track rank not absolute pp.
- **C:** Limits saturation at 90+ but still allows many 80s; latest week lands on cap (**80**).
- **D:** Much lower tail frequency; latest week **70** — may understate current crowding vs A.

---

## 7. Score-wiring preview (v1.0 evaluation, unchanged by this study)

If `systematicStrategyPressure` were set from mapping A **93** instead of MOCK **62** (20% passive weight, no other changes):

| Metric | Current (MOCK) | Direct wire (93) |
|--------|----------------|------------------|
| Passive Pressure | 58 | **64** (+6) |
| Structural Fragility | 66 | 66 |
| Composite | 62 | **65** (+3) |
| Band | Crowded / Reflexive | Crowded / Reflexive |

Wiring is **moderate** on the composite but **large** on the sub-input display (62→93).

---

## 8. Recommendation (future v1.0c)

> **v1.0b decision:** Formal policy is in [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) (formalizes this study’s findings; this memo remains supporting evidence). **Display card keeps Mapping A.** Score remains **display-only**. If wiring is product-approved in **v1.0c**, preferred score candidate is **Mapping C** (`scoreInput = min(80, basketScore)`) **after rename** — not under “Systematic strategy pressure.”

**Default: remain display-only** until product explicitly approves score wiring with renamed copy and a chosen mapping policy.

| Path | When to use |
|------|-------------|
| **Stay display-only** | Preferred short term — history shows mapping A is usable but **labeling** “systematic strategy pressure” is wrong; current week is historically crowded (91.5th \|%OI\|) but not a formula shock to composite (+3). |
| **Rename + direct wire (mapping A)** | Only after renaming score sub-input to **“Leveraged-funds futures positioning proxy”**, PUBLIC badge, methodology/caveat updates, and score-impact tests. Accept **35%** of weeks ≥70 on this input. |
| **Rename + capped wire (mapping C, cap 80)** | Softer sub-input (**80** today); eliminates 90+ readings; composite impact slightly lower. |
| **Rename + percentile wire (mapping B)** | Regime-adaptive; harder to explain; similar tail stats to A. |
| **Do not wire under old label** | **Strongly discouraged** — positioning ≠ systematic flow; Leveraged Funds ≠ CTA/vol-control/risk-parity. |

---

## 9. Caveats

1. **Positioning is not flow** — CFTC open interest by regulatory bucket is not ETF flow, vol-control, or mechanical rebalance schedules.
2. **Leveraged Funds ≠ CTA / vol-control / risk-parity** — category labels are not strategy labels.
3. **Historical extremes do not guarantee forward risk** — 2007 and 2022 appear in tails; past crowding ≠ crash forecast.
4. **Cadence mismatch** — CFTC is weekly; composite mixes daily, weekly, and monthly inputs.
5. **Basket scope** — ES + NQ mini + RTY mini only; not full equity derivatives complex.
6. **Sign ignored in score** — `basketScore` uses \|net % OI\|; net-short regime dominates history.
7. **Skipped weeks** — 466 incomplete weeks excluded; early sample is thinner.

---

## 10. Reproduce

```bash
npm run ghostflow:cftc-tff-history-study
```

Optional:

```bash
npm run ghostflow:cftc-tff-history-study -- --since 2020-01-01
npm run ghostflow:cftc-tff-history-study -- --out data/ghostflow/research/cftcTffBasketWeekly.v1.json
```

Research JSON is **not** committed by default. Use `--out` locally for review only.

---

## Related documents

- [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — v1.0b mapping/product decision  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase tracking  
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — weekly artifact refresh  
- [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) — artifact schema and mapping definition
