# Cap-Weight Premium Mapping Decision — GhostFlow v1.9b.5

**Status:** Decision record only — **docs-only**; **no implementation** in v1.9b.5 (no score wiring, no code, artifact, UI, test, or runtime changes).  
**Effective:** 2026-06-17  
**Related:** [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) · [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md)

This memo formalizes the **v1.9b.5 mapping/product decision** for the operator-transcribed **Cap-Weight Premium Proxy** (`cap-weight-premium-proxy`). No score mapper is selected in v1.9b.5. Future score wiring remains product-gated and discouraged. **v1.9b.6 is not approved.**

---

## Status

| Item | v1.9b.5 posture |
|------|-----------------|
| Document type | **Mapping / product decision only** (docs-only) |
| Code changes | **None** |
| Artifact JSON changes | **None** |
| UI / `buildSnapshot` changes | **None** |
| Test changes | **None** |
| Runtime / live fetch changes | **None** |
| Production artifact | **Exists** — [`capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json) |
| Display card | **Exists** — `cap-weight-premium` |
| `mappingStatus` | Remains **`not_final`** |
| Selected option | **A — Keep display-only by default** |
| Final 0–100 mapper | **None selected** |
| **`publicPassiveInputKey`** | **None** |
| New MOCK score slot | **None** |
| **v1.9b.6** score wiring | **Not approved**; **discouraged** by default |

---

## Background

| Phase | Outcome |
|-------|---------|
| **v1.9b** | Cap-Weight Concentration Premium Feasibility — [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) (**YELLOW leaning GREEN**) |
| **v1.9b.1** | CSV study script — `npm run ghostflow:cap-weight-premium-study`; operator CSVs only; not in `ghostflow:check` |
| **v1.9b.1a** | Calibration study — [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md); real operator run exit **0**; longer horizons elevated; short horizons mixed |
| **v1.9b.2** | Artifact design — [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md); display-only default |
| **v1.9b.3** | Example JSON + validator — [`capWeightPremiumProxy.v1.example.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json); not in production `validate-artifacts` path for example file |
| **v1.9b.4a** | Reference-aligned operator run through **2026-05-22** (local study JSON; not committed) |
| **v1.9b.4** | Production artifact + display-only card — [`capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json); `publicSignalCount` **11 → 12**; not scored |

Current production data uses **reference-aligned 2026-05-22** SPY/RSP adjusted-close study output (5,803 aligned observations). The Research Composite does **not** consume this artifact today.

---

## Current artifact and display card

### Production artifact

**File:** [`data/ghostflow/artifacts/capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json)

| Field | Value |
|-------|--------|
| `signalId` | `cap-weight-premium-proxy` |
| `asOf` | **2026-05-22** |
| `publishedAt` | **2026-06-17** |
| `latestDate` | **2026-05-22** |
| `dataQuality` | **manual_unverified** |
| `mappingStatus` | **`not_final`** |
| SPY/RSP ratio | **3.6094** |
| Ratio percentile | **99.6** |
| 5Y spread | **+42.74%** |
| 5Y premium percentile | **99.8** |
| 1M spread | **+3.21%** |
| 1M percentile | **97.3** |
| 6M percentile | **51.6** |
| Aligned observations | **5,803** (2003-05-01 → 2026-05-22) |
| Score fields | **None** |
| `publicPassiveInputKey` | **None** |

### Display card (v1.9b.4)

| Item | Value |
|------|--------|
| Card id | `cap-weight-premium` |
| Title | **Cap-Weight Premium Proxy** |
| Headline | **5Y premium percentile: 99.8** |
| Badge | **DISPLAY ONLY** |
| `dataStatus` | `public_proxy` |
| `updateFrequencyTarget` | Weekly (manual artifact) |
| Research Composite | **Not included** |
| `publicSignalCount` | **12** |
| `publicPassiveInputKey` | **None** |

Display wiring: `applyCapWeightPremiumDisplayArtifact` in `buildSnapshot.ts` (v1.9b.4). No score merge.

---

## Current score context

| Input / output | Value |
|----------------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |
| Score-fed equity public artifacts | **6** |
| Display-only equity public artifacts | **6** (cap-weight premium is the sixth) |
| **`cap-weight-premium-proxy`** | **Display-only by default** — no passive sub-input key; no score contribution |
| MOCK passive inputs (unchanged) | `systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55** |

Passive weights in `lib/ghostflow/scoring.ts` (unchanged): 25% ETF flow, 20% systematic, 20% options/vol (VIX), 20% retirement, 15% levered — **five** slots totaling 100%. Structural weights (unchanged): 30% passive share, 20% active/index flow, 20% concentration, 15% breadth, 15% model-zone proximity. There is **no** sixth passive weight and **no** natural replacement target for cap-weight premium without score-model surgery (add slot + reweight, or replace an existing input such as `concentration`). Unlike CFTC, levered, and retirement display proxies, cap-weight premium has **no related MOCK passive sub-input** — wiring would require both a new semantic slot and a structural scoring change.

**v1.9b.5 score impact:** **Zero.**

---

## Decision table

| Option | Description | v1.9b.5 decision |
|--------|-------------|------------------|
| **A** | **Keep display-only by default** — card shows spread/ratio percentiles; no mapper; `mappingStatus` **not_final** | **Selected** |
| **B** | Map 5Y percentile → 0–100 | **Reject / defer** — percentile is historical context, not validated pressure telemetry; risks mislabeling relative performance as passive-flow pressure |
| **C** | Blend 1Y / 3Y / 5Y percentiles | **Reject / defer** — overlapping windows amplify the same effect; creates synthetic score without causal model |
| **D** | Ratio percentile mapper | **Reject / defer** — high SPY/RSP ratio may indicate cap-weight leadership, but not necessarily crowding, liquidity risk, or flow pressure |
| **E** | Replace `concentration` or another structural input | **Reject** — score-model redesign; requires separate product gate and impact study |
| **F** | Add sixth passive/structural weight | **Reject** — composite surgery; alters documented pillar weights |

---

## Mapping options considered

| Field / idea | Display context | Score telemetry | v1.9b.5 verdict |
|--------------|-----------------|-----------------|-----------------|
| **5Y spread percentile** (99.8) | Primary headline — long-horizon cap-weight premium context | Tempting but mislabels relative performance as pressure | **Reject for score** |
| **Ratio percentile** (99.6) | Useful level context alongside ratio 3.6094 | Price-ratio level drifts; not flow or crowding telemetry | **Reject for score** |
| **1M / 3M / 6M / 1Y / 3Y / 5Y spread blend** | Regime framing (1M 97.3 vs 6M 51.6 shows horizon disagreement) | Overlapping windows; arbitrary horizon pick | **Reject for score** |
| **Raw SPY/RSP ratio** (3.6094) | Card body copy | Price level, not pressure | **Reject for score** |
| **Drawdown divergence** (-0.34%) | Supplementary stress context | Event/window-selected; weak continuous telemetry | **Display only** |
| **Cap-weight leadership regime label** | Narrative helper (elevated / neutral / compressed) | Subjective bucketing; not defensible 0–100 | **Defer** |
| **Replace `concentration`** | N/A — different question (weight level vs return spread) | Would drop score-fed top-10 weight input | **Reject** |
| **New passive/concentration sub-input** | N/A | No slot; requires reweight | **Reject** |

No 0–100 pressure mapper is selected in v1.9b.5.

---

## Semantic concerns

| Concern | Clarification |
|---------|----------------|
| **What it measures** | SPY/RSP spread measures **cap-weight versus equal-weight relative performance** on the same broad universe |
| **Not passive-flow causality** | Positive spread does **not** prove passive flows caused outperformance |
| **Not fund flows** | Does not measure ETF creation/redemption, index-fund flows, or ICI-style flow differentials |
| **Not forced buying** | Does not estimate index rebalance demand or inclusion-driven buying |
| **Not float absorption** | No free-float or supply-side absorption estimate |
| **Not liquidity depth** | Does not measure market depth, bid-ask, or funding stress |
| **Narrative overlap** | Overlaps thematically with `concentration`, `passive-share`, and `breadth` — useful context, weak as direct composite telemetry |
| **Not a trading signal** | Artifact caveats and card copy disclaim trading, allocation, and AI-bubble framing |
| **Regime dependence** | Required framing: *Long-horizon cap-weight premium is elevated; short horizons remain regime-dependent.* |
| **Label discipline** | Keep **Cap-Weight Premium Proxy** — do **not** rename to Passive Flow Pressure, Crowding Score, or similar pressure framing |

---

## Overlap / double-counting

Cap-weight premium overlaps **narratively** with existing score-fed and display inputs but measures a different quantity:

| Existing input | What it measures | Cap-weight premium difference |
|----------------|------------------|-------------------------------|
| **`concentration`** | Top-10 S&P 500 **weight level** (SSGA) | Return **spread** from weighting rule — companion, not substitute |
| **`active-index-flow`** | Active vs index **fund flows** (ICI) | Price performance, not flows |
| **`passive-share`** | Index asset share proxy (ICI) | Different construct |
| **`breadth`** | Participation (% above 50-day MA) | May contextualize reversals; different unit |
| **`etf-flow`** | Domestic equity ETF net issuance | Demand impulse, not cap-weight return premium |

Scoring cap-weight premium alongside these risks **double-counting the cap-weight leadership narrative** without adding cleaner, orthogonal telemetry. Replacing `concentration` is a **score-model decision**, not a mapping tweak.

---

## Future calibration path

| Question | Answer |
|----------|--------|
| Worth doing for v1.9b.5? | **No** — decision does not require calibration |
| Optional future work | **v1.9b.5-calibration** (research-only): multi-cycle SPY/RSP spread regimes vs concentration, breadth, equal-weight drawdowns, and passive-flow data |
| Display use | Could enrich card copy or operator notes — not a score mapper |
| Score use | Even with calibration, score wiring requires separate **v1.9b.6** product approval |
| Guardrail | Any research script must be **research-only**, must not write `mappedPressureScore`, and must not merge into `buildSnapshot` score paths |

Calibration is **not required** for the v1.9b.5 decision.

---

## Future v1.9b.6 gate

**v1.9b.6 is not approved.** Future score wiring remains product-gated and discouraged. **v1.9b.6** must not proceed unless **all** of the following are satisfied:

1. **Explicit product approval** — written decision to change composite semantics.  
2. **Written score-impact tables** — before/after Composite, Passive, and Structural sub-scores.  
3. **Evidence of orthogonal signal** — cap-weight premium adds information beyond `concentration` and existing structural inputs.  
4. **Score-model decision** — add sixth passive/structural weight vs replace vs reweight existing inputs vs remain display-only by default.  
5. **Methodology updates** — artifact design, operator refresh discipline, and mapping memo revisions.  
6. **Dashboard copy updates** — methodology, watchlist, and card copy preventing causality overclaim.  
7. **Operator checklist updates** — refresh discipline if score fields ever become in scope.  
8. **Tests** — display integration, score regression, and current-state assertions.

**Default recommendation: do not proceed.**

---

## Final decision

| Item | Decision |
|------|----------|
| **`cap-weight-premium-proxy`** | Remains **DISPLAY ONLY** (display-only by default) |
| **`mappingStatus`** | Remains **`not_final`** |
| **Final 0–100 mapper** | **None selected** in v1.9b.5 |
| **Composite input** | **No** — do not wire into Passive Pressure or Structural Fragility |
| **`publicPassiveInputKey`** | **No** |
| **New MOCK score slot** | **No** |
| **`publicSignalCount`** | **12** — unchanged |
| **v1.9b.6 score wiring** | **Not approved**; **discouraged** by default |

---

## No-score-change confirmation

The following remain **untouched** in v1.9b.5:

| Area | Status |
|------|--------|
| `lib/ghostflow/scoring.ts` | Unchanged |
| `lib/ghostflow/buildSnapshot.ts` | Unchanged |
| UI components (`components/ghostflow/*`) | Unchanged |
| Production artifact JSON | Unchanged |
| Example artifact JSON | Unchanged |
| `mockGhostflowSnapshot.ts` | Unchanged |
| `validate-artifacts.ts` registration | Unchanged (production artifact still validated) |
| GhostRegime | Unchanged |
| Marketstack | Unchanged |
| GhostYield | Unchanged |
| Models / builder | Unchanged |

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive* · equity `publicSignalCount` **12** · Treasury **2** display-only cards · MOCK **62 / 58 / 55**.
