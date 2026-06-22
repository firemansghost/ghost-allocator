# Operator Refresh Discipline (GhostFlow v1.12)

**Operator path:** [README](./README.md) · [Discipline](./OPERATOR_REFRESH_DISCIPLINE.md) · [Checklist](./MANUAL_REFRESH_CHECKLIST.md)

**Status:** Canonical operator workflow — aligned by **v1.12** public signal integrity checkpoint; **docs-only** in v1.12; no artifact JSON, score, UI, runtime, or schema changes in v1.12.  
**Related:** [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) (field reference) · [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) (canonical **13-signal** table) · [GHOSTFLOW_PUBLIC_SIGNAL_INTEGRITY_CHECKPOINT.md](./GHOSTFLOW_PUBLIC_SIGNAL_INTEGRITY_CHECKPOINT.md) (v1.12 audit) · [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) (freshness & `dataQuality` policy) · [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) · [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md)

| Deferred | Posture |
|----------|---------|
| **v1.8c.1** metadata-only JSON cleanup | Not in v1.8d |
| **v1.8f** UI / freshness-summary rollup | Not in v1.8d |
| **GhostRegime** | Out of scope |

---

## Status

| Item | v1.12 posture |
|------|---------------|
| Document type | Operator refresh discipline |
| Production JSON | **Unchanged** |
| Score | Composite **62** / Passive **58** / Structural **66** — **unchanged** |
| `publicSignalCount` | **13** (equity) — **unchanged** |
| UI / code / runtime | **Unchanged** (v1.12 docs alignment only) |

---

## Who this is for

- **For:** Operators manually refreshing GhostFlow production artifact JSON in this repo.
- **Not for:** Score-wiring implementation (v1.0c, v1.1f, v1.2f, v1.4f, v1.7g, v1.8i).
- **Not for:** New data-source feasibility or product gates.
- **Not for:** Dashboard UI or freshness-summary code changes.

---

## Operator taxonomy

| Class | Items | Operator action | Affects score? | Affects `publicSignalCount`? | Display-only? | Validation | Do-not-touch warning |
|-------|-------|-----------------|---------------|------------------------------|---------------|------------|----------------------|
| **A — Score-fed equity** | vol-regime, etf-flow, passive-share, active-index-flow, concentration, breadth | Edit artifact JSON on cadence | **Yes** — can change Composite / Passive / Structural | No (stays **13**) | No | `npm run ghostflow:check` | Do not promote display-only artifacts here; do not edit mock snapshot |
| **B — Display-only equity** | systematic-flow, levered-etf-rebalance, retirement-asset-growth, options-activity-proxy, index-inclusion-events, cap-weight-premium, tail-skew-context | Edit artifact JSON | **No** — MOCK **62 / 55 / 58** unchanged; no score path for display-only lanes | No (stays **13**) | **Yes** | `ghostflow:check` | Card refresh ≠ composite input — display-only refreshes do **not** affect scores unless a future score gate is explicitly approved |
| **C — Treasury lane** | treasury-futures-positioning-proxy, treasury-long-end-income-lens | Edit Treasury JSON only | **No** | **No** — outside equity grid | **Yes** (separate lane) | `ghostflow:check` | Never add to `buildSnapshot`, `raw.signals`, or `publicSignalCount` |
| **D — Derived/context** | modelZoneProximity (score), distance-65 (card) | **Do not edit separately** — refresh `passive-share` | Partial — `modelZoneProximity` when passive-share public | No | Card only for distance-65 | `ghostflow:check` | Do not create a separate derived JSON artifact |
| **E — MOCK score inputs** | systematicStrategyPressure **62**, retirementFlowPressureProxy **58**, leveredEtfRebalancePressure **55** | **Do not edit** [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | Only if explicit product gate (not routine) | No | N/A | N/A | Never bump mocks to match display cards |

---

## Cadence refresh map

Reference: [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) for **equity** freshness. Thresholds: [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md).

| Cadence | Artifacts | Normal delay | Caution | Investigate (stale) | Score can change? | Validation |
|---------|-----------|--------------|---------|---------------------|-------------------|------------|
| **Daily** | vol-regime, breadth | ≤2 trading days | 3–5 trading | >5 trading | **Yes** | `ghostflow:check` + bump ref after daily pass |
| **Daily** | options-activity-proxy | same | same | >5 trading | No | `ghostflow:check` |
| **Daily** | treasury-long-end-income-lens | manual FRED common date | — | missing common `asOf` / validator fail | No | `ghostflow:check` |
| **Daily** | tail-skew-context (SKEW) | ≤2 trading | 3–5 trading | >5 trading | No | `ghostflow:check` |
| **Weekly** | etf-flow | ≤7 calendar days | 8–14 | >14 | **Yes** | `ghostflow:check` |
| **Weekly** | systematic-flow (CFTC) | ≤10 calendar | 11–17 | >17 | No | `ghostflow:check` |
| **Weekly** | treasury-futures-positioning-proxy | CFTC release lag | — | report-week mismatch / validator fail | No | `ghostflow:check` |
| **Weekly / event** | levered-etf-rebalance | ≤10 calendar after publish | 11–17 | >17 or bad AUM/return alignment | No | `ghostflow:check` |
| **Monthly** | passive-share, active-index-flow | ≤35 calendar | 36–55 | >55 | **Yes** (+ derived modelZoneProximity) | `ghostflow:check` |
| **Monthly** | concentration | ≤35 calendar | 36–55 (**normal** between SSGA sheets) | >55 | **Yes** | `ghostflow:check` |
| **Quarterly** | retirement-asset-growth | ≤45 calendar | 46–90 (**normal** ICI cadence) | >90 | No | `ghostflow:check` |
| **Event/manual** | levered ETF special session | per source window | per policy | validator / cross-check fail | No | `ghostflow:check` |

**Spike helpers (extract aids only):** `ghostflow:cftc-tff-spike`, `ghostflow:treasury-cftc-pre-spike`, `ghostflow:fred-treasury-yields-spike`, `ghostflow:options-data-spike`.

---

## Operator workflow

### Pre-refresh

1. **Classify** artifact (A/B/C/D/E).
2. **Confirm cadence** (daily / weekly / monthly / quarterly / event).
3. **Confirm source period** — `asOf` = data period end; `publishedAt` = release or capture date.
4. **Score impact** — only class **A** (and derived from passive-share) can change Composite.
5. **Display-only** — class B: confirm MOCK slots stay static.
6. **Treasury** — class C: confirm separate lane only.
7. **MOCK** — class E: do not touch mock snapshot.
8. Read **Operator guardrails** below.

### Refresh

- Edit **only** intended production JSON (plus [`reference.ts`](../../lib/ghostflow/reference.ts) on full daily equity pass).
- Use runbooks and spike scripts as **extraction aids** — hand-verify before commit.
- Update `asOf`, `publishedAt`, `source.note`, caveats only as required by source.
- **Preserve** source semantics; do not change JSON schema in routine refresh.
- Do **not** rewrite caveats to imply scoring.
- Do **not** set `mappingStatus: final` without a separate decision memo.
- Do **not** edit [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts).

### Post-refresh

```bash
npm run ghostflow:check
```

**Verify expected behavior:**

| Refresh type | Composite | `publicSignalCount` | Treasury lane |
|--------------|-------------|---------------------|---------------|
| Score-fed (A) only | May change | **13** | unchanged |
| Display-only (B) only | **Unchanged** (62/58/66 if mocks unchanged) | **13** | unchanged |
| Treasury (C) only | **Unchanged** | **13** | 2 cards updated |
| Derived (D) | Follows passive-share | **13** | unchanged |

**Full pre-PR (artifact value commits):**

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

**Commit discipline:** one artifact family per commit when possible; never mix score wiring with refresh; never mix GhostFlow refresh with GhostRegime work.

---

## Validation command matrix

| Change type | Commands | v1.8d? |
|-------------|----------|--------|
| Docs-only refresh discipline | `git diff --name-only` | **Yes** |
| Production artifact **value** refresh | `npm run ghostflow:check`; full suite before PR | Operator routine |
| Metadata-only JSON (v1.8c.1) | `ghostflow:check` + `test:ghostflow` | **Deferred** — separate approval |
| Code / loader / UI | lint + build + test:ghostflow + ghostflow:check | **Deferred** |
| Score wiring | Product gate required | **Not approved** |

---

## Operator guardrails

**Never during routine refresh:**

- Change [`scoring.ts`](../../lib/ghostflow/scoring.ts), [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts), [`signalPresentation.ts`](../../lib/ghostflow/signalPresentation.ts)
- Change [`artifactFreshness.ts`](../../lib/ghostflow/artifactFreshness.ts), [`freshnessSummary.ts`](../../lib/ghostflow/freshnessSummary.ts)
- Change [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts)
- Change `publicSignalCount` or promote display-only artifacts into score
- Add Treasury to equity grid or Research Composite
- Set `mappingStatus: final` without decision memo
- Change `dataQuality` only to make a card look better ([audit policy](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md))
- Write `mock_fallback` into production JSON
- Open score gates (v1.0c, v1.1f, v1.2f, v1.4f, v1.7g, v1.8i) during refresh
- Touch GhostRegime, GhostYield, Models, builder
- Change artifact JSON schemas without source structure change

---

## Normal delay vs investigate

### Normal delay (expected)

- **Concentration** caution between SSGA monthly fact sheet releases.
- **Retirement** caution during 46–90 days after ICI quarterly release — not a failed feed.
- **CFTC systematic-flow** within ~1 week of Friday release schedule.
- **Treasury** `asOf` after equity `GHOSTFLOW_REFERENCE_AS_OF` — separate lane.
- **Display-only** refresh with Composite unchanged.

### Investigate

- Daily VIX/breadth **stale** (>5 trading days vs reference).
- Weekly ETF **stale** (>14 calendar days since `publishedAt`).
- Monthly ICI/SSGA **stale** (>55 calendar days).
- Retirement **stale** (>90 calendar days).
- **`ghostflow:check` failure** or `ghostflow:validate-artifacts` errors.
- **JSON `signalId` vs card-id** confusion (see [audit inventory](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md)).
- Treasury **missing FRED common date** or **CFTC report-week** misalignment.

---

## Commit discipline

- **One artifact family per commit** when practical (daily equity, weekly ICI ETF, monthly ICI trio, etc.).
- **Docs-only** v1.8d commits must not include production JSON.
- **Metadata-only** commits (v1.8c.1 if approved) must state no observation values changed.
- **Never** mix score wiring with artifact refresh.
- **Never** mix GhostFlow refresh with GhostRegime changes in one commit.

Suggested messages: see [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) § Commit message suggestions.

---

## Quick links

| Doc | Role |
|-----|------|
| [README.md](./README.md) | GhostFlow doc index and onboarding path |
| [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) | Field-level quick checklist + per-artifact tables |
| [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) | Freshness thresholds & `dataQuality` policy |
| [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) | Canonical **13-signal** inventory |
| [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) | Canonical dashboard inventory |
| [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) | MOCK keep policy |
| [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) · [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) · [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) · etc. | Per-source deep dives |
| [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) · [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) · [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) · [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) | Display-only mapping decisions |

---

## No-score-change confirmation (v1.12)

| Check | Result |
|-------|--------|
| Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| `publicSignalCount` | **13** (equity) |
| Treasury Plumbing | **2** separate display-only cards |
| Production JSON | Unchanged in v1.12 |
| Score / code / runtime | Unchanged in v1.12 |
| GhostRegime | Out of scope |
