# GhostFlow Current Data Readiness Audit — v1.13

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [Roadmap](./DATA_ROADMAP.md) · [Integrity checkpoint](./GHOSTFLOW_PUBLIC_SIGNAL_INTEGRITY_CHECKPOINT.md)

**Related operator docs:** [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) · [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) · [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) · [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md)

This memo maps every GhostFlow signal, artifact, and source into an **operating readiness plan**. It is **not** a refresh phase, score rebaseline, new signal phase, or automation phase.

---

## Status

| Item | v1.13 posture |
|------|----------------|
| Phase | **v1.13** — current data readiness audit |
| Document type | **Docs-only** operating-readiness audit |
| **Audit date** | **2026-06-22** (Monday) |
| **Dashboard reference date** | **2026-05-22** ([`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts)) |
| Refresh performed | **No** |
| Artifact values changed | **No** |
| Score change | **No** — Composite **62** / Passive **58** / Structural **66** |
| Runtime change | **No** |
| Live fetch / source download | **No** |

**Calendar reality (2026-06-22):** Production JSON validates and the dashboard is **structurally operable**, but equity score-fed artifacts are **not calendar-current** relative to **2026-06-22** because the committed snapshot remains reference-aligned to **2026-05-22** (31 calendar days behind audit date for daily inputs). This audit records readiness and blockers; it does **not** perform refresh.

---

## Executive summary

GhostFlow has **13** equity public signals (**6** score-fed + **7** display-only), **2** separate Treasury display-only cards, **3** static MOCK Passive score inputs, **1** derived structural score input, and **0** active placeholder cards. All **15** production JSON files pass `npm run ghostflow:check`.

**Operational posture:** Switch from “build the dashboard” to “operate the dashboard.” The primary blockers to calendar-current operation are: (1) frozen reference date **2026-05-22** vs audit date **2026-06-22**; (2) monthly ICI/SSGA artifacts still on **2026-03-31** `asOf`; (3) quarterly retirement display on **2025-12-31**; (4) three MOCK Passive inputs (**62 / 58 / 55**) remain static per v1.10e policy.

**Next phases (not in v1.13):** **v1.14** reference-date / operator policy · **v1.15** operator refresh execution after policy.

---

## Canonical current state

| Item | Value |
|------|--------|
| **`GHOSTFLOW_REFERENCE_AS_OF`** | **2026-05-22** |
| **`publicSignalCount`** | **13** (equity) |
| **Score-fed equity/public** | **6** |
| **Display-only equity/public** | **7** |
| **Treasury lane** | **2** display-only cards — separate |
| **Production JSON total** | **15** (13 equity + 2 Treasury) |
| **Composite** | **62** |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Band** | *Crowded / Reflexive* |
| **MOCK Passive inputs** | **62 / 58 / 55** (static) |
| **Active placeholders** | **0** (`odte-options` suppressed) |
| **Score gates** | **Closed** — v1.10e no-score-change policy active |

---

## Signal / source inventory

Freshness @ reference **2026-05-22** from [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md). **Operational-current** column compares committed artifact `asOf` to audit date **2026-06-22** — not a claim that sources were fetched on **2026-06-22**.

### Score-fed equity (6)

| Card id | Score role | Production JSON | Source / cadence | asOf | publishedAt | Fresh @ ref | vs 2026-06-22 | Update method | Validation | Readiness |
|---------|------------|-----------------|------------------|------|-------------|-------------|---------------|---------------|------------|-----------|
| `vol-regime` | Passive **20%** (`optionsVolatilityAmplifier`) | `volatilityRegime.v1.json` | CBOE VIX CSV — **daily** | 2026-05-22 | 2026-05-22 | fresh | **Stale** — 31 cal days behind audit | Operator manual — [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) | `ghostflow:check` · `volatilityRegime.test.ts` | **READY_VALIDATED** |
| `breadth` | Structural **15%** (`breadthWeakness`) | `marketBreadth.v1.json` | StockCharts `$SPXA50R` — **daily** | 2026-05-22 | 2026-05-22 | fresh | **Stale** | Operator manual — [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) | `ghostflow:check` · `marketBreadth.test.ts` | **READY_VALIDATED** |
| `etf-flow` | Passive **25%** (`etfFundFlowImpulse`) | `etfNetIssuance.v1.json` | ICI domestic equity ETF net issuance — **weekly** | 2026-05-13 | 2026-05-19 | fresh | **Stale** | Operator manual — [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) | `ghostflow:check` · `etfNetIssuance.test.ts` | **READY_VALIDATED** |
| `passive-share` | Structural **30%** + **DERIVED** `modelZoneProximity` | `passiveShareProxy.v1.json` | ICI index asset share — **monthly** | 2026-03-31 | 2026-04-30 | fresh | **Stale** (data period) | Operator manual — [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) | `ghostflow:check` · `passiveShareProxy.test.ts` | **READY_VALIDATED** |
| `active-index-flow` | Structural **20%** (`activeShareOffsetProxy`) | `activeIndexFlow.v1.json` | ICI active vs index flows — **monthly** | 2026-03-31 | 2026-04-30 | fresh | **Stale** (data period) | Operator manual — [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) | `ghostflow:check` · `activeIndexFlow.test.ts` | **READY_VALIDATED** |
| `concentration` | Structural **20%** (`indexConcentration`) | `indexConcentration.v1.json` | SSGA SPY fact sheet top-10 — **monthly** | 2026-03-31 | 2026-04-09 | caution | **Stale** (data period) | Operator manual — [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) | `ghostflow:check` · `indexConcentration.test.ts` | **READY_VALIDATED** |

### Display-only equity (7)

| Card id | Artifact `signalId` | Production JSON | Source / cadence | asOf | publishedAt | vs 2026-06-22 | Update method | Validation | Readiness |
|---------|---------------------|-----------------|------------------|------|-------------|---------------|---------------|------------|-----------|
| `systematic-flow` | `systematic-flow-proxy` | `systematicFlowProxy.v1.json` | CFTC TFF equity basket — **weekly** | 2026-05-19 | 2026-05-22 | **Stale** | Script-assisted (`ghostflow:cftc-tff-spike`) + manual JSON | `ghostflow:check` · display tests | **DISPLAY_ONLY** |
| `levered-etf-rebalance` | `levered-etf-rebalance-pressure` | `leveredEtfRebalancePressure.v1.json` | Tier-1 levered ETF rebalance — **event/manual** | 2026-05-22 | 2026-05-28 | Event-dependent | Operator manual (no production refresh script) | `ghostflow:check` · display tests | **EVENT_MANUAL** |
| `retirement-asset-growth` | `retirement-flow-pressure-proxy` | `retirementFlowPressureProxy.v1.json` | ICI Retirement Market Table 1 — **quarterly** | 2025-12-31 | 2026-03-26 | **Stale** (quarter-end period) | Operator manual | `ghostflow:check` · display tests | **DISPLAY_ONLY** |
| `options-activity-proxy` | `options-activity-proxy` | `optionsActivityProxy.v1.json` | OCC daily Index/Others volume — **daily** | 2026-05-22 | 2026-05-22 | **Stale** | Script-assisted (`ghostflow:options-data-spike`) + manual JSON | `ghostflow:check` · display tests | **DISPLAY_ONLY** |
| `index-inclusion-events` | `index-inclusion-event-proxy` | `indexInclusionEventProxy.v1.json` | Nasdaq IR operator-curated — **event/manual** | 2026-05-22 | 2026-06-16 | Event-dependent | Operator manual + intake memo | `ghostflow:check` · display tests | **EVENT_MANUAL** |
| `cap-weight-premium` | `cap-weight-premium-proxy` | `capWeightPremiumProxy.v1.json` | SPY/RSP study — **weekly/study** | 2026-05-22 | 2026-06-17 | Study-dependent | Script-assisted (`ghostflow:cap-weight-premium-study`) + manual JSON | `ghostflow:check` · display tests | **DISPLAY_ONLY** |
| `tail-skew-context` | `tail-skew-context-proxy` | `tailSkewContext.v1.json` | Cboe SKEW CSV — **daily** | 2026-05-22 | 2026-06-16 | **Stale card observation** — reference-aligned; see Tail Skew note below | Script-assisted (`skew-source-spike.ts`, not in package.json) + manual JSON | `ghostflow:check` · `tailSkewContextDisplay.test.ts` | **DISPLAY_ONLY** |

#### Tail Skew Context — reference vs source metadata

| Item | Value |
|------|--------|
| Lane | **Display-only** — not score-fed |
| Dashboard `asOf` | **2026-05-22** (reference-aligned) |
| Card observation | SKEW **137.39** at reference session |
| `historySummary.latestSourceDate` | **2026-06-18** (committed artifact metadata only — **not** a dashboard reference-date change) |
| `historySummary.latestSourceValue` | **146.72** |
| `publicPassiveInputKey` | **None** |
| v1.9e.6 score gate | **Discouraged / not approved** |
| VIX | Remains sole score-fed vol input |

Do **not** treat `latestSourceDate` **2026-06-18** as current dashboard observation through **2026-06-22**. Refreshing the card observation is a **v1.15** operator action after reference policy (**v1.14**).

### Treasury separate lane (2)

| Card id | Production JSON | Source / cadence | asOf | publishedAt | vs 2026-06-22 | Update method | Readiness |
|---------|-----------------|------------------|------|-------------|---------------|---------------|-----------|
| `treasury-futures-positioning-proxy` | `treasuryFuturesPositioningProxy.v1.json` | CFTC TFF UST basket — **weekly** | 2026-05-26 | 2026-06-04 | **Stale** vs audit | `ghostflow:treasury-cftc-pre-spike` + manual JSON | **TREASURY_SEPARATE** |
| `treasury-long-end-income-lens` | `treasuryLongEndIncomeLens.v1.json` | FRED 6-series common date — **daily** | 2026-06-02 | 2026-06-04 | **Stale** vs audit (20 cal days) | `ghostflow:fred-treasury-yields-spike` + manual JSON | **TREASURY_SEPARATE** |

Treasury is outside equity `publicSignalCount` and Research Composite.

### MOCK Passive score inputs (3)

| Input key | Value | Passive weight | Update method | Readiness |
|-----------|-------|----------------|---------------|-----------|
| `systematicStrategyPressure` | **62** | **20%** | **STATIC_MOCK** — [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | **STATIC_MOCK** |
| `retirementFlowPressureProxy` | **58** | **20%** | **STATIC_MOCK** | **STATIC_MOCK** |
| `leveredEtfRebalancePressure` | **55** | **15%** | **STATIC_MOCK** | **STATIC_MOCK** |

Related display cards exist but do **not** replace MOCK values per [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md).

### Derived / context

| Item | Role | Refresh | Readiness |
|------|------|---------|-----------|
| `modelZoneProximity` | Structural **15%** score sub-input | **DERIVED** from `passive-share` | **DERIVED** — refresh passive-share only |
| `distance-65` | Context card only | **DERIVED** from same ICI index share | **DERIVED** — not in `publicSignalCount` |

### Placeholder

| Item | Status |
|------|--------|
| `odte-options` | Fallback in mock snapshot only — **suppressed** when `optionsActivityProxy.v1.json` validates · **0** active placeholders |

---

## Readiness classification

| Category | Count / items |
|----------|----------------|
| **READY_MANUAL** | All 6 score-fed; levered ETF; retirement; index inclusion; Tail Skew (after local CSV) |
| **READY_SCRIPT_ASSISTED** | systematic-flow, options-activity, cap-weight, tail-skew, both Treasury |
| **READY_VALIDATED** | All 15 production JSON pass `ghostflow:check` at audit time |
| **STATIC_MOCK** | systematic **62**, retirement **58**, levered **55** |
| **DERIVED** | `modelZoneProximity`, `distance-65` |
| **EVENT_MANUAL** | index-inclusion-events, levered-etf-rebalance (when applicable) |
| **DISPLAY_ONLY** | All 7 display-only equity cards |
| **TREASURY_SEPARATE** | 2 Treasury cards |
| **SOURCE_BLOCKED** | None for shipped lanes (SKEW source lock PASS; implied correlation deferred) |

---

## Current-data blockers

| Signal / area | Blocker | Severity | Fix phase |
|---------------|---------|----------|-----------|
| Daily score-fed (`vol-regime`, `breadth`) | `asOf` **2026-05-22** vs audit **2026-06-22**; reference frozen | **MVP blocker** | **v1.15** daily refresh |
| `etf-flow` | Weekly ICI week ended **2026-05-13** | **MVP blocker** | **v1.15** weekly |
| Monthly ICI + SSGA (`passive-share`, `active-index-flow`, `concentration`) | `asOf` **2026-03-31** | **MVP blocker** (score impact) | **v1.15** monthly |
| MOCK **62 / 58 / 55** | Static **55%** of Passive / **27.5%** of Composite | **MVP blocker** (trust/disclosure) | Disclosure only — v1.10e; no refresh fix |
| Reference-date policy | No formal rule for bumping `GHOSTFLOW_REFERENCE_AS_OF` vs artifact `asOf` | **Operational blocker** | **v1.14** |
| Tail Skew checklist gap | Daily row was missing from top-level schedule (fixed in v1.13 checklist update) | **Operational blocker** | **v1.13** docs |
| Tail Skew card vs CSV metadata | Card **2026-05-22**; `latestSourceDate` **2026-06-18** in JSON — intentional ref-alignment | **Non-blocking** | Document only; **v1.15** if policy allows |
| `retirement-asset-growth` | Quarterly `asOf` **2025-12-31** | **Operational blocker** (display) | **v1.15** when ICI quarter available |
| Freshness summary rollup | Options/CFTC/levered/retirement not in dashboard rollup | **Disclosure-only** | Future v1.8f (optional) |
| Score gates closed | Display cards cannot replace MOCK without product gate | **Non-blocking** (by design) | v1.10e policy |

---

## MVP definition — usable current-data MVP

GhostFlow reaches **usable current-data MVP** when **all** of the following hold:

1. **Reference-date policy documented** (**v1.14**) — when to bump [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) vs per-artifact `asOf`; daily pass requires VIX + breadth on same session before reference bump.
2. **All 6 score-fed artifacts** refreshed to **latest available official source date** per cadence (as of operator execution date, not necessarily **2026-06-22** for all cadences).
3. **All 7 display-only artifacts** refreshed to latest available source **or** explicitly marked stale/manual in operator docs and dashboard disclosure.
4. **Treasury lane** refreshed on its own cadence; remains outside equity `publicSignalCount`.
5. **MOCK Passive 62/58/55** unchanged, disclosed, listed as score limitations ([MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md)).
6. **`ghostflow:check` + lint + test:ghostflow + build** pass after any artifact commit.
7. **Score-impact summary** documented if score-fed refresh moves Composite away from **62 / 58 / 66** baseline ([SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md)).
8. **No score gates opened**; `publicSignalCount` remains **13**.

**Not required for MVP:** MOCK replacement, display-to-score wiring, live API/cron automation, implied-correlation source, Tail Skew score gate (v1.9e.6).

---

## Recommended refresh sequence (v1.14 / v1.15 — plan only)

### v1.14 — Reference-date and operator policy (docs-only)

- Formalize `GHOSTFLOW_REFERENCE_AS_OF` bump rules.
- Confirm Tail Skew daily discipline in checklist (done in v1.13).
- Link this audit from roadmap and operator docs.

### v1.15 — Operator refresh execution (separate approval; artifact JSON commits)

| Step | Order | Artifacts | Notes |
|------|-------|-----------|-------|
| 1 | Policy | Confirm reference target | Do not refresh before v1.14 policy |
| 2 | Daily score-fed | `vol-regime`, `breadth` | Bump reference after both align |
| 3 | Daily display | `options-activity-proxy`, `tail-skew-context` | Display-only; Tail Skew observation vs ref policy |
| 4 | Weekly score-fed | `etf-flow` | May change Passive |
| 5 | Weekly display + Treasury | `systematic-flow`, `treasury-futures-positioning-proxy` | Separate lanes |
| 6 | Daily Treasury | `treasury-long-end-income-lens` | FRED spike + manual JSON |
| 7 | Monthly score-fed | `passive-share`, `active-index-flow`, `concentration` | Updates **derived** structural input |
| 8 | Quarterly display | `retirement-asset-growth` | Only if new ICI quarter available |
| 9 | Event/manual | `levered-etf-rebalance`, `index-inclusion-events`, `cap-weight-premium` | When events / study CSVs exist |
| 10 | Validate | `ghostflow:check`, full suite | Document score delta vs baseline |

**Do not touch in refresh:** `scoring.ts`, merge logic, `mockGhostflowSnapshot.ts` (unless explicit gate), score gates.

---

## Scripts / helpers inventory

| Script | In `package.json`? | Network? | Writes output? | In `ghostflow:check`? | Routine operator? |
|--------|-------------------|----------|----------------|----------------------|-------------------|
| [`validate-artifacts.ts`](../../scripts/ghostflow/validate-artifacts.ts) | yes | no | no | **yes** | **yes** — post-refresh |
| [`cftc-tff-spike.ts`](../../scripts/ghostflow/cftc-tff-spike.ts) | yes | yes (CFTC API) | no | no | assist — equity CFTC |
| [`treasury-cftc-pre-spike.ts`](../../scripts/ghostflow/treasury-cftc-pre-spike.ts) | yes | yes | optional research JSON | no | assist — Treasury CFTC |
| [`fred-treasury-yields-spike.ts`](../../scripts/ghostflow/fred-treasury-yields-spike.ts) | yes | yes (CSV/API fallback) | optional research JSON | no | assist — Treasury FRED |
| [`options-data-spike.ts`](../../scripts/ghostflow/options-data-spike.ts) | yes | no (operator files) | no | no | research / column lock |
| [`cap-weight-premium-study.ts`](../../scripts/ghostflow/cap-weight-premium-study.ts) | yes | no (operator CSVs) | optional `--out` JSON | no | assist — cap-weight display |
| [`skew-source-spike.ts`](../../scripts/ghostflow/skew-source-spike.ts) | **no** | no (operator CSV) | no | no | assist — Tail Skew |
| [`cftc-tff-history-study.ts`](../../scripts/ghostflow/cftc-tff-history-study.ts) | yes | varies | research | no | **research-only** |
| [`levered-etf-rebalance-history-study.ts`](../../scripts/ghostflow/levered-etf-rebalance-history-study.ts) | yes | operator files | research | no | **research-only** |
| [`retirement-flow-history-study.ts`](../../scripts/ghostflow/retirement-flow-history-study.ts) | yes | operator files | research | no | **research-only** |

**No dedicated VIX/breadth/ICI/SSGA production extract scripts** — core score-fed inputs remain operator manual transcription per runbooks.

---

## Next phases

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.13** | This readiness audit | **Done** (docs-only) |
| **v1.14** | Reference-date / operator policy | **Done** — [REFERENCE_DATE_AND_OPERATOR_POLICY.md](./REFERENCE_DATE_AND_OPERATOR_POLICY.md) |
| **v1.15** | Operator refresh execution (artifact JSON) | **Next** — after v1.14 policy |

---

## No-change confirmation

| Area | v1.13 status |
|------|--------------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| [`reference.ts`](../../lib/ghostflow/reference.ts) | Unchanged — **2026-05-22** |
| Production artifact JSON | Unchanged |
| Validators | Unchanged |
| UI components | Unchanged |
| Tests | Unchanged |
| `package.json` | Unchanged |
| GhostRegime / Marketstack / GhostYield / Models / builder | Untouched |

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · equity `publicSignalCount` **13** · Treasury **2** · MOCK **62 / 58 / 55**.
