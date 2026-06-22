# GhostFlow Public Signal Integrity Checkpoint — v1.12

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [Roadmap](./DATA_ROADMAP.md)

**Status:** v1.12 integrity checkpoint — **docs + UI-copy cleanup only**; no score, artifact, runtime, or buildSnapshot changes.

This memo records the post–Tail Skew audit that aligns canonical docs and dashboard copy with the live equity public signal inventory after **v1.9e.4** (production card) and **v1.9e.5** (mapping decision).

---

## Status

| Item | v1.12 posture |
|------|----------------|
| Document type | **Integrity checkpoint / audit record** |
| Code changes | **None** (UI copy only where stale counts appeared) |
| Artifact JSON changes | **None** |
| Scoring changes | **None** |
| Runtime / live fetch | **None** |
| Score gates opened | **None** |

---

## Current canonical count table

| Layer | Count | Notes |
|-------|-------|--------|
| **Equity `publicSignalCount`** | **13** | All production equity public cards in `meta.publicSignals` when JSON validates |
| **Score-fed equity/public** | **6** | vol-regime, etf-flow, passive-share, active-index-flow, concentration, breadth |
| **Display-only equity/public** | **7** | systematic-flow, levered-etf-rebalance, retirement-asset-growth, options-activity-proxy, index-inclusion-events, cap-weight-premium, **tail-skew-context** |
| **Treasury lane** | **2** display-only cards | Separate — **not** in equity `publicSignalCount` |
| **Production JSON total** | **15** | 13 equity + 2 Treasury — validated by `npm run ghostflow:check` |
| **Derived context card** | `distance-65` | Not counted in `publicSignalCount` |

**Counting rule:** Do **not** combine equity **13** + Treasury **2** into 15 for `publicSignalCount`.

---

## Tail Skew status

| Item | Value |
|------|--------|
| **Shipped** | **v1.9e.4** — [`tailSkewContext.v1.json`](../data/ghostflow/artifacts/tailSkewContext.v1.json) + display-only card `tail-skew-context` |
| **Mapping decision** | **v1.9e.5 Done** — [TAIL_SKEW_MAPPING_DECISION.md](./TAIL_SKEW_MAPPING_DECISION.md); Option A display-only |
| **Lane** | **Display-only** — badge `DISPLAY ONLY` |
| **`publicPassiveInputKey`** | **None** |
| **Score contribution** | **None** — VIX (`vol-regime`) remains score-fed vol input |
| **`mappingStatus`** | **`not_final`** |
| **v1.9e.6 score gate** | **Discouraged / not approved** |

---

## Score confirmation

| Item | Value |
|------|--------|
| **Composite** | **62** |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Band** | *Crowded / Reflexive* |
| **`GHOSTFLOW_REFERENCE_AS_OF`** | **2026-05-22** |

Tail Skew display-only refresh does **not** affect these scores.

---

## Score-gate confirmation

| Gate | Status |
|------|--------|
| **v1.9e.6** (Tail Skew score wiring) | **Discouraged / not approved** |
| **v1.10e no-score-change policy** | **Active** — [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) |
| **All other display-only gates** | **Closed** — v1.0c, v1.1f, v1.2f, v1.4f, v1.7g, v1.8i, v1.9b.6, v1.9c.6 |

---

## v1.12 cleanup scope

Aligned stale **12 / six display-only** language in:

- [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) checkpoint header
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) current dashboard snapshot block
- [README.md](./README.md) onboarding, display-only table, guardrails
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) · [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md)
- [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) · [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md)
- [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) — v1.12 footnote only (v1.10e body preserved)
- [PROTECTION_BID_SOURCE_SPIKE.md](./PROTECTION_BID_SOURCE_SPIKE.md) · [TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md)
- UI copy: [`app/ghostflow/page.tsx`](../../app/ghostflow/page.tsx), [`GhostFlowWatchlist.tsx`](../../components/ghostflow/GhostFlowWatchlist.tsx), [`GhostFlowMethodology.tsx`](../../components/ghostflow/GhostFlowMethodology.tsx)

Historical phase rows and mapping-decision bodies at prior counts were **preserved** where they accurately describe decision-time state.

---

## No-change confirmation

| Area | Status |
|------|--------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| [`reference.ts`](../../lib/ghostflow/reference.ts) | Unchanged |
| Production artifact JSON | Unchanged |
| Artifact validators | Unchanged |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | Unchanged |
| Tests | Unchanged unless copy-test failure (none expected) |
| `package.json` | Unchanged |
| GhostRegime / Marketstack / GhostYield / Models / builder | Untouched |

**Headline scores unchanged:** Composite **62** · Passive **58** · Structural **66** · equity `publicSignalCount` **13** · Treasury **2** · MOCK **62 / 58 / 55**.
