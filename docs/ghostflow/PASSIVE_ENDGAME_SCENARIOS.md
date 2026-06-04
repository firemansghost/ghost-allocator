# Passive Endgame Scenarios (GhostFlow v1.6b)

**Status:** v1.6b **educational explainer** — UI + documentation only; **not scored**, not a signal card, not a forecast engine.  
**Related:** [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

---

## Purpose

Help users interpret **possible passive-endgame pathways** as the ICI index-share proxy moves toward **model-stress zones** (often discussed around **60–65%**, depending on definition and denominator). This is research education — not investment advice, not a crash-date prediction, and not part of the Research Composite.

**UI:** Dashboard teaser + full section in GhostFlow Methodology (`#ghostflow-endgame-scenarios`).  
**Code:** Static content in `components/ghostflow/passiveEndgameScenarioContent.ts` — no snapshot props, no scoring.

---

## Core framing

| Principle | Wording |
|-----------|---------|
| Pathways | **Possible pathways, not predictions** |
| Order | Scenarios **do not have to happen in sequence** |
| Time | **Pressure gauge, not countdown clock** — no crash-date forecast |
| Advice | **No investment advice** |
| Measurement | ICI index-share is a **public proxy**, not perfect passive control of pricing |
| Dynamics | Passive **adoption** may be linear; passive **market impact** can become **convex** as **active price-discovery capital** shrinks |

---

## Band ladder (illustrative)

Maps loosely to narrative scenarios — **not** GhostFlow composite score bands.

| Band | Role |
|------|------|
| **Normal** | Benign plateau |
| **Watch** | Melt-up / concentration boom (early) |
| **Stress Zone** | Fragility regime |
| **Fragility Zone** | Flow-reversal shock |
| **Intervention / Reset Risk** | Policy intervention · Structural reform |

---

## Adoption rate vs market impact rate

- **Adoption rate:** How fast fund-industry index share rises on the ICI proxy (stock/level).
- **Market impact rate:** How much passive flows move prices — can turn **nonlinear** as the active pool shrinks even when adoption looks steady on a chart.
- GhostFlow does not prove acceleration; it surfaces **proxies** for discussion.

---

## Six scenarios

Global caveat (each scenario): *Illustrative pathway from passive-flow research framing — not a prediction, timetable, or investment recommendation.*

### 1. Benign Plateau

**Summary:** Passive share rises slowly while markets remain workable — stress builds without an immediate break.

- Index-share growth slows before the 60–65% stress framing.
- Top-10 concentration high but stabilizes.
- Breadth improves or holds.
- Active/index flow differential stabilizes.
- VIX and ETF flows unremarkable vs fragility paths.

**Indicators:** `passive-share`, `concentration`, `breadth`, `active-index-flow`, `etf-flow`, `vol-regime`

### 2. Melt-Up / Concentration Boom

**Summary:** Flows keep lifting cap-weighted indexes — surface strength, rising flow dependency.

- Strong ETF/index issuance.
- Index-share and concentration climb.
- Mega-cap leadership dominates.
- Valuations may stretch; vol can stay muted early.
- Cap-weight vs equal-weight: **not on dashboard** (future context).

**Indicators:** `etf-flow`, `passive-share`, `concentration`, `breadth`, `vol-regime`

### 3. Fragility Regime

**Summary:** Indexes may still rise, but participation and liquidity quality weaken underneath.

- Breadth deteriorates; concentration stays high.
- Larger earnings reactions / gaps in narrative terms.
- VIX rises despite strong index levels.
- Distance to model-stress-zone reference narrows.
- Correlation / liquidity index: **not on dashboard**.

**Indicators:** `breadth`, `concentration`, `passive-share`, `distance-65`, model-zone proximity, `vol-regime`, `options-activity-proxy` (display)

### 4. Flow-Reversal Shock

**Summary:** Inflows slow or reverse into a thin active pool — air pockets and vol spikes more plausible in model terms.

- Weak or negative ETF issuance.
- Flow tilt may flip in ICI flows data.
- Levered ETF rebalance display may spike.
- CFTC display — crowded positioning context.
- Not a dated crash forecast.

**Indicators:** `etf-flow`, `passive-share`, `breadth`, `vol-regime`, `levered-etf-rebalance` (display), `systematic-flow` (display)

### 5. Policy Intervention / Market Repair

**Summary:** Authorities respond — halts, facilities, retirement-rule debate, index methodology scrutiny.

- Narrative band; not a GhostFlow score.
- May align with extreme vol/breadth on dashboard.
- Outcome uncertain.
- **Treasury Plumbing:** feasibility complete in v1.7a ([TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md)) — **future lane only**; not a live dashboard section; basis-trade proxy + long-end income lens are display-only candidates when shipped (v1.7e+).

**Indicators:** `vol-regime`, `breadth` (when stress visible); Treasury Plumbing — future (see feasibility memo)

### 6. Structural Reform

**Summary:** Rules and defaults shift before crisis — active/factor/equal-weight mix may change over years.

- Slow-moving retirement/default reform narratives.
- ICI mix adjusts over quarters — not overnight.
- Not a trade signal.

**Indicators:** `passive-share`, `active-index-flow`, `retirement-asset-growth` (display)

---

## Indicator mapping appendix

| GhostFlow item | signalId / key | Scored? |
|----------------|----------------|---------|
| ICI Index Share Proxy | `passive-share` | Yes (structural) |
| Distance to model-stress zone | `distance-65` | No (derived card) |
| Model-zone proximity | `modelZoneProximity` | Yes (derived sub-input) |
| Active vs Index Flow | `active-index-flow` | Yes |
| Index Concentration | `concentration` | Yes |
| Market Breadth | `breadth` | Yes |
| ETF Net Issuance | `etf-flow` | Yes |
| Volatility Regime (VIX) | `vol-regime` | Yes |
| CFTC Positioning | `systematic-flow` | Display only |
| Levered ETF Rebalance | `levered-etf-rebalance` | Display only |
| OCC Options Intensity | `options-activity-proxy` | Display only |
| Retirement Asset Growth | `retirement-asset-growth` | Display only |

**Unavailable on dashboard (v1.6b):**

- Cap-weight vs equal-weight spread
- Dedicated correlation / liquidity index
- Treasury Plumbing (v1.7a feasibility done — UI lane v1.7e+; [memo](./TREASURY_PLUMBING_FEASIBILITY.md))

---

## Out of scope (v1.6b)

| Item | Notes |
|------|--------|
| Treasury Plumbing | v1.7a feasibility done; cards v1.7e+ — [memo](./TREASURY_PLUMBING_FEASIBILITY.md) |
| New data sources / artifacts | Not approved |
| Scoring / `publicSignals` / new `signalId` | Not approved |
| Scenario prediction engine | Not approved |
| Mega-cap earnings shock, pension hoarding, commodity frameworks | Not in v1.6b |

---

## Files (v1.6b)

- This memo
- `components/ghostflow/passiveEndgameScenarioContent.ts`
- `components/ghostflow/GhostFlowPassiveEndgameScenarios.tsx`
- `components/ghostflow/GhostFlowDashboard.tsx` (teaser)
- `components/ghostflow/GhostFlowMethodology.tsx` (full section)

**Unchanged:** `scoring.ts`, `buildSnapshot.ts`, artifact JSON, `mockGhostflowSnapshot.ts`, `validate-artifacts.ts`, `package.json`.
