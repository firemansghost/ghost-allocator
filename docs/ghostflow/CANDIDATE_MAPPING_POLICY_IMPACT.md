# GhostFlow Candidate Mapping Policy — Impact Inventory

**Status:** Read-only impact audit. **This memo authorizes no production writes and contains no implementation.**

**Recorded:** 2026-08-26  
**Starting `main`:** `76bf115759083963279c703a760d483afe129194` (PRs **#140–#145** merged)  
**Decision gate:** Closed by [DECISIONS.md](../project-ops/DECISIONS.md) entry *2026-08-26 — GhostFlow candidate production-mapping policy*

Cross-reference: [CANDIDATE_GENERATION_DESIGN.md](./CANDIDATE_GENERATION_DESIGN.md) (architecture; mapping-policy gate now satisfied).

---

## 1. Approved mapping policy

Bobby approved on **2026-08-26** (full text in DECISIONS):

| Area | Rule |
|------|------|
| **A. Long-End `seriesDefinition`** | New Board H.15 candidates use `frb_h15_treasury_long_end_income_lens_v1`. Do not retain `fred_treasury_long_end_income_lens_v1` merely for validator continuity. Semantic id describes the Board H.15 product contract, not transport encoding. No `sdmx` in the semantic identifier. |
| **B. Long-End Board source contract** | Required primary: `RIFLGFCY30_N.B`, `RIFLGFCY30_XII_N.B`. Optional context: `RIFLGFCY02_N.B`, `RIFLGFCY05_N.B`, `RIFLGFCY10_N.B`. Forbidden in new Board-native candidates: `T10YIE`, `tenYearBreakevenInflationPct`, derived breakeven. Legacy FRED production artifact remains valid until future human-approved promotion. Transitional validator supports **both** legacy FRED and Board-native shapes with internal consistency; **no hybrids**. |
| **C. `dataQuality`** | Introduce `verified_automated` for adapter-produced candidates passing the applicable production validator. Do not label automated candidates `verified_manual`. Narrowest change for the three candidate-enabled artifacts only. |
| **D. `publishedAt`** | Optional for automated candidate production shapes. Map only when durable provenance contains defensible `sourcePublishedAt`; otherwise omit. No fabrication from `retrievedAt`, generation time, report date heuristics, or holiday calendars. Freshness semantics unchanged in this docs PR. |
| **E. Authorization boundary** | Authorizes future types, validators, source-contract truth, display-copy truth, and pure mappers only. Does **not** authorize generator, candidate writer, production writes, promotion, history, workflows, scores, MOCK, `publicSignalCount`, reference-date changes, VIX, breadth, or Gate C. |

---

## 2. Current production-contract mismatches

| Artifact | Committed production | Approved automated candidate contract | Gap |
|----------|---------------------|--------------------------------------|-----|
| `treasuryLongEndIncomeLens` | `seriesDefinition`: `fred_treasury_long_end_income_lens_v1`; FRED `source` block with six series including `T10YIE`; `tenYearBreakevenInflationPct` populated | `frb_h15_treasury_long_end_income_lens_v1`; Board H.15 release-level source; five Board series IDs; no breakeven | Largest mismatch; requires transitional validator |
| All three | `publishedAt` required; validator rejects absent | `publishedAt` optional when `verified_automated` and no defensible `sourcePublishedAt` | Type + validator change |
| All three | `dataQuality`: only `verified_manual` \| `manual_unverified` | `verified_automated` permitted for adapter candidates | Per-artifact union extension |
| CFTC pair | Source metadata matches CFTC PRE | Same (no change) | Mapper uses existing static CFTC source constants |
| Adapters | None emit `sourcePublishedAt` today | Mappers omit `publishedAt` (approved) | No adapter change required for PR A |

Production JSON under `data/ghostflow/artifacts/` is **unchanged** by this gate.

---

## 3. SystematicFlowProxy impact

### Types (`lib/ghostflow/artifacts/types.ts`)

| Field | Current | PR A change |
|-------|---------|-------------|
| `publishedAt` | `string` (required) | `string \| undefined` (optional) |
| `dataQuality` | `'verified_manual' \| 'manual_unverified'` | add `'verified_automated'` |
| `seriesDefinition` | `'cftc_tff_futures_only_leveraged_funds_equity_basket'` | unchanged |
| `source` | `ArtifactSource` | unchanged |

Shared type note: `GhostFlowArtifactDataQuality` exists at file top but artifact interfaces use **inline unions**. Extend only `SystematicFlowProxyArtifactV1.dataQuality` — do not widen all 15+ artifact interfaces.

### Validator (`lib/ghostflow/artifacts/systematicFlowProxy.ts`)

| Check | Current | PR A |
|-------|---------|------|
| **A. `publishedAt`** | Required ISO date; cannot precede `asOf` | Required for `verified_manual` / `manual_unverified`; optional (absent or valid ISO) for `verified_automated`; if present, cannot precede `asOf` |
| **B. `dataQuality`** | `verified_manual` \| `manual_unverified` | add `verified_automated` |
| **C. `seriesDefinition`** | Locked to equity basket literal | unchanged |
| **D. `source`** | `source.name` required | unchanged |
| **E. Source-specific** | CFTC MVP contract codes, basket reconciliation | unchanged |
| **F. Forbidden keys** | none at root | unchanged |
| **G. Freshness** | `systematicFlowProxyFreshnessAnchor`: **`publishedAt ?? asOf`** already | No freshness semantic change; optional `publishedAt` safe |

Existing pure helpers sufficient for mapper: `computeBasketMetrics`, `computeNetContracts`, `computeNetPctOi`, `computeDeltaNetContracts`, `mapBasketNetPctOiToPressureScore`, `resolveBasketDirection`.

Static metadata source: constants already in `systematicFlowProxy.ts` (`SYSTEMATIC_FLOW_PROXY_SIGNAL_ID`, `TFF_FUTURES_ONLY_DATASET_ID`, card caveats); CFTC source name/URL pattern from production JSON.

---

## 4. TreasuryFuturesPositioningProxy impact

### Types (`lib/ghostflow/artifacts/types.ts`)

| Field | Current | PR A change |
|-------|---------|-------------|
| `publishedAt` | `string` (required) | optional |
| `dataQuality` | `'verified_manual' \| 'manual_unverified'` | add `'verified_automated'` |
| `seriesDefinition` | `'cftc_tff_futures_only_treasury_leveraged_funds_basket_v1'` | unchanged |
| `source` | `ArtifactSource` | unchanged |

### Validator (`lib/ghostflow/artifacts/treasuryFuturesPositioningProxy.ts`)

| Check | Current | PR A |
|-------|---------|------|
| **A. `publishedAt`** | Required | Same conditional optional rule as systematic |
| **B. `dataQuality`** | two values | add `verified_automated` |
| **C. `seriesDefinition`** | locked | unchanged |
| **D. `source`** | name + url required | unchanged |
| **E. Source-specific** | Core contract codes, basket reconciliation vs rows | unchanged |
| **F. Forbidden keys** | score + basis-overclaim scan | unchanged |
| **G. Freshness** | **No dedicated freshness function today** | Display (`treasuryPlumbingDisplay.ts`) already treats `publishedAt` as optional in detail rows; no PR A blocker |

Mapper helpers: `computeNet`, `computeGross`, `computePctOfOpenInterest`, `computeBasketMetricsFromRows`, `classifyDirection` (internal). Mapper needs **static code→tenor/role lookup** (from production JSON / `TREASURY_TIER1_CORE_CODES`) to map `CftcTffTreasuryNormalizedContract` → `TreasuryFuturesContractRowV1` — pure, no network.

---

## 5. TreasuryLongEndIncomeLens impact

### Types (`lib/ghostflow/artifacts/types.ts`)

| Field | Current | PR A change |
|-------|---------|-------------|
| `publishedAt` | `string` (required) | optional |
| `dataQuality` | `'verified_manual' \| 'manual_unverified'` | add `'verified_automated'` |
| `seriesDefinition` | `'fred_treasury_long_end_income_lens_v1'` only | union: `'fred_treasury_long_end_income_lens_v1' \| 'frb_h15_treasury_long_end_income_lens_v1'` |
| `source` | `TreasuryLongEndIncomeLensSourceV1` (name, url, note, series[]) | **Reuse existing shape** for Board branch |

Comment on line 876 (`/** FRED Treasury long-end… */`) should be updated in PR A to reflect dual contract.

### Validator (`lib/ghostflow/artifacts/treasuryLongEndIncomeLens.ts`)

| Check | Current | PR A |
|-------|---------|------|
| **A. `publishedAt`** | Required | Conditional optional (same rule) |
| **B. `dataQuality`** | two values | add `verified_automated` (Board branch); legacy unchanged |
| **C. `seriesDefinition`** | single FRED lock | Branch on discriminator (§6) |
| **D. `source`** | Structural validation only (no FRED ID lock) | Board branch: enforce five-series universe, roles, forbidden IDs |
| **E. Source-specific** | None today for FRED vs Board | Board: release URL, no FRED identifiers in `source.series[].id` |
| **F. Forbidden keys** | score/advice scan | unchanged |
| **G. Freshness** | No freshness function | Display already optional `publishedAt`; anchor would be `publishedAt ?? asOf` if added later |

Legacy production (`data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`) must continue validating unchanged.

---

## 6. Long-End transitional validation design

**Discriminator:** `seriesDefinition` (explicit; do not infer from mixed fields).

### Legacy FRED branch — `fred_treasury_long_end_income_lens_v1`

- Retain current validation behavior for committed production artifact.
- `tenYearBreakevenInflationPct` optional field allowed.
- FRED-oriented `source` block allowed (including `T10YIE` in `source.series`).
- `verified_manual` / `manual_unverified` only (no `verified_automated` on legacy branch).
- `publishedAt` remains **required** on legacy branch (existing manual production shape).

### Board-native branch — `frb_h15_treasury_long_end_income_lens_v1`

- `mode: 'production'`; `designOnly` must not be true.
- `mappingStatus`: `not_final` (artifact + observations).
- `dataQuality`: `verified_automated` permitted (and expected for mapper output).
- `publishedAt`: optional per §1.D.
- `source`:
  - `name`: Board H.15 (not FRED).
  - `url`: `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` (canonical release).
  - `note`: Board-native template (no FRED API references).
  - `series`: exactly the approved five IDs with `primary` / `context` roles:
    - Primary: `RIFLGFCY30_N.B`, `RIFLGFCY30_XII_N.B`
    - Context: `RIFLGFCY02_N.B`, `RIFLGFCY05_N.B`, `RIFLGFCY10_N.B`
  - Forbidden in `source.series[].id`: `T10YIE`, `DGS*`, `DFII*`, any FRED-only identifier.
- `observations`:
  - Required: `thirtyYearNominalYieldPct`, `thirtyYearTipsRealYieldPct`
  - Optional context yields and curve spreads (reconciled via existing helpers)
  - **Forbidden populated:** `tenYearBreakevenInflationPct` (reject if present and numeric)
- **Reject hybrids:** Board `seriesDefinition` + FRED source series, or FRED `seriesDefinition` + Board series IDs, or breakeven on Board branch.

Implementation: refactor `validateTreasuryLongEndIncomeLensArtifact` into `validateLegacyFredLongEnd(...)` and `validateBoardNativeLongEnd(...)` called from a thin dispatcher — **do not** globally loosen checks.

---

## 7. `dataQuality` impact

**Question:** Can `verified_automated` be added only to the three artifact interfaces?

**Answer: Yes.** Each artifact interface declares its own inline union. `GhostFlowArtifactDataQuality` at `types.ts:7` includes `mock_fallback` but is **not** used as the artifact field type. PR A should:

1. Extend unions on `SystematicFlowProxyArtifactV1`, `TreasuryFuturesPositioningArtifactV1`, and `TreasuryLongEndIncomeLensArtifactV1` only.
2. Update the three validators' accepted-value checks.
3. Update `dataQualityLabel()` in `treasuryPlumbingDisplay.ts` for user-visible Treasury cards.
4. **Do not** globally refactor unrelated artifacts or `GhostFlowArtifactDataQuality` unless a compile error forces it (none expected).

Systematic flow display (equity card) may need a parallel label helper if it surfaces `dataQuality` — audit during PR A (`systematicFlowDisplay.ts` if applicable).

---

## 8. `publishedAt` / freshness impact

| Artifact | Freshness today | Safe omit `publishedAt`? | PR A change |
|----------|----------------|-------------------------|-------------|
| **Systematic** | `systematicFlowProxyFreshnessAnchor`: **`publishedAt ?? asOf`** | Yes | Validator: optional when `verified_automated` |
| **Treasury futures** | No artifact freshness function | Yes — display uses `if (artifact.publishedAt)` | Validator: optional when `verified_automated` |
| **Long-End** | No artifact freshness function | Yes — display uses `if (artifact.publishedAt)` | Validator: optional on Board + automated branch |

**Adapter reality:** CFTC and H.15 adapters do **not** emit `sourcePublishedAt` in provenance today (confirmed in adapter tests). Approved mapper behavior: **omit `publishedAt`** for initial automated candidates.

**PR A blockers:** None identified. No test or loader **requires** `publishedAt` for display availability.

**Future (out of scope):** If CFTC or Board later expose defensible release dates into provenance, mapper maps `sourcePublishedAt` → `publishedAt` only when present.

---

## 9. Board H.15 source block

**Existing type `TreasuryLongEndIncomeLensSourceV1` is sufficient.** Fields `name`, `url`, `note`, `series[{ id, label, url, role }]` already represent Board H.15 without a second source schema.

PR A should add canonical constants (prefer `frbH15TreasuryYieldsMeta.ts` or `treasuryLongEndIncomeLens.ts`):

| Constant | Value |
|----------|-------|
| Release URL | `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` |
| Series IDs | `RIFLGFCY30_N.B`, `RIFLGFCY30_XII_N.B`, `RIFLGFCY02_N.B`, `RIFLGFCY05_N.B`, `RIFLGFCY10_N.B` |
| `seriesDefinition` | `frb_h15_treasury_long_end_income_lens_v1` |

Note: normalized adapter uses SDMX unique IDs with `H15/H15/` prefix internally; production artifact `source.series[].id` uses the **short Board product IDs** per approved contract (matches DECISIONS H.15 series naming, not transport encoding).

Smallest type delta: extend `seriesDefinition` union only; no new source interface.

---

## 10. Display-copy impact

| Location | Reference | Classification | PR A action |
|----------|-----------|----------------|-------------|
| `treasuryLongEndIncomeLens.ts:31` | `TREASURY_LONG_END_DISPLAY_CARD_CAVEAT` — "FRED long-end…" | Legacy-specific constant | Keep for FRED branch; add Board-native caveat constant or branch on `seriesDefinition` |
| `treasuryPlumbingDisplay.ts:157–159` | `buildIncomeExplanation` — "FRED long-end…", "10Y breakeven" | **User-visible; false after Board promotion** | Branch: Board-native omits breakeven line; FRED branch unchanged until production replaced |
| `treasuryPlumbingDisplay.ts:230` | `statusLabel: 'Verified FRED · Daily · Not scored'` | **User-visible source attribution** | Branch: Board-native → e.g. `Verified Board H.15 · Daily · Not scored`; legacy FRED label until production artifact replaced |
| `treasuryPlumbingDisplay.ts:254` | Detail row "10Y breakeven" | User-visible | Hide or show "—" on Board branch (no breakeven field) |
| `treasuryPlumbingDisplay.ts:82–92` | `dataQualityLabel` | User-visible | Add `verified_automated` → e.g. `Verified automated` |
| `types.ts:876` | Comment "FRED Treasury long-end" | Doc only | Update comment |
| `app/ghostflow/page.tsx`, `GhostFlowDashboard.tsx`, `GhostFlowWatchlist.tsx` | "Treasury Plumbing" product language | Generic — no change | None |
| `scripts/ghostflow/fred-treasury-yields-spike.ts` | FRED research spike | Research quarantine | Out of scope |
| Production JSON | FRED source block | Legacy artifact/history | Leave until promotion |

Display changes are **small and branch-based**; can ship in PR A alongside validators/mappers (no separate display PR required).

---

## 11. Mapper-input sufficiency

Pure mappers are **possible** from normalized fields + static approved metadata + existing pure helpers. **STOP conditions not triggered.**

### `systematicFlowProxy`

| Input | Source |
|-------|--------|
| `scoreContracts`, `vixContext` | `CftcTffSystematicNormalizedFields` |
| `asOf` | `provenance.observationAsOf` |
| `basket` | `computeBasketMetrics(scoreContracts mapped to artifact observation shape)` |
| `datasetId`, `seriesDefinition`, `source`, `updateFrequency` | Static constants / production template |
| `publishedAt` | `provenance.sourcePublishedAt` if present — **currently absent → omit** |
| `dataQuality` | `'verified_automated'` |

Field rename in mapper: normalized observations map 1:1 to `SystematicFlowProxyContractObservation` (same field names).

### `treasuryFuturesPositioningProxy`

| Input | Source |
|-------|--------|
| Core + optional contracts | `CftcTffTreasuryNormalizedFields` |
| Contract rows | Static code→`tenor`/`role`/`usedInAggregate` map + `computeNet`/`computeGross`/`computePctOfOpenInterest` |
| Basket observations | `computeBasketMetricsFromRows` |
| `asOf` | `provenance.observationAsOf` |
| Caveats, source, seriesDefinition | Static constants from artifact module / production template |
| `publishedAt` | omit (no `sourcePublishedAt` today) |

### `treasuryLongEndIncomeLens`

| Input | Source |
|-------|--------|
| Yields | `FrbH15TreasuryNormalizedFields` |
| Curve spreads | `computeCurveSpread(thirtyYear, short)` for 2s/5s/10s when optional yields present |
| `asOf` | `provenance.observationAsOf` |
| Board source block | Static five-series template |
| `seriesDefinition` | `frb_h15_treasury_long_end_income_lens_v1` |
| Breakeven | **Not mapped** (forbidden) |
| `publishedAt` | omit |
| Percentiles / optionalObservations | omit or null (production uses null) |

**Not required:** network fetch, raw response reads, LLM, unapproved methodology, breakeven derivation.

---

## 12. Exact code files expected in implementation (PR A)

| File | Change |
|------|--------|
| `lib/ghostflow/artifacts/types.ts` | Narrow type updates for three artifacts |
| `lib/ghostflow/artifacts/systematicFlowProxy.ts` | Validator + optional static mapper metadata |
| `lib/ghostflow/artifacts/treasuryFuturesPositioningProxy.ts` | Validator + static contract-role map for mapper |
| `lib/ghostflow/artifacts/treasuryLongEndIncomeLens.ts` | Transitional validator, Board constants, legacy + Board branches |
| `lib/ghostflow/treasuryPlumbingDisplay.ts` | `dataQualityLabel`, Board/FRED display branches |
| `lib/ghostflow/refresh/types.ts` | `GhostFlowCandidateMapper` / input types (per design §19) |
| `lib/ghostflow/refresh/candidateMappers/systematicFlowProxy.ts` | **New** pure mapper |
| `lib/ghostflow/refresh/candidateMappers/treasuryFuturesPositioningProxy.ts` | **New** pure mapper |
| `lib/ghostflow/refresh/candidateMappers/treasuryLongEndIncomeLens.ts` | **New** pure mapper |
| `lib/ghostflow/refresh/candidateMappers/index.ts` | **New** registry |
| `lib/ghostflow/refresh/adapters/frbH15TreasuryYieldsMeta.ts` | Optional: export release ZIP URL constant for mapper/validator reuse |

**Explicitly out of scope for PR A:** `data/ghostflow/artifacts/*.json`, generator, CLI, operator runner behavior, promotion, workflows.

---

## 13. Exact test files expected

| File | PR A tests |
|------|-------------|
| `lib/ghostflow/__tests__/systematicFlowProxy.test.ts` | `verified_automated`; absent/present/invalid `publishedAt` |
| `lib/ghostflow/__tests__/treasuryFuturesPositioningProxy.test.ts` | same |
| `lib/ghostflow/__tests__/treasuryLongEndIncomeLens.test.ts` | legacy FRED still validates; Board-native validates; Board+T10YIE fails; Board+breakeven fails; hybrid fails; Board series/roles |
| `lib/ghostflow/__tests__/treasuryPlumbingDisplay.test.ts` | Board display branch; `verified_automated` label |
| `lib/ghostflow/__tests__/candidateMappers/systematicFlowProxyMapper.test.ts` | **New** — normalized → production; validator pass; no `publishedAt` without provenance |
| `lib/ghostflow/__tests__/candidateMappers/treasuryFuturesPositioningProxyMapper.test.ts` | **New** |
| `lib/ghostflow/__tests__/candidateMappers/treasuryLongEndIncomeLensMapper.test.ts` | **New** |

Regression: unrelated artifact validators unchanged (no new `verified_automated` on other artifacts). No live network.

---

## 14. ONE PR vs SCHEMA PR FIRST

**Recommendation: ONE PR**

| Factor | Assessment |
|--------|------------|
| Type compile blast radius | **Narrow** — per-artifact union patches, no shared `dataQuality` refactor |
| Long-End transitional validator | **Localized** — single file, explicit branch, ~100–150 lines |
| Display truth | **Small** — branch on `seriesDefinition` in one display module |
| Mapper scope | Three pure mappers + registry; no I/O |
| Reviewability | Cohesive "mapping policy implementation" story |

SCHEMA PR FIRST would add latency without reducing risk given narrow typing strategy. Revisit only if PR A review discovers unexpected coupling.

---

## 15. Acceptance criteria for next coding PR (PR A)

1. Three pure mappers: normalized + provenance → production-mode artifact; pass existing validators (with authorized extensions).
2. `verified_automated` accepted only on the three artifacts; others unchanged.
3. `publishedAt` omitted when `sourcePublishedAt` absent; present only when defensible; invalid ISO rejected.
4. Long-End: legacy FRED production JSON still validates; Board-native fixture validates; hybrids and forbidden fields fail closed.
5. Board-native Long-End uses `frb_h15_treasury_long_end_income_lens_v1` and five-series source block; no breakeven.
6. Display branches do not show false FRED attribution for Board-native artifacts.
7. No production JSON writes; no generator/CLI; no promotion path.
8. All existing GhostFlow checks green.

---

## 16. Prohibited scope

- Production artifact JSON mutation
- Candidate filesystem writer / generator / CLI
- Promotion workflow or automatic PR creation
- Score, MOCK, `GHOSTFLOW_REFERENCE_AS_OF`, `publicSignalCount` changes
- VIX, breadth, Gate C
- Global `dataQuality` enum refactor across unrelated artifacts
- Fabricated `publishedAt`
- Board-native breakeven or `T10YIE`

---

## 17. Open decisions remaining after this gate

| Decision | Blocks |
|----------|--------|
| Promotion command authorization | PR C / production refresh |
| Same-date mapped-payload promotion without observation-date change | Promotion policy only (not PR A/B) |
| Production artifact promotion from FRED → Board (human timing) | Production refresh |
| Breakeven / `T10YIE` product path | Future product decision |
| Breadth licensed source | Gate C |
| Optional: CFTC/Board adapter emission of defensible `sourcePublishedAt` | Mapper richness only; not blocking PR A |

**Unblocked:** PR A (types + validators + mappers + tests).

---

## 18. Falsifiers

This inventory would be wrong if:

1. A downstream loader **requires** `publishedAt` at runtime for Treasury Plumbing cards (observed: display treats it as optional).
2. Extending `TreasuryLongEndIncomeLensArtifactV1.seriesDefinition` union causes unintended compile errors outside Long-End tests/loaders (audit: only Long-End module + tests reference the literal).
3. Normalized CFTC treasury contracts lack fields to build reconcilable contract rows (observed: all raw positioning fields present; static role/tenor map suffices).
4. Board H.15 normalized fields require breakeven for validator pass (observed: normalize explicitly forbids breakeven emission).
5. Shared `dataQuality` type forces repo-wide changes (observed: inline per-artifact unions — narrow patch viable).

---

*Impact inventory complete. No code, production JSON, or candidate files were modified in this documentation PR.*
