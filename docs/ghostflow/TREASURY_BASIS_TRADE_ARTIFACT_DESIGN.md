# Treasury Basis Trade / Futures Positioning Artifact Design (GhostFlow v1.7b)

**Status:** v1.7b artifact design only — example JSON + pure validator/tests. **Not** production data, display card, score wiring, or `validate-artifacts` registration.

**Prior work:** [TREASURY_PLUMBING_FEASIBILITY.md](./TREASURY_PLUMBING_FEASIBILITY.md) (v1.7a) · v1.7a.1 CFTC PRE spike (`npm run ghostflow:treasury-cftc-pre-spike`)

**Example file:** [`data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.example.json`](../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.example.json) (`designOnly: true`)

**Library:** [`lib/ghostflow/artifacts/treasuryFuturesPositioningProxy.ts`](../lib/ghostflow/artifacts/treasuryFuturesPositioningProxy.ts)

---

## 1. Naming decision

| Item | Value |
|------|--------|
| `signalId` | `treasury-futures-positioning-proxy` |
| Artifact file (example) | `treasuryFuturesPositioningProxy.v1.example.json` |
| Future UI title | **Treasury Futures Positioning Proxy** |
| Future section | **Treasury Plumbing** |
| Narrative (caveats only) | “Basis-trade stress proxy” — not in `signalId` |

**Rejected:** `treasury-basis-trade-stress-proxy` — overstates measurement.

**Equity boundary:** [`systematic-flow`](./CFTC_TFF_MAPPING_DECISION.md) / `systematicFlowProxy` remain **equity index only**. No shared basket codes or `seriesDefinition`.

---

## 2. Source (v1.7a.1)

| Item | Value |
|------|--------|
| Dataset | **TFF — Futures Only** `gpe5-46if` |
| Endpoint | `https://publicreporting.cftc.gov/resource/gpe5-46if.json` |
| Cadence | Positions as of **Tuesday**; report typically **Friday afternoon** |
| Spike verdict | **GREEN** (2026-05-26 report in example) |

### Tier 1 core basket (aggregate)

| Tenor | Contract | Code |
|-------|----------|------|
| 2Y | UST 2Y NOTE | `042601` |
| 5Y | UST 5Y NOTE | `044601` |
| 10Y | UST 10Y NOTE | `043602` |
| Long bond | UST BOND | `020601` |

### Optional context (not in aggregate)

| Contract | Code |
|----------|------|
| ULTRA UST 10Y | `043607` |
| ULTRA UST BOND | `020604` |

### Deferred / excluded

- **3Y** UST note — no distinct FutOnly row in v1.7a.1 discovery
- **FED FUNDS, SOFR, ERIS swaps** — funding context only; not basis basket
- DTCC Repo, ERIS rate swaps, MICRO 10Y yield — excluded

### Dedup rule

- **One listing per tenor** in basket OI: standard contracts in core aggregate; Ultra variants **context only** unless product approves widening later.

---

## 3. CFTC column → JSON field map

| CFTC TFF column | JSON field |
|-----------------|------------|
| `report_date_as_yyyy_mm_dd` | `reportDate` (per contract) |
| `yyyy_report_week_ww` | `reportWeek` |
| `contract_market_name` | `contractMarketName` |
| `cftc_contract_market_code` | `cftcContractMarketCode` |
| `open_interest_all` | `openInterestAll` |
| `lev_money_positions_long` | `levMoneyLong` |
| `lev_money_positions_short` | `levMoneyShort` |
| `lev_money_positions_spread` | `levMoneySpread` |
| `change_in_lev_money_long` | `changeLevMoneyLong` |
| `change_in_lev_money_short` | `changeLevMoneyShort` |
| `asset_mgr_positions_long` | `assetManagerLong` |
| `asset_mgr_positions_short` | `assetManagerShort` |
| `asset_mgr_positions_spread` | `assetManagerSpread` |

Derived (validated): `levMoneyNet`, `levMoneyGross`, `levMoneyNetPctOi`, `levMoneyGrossPctOi`, `levMoneyWowDeltaNet`, `assetManagerNet`, `assetManagerNetPctOi`, `levVsAssetManagerSpread`, `direction`.

---

## 4. Metric formulas

Per contract:

```text
levMoneyNet = levMoneyLong - levMoneyShort
levMoneyGross = levMoneyLong + levMoneyShort
levMoneyNetPctOi = 100 * levMoneyNet / openInterestAll
levMoneyGrossPctOi = 100 * levMoneyGross / openInterestAll
levMoneyWowDeltaNet = changeLevMoneyLong - changeLevMoneyShort  (when present)
assetManagerNet = assetManagerLong - assetManagerShort
levVsAssetManagerSpread = levMoneyNet - assetManagerNet
direction = flat if |levMoneyNetPctOi| < 1.0 pp else net_long / net_short
```

Basket (rows with `usedInAggregate: true`):

```text
basketLevMoneyNet = Σ levMoneyNet
basketOpenInterestAll = Σ openInterestAll
basketLevMoneyNetPctOi = 100 * basketLevMoneyNet / basketOpenInterestAll   // preferred
basketLevMoneyGrossPctOi = 100 * Σ levMoneyGross / basketOpenInterestAll
basketAssetManagerNetPctOi = 100 * Σ assetManagerNet / basketOpenInterestAll
basketLevVsAssetManagerSpread = basketLevMoneyNet - Σ assetManagerNet
```

**No** 0–100 pressure mapping in v1.7b (`basketScore` forbidden).

Reconciliation tolerance: net/gross contracts ±2; % OI ±0.15 pp.

---

## 5. Artifact schema summary

| Field | Rule |
|-------|------|
| `artifactVersion` | `"1"` |
| `signalId` | `"treasury-futures-positioning-proxy"` |
| `designOnly` | `true` in example mode only |
| `observationType` | `"cftc_tff_treasury_futures_positioning_snapshot"` |
| `seriesDefinition` | `"cftc_tff_futures_only_treasury_leveraged_funds_basket_v1"` |
| `updateFrequency` | `"weekly"` |
| `datasetId` | `"gpe5-46if"` |
| `dataQuality` | `manual_unverified` in example |
| `mappingStatus` | `"not_final"` (top-level + `observations`) |
| `contracts[]` | Core + optional context rows |
| `observations` | Basket aggregate |

**Forbidden:** `mappedPressureScore`, `candidatePressureScore`, `basketScore`, `pressureScore`, `displayScore`, basis-overclaim booleans (`basisTradeMeasured`, `cashFuturesBasis`, etc.).

---

## 6. Validation rules

`validateTreasuryFuturesPositioningProxyArtifact(raw, { mode: 'example' | 'production' })`

- Example requires `designOnly: true`; production rejects it
- All core codes present in example mode
- Duplicate codes rejected
- Role/aggregate rules enforced
- Field reconciliation per §4
- Recursive forbidden-key scan

Tests: [`lib/ghostflow/__tests__/treasuryFuturesPositioningProxy.test.ts`](../lib/ghostflow/__tests__/treasuryFuturesPositioningProxy.test.ts)

---

## 7. Approved future user-facing copy

**Primary title:** Treasury Futures Positioning Proxy

**Explanation (future display):**

> Tracks public proxies for leveraged Treasury futures positioning from CFTC Traders in Financial Futures data. This does not measure the full basis trade, cash-futures basis, repo specialness, CTD behavior, or financing terms. It is not a trading or allocation recommendation.

---

## 8. Promotion checklist

| Phase | Scope |
|-------|--------|
| **v1.7d** | Production artifact candidate JSON + `validate-artifacts` registration |
| **v1.7e** | Display-only Treasury Plumbing dashboard section |
| **v1.7f** | Calibration / mapping decision |
| **v1.7g** | Separate Treasury score gate — discouraged; product-approved only |

---

## 9. Not implemented (v1.7b)

- Production `treasuryFuturesPositioningProxy.v1.json`
- `loadTreasuryFuturesPositioningProxyArtifact()`
- `buildSnapshot` / `publicSignalCount` / score sub-input
- Display card / UI lane
- `scripts/ghostflow/validate-artifacts.ts` entry
- Runtime dashboard fetching

---

## 10. Related documents

- [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) — equity pattern (do not merge)
- [DATA_ROADMAP.md](./DATA_ROADMAP.md)
