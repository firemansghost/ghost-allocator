# GhostFlow Manual Refresh Checklist (v1.8d — operator quick checklist)

**Operator path:** [README](./README.md) · [Discipline](./OPERATOR_REFRESH_DISCIPLINE.md) · [Checklist](./MANUAL_REFRESH_CHECKLIST.md)

Field-level quick reference for manually refreshing GhostFlow public-data artifacts. **Canonical workflow:** [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md). **No live fetches, no scraping, no cron, no API routes** — values are hand-edited into static JSON files committed to the repo.

**Related:** [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) — taxonomy, cadence map, validation matrix, guardrails · [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) · [ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md)

## Taxonomy legend

| Class | Items | Affects score? | Operator note |
|-------|-------|----------------|---------------|
| **A — Score-fed equity** | vol-regime, etf-flow, passive-share, active-index-flow, concentration, breadth | **Yes** | Can change Composite / Passive / Structural |
| **B — Display-only equity** | systematic-flow, levered-etf-rebalance, retirement-asset-growth, options-activity-proxy | **No** | MOCK **62 / 55 / 58** unchanged |
| **C — Treasury lane** | treasury-futures-positioning-proxy, treasury-long-end-income-lens | **No** | Separate lane; not in `publicSignalCount` |
| **D — Derived/context** | modelZoneProximity, distance-65 | Partial | Refresh **passive-share** only — do not edit separately |
| **E — MOCK score inputs** | systematic **62**, retirement **58**, levered **55** | Static | **Do not edit** `mockGhostflowSnapshot.ts` |

**Equity dashboard coverage (v1.7):** **6** score-fed public artifacts · **4** display-only public artifact cards (CFTC `systematic-flow`, levered `levered-etf-rebalance`, retirement `retirement-asset-growth`, OCC `options-activity-proxy`) · **`publicSignalCount` 10** when all validate · **0** placeholder cards when artifacts validate. Display-only equity cards do **not** refresh or change the Research Composite — Composite **62** / Passive **58** / Structural **66** and MOCK **62** / **55** / **58** and VIX still drive scored sub-inputs. Quarterly retirement freshness **caution** (46–90 days after release) reflects normal ICI quarterly cadence — not a failed feed or score problem.

**Treasury Plumbing (separate lane):** Two production artifacts (v1.7d–d.1) in display-only UI lane (v1.7e) — **not scored**, **not** in `publicSignalCount`, **no** equity composite merge ([mapping decision](./TREASURY_PLUMBING_MAPPING_DECISION.md)). Treasury artifact refresh updates the **Treasury Plumbing display lane only** — it does **not** affect Composite / Passive / Structural scores and does **not** change `publicSignalCount`. Weekly CFTC: [`treasuryFuturesPositioningProxy.v1.json`](../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json). Daily FRED: [`treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json) — six-series common-date extract ([BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md)); **no forward-fill**. Caveats: futures proxy is public CFTC positioning only — **not** full basis-trade measurement; income lens is **not** investment advice, bond-buying, or duration-allocation advice.

Per-artifact deep dives: see linked runbooks at the bottom of this page.

---

## Top-level refresh schedule

| Cadence | When | Artifacts | Reference date |
|---------|------|-----------|----------------|
| **Daily** | After US market close (~6:00 PM ET) | Volatility Regime (VIX) + Market Breadth Participation | Update [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts) **after** both daily artifacts align to the same last trading day |
| **Daily** | After OCC session volume is published | Index Options Intensity Proxy (`options-activity-proxy`) | Display-only — updates [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) only; **not** scored; not 0DTE/GEX ([OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md)) |
| **Daily** | After FRED business-day yields update | Treasury Long-End Income Lens (`treasury-long-end-income-lens`) | `npm run ghostflow:fred-treasury-yields-spike` (or `--local-dir tmp/fred` / `--fred-api` if CSV blocked); align **common asOf** across DGS30, DFII30, DGS2, DGS5, DGS10, T10YIE; update [`treasuryLongEndIncomeLens.v1.json`](../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json); **not investment advice**; **not scored** |
| **Weekly** | After ICI ETF estimated net issuance release | ETF Net Issuance Pressure | Optional reference bump if you also run the daily pass |
| **Weekly** | After CFTC TFF Friday release | CFTC TFF Positioning Proxy (equity `systematic-flow`) | Production candidate validated; **not merged into GhostFlow score** — MOCK **62** unchanged; **v1.0c** gate not approved |
| **Weekly** | After CFTC TFF Friday release | Treasury Futures Positioning Proxy (`treasury-futures-positioning-proxy`) | Update [`treasuryFuturesPositioningProxy.v1.json`](../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json) — spike + hand map; **Treasury lane only**; **not scored**; not in `publicSignalCount` |
| **Monthly** | After ICI combined active/index monthly release | Active vs Index Flow + ICI Index Share Proxy | Use ICI `publishedAt`; **flows table vs assets table** |
| **Monthly** | After new SSGA SPY US monthly fact sheet PDF | Index Concentration | PDF month-end `asOf`; PDF control date `publishedAt` |
| **Quarterly** | After ICI Quarterly Retirement Market Data release | Retirement Asset Growth Proxy | Display-only card `retirement-asset-growth`; **not scored** (MOCK **58**); `mappingStatus` **not_final** |

**Daily group:** VIX + Market Breadth + OCC Index Options Intensity (display-only) + `GHOSTFLOW_REFERENCE_AS_OF` (when running the full daily pass)

**Weekly group:** ETF Net Issuance + CFTC TFF Positioning Proxy (display-only; MOCK **62** score input unchanged; **v1.0c** not approved)

**Monthly group (ICI):** Active/Index Flow + ICI Index Share Proxy (same release, different tables)

**Monthly group (SSGA):** Index Concentration (separate SSGA fact sheet cadence)

**Quarterly group (ICI Retirement Market):** Retirement Asset Growth Proxy — display-only card; Table 1 extract; MOCK **58** in composite unchanged ([v1.2e](./RETIREMENT_FLOW_MAPPING_DECISION.md) display-only default)

## Freshness thresholds (equity reference)

Against [`GHOSTFLOW_REFERENCE_AS_OF`](../../lib/ghostflow/reference.ts). Per-card status on signal cards; summary rollup covers subset only — see [audit memo](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md).

| Cadence | Anchor | Fresh | Caution | Stale |
|---------|--------|-------|---------|-------|
| Daily (VIX, breadth) | `asOf` | ≤2 trading days | 3–5 trading | >5 trading |
| Daily (options) | `publishedAt ?? asOf` | ≤2 trading days | 3–5 trading | >5 trading |
| Weekly (ETF, CFTC) | `publishedAt ?? asOf` | ≤7–10 calendar days | 8–14 / 11–17 | >14 / >17 |
| Monthly (ICI, SSGA) | `publishedAt ?? asOf` | ≤35 calendar days | 36–55 | >55 |
| Quarterly (retirement) | `publishedAt ?? asOf` | ≤45 calendar days | 46–90 (normal cadence) | >90 |

Treasury lane: no structured freshness bands today — dates on cards only. See [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md).

---

## Index Inclusion Event Proxy — future manual refresh discipline

**Status:** **Future / not live** — no production artifact, no dashboard card.

| Item | Detail |
|------|--------|
| **Artifact file (future)** | [`data/ghostflow/artifacts/indexInclusionEventProxy.v1.json`](../../data/ghostflow/artifacts/indexInclusionEventProxy.v1.json) — **does not exist yet** |
| **Example only** | [`indexInclusionEventProxy.v1.example.json`](../../data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json) — synthetic `EXMP*` / `example.com`; **never promote to production** |
| **Production release** | **Blocked** on operator-verified event rows per [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) §14 |
| **Scoring** | Display-only when live — **not scored**; no `publicPassiveInputKey`; no score fields |
| **Float / demand** | Do **not** infer free-float or demand-dollar estimates |

**Refresh cadence (when v1.9c.4 ships):**

| When | Action |
|------|--------|
| **Weekly** | During major rebalance/reconstitution seasons (Russell, S&P, Nasdaq annual/quarterly windows) |
| **Monthly** | Otherwise, when no active provider announcement cycle |
| **Event-driven** | Within **1–2 business days** after official index-provider announcements |

**Operator discipline:**

- Empty `events[]` window is valid **only after explicit operator review** — not as lazy bootstrap
- Do **not** commit provider downloads (PDFs, CSVs, spreadsheets) — cite public URLs only
- Do **not** scrape restricted or login-gated sources
- Do **not** use rumor, social media, or unsourced news as event rows
- Follow §14 provenance checklist before any production row

**Intake table template** (docs-only — transcribe into artifact `events[]`; do not commit a separate CSV):

| eventId | sourceName | sourceUrl | announcedDate | effectiveDate | sourceAccessedDate | indexFamily | indexName | ticker | companyName | action | eventType | sourceConfidence | notes | operatorVerified |
|---------|------------|-----------|---------------|---------------|--------------------|-------------|-----------|--------|-------------|--------|-----------|------------------|-------|------------------|
| *(example)* `russell-2025-prelim-add-XYZ` | FTSE Russell | *(official public URL)* | YYYY-MM-DD | YYYY-MM-DD or null | YYYY-MM-DD | `ftse_russell` | Russell 2000 | XYZ | Example Corp | `add` | `reconstitution` | `high` | Preliminary list; subject to change | true |

**Design reference:** [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md) v1.9c.4 / v1.9c.4a

---

## Artifact operator tables

### 1. Volatility Regime (daily)

| Item | Detail |
|------|--------|
| **Artifact file** | [`data/ghostflow/artifacts/volatilityRegime.v1.json`](../../data/ghostflow/artifacts/volatilityRegime.v1.json) |
| **Source URL** | [CBOE VIX History CSV](https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv) |
| **Fields to update** | `asOf`, `publishedAt`, `observations.vixClose`, `dataQuality`, `source.note` (if needed) |
| **Units** | VIX index level (e.g. `16.76`); use **Close** column, not Open/High/Low |
| **`asOf` rule** | Last **trading day** in CSV, ISO `YYYY-MM-DD` |
| **`publishedAt` rule** | Usually same as `asOf` unless source shows a distinct publication timestamp |
| **`dataQuality` rule** | `verified_manual` after double-checking CSV extract; `manual_unverified` if not verified |
| **Cross-check** | Re-read last non-blank CSV row; confirm date converts correctly from MM/DD/YYYY |
| **Common mistakes** | Weekend/holiday date; future `asOf` after reference; setting `mock_fallback` in JSON (runtime-only) |
| **Deep dive** | [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) |

---

### 2. Market Breadth Participation (daily)

| Item | Detail |
|------|--------|
| **Artifact file** | [`data/ghostflow/artifacts/marketBreadth.v1.json`](../../data/ghostflow/artifacts/marketBreadth.v1.json) |
| **Primary source** | [StockCharts $SPXA50R](https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R) — S&P 500 % above 50-day MA |
| **Backup cross-check** | [Barchart $S5FI](https://www.barchart.com/stocks/quotes/$S5FI) → record in `optionalObservations.backupReadingPercent` |
| **Fields to update** | `asOf`, `publishedAt`, `observations.sp500Above50DayMaPercent`, `dataQuality`, `source.note`, optional backup fields |
| **Units** | Percent 0–100, **one decimal place** only (e.g. `56.8`) |
| **`asOf` rule** | Last trading day of the breadth reading, ISO `YYYY-MM-DD` |
| **`publishedAt` rule** | Same as `asOf` unless source clearly shows later publication |
| **`dataQuality` rule** | `verified_manual` only if StockCharts extract is cross-checked against Barchart and directionally consistent (typically within ~1 pp); else `manual_unverified` |
| **Cross-check rule** | Document primary reading, backup reading, and date in `source.note`. Do not blend vendors into `observations` without explaining it |
| **Common mistakes** | Fake precision (>1 decimal); skipping cross-check; treating breadth as crash signal |
| **Deep dive** | [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) |

---

### 3. CFTC TFF Leveraged-Funds Positioning (weekly — validated candidate, not scored)

| Item | Detail |
|------|--------|
| **Production file** | [`data/ghostflow/artifacts/systematicFlowProxy.v1.json`](../../data/ghostflow/artifacts/systematicFlowProxy.v1.json) — included in `npm run ghostflow:validate-artifacts` |
| **Example file** | [`data/ghostflow/artifacts/systematicFlowProxy.v1.example.json`](../../data/ghostflow/artifacts/systematicFlowProxy.v1.example.json) — design reference only; unit tests |
| **Spike helper** | `npm run ghostflow:cftc-tff-spike` (operator-only; prints latest PRE rows) |
| **Calibration study** | `npm run ghostflow:cftc-tff-history-study` (research only; see [CFTC_TFF_CALIBRATION_STUDY.md](./CFTC_TFF_CALIBRATION_STUDY.md)) |
| **Source** | [CFTC PRE TFF Futures Only](https://publicreporting.cftc.gov/Commitments-of-Traders/TFF-Futures-Only/gpe5-46if/about_data) (`gpe5-46if`) |
| **MVP contracts** | `13874A` E-mini S&P 500, `209742` Nasdaq Mini, `239742` Russell E-mini — all `usedInScore: true` |
| **VIX context** | `1170E1` in `vixContext`; **`usedInScore: false`** |
| **`asOf` rule** | CFTC Tuesday report date (`report_date_as_yyyy_mm_dd`); must equal every contract `observations.reportDate` |
| **`publishedAt` rule** | Actual Friday CFTC release date for that report (not a guessed Saturday) |
| **Report alignment** | All score contracts + VIX must share the same `reportWeek`; validator enforces alignment |
| **Basket fields** | Recompute with `computeBasketMetrics(scoreContracts)` — do not hand-edit basket |
| **Dashboard** | v0.9f: shown as display-only `systematic-flow` public card when artifact validates |
| **Status** | Validated production artifact; **not wired** into Research Composite (`systematicStrategyPressure` remains MOCK **62**); **v1.0c** score gate not approved — see [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) |
| **Deep dive** | [CFTC_TFF_ARTIFACT_DESIGN.md](./CFTC_TFF_ARTIFACT_DESIGN.md) · [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) |

---

### 3b. Levered ETF Rebalance Pressure (weekly — validated candidate, not scored)

| Item | Detail |
|------|--------|
| **Production file** | [`data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json`](../../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json) — included in `npm run ghostflow:validate-artifacts` |
| **Example file** | [`data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.example.json`](../../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.example.json) — design reference only; unit tests (`mode: example`) |
| **Universe** | TQQQ, SQQQ, UPRO, SPXU, TNA, TZA — `tier1_six_ticker_3x_index_etf_v1` |
| **Primary AUM** | ProShares fund pages (TQQQ/SQQQ/UPRO/SPXU); StockAnalysis or Direxion for TNA/TZA |
| **Index returns** | StockAnalysis QQQ/SPY/IWM history — **one session** `% change` per row `returnAsOf` |
| **`asOf` rule** | Session date for index returns (ISO `YYYY-MM-DD`); aligns across QQQ/SPY/IWM rows |
| **`publishedAt` rule** | Date when AUM sources were captured (may be after `asOf` if issuer AUM lags index session) |
| **Row fields** | Recompute `estimatedRebalanceNotionalMillionsUsd` and `estimatedRebalanceDirection` via formula; recompute `observations` aggregates with `computeAggregateLeveredEtfRebalanceMetrics` |
| **`dataQuality` rule** | `verified_manual` only if issuer AUM **and** cross-check reviewed for **all six** rows; else `manual_unverified` |
| **Status** | v1.1d: display-only `levered-etf-rebalance` card when artifact validates. **v1.1e:** mapping decision recorded — [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md); artifact remains display-only; `observations.mappingStatus` stays **not_final**; score input remains MOCK **55**. **v1.1e-calibration** required before **v1.1f** score-wiring gate |
| **Deep dive** | [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md) · [LEVERED_ETF_REBALANCE_MAPPING_DECISION.md](./LEVERED_ETF_REBALANCE_MAPPING_DECISION.md) · [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) |

---

### 3c. Retirement Flow Pressure Proxy (quarterly — validated candidate, not scored)

| Item | Detail |
|------|--------|
| **Production file** | [`data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json`](../../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json) — included in `npm run ghostflow:validate-artifacts` |
| **Example file** | [`data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json`](../../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json) — design reference only; unit tests (`mode: example`) |
| **Source** | [ICI Quarterly Retirement Market Data](https://www.ici.org/research/statistics/quarterly-retirement-market-data) → latest release workbook (`ret_*_q*_data.xls`) |
| **Table** | **Table 1** — US Total Retirement Assets (billions USD in workbook; store **trillions** in artifact) |
| **Required extract** | Total (sum of six plan-type columns for quarter row), IRAs column, DC plans column; optional prior Q / prior Y sums for growth fields |
| **`asOf` rule** | Quarter-end ISO date (e.g. `2025-12-31` for 2025-Q4) |
| **`publishedAt` rule** | ICI statistical report release date (e.g. `2026-03-26`) |
| **`dataQuality` rule** | `verified_manual` only after opening workbook and confirming Table 1 cells match release; else do not promote production JSON |
| **Status** | v1.2d: display-only public card. **Not** in Research Composite (`retirementFlowPressureProxy` MOCK **58**). **v1.2e** mapping decision: display-only default. **v1.2f** score gate product-approved only |
| **Deep dive** | [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) · [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) |

---

### 4. ETF Net Issuance Pressure (weekly)

| Item | Detail |
|------|--------|
| **Artifact file** | [`data/ghostflow/artifacts/etfNetIssuance.v1.json`](../../data/ghostflow/artifacts/etfNetIssuance.v1.json) |
| **Source URL** | [ICI ETF flows](https://www.ici.org/research/stats/etf_flows) · [Weekly estimated ETF net issuance](https://www.ici.org/research/statistics/etfs/weekly-estimated-etf-net-issuance) |
| **Fields to update** | `asOf`, `publishedAt`, `observations.domesticEquityNetIssuanceMillionsUsd`, `dataQuality` |
| **Units** | **Millions USD** (e.g. `33919` for ~$33.9B display). Do not store billions in JSON |
| **`asOf` rule** | **Week ended** date (ISO `YYYY-MM-DD`) |
| **`publishedAt` rule** | **ICI release date** (when the weekly table was published) |
| **`dataQuality` rule** | `verified_manual` after double-checking ICI table; `manual_unverified` if not verified |
| **Cross-check** | Confirm **Equity → Domestic** row only (not Total, World, Bond, Commodity, Hybrid) |
| **Common mistakes** | Confusing weekly ETF issuance with monthly ICI active/index **flows**; wrong table row |
| **Deep dive** | [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) |

---

### 5. Active vs Index Flow Differential (monthly)

| Item | Detail |
|------|--------|
| **Artifact file** | [`data/ghostflow/artifacts/activeIndexFlow.v1.json`](../../data/ghostflow/artifacts/activeIndexFlow.v1.json) |
| **Source URL** | [ICI combined active/index](https://www.ici.org/research/stats/combined_active_index) |
| **Table** | **Flows of Long-Term Mutual Funds and ETFs** (not total net assets) |
| **Fields to update** | `asOf`, `publishedAt`, `observations.activeDomesticEquityNetFlowMillionsUsd`, `observations.indexDomesticEquityNetFlowMillionsUsd`, `dataQuality` |
| **Units** | **Millions USD** for each column; differential = index − active (computed at merge) |
| **`asOf` rule** | **Month ended** (last calendar day of month, ISO `YYYY-MM-DD`, e.g. `2026-03-31`) |
| **`publishedAt` rule** | **ICI release date** (e.g. `2026-04-30`) |
| **`dataQuality` rule** | `verified_manual` after double-checking ICI release; `manual_unverified` if not verified |
| **Cross-check** | Domestic equity row only; Active and Index columns from **flows** table |
| **Common mistakes** | Using AUM/assets table (that is the passive-share proxy); world equity instead of domestic |
| **Deep dive** | [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) |

---

### 6. ICI Index Share Proxy (monthly)

| Item | Detail |
|------|--------|
| **Artifact file** | [`data/ghostflow/artifacts/passiveShareProxy.v1.json`](../../data/ghostflow/artifacts/passiveShareProxy.v1.json) |
| **Source URL** | [ICI combined active/index](https://www.ici.org/research/stats/combined_active_index) |
| **Table** | **Total Net Assets of Long-Term Mutual Funds and ETFs** (not flows) |
| **Fields to update** | `asOf`, `publishedAt`, `observations.activeDomesticEquityAssetsMillionsUsd`, `observations.indexDomesticEquityAssetsMillionsUsd`, `observations.indexAssetSharePercent`, `dataQuality` |
| **Units** | Assets in **millions USD** (convert from billions on page); index share **percent**, one decimal |
| **`asOf` rule** | **Month ended** (ISO `YYYY-MM-DD`) |
| **`publishedAt` rule** | **ICI release date** |
| **`dataQuality` rule** | `verified_manual` after verifying assets + share vs ICI published column; `manual_unverified` if not verified |
| **Cross-check** | Formula: index / (active + index) × 100; optional ICI “Index as a % of Total” column |
| **Common mistakes** | Using **flows** table instead of assets; treating as market-wide passive share; treating refresh as a **crash countdown** or precise tripwire |
| **Deep dive** | [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) |

**v1.6a language:** Passive-share refresh updates **model-stress-zone context** (60–65% framing; ~65% reference for distance display) — a **pressure gauge**, not a crash forecast. See [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md).

---

### 7. Index Concentration (monthly)

| Item | Detail |
|------|--------|
| **Artifact file** | [`data/ghostflow/artifacts/indexConcentration.v1.json`](../../data/ghostflow/artifacts/indexConcentration.v1.json) |
| **Primary source** | [SSGA SPY US monthly fact sheet PDF](https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf) |
| **Backup (cross-check only)** | [SSGA SPY product page](https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy) — **not** primary unless methodology changes |
| **Fields to update** | `asOf`, `publishedAt`, `observations.sp500Top10IndexWeightPercent`, `dataQuality`, `source.note`, optional observations |
| **Units** | Sum of top-10 **index** weights in **percent** (15.0–50.0 valid range), one decimal OK |
| **`asOf` rule** | **Holdings as-of** month-end from fact sheet (ISO `YYYY-MM-DD`) |
| **`publishedAt` rule** | PDF **control/publication date** from footer (e.g. `20260409` → `2026-04-09`) |
| **`dataQuality` rule** | `verified_manual` after fact sheet double-check; `manual_unverified` if not verified |
| **Cross-check** | Sum top-10 index weights (not fund weights if both shown) |
| **Common mistakes** | Live product page as primary; fund weights vs index weights; wrong month-end |
| **Deep dive** | [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) |

---

### 8. Index Options Intensity Proxy (daily — display-only, not scored)

| Item | Detail |
|------|--------|
| **Production file** | [`data/ghostflow/artifacts/optionsActivityProxy.v1.json`](../../data/ghostflow/artifacts/optionsActivityProxy.v1.json) |
| **Spike helper** | `npm run ghostflow:options-data-spike -- --occ-daily <file>` |
| **Source** | [OCC Daily Volume Statistics](https://marketdata.theocc.com/daily-volume-statistics?reportDate=YYYYMMDD&format=csv) — save CSV under `tmp/options-spike/` |
| **Fields to update** | `asOf`, `publishedAt`, `observations.indexOptionsContracts`, `dataQuality`, `source.note` |
| **Mapping** | **Index/Others** column → `indexOptionsContracts` — not 0DTE/GEX |
| **`asOf` / `publishedAt`** | OCC session `reportDate` (usually same day) |
| **`dataQuality` rule** | `verified_manual` only after spike + hand verification per [audit policy](./ARTIFACT_FRESHNESS_DATAQUALITY_AUDIT.md); default production may stay `manual_unverified` |
| **Status** | Display-only; **not** in Research Composite; MOCK vol slot unchanged (VIX still scores vol) |
| **Deep dive** | [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) · [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) |

---

### 9. Treasury Futures Positioning Proxy (weekly — Treasury lane only)

| Item | Detail |
|------|--------|
| **Production file** | [`data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json`](../../data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json) |
| **Spike helper** | `npm run ghostflow:treasury-cftc-pre-spike` (contract discovery + PRE extract aid) |
| **Source** | CFTC PRE TFF — UST futures basket (2Y/5Y/10Y/30Y); see [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) |
| **Fields to update** | `asOf`, `publishedAt`, contract rows, basket metrics — recompute; `dataQuality`, `mappingStatus` stays **not_final** |
| **`asOf` rule** | CFTC Tuesday report date; aligned across contracts |
| **`publishedAt` rule** | Friday CFTC release date for that report |
| **Lane** | **Treasury Plumbing only** — not scored; not in `publicSignalCount`; not equity grid |
| **Caveat** | Public CFTC positioning proxy — **not** full basis-trade measurement |
| **Deep dive** | [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) |

---

### 10. Treasury Long-End Income Lens (daily-ish — Treasury lane only)

| Item | Detail |
|------|--------|
| **Production file** | [`data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`](../../data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json) |
| **Spike helper** | `npm run ghostflow:fred-treasury-yields-spike` (or `--local-dir tmp/fred` / `--fred-api` if CSV blocked) |
| **Source** | FRED: DGS30, DFII30, DGS2, DGS5, DGS10, T10YIE — **common asOf** across all six |
| **Fields to update** | `asOf`, `publishedAt`, yield/breakeven observations; `dataQuality`; **no forward-fill** |
| **`asOf` rule** | Latest **common** FRED business date across all six series |
| **Lane** | **Treasury Plumbing only** — not scored; not investment advice |
| **Caveat** | Not bond-buying or duration-allocation advice |
| **Deep dive** | [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md) |

---

## Daily refresh mini-checklist

- [ ] Update CBOE VIX close in `volatilityRegime.v1.json` **(A — score-fed)**
- [ ] Update StockCharts `$SPXA50R` in `marketBreadth.v1.json` **(A)**
- [ ] Cross-check breadth against Barchart `$S5FI`; set `dataQuality` and document in `source.note`
- [ ] Update OCC Index/Others in `optionsActivityProxy.v1.json` **(B — display-only)**
- [ ] Optional: update Treasury FRED income lens `treasuryLongEndIncomeLens.v1.json` **(C — Treasury lane)**
- [ ] Update `GHOSTFLOW_REFERENCE_AS_OF` in [`lib/ghostflow/reference.ts`](../../lib/ghostflow/reference.ts) **only after** daily score-fed artifacts share the same last trading day
- [ ] Run `npm run ghostflow:check`
- [ ] Run full validation suite before commit/PR (see below)

---

## Weekly refresh mini-checklist

- [ ] Update ICI domestic equity ETF net issuance in `etfNetIssuance.v1.json` **(A)**
- [ ] Update CFTC equity `systematicFlowProxy.v1.json` **(B — display-only; MOCK 62 unchanged)**
- [ ] Update Treasury CFTC `treasuryFuturesPositioningProxy.v1.json` **(C)**
- [ ] Update levered ETF `leveredEtfRebalancePressure.v1.json` when session/AUM window warrants **(B)**
- [ ] Confirm you are **not** updating monthly active/index flows or passive-share assets in the same pass unless intended
- [ ] Run `npm run ghostflow:check`
- [ ] Run full validation suite before commit/PR

---

## Monthly refresh mini-checklist

- [ ] Update `activeIndexFlow.v1.json` from ICI **flows** table **(A)**
- [ ] Update `passiveShareProxy.v1.json` from ICI **total net assets** table **(A — also drives derived distance-65)**
- [ ] Update `indexConcentration.v1.json` from SSGA SPY **monthly fact sheet PDF** **(A)**
- [ ] Do **not** use live SSGA product page as primary source unless methodology is explicitly changed
- [ ] Run `npm run ghostflow:check`
- [ ] Run full validation suite before commit/PR

---

## Quarterly refresh mini-checklist

- [ ] Update `retirementFlowPressureProxy.v1.json` from ICI Retirement Market Table 1 **(B — display-only; MOCK 58 unchanged)**
- [ ] Set `asOf` to quarter-end; `publishedAt` to ICI release date
- [ ] Caution 46–90 days after release is **normal** quarterly cadence — not a failed feed
- [ ] Run `npm run ghostflow:check`
- [ ] Run full validation suite before commit/PR

---

## Treasury-only refresh mini-checklist

- [ ] Update **one or both** Treasury production JSON files only
- [ ] Confirm **no** equity score-fed or display-only files changed unless intentional
- [ ] Confirm Composite / Passive / Structural **unchanged** (Treasury lane only)
- [ ] Confirm `publicSignalCount` **10** unchanged
- [ ] Run `npm run ghostflow:check`

---

## Do not touch during routine refresh

- Scoring formulas and pillar weights (`lib/ghostflow/scoring.ts`)
- Merge behavior (`lib/ghostflow/buildSnapshot.ts`) unless adding a new artifact (not part of routine refresh)
- Signal presentation (`lib/ghostflow/signalPresentation.ts`)
- Freshness thresholds (`lib/ghostflow/artifactFreshness.ts`, `lib/ghostflow/freshnessSummary.ts`)
- [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) — MOCK **62 / 58 / 55** inputs
- `publicSignalCount` — equity grid stays **10**; do not promote display-only or Treasury artifacts
- Display-only promotion — never wire systematic / levered / retirement / options into score or `raw.signals`
- Treasury score/grid promotion — Treasury lane stays separate 2-card display-only
- `mappingStatus: final` — requires separate decision memo; routine refresh keeps **not_final** where applicable
- Cosmetic `dataQuality` changes — do not bump labels just to make cards look better
- JSON schema files unless the source structure actually changed
- Unit tests and fixtures — **routine refreshes do not require editing test files** unless mapper, schema, or freshness/merge behavior changed
- GhostYield, GhostRegime, Models, builder, allocator logic, APIs, cron jobs
- Public artifact `source.name` labels unless the underlying source changed
- `mock_fallback` in artifact JSON (runtime-only fallback label)

---

## Validation commands

### Quick routine check (after editing artifact JSON)

```bash
npm run ghostflow:check
```

Runs `ghostflow:validate-artifacts` + `test:ghostflow` only. Use this after each refresh pass.

### Full pre-commit / pre-PR validation

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

---

## Commit message suggestions

- `Refresh GhostFlow daily artifacts`
- `Refresh GhostFlow weekly ETF artifact`
- `Refresh GhostFlow monthly ICI artifacts`
- `Refresh GhostFlow index concentration artifact`

Include the relevant `asOf` / week ended / month ended dates in the commit body when helpful.

---

## Per-artifact runbooks (deep dives)

- [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) — CBOE VIX
- [BREADTH_ARTIFACT_RUNBOOK.md](./BREADTH_ARTIFACT_RUNBOOK.md) — Market Breadth ($SPXA50R)
- [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) — ETF Net Issuance
- [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) — Active vs Index Flow
- [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) — ICI Index Share Proxy
- [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md) — v1.6a model-stress-zone phrasebook
- [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) — v1.6b educational scenarios (no refresh cadence; not scored)
- [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) — Index Concentration
- [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) — Options Activity Proxy (display-only)
- [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) — Treasury Futures Positioning
- [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md) — Treasury Long-End Income Lens
