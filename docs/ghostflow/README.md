# GhostFlow Documentation

Entrypoint for GhostFlow docs under `docs/ghostflow/`. For live dashboard inventory and scores, see [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md).

---

## Current canonical snapshot

| Item | Value |
|------|--------|
| **Composite** | **62** |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Band** | *Crowded / Reflexive* |
| **Equity `publicSignalCount`** | **13** |
| **Treasury Plumbing** | **2** separate display-only cards |

Treasury is **outside** the equity Research Composite, `buildSnapshot`, `raw.signals`, `meta.publicSignals`, [`PUBLIC_ARTIFACT_SIGNAL_IDS`](../../lib/ghostflow/signalPresentation.ts), and `publicSignalCount`. Do **not** combine equity **13** + Treasury **2** into 15.

Three **MOCK** passive score inputs (`systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55**) remain unchanged unless a separate product-approved score gate opens.

---

## Start here

Read in this order for onboarding:

1. **[DATA_ROADMAP.md](./DATA_ROADMAP.md)** — Living phase ladder, promotion taxonomy, and open questions. Use for *why* a phase shipped and what gates remain closed.
2. **[GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md)** — Canonical inventory: score-fed vs display-only vs MOCK vs derived vs Treasury lanes, counts, and guardrails.
3. **[GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md)** — canonical **13-signal** table: card ids, artifact `signalId`s, lanes, score boundaries, and Treasury separation.
4. **[OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md)** — Canonical operator workflow: taxonomy, cadence map, validation matrix, and refresh guardrails.
5. **[MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md)** — Field-level quick reference: per-artifact tables, cadence mini-checklists, and validation commands.
6. **[GHOSTFLOW_V115_REFRESH_CHECKPOINT.md](./GHOSTFLOW_V115_REFRESH_CHECKPOINT.md)** — v1.15 refresh record (authoritative score state through 2026-07-01).
7. **[GHOSTFLOW_BLOCKER_SOURCE_STRATEGY.md](./GHOSTFLOW_BLOCKER_SOURCE_STRATEGY.md)** — Open blocker source policy: canonical paths, Marketstack helper roles, request budget.

---

## Trust and data quality

| Doc | Purpose |
|-----|---------|
| [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) | Freshness thresholds, `dataQuality` label policy, and production artifact inventory |
| [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) | v1.8b keep-MOCK policy decision for three passive score inputs |
| [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md) | **v1.10** operational retirement roadmap — requirements, decision ladder, gate table; no score wiring approved |
| [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) | **v1.10e** final no-score-change policy — Option A selected; v1.10 score-integrity sequence closed |

No score wiring without an explicit product gate (**v1.0c**, **v1.1f**, **v1.2f**, **v1.4f**, **v1.7g**, **v1.8i** — all discouraged / not approved).

---

## Score-fed artifacts

These **six** equity/public artifacts merge into the Research Composite via `buildSnapshot` and **can affect** Composite / Passive / Structural when refreshed.

| `signalId` | Runbook |
|------------|---------|
| `vol-regime` | [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (CBOE VIX) |
| `breadth` | [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) |
| `etf-flow` | [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) |
| `active-index-flow` | [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) |
| `passive-share` | [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) |
| `concentration` | [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) |

**Derived context:** `modelZoneProximity` (score) and `distance-65` (card) follow `passive-share` — do not refresh separately.

---

## Display-only equity artifacts

These **seven** production artifacts refresh **display cards only**. They do **not** replace MOCK score inputs. `mappingStatus` remains **`not_final`** unless separately approved. Display-only does **not** mean low quality.

| Card `signalId` | Design | Mapping decision |
|-----------------|--------|------------------|
| `systematic-flow` | [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) | [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) |
| `levered-etf-rebalance` | [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) | [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) |
| `retirement-asset-growth` | [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) | [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) |
| `options-activity-proxy` | [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) | [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) |
| `index-inclusion-events` | [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) | [INDEX_INCLUSION_EVENT_MAPPING_DECISION.md](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md) — display-only by default |
| `cap-weight-premium` | [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) | [CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) — display-only by default |
| `tail-skew-context` | [TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md) | [TAIL_SKEW_MAPPING_DECISION.md](./TAIL_SKEW_MAPPING_DECISION.md) — display-only; VIX remains score-fed vol input |

---

## Treasury Plumbing

Separate **display-only** dashboard lane — **not** in equity `publicSignalCount` or Research Composite.

| Doc | Role |
|-----|------|
| [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) | Feasibility + v1.7 release checkpoint |
| [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) | `treasury-futures-positioning-proxy` — public CFTC proxy only; **not** full basis-trade measurement |
| [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md) | `treasury-long-end-income-lens` — **not** investment advice, bond-buying, or duration-allocation advice |
| [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) | v1.7f display-only mapping lock |

Operator refresh: [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) §9–10 · [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) class C.

**v1.7g** Treasury score gate — **not approved**, discouraged.

---

## Historical research / decision records

These memos preserve feasibility, calibration, and mapping history. They may contain phase-specific language from when features were planned or in flight.

**Current state is governed by** [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md). **Do not** treat historical feasibility or design docs as score-wiring approval.

### Feasibility memos

- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) (v0.9c)
- [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) (v1.1a)
- [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) (v1.2a)
- [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) (v1.4a — superseded placeholder path; see banner)
- [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) (v1.7a)

### Calibration studies (research-only)

- [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md)
- [LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md](./LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md)
- [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md)
- [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) (v1.9b.1a)

### Mapping decisions

- [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md)
- [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md)
- [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md)
- [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md)
- [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md)

### Education / copy

- [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md) (v1.6a)
- [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) (v1.6b)

---

## Future research backlog

| Doc | Purpose |
|-----|---------|
| [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) | **v1.9a** Mike Green–inspired research queue |
| [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) | **v1.9b** SPY vs RSP feasibility — YELLOW leaning GREEN |
| [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) | **v1.9b.1a** real operator calibration — ratio 98.8th pctile; 5Y spread +39.51% |
| [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) | **v1.9b.2** display-only artifact design · **v1.9b.3** example JSON + validator scaffolding |
| [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) | **v1.9c** passive supply / float absorption — YELLOW leaning RED |
| [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) | **v1.9c.1** source spike — Lane D event path partially locked |
| [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) | **v1.9c.2** index inclusion event proxy design · **v1.9c.3** example JSON + validator · **v1.9c.4** production artifact + display card · **v1.9c.5** [mapping decision](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md) |

Topics parked for later evaluation (no score wiring, artifacts, UI cards, or `publicSignalCount` changes approved):

- **Cap-weight concentration premium** — [v1.9b feasibility](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) + [v1.9b.1a calibration](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) + [v1.9b.2–b.4 artifact design](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) + [v1.9b.5 mapping decision](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md); production artifact [`capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json) (reference-aligned **2026-05-22** study); display-only by default; v1.9b.6 score gate discouraged
- **Passive supply / float absorption** — [v1.9c feasibility](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) + [v1.9c.1 source spike](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) + [v1.9c.2–c.4 artifact](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) + [v1.9c.5 mapping](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md); display-only by default; v1.9c.6 score gate discouraged
- **Systematic re-risking** — long-term path beyond MOCK **62** and CFTC display proxy
- **Protection bid / correlation dispersion** — skew, implied correlation, single-stock vs index vol
- **Mega-cap autocorrelation / flow momentum** — own-price continuation in flow-fed names
- **Valuation stress context** — individual-security CAPE-style work; likely outside composite
- **Credit catalyst / AI financing stress** — outside GhostFlow; possible GhostRegime / GhostYield / separate lane

---

## Guardrails

- **`publicSignalCount` is 13** (equity only) — do not promote display-only or Treasury artifacts into score inputs.
- **Treasury remains separate** — 2-card display-only lane outside composite.
- **Score gates not approved:** v1.0c (CFTC), v1.1f (levered ETF), v1.2f (retirement), v1.4f (options), v1.7g (Treasury), v1.8i (general), v1.9b.6 (cap-weight premium), v1.9c.6 (index inclusion), **v1.9e.6** (Tail Skew).
- **MOCK 62 / 58 / 55** unchanged per [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md).
- **Routine refresh** must not touch `scoring.ts`, `buildSnapshot.ts`, `mockGhostflowSnapshot.ts`, or open score gates — see [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md).
- **GhostRegime** is a separate product lane — out of GhostFlow scope.

---

## Production artifacts (15 total)

All validated by `npm run ghostflow:check`:

- **6** score-fed equity JSON files
- **7** display-only equity JSON files
- **2** Treasury lane JSON files

See [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) for file paths and lane tables · [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) for the canonical **13-signal** inventory table.
