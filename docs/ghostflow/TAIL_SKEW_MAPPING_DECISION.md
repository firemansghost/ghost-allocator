# Tail Skew Context Mapping Decision — GhostFlow v1.9e.5

**Status:** Decision record only — **docs-only**; **no implementation** in v1.9e.5 (no score wiring, no code, artifact, UI, test, or runtime changes).  
**Effective:** 2026-06-18  
**Related:** [TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md) · [PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md](./PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md) · [PROTECTION_BID_SOURCE_SPIKE.md](./PROTECTION_BID_SOURCE_SPIKE.md) · [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) · [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md)

This memo formalizes the **v1.9e.5 mapping/product decision** for the operator-transcribed **Tail Skew Context** artifact (`tail-skew-context-proxy`). No score mapper is selected in v1.9e.5. Future score wiring remains product-gated and discouraged. **v1.9e.6 is not approved.**

---

## Status

| Item | v1.9e.5 posture |
|------|-----------------|
| Document type | **Mapping / product decision only** (docs-only) |
| Code changes | **None** |
| Artifact JSON changes | **None** |
| UI / `buildSnapshot` changes | **None** |
| Test changes | **None** |
| Runtime / live fetch changes | **None** |
| Production artifact | **Exists** — [`tailSkewContext.v1.json`](../data/ghostflow/artifacts/tailSkewContext.v1.json) |
| Display card | **Exists** — `tail-skew-context` |
| `mappingStatus` | Remains **`not_final`** |
| Selected option | **A — Keep display-only** |
| Final 0–100 mapper | **None selected** |
| **`publicPassiveInputKey`** | **None** |
| New score sub-input | **None** |
| **v1.9e.6** score wiring | **Not approved**; **discouraged** by default |

---

## Background

| Phase | Outcome |
|-------|---------|
| **v1.9e** | Protection Bid / Correlation Dispersion Feasibility — [PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md](./PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md); overall **YELLOW**; SKEW-first display-only path recommended |
| **v1.9e.1 / v1.9e.1a** | Protection Bid Source Spike — [PROTECTION_BID_SOURCE_SPIKE.md](./PROTECTION_BID_SOURCE_SPIKE.md); Cboe SKEW source lock **PASS** (`DATE,SKEW`; 9,167 rows); implied correlation **SKIPPED** |
| **v1.9e.2** | Artifact design — [TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md); SKEW-only display-only schema |
| **v1.9e.3** | Example JSON + validator scaffold — [`tailSkewContext.v1.example.json`](../data/ghostflow/artifacts/tailSkewContext.v1.example.json); validator/types/tests |
| **v1.9e.4** | Production artifact + display-only card — [`tailSkewContext.v1.json`](../data/ghostflow/artifacts/tailSkewContext.v1.json); reference-aligned **2026-05-22**; `publicSignalCount` **12 → 13**; not scored |

The Research Composite does **not** consume this artifact today. VIX via `vol-regime` remains the sole score-fed options/volatility input.

---

## Current artifact and display card

### Production artifact

**File:** [`data/ghostflow/artifacts/tailSkewContext.v1.json`](../data/ghostflow/artifacts/tailSkewContext.v1.json)

| Field | Value |
|-------|--------|
| `signalId` | `tail-skew-context-proxy` |
| `asOf` | **2026-05-22** |
| `currentSkew` | **137.39** |
| `priorSessionSkew` | **136.96** |
| `dailyChange` | **+0.43** |
| `dailyChangePct` | **+0.31%** |
| `latestSourceDate` | **2026-06-18** |
| `latestSourceValue` | **146.72** |
| `mappingStatus` | **`not_final`** |
| Source | Cboe SKEW CSV — `DATE,SKEW` |
| Score fields | **None** |
| `publicPassiveInputKey` | **None** |
| Percentile fields | **None** |

### Display card (v1.9e.4)

| Item | Value |
|------|--------|
| Card id | `tail-skew-context` |
| Title | **Tail Skew Context** |
| Badge | **DISPLAY ONLY** |
| `dataStatus` | `public_proxy` |
| `updateFrequencyTarget` | Daily (manual artifact) |
| Research Composite | **Not included** |
| `publicSignalCount` | **13** |
| `publicPassiveInputKey` | **None** |

Display wiring: `applyTailSkewContextDisplayArtifact` in `buildSnapshot.ts` (v1.9e.4). No score merge.

---

## Current score context

| Input / output | Value |
|----------------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |
| Score-fed equity public artifacts | **6** |
| Display-only equity public artifacts | **7** (Tail Skew Context is the seventh) |
| **`tail-skew-context-proxy`** | **Display-only** — no passive sub-input key; no score contribution |
| Score-fed vol input | **`optionsVolatilityAmplifier`** via CBOE **VIX** (`vol-regime`) — **20%** of Passive Pressure |

Passive weights in `lib/ghostflow/scoring.ts` (unchanged): 25% ETF flow, 20% systematic, **20% options/vol (VIX)**, 20% retirement, 15% levered. There is **no** natural score replacement target for Tail Skew without changing scoring policy — unlike CFTC, levered, and retirement display proxies, SKEW has **no related MOCK passive sub-input** to replace. Wiring would require both a new semantic slot and a structural scoring change, or a VIX replacement/reweight decision.

**v1.9e.5 score impact:** **Zero.**

---

## Decision table

| Option | Description | v1.9e.5 decision |
|--------|-------------|------------------|
| **A** | **Keep display-only** — card shows SKEW level and daily change; no mapper; `mappingStatus` **not_final** | **Selected** |
| **B** | Historical percentile mapper (e.g. SKEW vs 1990–present distribution) | **Reject / defer** — useful display context only; does not resolve VIX overlap; risks mislabeling tail-pricing context as passive-flow pressure |
| **C** | Raw SKEW level mapper (absolute index level → 0–100) | **Reject / defer** — SKEW level drifts over decades; arbitrary scale; not validated pressure telemetry |
| **D** | Daily-change mapper (`dailyChange` / `dailyChangePct` → 0–100) | **Reject / defer** — noisy session-to-session signal; not a stable composite input |
| **E** | VIX-adjacent overlay (blend or supplement VIX slot) | **Reject / defer** — double-counts options-risk narrative; requires explicit reweight |
| **F** | Replace or split VIX weight with SKEW | **Reject** — weakens cleaner volatility-level signal; score-model surgery |
| **G** | Tail-risk pressure score (new passive or structural sub-input) | **Reject** — no slot; composite surgery; overlaps VIX and OCC display proxy thematically |

No 0–100 pressure mapper is selected in v1.9e.5.

---

## Mapping options considered

| Field / idea | Display context | Score telemetry | v1.9e.5 verdict |
|--------------|-----------------|-----------------|-----------------|
| **Raw SKEW level** (137.39) | Primary card reading — tail-skew pricing context | Absolute level drifts; not passive-flow or crowding telemetry | **Reject for score** |
| **Daily change** (+0.43 / +0.31%) | Session-over-session context | Noisy; not stable composite input | **Reject for score** |
| **Historical SKEW percentile** | Optional future display enrichment | Does not solve VIX overlap; percentile ≠ pressure | **Defer — display only if ever calibrated** |
| **SKEW minus VIX spread** | Research curiosity only | Synthetic blend; double-counts options risk | **Reject for score** |
| **Replace `optionsVolatilityAmplifier` (VIX)** | N/A — different construct (vol level vs tail shape) | Would drop score-fed VIX input | **Reject** |
| **Supplement VIX in same 20% slot** | N/A | Requires reweight and overlap analysis | **Reject — v1.9e.6 discouraged** |
| **New passive sub-input for tail risk** | N/A | No slot; alters pillar weights | **Reject** |

---

## VIX overlap / double-counting

VIX and SKEW both live in the broader **options-risk narrative** bucket but measure different quantities:

| Signal | What it measures | GhostFlow lane |
|--------|------------------|----------------|
| **VIX** (`vol-regime`) | Implied volatility **level** | Score-fed — `optionsVolatilityAmplifier` (**20%** Passive) |
| **SKEW** (`tail-skew-context`) | Tail-skew / outlier-return **pricing shape** | Display-only |
| **OCC activity** (`options-activity-proxy`) | Options **volume** intensity | Display-only |

Scoring both VIX and SKEW risks **double-counting options-market risk** without adding cleaner, orthogonal telemetry. Replacing VIX with SKEW would **weaken** the composite's volatility-level signal — VIX is a cleaner, widely understood vol amplifier input. Display-only preserves useful tail-skew context **without contaminating** the score.

---

## Semantic concerns

| Concern | Clarification |
|---------|----------------|
| **What SKEW measures** | Cboe SKEW index level — implied pricing context for **tail / outlier returns** relative to ATM |
| **Not VIX** | VIX is implied vol **level**; already score-fed |
| **Not realized volatility** | SKEW is an index of implied tail pricing, not realized vol |
| **Not 0DTE** | No zero-days-to-expiry exposure measure — see [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) |
| **Not dealer gamma / GEX** | No gamma exposure estimate |
| **Not OCC options volume** | Volume is `options-activity-proxy` (display-only) |
| **Not put/call volume** | Not in current OCC daily lock |
| **Not correlation dispersion** | Implied correlation deferred — no COR source lock |
| **Not a directional forecast** | Forbidden framing |
| **Not trading or allocation advice** | Card caveats disclaim recommendation language |
| **High/rising SKEW ≠ imminent downside** | Richer tail protection pricing does not automatically predict market direction or timing |

Keep dashboard title **Tail Skew Context** — do **not** rename to Vol Pressure, Tail Risk Score, or similar score-framing labels.

---

## Calibration

| Question | Answer |
|----------|--------|
| Required for v1.9e.5 decision? | **No** |
| Optional future work | **v1.9e.3a** (optional) — SKEW historical percentile calibration study for **display context only** |
| Solves VIX overlap? | **No** — calibration enriches card copy; it does not make SKEW orthogonal to VIX for scoring |
| Score use | Even with calibration, score wiring requires separate **v1.9e.6** product approval |
| Guardrail | Any calibration script must be **research-only**, must not write score fields, and must not merge into `buildSnapshot` score paths |
| v1.9e.5 artifact JSON | **No percentile fields added** |

---

## Future v1.9e.6 gate

**v1.9e.6 is not approved.** Future score wiring remains product-gated and discouraged. **v1.9e.6** must not proceed unless **all** of the following are satisfied:

1. **Explicit product approval** — written decision to change composite semantics against [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) (v1.10e no-score-change policy).  
2. **Score policy review** — confirm v1.10e gates remain intentionally reopened.  
3. **VIX replacement/reweight decision** — add slot, supplement, or replace `optionsVolatilityAmplifier`; document overlap with OCC display proxy.  
4. **Historical calibration** — if percentile or level mapper proposed, full distribution study and operator reproducibility.  
5. **User-facing caveats** — methodology, card copy, and dashboard disclaimers preventing tail-risk overclaim.  
6. **Methodology update** — artifact design, mapping memo, and operator refresh discipline revisions.  
7. **Tests** — display integration, score regression, and current-state assertions.

**Default recommendation: do not proceed.**

---

## Final decision

| Item | Decision |
|------|----------|
| **`tail-skew-context-proxy`** | Remains **DISPLAY ONLY** |
| **`mappingStatus`** | Remains **`not_final`** |
| **Final 0–100 mapper** | **None selected** in v1.9e.5 |
| **Composite input** | **No** — do not wire into Passive Pressure or Structural Fragility |
| **`publicPassiveInputKey`** | **No** |
| **New score sub-input** | **No** |
| **`publicSignalCount`** | **13** — unchanged |
| **v1.9e.6 score wiring** | **Not approved**; **discouraged** by default |

---

## No-change confirmation

The following remain **untouched** in v1.9e.5:

| Area | Status |
|------|--------|
| `lib/ghostflow/scoring.ts` | Unchanged |
| `lib/ghostflow/buildSnapshot.ts` | Unchanged |
| `lib/ghostflow/reference.ts` | Unchanged |
| UI components (`components/ghostflow/*`) | Unchanged |
| Production artifact JSON | Unchanged |
| Example artifact JSON | Unchanged |
| Validator (`tailSkewContext.ts`) | Unchanged |
| `mockGhostflowSnapshot.ts` | Unchanged |
| Tests | Unchanged |
| `package.json` | Unchanged |
| GhostRegime | Unchanged |
| Marketstack | Unchanged |
| GhostYield | Unchanged |
| Models / builder | Unchanged |

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive* · equity `publicSignalCount` **13** · Treasury **2** display-only cards · MOCK **62 / 58 / 55**.
