# CFTC TFF Mapping Decision (GhostFlow v1.0b)

**Status:** Decision record only — **no score wiring**, no runtime changes, no artifact or UI edits.  
**Effective:** 2026-05-20  
**Related:** [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) (v1.0a evidence) · [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

This memo **formalizes the v1.0b mapping/product decision based on v1.0a calibration**. The calibration study remains supporting evidence; it is not replaced or overridden by this record.

---

## 1. Background

GhostFlow ships a CFTC Traders in Financial Futures (TFF) **leveraged-funds positioning** proxy for three equity-index mini contracts (ES, NQ, RTY):

| Phase | Outcome |
|-------|---------|
| **v0.9e** | Production artifact [`systematicFlowProxy.v1.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.json) |
| **v0.9f** | Display-only public signal card (`systematic-flow`); no Research Composite merge |
| **v1.0a** | Historical calibration study — distribution, mapping comparison, score-wiring preview |

The Research Composite still uses **MOCK** `systematicStrategyPressure` (**62**). The CFTC proxy does not feed `lib/ghostflow/scoring.ts` today.

---

## 2. Current production display mapping

**Mapping A — fixed linear (display and artifact validation):**

```
basketScore = clamp(round(abs(basketNetPctOi) * 5), 0, 100)
```

Implemented in [`mapBasketNetPctOiToPressureScore`](../lib/ghostflow/artifacts/systematicFlowProxy.ts). Stored on the weekly artifact and shown on the public card.

**Latest production week (artifact `asOf` 2026-05-19):**

| Field | Value |
|-------|--------|
| `basketNetPctOi` | -18.5% |
| `basketDirection` | net_short |
| `basketScore` (Mapping A) | **93** |

---

## 3. Calibration findings (v1.0a summary)

Source: [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) (575 aligned weeks, 2006-06-20 → 2026-05-19).

| Finding | Value |
|---------|--------|
| Current \|net % OI\| percentile | **91.5th** |
| Mapping A: weeks with score ≥70 / ≥80 / ≥90 | **35.1%** / **25.2%** / **11.8%** |
| Direction mix | **93%** net_short |
| Direct wire preview (Mapping A → passive sub-input) | Passive **58→64**, Composite **62→65**, band unchanged (Crowded / Reflexive) |

The study evaluated whether Mapping A is too aggressive for score use and compared alternatives.

---

## 4. Mapping options considered

| ID | Definition | Latest week score | Notes from v1.0a |
|----|------------|-------------------|-------------------|
| **A** | `abs(netPctOi) × 5`, cap 0–100 | 93 | Current artifact/display; ~25% of weeks ≥80 |
| **B** | Percentile rank of abs(netPctOi) | 92 | Regime-adaptive; harder to explain |
| **C** | `min(80, basketScore)` where `basketScore` is Mapping A | 80 | Eliminates 90+; same ≥80 frequency as A below cap |
| **D** | Z-score on abs(netPctOi) → `50 + 15z` | 70 | Much lower tail frequency; may understate current crowding |

---

## 5. Final v1.0b decision

1. **CFTC TFF artifact remains display-only** for now (no `buildSnapshot` score merge).
2. **UI badge (v1.3a):** Public `systematic-flow` card uses **DISPLAY ONLY** (presentation only); card body may still show Mapping A pressure (e.g. 93) — not a composite input.
3. **Public display card keeps Mapping A** — `basketScore = clamp(round(abs(netPctOi) * 5), 0, 100)`.
4. **Do not wire Mapping A** into the Research Composite under the old label **“Systematic strategy pressure”**.
5. **If score wiring is product-approved later**, preferred score candidate is **Mapping C**:
   ```
   scoreInput = min(80, basketScore)
   ```
   where `basketScore` is the Mapping A value from the validated artifact.
6. **Future wiring must rename** the passive score sub-input. Approved labels (either is acceptable; pick one primary in UI):
   - **“CFTC leveraged-funds positioning proxy”** (primary recommendation)
   - **“Leveraged-funds futures positioning proxy”** (alternate)
7. **Future wiring must include:** score-impact tests (composite + passive + band), methodology copy, card/score caveats, PUBLIC badge on the sub-input, and **fallback behavior** (on artifact load/validation failure: retain MOCK **62** and do not promote `publicPassiveInputKeys` — same pattern as other public artifact merges).

**Next implementation gate:** **v1.0c** — score-wiring implementation, **only if product-approved**. See §7 checklist.

---

## 6. Rationale

**Display keeps Mapping A**

- Matches production artifact schema and `ghostflow:validate-artifacts` rules today.
- Simple, auditable link from \|net % OI\| to 0–100 for the signal card.
- Latest week (93) is high but consistent with 91.5th percentile crowding — appropriate for a **positioning** readout, not a hidden score bump.

**Score stays display-only (v1.0b)**

- Category is **positioning**, not systematic flow; Leveraged Funds ≠ CTA / vol-control / risk-parity.
- Wiring under **“Systematic strategy pressure”** would mislead users (MOCK **62** vs display **93**).
- Composite impact under Mapping A is moderate (+3) but sub-input delta is large (+31); product has not approved that tradeoff.

**Future score candidate: Mapping C (after rename)**

- Softens saturation: latest **80** vs **93**, no historical weeks ≥90 under cap.
- Preserves Mapping A for artifact refresh and display; cap applies only at score merge.
- Still ~25% of weeks ≥80 on the sub-input (same as A below 80) — acceptable if labeled as positioning proxy with caveats.

**Mapping A direct wire rejected for score**

- Even with rename, uncapped Mapping A keeps 11.8% of weeks ≥90 and maximizes sub-input shock vs MOCK.

**Mappings B and D not selected**

- B: percentile is harder to explain in methodology; similar tails to A.
- D: understates current crowding vs A/C for this basket.

---

## 7. Risks

1. **Label drift** — Users may equate the display card with the passive “systematic” sub-input while MOCK **62** still drives the composite.
2. **Mapping A saturation** — Scores of 90–100 are not rare (~12% of history); display can look “maxed” without score wiring.
3. **Net-short dominance** — 93% of weeks net_short; magnitude score ignores sign; direction context must stay in copy.
4. **Cadence mismatch** — Weekly CFTC vs daily/weekly/monthly composite inputs.
5. **Cap surprise (Mapping C)** — If wired later, score sub-input (**80**) will differ from card `basketScore` (**93**) until product chooses to align display or document both values.

---

## 8. Future implementation checklist (v1.0c gate)

Only if product explicitly approves score wiring:

- [ ] Product sign-off on **v1.0c** scope
- [ ] Rename passive sub-input (see §5.5); update score card, methodology, watchlist copy
- [ ] Implement `applySystematicFlowProxyArtifact` score merge in `buildSnapshot.ts` with `scoreInput = min(80, basketScore)`
- [ ] Set `publicPassiveInputKey` for the renamed input; PUBLIC badge in UI classification
- [ ] Score-impact tests: Passive, Composite, band, `publicPassiveInputKeys` / mock counts
- [ ] Caveats: positioning ≠ flow; leveraged funds ≠ systematic strategies; cadence note
- [ ] Fallback: failed/missing artifact → MOCK **62**, no false PUBLIC promotion
- [ ] Update [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) and [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) implementation checklist
- [ ] `scoring.ts` weights unchanged unless separate approval

---

## 9. Not implemented in v1.0b

- No changes to `lib/ghostflow/scoring.ts`
- No score merge in `lib/ghostflow/buildSnapshot.ts`
- No changes to `components/ghostflow/*`
- No edits to `data/ghostflow/artifacts/*.json` or `mockGhostflowSnapshot.ts`
- No `package.json` script changes
- No GhostRegime, GhostYield, Models, or builder changes

---

## Related documents

- [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) — v1.0a evidence  
- [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) — schema and operator checklist  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase tracking
