# Retirement Flow Pressure Proxy — Artifact Design (GhostFlow v1.2b)

**Status (v1.2c):** Validated **production artifact candidate** + example JSON, loader, `validate-artifacts` — **no** `buildSnapshot` score merge. `retirementFlowPressureProxy` remains **MOCK 58**; `mappingStatus` **not_final**. **v1.2e:** [calibration](./RETIREMENT_FLOW_CALIBRATION_STUDY.md) + [mapping decision](./RETIREMENT_FLOW_MAPPING_DECISION.md) (research-only; display-only default).  
**Prior work:** [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) (v1.2a, **YELLOW**).  
**Example file:** [`data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json`](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json) (`designOnly: true`, `dataQuality: manual_unverified`)  
**Production file:** [`data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json`](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json) (`dataQuality: verified_manual`; omit `designOnly`)  
**Library:** [`lib/ghostflow/artifacts/retirementFlowPressureProxy.ts`](../lib/ghostflow/artifacts/retirementFlowPressureProxy.ts) — `validateRetirementFlowPressureProxyArtifact`, `loadRetirementFlowPressureProxyArtifact()`

---

## 1. Purpose

Design a **manual quarterly** artifact that may eventually support a **structural retirement-market asset proxy** for the `retirementFlowPressureProxy` score sub-input (currently **MOCK 58**, **20%** of Passive Pressure).

The proxy represents **levels and growth of retirement-market assets** (ICI Retirement Market primary path), **not** live payroll contribution flow or weekly equity flow pressure.

It is **not**:

- ICI weekly domestic equity ETF net issuance (scored as `etfFundFlowImpulse`)  
- ICI monthly active vs index **flows** (scored as `activeShareOffsetProxy`)  
- A trading signal or allocation recommendation  

**v1.2b does not** replace MOCK **58**, add `mappedPressureScore`, or wire into the Research Composite.

---

## 2. Source selection

| Role | Source | Use in v1.2b |
|------|--------|----------------|
| **Primary** | [ICI Quarterly Retirement Market Data](https://www.ici.org/research/statistics/quarterly-retirement-market-data) | Production extract from **Table 1** (v1.2c) |
| **Optional cross-check** | Fed Financial Accounts / Z.1 | **Not used** in v1.2c MVP |

### ICI source lock (v1.2c — verified from official workbook)

| Item | Value |
|------|--------|
| **Release title** | Quarterly Retirement Market Data, Fourth Quarter 2025 |
| **Release page** | https://www.ici.org/statistical-report/ret_25_q4 |
| **Workbook download** | https://www.ici.org/statistical-report/ret_25_q4_data.xls |
| **Workbook title (TOC)** | The US Retirement Market, Fourth Quarter 2025 |
| **Quarter / `asOf`** | 2025-Q4 → `2025-12-31` |
| **`publishedAt`** | `2026-03-26` |
| **Worksheet** | `Table 1` |
| **Table title (row 2)** | US Total Retirement Assets |
| **Units in workbook** | Billions of dollars, end-of-period (artifact fields: **trillions** USD, ÷1000) |
| **Table 1 note** | Components may not add to the total because of rounding; plan definitions in Table 1 footnotes |

**Row / column mapping (production artifact):**

| Artifact field | Table 1 source |
|----------------|----------------|
| `totalRetirementMarketAssetsTrillionsUsd` | **Sum** of period row **2025:Q4** (sheet row 113): IRAs + DC plans + Private-sector DB + State/local government DB + Federal DB + Annuities = **49,124** billion → **$49.1T** (release headline) |
| `iraAssetsTrillionsUsd` | Column **IRAs**, row **2025:Q4** = **19,220** billion → **$19.2T** |
| `definedContributionAssetsTrillionsUsd` | Column **DC plans¹**, row **2025:Q4** = **14,197** billion → **$14.2T** |
| `priorQuarterTotalAssetsTrillionsUsd` | Sum of row **2025:Q3** = **48,131** billion → **$48.1T** |
| `priorYearTotalAssetsTrillionsUsd` | Sum of row **2024:Q4** = **44,171** billion → **$44.2T** |
| `quarterOverQuarterAssetGrowthPct` | ICI release headline **2.1%** (consistent with Table 1 sums) |
| `yearOverYearAssetGrowthPct` | ICI release headline **11.2%** (consistent with Table 1 sums) |

**Not in v1.2c MVP:** target-date fund assets, 401(k)-only subtotal, private-sector DC breakout, Z.1 cross-check.

---

## 3. Target score sub-input (future)

| Item | Value |
|------|--------|
| Key | `retirementFlowPressureProxy` |
| Pillar weight | **20%** of Passive Pressure |
| Current | MOCK **58** (unchanged in v1.2b) |
| Artifact `signalId` | `retirement-flow-pressure-proxy` |

CFTC TFF, levered ETF rebalance, and general ICI equity **flow** artifacts remain **out of scope** for this track.

---

## 4. Artifact schema

### Top-level

| Field | Rule |
|-------|------|
| `artifactVersion` | `"1"` |
| `signalId` | `"retirement-flow-pressure-proxy"` |
| `designOnly` | **Example:** `true` required (`mode: example`). **Production:** must omit / forbid `true` (`mode: production`) — no production file in v1.2b |
| `asOf` | Quarter-end (or series period end) ISO `YYYY-MM-DD` |
| `publishedAt` | ICI release date ISO `YYYY-MM-DD`; `publishedAt >= asOf` |
| `updateFrequency` | `"quarterly"` |
| `observationType` | `"quarterly_retirement_market_snapshot"` |
| `seriesDefinition` | `"ici_retirement_market_quarterly_assets_v1"` |
| `dataQuality` | `verified_manual` \| `manual_unverified` |
| `source` | `{ name, url, note? }` — **name** and **url** required |
| `caveats` | Non-empty `string[]` |
| `observations` | Required block (below) |

**Forbidden (validator rejects at root or in `observations`):** `mappedPressureScore`, `candidatePressureScore`.

### Observations (required)

| Field | Rule |
|-------|------|
| `totalRetirementMarketAssetsTrillionsUsd` | Finite, ≥ 0 |
| `definedContributionAssetsTrillionsUsd` | Finite, ≥ 0 |
| `iraAssetsTrillionsUsd` | Finite, ≥ 0 |
| `mappingStatus` | `"not_final"` only in v1.2b |

### Observations (optional)

| Field | Rule |
|-------|------|
| `targetDateFundAssetsBillionsUsd` | Finite, ≥ 0 |
| `priorQuarterTotalAssetsTrillionsUsd` | Finite, ≥ 0 — enables QoQ reconciliation |
| `priorYearTotalAssetsTrillionsUsd` | Finite, ≥ 0 — enables YoY reconciliation |
| `quarterOverQuarterAssetGrowthPct` | Finite; must reconcile with prior quarter total if both provided |
| `yearOverYearAssetGrowthPct` | Finite; must reconcile with prior year total if both provided |
| `equityAllocationProxyPct` | 0–100 if present |
| `contributionSeasonFlag` | `payroll_peak` \| `ira_contribution_season` \| `neutral` |

---

## 5. Growth formulas

Helpers in `retirementFlowPressureProxy.ts`:

```
QoQ % = ((currentTotal − priorQuarterTotal) / priorQuarterTotal) × 100
YoY % = ((currentTotal − priorYearTotal) / priorYearTotal) × 100
```

**Reconciliation:** If optional growth % and matching prior total are both present, stated growth must match the formula within **0.15** percentage points (`GROWTH_RECONCILIATION_TOLERANCE_PCT`).

---

## 6. Validation rules (summary)

| Rule | Detail |
|------|--------|
| Mode `example` | `designOnly === true` |
| Mode `production` | `designOnly === true` fails (production file deferred to v1.2c) |
| Identity | `artifactVersion`, `signalId`, `updateFrequency`, `observationType`, `seriesDefinition` locked |
| Dates | Valid ISO; `publishedAt >= asOf` |
| Source | Non-empty `source.name`, `source.url` |
| Caveats | Non-empty array |
| Assets | Required totals finite, non-negative |
| Mapping | `mappingStatus` must be `not_final` |
| Score fields | No `mappedPressureScore` / `candidatePressureScore` |

---

## 7. Mapping — not final

- `mappingStatus: not_final` is **required** in v1.2b.  
- No `mappedPressureScore` or calibration anchors in artifact JSON.  
- **v1.2e** owns mapping / calibration decision; **v1.2f** score gate only if product-approved.

---

## 8. Proposed quarterly freshness (documentation only)

Not implemented in v1.2b (no `evaluateRetirementFlowPressureArtifactFreshness()`).

Anchor: `publishedAt` (fallback `asOf`). Calendar days after anchor vs GhostFlow reference date:

| Status | Threshold |
|--------|-----------|
| **fresh** | ≤ 45 days |
| **caution** | 46–90 days |
| **stale** | > 90 days |

**Implementation target:** v1.2c production artifact and/or v1.2d display card.

---

## 9. Display vs score policy

| Layer | v1.2b |
|-------|--------|
| Score / composite | **Unchanged** — MOCK **58**; no `buildSnapshot` merge |
| Display card | **Not built** — no `signalPresentation` / component changes |
| Public artifact | Example JSON only (`designOnly: true`) |

**Product bias (from v1.2a):** Prefer **v1.2d display-only** card before any **v1.2f** composite promotion; quarterly structural proxy is a weak fit for 20% passive weight at weekly/daily peer cadence.

---

## 10. Promotion checklist

| Phase | Deliverable | v1.2b |
|-------|-------------|--------|
| **v1.2b** | Design memo, example JSON, validator, tests | **Done (this doc)** |
| **v1.2c** | Production `retirementFlowPressureProxy.v1.json`; verified ICI Table 1; `validate-artifacts` | **Done** — not scored, not displayed |
| **v1.2d** | Display-only card; freshness helper; overlap review | Not started |
| **v1.2e** | Calibration / mapping decision | **Done** — display-only default; MOCK **58**; see mapping decision memo |
| **v1.2f** | Score-wiring gate (product-approved only) | Not started |

---

## 11. Not implemented in v1.2c

- `buildSnapshot.ts` merge or `publicPassiveInputKeys` retirement entry  
- `scoring.ts` changes  
- `components/ghostflow/*` display card  
- `signalPresentation` / freshness evaluation in code  
- Extra `package.json` scripts (test wired via `test:ghostflow` only)

---

## Related

- [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md)  
- [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md)  
- [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md)  
- [DATA_ROADMAP.md](./DATA_ROADMAP.md)
