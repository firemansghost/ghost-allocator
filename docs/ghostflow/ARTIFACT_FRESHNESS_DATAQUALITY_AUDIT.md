# Artifact Freshness & dataQuality Audit (GhostFlow v1.8c)

**Status:** Audit / policy memo only — **docs-only**; no score, artifact value, production JSON, UI, runtime, or validation-script changes.  
**Effective:** v1.8c (after v1.8a inventory and v1.8b mock retirement decision)  
**Reference date:** [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) = `2026-05-22` (equity freshness narrative)  
**Related:** [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) · [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md)

GhostRegime is out of scope.

---

## Status

| Item | v1.8c posture |
|------|---------------|
| Document type | Audit / policy memo |
| Score changes | **None** — Composite **62** / Passive **58** / Structural **66** |
| Artifact observation values | **Unchanged** |
| Production JSON | **Unchanged** |
| UI / components | **Unchanged** |
| Freshness evaluators | **Unchanged** |
| Validation scripts | **Unchanged** |
| Score gates | **Not opened** |
| `publicSignalCount` | **10** (equity) |

---

## Current artifact classes

| Class | Count | Scored? | In `meta.publicSignals`? | Notes |
|-------|-------|---------|--------------------------|-------|
| **Score-fed equity/public** | **6** | Yes — merge via `buildSnapshot` | Yes | vol-regime, etf-flow, passive-share, active-index-flow, concentration, breadth |
| **Display-only equity/public** | **4** | No | Yes | systematic-flow, levered-etf-rebalance, retirement-asset-growth, options-activity-proxy |
| **Treasury separate lane** | **2** | No | **No** | treasury-futures-positioning-proxy, treasury-long-end-income-lens — `treasuryPlumbingDisplay` only |
| **Derived / context** | **1** card | Partial — `modelZoneProximity` scored when passive-share public | Card: `distance-65` | Not in `publicSignalCount` |
| **MOCK score inputs** | **3** | Yes — static from mock snapshot | No artifact | systematic **62**, retirement **58**, levered **55** — [v1.8b](./MOCK_SCORE_RETIREMENT_PLAN.md) |
| **Example / design-only JSON** | 6 `*.v1.example.json` | — | — | **Excluded** from production conclusions |

**Concept separation (canonical for v1.8c):**

- **`dataQuality`** — operator verification confidence for the manual extract/transform cycle.
- **Scored vs display-only** — whether the artifact merges into the Research Composite (`publicPassiveInputKeys` / structural keys).
- **`mappingStatus`** — whether a score mapper is final (`not_final` on display-only artifacts).
- **`freshnessStatus`** — age vs [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) using cadence-specific rules.
- **Display-only does not mean low quality** — CFTC, retirement, and Treasury artifacts can be `verified_manual` while remaining unscored.
- **Verified manual source does not automatically mean scored** — scoring requires separate product gates (v1.0c, v1.1f, etc.).

---

## dataQuality policy

| Label | Definition | Production JSON? |
|-------|------------|------------------|
| **`verified_manual`** | Manually refreshed from an official or source-controlled path; extraction and transformation cross-checked per runbook or artifact procedure. Still hand-maintained — not runtime/live. | Yes |
| **`manual_unverified`** | Manually refreshed or derived; not fully independently verified this cycle. May still originate from an official source (e.g. OCC CSV). Useful for display or score, with weaker verification confidence. | Yes |
| **`mock_fallback`** | Runtime fallback when an artifact is missing or invalid. **Must not** be written into production artifact JSON. | **No** — runtime only |

**Policy rules:**

1. Manually refreshed **does not** automatically mean `manual_unverified`.
2. Official source **does not** automatically mean `verified_manual` if transformation, cross-check, or cadence discipline is incomplete.
3. Scoring status and `dataQuality` are **independent**.
4. Display-only status and `dataQuality` are **independent**.

---

## Freshness policy by cadence

Freshness is computed at build time against `GHOSTFLOW_REFERENCE_AS_OF`. Treasury lane artifacts are outside equity `meta.publicSignals` freshness bands today.

| Cadence class | Artifacts (examples) | Freshness anchor | Fresh | Caution | Stale | Operator note |
|---------------|----------------------|------------------|-------|---------|-------|---------------|
| **Daily (VIX, breadth)** | `vol-regime`, `breadth` | `asOf` | ≤2 **trading** days | 3–5 trading | >5 trading | Bump reference after daily pass; trading-day math in [`artifactFreshness.ts`](../../lib/ghostflow/artifactFreshness.ts) |
| **Daily (options)** | `options-activity-proxy` | `publishedAt ?? asOf` | ≤2 trading | 3–5 trading | >5 trading | Display-only OCC Index/Others proxy; **not** 0DTE/GEX |
| **Weekly (ETF)** | `etf-flow` | `publishedAt ?? asOf` | ≤7 **calendar** days | 8–14 | >14 | ICI weekly estimated net issuance |
| **Monthly (ICI / SSGA)** | `passive-share`, `active-index-flow`, `concentration` | `publishedAt ?? asOf` | ≤35 calendar | 36–55 | >55 | Caution between releases is **normal** for monthly manual artifacts |
| **CFTC systematic** | `systematic-flow` | `publishedAt ?? asOf` | ≤10 calendar | 11–17 | >17 | Weekly CFTC TFF; display-only; MOCK **62** unchanged |
| **Levered ETF estimate** | `levered-etf-rebalance` | `publishedAt ?? asOf` | ≤10 calendar | 11–17 | >17 | Event/manual fixed-current-AUM estimate; not true historical AUM flow |
| **Retirement quarterly** | `retirement-asset-growth` | `publishedAt ?? asOf` | ≤45 calendar | 46–90 | >90 | Quarterly caution often **normal ICI cadence** — not a failed feed |
| **Treasury separate lane** | Both Treasury production JSON | `asOf` / `publishedAt` on card | — | — | — | **No structured freshness bands** in equity snapshot; future policy needs separate approval |

**Dashboard freshness summary** ([`freshnessSummary.ts`](../../lib/ghostflow/freshnessSummary.ts)) rolls up only: daily **vol-regime + breadth**, weekly **etf-flow**, monthly **ICI/SSGA trio**. Per-card freshness on signal cards covers all equity `publicSignals`; summary under-reporting is documented in Findings — not changed in v1.8c.

---

## Production artifact inventory

Evaluated against reference **`2026-05-22`**. All 12 files validated by `npm run ghostflow:check`.

| File | Card / lane id | Lane | dataQuality | mappingStatus | asOf | publishedAt | Cadence | Freshness @ ref | ghostflow:check | Open issue |
|------|----------------|------|-------------|---------------|------|-------------|---------|-----------------|-----------------|------------|
| `volatilityRegime.v1.json` | `vol-regime` | Score-fed | `verified_manual` | — | 2026-05-22 | 2026-05-22 | Daily | **fresh** | Yes | Align ref with daily pass |
| `marketBreadth.v1.json` | `breadth` | Score-fed | `manual_unverified` | — | 2026-05-22 | 2026-05-22 | Daily | **fresh** | Yes | Barchart cross-check gap ~1.2 pp; label appropriate |
| `etfNetIssuance.v1.json` | `etf-flow` | Score-fed | `verified_manual` | — | 2026-05-13 | 2026-05-19 | Weekly | **fresh** (3d since pub) | Yes | Week-ended vs `publishedAt` discipline |
| `passiveShareProxy.v1.json` | `passive-share` | Score-fed | `verified_manual` | — | 2026-03-31 | 2026-04-30 | Monthly | **fresh** (22d) | Yes | Index-share proxy caveat |
| `activeIndexFlow.v1.json` | `active-index-flow` | Score-fed | `verified_manual` | — | 2026-03-31 | 2026-04-30 | Monthly | **fresh** (22d) | Yes | Flows vs assets table |
| `indexConcentration.v1.json` | `concentration` | Score-fed | `verified_manual` | — | 2026-03-31 | 2026-04-09 | Monthly | **caution** (43d) | Yes | Normal between SSGA releases |
| `systematicFlowProxy.v1.json` | `systematic-flow` | Display-only | `verified_manual` | — | 2026-05-19 | 2026-05-22 | Weekly (CFTC) | **fresh** (0d) | Yes | JSON `signalId`: `systematic-flow-proxy` |
| `leveredEtfRebalancePressure.v1.json` | `levered-etf-rebalance` | Display-only | `manual_unverified` | `not_final` | 2026-05-22 | 2026-05-28 | Event/manual | **fresh** (anchor after ref → 0d) | Yes | AUM/return date skew; label appropriate |
| `retirementFlowPressureProxy.v1.json` | `retirement-asset-growth` | Display-only | `verified_manual` | `not_final` | 2025-12-31 | 2026-03-26 | Quarterly | **caution** (57d; normal cadence) | Yes | Stale note “not yet displayed” — v1.8c.1 candidate; JSON `signalId` ≠ card id |
| `optionsActivityProxy.v1.json` | `options-activity-proxy` | Display-only | `manual_unverified` | `not_final` | 2026-05-22 | 2026-05-22 | Daily | **fresh** | Yes | OCC spike in `source.note`; label defensible per policy |
| `treasuryFuturesPositioningProxy.v1.json` | `treasury-futures-positioning-proxy` | Treasury | `manual_unverified` | `not_final` | 2026-05-26 | 2026-06-04 | Weekly CFTC | **No equity band** | Yes | Separate lane; `asOf` can exceed equity ref |
| `treasuryLongEndIncomeLens.v1.json` | `treasury-long-end-income-lens` | Treasury | `verified_manual` | `not_final` | 2026-06-02 | 2026-06-04 | Daily FRED | **No equity band** | Yes | FRED common-date design; not investment advice |

**JSON `signalId` vs card id mapping (document only — do not change in v1.8c):**

| JSON `signalId` | Dashboard card id |
|-----------------|-------------------|
| `systematic-flow-proxy` | `systematic-flow` |
| `levered-etf-rebalance-pressure` | `levered-etf-rebalance` |
| `retirement-flow-pressure-proxy` | `retirement-asset-growth` |

---

## Findings

### Working well

- Daily VIX and breadth use **trading-day** freshness logic ([`artifactFreshness.ts`](../../lib/ghostflow/artifactFreshness.ts)).
- Weekly and monthly thresholds are **less aggressive** than daily — monthly caution on concentration (43 days) reflects normal gap between SSGA releases.
- Retirement quarterly caution includes **normal-cadence language** in code and checklist (46–90 days after release).
- Display-only artifacts remain **separate from score** ([v1.8b](./MOCK_SCORE_RETIREMENT_PLAN.md)).
- `ghostflow:check` validates **all 12** production JSON files ([`validate-artifacts.ts`](../../scripts/ghostflow/validate-artifacts.ts)).
- Per-card `freshnessStatus` and `dataQuality` appear on equity signal cards ([`GhostFlowSignalGrid.tsx`](../../components/ghostflow/GhostFlowSignalGrid.tsx)).

### Gaps / inconsistencies

1. **Freshness summary rollup under-reports** — [`freshnessSummary.ts`](../../lib/ghostflow/freshnessSummary.ts) aggregates only vol-regime/breadth (daily), etf-flow (weekly), and monthly ICI/SSGA trio. It does **not** roll up options, CFTC systematic, levered ETF, retirement, or Treasury. Not changed in v1.8c; possible **v1.8f** UI follow-up.

2. **Treasury has no structured freshness bands** — Treasury cards show `asOf`, `publishedAt`, and `dataQuality` but no caution/stale semantics. Future Treasury freshness policy requires separate approval.

3. **Manual refresh checklist had stale CFTC wording** — “not scored yet” on weekly group line — **fixed in v1.8c** docs.

4. **Retirement production JSON stale metadata** — `source.note` and caveats still say “not yet displayed” though v1.2d shipped the card. **Not changed in v1.8c** — listed as **v1.8c.1** metadata-only candidate.

5. **`GHOSTFLOW_REFERENCE_AS_OF` governs equity freshness** — Treasury artifacts may have later `asOf` (e.g. 2026-06-02) because the Treasury lane is separate.

6. **JSON `signalId` vs card id** — systematic, levered, retirement artifacts use different JSON ids than dashboard card ids (see mapping table above). Document only.

---

## Decisions

1. **v1.8c documents** freshness and `dataQuality` policy only — this memo is canonical.
2. **No `dataQuality` label changes** in production JSON.
3. **No production JSON metadata or observation value changes** in v1.8c.
4. **No freshness evaluator or summary code changes** in v1.8c.
5. **No UI changes** in v1.8c.
6. **No score gates opened**; `publicSignalCount` remains **10**.

---

## Deferred follow-ups

| Phase | Scope |
|-------|--------|
| ~~**v1.8d**~~ | ~~Operator Refresh Discipline~~ — **Done** — [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md); taxonomy, cadence map, validation matrix; checklist tightened; docs-only |
| **v1.8c.1** | Optional metadata-only cleanup — retirement stale “not yet displayed” note/caveats; possible options `dataQuality` promotion **only** if operator verification policy satisfied; requires `ghostflow:check` + tests if JSON changes **approved separately** |
| **v1.8f** | UI / freshness summary clarity — whether to include options/CFTC/levered/retirement in rollup; whether Treasury needs bands |

---

## No-score-change confirmation

| Check | v1.8c result |
|-------|--------------|
| Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| `publicSignalCount` | **10** (equity) |
| Treasury Plumbing | **2** separate display-only cards |
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| [`signalPresentation.ts`](../../lib/ghostflow/signalPresentation.ts) | Unchanged |
| [`artifactFreshness.ts`](../../lib/ghostflow/artifactFreshness.ts) | Unchanged |
| [`freshnessSummary.ts`](../../lib/ghostflow/freshnessSummary.ts) | Unchanged |
| Production artifact JSON | Unchanged |
| UI / `package.json` | Unchanged |
| GhostRegime | Out of scope |
