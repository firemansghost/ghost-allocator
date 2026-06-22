# GhostFlow Public Signal Inventory — v1.9d

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Related:** [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) · [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) · [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md)

---

## Status

| Item | v1.9d posture |
|------|---------------|
| Document type | **Canonical public signal inventory memo** |
| Scope | **Docs-only** |
| Runtime change | **None** |
| Score change | **None** — Composite **62** / Passive **58** / Structural **66** |
| Artifact change | **None** |
| UI change | **None** |

---

## Canonical state

| Item | Value |
|------|--------|
| **`publicSignalCount`** | **13** (equity only) |
| **Score-fed equity/public artifacts** | **6** |
| **Display-only equity/public artifacts** | **7** |
| **Treasury lane** | **2** separate display-only cards — **not** counted in equity `publicSignalCount` |
| **Composite** | **62** |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Band** | *Crowded / Reflexive* |
| **Reference date** | [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) = `2026-05-22` |

**Counting rule:** Equity `publicSignalCount` = **13**. Treasury display lane = **2** cards. **Do not** combine into 15.

---

## Equity public signal inventory

All **13** equity public signals appear in `meta.publicSignals` when production JSON validates. Derived context card `distance-65` is **not** counted in `publicSignalCount`.

| # | Card id | Artifact `signalId` | Display title | Lane | `dataStatus` | `dataQuality` | `publicPassiveInputKey` | Composite impact | Production JSON | validate-artifacts | Display order |
|---|---------|---------------------|---------------|------|--------------|---------------|-------------------------|------------------|-----------------|-------------------|---------------|
| 1 | `vol-regime` | `vol-regime` | Volatility Regime | Score-fed | `public_proxy` | `verified_manual` | `optionsVolatilityAmplifier` | Passive **20%** | `volatilityRegime.v1.json` | Yes | 1 |
| 2 | `breadth` | `breadth` | Market Breadth Participation | Score-fed | `public_proxy` | `manual_unverified` | `breadthWeakness` (structural) | Structural **15%** | `marketBreadth.v1.json` | Yes | 2 |
| 3 | `etf-flow` | `etf-flow` | ETF Net Issuance Pressure | Score-fed | `public_proxy` | `verified_manual` | `etfFundFlowImpulse` | Passive **25%** | `etfNetIssuance.v1.json` | Yes | 3 |
| 4 | `active-index-flow` | `active-index-flow` | Active vs Index Flow Differential | Score-fed | `public_proxy` | `verified_manual` | `activeShareOffsetProxy` (structural) | Structural **20%** | `activeIndexFlow.v1.json` | Yes | 4 |
| 5 | `passive-share` | `passive-share` | ICI Index Share Proxy | Score-fed | `public_proxy` | `verified_manual` | `passiveShareProxy` (structural) | Structural **30%** | `passiveShareProxy.v1.json` | Yes | 5 |
| 6 | `concentration` | `concentration` | Index Concentration | Score-fed | `public_proxy` | `verified_manual` | `indexConcentration` (structural) | Structural **20%** | `indexConcentration.v1.json` | Yes | 6 |
| 7 | `systematic-flow` | `systematic-flow-proxy` | CFTC Leveraged-Funds Positioning Proxy | Display-only | `public_proxy` | `verified_manual` | — | **None** — MOCK **62** unchanged | `systematicFlowProxy.v1.json` | Yes | 7 |
| 8 | `levered-etf-rebalance` | `levered-etf-rebalance-pressure` | Levered ETF Rebalance Pressure Proxy | Display-only | `public_proxy` | `manual_unverified` | — | **None** — MOCK **55** unchanged | `leveredEtfRebalancePressure.v1.json` | Yes | 8 |
| 9 | `retirement-asset-growth` | `retirement-flow-pressure-proxy` | Retirement Asset Growth Proxy | Display-only | `public_proxy` | `verified_manual` | — | **None** — MOCK **58** unchanged | `retirementFlowPressureProxy.v1.json` | Yes | 9 |
| 10 | `options-activity-proxy` | `options-activity-proxy` | Index Options Intensity Proxy | Display-only | `public_proxy` | `manual_unverified` | — | **None** — VIX remains scored vol input | `optionsActivityProxy.v1.json` | Yes | 10 |
| 11 | `index-inclusion-events` | `index-inclusion-event-proxy` | Index Inclusion Event Proxy | Display-only | `public_proxy` | `manual_unverified` | — | **None** — no score path | `indexInclusionEventProxy.v1.json` | Yes | 11 |
| 12 | `cap-weight-premium` | `cap-weight-premium-proxy` | Cap-Weight Premium Proxy | Display-only | `public_proxy` | `manual_unverified` | — | **None** — no score path | `capWeightPremiumProxy.v1.json` | Yes | 12 |
| 13 | `tail-skew-context` | `tail-skew-context-proxy` | Tail Skew Context | Display-only | `public_proxy` | `manual_unverified` | — | **None** — VIX remains scored vol input; SKEW is tail-skew display context | `tailSkewContext.v1.json` | Yes | 13 |

**JSON `signalId` vs card id:** Rows 7–9, 11–13 use different JSON `signalId` values than dashboard card ids — document only; do not change without product approval.

**Tail Skew vs VIX vs OCC:** `vol-regime` (VIX) is score-fed vol **level**. `tail-skew-context` (SKEW) is display-only tail-skew **context** — reference-aligned **2026-05-22** (`asOf`); source CSV extends through **2026-06-18** (`latestSourceDate`). `options-activity-proxy` (OCC) is display-only volume intensity.

Display order follows [`GhostFlowSignalGrid.tsx`](../../components/ghostflow/GhostFlowSignalGrid.tsx) section ordering: score-fed block first, then display-only block.

---

## Score boundary summary

| Rule | v1.9d state |
|------|-------------|
| Display-only artifacts | Do **not** contribute to Composite / Passive / Structural |
| `publicPassiveInputKey` | Display-only artifacts have **none** |
| MOCK score slots | Display-only artifacts do **not** add MOCK passive inputs |
| MOCK passive inputs (unchanged) | `systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55** |
| Index Inclusion Event Proxy | **No** score path — [v1.9c.5 mapping](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md) display-only by default |
| Cap-Weight Premium Proxy | **No** score path — [v1.9b.5 mapping](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) display-only by default |
| Tail Skew Context | **No** score path — [v1.9e.4](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md) display-only; VIX remains score-fed vol input |
| Composite / Passive / Structural | **62 / 58 / 66** — **unchanged** |

**Score integrity (v1.10):** Three MOCK passive score inputs (`systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55**) live in [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) — **outside** the 12 equity public signal cards. Display-only cards for systematic, retirement, and levered ETF refresh dashboard context only. Retirement requirements and gate ladder: [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md). **v1.10c production baseline:** [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md) — canonical score math, ten production score-input values, and MOCK/public contribution tables.

Display-only card refreshes update dashboard cards only. They do **not** change Research Composite scores unless a future product gate explicitly approves score wiring (all current gates discouraged / not approved).

---

## Treasury separation

| Item | State |
|------|--------|
| Treasury lane cards | **2** display-only cards |
| In equity `publicSignalCount`? | **No** |
| In [`PUBLIC_ARTIFACT_SIGNAL_IDS`](../../lib/ghostflow/signalPresentation.ts)? | **No** |
| In `raw.signals` / `meta.publicSignals`? | **No** — loaded via [`treasuryPlumbingDisplay.ts`](../../lib/ghostflow/treasuryPlumbingDisplay.ts) |
| Validated separately? | **Yes** — both in `npm run ghostflow:check` |

| Card id | Artifact `signalId` | Display title | Production JSON |
|---------|---------------------|---------------|-----------------|
| `treasury-futures-positioning-proxy` | `treasury-futures-positioning-proxy` | Treasury Futures Positioning Proxy | `treasuryFuturesPositioningProxy.v1.json` |
| `treasury-long-end-income-lens` | `treasury-long-end-income-lens` | Long-End Income Lens | `treasuryLongEndIncomeLens.v1.json` |

Treasury refresh updates the Treasury Plumbing display lane only — no Composite / Passive / Structural impact.

---

## Current display-only list

The **seven** display-only equity/public cards are:

1. `systematic-flow`
2. `levered-etf-rebalance`
3. `retirement-asset-growth`
4. `options-activity-proxy`
5. `index-inclusion-events`
6. `cap-weight-premium`
7. `tail-skew-context`

---

## No-score-change confirmation (v1.9d)

| Check | Result |
|-------|--------|
| Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| `publicSignalCount` | **13** (equity) |
| Score-fed equity/public | **6** |
| Display-only equity/public | **7** |
| Treasury Plumbing | **2** separate display-only cards |
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| Production artifact JSON | Unchanged |
| GhostRegime / GhostYield / Models / builder | Out of scope |
