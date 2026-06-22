# Score Reproduction Baseline — GhostFlow v1.10c

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [Mock retirement roadmap](./MOCK_SCORE_RETIREMENT_ROADMAP.md) · [Roadmap](./DATA_ROADMAP.md)

**Related code (read-only reference):** [`scoring.ts`](../../lib/ghostflow/scoring.ts) · [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) · [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) · [`ghostflowCurrentState.test.ts`](../../lib/ghostflow/__tests__/ghostflowCurrentState.test.ts)

This memo is the **canonical production score reproduction baseline** for GhostFlow. It documents exact score math, production merged score-input values, per-input contributions, and the distinction between score inputs and display-only card values. It does **not** change scoring, artifacts, UI, runtime, tests, or package configuration.

> **v1.13 footnote:** This memo records the **v1.10c** baseline at equity `publicSignalCount` **12** (6 score-fed + 6 display-only). Current inventory is **13** signals (7 display-only) after Tail Skew v1.9e.4 — see [CURRENT_DATA_READINESS_AUDIT.md](./CURRENT_DATA_READINESS_AUDIT.md). Score math and **62 / 58 / 66** reproduction at reference **2026-05-22** remain authoritative here.

---

## Status

| Item | v1.10c posture |
|------|----------------|
| Document type | **Score reproduction baseline / mock contribution audit** |
| Scope | **Docs-only** |
| Scoring change | **None** |
| Artifact change | **None** |
| UI change | **None** |
| Runtime change | **None** |
| Test change | **None** |
| Package change | **None** |

---

## Canonical baseline

| Item | Value |
|------|--------|
| **Reference as-of** | `2026-05-22` ([`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts)) |
| **`publicSignalCount`** | **12** (equity) |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Composite** | **62** |
| **Band** | *Crowded / Reflexive* (61–80) |
| **Score-fed equity/public artifacts** | **6** |
| **Display-only equity/public artifacts** | **6** |
| **Treasury lane** | **2** separate display-only cards — **not** counted in equity `publicSignalCount`; **not** scored |

**Build path:** [`buildGhostFlowSnapshot()`](../../lib/ghostflow/buildSnapshot.ts) clones [`MOCK_GHOSTFLOW_SNAPSHOT`](../../data/ghostflow/mockGhostflowSnapshot.ts), overwrites score slots from validated production artifacts, then [`scoreGhostFlowSnapshot()`](../../lib/ghostflow/scoring.ts) computes headline scores. Automated anchor: [`ghostflowCurrentState.test.ts`](../../lib/ghostflow/__tests__/ghostflowCurrentState.test.ts).

---

## Formula audit

Formulas from [`scoring.ts`](../../lib/ghostflow/scoring.ts):

**Passive Pressure:**

```
round(0.25·etf + 0.20·systematic + 0.20·vol + 0.20·retirement + 0.15·levered)
```

**Structural Fragility:**

```
round(0.30·passiveShare + 0.20·activeIndex + 0.20·concentration + 0.15·breadth + 0.15·modelZone)
```

**Composite:**

```
round(0.5·Passive + 0.5·Structural)
```

**Rounding and clamping:**

- Each input is clamped to **0–100** via `clampInput` (`clampInt(n, 0, 100)`) before the weighted sum.
- Score outputs use **`Math.round`** on the weighted sum, then clamp to 0–100.
- **No per-term rounding** before the weighted sum — only input clamp and final score round.
- **Band:** composite **61–80** → `crowded_reflexive` / *Crowded / Reflexive*.

**Input key map:**

| Passive key | Structural key |
|-------------|----------------|
| `etfFundFlowImpulse` | `passiveShareProxy` |
| `systematicStrategyPressure` | `activeShareOffsetProxy` |
| `optionsVolatilityAmplifier` | `indexConcentration` |
| `retirementFlowPressureProxy` | `breadthWeakness` |
| `leveredEtfRebalancePressure` | `modelZoneProximity` |

---

## Production score input table

Ten score-input keys at the v1.10c production baseline (`buildGhostFlowSnapshot()` + production artifacts, reference `2026-05-22`).

| # | Input key | Score value | Source | Artifact / file | Raw observation | `publicPassiveInputKey` | Notes |
|---|-----------|-------------|--------|-----------------|-----------------|-------------------------|-------|
| 1 | `etfFundFlowImpulse` | **75** | Public artifact mapper | `etfNetIssuance.v1.json` | **33,919** $M domestic equity weekly net issuance | **Yes** | [`mapDomesticEquityIssuanceToNumericValue`](../../lib/ghostflow/artifacts/etfNetIssuance.ts) |
| 2 | `systematicStrategyPressure` | **62** | MOCK / static | `mockGhostflowSnapshot.ts` | — | **No** | Display card `systematic-flow` shows **93** (CFTC basket score) — does **not** replace score input |
| 3 | `optionsVolatilityAmplifier` | **34** | Public artifact mapper | `volatilityRegime.v1.json` | VIX close **16.7** | **Yes** | [`mapVixCloseToNumericValue`](../../lib/ghostflow/artifacts/volatilityRegime.ts); `options-activity-proxy` is separate display-only |
| 4 | `retirementFlowPressureProxy` | **58** | MOCK / static | `mockGhostflowSnapshot.ts` | — | **No** | Display card `retirement-asset-growth` shows QoQ **2.1%** — does **not** replace score input |
| 5 | `leveredEtfRebalancePressure` | **55** | MOCK / static | `mockGhostflowSnapshot.ts` | — | **No** | Display card `levered-etf-rebalance` shows **2.78%** rebalance/AUM — does **not** replace score input |
| 6 | `passiveShareProxy` | **63** | Public artifact mapper | `passiveShareProxy.v1.json` | **63.2%** ICI index asset share | — (structural) | [`mapIndexSharePercentToStructuralProxy`](../../lib/ghostflow/artifacts/passiveShareProxy.ts) |
| 7 | `activeShareOffsetProxy` | **72** | Public artifact mapper | `activeIndexFlow.v1.json` | **53,714** $M flow differential (31,463 − (−22,251)) | — (structural) | [`mapFlowDifferentialToNumericValue`](../../lib/ghostflow/artifacts/activeIndexFlow.ts) |
| 8 | `indexConcentration` | **70** | Public artifact mapper | `indexConcentration.v1.json` | Top-10 index weight **36.5%** | — (structural) | [`mapTop10WeightToNumericValue`](../../lib/ghostflow/artifacts/indexConcentration.ts) |
| 9 | `breadthWeakness` | **41** | Public artifact mapper | `marketBreadth.v1.json` | **58.0%** above 50-DMA | — (structural) | [`mapSp500Above50MaToBreadthWeakness`](../../lib/ghostflow/artifacts/marketBreadth.ts) |
| 10 | `modelZoneProximity` | **86** | Derived from passive-share artifact | `passiveShareProxy.v1.json` | **1.8 pp** below 65% model-stress zone | — (structural) | [`mapDistanceToZoneNumericValue(1.8)`](../../lib/ghostflow/artifacts/passiveShareProxy.ts) |

**Mock snapshot defaults (fallback only — not production baseline):** ETF **64**, vol **70**. Used when artifacts fail validation or in pure-mock tests ([`scoring.test.ts`](../../lib/ghostflow/__tests__/scoring.test.ts)).

---

## Baseline reproduction

**Passive** (pre-round sum → rounded sub-score):

```
0.25×75 + 0.20×62 + 0.20×34 + 0.20×58 + 0.15×55
= 18.75 + 12.40 + 6.80 + 11.60 + 8.25
= 57.8 → 58 ✓
```

**Structural** (pre-round sum → rounded sub-score):

```
0.30×63 + 0.20×72 + 0.20×70 + 0.15×41 + 0.15×86
= 18.90 + 14.40 + 14.00 + 6.15 + 12.90
= 66.35 → 66 ✓
```

**Composite** (from rounded sub-scores):

```
round((58 + 66) / 2) = round(62) = 62 ✓
```

**Pre-round composite cross-check:**

```
0.5×57.8 + 0.5×66.35 = 28.9 + 33.175 = 62.075 → 62 ✓
```

**Band:** **62** → *Crowded / Reflexive* (61–80) ✓

**Result:** Reproduction **passes**. **No blocker.** Future score-impact studies (v1.10d and beyond) must compare scenario deltas against this v1.10c baseline.

---

## MOCK contribution table

Three static passive inputs from [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts). Display-only cards do **not** feed the score.

| Input key | Value | Passive weight | Composite weight | Passive term | Composite term (×0.5) | Display card | Display value | Affects score? |
|-----------|-------|----------------|------------------|--------------|----------------------|--------------|---------------|----------------|
| `systematicStrategyPressure` | **62** | 20% | 10% | **12.40** | **6.20** | `systematic-flow` | **93** | **No** — [v1.0b display-only](./CFTC_TFF_MAPPING_DECISION.md) |
| `retirementFlowPressureProxy` | **58** | 20% | 10% | **11.60** | **5.80** | `retirement-asset-growth` | QoQ **2.1%** | **No** — [v1.2e display-only](./RETIREMENT_FLOW_MAPPING_DECISION.md) |
| `leveredEtfRebalancePressure` | **55** | 15% | 7.5% | **8.25** | **4.125** | `levered-etf-rebalance` | **2.78%** | **No** — [v1.1e display-only](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) |

**Aggregates:**

| Metric | Value |
|--------|-------|
| MOCK share of Passive **weight** | **55%** (20% + 20% + 15%) |
| MOCK share of Composite **weight** | **27.5%** (half of 55%) |
| MOCK weighted sum into Passive (pre-round) | **32.25** of **57.8** (**55.8%** of passive terms) |
| MOCK contribution into Composite (pre-round) | **16.125** of **62.075** (**~26.0%** of composite terms) |

**Note:** Numeric contribution share differs from weight share because MOCK input values differ from public mapper outputs.

---

## Public score-fed contribution table

### Passive (public)

| Input key | Value | Passive weight | Composite weight | Passive term | Composite term (×0.5) |
|-----------|-------|----------------|------------------|--------------|----------------------|
| `etfFundFlowImpulse` | **75** | 25% | 12.5% | **18.75** | **9.375** |
| `optionsVolatilityAmplifier` | **34** | 20% | 10% | **6.80** | **3.40** |

Public passive terms (pre-round): **25.55** of **57.8** (**44.2%** of passive sum).

### Structural (all public at baseline)

| Input key | Value | Structural weight | Composite weight | Structural term | Composite term (×0.5) |
|-----------|-------|-------------------|------------------|-----------------|----------------------|
| `passiveShareProxy` | **63** | 30% | 15% | **18.90** | **9.45** |
| `activeShareOffsetProxy` | **72** | 20% | 10% | **14.40** | **7.20** |
| `indexConcentration` | **70** | 20% | 10% | **14.00** | **7.00** |
| `breadthWeakness` | **41** | 15% | 7.5% | **6.15** | **3.075** |
| `modelZoneProximity` | **86** | 15% | 7.5% | **12.90** | **6.45** |

Structural terms (pre-round): **66.35** → composite half **33.175**.

**Summary:**

- **Structural** is **100% public-fed** at this baseline.
- **Passive** is **mixed** — public (ETF + vol) plus three MOCK/static slots.

---

## Display-only versus score-input distinction

Display-only equity public artifacts refresh dashboard cards only. They do **not** set `publicPassiveInputKey` and do **not** overwrite score-input keys in [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts).

| Display card | Display value | Score input | Score value | Relationship |
|--------------|---------------|-------------|-------------|--------------|
| `systematic-flow` | **93** (CFTC basket score) | `systematicStrategyPressure` | **62** | Display does **not** replace score input |
| `retirement-asset-growth` | QoQ **2.1%** asset growth | `retirementFlowPressureProxy` | **58** | Display does **not** replace score input |
| `levered-etf-rebalance` | **2.78%** rebalance/AUM | `leveredEtfRebalancePressure` | **55** | Display does **not** replace score input |
| `options-activity-proxy` | Index options intensity | `optionsVolatilityAmplifier` | **34** (from VIX) | Separate lane — VIX remains scored vol input |
| `index-inclusion-events` | Operator-curated events | — | — | No score path |
| `cap-weight-premium` | Cap-weight premium study | — | — | No score path; companion to score-fed `concentration` |

**Rule:** No display-only artifact has `publicPassiveInputKey`. Card refresh ≠ composite input refresh for MOCK slots or display-only lanes.

---

## Documentation consistency notes

Prior docs mixed **mock snapshot defaults** with **production merged score-input values** for public passive keys. This memo resolves that ambiguity.

| Issue | Detail |
|-------|--------|
| [`MOCK_SCORE_RETIREMENT_ROADMAP.md`](./MOCK_SCORE_RETIREMENT_ROADMAP.md) inventory table | Previously listed ETF **64** and vol **70** — those are **mock snapshot defaults**, not production baseline score inputs (**75**, **34**). v1.10c roadmap update clarifies both columns. |
| ETF mock vs production | Mock default **64** → production merged **`etfFundFlowImpulse` 75** (ICI **33,919** $M issuance) |
| Vol mock vs production | Mock default **70** → production merged **`optionsVolatilityAmplifier` 34** (VIX **16.7**) |
| Test fixtures | [`scoring.test.ts`](../../lib/ghostflow/__tests__/scoring.test.ts) scores pure `MOCK_GHOSTFLOW_SNAPSHOT` → Passive **62**, Structural **62**, Composite **62**. [`ghostflowCurrentState.test.ts`](../../lib/ghostflow/__tests__/ghostflowCurrentState.test.ts) asserts the **production merged** dashboard baseline → **58 / 66 / 62**. Both are correct for their scope — not a contradiction. |
| Canonical baseline | **This v1.10c memo** is the canonical production baseline for score-impact studies and mock retirement planning. |

---

## v1.10d score-impact scenario study

**Done (docs/research-only):** [MOCK_SCORE_IMPACT_SCENARIOS.md](./MOCK_SCORE_IMPACT_SCENARIOS.md) — hypothetical Passive / Composite outcomes if MOCK passive inputs were retired, reweighted, or replaced under gated scenarios. All scenario deltas compare against this v1.10c baseline (**58 / 66 / 62**). **No score, artifact, UI, runtime, test, or package changes.**

---

## v1.10e no-score-change policy

**Done (docs-only):** [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) — formal Option A decision; v1.10 score-integrity sequence closed; gates remain closed. **This v1.10c baseline remains canonical** until a product-approved score change.

---

## Future score-impact prerequisites

Before any **future** score-impact work beyond v1.10d or any score wiring gate:

1. **Baseline lock** — v1.10c values must reproduce current Composite **62** / Passive **58** / Structural **66** from code + artifacts at study time.
2. **Scenario deltas** — compare against v1.10c baseline tables (per-input value, weighted term, sub-scores, composite, band).
3. **Score-input keys only** — scenario tables may change only the ten score-input keys; mappers unchanged unless explicitly approved.
4. **Display-only firewall** — no display-card numeric value (e.g. CFTC **93**, retirement **2.1%**, levered **2.78%**) may substitute for a score input without reopening mapping decisions and obtaining product approval.
5. **Before/after tables required** — Passive, Structural, Composite, and band for each scenario.
6. **Implementation gate** — any future score wiring requires updated tests (`npm run test:ghostflow` minimum), methodology/UI disclosure updates, and explicit product approval (v1.0c / v1.1f / v1.2f / v1.8i as applicable).

---

## No-change confirmation

| Item | v1.10c confirmation |
|------|---------------------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | **Unchanged** |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | **Unchanged** |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | **Unchanged** |
| Production artifact JSON | **Unchanged** |
| UI components | **Unchanged** |
| Tests | **Unchanged** |
| `package.json` | **Unchanged** |
| **Composite** | **62** — unchanged |
| **Passive Pressure** | **58** — unchanged |
| **Structural Fragility** | **66** — unchanged |
| **`publicSignalCount`** | **12** (equity) — unchanged |
| GhostRegime / Marketstack / GhostYield / Models / builder | **Out of scope — untouched** |

No score changes without explicit product approval.
