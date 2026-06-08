# Bond Neglect / Long-End Income Lens Artifact Design (GhostFlow v1.7c)

**Status:** v1.7d.1 production artifact candidate — [`treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json) + loader + `validate-artifacts`. **Not** display card, score wiring, or `buildSnapshot` merge.

**Prior work:** [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) (v1.7a) · v1.7b [Treasury Futures Positioning Proxy](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md)

**Example file:** [`data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.example.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.example.json) (`designOnly: true`)

**Production file:** [`data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json) (`dataQuality: verified_manual`; FRED API extract asOf **2026-06-02**)

**Library:** [`lib/ghostflow/artifacts/treasuryLongEndIncomeLens.ts`](../lib/ghostflow/artifacts/treasuryLongEndIncomeLens.ts)

---

## 1. FRED verification (v1.7d.1)

Research spike: `npm run ghostflow:fred-treasury-yields-spike` (not in `ghostflow:check`).

| Method | When |
|--------|------|
| Live CSV | `fred.stlouisfed.org/graph/fredgraph.csv?id=<ID>` (preferred; may timeout in some environments) |
| Local CSV | `npm run ghostflow:fred-treasury-yields-spike -- --local-dir tmp/fred` after operator download |
| FRED API | `FRED_API_KEY` env + `--fred-api` flag (official api.stlouisfed.org; fallback when CSV blocked) |

Production extract (v1.7d.1): **fred_api**, common **asOf 2026-06-02**, `publishedAt` **2026-06-04**. No forward-fill.

## 1a. Not implemented (v1.7d.1)

- `buildSnapshot` / `publicSignalCount` / score sub-input
- Display card / Treasury Plumbing UI lane (v1.7e)
- Runtime dashboard fetching

## 1b. Implemented (v1.7d.1)

- Production `treasuryLongEndIncomeLens.v1.json`
- `loadTreasuryLongEndIncomeLensArtifact()`
- `scripts/ghostflow/validate-artifacts.ts` entry
- `scripts/ghostflow/fred-treasury-yields-spike.ts` (research only)

---

## 2. Naming decision

| Item | Value |
|------|--------|
| `signalId` | `treasury-long-end-income-lens` |
| Artifact file (example) | `treasuryLongEndIncomeLens.v1.example.json` |
| Future UI title | **Long-End Income Lens** |
| Future section | **Treasury Plumbing** |
| Product / memo title | Bond Neglect / Long-End Income Lens |
| `observationType` | `treasury_long_end_income_snapshot` |
| `seriesDefinition` | `fred_treasury_long_end_income_lens_v1` |

**Rejected:** `bondNeglect*` / `longEndIncomeLens` without `treasury` prefix — too easy to read as a trade or allocation signal outside the Treasury lane.

**Equity boundary:** Research Composite, `publicSignalCount` (10), VIX `optionsVolatilityAmplifier`, and equity CFTC `systematic-flow` are unchanged. Treasury Plumbing remains a **separate future lane**.

---

## 3. Source candidates and v1.7d field-lock checklist

**v1.7c posture:** Candidate FRED series IDs only. Example values are **illustrative** (`manual_unverified`, `designOnly: true`). Operator must verify each series before v1.7d production.

### Candidate FRED stack

| Field role | Candidate ID | Verification URL |
|------------|--------------|-------------------|
| 30Y nominal yield | `DGS30` | https://fred.stlouisfed.org/series/DGS30 |
| 30Y TIPS real yield | `DFII30` | https://fred.stlouisfed.org/series/DFII30 |
| 2Y yield (2s30s anchor) | `DGS2` | https://fred.stlouisfed.org/series/DGS2 |
| 5Y yield (5s30s anchor) | `DGS5` | https://fred.stlouisfed.org/series/DGS5 |
| 10Y yield (10s30s anchor) | `DGS10` | https://fred.stlouisfed.org/series/DGS10 |
| 10Y breakeven (context) | `T10YIE` | https://fred.stlouisfed.org/series/T10YIE |

### v1.7d operator checklist (per series)

1. Open verification URL; confirm series title, units (%), and frequency (daily).
2. Record latest observation date available on FRED for `asOf`.
3. Set `publishedAt` to extract date (must be `>= asOf`).
4. Copy official observation into artifact fields; reconcile curve spreads with helpers.
5. Update `source.note` with release/extract provenance; set `dataQuality: verified_manual` only after human verification.
6. Re-run `validateTreasuryLongEndIncomeLensArtifact(..., { mode: 'production' })` before `validate-artifacts` registration.

### Deferred (null in v1.7c example)

| Source | Reason |
|--------|--------|
| NY Fed ACM term premium | Model revision risk; monthly cadence |
| TLT / long-duration Treasury ETF flow | Often proprietary; “buy TLT” interpretation risk |
| Long-duration Treasury ETF AUM | Single-fund bias; manual issuer extract |
| ICI bond fund flows | Product mix ≠ cash Treasuries; flow ≠ neglect |

**Recommended primary stack for v1.7d MVP:** `DGS30` + `DFII30` + curve anchors (`DGS2`, `DGS5`, `DGS10`) + optional `T10YIE` context.

**Cadence:** `updateFrequency: "daily"` (FRED constant-maturity business-day series).

---

## 4. Boundary vs v1.7b Treasury Futures Positioning Proxy

| Dimension | v1.7b positioning proxy | v1.7c long-end income lens |
|-----------|-------------------------|----------------------------|
| Source | CFTC TFF weekly (`gpe5-46if`, spike-verified) | FRED daily yields (candidate until v1.7d lock) |
| Measures | Leveraged-funds UST **futures positioning** | Long-end **nominal/real yield** snapshot |
| Narrative | Basis-trade **stress proxy** (positioning) | Income **neglect lens** (yields vs narrative fear) |
| Overclaim risk | “Full basis trade measured” | “Buy bonds” / duration allocation advice |
| Payload | `contracts[]` + basket aggregate | Flat `observations` rate fields |

Both artifacts: `mappingStatus: not_final`, display-only default, **not** in Research Composite.

---

## 5. Metric formulas

**Curve spread (percentage points, not basis points):**

```text
curve2s30sPct = thirtyYearNominalYieldPct - twoYearYieldPct
curve5s30sPct = thirtyYearNominalYieldPct - fiveYearYieldPct
curve10s30sPct = thirtyYearNominalYieldPct - tenYearYieldPct
```

Implemented as `computeCurveSpread(longYieldPct, shortYieldPct)`.

**Reconciliation:** `reconcileCurveSpread(observed, computed, tolerance)` with default tolerance **0.05** pp (`PCT_RECONCILIATION_TOLERANCE`).

**Rate validation:** `validatePercentRate` — finite; `|value| <= 100`; negative values allowed (real yields, inverted curves).

**Display:** `formatYieldPct(value, decimals)` — formatting only; no scoring.

**Explicitly not implemented:** `isMeaningfulYieldLevel`, neglect bands, percentile mapping, 0–100 pressure scores, buy/hold/sell classification.

---

## 6. Artifact schema summary

| Field | Rule |
|-------|------|
| `artifactVersion` | `"1"` |
| `signalId` | `"treasury-long-end-income-lens"` |
| `designOnly` | `true` in example mode only |
| `observationType` | `"treasury_long_end_income_snapshot"` |
| `seriesDefinition` | `"fred_treasury_long_end_income_lens_v1"` |
| `updateFrequency` | `"daily"` |
| `dataQuality` | `manual_unverified` in example |
| `mappingStatus` | `"not_final"` (top-level + `observations`) |
| `source` | `name`, `url`, `note`, non-empty `series[]` |
| `observations` | Required 30Y nominal + 30Y real; optional curve/breakeven |
| `optionalObservations` | ETF flow/AUM, term premium — **null** in v1.7c |

### Observations fields

| Field | v1.7c |
|-------|--------|
| `thirtyYearNominalYieldPct` | Required |
| `thirtyYearTipsRealYieldPct` | Required |
| `tenYearBreakevenInflationPct` | Optional (recommended in example) |
| `twoYearYieldPct`, `fiveYearYieldPct`, `tenYearYieldPct` | Optional; required for curve reconciliation when spreads present |
| `curve2s30sPct`, `curve5s30sPct`, `curve10s30sPct` | Optional; must reconcile when anchors present |
| `nominalYieldPercentile`, `realYieldPercentile` | `null` in v1.7c; future calibration only |

### Forbidden keys (populated values rejected)

**Score:** `mappedPressureScore`, `candidatePressureScore`, `pressureScore`, `displayScore`, `neglectScore`, `incomeScore`

**Advice / allocation:** `buySignal`, `sellSignal`, `durationSignal`, `allocationRecommendation`, `recommendation`, `targetAllocation`, `bondBuy`, `bondSell`

**Pattern guard:** populated keys matching `buy`, `sell`, `allocation`, `durationSignal`, `neglectScore`, `incomeScore` (case-insensitive).

---

## 7. Validation rules

`validateTreasuryLongEndIncomeLensArtifact(raw, { mode: 'example' | 'production' })`

- Example requires `designOnly: true`; production rejects it
- Source `series[]` entries require `id`, `label`, `url`, `role` (`primary` | `context`)
- ISO dates; `publishedAt >= asOf`
- Required 30Y nominal and real yields; optional fields validated when present
- Curve spreads reconcile when both spread and anchor yields present
- Percentiles: `null` or 0–100 only
- Recursive forbidden-key scan

Tests: [`lib/ghostflow/__tests__/treasuryLongEndIncomeLens.test.ts`](../lib/ghostflow/__tests__/treasuryLongEndIncomeLens.test.ts)

---

## 8. Interpretation caveats

- **Not investment advice** and **not a recommendation to buy bonds.**
- **Not a duration allocation signal** — yield level alone does not prove income neglect.
- Nominal and real yields can diverge for different macro reasons; breakevens are context, not neglect proof.
- Duration risk remains even when yields appear “high” vs recent history.
- Public/manual data only; display-only by default; not scored.
- Future percentiles (v1.7f) do not imply buy/sell bands without separate product approval.

---

## 9. Approved future user-facing copy

**Primary title:** Long-End Income Lens

**Explanation (future display):**

> Tracks whether long-duration Treasury income is being ignored despite historically meaningful nominal or real yields. This is not a recommendation to buy bonds. It is a plumbing check on whether narrative fear may be overpowering income math.

---

## 10. Promotion checklist

| Phase | Scope |
|-------|--------|
| **v1.7d.1** | Production artifact candidate JSON + `validate-artifacts` registration — **done** |
| **v1.7e** | Display-only Treasury Plumbing section — **Long-End Income Lens** subcard |
| **v1.7f** | Calibration / historical percentiles (`nominalYieldPercentile`, `realYieldPercentile`) |
| **v1.7g** | Separate Treasury Plumbing score gate — **discouraged**; product-approved only |

---

## 11. Related documents

- [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md)
- [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) — v1.7b sibling artifact
- [DATA_ROADMAP.md](./DATA_ROADMAP.md)
