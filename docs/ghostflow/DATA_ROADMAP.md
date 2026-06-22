# GhostFlow Data Roadmap (living roadmap)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

Living roadmap for GhostFlow score-input sourcing, phase history, and open questions. Builds on **v0.8** (research composite framing: six PUBLIC score sub-inputs, three MOCK passive score sub-inputs, one DERIVED structural sub-input, display-only public artifact cards for CFTC TFF, levered ETF rebalance, retirement asset growth, and OCC index options intensity).

**Canonical inventory (detailed tables):** [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) — score-fed, display-only, MOCK, derived, and Treasury lanes after v1.7. **Doc index:** [README.md](./README.md).

**Baseline reference date:** [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) = `2026-05-22`.

**Operator refresh:** [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) (canonical workflow) · [`MANUAL_REFRESH_CHECKLIST.md`](./MANUAL_REFRESH_CHECKLIST.md) (field quick reference) · per-artifact runbooks at the bottom of the checklist.

**Current research composite (production snapshot, reference 2026-05-22):** Composite **62** · Passive Pressure **58** · Structural Fragility **66** · band *Crowded / Reflexive*.

**v1.8 theme:** GhostFlow **Data Quality & Mock Score Discipline** — see [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) § v1.8 recommendation. **v1.8b** formalized keep-MOCK decisions — [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md). **v1.8c** standardized freshness and `dataQuality` policy — [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md); no artifact JSON, score, UI, runtime, or count changes; **v1.8c.1** metadata cleanup **Done**.

**v1.9 theme:** GhostFlow **Passive Supply & Concentration Research** — [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md). Future feasibility candidates only; no implementation, scores, artifacts, UI cards, or `publicSignalCount` changes approved.

### Current dashboard state (v1.12 — after v1.9e.5)

Release checkpoint summary (detail in [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) · [integrity checkpoint](./GHOSTFLOW_PUBLIC_SIGNAL_INTEGRITY_CHECKPOINT.md)). Treasury Plumbing is a **separate** display-only lane — **not** included in `publicSignalCount` (do **not** combine equity **13** + Treasury **2** into 15).

#### Equity Research Composite (`buildSnapshot` lane)

| Layer | Count | Notes |
|-------|-------|--------|
| **Composite / Passive / Structural** | **62 / 58 / 66** | Band *Crowded / Reflexive* |
| **PUBLIC score artifacts** | **6** | vol-regime, etf-flow, passive-share, active-index-flow, concentration, breadth — merged into composite |
| **DERIVED score input** | **1** | `modelZoneProximity` (from ICI index share) |
| **MOCK score inputs** | **3** | `systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55** |
| **DISPLAY-ONLY public artifacts** | **7** | [`systematic-flow`](./CFTC_TFF_MAPPING_DECISION.md), [`levered-etf-rebalance`](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md), [`retirement-asset-growth`](./RETIREMENT_FLOW_MAPPING_DECISION.md), [`options-activity-proxy`](./OPTIONS_ACTIVITY_MAPPING_DECISION.md), [`index-inclusion-events`](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md), [`cap-weight-premium`](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md), [`tail-skew-context`](./TAIL_SKEW_MAPPING_DECISION.md) — equity signal grid only; not in composite |
| **PLACEHOLDER cards** | **0** | When production artifacts validate; see retired `odte-options` note below |
| **`publicSignalCount`** | **13** | Six score-fed public cards + seven display-only public signals in `meta.publicSignals` (plus derived context card `distance-65`, separate from this count) |
| **Score-wiring gates** | — | **v1.0c** (CFTC), **v1.1f** (levered ETF), **v1.2f** (retirement), **v1.4f** (options), **v1.9e.6** (Tail Skew) — product-approved only; discouraged by default |

#### Treasury Plumbing (separate lane — outside composite)

| Item | Value |
|------|--------|
| **Display-only cards** | **2** — `treasury-futures-positioning-proxy`, `treasury-long-end-income-lens` |
| **Wiring** | [`treasuryPlumbingDisplay.ts`](../lib/ghostflow/treasuryPlumbingDisplay.ts) — **not** `buildSnapshot` |
| **Outside** | `raw.signals`, `meta.publicSignals`, `PUBLIC_ARTIFACT_SIGNAL_IDS`, **`publicSignalCount`** |
| **Scored** | **No** — does not affect Composite / Passive / Structural |
| **`mappingStatus`** | **`not_final`** on both production artifacts — [mapping decision](./TREASURY_PLUMBING_MAPPING_DECISION.md) |
| **Caveats** | Futures: public CFTC positioning proxy only — **not** full basis-trade measurement. Income lens: **not** investment advice; **not** bond-buying or duration-allocation advice |
| **Future (not approved)** | **v1.7f-calibration** (research-only); **v1.7f.1** display percentiles; **v1.7g** score gate (**discouraged**) |

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
| `systematicStrategyPressure` | **MOCK** | Static **62** from mock snapshot; display card [`systematic-flow`] when artifact validates — **not scored** | None (static) | Yes (20%) | Low — CFTC display-only separate ([v1.0b](./CFTC_TFF_MAPPING_DECISION.md)) |
| `retirementFlowPressureProxy` | **MOCK** | Static **58** in composite; [v1.2c artifact](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json) on display-only card `retirement-asset-growth` — **not scored** | None (static) | Yes (20%) | Low — display-only ([v1.2e](./RETIREMENT_FLOW_MAPPING_DECISION.md)); MOCK **58** |
| `leveredEtfRebalancePressure` | **MOCK** | Static **55** from mock snapshot; display card [`levered-etf-rebalance`] when artifact validates — **not scored** | None (static) | Yes (15%) | Low — display-only artifact separate ([v1.1e](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md)) |

### Structural Fragility (5 sub-inputs)

| Input key | Status | Current source / value | Update cadence | In score | Confidence |
|-----------|--------|------------------------|----------------|----------|------------|
| `passiveShareProxy` | **PUBLIC** | ICI fund/ETF domestic equity **index asset share 63.2%** (month ended 2026-03-31) → 0–100 structural proxy | Monthly (manual artifact) | Yes (30% of structural pillar) | Medium–high — `verified_manual`; **not** market-wide passive share |
| `activeShareOffsetProxy` | **PUBLIC** | ICI domestic equity active vs index **monthly net flows** (month ended 2026-03-31) → flow-tilt proxy | Monthly (manual artifact) | Yes (20%) | Medium–high — `verified_manual` |
| `indexConcentration` | **PUBLIC** | SSGA SPY fact sheet **top-10 index weight 36.5%** (month ended 2026-03-31) | Monthly (manual artifact) | Yes (20%) | Medium–high — `verified_manual` |
| `breadthWeakness` | **PUBLIC** | StockCharts `$SPXA50R` **58.0%** above 50-day MA (2026-05-22) → inverse weakness proxy | Daily (manual artifact) | Yes (15%) | Medium — `manual_unverified` (Barchart `$S5FI` cross-check gap ~1.2 pp) |
| `modelZoneProximity` | **DERIVED** | From ICI index share via `mapDistanceToZoneNumericValue` (same logic as `distance-65`; wired v0.9b) | Monthly (follows ICI passive-share artifact) | Yes (15%) | Medium — same ICI denominator caveats as passive-share |

### DERIVED signal (not a score sub-input)

| Signal id | Status | Source / value | Cadence | In score | Confidence |
|---------|--------|----------------|----------|----------|------------|
| `distance-65` | **DERIVED** | **1.8 pp** below ~65% model-stress-zone reference from ICI index share **63.2%** (60–65% framing; not a tripwire — [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md)) | Monthly (follows ICI passive-share artifact) | **No** (context card only) | Medium — same ICI denominator caveats as passive-share |

**v0.9b (complete):** `modelZoneProximity` is **DERIVED** from the merged ICI passive-share artifact (not mock **52**). Context card `distance-65` uses the same distance mapping but remains **not** a separate score sub-input.

### Display-only public artifact cards (not in composite)

| Signal id | UI label | Production artifact | In score |
|---------|----------|---------------------|----------|
| `systematic-flow` | CFTC leveraged-funds positioning proxy | [`systematicFlowProxy.v1.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.json) | **No** — MOCK **62** still drives composite |
| `levered-etf-rebalance` | Levered ETF Rebalance Pressure Proxy | [`leveredEtfRebalancePressure.v1.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json) | **No** — MOCK **55** still drives composite |
| `retirement-asset-growth` | Retirement Asset Growth Proxy | [`retirementFlowPressureProxy.v1.json`](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json) | **No** — MOCK **58** still drives composite |
| `options-activity-proxy` | Index Options Intensity Proxy | [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) | **No** — VIX `optionsVolatilityAmplifier` still drives composite options/vol slot |
| `index-inclusion-events` | Index Inclusion Event Proxy | [`indexInclusionEventProxy.v1.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json) | **No** — no score path ([v1.9c.5 mapping](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md)) |
| `cap-weight-premium` | Cap-Weight Premium Proxy | [`capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json) | **No** — no score path ([v1.9b.5 mapping](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md)) |
| `tail-skew-context` | Tail Skew Context | [`tailSkewContext.v1.json`](../data/ghostflow/artifacts/tailSkewContext.v1.json) | **No** — VIX remains score-fed vol input ([v1.9e.5 mapping](./TAIL_SKEW_MAPPING_DECISION.md)) |

### Retired placeholder (`odte-options`)

`odte-options` remains in [`mockGhostflowSnapshot.ts`](../data/ghostflow/mockGhostflowSnapshot.ts) as a **fallback only** when [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) is missing or invalid. When the production options artifact validates (v1.4d+), the UI **suppresses** `odte-options` and shows **`options-activity-proxy`** instead — **0** active placeholder cards.

**Do not confuse:**

- **Display-only** public cards are **not** Research Composite inputs. They may show 0–100 context readings that do not affect the composite.
- **CFTC / levered / retirement** display cards (`systematic-flow`, `levered-etf-rebalance`, `retirement-asset-growth`) are **separate** from MOCK score sub-inputs **62** / **55** / **58** (`systematicStrategyPressure`, `leveredEtfRebalancePressure`, `retirementFlowPressureProxy`).
- **Options activity** (`options-activity-proxy`, OCC Index/Others cleared volume) is **display-only** and **not** 0DTE/GEX. The **score-fed** options/vol input is **`optionsVolatilityAmplifier`** via CBOE **VIX** only — do not confuse OCC activity with VIX implied volatility.
- **Tail Skew** (`tail-skew-context`, Cboe SKEW) is **display-only** tail-skew context — **not** VIX, not 0DTE/GEX, not a score input ([v1.9e.5 mapping](./TAIL_SKEW_MAPPING_DECISION.md)).

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

**Outcome:** **YELLOW** — Tier-1 universe **TQQQ/SQQQ, UPRO/SPXU, TNA/TZA**; manual AUM from issuer pages + index moves via QQQ/SPY/IWM proxies; estimated rebalance notional proxy feasible. **v1.1c:** production artifact validated via `ghostflow:validate-artifacts`. **v1.1d:** display-only public card (`levered-etf-rebalance`); **not scored**. **v1.1e:** mapping decision — display-only; `mappingStatus: not_final`; MOCK **55** unchanged. **v1.1e-calibration:** fixed-current-AUM return-sensitivity study **done** (full Stooq history since 2010-02-11). **v1.1f:** score-wiring gate only after product approval — still **not** approved.

### D) Retirement-flow pressure (v1.2a) — **FEASIBILITY COMPLETE**

**Feasibility memo:** [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md)

**Outcome:** **YELLOW** — no retirement-labeled weekly **flow** series suitable for score without overlapping existing ICI artifacts. Best path: **quarterly ICI Retirement Market asset growth** (optional Z.1 cross-check) as a **structural** proxy — **display-only preferred** if developed; keep `retirementFlowPressureProxy` **MOCK 58** for now. **v1.2f** score-wiring gate only if product-approved after v1.2b–e.

### E) 0DTE / options — display proxy shipped (v1.4d–e); true 0DTE/GEX gated

**Feasibility memo:** [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) · **Spike:** `npm run ghostflow:options-data-spike`

**Outcome (v1.4a):** **YELLOW leaning RED** for true public **0DTE / GEX**; **YELLOW** for aggregate display-only proxy.

**Outcome (v1.4b):** **Outcome A FAIL** — no stable **0DTE** columns in two Cboe monthly XLSX (Apr/May 2026). **Outcome B PASS** — OCC daily lock: **`indexOptionsContracts`** (+ total/equity/ETF/PCR). **Outcome C FAIL** — public aggregate path exists.

- **v1.4d complete:** Production [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) + display card **`options-activity-proxy`** / **Index Options Intensity Proxy** (OCC Daily Volume Statistics; Index/Others column); official preflight via `ghostflow:options-data-spike`; **no** score wiring.
- **v1.4c complete:** [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) — example JSON + validator.
- Cboe monthly **SPX options ADV** (thousands contracts) — optional supplementary monthly context; **not** 0DTE.
- True **0DTE / Gamma Pressure** or GEX: **paid/vendor** (DataShop, ORATS, SpotGamma, etc.).
- **v1.4e complete:** [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) — display-only; `mappingStatus` **not_final**; no score mapper; v1.4f discouraged.
- **v1.4f** score-wiring discouraged (VIX overlap).

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
| **OCC daily volume (production)** | `options-activity-proxy` display card | [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) — display-only; `indexOptionsContracts` (Index/Others); [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) daily OCC row; not scored ([v1.4e mapping](./OPTIONS_ACTIVITY_MAPPING_DECISION.md)) |
| **Cboe monthly XLSX (supplementary)** | Optional SPX ADV context | SPX options ADV row; **no** 0DTE columns in Apr/May 2026 XLSX |
| **Paid vendor (0DTE / GEX)** | True 0DTE or gamma only with license | Outside public repo artifacts |
| **ICI Retirement Market (v1.2b+ candidate)** | `retirementFlowPressureProxy` (display-first) | Quarterly assets — see [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md); do not double-count ICI equity flows |

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

*Historical rows below show incremental milestones (e.g. `publicSignals` +7, `publicSignalCount` +8, count **9** at v1.2d). **Current equity `publicSignalCount` is **13** (v1.9e.4+).*

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
| **v1.1e-calibration** | Levered ETF fixed-current-AUM return-sensitivity study (research only) | **Done** — [LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md](./LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md) incl. full-history Stooq run (N≈4099); not true historical AUM calibration; **v1.1f** gated on product approval |
| **v1.1f** | Levered ETF score-wiring gate (if product-approved) | `buildSnapshot` merge; MOCK **55** replacement; methodology + tests — **after v1.1e-calibration** |
| **v1.2a** | Retirement-flow pressure feasibility | **Done** — [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md); YELLOW; MOCK **58** unchanged |
| **v1.2b** | Retirement-flow artifact design | **Done** — [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md); example JSON + validator + tests |
| **v1.2c** | Retirement-flow production artifact candidate | **Done** — [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) §2 ICI Table 1 lock; `retirementFlowPressureProxy.v1.json` + `validate-artifacts`; MOCK **58** unchanged |
| **v1.2d** | Retirement display-only card | **Done** — `retirement-asset-growth`; `publicSignalCount` 9; MOCK **58** unchanged; overlap review before v1.2f |
| **v1.2e** | Retirement calibration / mapping decision | **Done** — [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md) + [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md); display-only; MOCK **58**; `mappingStatus` **not_final** |
| **v1.2f** | Retirement score-wiring gate (if product-approved) | Gated — discouraged without explicit product approval |
| **v1.4a** | 0DTE / options data-path feasibility | **Done** — [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md); YELLOW leaning RED (true 0DTE/GEX); placeholder unchanged |
| **v1.4b** | Options source spike / column lock | **Done** — `options-data-spike.ts`; Outcome A **FAIL**, B **PASS** (OCC `indexOptionsContracts`); Cboe SPX ADV supplementary |
| **v1.4c** | Options activity artifact design | **Done** — [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md); example-only JSON; validator in `optionsActivityProxy.ts`; not in `ghostflow:check` |
| **v1.4d** | Options production artifact + display-only card | **Done** — official OCC CSV preflight; `publicSignalCount` **10**; `odte-options` placeholder suppressed; not scored |
| **v1.4e** | Options mapping decision | **Done** — [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md); display-only; no mapper; `mappingStatus` **not_final** |
| **v1.4e-calibration** | Options OCC history study (optional, research only) | **Future** — Index/Others percentiles for display context; not required for v1.4e; excluded from `ghostflow:check` |
| **v1.4f** | Options score-wiring gate (if product-approved) | **Gated / discouraged** — VIX overlap; explicit product approval required |
| **v1.5a** | Current-state audit / release checkpoint | **Done** — docs alignment with live dashboard; scores **62 / 58 / 66** unchanged; canonical state at top of this roadmap |
| **v1.6a** | Passive stress-zone language audit | **Done** — [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md); model-stress zone not tripwire; copy only |
| **v1.6b** | Passive Endgame Scenario explainer | **Done** — [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md); educational UI + doc; not scored; no new artifacts |
| **v1.7a** | Treasury Plumbing feasibility | **Done** — [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md); feasibility memo; lane shipped v1.7e |
| **v1.7a.1** | Treasury CFTC PRE contract-discovery spike | **Done** — `ghostflow:treasury-cftc-pre-spike`; TFF `gpe5-46if` UST codes verified; **GREEN**; not in `ghostflow:check`; no artifact |
| **v1.7b** | Treasury Futures Positioning artifact design | **Done** — [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md); example JSON + validator/tests |
| **v1.7c** | Bond Neglect / Long-End Income Lens artifact design | **Done** — [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md); `treasury-long-end-income-lens` example + validator/tests; FRED IDs candidate until v1.7d.1 production |
| **v1.7d** | Treasury Plumbing production — futures positioning | **Done** — `treasury-futures-positioning-proxy` production JSON + loader + `ghostflow:check` |
| **v1.7d.1** | Treasury Plumbing production — long-end income lens | **Done** — [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md); FRED-verified production JSON (asOf 2026-06-02); no score/`publicSignalCount` change |
| **v1.7e** | Treasury Plumbing display-only UI section | **Done** — separate dashboard lane (`GhostFlowTreasuryPlumbing`); both production artifacts visible; no `buildSnapshot` merge; `publicSignalCount` **10** unchanged |
| **v1.7f** | Treasury Plumbing mapping decision | **Done** — [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md); display-only for both artifacts; no mapper / no score / `mappingStatus` **not_final** |
| **v1.7f-calibration** | Treasury CFTC + FRED history studies (optional) | **Future** — research-only; may inform display percentiles only |
| **v1.7g** | Treasury Plumbing score gate | **Not approved** — discouraged by default |
| **v1.7** | Treasury Plumbing release checkpoint / consistency audit | **Done** — docs alignment; equity state unchanged; Treasury lane documented as separate |
| **v1.8a** | Current State / Data Quality Inventory | **Done** — [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md); docs-only; no score/artifact/UI change |
| **v1.8b** | Mock Score Retirement Decision | **Done** — [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md); keep-MOCK decisions for three passive inputs; no wiring/replacements/retirements approved |
| **v1.8c** | Artifact Freshness & `dataQuality` Consistency Pass | **Done** — [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md); policy documented; no JSON/score/UI changes |
| **v1.8d** | Operator Refresh Discipline | **Done** — [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md); docs-only operator workflow; taxonomy, cadence map, validation matrix; checklist tightened; no JSON/score/UI changes; v1.8c.1 / v1.8f / score wiring **not** approved |
| **v1.8e** | Documentation Consolidation | **Done** — [README.md](./README.md); docs-only index + targeted stale-line fixes; no file moves/archives |
| **v1.8f** | UI Clarity / Methodology Polish | **Done** — UI/copy hierarchy polish; no score/artifact/data changes; v1.8 theme complete |
| **v1.8c.1** | Metadata-Only Cleanup | **Done** — stale display-only/Treasury `source.note` and `caveats` text only; no values, `dataQuality`, `mappingStatus`, score, UI, or runtime changes |
| **v1.8g** | Treasury Calibration Research-Only | **Optional / pause** — no percentiles/bands/score in UI; decide next theme after v1.8 |
| **v1.8h** | Passive-Flow Next-Source Feasibility | **Optional** — ICI non-overlap review |
| **v1.8i** | Score Wiring Gate | **Not approved** — discouraged (v1.0c / v1.1f / v1.2f / v1.4f / v1.7g) |
| **v1.9a** | Passive Supply & Concentration Research Backlog | **Done** — [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md); docs-only; no score/artifact/UI changes |
| **v1.9b** | Cap-Weight Concentration Premium Feasibility | **Done** — [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md); YELLOW leaning GREEN; SPY/RSP primary; docs-only |
| **v1.9b.1** | Cap-Weight Premium CSV Study | **Done** — [`cap-weight-premium-study.ts`](../scripts/ghostflow/cap-weight-premium-study.ts); operator CSVs only; not in `ghostflow:check` |
| **v1.9b.1a** | Cap-Weight Premium Calibration Study | **Done** — [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md); real SPY/RSP operator run; docs-only |
| **v1.9b.2** | Cap-Weight Premium Artifact Design | **Done** — [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md); display-only default; docs-only |
| **v1.9b.3** | Cap-Weight Premium Example JSON + Validator | **Done** — [`capWeightPremiumProxy.v1.example.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json); no production JSON; not in `validate-artifacts` |
| **v1.9b.4** | Cap-Weight Premium Production Artifact + Display Card | **Done** — reference-aligned **2026-05-22** study; display-only; `publicSignalCount` **11 → 12**; not scored |
| **v1.9b.5** | Cap-Weight Premium Mapping Decision | **Done** — [CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md); display-only by default; no score mapper selected |
| **v1.9b.6** | Cap-Weight Premium Score Gate | **Future** — discouraged; **not approved** |
| **v1.9c** | Passive Supply / Float Absorption Feasibility | **Done** — [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md); YELLOW leaning RED; docs-only |
| **v1.9c.1** | Passive Supply Source Spike | **Done** — [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md); docs-only source inventory; Lane D event path and Lane A/B quarterly context partially viable |
| **v1.9c.2** | Passive Supply Event Artifact Design | **Done** — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md); Lane D event proxy; docs-only |
| **v1.9c.2a** | Operator Event Intake Template | **Done** — appendix in [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) §14 |
| **v1.9c.3** | Index Inclusion Event Example JSON + Validator | **Done** — [`indexInclusionEventProxy.v1.example.json`](../data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json); not in `validate-artifacts` |
| **v1.9c.4a** | Index Inclusion Event Operator Provenance Checklist | **Done** — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) §14; docs-only intake discipline |
| **v1.9c.4b** | Index Inclusion Event Operator Collection Pass | **Done** — [INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md](./INDEX_INCLUSION_EVENT_OPERATOR_INTAKE.md) |
| **v1.9c.4** | Index Inclusion Event Production Artifact + Display Card | **Done** — 4 operator-verified Nasdaq rows; display-only; `publicSignalCount` **11**; not scored |
| **v1.9c.5** | Index Inclusion Event Mapping Decision | **Done** — [INDEX_INCLUSION_EVENT_MAPPING_DECISION.md](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md); display-only by default; no score mapper selected |
| **v1.9c.6** | Index Inclusion Event Score Gate | **Future** — discouraged / not approved |
| **v1.9d** | Public Signal Inventory / Display-Only Consistency Cleanup | **Done** — [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md); docs-only; `publicSignalCount` **12** (6 score-fed + 6 display-only); Treasury separate; no score/artifact/UI changes |
| **v1.9d.future** | Systematic Re-Risking Proxy Feasibility | **Future** — research-only; backlog candidate #3 in [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) |
| **v1.10** | Mock Score Retirement / Score Integrity Roadmap | **Done** — [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md); docs-only; three MOCK passive inputs documented; no score/artifact/UI changes; no score gates approved |
| **v1.10a** | UI Disclosure Cleanup | **Done** — trust badges (6 display-only), ScoreCard mixed disclaimer, Methodology PUBLIC/MOCK labels, Dashboard scope + ScoreDrivers footer; [MOCK_SCORE_RETIREMENT_ROADMAP.md](./MOCK_SCORE_RETIREMENT_ROADMAP.md); no score/artifact change |
| **v1.10b** | Coverage Copy Test Harness Integration | **Done** — `ghostflowCoverageCopy.test.ts` wired into `test:ghostflow` / `ghostflow:check`; no score/artifact/UI/runtime change |
| **v1.10c** | Score Reproduction Baseline / Mock Contribution Audit | **Done** — [SCORE_REPRODUCTION_BASELINE.md](./SCORE_REPRODUCTION_BASELINE.md); docs-only canonical production score baseline; distinguishes mock snapshot defaults from production merged score inputs; no score/artifact/UI/runtime/test/package changes |
| **v1.10d** | Mock Retirement Score-Impact Scenario Study | **Done** — [MOCK_SCORE_IMPACT_SCENARIOS.md](./MOCK_SCORE_IMPACT_SCENARIOS.md); docs/research-only; scenario table vs v1.10c baseline; no score/artifact/UI/runtime/test/package changes; no score gates approved |
| **v1.10e** | MOCK Score No-Change Policy / Disclosure Finalization | **Done** — [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md); docs-only; Option A selected (keep model + disclosure); **v1.10 score-integrity sequence complete**; gates remain closed; next GhostFlow priority product-owner selected |
| **v1.9e** | Protection Bid / Correlation Dispersion Feasibility | **Done** — [PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md](./PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md); docs-only; **YELLOW** lane rating; SKEW-first display-only path; correlation dispersion deferred to **v1.9e.1** source spike; no score/artifact/UI/runtime; `publicSignalCount` **12** unchanged |
| **v1.9e.1** | Protection Bid Source Spike / Operator Source Review | **Done** — [PROTECTION_BID_SOURCE_SPIKE.md](./PROTECTION_BID_SOURCE_SPIKE.md); SKEW source lock **PASS** (`DATE,SKEW`; v1.9e.1a column lock); correlation **SKIPPED**; no score/artifact/UI/runtime/package; `publicSignalCount` **12** unchanged |
| **v1.9e.2** | Tail Skew Context Artifact Design | **Done** — [TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md](./TAIL_SKEW_CONTEXT_ARTIFACT_DESIGN.md); docs-only; SKEW-only display-only schema; no JSON/UI/score/runtime; `publicSignalCount` **12** unchanged |
| **v1.9e.3** | Tail Skew Context Example Artifact + Validator Scaffold | **Done** — example JSON + validator; `publicSignalCount` **12** unchanged |
| **v1.9e.4** | Tail Skew Context Production Artifact + Display-Only Card | **Done** — [`tailSkewContext.v1.json`](../data/ghostflow/artifacts/tailSkewContext.v1.json); reference-aligned **2026-05-22**; display-only; `publicSignalCount` **12 → 13**; not scored |
| **v1.9e.5** | Tail Skew Context Mapping Decision | **Done** — [TAIL_SKEW_MAPPING_DECISION.md](./TAIL_SKEW_MAPPING_DECISION.md); docs-only; Option A display-only; `mappingStatus` **not_final**; no mapper; **v1.9e.6 discouraged / not approved** unless product reopens score gate |
| **v1.12** | Public Signal Integrity Checkpoint | **Done** — [GHOSTFLOW_PUBLIC_SIGNAL_INTEGRITY_CHECKPOINT.md](./GHOSTFLOW_PUBLIC_SIGNAL_INTEGRITY_CHECKPOINT.md); docs + UI-copy cleanup; `publicSignalCount` **13** (6 score-fed + 7 display-only); no score/artifact/runtime changes |
| **v1.13** | Current Data Readiness Audit | **Done** — [CURRENT_DATA_READINESS_AUDIT.md](./CURRENT_DATA_READINESS_AUDIT.md); docs-only; audit date **2026-06-22**; dashboard reference **2026-05-22**; no refresh |
| **v1.14** | Reference-Date & Operator Policy | **Done** — [REFERENCE_DATE_AND_OPERATOR_POLICY.md](./REFERENCE_DATE_AND_OPERATOR_POLICY.md); docs-only; daily score-fed bump gate (vol-regime + breadth); reference remains **2026-05-22** until **v1.15** |
| **v1.15** | Operator Refresh Execution | **Future** — artifact JSON + reference bump per v1.14 policy; score-impact report required |
| **v1.9f** | Mega-Cap Autocorrelation / Flow Momentum Feasibility | **Future** — optional or folded into v1.9b |
| **v1.9g** | Valuation Stress Context Feasibility | **Future** — likely outside GhostFlow core |
| **Credit Catalyst / AI Financing Stress** | Outside GhostFlow | **Future** — possible separate lane (GhostRegime / GhostYield / Credit Plumbing) |

**Treasury Plumbing:** Separate from the equity Research Composite, `publicSignalCount`, and Passive Pressure. Display-only context cards — not investment advice; no Treasury status score. See [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) · [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md).

---

## 6. Future research backlog (v1.9+)

Canonical backlog: [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) (v1.9a).

Future research candidates inspired by passive market-structure / Mike Green review — **not** approved for implementation:

| Candidate | Suggested phase | GhostFlow fit |
|-----------|-----------------|---------------|
| Cap-Weight Concentration Premium Lens | **v1.9b.5 Done** — cap-weight track complete through mapping decision | Core — [feasibility](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) · [calibration](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) · [artifact design](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) · [mapping decision](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) |
| Passive Supply / Float Absorption Lens | **v1.9c.5 Done** · **v1.9c.6 discouraged** | Core — [feasibility](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) · [source spike](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) · [artifact design](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) · [mapping decision](./INDEX_INCLUSION_EVENT_MAPPING_DECISION.md) |
| Systematic Re-Risking / De-Risking Lens | v1.9d.future (backlog) | Core — long-term MOCK retirement path |
| Protection Bid / Correlation Dispersion Lens | **v1.9e.5 Done** — [mapping decision](./TAIL_SKEW_MAPPING_DECISION.md); **v1.9e.6 discouraged** | Adjacent — avoid VIX double-count |
| Mega-Cap Autocorrelation / Flow Momentum Lens | v1.9f or v1.9b appendix | Related to cap-weight premium |
| Valuation Stress / Individual-Security CAPE Lens | v1.9g or outside GhostFlow | Outside composite |
| Credit Catalyst / AI Financing Stress | Outside GhostFlow | Separate product lane |

**Not approved:** v1.9b.6 score gate for cap-weight premium. v1.9b.4 production artifact + display card shipped; **v1.9b.5 mapping decision complete** — display-only by default; no score mapper selected; `publicSignalCount` **12** unchanged.

**Not approved:** v1.9c.6 score gate for index inclusion events. v1.9c.4 production artifact + display card shipped; **v1.9c.5 mapping decision complete** — display-only by default; no score mapper selected; `publicSignalCount` **12** unchanged.

**Not approved:** v1.9e.6 score gate for Tail Skew Context. v1.9e.4 production artifact + display card shipped; **v1.9e.5 mapping decision complete** — display-only by default; no score mapper selected; VIX remains score-fed vol input; `publicSignalCount` **13** unchanged.

---

## Open questions

1. ~~**CFTC TFF mapping (v0.9d design):**~~ **Resolved:** Display/artifact use Mapping A ([v0.9d design](./CFTC_TFF_ARTIFACT_DESIGN.md)). **Calibration (v1.0a):** [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md). **Decision (v1.0b):** [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — CFTC display-only; future score candidate Mapping C after rename; **v1.0c** gated on product approval.
2. ~~**`modelZoneProximity` mapping (v0.9b):**~~ **Resolved:** Reuse `mapDistanceToZoneNumericValue` as-is (documented in merge + methodology).
3. ~~**Levered ETF scope:**~~ **Resolved (v1.1a–b):** Tier-1 six-ticker universe; single-session `underlyingReturnPct`; formula in [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md). ~~**Levered ETF mapping (v1.1e):**~~ **Resolved:** [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) — display-only; MOCK **55**. ~~**Levered ETF calibration (v1.1e-calibration):**~~ **Resolved:** [LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md](./LEVERED_ETF_REBALANCE_CALIBRATION_STUDY.md) — full fixed-current-AUM return-sensitivity run complete; **v1.1f** score wiring gated on product approval only.
4. **0DTE data path:** **Display proxy shipped (v1.4d–e):** OCC Index/Others via `options-activity-proxy` — [mapping decision](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) locks display-only; true 0DTE/GEX → paid/vendor; **v1.4f** score gate discouraged (VIX overlap).
5. ~~**Retirement flows:**~~ **Resolved (v1.2a–b):** [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) + [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) — **YELLOW**; ICI Retirement Market primary; exact ICI table/rows → **v1.2c** operator extract; composite membership → **v1.2d** decision.
6. **Treasury Plumbing (v1.7a–f):** [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) · [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) — production artifacts, UI lane, and **display-only mapping decision** complete. Open: optional **v1.7f-calibration**; **v1.7g** score gate discouraged. Treasury lane **separate from equity composite**; equity `publicSignalCount` **13** unchanged by Treasury refresh.

---

## Related documents

Full categorized index: [README.md](./README.md). Key canonical docs:

- [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) — **v1.8a canonical inventory** (score-fed, display-only, MOCK, derived, Treasury)
- [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) — **v1.9a future research backlog** (passive supply & concentration; no implementation approved)
- [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) — **v1.9b cap-weight premium feasibility** (YELLOW leaning GREEN; SPY/RSP; display-only default)
- [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) — **v1.9b.1a calibration study** (real operator run; exit 0; docs-only)
- [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) — **v1.9b.2 artifact design** (display-only default; docs-only)
- [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) — **v1.9c passive supply / float absorption feasibility** (YELLOW leaning RED; docs-only)
- [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) — **v1.9c.1 source spike** (docs-only; partial source locks; no code/artifact/UI/score changes)
- [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) — **v1.9c.2 index inclusion event proxy artifact design** (Lane D; display-only default; docs-only)
- [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) — **v1.8b mock retirement decision** (keep-MOCK ×3; no wiring approved)
- [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md) — **v1.8c freshness & dataQuality audit** (policy memo; no JSON changes)
- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) — v0.9c TFF/COT feasibility (YELLOW)
- [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) — v1.0a historical calibration (research)
- [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — v1.0b mapping/product decision (display-only; v1.0c score gate)
- [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) — v1.2a retirement-flow feasibility (YELLOW; display-first)
- [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) — v1.2b artifact design (example JSON + validator; no score/UI merge)
- [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md) — v1.2e quarterly ICI Table 1 calibration (research-only)
- [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md) — v1.2e mapping/product decision (display-only; v1.2f score gate)
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
- [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) — v1.4a 0DTE/options data-path feasibility (YELLOW leaning RED; display proxy shipped v1.4d–e)
- [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) — v1.4c/d OCC index options intensity proxy (production JSON + display card v1.4d)
- [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) — v1.4e display-only mapping decision; v1.4f gated
- [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md) — v1.6a passive-share / model-stress-zone phrasebook
- [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) — v1.6b educational passive-endgame scenario explainer (not scored)
- [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) — v1.7a Treasury Plumbing feasibility + v1.7 release checkpoint (separate display-only lane; live v1.7e)
- [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) — v1.7b/d Treasury futures positioning (production + display card v1.7e)
- [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) — v1.7f Treasury Plumbing mapping decision (display-only; no score)
