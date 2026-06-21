# Mock Score Retirement / Score Integrity Roadmap — GhostFlow v1.10

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [Roadmap](./DATA_ROADMAP.md)

**Related:** [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) (v1.8b policy decision) · [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md) (v1.10c canonical production baseline) · [MOCK_SCORE_IMPACT_SCENARIOS.md](./MOCK_SCORE_IMPACT_SCENARIOS.md) (v1.10d score-impact scenario study) · [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) (v1.10e no-score-change policy — **v1.10 sequence closed**) · [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) · [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md)

This memo is the **v1.10 operational retirement roadmap** for the three remaining MOCK passive score inputs. It does **not** execute retirement, replacement, reweighting, or score wiring. GhostRegime, GhostYield, Models, and builder are out of scope.

---

## Status

| Item | v1.10 posture |
|------|---------------|
| Document type | **Score integrity / mock retirement roadmap** |
| Scope | **Docs-only** |
| Runtime change | **None** |
| Scoring change | **None** |
| Artifact change | **None** |
| UI change | **None** |
| Test change | **None** |
| **Composite** | **62** — unchanged |
| **Passive Pressure** | **58** — unchanged |
| **Structural Fragility** | **66** — unchanged |
| **`publicSignalCount`** | **12** (equity) — unchanged |

---

## Current passive score input inventory

Passive Pressure is computed in [`scoring.ts`](../../lib/ghostflow/scoring.ts):

```
Passive = 0.25·ETF + 0.20·systematic + 0.20·vol + 0.20·retirement + 0.15·levered
```

**Composite:** `50% Passive + 50% Structural`

[`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) clones [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) then overwrites score slots from validated production artifacts. Only **two** passive keys receive `publicPassiveInputKey` from artifacts today (`etfFundFlowImpulse`, `optionsVolatilityAmplifier`).

**v1.10c baseline:** Canonical **production merged score-input values** (reference `2026-05-22`) are in [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md). The **mock default** column below is the static fallback in `mockGhostflowSnapshot.ts` — **not** the production baseline for public score-fed keys when artifacts validate.

| Input key | Mock default | Production baseline (v1.10c) | Passive weight | Composite weight | Source type | Related card / artifact | `publicPassiveInputKey` | Mapping status | Replacement readiness | Known caveats |
|-----------|--------------|------------------------------|----------------|------------------|-------------|-------------------------|-------------------------|----------------|----------------------|---------------|
| `etfFundFlowImpulse` | **64** | **75** | **25%** | **12.5%** | Public score-fed | `etf-flow` — `etfNetIssuance.v1.json` | **Yes** | Production / scored | **Ready** | ICI weekly estimated net issuance (**33,919** $M → proxy **75**) |
| `systematicStrategyPressure` | **62** | **62** | **20%** | **10%** | **MOCK / static** | `systematic-flow` — `systematicFlowProxy.v1.json` | **No** | [v1.0b display-only](CFTC_TFF_MAPPING_DECISION.md) | **Low** — v1.0c gated | CFTC futures positioning ≠ systematic strategy; Mapping A card score (e.g. 93) ≠ MOCK 62; moderate VIX/ETF narrative overlap |
| `optionsVolatilityAmplifier` | **70** | **34** | **20%** | **10%** | Public score-fed | `vol-regime` — `volatilityRegime.v1.json` (scored) | **Yes** | Production / scored | **Ready** | VIX **16.7** → proxy **34**; `options-activity-proxy` is **separate display-only** ([v1.4e](OPTIONS_ACTIVITY_MAPPING_DECISION.md)) |
| `retirementFlowPressureProxy` | **58** | **58** | **20%** | **10%** | **MOCK / static** | `retirement-asset-growth` — `retirementFlowPressureProxy.v1.json` | **No** | [v1.2e display-only](RETIREMENT_FLOW_MAPPING_DECISION.md); `not_final` | **Very low** — v1.2f discouraged | Asset growth ≠ retirement-flow pressure; quarterly cadence; **high ICI overlap** with scored etf/passive-share/active-index-flow |
| `leveredEtfRebalancePressure` | **55** | **55** | **15%** | **7.5%** | **MOCK / static** | `levered-etf-rebalance` — `leveredEtfRebalancePressure.v1.json` | **No** | [v1.1e display-only](LEVERED_ETF_REBALANCE_MAPPING_DECISION.md); `not_final` | **Low–medium** — v1.1f gated | Fixed-current-AUM estimate; `manual_unverified`; not true historical AUM calibration |

**MOCK burden:** three static inputs = **55% of Passive Pressure** (20% + 20% + 15%) and **27.5% of Composite** (half of 55%).

---

## Why three MOCK inputs remain

1. **[v1.8b](MOCK_SCORE_RETIREMENT_PLAN.md) kept static assumptions** because score replacement was not ready — calibration, semantic alignment, and product gates were incomplete.
2. **Public display artifacts now exist** for systematic (`systematic-flow`), retirement (`retirement-asset-growth`), and levered ETF (`levered-etf-rebalance`).
3. **Those artifacts remain display-only** by prior mapping decisions (v1.0b, v1.1e, v1.2e) — not score wiring reversals.
4. **Display-only artifacts are not score replacements** — [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) does not set `publicPassiveInputKey` for them; card refresh updates dashboard context only.
5. **The Research Composite still depends on static assumptions** in [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) for those three slots until a future gated phase explicitly approves replacement, reweighting, or retirement.

Equity `publicSignalCount` **12** counts public signal **cards** — it does **not** mean all public cards feed the score. See [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md).

---

## Per-mock retirement requirements

### `systematicStrategyPressure`

| Item | Detail |
|------|--------|
| **Current value** | Static **62** in `mockGhostflowSnapshot.ts` |
| **Related public artifact** | `systematic-flow` — CFTC TFF leveraged-funds equity-index basket |
| **Why not score-fed now** | [v1.0b](CFTC_TFF_MAPPING_DECISION.md): futures positioning ≠ "systematic strategy pressure"; Mapping A too aggressive for score; card `basketScore` can diverge sharply from MOCK 62 |
| **Future gate** | **v1.0c** — not approved |

**Requirements before retirement/replacement:**

- Semantic **rename** (e.g. CFTC leveraged-funds positioning proxy — not "systematic strategy")
- **Mapping C** or revised mapper (`min(80, basketScore)` per v1.0b) — not Mapping A wire
- [Calibration review](CFTC_TFF_CALIBRATION_STUDY.md) (v1.0a evidence)
- **Score-impact study** — Passive / Composite / band before-after
- [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) merge + `publicPassiveInputKey: 'systematicStrategyPressure'` (or renamed key with product approval)
- Methodology, UI disclosure, and test updates
- Explicit **product approval** for v1.0c
- MOCK fallback policy on artifact failure

### `retirementFlowPressureProxy`

| Item | Detail |
|------|--------|
| **Current value** | Static **58** in `mockGhostflowSnapshot.ts` |
| **Related public artifact** | `retirement-asset-growth` — ICI Retirement Market Table 1 quarterly assets |
| **Why not score-fed now** | [v1.2e](RETIREMENT_FLOW_MAPPING_DECISION.md): **asset growth is not retirement-flow pressure**; quarterly cadence unsuitable for weekly composite without lag policy; QoQ/YoY mappers disagree |
| **ICI overlap risk** | **High** — same ecosystem as scored `etf-flow`, `passive-share`, `active-index-flow` |
| **Future gate** | **v1.2f** — discouraged / not approved |

**Requirements before retirement/replacement:**

- True **flow semantics** or a different source — current artifact unlikely to justify 20% passive weight as-is
- ICI **overlap review** mandatory
- Rename + semantic review if ever reconsidered
- Score-impact study; **retire/remove/reweight** may be more plausible than wiring current artifact ([v1.8i](DATA_ROADMAP.md) broader rewrite)
- Product approval; methodology/UI/tests

### `leveredEtfRebalancePressure`

| Item | Detail |
|------|--------|
| **Current value** | Static **55** in `mockGhostflowSnapshot.ts` |
| **Related public artifact** | `levered-etf-rebalance` — Tier-1 six-ticker fixed-current-AUM estimate |
| **Why not score-fed now** | [v1.1e](LEVERED_ETF_REBALANCE_MAPPING_DECISION.md): return-sensitivity on fixed AUM; `manual_unverified`; not historical AUM-calibrated score source |
| **Future gate** | **v1.1f** — not approved |

**Requirements before retirement/replacement:**

- **True AUM history** or defended capped/percentile mapper ([v1.1e-calibration](LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md))
- Overlap review (lower direct risk than retirement slot)
- Score-impact study
- `buildSnapshot` merge + `publicPassiveInputKey`
- Product approval for v1.1f; methodology/UI/tests

---

## Decision options

| Option | Description | Risk | Score change | v1.10 |
|--------|-------------|------|--------------|-------|
| **A — Disclosure cleanup** | Stronger UI/docs that three passive slots are static assumptions | Low | No | **Done (v1.10a)** — trust badges, ScoreCard, Methodology, Dashboard/ScoreDrivers copy |
| **B — Roadmap memo** | Formal retirement ladder and gate requirements | Low | No | **Selected for v1.10** |
| **C — Remove/reweight mocks** | Change Passive formula weights or drop slots | **High** | Yes | Requires product approval + score impact study — **not approved** |
| **D — Wire display artifacts into score** | Promote CFTC/retirement/levered into composite | **High** | Yes | Reverses or bypasses prior mapping decisions — **not approved** |
| **E — Split Passive pillar** | Measured vs assumption-fed sub-components | Medium–high | Possible | Larger product/model redesign — **future idea only** |

**v1.10 selection:** **Option B — Roadmap memo.**

---

## Decision ladder

No gate may be skipped. Required order for any mock retirement, replacement, or reweight:

| Step | Gate | v1.10 status |
|------|------|---------------|
| 1 | **Disclosure** — users/operators understand MOCK vs public vs display-only | **Done (v1.10a)** — trust badges, ScoreCard, Methodology, Dashboard/ScoreDrivers |
| 2 | **Research / calibration** — existing studies cited per input | CFTC v1.0a, levered v1.1e-calibration, retirement v1.2e |
| 3 | **Mapping decision revision** — update or supersede v1.0b / v1.1e / v1.2e only with new evidence | **Not opened** |
| 4 | **Product approval** — explicit gate (v1.0c / v1.1f / v1.2f / v1.8i) | **Not approved** |
| 5 | **Score-impact study** — before/after Passive, Structural, Composite, band | **Required** before any implementation |
| 6 | **Implementation** — `scoring.ts`, `buildSnapshot.ts`, mock snapshot as needed | **Deferred** |
| 7 | **Tests / methodology / UI updates** — lock new behavior and disclosure | **Deferred** |

---

## Future gate table

| Gate | Scope | Status (v1.10) | Notes |
|------|--------|----------------|-------|
| **v1.0c** | Systematic / CFTC score wiring | **Not approved** | Mapping C + rename; reject Mapping A score wire |
| **v1.1f** | Levered ETF score wiring | **Not approved** | After v1.1e-calibration; true AUM or defended mapper |
| **v1.2f** | Retirement score wiring | **Discouraged / not approved** | Current artifact poor fit; retire/reweight may beat wire |
| **v1.8i** | Score model rewrite / reweighting | **Future only** | May retire mocks instead of replace; full methodology pass |

Gates **v1.4f** (options), **v1.7g** (Treasury), **v1.9b.6** (cap-weight), **v1.9c.6** (index inclusion) remain separate and **not approved** — they do not address the three passive MOCK slots.

---

## Score-model surgery risk

| Risk | Detail |
|------|--------|
| Passive formula change | Removing or reweighting any MOCK input changes **Passive Pressure** |
| Composite propagation | Passive is **50%** of Composite — Passive deltas flow to headline score |
| MOCK concentration | Three mocks = **55%** of Passive, **27.5%** of Composite |
| Reproducibility | Current reference scores (**62 / 58 / 66**) must be reproducible before any change |
| Required analysis | Before/after score deltas; alternate weight tables if retiring a slot; band label changes |
| User-facing impact | Methodology, score card copy, inventory memo, operator docs must update together |
| Tests | [`scoring.test.ts`](../../lib/ghostflow/__tests__/scoring.test.ts), [`ghostflowCurrentState.test.ts`](../../lib/ghostflow/__tests__/ghostflowCurrentState.test.ts), and display tests must lock new behavior |

Any score-model surgery requires explicit product approval — not authorized by v1.10.

---

## Relationship to v1.8b

| Memo | Role |
|------|------|
| **[MOCK_SCORE_RETIREMENT_PLAN.md](MOCK_SCORE_RETIREMENT_PLAN.md) (v1.8b)** | Historical **policy decision** — keep all three mocks; reject replacements; gates discouraged |
| **This roadmap (v1.10)** | **Operational follow-up** — retirement requirements, decision ladder, gate table, score-impact prerequisites |

v1.10 **supersedes stale counts** in v1.8b (e.g. `publicSignalCount` **10**) via cross-link and footnote — **not** by rewriting the v1.8b body. Current equity count is **12** per [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) (v1.9d).

---

## v1.10a UI disclosure cleanup (Done)

**Status:** UI copy-only — **no score, artifact, or runtime change.**

| Area | v1.10a change |
|------|---------------|
| Trust badges | `4` → `6` display-only public artifacts |
| ScoreCard | Mixed disclaimer lists all six display-only cards + MOCK 62/58/55 |
| Methodology | Passive weight list marks PUBLIC vs MOCK inline |
| Dashboard scope | 12 equity public signals (6+6); Treasury separate |
| ScoreDrivers | Footer states all six display-only cards do not feed score |

Composite **62** / Passive **58** / Structural **66** and `publicSignalCount` **12** unchanged.

---

## Optional future v1.10a

**Superseded by v1.10a Done above.** Remaining optional polish (if any): semantic label drift between score sub-input names and display card titles — not required for v1.10a closure.

---

## No-change confirmation (v1.10)

| Check | Result |
|-------|--------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | Unchanged |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | Unchanged |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | Unchanged |
| Production artifact JSON | Unchanged |
| `components/ghostflow/*` | Unchanged |
| Tests | Unchanged |
| **Composite** | **62** |
| **Passive Pressure** | **58** |
| **Structural Fragility** | **66** |
| **`publicSignalCount`** | **12** (equity) |
| Score gates opened | **None** |
| GhostRegime / Marketstack / GhostYield / Models / builder | Out of scope |

---

## Next recommended phases

| Phase | Scope | Status |
|-------|--------|--------|
| **v1.10** | This roadmap memo + doc cross-links | **Done** (docs-only) |
| **v1.10a** | UI disclosure cleanup | **Done** — copy-only; see roadmap § v1.10a |
| **v1.10b** | Coverage-copy test harness | **Done** — `ghostflowCoverageCopy.test.ts` in `test:ghostflow` / `ghostflow:check` |
| **v1.10c** | Score reproduction baseline / mock contribution audit | **Done** — [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md); docs-only; no blocker |
| **v1.10d** | Mock retirement score-impact scenario study | **Done** — [MOCK_SCORE_IMPACT_SCENARIOS.md](./MOCK_SCORE_IMPACT_SCENARIOS.md); docs/research-only; v1.10c prerequisite satisfied; gates unchanged |
| **v1.10e** | MOCK score no-change policy / disclosure finalization | **Done** — [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md); Option A selected; **v1.10 score-integrity sequence closed**; gates unchanged |
| **v1.0c / v1.1f / v1.2f** | Individual score wiring gates | **Not approved** |
| **v1.8i** | Broader Passive reweight / mock retirement | **Future only** |
| **v1.9d.future** | Systematic re-risking feasibility (research) | **Future** — long-term MOCK path |

No score changes without explicit product approval.
