# Levered ETF Rebalance Pressure — Artifact Design (GhostFlow v1.1b)

**Status:** Design only — example JSON + pure validators; **not** in Research Composite, **not** in `validate-artifacts`, **no** production artifact.  
**Prior work:** [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) (v1.1a, **YELLOW**).  
**Example file:** [`data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.example.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.example.json)  
**Library:** [`lib/ghostflow/artifacts/leveredEtfRebalancePressure.ts`](../lib/ghostflow/artifacts/leveredEtfRebalancePressure.ts)

---

## 1. Purpose

Design a **manual weekly** artifact that may eventually replace the static MOCK `leveredEtfRebalancePressure` score input (currently **55**, **15%** of Passive Pressure).

The proxy estimates **mechanical rebalance notional** for daily-reset 3× levered and inverse index ETFs from:

- fund **AUM** (issuer pages, cross-checked), and  
- **single-session** underlying index return via QQQ / SPY / IWM proxies.

It is **not**:

- Issuer-reported rebalance flow or trade demand  
- Options / gamma / 0DTE exposure  
- A trading signal or allocation recommendation  

**Weekly aggregation of returns is deferred** — v1.1b locks `observationType: latest_session_snapshot_refreshed_manually` with row-level `underlyingReturnPct` and `returnAsOf` for one session.

---

## 2. Target score sub-input

| Item | Value |
|------|--------|
| Key | `leveredEtfRebalancePressure` |
| Pillar weight | **15%** of Passive Pressure |
| Current | MOCK **55** |
| Future signal id (display) | `levered-etf-rebalance-pressure` (artifact `signalId`) |

CFTC TFF and `systematicStrategyPressure` are **out of scope** for this track.

---

## 3. Tier-1 universe (MVP)

| Ticker | Issuer | Direction | signedLeverage | Underlying | Proxy |
|--------|--------|-----------|----------------|------------|-------|
| TQQQ | ProShares | long | +3 | Nasdaq-100 | QQQ |
| SQQQ | ProShares | inverse | −3 | Nasdaq-100 | QQQ |
| UPRO | ProShares | long | +3 | S&P 500 | SPY |
| SPXU | ProShares | inverse | −3 | S&P 500 | SPY |
| TNA | Direxion | long | +3 | Russell 2000 | IWM |
| TZA | Direxion | inverse | −3 | Russell 2000 | IWM |

`universeDefinition`: `tier1_six_ticker_3x_index_etf_v1`

### Deferred (reject in validator)

SPXL, SPXS, SSO, SDS, QLD, QID — overlapping benchmarks with Tier-1; see feasibility memo.

---

## 4. Artifact schema

### Top-level

| Field | Rule |
|-------|------|
| `artifactVersion` | `"1"` |
| `signalId` | `"levered-etf-rebalance-pressure"` |
| `designOnly` | `true` (required in v1.1b) |
| `asOf` / `publishedAt` | ISO `YYYY-MM-DD`; `publishedAt >= asOf` |
| `updateFrequency` | `"weekly"` (artifact cadence; observation is single-session) |
| `observationType` | `"latest_session_snapshot_refreshed_manually"` |
| `universeDefinition` | `"tier1_six_ticker_3x_index_etf_v1"` |
| `dataQuality` | `verified_manual` \| `manual_unverified` |
| `source` | `{ name, url, note }` — non-empty name and url |
| `etfRows` | Exactly six Tier-1 rows |
| `observations` | Aggregate block (below) |

**Not in v1.1b:** `candidatePressureScore` (no field, no null placeholder).

### Per-row (`etfRows[]`)

| Field | Description |
|-------|-------------|
| `ticker`, `fundName`, `issuer` | Identity |
| `direction` | `long` \| `inverse` |
| `signedLeverage` | `+3` long, `−3` inverse |
| `leverageMultiple` | `3` (positive) |
| `underlyingIndex` | Nasdaq-100 \| S&P 500 \| Russell 2000 |
| `indexProxyTicker` | QQQ \| SPY \| IWM |
| `aumMillionsUsd`, `aumAsOf`, `aumSourceName`, `aumSourceUrl` | Primary AUM provenance |
| `crossCheckSourceName`, `crossCheckSourceUrl` | ETF.com / ETFdb / Yahoo |
| `underlyingReturnPct`, `returnAsOf`, `returnSourceName`, `returnSourceUrl` | **Single-session** index move |
| `estimatedRebalanceNotionalMillionsUsd` | Formula output (must reconcile) |
| `estimatedRebalanceDirection` | `buy_underlying` \| `sell_underlying` \| `flat` |
| `usedInAggregate` | `true` |

### Aggregate (`observations`)

| Field | Definition |
|-------|------------|
| `aggregateAumMillionsUsd` | Sum of row AUM |
| `aggregateEstimatedRebalanceNotionalMillionsUsd` | Sum of signed row estimates |
| `aggregateAbsRebalanceNotionalMillionsUsd` | Sum of \|row estimates\| |
| `aggregateRebalancePctOfUniverseAum` | `100 × aggregateAbs / aggregateAum` (2 dp) |
| `dominantDirection` | `buy_underlying` \| `sell_underlying` \| `mixed` \| `flat` |
| `mappingStatus` | **`not_final`** (required) |

**Mapping to 0–100 is not defined in v1.1b.** `aggregateRebalancePctOfUniverseAum` is stored for future mapping studies only.

---

## 5. Formula (simplified daily-reset proxy)

```
underlyingReturnDecimal = underlyingReturnPct / 100

estimatedRebalanceNotionalMillionsUsd =
  aumMillionsUsd × signedLeverage × (signedLeverage − 1) × underlyingReturnDecimal
```

| Sign of notional | Interpretation |
|------------------|----------------|
| Positive | Estimated **buy** pressure into underlying exposure |
| Negative | Estimated **sell** pressure |

**Helpers:** `computeEstimatedRebalanceNotional`, `computeEstimatedRebalanceDirection`, `computeAggregateLeveredEtfRebalanceMetrics`.

**Caveats:** Approximate; path-dependent for inverse funds; ignores rebalance bands and intraday path.

---

## 6. Source policy

| Layer | Source |
|-------|--------|
| Primary AUM | ProShares / Direxion fund pages |
| Cross-check | ETF.com, ETFdb, Yahoo Finance `totalAssets` |
| Index move | Stooq daily CSV or SPY/QQQ/IWM — **one session** per refresh |

Operator pastes values into JSON; no GhostFlow runtime fetch in v1.1b.

---

## 7. Validation rules

Implemented in `validateLeveredEtfRebalancePressureArtifact(raw)`:

- Structural fields per §4  
- Exactly six tickers: TQQQ, SQQQ, UPRO, SPXU, TNA, TZA (no duplicates, no deferred)  
- Direction / leverage consistency  
- AUM ≥ 0; `underlyingReturnPct` any sign  
- Row notional within **0.05M** of formula  
- Aggregates within tolerance (**0.1M** / **0.05** for pct)  
- Rejects `candidatePressureScore` at root or in observations  
- `mappingStatus` must be `not_final`  
- `designOnly` must be `true`

**Freshness:** Not implemented in v1.1b — deferred to v1.1c production artifact or v1.1d display card.

---

## 8. Mapping (not final)

v1.1b **does not** select a 0–100 score mapping. Candidate paths for **v1.1e** or later:

| ID | Idea |
|----|------|
| **A** | `aggregateRebalancePctOfUniverseAum` → linear scale |
| **B** | Dollar pressure / SPY+QQQ+IWM volume |
| **C** | Percentile after history study |
| **D** | Manual operator banding |
| **E** | Capped mapping if score wiring needs guardrails |

Do not promote `aggregateRebalancePctOfUniverseAum` as a live score sub-input until mapping decision + product approval.

---

## 9. Promotion checklist

- [x] Design memo (this document)
- [x] Example JSON `leveredEtfRebalancePressure.v1.example.json`
- [x] Pure module + unit tests
- [ ] **v1.1c** Production `leveredEtfRebalancePressure.v1.json` (`designOnly` removed)
- [ ] JSON Schema `schema.leveredEtfRebalancePressure.v1.json` (optional v1.1c)
- [ ] `scripts/ghostflow/validate-artifacts.ts` entry
- [ ] Freshness helper (v1.1c or v1.1d)
- [ ] **v1.1d** Display-only signal card in `buildSnapshot`
- [ ] **v1.1e** Mapping decision memo (if needed)
- [ ] **v1.1f** Score merge + PUBLIC badge + score-impact tests vs MOCK **55**
- [ ] [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) operator row

---

## Related documents

- [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md)  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md)  
- [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) — parallel design pattern
