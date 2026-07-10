# GhostFlow Blocker Source Strategy (v1.15)

**Status:** Operator strategy — documentation only.  
**Authoritative refresh record:** [GHOSTFLOW_V115_REFRESH_CHECKPOINT.md](./GHOSTFLOW_V115_REFRESH_CHECKPOINT.md)  
**Date:** 2026-07-04 (updated **2026-07-09** — CFTC display/Treasury refresh v1.15l)

> **Warning:** This document does **not** authorize artifact updates by itself. Do not edit production JSON, scoring, reference, buildSnapshot, mock snapshot, validators, or UI from this memo alone. Transcribe only after operator verification and existing runbook gates.

---

## Executive summary

GhostFlow v1.15 is **current** on reference **2026-07-01** with **one source blocker** remaining. Cap-weight premium proxy was **refreshed to 2026-07-01** (v1.15h / PR #118). Levered ETF rebalance pressure was **refreshed to 2026-07-01** (v1.15i / PR #120). Treasury long-end income lens was **refreshed to 2026-07-01** (v1.15j / PR #122). ETF net issuance was **refreshed to week ended 2026-07-01** (v1.15k / PR #124) — Composite **60** · Passive **53** · Structural **67**. CFTC systematic-flow and Treasury futures positioning were **refreshed to report date 2026-06-30** (v1.15l / PR #126) — display/Treasury only; scores unchanged. This memo decides, artifact by artifact, whether **Marketstack** may help operator refresh work and documents the **canonical operator path** for each blocker.

**Headline decisions:**

| Blocker | Marketstack role | Status / next action |
|---------|------------------|----------------------|
| Treasury long-end income lens | **not appropriate** | **Resolved** — official FRED API → artifact **2026-07-01**; **no Marketstack** |
| Levered ETF rebalance pressure | **helper** (index returns only) | **Resolved** — operator six-row AUM packet → artifact **2026-07-01**; **no Marketstack** |
| Cap-weight premium proxy | **helper** (EOD close export only; not production) | **Resolved** — Yahoo adj-close study → artifact **2026-07-01**; Marketstack insufficient for full history |
| Index concentration | **not appropriate** | **Open** — watch US SSGA SPY PDF until holdings update |

**Marketstack is not wired into GhostFlow production paths.** Existing repo integration is **GhostRegime-only** ([`lib/ghostregime/marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts)) and parses **unadjusted `close`** from `/v1/eod` only. GhostFlow operator helpers must **not** reuse GhostRegime `ALLOW_MARKETSTACK_FALLBACK` by default.

---

## Current GhostFlow baseline

| Item | Value |
|------|--------|
| `GHOSTFLOW_REFERENCE_AS_OF` | **2026-07-01** |
| Composite / Passive / Structural | **60 / 53 / 67** |
| Band | Elevated Flow Pressure |
| `publicSignalCount` | **13** |
| Score gates | **Closed** |
| v1.10e no-score-change policy | **Active** |
| MOCK passive inputs | **62 / 58 / 55** unchanged |
| Gate C daily package | **Deferred** — no reference bump; VIX/breadth not refreshed pending official CBOE/StockCharts verification |

### Open blockers (post v1.15l)

| # | Artifact | Lane | Artifact `asOf` | Blocker |
|---|----------|------|-----------------|---------|
| 1 | `indexConcentration.v1.json` | **Score-fed** | 2026-03-31 | US SSGA SPY PDF still **2026-03-31** holdings |

### Resolved (v1.15h / v1.15i / v1.15j) + score-fed (v1.15k) + display/Treasury (v1.15l)

| Artifact | Refreshed `asOf` | Source | Score impact |
|----------|------------------|--------|--------------|
| `capWeightPremiumProxy.v1.json` | **2026-07-01** | Yahoo Finance v8 chart API adjusted-close operator download (`operator_csv_adj_close`); **no Marketstack** | **None** at refresh time |
| `leveredEtfRebalancePressure.v1.json` | **2026-07-01** | ProShares Net Assets + StockAnalysis AUM/returns; Finviz cross-check; **no Marketstack** | **None** — MOCK **55** |
| `treasuryLongEndIncomeLens.v1.json` | **2026-07-01** | Official FRED API via `ghostflow:fred-treasury-yields-spike`; live graph CSV timed out; API fallback succeeded; common date ≤ reference; **no forward-fill** | **None** — Treasury lane only |
| `etfNetIssuance.v1.json` | **2026-07-01** (week ended) | Official ICI Estimated ETF Net Issuance release **2026-07-07**; domestic equity **+$16,271M**; prior week revised **−4,807 → −3,732** (note only) | ETF proxy **25 → 56**; Passive **45 → 53**; Composite **56 → 60**; Structural **67**; `publicSignalCount` **13** |
| `systematicFlowProxy.v1.json` | **2026-06-30** | CFTC PRE Socrata **`gpe5-46if`** TFF Futures Only; published **2026-07-03**; basket net **−19.4% OI** · pressure **97** · **net_short** | **None** — display-only; MOCK **62** |
| `treasuryFuturesPositioningProxy.v1.json` | **2026-06-30** | CFTC PRE Socrata **`gpe5-46if`** TFF Futures Only; published **2026-07-03**; basket lev net **−34.6% OI** · **net_short** · lev net **−6,206,938** · **4** core | **None** — Treasury lane only |

**Cap-weight headline values:** aligned **5,829** · SPY **745.76** · RSP **213.41** · ratio **3.4945** (pctile **97.6**) · 1Y spread **2.67** · 3Y **25.52** · 5Y **33.27** · `dataQuality` **verified_manual**.

**Levered ETF headline values:** aggregate AUM **44932.79M** · abs notional **3701.72M** · **8.24%** of universe AUM · **sell_underlying** · display **Est. sell $3.70B · 8.24% of universe AUM** · TZA Finviz gap **20.35%** (StockAnalysis primary accepted).

**Treasury long-end headline values:** DGS30 **4.97** · DFII30 **2.78** · DGS2 **4.17** · DGS5 **4.24** · DGS10 **4.48** · T10YIE **2.23** · curve2s30s **0.80** · curve5s30s **0.73** · curve10s30s **0.49** · display **30Y 4.97% · Real 2.78% · 10s30s +0.49 pp** · `dataQuality` **verified_manual**.

---

## Repo infrastructure (what exists today)

| Blocker | Script / runbook | Live fetch in script? |
|---------|------------------|------------------------|
| Treasury | [`scripts/ghostflow/fred-treasury-yields-spike.ts`](../../scripts/ghostflow/fred-treasury-yields-spike.ts) · [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) | FRED graph CSV, local CSV dir, or `FRED_API_KEY` API |
| Cap-weight | [`scripts/ghostflow/cap-weight-premium-study.ts`](../../scripts/ghostflow/cap-weight-premium-study.ts) · [CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) | **No** — operator CSV only |
| Levered ETF | [`scripts/ghostflow/levered-etf-rebalance-history-study.ts`](../../scripts/ghostflow/levered-etf-rebalance-history-study.ts) · [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) | Stooq optional for QQQ/SPY/IWM; production path is manual transcription |
| Index concentration | [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) | **No** — manual PDF extract |

**GhostFlow + Marketstack:** zero references in `lib/ghostflow/` or `scripts/ghostflow/`. Multiple GhostFlow memos explicitly exclude Marketstack from passive-supply and tail-skew tracks.

**GhostRegime Marketstack (reference only):**

- Endpoint: `https://api.marketstack.com/v1/eod`
- Fields used in repo: **`close`** only (no `adj_close`, no holdings, no macro yields)
- Production guard: `ALLOW_MARKETSTACK_FALLBACK=true` + `MARKETSTACK_ACCESS_KEY` — **GhostRegime emergency fallback only**; unrelated to GhostFlow artifact refresh

---

## GhostFlow Marketstack operator discipline

Future GhostFlow operator scripts that call Marketstack must use a **GhostFlow-specific explicit opt-in**, separate from GhostRegime fallback:

| Requirement | Detail |
|-------------|--------|
| Credential | `MARKETSTACK_ACCESS_KEY` in operator shell (never commit) |
| Opt-in | Deliberate script flag, e.g. `--source marketstack` or `--allow-marketstack` |
| Do **not** default | Do **not** reuse `ALLOW_MARKETSTACK_FALLBACK` for GhostFlow helpers unless an explicit future decision documents otherwise |
| Do **not** connect | GhostFlow helpers must not trigger GhostRegime production routing or Vercel env behavior |
| Output | Write **research/operator CSV or JSON** under `data/ghostflow/research/` or `tmp/` — operator transcribes into production artifact after review |
| Logging | Record symbol, date range, and **API call count** in operator notes / task log |

**No runtime Marketstack in GhostFlow app, buildSnapshot, validators, or UI.**

---

## Blocker-by-blocker analysis

### A. Treasury long-end income lens — **resolved (v1.15j)**

**Artifact:** `data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`  
**Lane:** Treasury Plumbing display (not scored, not in `publicSignalCount`)  
**Status:** **Refreshed** to **2026-07-01** (PR #122). **No longer a blocker.**

#### Production refresh record (2026-07-01)

| Item | Value |
|------|--------|
| **Source** | Official FRED API (`api.stlouisfed.org`, method **`fred_api`**) via `ghostflow:fred-treasury-yields-spike` |
| **CSV timeout** | Live FRED graph CSV timed out; official FRED API fallback succeeded |
| **Common date rule** | Latest common business date where all six series had numeric observations on or before `GHOSTFLOW_REFERENCE_AS_OF` (**2026-07-01**); **no forward-fill** |
| **`dataQuality`** | `verified_manual` |
| **DGS30 / DFII30** | **4.97** / **2.78** |
| **DGS2 / DGS5 / DGS10** | **4.17** / **4.24** / **4.48** |
| **T10YIE** | **2.23** |
| **Curve spreads** | 2s30s **0.80** · 5s30s **0.73** · 10s30s **0.49** |
| **Display** | **30Y 4.97% · Real 2.78% · 10s30s +0.49 pp** |
| **Marketstack** | **Not used** |
| **Score impact** | **None** — Treasury display lane only; Composite **56** · Passive **45** · Structural **67**; `publicSignalCount` **13** |

#### Required data (future refreshes)

Six FRED series on a **common business `asOf`** (no forward-fill):

| Series | Role |
|--------|------|
| DGS30 | Primary — 30Y nominal yield |
| DFII30 | Primary — 30Y TIPS real yield |
| DGS2, DGS5, DGS10 | Context — curve |
| T10YIE | Context — 10Y breakeven inflation |

#### Canonical source

**FRED** (St. Louis Fed) — graph CSV, official API (`api.stlouisfed.org`), or operator-downloaded CSV files.

#### Marketstack assessment

**not appropriate.** Repo Marketstack integration provides US **ETF EOD close** prices only. It does not supply Treasury constant-maturity yields, TIPS real yields, or breakeven inflation.

#### Future refresh workflow

1. Set **`FRED_API_KEY`** and run `npm run ghostflow:fred-treasury-yields-spike`, **or** download graph CSVs into `tmp/fred/` and run with `--local-dir tmp/fred`.
2. Identify **common asOf** across all six series ≤ `GHOSTFLOW_REFERENCE_AS_OF`.
3. Transcribe into `treasuryLongEndIncomeLens.v1.json`; set `dataQuality: verified_manual` after review.
4. Run `npm run ghostflow:check`. Treasury lane only — no Composite impact.

---

### B. Levered ETF rebalance pressure — **resolved (v1.15i)**

**Artifact:** `data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json`  
**Lane:** Display-only equity card; score input `leveredEtfRebalancePressure` remains **MOCK 55**  
**Status:** **Refreshed** to **2026-07-01** (PR #120). **No longer a blocker.**

#### Production refresh record (2026-07-01)

| Item | Value |
|------|--------|
| **AUM — ProShares** | TQQQ/SQQQ/UPRO/SPXU from official ProShares Net Assets pages (fetched **2026-07-06**) |
| **AUM — Direxion pair** | TNA/TZA from StockAnalysis (Direxion and ETFdb blocked at fetch) |
| **Cross-check** | Finviz ETF snapshot for TNA/TZA; TNA within **2.76%**; TZA Finviz **20.35%** below StockAnalysis — StockAnalysis primary operator-accepted (not averaged) |
| **Returns** | StockAnalysis close-based daily change QQQ **−1.52%** · SPY **−0.14%** · IWM **−0.38%** on **2026-07-01**; Yahoo adj-close cross-check **0.00 pp** |
| **Aggregates** | AUM **44932.79M** · abs notional **3701.72M** · **8.24%** · **sell_underlying** |
| **Display** | **Est. sell $3.70B · 8.24% of universe AUM** |
| **`dataQuality`** | `verified_manual` |
| **Marketstack** | **Not used** |
| **Score impact** | **None** — MOCK **55**; Composite **56** · Passive **45** · Structural **67**; `publicSignalCount` **13** |

#### Future refresh workflow

1. Capture **six issuer AUM** values (ProShares for TQQQ/SQQQ/UPRO/SPXU; StockAnalysis or Direxion for TNA/TZA when accessible).
2. Capture **QQQ, SPY, IWM** single-session return for target session ≤ reference (StockAnalysis primary).
3. Recompute per-row and aggregate observations per [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md).
4. Set `dataQuality: verified_manual` only after full six-row review.
5. Run `npm run ghostflow:check`. Display-only — MOCK **55** unchanged.

**Optional helper:** Marketstack EOD can supply QQQ/SPY/IWM **close** for operator-local return calculation — **cross-check only** unless runbook updated.

---

### C. Cap-weight premium proxy — **resolved (v1.15h)**

**Artifact:** `data/ghostflow/artifacts/capWeightPremiumProxy.v1.json`  
**Lane:** Display-only; no score wiring (`mappingStatus: not_final`)  
**Status:** **Refreshed** to **2026-07-01** (PR #118). **No longer a blocker.**

#### Production refresh record (2026-07-01)

| Item | Value |
|------|--------|
| **Source** | Yahoo Finance v8 chart API adjusted-close operator download |
| **Method** | `operator_csv_adj_close` via `cap-weight-premium-study` |
| **Marketstack** | **Not used** for artifact refresh |
| **`dataQuality`** | `verified_manual` |
| **Aligned observations** | **5,829** |
| **SPY / RSP adj close** | **745.76** / **213.41** |
| **Ratio / pctile** | **3.4945** / **97.6** |
| **1Y / 3Y / 5Y spread** | **2.67** / **25.52** / **33.27** |
| **Score impact** | **None** — Composite **56** · Passive **45** · Structural **67** |

#### Required data (future refreshes)

- **SPY** and **RSP** daily price history through `GHOSTFLOW_REFERENCE_AS_OF` (**2026-07-01**)
- Production-quality path requires **adjusted close** (artifact methodology and caveats state this explicitly)
- Study script: [`cap-weight-premium-study.ts`](../../scripts/ghostflow/cap-weight-premium-study.ts) parses `Date` + `Adj Close` (falls back to `Close` with `priceColumnUsed` recorded)

#### Canonical source (production)

**Yahoo Finance or equivalent operator-exported adjusted-close CSVs** — transcribed via study script. This is the **preferred production path** and matches the current artifact `source.operatorSource` note.

```bash
npm run ghostflow:cap-weight-premium-study -- --spy-csv path/to/spy.csv --rsp-csv path/to/rsp.csv
```

#### Marketstack assessment

**helper** — useful for **EOD close history export** only; **not equivalent** to Yahoo/manual adjusted-close unless adjusted-close availability and provenance are confirmed in a future spike.

| Use | Posture |
|-----|---------|
| Yahoo/manual **Adj Close** CSV | **Primary** — preferred for production refresh |
| Marketstack **close-only** CSV | **Conditional helper** — acceptable only with explicit `source.note` caveat; likely `dataQuality: manual_unverified` until adj-close semantics confirmed |
| Marketstack as production primary | **Not approved** until adj-close provenance documented |

Repo [`marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts) parses **`close` only**. Whether Marketstack API returns a separate adjusted-close field is **unknown in this repo** (open question — see below).

#### Recommended operator workflow

1. Export **SPY** and **RSP** **adjusted-close** daily CSVs through **2026-07-01** (Yahoo Finance export preferred).
2. Run `npm run ghostflow:cap-weight-premium-study` with both CSV paths.
3. Review study JSON output (ratio percentiles, spreads, overlap dates).
4. Transcribe verified fields into `capWeightPremiumProxy.v1.json`; filter dates ≤ reference.
5. Run `npm run ghostflow:check`. Display-only — no Composite impact.

**Conditional Marketstack helper path (shipped):**

Script: `npm run ghostflow:marketstack-eod-csv-export` — [`marketstack-eod-csv-export.ts`](../../scripts/ghostflow/marketstack-eod-csv-export.ts)

- Requires `MARKETSTACK_ACCESS_KEY` + `--allow-marketstack` or `--source marketstack` (no GhostRegime `ALLOW_MARKETSTACK_FALLBACK`)
- Default output: `tmp/ghostflow/marketstack/{SYMBOL}.csv` with `Date,Close` + `{SYMBOL}.marketstack.meta.json` provenance
- Use `--dry-run` first to see estimated API call count (~12 for full SPY+RSP history if pagination is unrestricted)
- **Fail-closed coverage gate:** export aborts unless rows ≥1261 (default cap-weight minimum) and last date is near `date-to`; sidecar records `coverageStatus: complete|partial` and pagination metadata
- **First live run (2026-07-04):** only 1000 rows/symbol (2016-07-05 → 2020-06-23), 1 API call each — study failed (`need at least 1261`). Likely Marketstack plan/API row cap, not sufficient for full-history cap-weight. **Do not use for artifact refresh.**
- `--allow-partial` writes exploratory output but still exits non-zero with warnings
- Run study with `Close` column (parser records `priceColumnUsed: close`)
- Set `source.note` that series used unadjusted EOD close from Marketstack; keep `dataQuality: manual_unverified` unless cross-checked against adj-close source

Still secondary to adj-close CSVs for production quality.

---

### D. Index concentration (score-fed)

**Artifact:** `data/ghostflow/artifacts/indexConcentration.v1.json`  
**Lane:** **Score-fed** — affects Structural Fragility `indexConcentration` (20%) and Composite

#### Required data

Sum of **top 10 S&P 500 index constituent weights** (percent) from canonical US SSGA SPY monthly fact sheet.

#### Canonical source

**US SSGA SPY fact sheet PDF:**

https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf

Use **index weights**, not fund weights if both appear. `asOf` = holdings month-end; `publishedAt` = PDF control/footer date.

#### Marketstack assessment

**not appropriate.** No ETF **holdings** or index-weight endpoint exists in this repo. Marketstack EOD prices cannot derive S&P 500 top-10 index concentration.

| Source | Role |
|--------|------|
| US SSGA SPY PDF | **Canonical production** |
| SSGA product page “Index Top Holdings” | **cross-check only** |
| UCITS / non-US fact sheets | **cross-check only** — not production primary |

#### Recommended operator workflow

1. Re-check canonical PDF for holdings date **newer than 2026-03-31** (watch-only until published).
2. When newer: extract top-10 **index** weight sum → `observations.sp500Top10IndexWeightPercent`.
3. Update `asOf`, `publishedAt`, `source.note` per [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md).
4. **Mandatory:** score-impact report (Structural + Composite delta) before merge.
5. Run `npm run ghostflow:check`.

**Defer** until SSGA publishes updated US holdings. Do not substitute Marketstack or live product page as production source without explicit mapping decision.

---

## Marketstack policy table

| Artifact | Required data | Canonical source | Marketstack role | Approved for production artifact? | Request est. / refresh | Provenance note | Next operator action |
|----------|---------------|------------------|------------------|-----------------------------------|------------------------|-----------------|----------------------|
| `treasuryLongEndIncomeLens` | 6 FRED yields/breakeven | FRED (API or CSV) | **not appropriate** | **resolved** — FRED API primary for **2026-07-01** refresh; **no Marketstack** | **0** | Official Fed series; API fallback when CSV times out | **Done** v1.15j; future: `FRED_API_KEY` or `tmp/fred/` CSVs → spike → transcribe |
| `leveredEtfRebalancePressure` | 6× AUM + 3× index return | Issuer pages + StockAnalysis/CSV | **helper** (returns only) | **resolved** — operator packet primary for **2026-07-01** refresh; **no Marketstack** | **~3** (theoretical) | AUM manual; TZA Finviz gap documented | **Done** v1.15i; future: ProShares + StockAnalysis per §3b |
| `capWeightPremiumProxy` | SPY/RSP daily history | Yahoo/manual **adj-close** CSV | **helper** (close export only) | **resolved** — Yahoo adj-close primary used for **2026-07-01** refresh; Marketstack insufficient | **~12** (theoretical; failed under current access) | Close-only ≠ adj-close; Marketstack 1000-row cap | **Done** v1.15h; future: Yahoo adj-close → study |
| `indexConcentration` | Top-10 index weight % | US SSGA SPY PDF | **not appropriate** | **no** — PDF only | **0** | Holdings not derivable from EOD | Watch PDF; score-impact report when updated |

### Marketstack role definitions

| Role | Meaning |
|------|---------|
| **primary** | Canonical production source (cap-weight and levered ETF resolved without Marketstack; remaining blockers do not use Marketstack as primary) |
| **helper** | Operator-local export to CSV/JSON; manual transcription required |
| **cross-check only** | Sanity check against canonical source; not written to artifact |
| **not appropriate** | Data type or provenance mismatch; do not spend quota |
| **defer** | External publication cadence blocks refresh (index concentration) |

---

## Request budget estimate

Operator allowance: **~10,000 Marketstack requests/month**.

| Scenario | Calls | Frequency | Monthly est. |
|----------|-------|-----------|--------------|
| Cap-weight full-history export (SPY + RSP, ~6 pages each) | ~12 | weekly refresh | ~48 |
| Levered ETF index returns (QQQ + SPY + IWM, 1 page each) | ~3 | weekly | ~12 |
| Treasury FRED | 0 | — | 0 |
| Index concentration | 0 | — | 0 |
| **Routine helper total** | | | **~60/month** |

Well under monthly allowance. A one-time full cap-weight history pull (~12 calls) plus weekly levered helper (~3 calls) is negligible vs 10,000.

**Discipline:** Log actual call counts when helpers are implemented. No probes were run for this strategy memo.

---

## Recommended operator sequence

Implement / unblock in this order (based on repo readiness and Marketstack fit):

1. ~~**Cap-weight premium**~~ — **Done (v1.15h)** — Yahoo adj-close CSVs → study → artifact **2026-07-01**
2. ~~**Levered ETF rebalance**~~ — **Done (v1.15i)** — operator six-row AUM packet → artifact **2026-07-01**
3. ~~**Treasury FRED income lens**~~ — **Done (v1.15j)** — official FRED API → artifact **2026-07-01**
4. **Index concentration** — watch-only until US SSGA PDF updates; score-impact report required when unblocked

### Marketstack helper status (code)

**Shipped:** `ghostflow:marketstack-eod-csv-export` — [`marketstack-eod-csv-export.ts`](../../scripts/ghostflow/marketstack-eod-csv-export.ts)

- `--source marketstack --allow-marketstack` explicit opt-in; `MARKETSTACK_ACCESS_KEY` only
- Fail-closed coverage gate; **not** sufficient for full-history cap-weight under current operator access
- **Cap-weight production path:** Yahoo/manual adjusted-close CSVs (used for v1.15h refresh)
- No GhostRegime `ALLOW_MARKETSTACK_FALLBACK` coupling

---

## Guardrails

- Do **not** update production artifacts from this document alone.
- Do **not** open score gates or change MOCK inputs.
- Do **not** modify `lib/ghostflow/scoring.ts`, `reference.ts`, `buildSnapshot.ts`, or `mockGhostflowSnapshot.ts`.
- Do **not** add runtime Marketstack calls to GhostFlow app/UI/validators.
- Do **not** reuse GhostRegime `ALLOW_MARKETSTACK_FALLBACK` for GhostFlow operator helpers by default.
- **GhostRegime** Marketstack policy is a **separate product lane** — Yahoo ETF fallback, fail-closed guard, Vercel env discipline unchanged.
- **indexConcentration** refresh requires **score-impact report** before production merge.

---

## Open questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Does Marketstack `/v1/eod` return adjusted-close fields not parsed by GhostRegime? | Cap-weight helper quality |
| 2 | Should GhostFlow helper scripts share `marketstackEod.ts` or duplicate minimal fetch in `scripts/ghostflow/`? | Implementation isolation vs reuse |
| 3 | Is RSP supported on operator Marketstack plan with same pagination as SPY? | Cap-weight helper |
| 4 | When will US SSGA SPY PDF publish April 2026+ holdings? | Score-fed concentration unblock |

Resolve in a future spike before promoting Marketstack close-only CSV to `verified_manual` on cap-weight.

---

## Related docs

- [GHOSTFLOW_V115_REFRESH_CHECKPOINT.md](./GHOSTFLOW_V115_REFRESH_CHECKPOINT.md) — v1.15 refresh record and blocker register
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — per-artifact field tables
- [OPERATOR_REFRESH_DISCIPLINE.md](./OPERATOR_REFRESH_DISCIPLINE.md) — cadence and validation matrix
- [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md)
- [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md)
- [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md)
- [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md)
- GhostRegime (separate): [MARKETSTACK_OPERATOR_REFRESH.md](../ghostregime/MARKETSTACK_OPERATOR_REFRESH.md)

---

## Validation note

This memo is documentation-only. Artifact validation after any future refresh: `npm run ghostflow:check`.
