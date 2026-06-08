# Treasury Plumbing Mapping Decision (GhostFlow v1.7f)

**Status:** Decision record only — **no score wiring**, no runtime changes, no artifact JSON edits (optional copy-only cleanup in display helper).  
**Effective:** 2026-06-05  
**Related:** [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) · [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) · [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

This memo formalizes the **v1.7f mapping/product decision** for both Treasury Plumbing production artifacts. Optional historical calibration studies (**v1.7f-calibration**, research-only) may follow later for display context only; they are **not required** for this decision and do **not** solve basis-trade overclaim or income-lens advice risks by themselves.

---

## 1. Status

| Item | v1.7f posture |
|------|----------------|
| Document type | **Mapping / product decision only** (docs-first) |
| Code changes | **None** (optional copy-only cleanup in display helper) |
| Artifact JSON changes | **None** |
| UI / `buildSnapshot` changes | **None** (Treasury lane unchanged) |
| Score changes | **None** |
| Calibration implementation | **None** in v1.7f |
| Selected mapper | **None** — Option **A** (display-only) for **both** artifacts |
| Status bands | **None** |
| Treasury sub-score | **None** — v1.7g **not approved** |
| `mappingStatus` | Remains **`not_final`** on both production artifacts |
| `publicSignalCount` | **10** unchanged |

---

## 2. Background

| Phase | Outcome |
|-------|---------|
| **v1.7a** | Feasibility — [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md); separate future lane; docs-only |
| **v1.7a.1** | CFTC PRE spike — `npm run ghostflow:treasury-cftc-pre-spike`; TFF `gpe5-46if` UST codes **GREEN** |
| **v1.7b** | Treasury Futures Positioning artifact design — [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md); example JSON + validator |
| **v1.7c** | Long-End Income Lens artifact design — [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md); example JSON + validator |
| **v1.7d** | Production [`treasuryFuturesPositioningProxy.v1.json`](../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json) + loader + `validate-artifacts` |
| **v1.7d.1** | Production [`treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json) + FRED spike + loader + `validate-artifacts` |
| **v1.7e** | Display-only Treasury Plumbing UI lane — [`GhostFlowTreasuryPlumbing.tsx`](../components/ghostflow/GhostFlowTreasuryPlumbing.tsx) via [`treasuryPlumbingDisplay.ts`](../lib/ghostflow/treasuryPlumbingDisplay.ts); **outside** `buildSnapshot` and equity signal grid |

Neither Treasury artifact feeds `lib/ghostflow/scoring.ts`. The equity Research Composite is unchanged.

---

## 3. Current artifacts

### Treasury Futures Positioning Proxy

**File:** [`data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json`](../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json)

| Field | Value |
|-------|--------|
| `signalId` | `treasury-futures-positioning-proxy` |
| `asOf` | **2026-05-26** |
| `publishedAt` | **2026-06-04** |
| `dataQuality` | **manual_unverified** |
| `mappingStatus` | **`not_final`** |
| Basket lev net % OI | **-30.7%** |
| Basket gross % OI | **44.2%** |
| `basketDirection` | **net_short** |
| Core contracts | **4** |

No `designOnly`, no `mappedPressureScore`, no `candidatePressureScore`.

### Long-End Income Lens

**File:** [`data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json)

| Field | Value |
|-------|--------|
| `signalId` | `treasury-long-end-income-lens` |
| `asOf` | **2026-06-02** |
| `publishedAt` | **2026-06-04** |
| `dataQuality` | **verified_manual** |
| `mappingStatus` | **`not_final`** |
| 30Y nominal yield | **4.97%** |
| 30Y TIPS real yield | **2.69%** |
| 10s30s spread | **+0.51 pp** |
| `nominalYieldPercentile` / `realYieldPercentile` | **`null`** |

No `designOnly`, no score or advice fields.

---

## 4. Current UI lane (v1.7e)

| Item | Value |
|------|--------|
| Section | **Treasury Plumbing** — after Score Drivers, before Methodology |
| Wiring | [`buildTreasuryPlumbingDisplay()`](../lib/ghostflow/treasuryPlumbingDisplay.ts) — **not** `buildSnapshot` |
| `raw.signals` | **Not included** |
| `meta.publicSignals` | **Not included** |
| `PUBLIC_ARTIFACT_SIGNAL_IDS` | **Not included** |
| Badge | **DISPLAY ONLY** (both cards) |
| Research Composite | **Not included** |
| `publicSignalCount` | **10** (equity/public grid only) |

---

## 5. Current score context (unchanged in v1.7f)

| Input / output | Value |
|----------------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |
| `publicSignalCount` | **10** |
| Treasury artifacts | **Display only** — zero passive/structural sub-input keys |
| MOCK passive inputs (unchanged) | `systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55** |

**v1.7f score impact:** **Zero.**

---

## 6. Decision (v1.7f)

| Item | Decision |
|------|----------|
| **Selected option** | **A — Stay display-only** (both artifacts) |
| **Final 0–100 mapper** | **None selected** |
| **Status bands** | **None** |
| **Treasury Plumbing sub-score** | **None** — v1.7g **not approved** |
| **`mappingStatus`** | Remains **`not_final`** |
| **Composite merge** | **No** — Treasury stays outside Research Composite |
| **Equity `systematic-flow` pattern** | **Do not copy** display `basketScore` onto Treasury without separate product approval |

---

## 7. Mapping options considered

### Treasury Futures Positioning Proxy

| ID | Idea | Assessment |
|----|------|------------|
| **A** | **Display-only** — show basket net/gross % OI, direction, WoW context in explanation | **Selected** |
| **B** | Historical percentile of net % OI / gross % OI / WoW change | **Deferred** — optional **v1.7f-calibration** + possible **v1.7f.1** display context only |
| **C** | Manual bands (normal / crowded / stretched) | **Reject** — fake precision without validated semantics |
| **D** | Multi-metric stress mapper (net + gross + WoW + AM spread) | **Reject** — basis-trade overclaim risk; too early |
| **E** | Treasury Plumbing sub-score (v1.7g) | **Not approved**; discouraged by default |

### Long-End Income Lens

| ID | Idea | Assessment |
|----|------|------------|
| **A** | **Display-only** — show yields, curve spreads, breakeven as context | **Selected** |
| **B** | Historical percentile of nominal/real yields | **Deferred** — optional **v1.7f-calibration** + possible **v1.7f.1** display context only |
| **C** | “Neglect” or income-opportunity manual bands | **Reject** — advice risk; neglect is narrative not measurement |
| **D** | Income/curve blend mapper | **Defer** — allocation-signal risk |
| **E** | Treasury Plumbing sub-score (v1.7g) | **Not approved**; discouraged by default |

---

## 8. Calibration considered / deferred

| Study | Feasibility | v1.7f action |
|-------|-------------|--------------|
| Treasury CFTC history (`gpe5-46if`, tier-1 UST basket) | **Feasible** — mirror equity `cftc-tff-history-study` pattern; research-only | **Deferred** → optional **v1.7f-calibration** |
| FRED yield history (DGS30, DFII30, curve spreads) | **Feasible** — extend `fred-treasury-yields-spike` / new study | **Deferred** → optional **v1.7f-calibration** |
| Combined Treasury Plumbing calibration index | Low value / high overclaim risk | **Not planned** |

| Question | Answer |
|----------|--------|
| Is calibration required for this decision? | **No** |
| Would calibration justify scoring? | **No** — semantic gaps remain (basis trade, advice risk) |
| Would percentiles fix overclaim? | **No** — bad labels can still imply stress or bond-buy signals |
| Future percentile display? | Possible **v1.7f.1** — display-only; separate product gate; non-advice copy |

Guardrails for any future calibration script: **research-only**, excluded from `ghostflow:check`, no writes to production artifacts, no `mappedPressureScore`, no `buildSnapshot` merge.

---

## 9. Semantic caveats

### Treasury Futures Positioning Proxy

| Concern | Clarification |
|---------|----------------|
| **Not full basis trade** | Public CFTC **futures** positioning only |
| **Not measured** | Cash-futures basis, repo specialness, CTD behavior, financing terms |
| **Net short ≠ stress** | Direction alone does not prove basis-trade stress |
| **Gross vs net** | Large gross may be informative but harder to interpret without history |
| **Leveraged Funds bucket** | Regulatory label, not a basis-trade desk identifier |

### Long-End Income Lens

| Concern | Clarification |
|---------|----------------|
| **Not investment advice** | Yield snapshot is context, not a recommendation |
| **Not bond-buying signal** | Higher nominal/real yields do not prove attractiveness |
| **Not duration allocation** | Yield level alone does not prove income neglect |
| **Neglect framing** | Product narrative only — not a measurable fact in the artifact |
| **Percentile risk** | Historical rank can become disguised advice if labeled “opportunity” or “neglect” |

---

## 10. Equity boundary

| Rule | v1.7f posture |
|------|----------------|
| Merge Treasury into Research Composite | **Reject** |
| Add Treasury to `publicPassiveInputKey` / `publicStructuralInputKey` | **Reject** |
| Change `publicSignalCount` | **Reject** — stays **10** |
| Copy equity `systematic-flow` display `basketScore` | **Reject** for Treasury without separate approval |
| Equity composite scores | **Unchanged** — **62 / 58 / 66** |

Equity CFTC (`systematic-flow`) and Treasury CFTC (`treasury-futures-positioning-proxy`) share a data source family but **different instruments**, **different UI lanes**, and **different product semantics**. Do not merge baskets or scores.

---

## 11. Future gates

| Phase | Scope | Default |
|-------|--------|---------|
| **v1.7f-calibration** | Optional research-only CFTC + FRED historical studies | Not required for display-only posture |
| **v1.7f.1** | Optional display-only percentile context on Treasury cards | Separate product approval; non-advice copy |
| **v1.7g** | Treasury Plumbing score gate / sub-score | **Not approved**; **discouraged** by default |

**v1.7g** must not proceed unless **all** of the following are satisfied:

1. Explicit product approval — written decision to add Treasury scoring semantics.  
2. Historical calibration evidence — distribution tables for chosen metrics.  
3. Semantic review — no basis-trade or bond-buy overclaim in labels.  
4. Architecture decision — separate sub-score vs composite merge (merge **rejected** by default).  
5. User-facing caveats — methodology, trust copy, score card boundaries.  
6. Tests and code changes — only after gates 1–5; today **blocked**.

**Default recommendation:** **Do not proceed** with v1.7g.

---

## 12. No-score-change confirmation (v1.7f)

The following were **not** modified in v1.7f (except optional display-helper copy):

| Area | Status |
|------|--------|
| `lib/ghostflow/scoring.ts` | Unchanged |
| `lib/ghostflow/buildSnapshot.ts` | Unchanged |
| `lib/ghostflow/signalPresentation.ts` | Unchanged |
| `data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json` | Unchanged |
| `data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json` | Unchanged |
| `data/ghostflow/mockGhostflowSnapshot.ts` | Unchanged |
| `scripts/ghostflow/validate-artifacts.ts` | Unchanged |
| `components/ghostflow/*` | Unchanged |
| GhostRegime / GhostYield / Models / builder | Unchanged |

| Metric | Value (unchanged) |
|--------|-------------------|
| Composite / Passive / Structural | **62 / 58 / 66** |
| `publicSignalCount` | **10** |
| Treasury lane | **Display-only** — separate from equity grid |

---

## 13. References

- Futures artifact: [`treasuryFuturesPositioningProxy.v1.json`](../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json)  
- Income lens artifact: [`treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json)  
- Display helper: [`lib/ghostflow/treasuryPlumbingDisplay.ts`](../lib/ghostflow/treasuryPlumbingDisplay.ts)  
- UI: [`components/ghostflow/GhostFlowTreasuryPlumbing.tsx`](../components/ghostflow/GhostFlowTreasuryPlumbing.tsx)  
- Feasibility: [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md)  
- Peer decision pattern: [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md)
