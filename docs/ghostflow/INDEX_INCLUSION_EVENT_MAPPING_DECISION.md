# Index Inclusion Event Mapping Decision — GhostFlow v1.9c.5

**Status:** Decision record only — **docs-only**; **no implementation** in v1.9c.5 (no score wiring, no code, artifact, UI, test, or runtime changes).  
**Effective:** 2026-06-16  
**Related:** [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) · [INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md](./INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md)

This memo formalizes the **v1.9c.5 mapping/product decision** for the operator-curated **Index Inclusion Event Proxy** (`index-inclusion-event-proxy`). No score mapper is selected in v1.9c.5. Future score wiring remains product-gated and discouraged. **v1.9c.6 is not approved.**

---

## Status

| Item | v1.9c.5 posture |
|------|-------------------|
| Document type | **Mapping / product decision only** (docs-only) |
| Code changes | **None** |
| Artifact JSON changes | **None** |
| UI / `buildSnapshot` changes | **None** |
| Test changes | **None** |
| Runtime / live fetch changes | **None** |
| Production artifact | **Exists** — [`indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json) |
| Display card | **Exists** — `index-inclusion-events` |
| `mappingStatus` | Remains **`not_final`** |
| Selected option | **A — Keep display-only by default** |
| Final 0–100 mapper | **None selected** |
| **`publicPassiveInputKey`** | **None** |
| New MOCK score slot | **None** |
| **v1.9c.6** score wiring | **Not approved**; **discouraged** by default |

---

## Background

| Phase | Outcome |
|-------|---------|
| **v1.9c** | Passive Supply / Float Absorption Feasibility — [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) (**YELLOW leaning RED**) |
| **v1.9c.1** | Source spike — [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md); Lane D event path partially locked |
| **v1.9c.2** | Artifact design — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md); Lane D event proxy; display-only default |
| **v1.9c.3** | Example JSON + validator — [`indexInclusionEventProxy.v1.example.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json); not in `validate-artifacts` |
| **v1.9c.4a** | Operator provenance checklist — design memo §14 |
| **v1.9c.4b** | Operator intake — [INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md](./INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md); 4 production-eligible Nasdaq rows |
| **v1.9c.4** | Production artifact + display-only card — [`indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json); `publicSignalCount` **11**; not scored |

Current production data uses **4 operator-reviewed Nasdaq-100 add/delete rows** from two official Nasdaq Investor Relations announcements (Jan 2026 and Apr 2026 component replacements). The Research Composite does **not** consume this artifact today.

---

## Current artifact and display card

### Production artifact

**File:** [`data/ghostflow/artifacts/indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json)

| Field | Value |
|-------|--------|
| `signalId` | `index-inclusion-event-proxy` |
| `asOf` | **2026-05-22** |
| `publishedAt` | **2026-06-16** |
| `dataQuality` | **manual_unverified** |
| `mappingStatus` | **`not_final`** |
| Event window | **2026-01-09** – **2026-04-20** |
| `eventCount` | **4** |
| `upcomingEventCount` | **0** |
| `recentEventCount` | **4** |
| `majorIndexEventCount` | **4** |
| `sourceEventCount` | **4** |
| Events | WMT add, AZN delete, SNDK add, TEAM delete (Nasdaq-100) |
| `floatEstimateAvailable` / `demandEstimateAvailable` | **false** per event |
| Score fields | **None** |
| `publicPassiveInputKey` | **None** |

### Display card (v1.9c.4)

| Item | Value |
|------|--------|
| Card id | `index-inclusion-events` |
| Title | **Index Inclusion Event Proxy** |
| Headline | **Index events in window: 4** |
| Badge | **DISPLAY ONLY** |
| `dataStatus` | `public_proxy` |
| `updateFrequencyTarget` | Event-driven (manual artifact) |
| Research Composite | **Not included** |
| `publicSignalCount` | **11** |
| `publicPassiveInputKey` | **None** |

Display wiring: `applyIndexInclusionEventDisplayArtifact` in `buildSnapshot.ts` (v1.9c.4). No score merge.

---

## Current score context

| Input / output | Value |
|----------------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |
| Score-fed equity public artifacts | **6** |
| Display-only equity public artifacts | **5** (index inclusion is the fifth) |
| **`index-inclusion-event-proxy`** | **Display-only by default** — no passive sub-input key; no score contribution |
| MOCK passive inputs (unchanged) | `systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55** |

Passive weights in `lib/ghostflow/scoring.ts` (unchanged): 25% ETF flow, 20% systematic, 20% options/vol (VIX), 20% retirement, 15% levered — **five** slots totaling 100%. There is **no** sixth passive weight and **no** natural replacement target for index inclusion without score-model surgery (add sixth slot + reweight, or replace an existing input). Unlike CFTC, levered, and retirement display proxies, index inclusion has **no related MOCK passive sub-input** — wiring would require both a new semantic slot and a structural scoring change.

**v1.9c.5 score impact:** **Zero.**

---

## Decision table

| Option | Description | v1.9c.5 decision |
|--------|-------------|------------------|
| **A** | **Keep display-only by default** — card shows event window, counts, and event rows; no mapper; `mappingStatus` **not_final** | **Selected** |
| **B** | Historical percentile of event density | **Defer / reject for scoring now** — needs multi-year curated history; sparse, lumpy event series |
| **C** | Event-count mapper (`eventCount` → 0–100) | **Reject** — event count does not equal passive demand or pressure |
| **D** | Major-index weighted event score | **Reject / defer** — requires assumptions about index AUM, weights, float, and passive demand |
| **E** | Free-float / demand-dollar mapper | **Reject** — unavailable from current public row data; violates artifact caveats |

---

## Mapping options considered

| Field / idea | Display context | Score telemetry | v1.9c.5 verdict |
|--------------|-----------------|-----------------|-----------------|
| **Raw `eventCount`** | Useful headline — "events in window" | Poor pressure proxy — count ≠ demand magnitude | **Reject for score** |
| **`upcomingEventCount`** | Useful forward calendar context | Meaningless at zero today; lumpy when nonzero | **Reject for score** |
| **`recentEventCount`** | Useful recency framing | Redundant with `eventCount` in current window; not flow | **Reject for score** |
| **`majorIndexEventCount`** | Useful tier filter context | Requires stable "major index" taxonomy; still not demand | **Defer / reject for score** |
| **`sourceEventCount`** | Useful provenance audit | Operator bookkeeping; not market telemetry | **Reject for score** |
| **Add/delete imbalance** | Interesting narrative (net adds vs deletes) | Net count ignores issuer size, float, index weight; fake precision | **Reject for score** |
| **Index-family weighted score** | Could weight Nasdaq vs Russell vs S&P in display | Needs AUM/weight assumptions per family; not in public rows | **Reject / defer** |
| **Float absorption score** | Not available — `floatEstimateAvailable: false` | Would require proprietary float models | **Reject** |
| **Passive-demand estimate** | Not available — `demandEstimateAvailable: false` | Would require index-fund flow models | **Reject** |
| **Historical percentile of event density** | Optional future display context with multi-year history | Sparse series; percentile of announcements ≠ passive pressure | **Defer** — research-only calibration path; not required for v1.9c.5 |

No 0–100 pressure mapper is selected in v1.9c.5.

---

## Semantic concerns

| Concern | Clarification |
|---------|----------------|
| **Not passive fund demand** | Index-event count is not estimated passive inflow/outflow or index-fund buying pressure |
| **Index mechanics, not flow pressure** | Add/delete rows document announced index membership changes — not trade impact or fund flow |
| **No free-float estimate** | `floatEstimateAvailable: false` — validator locks this off in production |
| **No demand-dollar estimate** | `demandEstimateAvailable: false` — no index-fund demand modeling in public row data |
| **No trade-impact estimate** | Artifact caveats explicitly disclaim trade-impact estimation |
| **Source narrowness** | v1.9c.4 window is **Nasdaq-100 only** (2 announcements, 4 event rows) |
| **Sparse and lumpy** | Event-driven data is irregular — poor continuous composite telemetry |
| **Context vs score** | Useful for operator/market-structure **context**; weak as Research Composite sub-input |
| **Label discipline** | Keep **Index Inclusion Event Proxy** — do **not** rename to Passive Supply Pressure, Float Absorption Score, or similar pressure framing |

---

## Overlap with existing score inputs

Index inclusion events overlap **narratively** with existing score-fed and display inputs but measure a different quantity:

| Existing input | What it measures | Index inclusion difference |
|----------------|------------------|----------------------------|
| `etf-flow` | Domestic equity ETF net issuance (fund flow) | Announced index **membership** changes, not ETF creation/redemption |
| `active-index-flow` | Active vs index fund flow differential (ICI) | Not fund flows; index-provider **reconstitution** announcements |
| `concentration` | Top-10 S&P 500 weight share | Not portfolio concentration; per-name index add/delete events |

Scoring index inclusion alongside these would risk **double-counting market-structure narrative** (passive/index mechanics) without adding cleaner, orthogonal telemetry. The artifact was designed and shipped as a **display-only event proxy** for this reason.

---

## Future calibration path

| Question | Answer |
|----------|--------|
| Worth doing for v1.9c.5? | **No** — decision does not require calibration |
| Optional future work | **v1.9c.5-calibration** (research-only): multi-year curated event history across Nasdaq / FTSE Russell / S&P DJI |
| Display use | Could support display context (e.g., trailing-12M event density vs prior years) — not a score mapper |
| Score use | Even with calibration, score wiring requires separate **v1.9c.6** product approval |
| Guardrail | Any research script must be **research-only**, must not write `mappedPressureScore`, and must not merge into `buildSnapshot` score paths |

Calibration is **not required** for the v1.9c.5 decision.

---

## Future v1.9c.6 gate

**v1.9c.6 is not approved.** Future score wiring remains product-gated and discouraged. **v1.9c.6** must not proceed unless **all** of the following are satisfied:

1. **Explicit product approval** — written decision to change composite semantics.  
2. **Larger historical source set** — multi-provider, multi-year curated event history (not 4 Nasdaq rows).  
3. **Semantic rename review** — signal/artifact naming must not imply pressure, float absorption, or demand without provenance.  
4. **Calibration evidence** — distribution of event density; score-impact tables.  
5. **Score model decision** — add sixth passive weight vs replace vs reweight existing inputs vs remain display-only by default.  
6. **Methodology and user-facing caveats** — dashboard copy, watchlist, and operator refresh discipline updated.  
7. **Tests** — display integration, score regression, and current-state assertions.

**Default recommendation: do not proceed.**

---

## Final decision

| Item | Decision |
|------|----------|
| **`index-inclusion-event-proxy`** | Remains **DISPLAY ONLY** (display-only by default) |
| **`mappingStatus`** | Remains **`not_final`** |
| **Final 0–100 mapper** | **None selected** in v1.9c.5 |
| **Composite input** | **No** — do not wire into Passive Pressure or Structural Fragility |
| **`publicPassiveInputKey`** | **No** |
| **New MOCK score slot** | **No** |
| **`publicSignalCount`** | **11** — unchanged |
| **v1.9c.6 score wiring** | **Not approved**; **discouraged** by default |

---

## No-score-change confirmation

The following remain **untouched** in v1.9c.5:

| Area | Status |
|------|--------|
| `lib/ghostflow/scoring.ts` | Unchanged |
| `lib/ghostflow/buildSnapshot.ts` | Unchanged |
| UI components (`components/ghostflow/*`) | Unchanged |
| Production artifact JSON | Unchanged |
| Example artifact JSON | Unchanged |
| `mockGhostflowSnapshot.ts` | Unchanged |
| `validate-artifacts.ts` registration | Unchanged (production artifact still validated) |
| GhostRegime | Out of scope |
| Marketstack | Out of scope |
| GhostYield | Out of scope |
| Models | Out of scope |
| Builder | Out of scope |

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive* · equity `publicSignalCount` **11** · Treasury **2** display-only cards · MOCK **62 / 58 / 55**.
