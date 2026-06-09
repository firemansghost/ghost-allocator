# Mock Score Retirement Plan (GhostFlow v1.8b)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Status:** Decision record only — **docs-only**; no score, artifact, UI, or runtime changes.  
**Effective:** v1.8b (after v1.8a inventory)  
**Related:** [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) · [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md)

This memo formalizes **how to handle each remaining MOCK passive score input**. It does **not** execute retirement, replacement, or score wiring. GhostRegime is out of scope.

---

## Status

| Item | v1.8b posture |
|------|---------------|
| Document type | Decision memo only |
| Score changes | **None** |
| Artifact JSON changes | **None** |
| UI / component changes | **None** |
| Runtime changes | **None** |
| Mock retirement executed | **No** |
| Score gates opened | **No** (v1.0c, v1.1f, v1.2f, v1.4f, v1.7g, v1.8i remain discouraged) |
| GhostRegime | Out of scope |

---

## Current MOCK inputs

Three static values in [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) feed Passive Pressure via [`scoring.ts`](../../lib/ghostflow/scoring.ts). Display artifacts refresh signal cards only — they do **not** overwrite these inputs ([`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts); see [`ghostflowCurrentState.test.ts`](../../lib/ghostflow/__tests__/ghostflowCurrentState.test.ts)).

**Passive formula:** `Passive = 0.25·etf + 0.20·systematic + 0.20·vol + 0.20·retirement + 0.15·levered`  
**Composite:** `50% Passive + 50% Structural`

Together the three MOCK inputs are **55% of Passive Pressure** (20% + 20% + 15%) and **27.5% of Composite** (half of 55%). This is a **trust and disclosure** issue — v1.8b documents policy only; it is **not** authorization to change scores.

| Input | Value | Score pillar | Passive weight | Composite weight | Related display artifact | Replacement status | v1.8b decision |
|-------|-------|--------------|----------------|------------------|--------------------------|-------------------|----------------|
| `systematicStrategyPressure` | **62** | Passive Pressure | **20%** | **10%** | `systematic-flow` (CFTC TFF equity basket) | Display-only production artifact; Mapping A on card; score gate **v1.0c** not approved | **Keep MOCK**; strengthen disclosure; defer any replacement to **v1.0c** product gate; **reject** direct Mapping A score wiring |
| `retirementFlowPressureProxy` | **58** | Passive Pressure | **20%** | **10%** | `retirement-asset-growth` (ICI Retirement Market Table 1) | Display-only; no approved flow mapper; **v1.2f** discouraged | **Keep MOCK**; **reject** replacement with current artifact; possible **retire/remove** candidate in broader scoring rewrite only |
| `leveredEtfRebalancePressure` | **55** | Passive Pressure | **15%** | **7.5%** | `levered-etf-rebalance` (Tier-1 fixed-current-AUM proxy) | Display-only; calibration is return-sensitivity not true AUM history; **v1.1f** not approved | **Keep MOCK**; strengthen disclosure; defer any replacement to **v1.1f** product gate; **reject** direct wiring without true AUM history and approved mapper |

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive* · `publicSignalCount` **10**.

---

## Decision summary

1. **All three MOCK score inputs remain unchanged** at **62**, **58**, and **55**.
2. **No production display artifact replaces a mock score input** in v1.8b.
3. **No retirements are executed** in v1.8b.
4. **No score wiring is approved.**
5. **No future gate is opened** by this memo.
6. **Stronger documentation disclosure** is the v1.8b outcome (this memo + cross-links in roadmap and current-state inventory).

---

## Per-mock analysis

### `systematicStrategyPressure`

| Item | Detail |
|------|--------|
| **Current value** | **62** (static in `mockGhostflowSnapshot.ts`) |
| **Related artifact / card** | `systematic-flow` — CFTC TFF leveraged-funds equity-index basket (ES/NQ/RTY/VIX) |
| **Evidence** | [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) (v1.0a); [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) (v1.0b) |
| **Semantic problem** | Production artifact measures **futures positioning**, not CTA / vol-control / risk-parity “systematic strategy pressure.” Any score use requires **rename** (e.g. “CFTC leveraged-funds positioning proxy”). |
| **Display vs score** | Card may show Mapping A `basketScore` (e.g. **93** on recent weeks); composite still uses static **62** — label drift risk documented in v1.0b. |
| **Double-count risk** | Moderate narrative overlap with VIX (20% passive) and ETF flow (25%); not identical series. |
| **Mapping A score wiring** | **Rejected for v1.8b** — too aggressive for score; v1.0b preferred future candidate is Mapping C `min(80, basketScore)` **only after rename** and product gate. |
| **Future gate** | **v1.0c** — explicit product approval, calibration review, semantic rename, methodology/UI/test updates, MOCK fallback on artifact failure |
| **v1.8b decision** | **Keep MOCK** |

### `retirementFlowPressureProxy`

| Item | Detail |
|------|--------|
| **Current value** | **58** (static in `mockGhostflowSnapshot.ts`) |
| **Related artifact / card** | `retirement-asset-growth` — ICI Retirement Market **Table 1** quarterly asset levels and growth |
| **Evidence** | [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md) (v1.2e); [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) |
| **Semantic problem** | **Asset growth ≠ retirement-flow pressure.** Table 1 conflates contributions, market returns, and revaluations; quarterly cadence is unsuitable for weekly composite without lag policy. |
| **Double-count risk** | **High** — same ICI ecosystem as scored `etf-flow`, `active-index-flow`, and `passive-share`. |
| **Calibration** | QoQ and YoY percentile mappings disagree (v1.2e); no stable mapper approved. |
| **Display artifact** | Remains **display-only**; `mappingStatus` **not_final**. |
| **Future gate** | **v1.2f** — **not approved / discouraged**; would require rename, overlap review, and true flow semantics if ever reconsidered |
| **Broader rewrite** | A future **v1.8i** scoring-model rewrite may **retire/remove** this slot rather than replace it with the current artifact |
| **v1.8b decision** | **Keep MOCK**; **reject** current artifact as score replacement |

### `leveredEtfRebalancePressure`

| Item | Detail |
|------|--------|
| **Current value** | **55** (static in `mockGhostflowSnapshot.ts`) |
| **Related artifact / card** | `levered-etf-rebalance` — Tier-1 six-ticker fixed-current-AUM return-sensitivity estimate |
| **Evidence** | [LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md](./LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md) (v1.1e-calibration); [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) |
| **Semantic problem** | Useful **display** proxy; **not** a true historical AUM-calibrated score source. Fixed-current-AUM methodology and `manual_unverified` quality weaken score promotion. |
| **False precision** | Wiring `aggregateRebalancePctOfUniverseAum` (or linear ×k mappings) would imply measured pressure; ×20 ≈ MOCK **55** is single-week coincidence, not calibration. |
| **Double-count risk** | Low direct overlap with ICI inputs; indirect narrative overlap with vol/flow. |
| **Future gate** | **v1.1f** — explicit product approval, history-based or capped mapper, methodology/UI/test updates |
| **v1.8b decision** | **Keep MOCK**; **reject** direct wiring without true AUM history and approved mapper |

---

## Gate table

v1.8b **does not open** any gate. All remain **not approved / discouraged by default**.

| Gate | Scope | Status (v1.8b) | Requirements if ever opened |
|------|--------|----------------|------------------------------|
| **v1.0c** | Systematic / CFTC score wiring | **Not approved / discouraged** | Product approval; Mapping C (not A); semantic rename; calibration review; `buildSnapshot` merge; PUBLIC badge; methodology + UI disclosure; tests; MOCK fallback |
| **v1.1f** | Levered ETF score wiring | **Not approved / discouraged** | Product approval; true AUM history or defended percentile/capped mapper; overlap review; methodology + UI; tests |
| **v1.2f** | Retirement score wiring | **Not approved / discouraged** | Product approval; rename; true flow semantics; ICI overlap review; methodology + UI; tests |
| **v1.4f** | Options activity score wiring | **Not approved / discouraged** | Product approval; VIX overlap review; true 0DTE/GEX path or defended proxy; methodology + UI; tests |
| **v1.7g** | Treasury Plumbing score | **Not approved / discouraged** | Product approval; separate from equity composite; Treasury lane policy review |
| **v1.8i** | Broader score-model rewrite | **Not approved / discouraged** | Product approval; may retire mocks instead of replace; full methodology + UI + test pass |

---

## Mock retirement options

Reference paths for future phases (none executed in v1.8b):

| Option | Description |
|--------|-------------|
| **Replace** | Promote production artifact into `publicPassiveInputKeys` via `buildSnapshot` |
| **Retire / remove** | Drop sub-input from Passive formula in a scoring rewrite |
| **Permanently label** | Keep static value; document as model placeholder indefinitely |
| **Keep until source** | Hold MOCK until a defensible new data source exists |
| **Broader rewrite** | Rebalance Passive weights or pillar semantics in v1.8i-style gate |

**Current policy per mock:**

| Input | Applies now |
|-------|-------------|
| `systematicStrategyPressure` | **Keep** + product-gated replacement candidate only (**v1.0c**) |
| `retirementFlowPressureProxy` | **Keep** + **reject** current replacement; possible **retire/remove** in broader rewrite |
| `leveredEtfRebalancePressure` | **Keep** + product-gated replacement candidate only (**v1.1f**) |

---

## Recommended follow-up

| Phase | Role |
|-------|------|
| **v1.8c** | **Next** — artifact freshness and `dataQuality` consistency pass |
| **v1.8b.1** | Optional copy-only UI disclosure pass if dashboard honesty needs tightening (not in v1.8b scope) |
| **v1.8d–e** | Operator refresh discipline; documentation consolidation |
| **v1.8i** | Broader score rewrite — **not approved / discouraged** unless explicitly opened |

**No score changes without explicit product approval.**

---

## No-score-change confirmation

| Check | v1.8b result |
|-------|--------------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | Unchanged |
| Production artifact JSON | Unchanged |
| [`signalPresentation.ts`](../../lib/ghostflow/signalPresentation.ts) | Unchanged |
| [`validate-artifacts.ts`](../../scripts/ghostflow/validate-artifacts.ts) | Unchanged |
| `components/ghostflow/*` | Unchanged |
| `package.json` | Unchanged |
| Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| `publicSignalCount` | **10** (equity) |
| Treasury Plumbing | **2** separate display-only cards; not scored; outside equity composite |
