# Levered ETF Rebalance Mapping Decision (GhostFlow v1.1e)

**Status:** Decision record only — **not implemented in v1.1e** (no score wiring, no runtime changes, no artifact or UI edits).  
**Effective:** 2026-05-20  
**Related:** [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) · [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

This memo **formalizes the v1.1e mapping/product decision** for the levered ETF rebalance pressure proxy. A historical calibration study (**v1.1e-calibration**) is required before any **v1.1f** score-wiring gate.

---

## 1. Background

GhostFlow ships a **levered ETF mechanical rebalance notional** proxy for a Tier-1 six-ticker universe (TQQQ/SQQQ, UPRO/SPXU, TNA/TZA):

| Phase | Outcome |
|-------|---------|
| **v1.1a** | Feasibility — [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) (**YELLOW**) |
| **v1.1b** | Artifact design — schema, formula, example JSON, validator module |
| **v1.1c** | Production artifact [`leveredEtfRebalancePressure.v1.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json) validated via `ghostflow:validate-artifacts` |
| **v1.1d** | Display-only public signal card (`levered-etf-rebalance`); no Research Composite merge |

The Research Composite still uses **MOCK** `leveredEtfRebalancePressure` (**55**). The production artifact does not feed `lib/ghostflow/scoring.ts` today.

---

## 2. Current production artifact (validated, not scored)

**File:** [`data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json)

| Field | Value |
|-------|--------|
| `asOf` | **2026-05-22** |
| `publishedAt` | **2026-05-28** |
| `dataQuality` | **manual_unverified** |
| `observations.mappingStatus` | **not_final** |
| `aggregateAumMillionsUsd` | **48,347.86** |
| `aggregateEstimatedRebalanceNotionalMillionsUsd` | **+1,343.67** |
| `aggregateAbsRebalanceNotionalMillionsUsd` | **1,343.67** |
| `aggregateRebalancePctOfUniverseAum` | **2.78%** |
| `dominantDirection` | **buy_underlying** |

No `designOnly`, no `candidatePressureScore` on the production artifact.

---

## 3. Current display card (v1.1d)

| Item | Value |
|------|--------|
| Signal id | `levered-etf-rebalance` |
| Title | **Levered ETF Rebalance Pressure Proxy** |
| Display value | **Est. buy $1.34B · 2.78% of universe AUM** |
| Badge | **DISPLAY ONLY** |
| Research Composite | **Not included** — card is informational only |

Display wiring: `applyLeveredEtfRebalanceDisplayArtifact` in `buildSnapshot.ts` (v1.1d). No `publicPassiveInputKeys` promotion for levered.

---

## 4. Current score context (unchanged in v1.1e)

| Input / output | Value |
|----------------|--------|
| `leveredEtfRebalancePressure` (passive sub-input) | **MOCK 55** |
| Passive Pressure | **58** |
| Structural Pressure | **66** |
| Research Composite | **62** |
| Band | **Crowded / Reflexive** |

Passive weight for levered: **15%** of Passive Pressure (`lib/ghostflow/scoring.ts`, unchanged).

---

## 5. Score-impact preview (if levered were wired)

Peers held fixed at current MOCK/production values; only levered sub-input **L** varies. Passive formula (simplified): `Passive(L) ≈ clampInt(49.75 + 0.15·L)`. Composite delta ≈ `0.075·(L − 55)` because levered is 15% of passive and passive is 50% of composite.

| Mapping idea | L (example) | Passive | Composite | Band |
|--------------|-------------|---------|-----------|------|
| MOCK (current) | **55** | **58** | **62** | Crowded / Reflexive |
| Linear ×20 on 2.78% (`round(2.78 × 20)`) | **56** | **58** | **62** | Crowded / Reflexive |
| Linear ×10 on 2.78% | **28** | **54** | **60** | Crowded / Reflexive |
| Manual band: 2–3% → 60 | **60** | **58** | **62** | Crowded / Reflexive |
| Capped `min(80, L)` with L=93-style tail | **80** | **64** | **64** | Crowded / Reflexive |
| Percentile (hypothetical 75th) | **75** | **61** | **63** | Crowded / Reflexive |

**Band note:** For L in 0–100 with other inputs fixed, composite band remains **Crowded / Reflexive** in the current band thresholds.

**Coincidence warning:** ×20 on **2.78%** → L ≈ **56**, which lands near MOCK **55** and leaves Composite **62** — that alignment is **not calibration**; it reflects an arbitrary scale choice against a single unverified week.

---

## 6. Mapping options considered

| ID | Definition | Role |
|----|------------|------|
| **A** | **Stay display-only** — no score merge; artifact + card only | **Selected for v1.1e** |
| **B** | **Linear percent × scale** — e.g. `L = clamp(round(pctOfAum × k), 0, 100)` | Preliminary candidate only (e.g. k=20); **not implemented** |
| **C** | **Manual bands** — operator-defined %AUM → score tiers | Preliminary candidate only (conservative bands); **not implemented** |
| **D** | **Capped mapping** — e.g. `min(80, f(pct))` to limit tail shock | Future score candidate if wiring approved |
| **E** | **Market-volume normalized** — dollar pressure vs SPY+QQQ+IWM session volume | Needs volume source + methodology; deferred |
| **F** | **Percentile / history mapping** — rank `aggregateRebalancePctOfUniverseAum` (or abs notional) vs backfill | **Preferred future score candidate** after **v1.1e-calibration** |

Do not promote `aggregateRebalancePctOfUniverseAum` as a live score sub-input until **v1.1e-calibration** completes, a final mapper is chosen, and **v1.1f** is product-approved.

---

## 7. Final v1.1e decision

1. **Keep levered ETF artifact display-only** — no `buildSnapshot` score merge in v1.1e.
2. **Keep `observations.mappingStatus` as `not_final`** on the production artifact.
3. **Do not wire score in v1.1e** — `leveredEtfRebalancePressure` remains MOCK **55**.
4. **Do not pick a final score mapper yet** — options B–F remain documented alternatives only.
5. **Treat conservative manual bands (C) and ×20 linear (B) as preliminary candidates only** — not implemented, not validated on history.
6. **Require v1.1e-calibration** (history/calibration study, research-only) before any **v1.1f** score-wiring gate.
7. **Future score candidate (if product-approved after calibration)** should likely be **percentile/history-based (F)** or **capped mapping (D)**, not uncapped linear (B).

**Next research gate:** **v1.1e-calibration** — distribution and mapping comparison.  
**Next implementation gate:** **v1.1f** — score-wiring implementation, **only if product-approved after calibration**.

---

## 8. Rationale

| Factor | Implication |
|--------|-------------|
| **No historical distribution yet** | Cannot defend percentile (F) or band thresholds (C) without **v1.1e-calibration**. |
| **Linear scale is arbitrary** | Any multiplier (×10, ×20, ×50) changes Passive/Composite without empirical grounding. |
| **`dataQuality: manual_unverified`** | Issuer AUM and index returns were not fully cross-checked for all six tickers this week. |
| **AUM and return dates misaligned** | `asOf` 2026-05-22 (returns) vs `publishedAt` 2026-05-28 (AUM capture) — acceptable for display proxy, weak for score promotion. |
| **2.78% of AUM is meaningful but unmapped** | Magnitude is interpretable on the card; no approved 0–100 mapper ties it to Passive Pressure. |
| **×20 ≈ MOCK 55 is coincidence** | Single-week arithmetic near MOCK must not be mistaken for calibration or approval to wire B. |

Display-only (A) preserves user visibility of rebalance pressure while the composite stays on a stable MOCK until history, mapping, and product gates clear.

---

## 9. Risks and caveats

1. **Not issuer-reported flow** — Estimated mechanical notional from AUM × leverage formula, not fund rebalance tickets.
2. **Not exact trade demand** — Ignores intraday path, borrow, creation/redemption frictions, and basket composition drift.
3. **Not gamma / options / 0DTE exposure** — Levered ETF options overlay can amplify or dampen effective pressure beyond this proxy.
4. **Single-session return inside weekly artifact cadence** — Row `underlyingReturnPct` is one session; weekly aggregation of returns is deferred.
5. **Six-ticker universe ≠ whole levered ETF complex** — Tier-1 subset only; tail names omitted.
6. **Direction displayed, most mappers magnitude-only** — `dominantDirection: buy_underlying` is shown on the card; candidate score mappings B–F primarily use abs % or abs notional unless explicitly extended.

---

## 10. Not implemented in v1.1e

- No changes to `lib/ghostflow/scoring.ts`
- No score merge in `lib/ghostflow/buildSnapshot.ts` (display path from v1.1d unchanged)
- No changes to `components/ghostflow/*`
- No edits to `data/ghostflow/artifacts/*.json`
- No changes to `data/ghostflow/mockGhostflowSnapshot.ts`
- No `package.json` script changes
- No score wiring, no PUBLIC badge on the passive sub-input
- No GhostRegime, GhostYield, Models, or builder changes

---

## 11. Future implementation checklist

### v1.1e-calibration (research only — next)

- [ ] Historical backfill or repeated manual weeks for `aggregateRebalancePctOfUniverseAum` and abs notional
- [ ] Distribution stats (percentiles, tails, week-over-week stability)
- [ ] Compare mapping options B–F on history (not only latest week)
- [ ] Score-impact table over representative weeks (Passive, Composite, band)
- [ ] Calibration memo (e.g. `LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md`) — parallel to [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md)

### After calibration + mapping choice + product approval → v1.1f

- [ ] Product sign-off on **v1.1f** scope
- [ ] Finalize mapper (likely F or D); set `mappingStatus` only when validated
- [ ] Update artifact validation rules if `mappingStatus` or stored score fields change
- [ ] Implement score merge in `buildSnapshot.ts`; PUBLIC badge on sub-input
- [ ] Score-impact tests vs MOCK **55**; methodology and card caveats
- [ ] Fallback: failed/missing artifact → retain MOCK **55**, no false PUBLIC promotion
- [ ] Update [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) and [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md)

---

## Related documents

- [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) — schema and operator checklist  
- [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) — v1.1a feasibility  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase tracking (v1.1e / v1.1e-calibration / v1.1f)  
- [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — parallel mapping-decision pattern (CFTC track)
