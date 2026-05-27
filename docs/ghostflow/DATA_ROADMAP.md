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

### A) Derive `modelZoneProximity` from existing ICI distance logic (v0.9b)

**Priority:** Highest — reuses provenance already on `distance-65`.

- Set `structuralFragility.modelZoneProximity` from `mapDistanceToZoneNumericValue(deriveDistanceToModelZone(indexAssetSharePercent))` when the ICI passive-share artifact merges (same month-end cadence).
- Status change: MOCK → **DERIVED** (still not a separate manual artifact file).
- Requires: merge change in `buildSnapshot.ts`, tests, UI badge/caveat updates, documented mapping choice (see open question #2).

### B) CFTC Traders in Financial Futures (TFF) feasibility (v0.9c)

**Priority:** Research spike before any artifact or score wiring.

- Candidate: [CFTC Commitments of Traders / Traders in Financial Futures](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) as a **public weekly futures-positioning proxy**.
- **Not** a direct CTA / vol-control / systematic-flow estimate. Positioning in dealer vs asset-manager vs leveraged-funds categories must be mapped deliberately; v0.9c decides whether contract selection and category mapping are defensible for `systematicStrategyPressure` before any score integration.
- Target input (if promoted later): `systematicStrategyPressure` (currently MOCK **62**).

### C) Levered ETF rebalance pressure — methodology only

- Document candidate approach (levered/inverse ETF AUM, issuer rebalance calendars, flow proxies) in a future runbook spike.
- **Do not implement** artifact or merge in v0.9a–c.
- Keep `leveredEtfRebalancePressure` MOCK until methodology and provenance pass guardrails.

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
| **ICI artifacts (existing)** | `passiveShareProxy`, `distance-65`, future `modelZoneProximity` | Narrow fund/ETF denominator; monthly assets / flows tables |
| **CBOE VIX History CSV (existing)** | `optionsVolatilityAmplifier` | Daily close; verified manual extract |
| **ICI ETF net issuance (existing)** | `etfFundFlowImpulse` | Weekly domestic equity row |
| **StockCharts `$SPXA50R` + Barchart `$S5FI` cross-check (existing)** | `breadthWeakness` | Daily participation; vendor methodology may differ |
| **SSGA SPY monthly fact sheet (existing)** | `indexConcentration` | Top-10 **index** weights, not fund weights |
| **CFTC COT / TFF (research)** | `systematicStrategyPressure` (future) | Public weekly **futures positioning** proxy only; category/contract mapping TBD in v0.9c |
| **Issuer / fund AUM & rebalance docs (future)** | `leveredEtfRebalancePressure` | SSGA, ProShares, etc.; needs written rebalance methodology |
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
| **v0.9b** | Wire `modelZoneProximity` from ICI distance-to-65 calculation | `buildSnapshot.ts`, tests, UI copy/badges |
| **v0.9c** | CFTC TFF feasibility spike: contracts, categories, lag, sample extract, mapping memo | Docs and/or exploratory script; **no score wiring** unless mapping is defensible |
| **v0.9d** | Optional CFTC systematic artifact + merge (if v0.9c passes) | New artifact JSON, schema, validate script, merge, tests |
| **v1.0+** | Deeper options (0DTE), levered ETF rebalance, retirement-flow sources | Larger sourcing, possible licensing |

---

## Open questions

1. **CFTC TFF mapping (v0.9c):** Which report slice and futures contracts best support a defensible **weekly futures-positioning proxy** for US equity mechanical pressure—and how should that map to 0–100 for `systematicStrategyPressure`?
2. **`modelZoneProximity` mapping (v0.9b):** Reuse `mapDistanceToZoneNumericValue` as-is for the structural sub-input, or define a separate anchor table with explicit documentation?
3. **Levered ETF scope:** Which product universe and rebalance trigger (AUM threshold, index move, calendar) define `leveredEtfRebalancePressure`?
4. **0DTE data path:** Public aggregate vs paid vendor; whether future options pressure replaces or supplements VIX-based `optionsVolatilityAmplifier`.
5. **Retirement flows:** Is any public series (ICI Flow of Funds, Federal Reserve Financial Accounts) worth a v1.0 research spike?

---

## Related documents

- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — operator refresh cadence for existing public artifacts
- [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) — CBOE VIX
- [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) — Market breadth
- [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) — ETF net issuance
- [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) — Active vs index flows
- [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) — ICI index share + distance-to-65
- [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) — SSGA SPY concentration
