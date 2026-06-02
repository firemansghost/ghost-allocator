# GhostFlow Data Roadmap (v0.9 planning)

Planning document for GhostFlow score-input sourcing. Builds on **v0.8** (research composite framing: six PUBLIC score sub-inputs, four MOCK score sub-inputs, two PLACEHOLDER signal cards).

**Baseline reference date:** [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) = `2026-05-22`.

**Operator refresh:** [`MANUAL_REFRESH_CHECKLIST.md`](./MANUAL_REFRESH_CHECKLIST.md) · per-artifact runbooks at the bottom of that page.

**Current research composite (unchanged by this doc):** Composite **60** · Passive Pressure **58** · Structural Fragility **61** · band *Elevated Flow Pressure*.

---

## Taxonomy

| Label | Meaning |
|--------|---------|
| **PUBLIC** | Manual artifact merged into a score sub-input via `lib/ghostflow/buildSnapshot.ts` |
| **DERIVED** | Computed from PUBLIC artifact(s); may appear as a signal card only until wired into the composite |
| **MOCK** | Static 0–100 value from `data/ghostflow/mockGhostflowSnapshot.ts`, included in the research composite |
| **PLACEHOLDER** | Illustrative signal card only; **not** one of the 10 score sub-inputs |

---

## 1. Current GhostFlow input inventory

Ten sub-inputs feed the research composite (50% Passive Pressure + 50% Structural Fragility). Pillar weights are fixed in `lib/ghostflow/scoring.ts`.

### Passive Pressure (5 sub-inputs)

| Input key | Status | Current source / value | Update cadence | In score | Confidence |
|-----------|--------|------------------------|----------------|----------|------------|
| `etfFundFlowImpulse` | **PUBLIC** | ICI domestic equity ETF estimated net issuance (~$33.9B, week ended 2026-05-13) → 0–100 proxy via `etfNetIssuance` mapper | Weekly (manual artifact) | Yes (25% of passive pillar) | Medium–high — `verified_manual` |
| `optionsVolatilityAmplifier` | **PUBLIC** | CBOE VIX close **16.7** (as of 2026-05-22) → 0–100 via `volatilityRegime` mapper | Daily (manual artifact) | Yes (20%) | High — `verified_manual` |
| `systematicStrategyPressure` | **MOCK** | Static **62** from mock snapshot | None (static) | Yes (20%) | Low — illustrative only |
| `retirementFlowPressureProxy` | **MOCK** | Static **58** from mock snapshot | None (static) | Yes (20%) | Low — no defensible public source yet |
| `leveredEtfRebalancePressure` | **MOCK** | Static **55** from mock snapshot | None (static) | Yes (15%) | Low — methodology undefined |

### Structural Fragility (5 sub-inputs)

| Input key | Status | Current source / value | Update cadence | In score | Confidence |
|-----------|--------|------------------------|----------------|----------|------------|
| `passiveShareProxy` | **PUBLIC** | ICI fund/ETF domestic equity **index asset share 63.2%** (month ended 2026-03-31) → 0–100 structural proxy | Monthly (manual artifact) | Yes (30% of structural pillar) | Medium–high — `verified_manual`; **not** market-wide passive share |
| `activeShareOffsetProxy` | **PUBLIC** | ICI domestic equity active vs index **monthly net flows** (month ended 2026-03-31) → flow-tilt proxy | Monthly (manual artifact) | Yes (20%) | Medium–high — `verified_manual` |
| `indexConcentration` | **PUBLIC** | SSGA SPY fact sheet **top-10 index weight 36.5%** (month ended 2026-03-31) | Monthly (manual artifact) | Yes (20%) | Medium–high — `verified_manual` |
| `breadthWeakness` | **PUBLIC** | StockCharts `$SPXA50R` **58.0%** above 50-day MA (2026-05-22) → inverse weakness proxy | Daily (manual artifact) | Yes (15%) | Medium — `manual_unverified` (Barchart `$S5FI` cross-check gap ~1.2 pp) |
| `modelZoneProximity` | **MOCK** | Static **52** from mock snapshot | None (static) | Yes (15%) | Low — **not** wired to ICI distance logic today |

### DERIVED signal (not a score sub-input)

| Signal id | Status | Source / value | Cadence | In score | Confidence |
|---------|--------|----------------|----------|----------|------------|
| `distance-65` | **DERIVED** | **1.8 pp** below 65% model stress zone from ICI index share **63.2%** (`deriveDistanceToModelZone` + `mapDistanceToZoneNumericValue` in `passiveShareProxy.ts`) | Monthly (follows ICI passive-share artifact) | **No** (context card only) | Medium — same ICI denominator caveats as passive-share |

**Known gap (v0.9b target):** When the ICI passive-share artifact merges, `distance-65` updates from live share data, but `modelZoneProximity` remains the mock snapshot value (**52**). Tests in `lib/ghostflow/__tests__/passiveShareProxy.test.ts` assert this behavior today.

### PLACEHOLDER signal cards (not in composite)

| Signal id | UI label | Mock snapshot name | In score |
|---------|----------|-------------------|----------|
| `odte-options` | 0DTE / Options Pressure | High gamma sensitivity (numeric **70**) | No |
| `systematic-flow` | Future Systematic Flow Feed | CTA / vol-control tilt (numeric **62**) | No |

Do not confuse **Future Systematic Flow Feed** (placeholder card) with **Systematic strategy pressure** (MOCK score sub-input **62** in the composite).

---

## 2. v0.9 recommended priorities

### A) Derive `modelZoneProximity` from existing ICI distance logic (v0.9b) — **COMPLETE**

Shipped: `buildSnapshot.ts` merge, DERIVED classification, coverage **6 public / 1 derived / 3 mock**. Mapping reuses `mapDistanceToZoneNumericValue` (same as `distance-65`). Score impact at reference 2026-05-22: composite **60 → 62**, structural **61 → 66**.

### B) CFTC Traders in Financial Futures (TFF) feasibility (v0.9c) — **COMPLETE**

**Feasibility memo:** [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) · **Spike:** `npm run ghostflow:cftc-tff-spike`

**Outcome:** **YELLOW** — PRE API and TFF Futures Only (`gpe5-46if`) expose ES / NQ mini / RTY mini / VIX with lev-funds L/S, OI, changes, and %OI fields. Proceed to **v0.9d** artifact design with strict “positioning proxy” copy (not CTA/systematic flow). Primary codes: `13874A`, `209742`, `239742`; optional VIX `1170E1` for context only.

- Candidate: [CFTC Commitments of Traders / Traders in Financial Futures](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) as a **public weekly futures-positioning proxy**.
- **Not** a direct CTA / vol-control / systematic-flow estimate.
- Target input (if promoted in v0.9d): `systematicStrategyPressure` (currently MOCK **62**).

### C) Levered ETF rebalance pressure (v1.1) — **v1.1a COMPLETE**

**Feasibility memo:** [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md)

**Outcome:** **YELLOW** — Tier-1 universe **TQQQ/SQQQ, UPRO/SPXU, TNA/TZA**; manual AUM from issuer pages + index moves via QQQ/SPY/IWM proxies; estimated rebalance notional proxy feasible. **v1.1c:** production artifact validated via `ghostflow:validate-artifacts`. **v1.1d:** display-only public card (`levered-etf-rebalance`); **not scored**. **v1.1e:** mapping decision — display-only; `mappingStatus: not_final`; MOCK **55** unchanged. **v1.1e-calibration:** history study (next, research-only). **v1.1f:** score-wiring gate only after calibration + product approval.

### D) Retirement-flow pressure — MOCK / research-only

- Keep `retirementFlowPressureProxy` MOCK until a defensible public source exists (ICI Flow of Funds, Z.1, or similar worth a v1.0 spike).
- No v0.9 implementation target.

### E) 0DTE / options — PLACEHOLDER until source selected

- Keep `odte-options` as a **PLACEHOLDER** signal card.
- Do not add to the 10 score sub-inputs until a clean **public or paid** options-market data path is chosen (OCC / Cboe / OPRA aggregates or vendor).
- Distinct from **PUBLIC** `optionsVolatilityAmplifier` (CBOE VIX level), which already covers volatility-regime pressure.

---

## 3. Candidate sources

| Candidate source | Likely target | Notes |
|------------------|---------------|-------|
| **ICI artifacts (existing)** | `passiveShareProxy`, `distance-65`, `modelZoneProximity` (derived) | Narrow fund/ETF denominator; monthly assets / flows tables |
| **CBOE VIX History CSV (existing)** | `optionsVolatilityAmplifier` | Daily close; verified manual extract |
| **ICI ETF net issuance (existing)** | `etfFundFlowImpulse` | Weekly domestic equity row |
| **StockCharts `$SPXA50R` + Barchart `$S5FI` cross-check (existing)** | `breadthWeakness` | Daily participation; vendor methodology may differ |
| **SSGA SPY monthly fact sheet (existing)** | `indexConcentration` | Top-10 **index** weights, not fund weights |
| **CFTC COT / TFF (production candidate)** | `systematicStrategyPressure` (future) | v0.9e — [`systematicFlowProxy.v1.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.json) validated via `ghostflow:validate-artifacts`; **not merged into score yet** |
| **Issuer fund pages + index proxies (v1.1c production candidate)** | `leveredEtfRebalancePressure` (future) | [`leveredEtfRebalancePressure.v1.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json) validated via `ghostflow:validate-artifacts`; **not merged into score yet** — see [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) |
| **OCC / Cboe / OPRA or commercial options data (future)** | `odte-options` placeholder → possible new input | Licensing and metric definition (gamma, 0DTE volume share) |
| **Retirement / Flow of Funds (future)** | `retirementFlowPressureProxy` | Low confidence until source is validated |

---

## 4. Guardrails

GhostFlow input promotion rules (all phases):

1. **No promotion without provenance** — source name, URL or document, manual extract note, `asOf` / `publishedAt`, and `dataQuality` where applicable.
2. **No promotion without freshness** — rules in `lib/ghostflow/artifactFreshness.ts` (or documented DERIVED cadence tied to parent artifact).
3. **No promotion without mapping** — documented 0–100 mapper, validation script entry, and unit tests for merge + scoring snapshot.
4. **No promotion without UI caveat** — card caveat, score sub-input badge (PUBLIC / DERIVED / MOCK), and methodology section update.
5. **Public proxy ≠ true market-wide measurement** — ICI index share, breadth participation, concentration, and CFTC positioning are **proxies**, not ground truth.
6. **Research / education only** — not a forecast, trading signal, or allocation recommendation.
7. **Manual artifacts by default** — no live feeds, cron, or API routes unless explicitly approved as a product change.
8. **PLACEHOLDER ≠ MOCK score input** — signal cards for future work must not be labeled as current measured readings in the composite.

---

## 5. Proposed implementation phases

| Phase | Deliverable | Code / data changes |
|-------|-------------|---------------------|
| **v0.9a** | This roadmap + optional checklist link | **Docs only** |
| **v0.9b** | Wire `modelZoneProximity` from ICI distance-to-65 calculation | **Done** — `buildSnapshot.ts`, tests, UI copy/badges |
| **v0.9c** | CFTC TFF feasibility spike: contracts, categories, lag, sample extract, mapping memo | **Done** — [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md), `scripts/ghostflow/cftc-tff-spike.ts` |
| **v0.9d** | CFTC TFF artifact design (memo, example JSON, pure validator/mapper, tests) | **Done** — [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md), `systematicFlowProxy.v1.example.json`, `lib/ghostflow/artifacts/systematicFlowProxy.ts` |
| **v0.9e** | CFTC TFF production artifact candidate (validated, not scored) | **Done** — `systematicFlowProxy.v1.json`, `loadSystematicFlowProxyArtifact()`, `ghostflow:validate-artifacts`, report-alignment validator, tests |
| **v0.9f** | CFTC TFF display-only public signal card (`systematic-flow`) | **Done** — `applySystematicFlowProxyDisplayArtifact`, UI grouping/copy, `publicSignals` +7, no score wiring |
| **v1.0a** | CFTC TFF historical calibration study (research only) | **Done** — [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md), `ghostflow:cftc-tff-history-study`, `lib/ghostflow/research/cftcTffHistory.ts` |
| **v1.0b** | CFTC TFF mapping decision record | **Done** — [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md); display Mapping A; CFTC remains display-only |
| **v1.0c** | CFTC score-wiring implementation gate (if product-approved) | Rename sub-input; Mapping C `min(80, basketScore)`; PUBLIC badge; tests + methodology — see mapping decision §8 |
| **v1.1a** | Levered ETF rebalance pressure feasibility | **Done** — [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md); YELLOW; Tier-1 six-ticker universe |
| **v1.1b** | Levered ETF artifact design | **Done** — [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md), `leveredEtfRebalancePressure.v1.example.json`, `lib/ghostflow/artifacts/leveredEtfRebalancePressure.ts`, tests |
| **v1.1c** | Levered ETF production artifact candidate | `leveredEtfRebalancePressure.v1.json`, `validate-artifacts` |
| **v1.1d** | Levered ETF display-only signal card | **Done** — `applyLeveredEtfRebalanceDisplayArtifact`, `levered-etf-rebalance` card, `publicSignalCount` +8, no score wiring |
| **v1.1e** | Levered ETF mapping decision | **Done** — [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md); display-only; no score mapper selected |
| **v1.1e-calibration** | Levered ETF fixed-current-AUM return-sensitivity study (research only) | **Done** — [LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md](./LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md), `ghostflow:levered-etf-rebalance-history-study`; not true historical AUM calibration; required before v1.1f |
| **v1.1f** | Levered ETF score-wiring gate (if product-approved) | `buildSnapshot` merge; MOCK **55** replacement; methodology + tests — **after v1.1e-calibration** |
| **v1.0+** | Deeper options (0DTE), retirement-flow sources | Larger sourcing, possible licensing |

---

## Open questions

1. ~~**CFTC TFF mapping (v0.9d design):**~~ **Resolved:** Display/artifact use Mapping A ([v0.9d design](./CFTC_TFF_ARTIFACT_DESIGN.md)). **Calibration (v1.0a):** [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md). **Decision (v1.0b):** [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — CFTC display-only; future score candidate Mapping C after rename; **v1.0c** gated on product approval.
2. ~~**`modelZoneProximity` mapping (v0.9b):**~~ **Resolved:** Reuse `mapDistanceToZoneNumericValue` as-is (documented in merge + methodology).
3. ~~**Levered ETF scope:**~~ **Resolved (v1.1a–b):** Tier-1 six-ticker universe; single-session `underlyingReturnPct`; formula in [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md). ~~**Levered ETF mapping (v1.1e):**~~ **Resolved:** [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) — display-only; `mappingStatus: not_final`; `leveredEtfRebalancePressure` MOCK **55**; **v1.1e-calibration** next; score wiring **v1.1f** gated on calibration + product approval.
4. **0DTE data path:** Public aggregate vs paid vendor; whether future options pressure replaces or supplements VIX-based `optionsVolatilityAmplifier`.
5. **Retirement flows:** Is any public series (ICI Flow of Funds, Federal Reserve Financial Accounts) worth a v1.0 research spike?

---

## Related documents

- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) — v0.9c TFF/COT feasibility (YELLOW)
- [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) — v1.0a historical calibration (research)
- [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — v1.0b mapping/product decision (display-only; v1.0c score gate)
- [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) — v1.1a levered ETF rebalance feasibility (YELLOW)
- [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) — v1.1e mapping/product decision (display-only; v1.1e-calibration → v1.1f score gate)
- [LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md](./LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md) — v1.1e-calibration return-sensitivity study (fixed-current-AUM; research-only)
- [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) — v1.1b/c artifact design (example + production candidate; no score wiring until v1.1f)
- [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) — v0.9d design + v0.9e production candidate (validated; score wiring deferred to v1.0c)
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — operator refresh cadence for existing public artifacts
- [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) — CBOE VIX
- [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) — Market breadth
- [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) — ETF net issuance
- [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) — Active vs index flows
- [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) — ICI index share + distance-to-65
- [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) — SSGA SPY concentration
