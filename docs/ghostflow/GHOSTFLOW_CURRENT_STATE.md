# GhostFlow Current State (v1.9d)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [Roadmap](./DATA_ROADMAP.md)

Canonical inventory after **v1.9b.5** (cap-weight premium mapping) and **v1.9c.5** (index inclusion mapping) checkpoints, aligned by **v1.9d** public signal inventory memo. Theme through v1.9: **Passive Supply & Concentration Research** with display-only defaults and operator doc discipline.

**Related:** [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) (v1.9d canonical 12-signal table) · [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) (canonical operator workflow) · [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) (field quick reference) · [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) (freshness & `dataQuality` policy)

---

## Status

- **Current as of:** v1.9d — after v1.9b.5 / v1.9c.5 mapping decisions and v1.9d public signal inventory alignment (docs-only).
- **Document type:** Documentation inventory only — no score, artifact, UI, runtime, or data changes in v1.9d.
- **Baseline reference:** [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) = `2026-05-22` (production composite snapshot).
- **Canonical 12-signal table:** [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md).
- **GhostRegime boundary:** GhostRegime (including BTC provider work) is a separate product lane — not in GhostFlow v1.9 scope.
- **Freshness & dataQuality policy:** [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) — cadence thresholds and label definitions; inventory rows superseded for counts by v1.9d memo where noted.

---

## Architecture summary

### Equity Research Composite lane

| Piece | Role |
|-------|------|
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Merges mock snapshot + validated public artifacts before scoring |
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Composite / Passive / Structural sub-scores and band |
| [`GhostFlowSignalGrid`](../../components/ghostflow/GhostFlowSignalGrid.tsx) | Equity/public signal cards (score-fed + display-only + derived context) |
| **`publicSignalCount`** | **13** — six score-fed public cards + seven display-only public signals in `meta.publicSignals` |

Derived context card `distance-65` appears in the grid but is **not** counted in `publicSignalCount`.

### Treasury Plumbing lane (separate)

| Piece | Role |
|-------|------|
| [`treasuryPlumbingDisplay.ts`](../../lib/ghostflow/treasuryPlumbingDisplay.ts) | Loads Treasury production JSON; formats display cards — **not** `buildSnapshot` |
| [`GhostFlowTreasuryPlumbing`](../../components/ghostflow/GhostFlowTreasuryPlumbing.tsx) | Two-card display-only section on dashboard |
| **Card count** | **2** production-backed display-only cards |

**Counting rule:** Equity `publicSignalCount` = **13**. Treasury display lane = **2** cards. **Do not** combine into 15. Treasury is outside `raw.signals`, `meta.publicSignals`, and [`PUBLIC_ARTIFACT_SIGNAL_IDS`](../../lib/ghostflow/signalPresentation.ts).

---

## Current headline state

| Item | Value |
|------|--------|
| **Composite** | **62** |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Band** | *Crowded / Reflexive* |
| **`publicSignalCount`** | **13** (equity only) |
| **Treasury cards** | **2** separate display-only cards |
| **Treasury scored** | **No** — does not affect Composite / Passive / Structural |

---

## Score-fed public artifacts

Six artifacts merge into the Research Composite via `buildSnapshot`. All in `ghostflow:check`.

| Signal id | Source | dataQuality | Scored role | Cadence | Status | Open issue |
|-----------|--------|-------------|-------------|---------|--------|------------|
| `vol-regime` | CBOE VIX History CSV | `verified_manual` | Passive 20% — `optionsVolatilityAmplifier` | Daily | Production | Align `GHOSTFLOW_REFERENCE_AS_OF` with daily breadth pass |
| `etf-flow` | ICI domestic equity ETF estimated net issuance | `verified_manual` | Passive 25% — `etfFundFlowImpulse` | Weekly | Production | Weekly freshness caution bands (7–14 days) |
| `passive-share` | ICI fund/ETF domestic equity **index asset share** | `verified_manual` | Structural 30% — `passiveShareProxy` | Monthly | Production | Public **proxy** — not market-wide passive share |
| `active-index-flow` | ICI active vs index **monthly net flows** | `verified_manual` | Structural 20% — `activeShareOffsetProxy` | Monthly | Production | Same ICI release; flows vs assets table discipline |
| `concentration` | SSGA SPY monthly fact sheet top-10 weight | `verified_manual` | Structural 20% — `indexConcentration` | Monthly | Production | PDF month-end `asOf` vs control `publishedAt` |
| `breadth` | StockCharts `$SPXA50R` (% above 50-day MA) | `manual_unverified` | Structural 15% — `breadthWeakness` | Daily | Production | Barchart `$S5FI` cross-check gap ~1.2 pp |

---

## Display-only equity/public cards

Seven artifacts produce signal cards in the equity/public grid. **Not** merged into composite scores. Related passive score slots remain **MOCK** (see below).

| Signal id | Source | dataQuality | Why display-only | Status | Open issue |
|-----------|--------|-------------|------------------|--------|------------|
| `systematic-flow` | CFTC TFF equity-index basket (ES/NQ/RTY/VIX) | `verified_manual` | [v1.0b mapping](./CFTC_TFF_MAPPING_DECISION.md) — display Mapping A; MOCK **62** still scores `systematicStrategyPressure` | Production card | `mappingStatus` **not_final**; **v1.0c** score gate discouraged |
| `levered-etf-rebalance` | Tier-1 levered ETF rebalance pressure estimate | `manual_unverified` | [v1.1e mapping](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md); MOCK **55** still scores | Production card | `mappingStatus` **not_final**; **v1.1f** gate discouraged |
| `retirement-asset-growth` | ICI Retirement Market Table 1 structural assets | `verified_manual` | [v1.2e mapping](./RETIREMENT_FLOW_MAPPING_DECISION.md); quarterly assets ≠ flow pressure; MOCK **58** still scores | Production card | `mappingStatus` **not_final**; quarterly freshness caution normal; **v1.2f** gate discouraged |
| `options-activity-proxy` | OCC Daily Volume — Index/Others contracts | `manual_unverified` | [v1.4e mapping](./OPTIONS_ACTIVITY_MAPPING_DECISION.md); not 0DTE/GEX; VIX remains scored vol input | Production card | `mappingStatus` **not_final**; **v1.4f** gate discouraged (VIX overlap) |
| `index-inclusion-events` | Nasdaq IR index change announcements (operator-curated) | `manual_unverified` | [v1.9c.5 mapping](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md) — display-only by default; no float/demand estimates; not scored | Production card | `mappingStatus` **not_final**; **v1.9c.6** score gate discouraged / not approved |
| `cap-weight-premium` | SPY/RSP adjusted-close cap-weight premium study (operator CSV) | `manual_unverified` | [v1.9b.5 mapping](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) — display-only by default; companion to score-fed `concentration`; not causal passive-flow proof; not scored | Production card | `mappingStatus` **not_final**; reference-aligned **2026-05-22** study; **v1.9b.6** score gate discouraged / not approved |
| `tail-skew-context` | Cboe SKEW Index History CSV | `manual_unverified` | [v1.9e.4](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md) — display-only; tail-skew context distinct from score-fed VIX vol level and OCC volume proxy; not scored | Production card | `mappingStatus` **not_final**; reference-aligned **2026-05-22** (`asOf`); source CSV through **2026-06-18**; **v1.9e.6** score gate discouraged / not approved |

These cards may appear in the equity signal grid with **DISPLAY ONLY** badges. Their production artifacts refresh display values only — they do **not** replace MOCK composite inputs unless a future product-approved score gate is opened.

---

## MOCK score inputs

Three static values from [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) feed the Research Composite. **v1.8b policy:** [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md). **v1.10 operational roadmap:** [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md) — retirement requirements, decision ladder, and gate table; docs-only; no score wiring approved. **v1.10c production score baseline:** [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md) — canonical reproduction of Composite **62** / Passive **58** / Structural **66** from production merged score inputs (distinguishes mock defaults **64** / **70** from production ETF **75** / vol **34**). **v1.10d scenario study:** [MOCK_SCORE_IMPACT_SCENARIOS.md](./MOCK_SCORE_IMPACT_SCENARIOS.md) — docs/research-only mock retirement score-impact scenarios vs v1.10c baseline; no score change. **v1.10e policy (sequence closed):** [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) — Option A: keep current scoring model and disclosure; gates remain closed.

Together these inputs are **55% of Passive Pressure** and **27.5% of Composite** — a trust/disclosure issue documented in v1.8b, not authorization to change scores.

| Input | Mock value | Related display card | v1.8b decision |
|-------|------------|----------------------|----------------|
| `systematicStrategyPressure` | **62** | `systematic-flow` (CFTC TFF) | **Keep MOCK**; disclose; defer replacement to **v1.0c** product gate only; reject Mapping A score wiring |
| `retirementFlowPressureProxy` | **58** | `retirement-asset-growth` (ICI Table 1) | **Keep MOCK**; reject current artifact as replacement; possible retire/remove in broader scoring rewrite only |
| `leveredEtfRebalancePressure` | **55** | `levered-etf-rebalance` | **Keep MOCK**; disclose; defer replacement to **v1.1f** product gate only; reject wiring without true AUM history |

Display artifacts refresh cards only — they do **not** replace these score inputs. Gates **v1.0c / v1.1f / v1.2f** remain **not approved / discouraged**.

**v1.10a UI disclosure:** Dashboard copy now states 13 equity public signals (6 score-fed + 7 display-only), Treasury separate, and MOCK **62 / 58 / 55** vs display-only cards — see [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md) § v1.10a. No score change.

**v1.10b test harness:** [`ghostflowCoverageCopy.test.ts`](../../lib/ghostflow/__tests__/ghostflowCoverageCopy.test.ts) runs as part of `npm run test:ghostflow` (and `ghostflow:check`) to guard trust-badge coverage copy (7 display-only).

---

## DERIVED inputs

| Name | Source | Method | Status | Open issue |
|------|--------|--------|--------|------------|
| `modelZoneProximity` (score sub-input) | ICI `passive-share` artifact | `mapDistanceToZoneNumericValue` from index share vs 65% reference zone (v0.9b) | Wired in `buildSnapshot` — Structural 15% | Same ICI denominator caveats as `passive-share`; [stress-zone phrasebook](./PASSIVE_STRESS_ZONE_LANGUAGE.md) |
| `distance-65` (signal card only) | Same ICI index share | Context card — distance to model-stress **reference zone** | Live when passive-share validates; **not** in `publicSignalCount` | **Not a tripwire** — assumption-sensitive framing per v1.6a; public proxy only |

---

## Treasury Plumbing cards

Separate dashboard lane — **not** in equity composite or `publicSignalCount`.

| Signal id | Source | Production | Display-only rationale | mappingStatus | Future calibration | Caveat |
|-----------|--------|------------|------------------------|---------------|-------------------|--------|
| `treasury-futures-positioning-proxy` | CFTC TFF UST futures basket (2Y/5Y/10Y/30Y) | Yes — `ghostflow:check` | [v1.7f Option A](./TREASURY_PLUMBING_MAPPING_DECISION.md) display-only | `not_final` | v1.7f-calibration optional (research) | **Public CFTC positioning proxy only** — not full basis-trade measurement |
| `treasury-long-end-income-lens` | FRED six-series common-date yields/breakevens | Yes — `ghostflow:check` | v1.7f display-only; no mapper / no score | `not_final` | FRED history percentiles optional (v1.7f.1 not approved) | **Not investment advice** — not bond-buying or duration-allocation advice |

- **v1.7f** selected display-only for both artifacts.
- **v1.7g** Treasury score gate — **not approved**, discouraged.
- Treasury refresh updates display lane only — no Composite / Passive / Structural impact.

---

## Open roadmap questions

1. ~~**Mock retirement policy**~~ **Resolved (v1.8b):** [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) — all three passive MOCK inputs **kept**; no replacements or retirements executed. **Operational roadmap (v1.10):** [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md) — retirement requirements, decision ladder, score-impact prerequisites; gates **v1.0c / v1.1f / v1.2f / v1.8i** remain not approved.
2. **Calibration backlog** — v1.4e-calibration (options), v1.7f-calibration (Treasury), plus existing CFTC/levered/retirement studies — research-only vs display percentiles (not approved for UI). **v1.9e.2** Tail Skew Context design **Done** — [TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md); no card yet; next **v1.9e.3**.
3. **0DTE / true GEX path** — OCC Index/Others proxy shipped display-only; true 0DTE/GEX still YELLOW/RED per [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md).
4. **Passive-flow next source** — Any new public proxy must avoid double-counting ICI index share / active-index-flow already in composite.
5. ~~**Doc sprawl**~~ **Resolved (v1.8e):** [README.md](./README.md) — doc index and onboarding path; targeted stale-line banners on historical memos; no file moves/archives.
6. ~~**Artifact freshness / dataQuality consistency**~~ **Resolved (v1.8c):** [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) — policy documented; labels unchanged; ~~v1.8c.1 metadata cleanup~~ **Done (v1.8c.1)** — display-only/Treasury stale metadata text only.
7. ~~**v1.9 passive supply & concentration research**~~ **Partially resolved (v1.9a–b.2):** [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) · [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) — v1.9b.2 artifact design **Done**; v1.9b.3+ separately approved; scores/counts unchanged.

---

## v1.8 recommendation

**Primary v1.8 theme:** GhostFlow **Data Quality & Mock Score Discipline**

Discipline-first roadmap after v1.7 feature completion — inventory and operator honesty before new sources or score expansion.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.8a** | Current State / Data Quality Inventory — **this doc** | **Done** (docs-only) |
| **v1.8b** | Mock Score Retirement Decision — [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) | **Done** (docs-only) |
| **v1.8c** | Artifact Freshness & `dataQuality` Consistency Pass — [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) | **Done** (docs-only) |
| **v1.8d** | Operator Refresh Discipline — [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) | **Done** (docs-only) |
| **v1.8e** | Documentation Consolidation — [README.md](./README.md) | **Done** (docs-only) |
| **v1.8f** | UI Clarity / Methodology Polish | **Done** (UI/copy only; no score/artifact changes) |
| **v1.8c.1** | Metadata-Only Cleanup | **Done** (text-only `source.note` / `caveats`; no values/status/score changes) |
| **v1.8g** | Treasury Calibration Research-Only | **Optional / pause** — v1.8 theme complete; decide next |
| **v1.8h** | Passive-Flow Next-Source Feasibility | Optional |
| **v1.8i** | Score Wiring Gate | **Not approved / discouraged** |

---

## v1.9 recommendation

**Primary v1.9 theme:** GhostFlow **Passive Supply & Concentration Research** — v1.9b.5 Cap-Weight Premium mapping decision complete; v1.9c.5 Index Inclusion Event mapping decision complete; display-only by default; `publicSignalCount` **12**; scores unchanged.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.9a** | Passive Supply & Concentration Research Backlog — [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) | **Done** (docs-only) |
| **v1.9b** | Cap-Weight Concentration Premium Feasibility — [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) | **Done** (docs-only) |
| **v1.9b.1** | Cap-Weight Premium CSV Study — `ghostflow:cap-weight-premium-study` | **Done** (research script) |
| **v1.9b.1a** | Cap-Weight Premium Calibration Study — [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) | **Done** (docs-only) |
| **v1.9b.2** | Cap-Weight Premium Artifact Design — [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) | **Done** (docs-only) |
| **v1.9b.3** | Example JSON + validator — [`capWeightPremiumProxy.v1.example.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json) | **Done** |
| **v1.9b.4** | Production artifact + display card — [`capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json) | **Done** — display-only; reference-aligned **2026-05-22** study; `publicSignalCount` **11 → 12**; not scored |
| **v1.9b.5** | Mapping decision — [CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) | **Done** — display-only by default; no score mapper selected |
| **v1.9b.6** | Score gate | **Future** — discouraged / not approved |
| **v1.9c** | Passive Supply / Float Absorption Feasibility — [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) | **Done** (docs-only) |
| **v1.9c.1** | Passive Supply Source Spike — [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) | **Done** (docs-only source verification) |
| **v1.9c.2** | Index Inclusion Event Proxy Artifact Design — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) | **Done** (docs-only) |
| **v1.9c.3** | Index Inclusion Event Example JSON + Validator — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) | **Done** |
| **v1.9c.4a** | Operator provenance checklist — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) §14 | **Done** (docs-only) |
| **v1.9c.4b** | Operator intake memo — [INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md](./INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md) | **Done** |
| **v1.9c.4** | Production artifact + display card — [`indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json) | **Done** — display-only; not scored |
| **v1.9c.5** | Mapping decision — [INDEX_INCLUSION_EVENT_MAPPING_DECISION.md](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md) | **Done** — display-only by default; no score mapper selected |
| **v1.9c.6** | Score gate | **Future** — discouraged / not approved |

Composite **62 / 58 / 66**, `publicSignalCount` **12**, and Treasury **2**-card lane unchanged (scores unchanged).

---

## Avoid for now

- Score wiring (v1.0c, v1.1f, v1.2f, v1.4f, v1.7g)
- Treasury score, percentiles, or status bands (v1.7f.1)
- `publicSignalCount` change (do not combine equity 12 + Treasury 2)
- Runtime / live dashboard fetching
- New data sources without feasibility memo
- Replacing MOCK inputs without source verification and product gate
- GhostRegime work inside GhostFlow v1.8

---

## Validation / guardrails (v1.8a)

| Guardrail | v1.8a posture |
|-----------|---------------|
| Docs-only | Yes — this file + `DATA_ROADMAP.md` updates only |
| Score change | **No** — Composite **62 / 58 / 66** unchanged |
| Artifact JSON change | **No** |
| UI / code change | **No** |
| `publicSignalCount` | **12** (equity) — six display-only + six score-fed |
| Treasury lane | **2** separate display-only cards — unchanged |
| Trust tests | [`ghostflowCurrentState.test.ts`](../../lib/ghostflow/__tests__/ghostflowCurrentState.test.ts) · [`treasuryPlumbingDisplay.test.ts`](../../lib/ghostflow/__tests__/treasuryPlumbingDisplay.test.ts) |
