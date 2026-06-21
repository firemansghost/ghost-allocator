# MOCK Score No-Change Policy — GhostFlow v1.10e

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Mock retirement roadmap](./MOCK_SCORE_RETIREMENT_ROADMAP.md) · [Score reproduction baseline](./SCORE_REPRODUCTION_BASELINE.md) · [Score-impact scenarios](./MOCK_SCORE_IMPACT_SCENARIOS.md) · [Roadmap](./DATA_ROADMAP.md)

**Related mapping decisions (unchanged):** [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) · [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md)

This memo is the **v1.10e final policy decision** that closes the v1.10 score-integrity sequence. It formally selects **Option A: keep current scoring model and disclosure**. It does **not** change scoring, artifacts, UI, runtime, tests, or package configuration.

---

## Status

| Item | v1.10e posture |
|------|----------------|
| Document type | **Final no-score-change policy decision** |
| Scope | **Docs-only** |
| Scoring change | **None** |
| Artifact change | **None** |
| UI change | **None** |
| Runtime change | **None** |
| Test change | **None** |
| Package change | **None** |

---

## Decision

**Option A selected:** keep current scoring model and disclosure.

| Item | v1.10e decision |
|------|-----------------|
| Scoring model | **Unchanged** |
| Score gates opened | **None** |
| Display-only artifacts wired into score | **No** |
| MOCK inputs retired | **No** |
| MOCK inputs neutralized | **No** |
| Passive reweighting | **No** |
| v1.8i Passive rewrite started | **No** |
| **Current headline scores** | Passive **58** · Structural **66** · Composite **62** — **unchanged** |

Three MOCK Passive inputs remain:

| Input key | Value |
|-----------|-------|
| `systematicStrategyPressure` | **62** |
| `retirementFlowPressureProxy` | **58** |
| `leveredEtfRebalancePressure` | **55** |

Related public artifact cards (`systematic-flow`, `retirement-asset-growth`, `levered-etf-rebalance`, and other display-only lanes) remain **display-only**.

Individual score gates **v1.0c / v1.1f / v1.2f** and broader gate **v1.8i** remain **closed**.

---

## Evidence chain

The v1.10 score-integrity sequence is complete:

| Phase | Outcome |
|-------|---------|
| **v1.9d** | [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) — **12** equity public signals (**6** score-fed + **6** display-only); Treasury **2** cards separate |
| **v1.10** | [Mock Score Retirement Roadmap](./MOCK_SCORE_RETIREMENT_ROADMAP.md) — three remaining MOCK Passive inputs documented; gates not approved |
| **v1.10a** | UI disclosure cleanup — dashboard copy explicit (6 display-only, MOCK **62/58/55**, Treasury separate) |
| **v1.10b** | Coverage-copy test wired into `test:ghostflow` / `ghostflow:check` — guards stale disclosure copy |
| **v1.10c** | [Score reproduction baseline](./SCORE_REPRODUCTION_BASELINE.md) — production math reproduced at **58 / 66 / 62** |
| **v1.10d** | [Score-impact scenarios](./MOCK_SCORE_IMPACT_SCENARIOS.md) — sane retirement/reweight paths do not justify rushing model surgery; zeroing mocks invalid |
| **v1.10e** | **This memo** — formal no-score-change policy; sequence closed |

---

## Current scoring state

| Item | Value |
|------|--------|
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **Composite** | **62** |
| **Band** | *Crowded / Reflexive* |
| **`publicSignalCount`** | **12** (equity) |
| **Score-fed equity/public artifacts** | **6** |
| **Display-only equity/public artifacts** | **6** |
| **Treasury lane** | **2** separate display-only cards — not counted in equity `publicSignalCount` |

**Passive formula** ([`scoring.ts`](../../lib/ghostflow/scoring.ts)):

```
round(0.25·ETF + 0.20·systematic + 0.20·vol + 0.20·retirement + 0.15·levered)
```

**Public Passive score inputs (production merged, reference `2026-05-22`):**

| Input | Value |
|-------|-------|
| `etfFundFlowImpulse` | **75** |
| `optionsVolatilityAmplifier` | **34** |

**MOCK Passive score inputs (static):**

| Input | Value |
|-------|-------|
| `systematicStrategyPressure` | **62** |
| `retirementFlowPressureProxy` | **58** |
| `leveredEtfRebalancePressure` | **55** |

**Structural baseline:** **100% public-fed** at v1.10c baseline.

**Display-only firewall:** Display-only cards refresh dashboard context only — they do **not** score. See [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md) and [MOCK_SCORE_IMPACT_SCENARIOS.md](./MOCK_SCORE_IMPACT_SCENARIOS.md).

---

## Rationale

1. **Disclosure is now explicit** in docs (v1.9d–v1.10) and UI (v1.10a) — users can see score-fed vs display-only vs MOCK lanes.
2. **v1.10b** guards against stale disclosure copy via `ghostflowCoverageCopy.test.ts` in the test harness.
3. **v1.10c** proved the production score baseline is reproducible from code and artifacts (**58 / 66 / 62**).
4. **v1.10d** showed sane retirement/reweight scenarios barely move Composite at baseline; Structural **66** anchors half the Research Composite.
5. **Zeroing MOCKs** (Scenario E) is invalid and damaging — Composite would fall to **46**; not a product path.
6. **Neutral placeholders** (Scenario F) still require a product/model decision and move the band — stress case only.
7. **Display-only artifacts** were already rejected or deferred for scoring by mapping decisions (CFTC v1.0b, levered v1.1e, retirement v1.2e).
8. **Best product posture:** transparency plus gated future changes — not rushed model surgery.

---

## Policy statement

GhostFlow adopts a **no-score-change policy** effective v1.10e. The Research Composite remains **62 / 58 / 66** with three MOCK Passive inputs (**62 / 58 / 55**) and six display-only public artifact cards that refresh dashboard context only. Score-integrity documentation is complete; implementation of mock retirement, reweighting, or display-to-score wiring requires a **new explicit product gate** with full score-impact evidence.

**Until explicitly product-approved:**

- Do **not** change MOCK Passive score values
- Do **not** wire display-only artifacts into score
- Do **not** add `publicPassiveInputKey` for display-only lanes
- Do **not** retire a score input
- Do **not** reweight Passive Pressure
- Do **not** start v1.8i implementation
- Do **not** change headline Composite / Passive / Structural values

---

## Gate status table

| Gate | Status | Notes |
|------|--------|-------|
| **v1.0c** (systematic / CFTC) | **Closed / not approved** | Display-only per [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) |
| **v1.1f** (levered ETF) | **Closed / not approved** | Display-only per [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) |
| **v1.2f** (retirement) | **Closed / discouraged** | Display-only per [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) |
| **v1.8i** (Passive rewrite/reweight) | **Future only / not approved** | Broader model change — separate product gate |
| **v1.10d scenarios** | **Research only** | No implementation authorized |

---

## Future reopening criteria

A future score change requires **all** of the following:

1. **Explicit product approval** — new gate opened; v1.10e policy superseded by signed decision
2. **Updated mapping decision** — if applicable (CFTC, levered, retirement, or other lane)
3. **Score-impact table** — against [v1.10c baseline](./SCORE_REPRODUCTION_BASELINE.md) (**58 / 66 / 62**)
4. **Methodology updates** — scoring contract, caveats, and operator docs
5. **UI disclosure updates** — badges, ScoreCard, Methodology, trust copy
6. **Tests** — `npm run test:ghostflow` minimum; new assertions for changed inputs/scores
7. **Validation** — `npm run lint`, `npm run test:ghostflow`, `npm run build`
8. **Display-only firewall** — confirm no display-card value substitutes for a score input unless mapping decision revised and explicitly approved

---

## Recommended next priority

| Item | Recommendation |
|------|----------------|
| Score-integrity work | **Complete through v1.10e** — v1.10 sequence closed |
| Immediate next step | **Pause score-integrity work** |
| GhostFlow backlog | **Product-owner selected** priority from [DATA_ROADMAP.md](./DATA_ROADMAP.md) |
| v1.8i | **Plan Mode only** if product explicitly requests Passive pillar redesign — not started by v1.10e |

---

## No-change confirmation

| Item | v1.10e confirmation |
|------|---------------------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | **Unchanged** |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | **Unchanged** |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | **Unchanged** |
| Production artifact JSON | **Unchanged** |
| UI components | **Unchanged** |
| Tests | **Unchanged** |
| `package.json` | **Unchanged** |
| **Passive Pressure** | **58** — unchanged |
| **Structural Fragility** | **66** — unchanged |
| **Composite** | **62** — unchanged |
| **`publicSignalCount`** | **12** (equity) — unchanged |
| GhostRegime / Marketstack / GhostYield / Models / builder | **Out of scope — untouched** |

No score changes without explicit product approval.
