# Retirement Flow Mapping Decision (GhostFlow v1.2e)

**Status:** Decision record only — **no score wiring**, no runtime changes, no artifact or UI edits.  
**Effective:** 2026-05-20  
**Related:** [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md) (v1.2e evidence) · [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

This memo formalizes the **v1.2e mapping/product decision** from the calibration study. The study remains supporting evidence.

---

## 1. Background

| Phase | Outcome |
|-------|---------|
| **v1.2a** | Feasibility — YELLOW; no weekly retirement **flow** series |
| **v1.2b–c** | Production artifact `retirementFlowPressureProxy.v1.json` (ICI Table 1, Q4 2025) |
| **v1.2d** | Display-only card `retirement-asset-growth`; MOCK **58** in composite |
| **v1.2e** | Quarterly history calibration (76 quarters since 2007:Q1) |

The Research Composite still uses **MOCK** `retirementFlowPressureProxy` (**58**). The ICI artifact does not feed `lib/ghostflow/scoring.ts`.

---

## 2. Decision (v1.2e)

| Item | Decision |
|------|----------|
| **Artifact role** | **Display-only** — public card shows ICI asset levels and growth |
| **`mappingStatus`** | Remains **`not_final`** |
| **Composite input** | **`retirementFlowPressureProxy` stays MOCK 58** |
| **Final score mapper** | **None selected** in v1.2e |
| **v1.2f score wiring** | **Blocked** without explicit product approval |
| **Naming / semantics** | If score mapping is ever reconsidered, require **rename + semantic review** — “Retirement Asset Growth Proxy” is not equivalent to “retirement-flow pressure” |

---

## 3. Calibration summary (v1.2e)

Source: [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md).

| Finding | Value |
|---------|--------|
| Observations | **76** quarters (2007:Q1 → 2025:Q4) |
| Q4 2025 QoQ growth | **2.1%** — percentile **48.7** |
| Q4 2025 YoY growth | **11.2%** — percentile **74.3** |
| IRA / DC share | **39.1%** / **28.9%** of total |
| MOCK score-impact baseline | Passive **58**, Composite **62** |

---

## 4. Mapping options considered (not adopted)

| Option | Q4 2025 preview R | Notes |
|--------|-------------------|-------|
| QoQ growth percentile | 49 | Near median QoQ; modest composite delta |
| YoY growth percentile | 74 | Elevated YoY; +3 passive vs MOCK |
| Blended 60% QoQ / 40% YoY percentile | 59 | Close to MOCK by coincidence |
| Capped QoQ percentile (75) | 49 | Same as uncapped at current level |
| Manual QoQ bands | 58 | Matches MOCK for 2.1% QoQ only |

**Percentile / capped mappings** may be future candidates for a **different semantic** (asset-growth pressure), but are **not implemented** and were **not approved** for the retirement-flow composite slot.

---

## 5. Rationale for display-only default

1. **Structural assets ≠ flow pressure** — Table 1 levels conflate contributions, market returns, and revaluations.
2. **Quarterly cadence** — unsuitable for weekly GhostFlow composite without lag and staleness policy.
3. **ICI overlap** — scoring risks double-counting with existing ICI-linked inputs.
4. **Calibration** — YoY percentile (**74**) and QoQ (**49**) disagree; no single stable mapping without product definition.
5. **Precedent** — CFTC TFF and levered ETF rebalance remain display-only after similar studies.

---

## 6. Future gates

| Gate | Requirement |
|------|-------------|
| **v1.2f score wiring** | Explicit product approval; updated artifact contract; `mappingStatus` → `final`; implement mapper in research + scoring path; overlap review |
| **Rename** | If scored, prefer artifact/signal naming that reflects **asset growth**, not “flow pressure” |

Until then: keep **`publicPassiveInputKey`** off retirement; do not add `retirementFlowPressureProxy` to `publicPassiveInputKeys`.

---

## 7. References

- Study: `npm run ghostflow:retirement-flow-history-study -- --xls <ici.xls>`
- Code: [`lib/ghostflow/research/retirementFlowHistory.ts`](../lib/ghostflow/research/retirementFlowHistory.ts)
- Display artifact: [`retirementFlowPressureProxy.v1.json`](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json)
