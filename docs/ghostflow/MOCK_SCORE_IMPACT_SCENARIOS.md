# Mock Score Impact Scenarios — GhostFlow v1.10d

**GhostFlow docs:** [README](./README.md) · [Score reproduction baseline](./SCORE_REPRODUCTION_BASELINE.md) · [Mock retirement roadmap](./MOCK_SCORE_RETIREMENT_ROADMAP.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Related mapping decisions (read-only reference):** [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) · [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md)

This memo is a **docs/research-only** score-impact scenario study. It compares hypothetical Passive / Composite outcomes against the v1.10c production baseline if MOCK passive inputs were retired, reweighted, frozen, or replaced under gated future scenarios. It does **not** change scoring, artifacts, UI, runtime, tests, or package configuration.

---

## Status

| Item | v1.10d posture |
|------|----------------|
| Document type | **Mock retirement score-impact scenario study** |
| Scope | **Docs / research only** |
| Scoring change | **None** |
| Artifact change | **None** |
| UI change | **None** |
| Runtime change | **None** |
| Test change | **None** |
| Package change | **None** |
| Score gate approval | **None** — v1.0c / v1.1f / v1.2f / v1.8i remain not approved |
| Display-only wiring | **None** — no display-only artifact is wired into score |

---

## Baseline

Canonical production baseline: [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md) (v1.10c).

| Item | Value |
|------|--------|
| **Reference as-of** | `2026-05-22` |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Composite** | **62** |
| **Band** | *Crowded / Reflexive* (61–80) |
| **`publicSignalCount`** | **12** (equity) |

**Passive formula** ([`scoring.ts`](../../lib/ghostflow/scoring.ts)):

```
round(0.25·ETF + 0.20·systematic + 0.20·vol + 0.20·retirement + 0.15·levered)
```

**Baseline Passive inputs (production merged):**

| Input | Value | Weight |
|-------|-------|--------|
| `etfFundFlowImpulse` | **75** | 25% |
| `systematicStrategyPressure` | **62** | 20% |
| `optionsVolatilityAmplifier` | **34** | 20% |
| `retirementFlowPressureProxy` | **58** | 20% |
| `leveredEtfRebalancePressure` | **55** | 15% |

**Reproduction:**

```
18.75 + 12.40 + 6.80 + 11.60 + 8.25 = 57.8 → 58
```

**Structural** remains **66** in all v1.10d scenarios unless explicitly stated otherwise.

**Composite baseline:** `round((58 + 66) / 2) = 62`

---

## Scenario methodology

| Rule | Detail |
|------|--------|
| Structural default | Fixed at **66** (v1.10c production structural inputs unchanged) |
| Composite | `round(0.5·Passive + 0.5·Structural)` per [`computeGhostFlowScore`](../../lib/ghostflow/scoring.ts) |
| Band | From [`ghostFlowBand`](../../lib/ghostflow/scoring.ts): 0–20 Quiet Plumbing · 21–40 Normal Mechanical · 41–60 Elevated Flow · **61–80 Crowded / Reflexive** · 81–100 Fragility Zone |
| Input clamp | Each passive input clamped 0–100 before weighted sum; final Passive rounded with `Math.round` |
| Proportional redistribution | When retiring mock slot with weight `w_r`, remaining passive weights sum to `W`. Each remaining input with original weight `w_i` receives `w_i + w_r · (w_i / W)` |
| Public-only normalization | When only ETF and vol remain: ETF weight **25/45**, vol weight **20/45** |
| Math source | All scenarios are **closed-form** calculations from the current scoring formula — **no script required** |
| Comparison anchor | All deltas vs v1.10c baseline **58 / 66 / 62** |

**Proportional redistribution example (C1 — retire systematic 20%):** Remaining weights sum **80**. ETF: `25 + 20×(25/80) = 31.25%`; vol/retirement: `25%` each; levered: `18.75%`.

**Public-only normalization (D):** `Passive = round((25/45)×75 + (20/45)×34)`.

---

## Scenario table

Consolidated results. Structural **66** for every row unless noted. Band labels use dashboard display names.

| ID | Short name | Passive inputs (ETF / sys / vol / ret / lev) | Passive weights | Passive | Structural | Composite | Band | Δ Passive | Δ Composite | Score model change? | Violates mapping? | Recommendation status |
|----|------------|-----------------------------------------------|-----------------|---------|------------|-----------|------|-----------|-------------|---------------------|-------------------|----------------------|
| **A** | Current baseline / control | 75 / 62 / 34 / 58 / 55 | 25% / 20% / 20% / 20% / 15% | **58** | **66** | **62** | Crowded / Reflexive | 0 | 0 | No | No | control |
| **B** | Disclosure-only / freeze mocks | 75 / 62 / 34 / 58 / 55 | 25% / 20% / 20% / 20% / 15% | **58** | **66** | **62** | Crowded / Reflexive | 0 | 0 | No | No | allowed as disclosure only |
| **C1** | Retire systematic + redistribute | 75 / — / 34 / 58 / 55 | 31.25% / — / 25% / 25% / 18.75% | **57** | **66** | **62** | Crowded / Reflexive | **−1** | 0 | **Yes** | No | product-gated |
| **C2** | Retire retirement + redistribute | 75 / 62 / 34 / — / 55 | 31.25% / 25% / 25% / — / 18.75% | **58** | **66** | **62** | Crowded / Reflexive | 0 | 0 | **Yes** | No | product-gated |
| **C3** | Retire levered + redistribute | 75 / 62 / 34 / 58 / — | 29.41% / 23.53% / 23.53% / 23.53% / — | **58** | **66** | **62** | Crowded / Reflexive | 0 | 0 | **Yes** | No | product-gated |
| **D** | Public Passive only (all MOCKs retired) | 75 / — / 34 / — / — | 55.6% / — / 44.4% / — / — | **57** | **66** | **62** | Crowded / Reflexive | **−1** | 0 | **Yes** | No | research only / product-gated |
| **E** | Zero MOCKs, no redistribution | 75 / 0 / 34 / 0 / 0 | 25% / 20% / 20% / 20% / 15% | **26** | **66** | **46** | Elevated Flow Pressure | **−32** | **−16** | **Yes** | No | not recommended |
| **F** | Neutral 50 placeholders | 75 / 50 / 34 / 50 / 50 | 25% / 20% / 20% / 20% / 15% | **53** | **66** | **60** | Elevated Flow Pressure | **−5** | **−2** | **Yes** | No | research only |
| **G-CFTC-C** | CFTC Mapping C hypothetical | 75 / **80** / 34 / 58 / 55 | 25% / 20% / 20% / 20% / 15% | **61** | **66** | **64** | Crowded / Reflexive | **+3** | **+2** | **Yes** | No | product-gated |
| **G-CFTC-A** | CFTC Mapping A illustrative | 75 / **93** / 34 / 58 / 55 | 25% / 20% / 20% / 20% / 15% | **64** | **66** | **65** | Crowded / Reflexive | **+6** | **+3** | **Yes** | **Yes** (Mapping A rejected for score) | not approved / rejected for score |
| **G-LEV-B** | Levered linear ×20 (preliminary) | 75 / 62 / 34 / 58 / **56** | 25% / 20% / 20% / 20% / 15% | **58** | **66** | **62** | Crowded / Reflexive | 0 | 0 | **Yes** | No | product-gated / not calibrated |
| **G-LEV-D** | Levered capped L=80 | 75 / 62 / 34 / 58 / **80** | 25% / 20% / 20% / 20% / 15% | **62** | **66** | **64** | Crowded / Reflexive | **+4** | **+2** | **Yes** | No | product-gated |
| **G-LEV-B10** | Levered linear ×10 (preliminary) | 75 / 62 / 34 / 58 / **28** | 25% / 20% / 20% / 20% / 15% | **54** | **66** | **60** | Elevated Flow Pressure | **−4** | **−2** | **Yes** | No | research only |
| **G-RET-YoY** | Retirement YoY percentile (hypothetical) | 75 / 62 / 34 / **74** / 55 | 25% / 20% / 20% / 20% / 15% | **61** | **66** | **64** | Crowded / Reflexive | **+3** | **+2** | **Yes** | No | discouraged hypothetical |
| **G-RET-QoQ** | Retirement QoQ percentile (hypothetical) | 75 / 62 / 34 / **49** / 55 | 25% / 20% / 20% / 20% / 15% | **56** | **66** | **61** | Crowded / Reflexive | **−2** | **−1** | **Yes** | No | discouraged hypothetical |

### Scenario notes

**A / B:** Control and disclosure-only paths — identical scores; B improves labels/docs without score model change.

**C1 math:** `0.3125×75 + 0.25×34 + 0.25×58 + 0.1875×55 = 56.75 → 57`

**D:** Measured-only Passive stress test — **not an implementation recommendation**. Removes all three MOCK slots and renormalizes ETF/vol to 100% of Passive weight.

**E:** Anti-pattern / stress case — zeroing MOCK inputs without redistribution or redesign. **Not a product path.** Illustrates why simply deleting mocks is invalid and excessively punitive.

**F:** Neutral **50** placeholders for all three MOCK slots; still a score-model change; composite drops to band boundary (**60** = Elevated Flow per `ghostFlowBand`).

**G rows:** All labeled **not approved / illustrative only**. No display-only artifact wiring. **G-CFTC-A** uses display-card Mapping A value **93** — explicitly **rejected** for score per [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md). **G-RET-*** rows are **discouraged** — do **not** recommend wiring retirement; v1.2f remains blocked. Retire/remove may be more plausible than wiring the current retirement artifact ([MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md)).

---

## Sensitivity analysis

### Current MOCK contributions (v1.10c baseline)

| MOCK input | Value | Passive weight | Composite weight | Passive term | Composite term (×0.5) |
|------------|-------|----------------|------------------|--------------|----------------------|
| `systematicStrategyPressure` | 62 | 20% | 10% | **12.40** | **6.20** |
| `retirementFlowPressureProxy` | 58 | 20% | 10% | **11.60** | **5.80** |
| `leveredEtfRebalancePressure` | 55 | 15% | 7.5% | **8.25** | **4.125** |

**Aggregate MOCK burden:** **32.25** of **57.8** passive pre-round (**55.8%**); **16.125** of **62.075** composite pre-round (**~26.0%**).

### ±5 and ±10 sensitivity (peers fixed; linear before rounding)

| MOCK input | Δ input | Δ Passive (pre-round) | Δ Composite (pre-round) |
|------------|---------|----------------------|-------------------------|
| systematic | ±5 | ±1.0 | ±0.5 |
| systematic | ±10 | ±2.0 | ±1.0 |
| retirement | ±5 | ±1.0 | ±0.5 |
| retirement | ±10 | ±2.0 | ±1.0 |
| levered | ±5 | ±0.75 | ±0.375 |
| levered | ±10 | ±1.5 | ±0.75 |

### Example ±10 score outcomes (rounded Passive / Composite)

| MOCK input | Change | New input | Passive | Composite | Band |
|------------|--------|-----------|---------|-----------|------|
| systematic | +10 | 72 | **60** | **63** | Crowded / Reflexive |
| systematic | −10 | 52 | **56** | **61** | Crowded / Reflexive |
| retirement | +10 | 68 | **60** | **63** | Crowded / Reflexive |
| retirement | −10 | 48 | **56** | **61** | Crowded / Reflexive |
| levered | +10 | 65 | **59** | **63** | Crowded / Reflexive |
| levered | −10 | 45 | **56** | **61** | Crowded / Reflexive |

**Insight:** At v1.10c baseline, ±10 on any single MOCK input moves Passive by at most **±2** (before rounding edge cases) and Composite by about **±1**, because Structural **66** anchors half the Research Composite.

---

## Display-only firewall

| Rule | v1.10d state |
|------|--------------|
| `systematic-flow` display value **93** | **Not approved** as score input — Mapping A rejected for composite; card remains display-only |
| `retirement-asset-growth` QoQ **2.1%** | **Not** a score input — asset growth ≠ retirement-flow pressure |
| `levered-etf-rebalance` **2.78%** rebalance/AUM | **Not** a score input — display estimate only |
| `options-activity-proxy`, `index-inclusion-events`, `cap-weight-premium` | Remain **display-only** — no score path |
| Mapping decisions | **Not reopened** — v1.0b, v1.1e, v1.2e display-only defaults stand |
| Score input substitution | No display-card numeric may replace a score input without **mapping decision revision + product approval** |
| `publicPassiveInputKey` | **Not added** in v1.10d or any scenario row |

---

## Product interpretation

| Family | User meaning | Trust | Public-measured | Continuity | Methodology / tests |
|--------|--------------|-------|-----------------|------------|---------------------|
| **A / B** | Same score; clearer MOCK disclosure | Improves transparency without score shock | No change (45% passive weight still public at baseline) | Full | Copy/disclosure only — **no test changes** |
| **C** | Remove one static slot; renormalize passive weights | Removes one MOCK label; modest trust gain | Increases public share of passive **weight** | Moderate — Passive formula changes | Full Passive pillar rewrite + methodology; **tests required** if implemented |
| **D** | “Measured-only Passive” thought experiment | Highest passive transparency in scenario set | 100% public passive inputs | Changes Passive pillar semantics | Major rewrite — **not default recommendation**; **tests required** |
| **E** | Anti-pattern demonstration | **Damages trust** if shipped | Illusory “improvement” | Severe score discontinuity | Invalid design — **not recommended** |
| **F** | Neutral-placeholder stress test | Less “picked” static values | No | Moderate (−2 composite) | Still a score-model change; **tests required** |
| **G** | Future gate previews only | Only if clearly labeled hypothetical | Mixed by gate | Varies (+2 to +6 composite for some CFTC paths) | Per-gate rename, mapping docs, UI disclosure; **cannot bypass display-only decisions** |

**Key finding:** At v1.10c baseline, most scenario families leave **Composite 62** and band **Crowded / Reflexive** unchanged because Structural **66** anchors half the score. MOCK retirement/reweighting moves **Passive** more than **Composite** at these magnitudes.

---

## Recommendation

| Item | v1.10d recommendation |
|------|----------------------|
| Scoring change | **None** — use v1.10d as scenario study only |
| Display-only wiring | **Do not** wire display-only cards into score |
| Zero mocks (E) | **Do not** — invalid anti-pattern |
| Weight / formula change | **Do not** without explicit product approval |
| Mapping A / display values | **Do not** use as score inputs (G-CFTC-A illustrative only) |
| Retirement wiring | **Do not recommend** — v1.2f remains discouraged |

**Recommended next paths (if desired):**

| Phase | Scope |
|-------|--------|
| **v1.10e** | Disclosure-only finalization / no-score-change policy (Scenario B path) |
| **v1.8i** | Full Passive pillar rewrite / reweighting study — **explicit product approval only** |
| **v1.0c / v1.1f / v1.2f** | Individual score wiring gates — **only if product-approved** after calibration + score-impact tables |

If any gate opens later: prefer **Mapping C** (CFTC), **capped/percentile** (levered), not Mapping A or raw display-card values. Retirement **retire/remove** may be more plausible than wiring the current artifact.

---

## Future implementation gates

| Gate | v1.10d status |
|------|---------------|
| **v1.0c** (systematic / CFTC) | **Not approved** |
| **v1.1f** (levered ETF) | **Not approved** |
| **v1.2f** (retirement) | **Discouraged / blocked** |
| **v1.8i** (Passive reweight / rewrite) | **Future only** |

Any future implementation requires: score-impact tables vs v1.10c baseline, methodology/UI updates, `npm run test:ghostflow` (minimum), and explicit product approval.

---

## No-change confirmation

| Item | v1.10d confirmation |
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
