# CFTC TFF Artifact Design (GhostFlow v0.9d)

**Status:** v0.9e production artifact validated; v0.9f **display-only** public dashboard card (`systematic-flow`). **Not wired** into GhostFlow scoring (`systematicStrategyPressure` remains MOCK until v0.9g / v1.0).  
**Prior work:** [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) (v0.9c, **YELLOW**).  
**Production file:** [`data/ghostflow/artifacts/systematicFlowProxy.v1.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.json)  
**Example file:** [`data/ghostflow/artifacts/systematicFlowProxy.v1.example.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.example.json)  
**Library:** [`lib/ghostflow/artifacts/systematicFlowProxy.ts`](../lib/ghostflow/artifacts/systematicFlowProxy.ts)

---

## 1. Purpose

Design a **manual weekly** CFTC Traders in Financial Futures (TFF) artifact that may eventually replace the static MOCK `systematicStrategyPressure` score input (currently **62**) with a:

**Leveraged-funds futures positioning proxy (CFTC TFF)**

This artifact measures **reported open-interest positioning** in equity-index futures by the CFTC **Leveraged Funds** category. It is **not**:

- CTA flow
- Vol-control flow
- Risk-parity flow
- True systematic / mechanical flow
- A trading signal or allocation recommendation

**Positioning is not flow.** **Leveraged Funds are not identical to CTAs, vol-control, or risk-parity.** CFTC categories are regulatory trader-classification buckets, not strategy labels.

Future score wiring must relabel or caveat the Passive Pressure sub-input currently named “Systematic strategy pressure.”

---

## 2. Dataset

| Item | Value |
|------|--------|
| Report | **Traders in Financial Futures (TFF) — Futures Only** |
| Dataset ID | `gpe5-46if` |
| Row endpoint | `https://publicreporting.cftc.gov/resource/gpe5-46if.json` |
| Metadata endpoint | `https://publicreporting.cftc.gov/api/views/gpe5-46if.json` |
| Access | CFTC Public Reporting Environment (PRE / Socrata SODA); no token required for light use |
| Cadence | Positions as of **Tuesday**; report typically released **Friday afternoon** |
| Format | Long-format only (trader classes as columns per contract row) |

---

## 3. Contract universe

### MVP equity basket (score-eligible)

| Code | Contract | Role |
|------|----------|------|
| `13874A` | E-MINI S&P 500 | Primary US large-cap beta |
| `209742` | NASDAQ MINI | Growth / Nasdaq beta |
| `239742` | RUSSELL E-MINI | Small-cap beta |

### Context only (not in basket score)

| Code | Contract | Rule |
|------|----------|------|
| `1170E1` | VIX FUTURES | Optional `vixContext` block; **`usedInScore: false`** unless a later methodology explicitly approves blending |

### Exclude from basket

- Sector / sub-index E-minis (utilities, tech, etc.)
- Dividend index futures
- Consolidated rows (`13874+`, `20974+`) unless methodology changes
- Stale full-size Nasdaq (`209741` — last FutOnly row historically 2015)
- Micro contracts unless methodology widens universe deliberately

---

## 4. Required fields

Per **score contract** and optional **VIX context**, store CFTC-aligned fields (manual extract from PRE):

| Field | CFTC column |
|-------|-------------|
| `reportDate` | `report_date_as_yyyy_mm_dd` (ISO date) |
| `reportWeek` | `yyyy_report_week_ww` |
| `contractMarketName` | `contract_market_name` |
| `cftcContractMarketCode` | `cftc_contract_market_code` |
| `openInterestAll` | `open_interest_all` |
| `leveragedFundsLong` | `lev_money_positions_long` |
| `leveragedFundsShort` | `lev_money_positions_short` |
| `leveragedFundsSpread` | `lev_money_positions_spread` |
| `changeLong` | `change_in_lev_money_long` |
| `changeShort` | `change_in_lev_money_short` |
| `changeSpread` | `change_in_lev_money_spread` |
| `pctOiLong` | `pct_of_oi_lev_money_long` |
| `pctOiShort` | `pct_of_oi_lev_money_short` |
| `pctOiSpread` | `pct_of_oi_lev_money_spread` |

Artifact-level: `asOf`, `publishedAt`, `source`, `datasetId`, `scoreContracts[]`, optional `vixContext`, `basket` summary.

---

## 5. Metrics

### Per contract

```
netContracts = leveragedFundsLong - leveragedFundsShort
netPctOi = 100 * netContracts / openInterestAll
deltaNetContracts = changeLong - changeShort
```

### Basket (MVP contracts only)

```
basketNetContracts = Σ netContracts
basketOpenInterestAll = Σ openInterestAll
basketNetPctOi = 100 * basketNetContracts / basketOpenInterestAll
basketAbsNetPctOi = abs(basketNetPctOi)
basketDirection = net_long | net_short | flat   // flat if |basketNetPctOi| < 1.0 pp
basketWeeklyDeltaNetContracts = Σ deltaNetContracts   // optional display context
```

Spreading positions are stored but **not** included in net directional exposure (documented simplification).

---

## 6. Proposed 0–100 score mapping

**Crowding magnitude only** — direction is display context, not inverted in the score.

```
basketScore = clamp(round(basketAbsNetPctOi * 5), 0, 100)
```

| `basketAbsNetPctOi` | Score |
|---------------------|-------|
| 0% | 0 |
| 5% | 25 |
| 10% | 50 |
| 15% | 75 |
| 20%+ | 100 |

Example (2026-05-19 spike): basket net ≈ **−18.5% OI** → `basketScore` **93**.

---

## 7. Freshness

| Field | Rule |
|-------|------|
| `asOf` | CFTC `report_date_as_yyyy_mm_dd` (Tuesday positions) |
| `publishedAt` | Friday release date (manual operator entry) |

**Recommended freshness** (calendar days since `publishedAt`):

| Status | Age |
|--------|-----|
| fresh | ≤ 10 days |
| caution | 11–17 days |
| stale | ≥ 18 days |

Implemented in `evaluateSystematicFlowProxyArtifactFreshness()` (design-ready; not wired to dashboard until merge).

---

## 8. Promotion checklist

Before wiring into `systematicStrategyPressure`:

- [ ] JSON Schema `schema.systematicFlowProxy.v1.json`
- [x] Production `systematicFlowProxy.v1.json` (manual weekly refresh; v0.9e candidate)
- [x] Entry in `scripts/ghostflow/validate-artifacts.ts`
- [x] Report alignment enforced in `validateSystematicFlowProxyArtifact`
- [x] `applySystematicFlowProxyDisplayArtifact` in `buildSnapshot.ts` (display-only card; v0.9f)
- [ ] `applySystematicFlowProxyArtifact` score merge in `buildSnapshot.ts`
- [ ] Mapper + merge unit tests with score snapshot
- [ ] Caveat copy + score sub-input PUBLIC badge
- [ ] Methodology + score card label (“positioning proxy”)
- [ ] Score impact report vs MOCK **62**
- [ ] [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) production row + runbook
- [ ] Resolve PLACEHOLDER `systematic-flow` card vs `systematic-flow-proxy` naming

---

## Related

- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md)
- [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md) — v1.0a historical calibration (research only)
- [DATA_ROADMAP.md](./DATA_ROADMAP.md)
- Spike: `npm run ghostflow:cftc-tff-spike`
