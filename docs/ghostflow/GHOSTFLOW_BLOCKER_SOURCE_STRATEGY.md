# GhostFlow Blocker Source Strategy (v1.15)

**Status:** Operator strategy — documentation only.  
**Authoritative refresh record:** [GHOSTFLOW_V115_REFRESH_CHECKPOINT.md](./GHOSTFLOW_V115_REFRESH_CHECKPOINT.md)  
**Date:** 2026-07-04

> **Warning:** This document does **not** authorize artifact updates by itself. Do not edit production JSON, scoring, reference, buildSnapshot, mock snapshot, validators, or UI from this memo alone. Transcribe only after operator verification and existing runbook gates.

---

## Executive summary

GhostFlow v1.15 is **current** on reference **2026-07-01** with **four source blockers** remaining. This memo decides, artifact by artifact, whether **Marketstack** may help operator refresh work and documents the **canonical operator path** for each blocker.

**Headline decisions:**

| Blocker | Marketstack role | Best next action |
|---------|------------------|------------------|
| Treasury long-end income lens | **not appropriate** | FRED API key or local FRED CSVs |
| Levered ETF rebalance pressure | **helper** (index returns only) | Manual issuer AUM + QQQ/SPY/IWM return extract |
| Cap-weight premium proxy | **helper** (EOD close export only; conditional) | Yahoo/manual **adjusted-close** CSVs → study script |
| Index concentration | **not appropriate** | Watch US SSGA SPY PDF until holdings update |

**Marketstack is not wired into GhostFlow production paths.** Existing repo integration is **GhostRegime-only** ([`lib/ghostregime/marketstackEod.ts`](../../lib/ghostregime/marketstackEod.ts)) and parses **unadjusted `close`** from `/v1/eod` only. GhostFlow operator helpers must **not** reuse GhostRegime `ALLOW_MARKETSTACK_FALLBACK` by default.

---

## Current GhostFlow baseline

| Item | Value |
|------|--------|
| `GHOSTFLOW_REFERENCE_AS_OF` | **2026-07-01** |
| Composite / Passive / Structural | **56 / 45 / 67** |
| Band | Elevated Flow Pressure |
| `publicSignalCount` | **13** |
| Score gates | **Closed** |
| v1.10e no-score-change policy | **Active** |
| MOCK passive inputs | **62 / 58 / 55** unchanged |

### Open blockers (v1.15g)

| # | Artifact | Lane | Artifact `asOf` | Blocker |
|---|----------|------|-----------------|---------|
| 1 | `treasuryLongEndIncomeLens.v1.json` | Treasury display | 2026-06-02 | FRED timeout; no `FRED_API_KEY`; empty `tmp/fred/` |
| 2 | `leveredEtfRebalancePressure.v1.json` | Display-only | 2026-05-22 | Six-row issuer AUM + QQQ/SPY/IWM return not refreshed ≤ 2026-07-01 |
| 3 | `capWeightPremiumProxy.v1.json` | Display-only | 2026-05-22 | Fresh SPY/RSP adj-close CSVs through 2026-07-01 |
| 4 | `indexConcentration.v1.json` | **Score-fed** | 2026-03-31 | US SSGA SPY PDF still **2026-03-31** holdings |

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

### A. Treasury long-end income lens

**Artifact:** `data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`  
**Lane:** Treasury Plumbing display (not scored, not in `publicSignalCount`)

#### Required data

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

**not appropriate.** Repo Marketstack integration provides US **ETF EOD close** prices only. It does not supply Treasury constant-maturity yields, TIPS real yields, or breakeven inflation. No GhostFlow script or runbook references Marketstack for macro rates.

#### Recommended operator workflow

1. **Preferred:** Set `FRED_API_KEY` and run:
   ```bash
   npm run ghostflow:fred-treasury-yields-spike
   ```
2. **Fallback:** Download graph CSVs for all six series into `tmp/fred/` (filenames: `DGS30.csv`, `DFII30.csv`, `DGS2.csv`, `DGS5.csv`, `DGS10.csv`, `T10YIE.csv`), then:
   ```bash
   npm run ghostflow:fred-treasury-yields-spike -- --local-dir tmp/fred
   ```
3. Identify **common asOf** across all six series ≤ `GHOSTFLOW_REFERENCE_AS_OF` (**2026-07-01**).
4. Transcribe into `treasuryLongEndIncomeLens.v1.json`; set `dataQuality: verified_manual` after review.
5. Run `npm run ghostflow:check`. Treasury lane only — no Composite impact.

**Prior success:** Artifact last refreshed via FRED API on **2026-06-04** (asOf **2026-06-02**). Blocker is operator env/access, not source unavailability.

---

### B. Levered ETF rebalance pressure

**Artifact:** `data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json`  
**Lane:** Display-only equity card; score input `leveredEtfRebalancePressure` remains **MOCK 55**

#### Required data

| Ingredient | Source (canonical) | Notes |
|------------|-------------------|--------|
| AUM for **TQQQ, SQQQ, UPRO, SPXU, TNA, TZA** | **ProShares / Direxion issuer fund pages** | Manual HTML extract; record `aumAsOf` per row |
| Underlying return **QQQ, SPY, IWM** | StockAnalysis (current production note) or operator CSV | Single-session or artifact-window return % |

Issuer AUM **cannot** be sourced from Marketstack.

#### Marketstack assessment

**helper** — index-return leg only.

- Marketstack EOD can supply **QQQ, SPY, IWM** daily `close` for operator-local return calculation (same semantics as Stooq path in [`levered-etf-rebalance-history-study.ts`](../../scripts/ghostflow/levered-etf-rebalance-history-study.ts)).
- Repo parser uses **unadjusted close** — must match production `underlyingReturnPct` methodology (currently StockAnalysis daily change).
- **cross-check only** if StockAnalysis/Stooq already used as primary.

**Not approved as primary** for production artifact without runbook update and operator `source.note` documenting symbol, session date, and cross-check.

#### Recommended operator workflow

1. Capture **six issuer AUM** values with `aumAsOf` ≤ refresh window from ProShares/Direxion pages.
2. Capture **QQQ, SPY, IWM** return for target session ≤ **2026-07-01** (StockAnalysis primary; Stooq CSV or future Marketstack helper optional).
3. Recompute per-row `estimatedRebalanceNotionalMillionsUsd` and aggregate observations per [LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md](./LEVERED_ETF_REBALANCE_ARTIFACT_DESIGN.md).
4. Set `dataQuality: verified_manual` only after full six-row review.
5. Run `npm run ghostflow:check`. Display-only — MOCK **55** unchanged.

**Future helper (not in this pass):** optional script exporting QQQ/SPY/IWM EOD CSV via `--source marketstack --allow-marketstack` for operator review before transcription.

---

### C. Cap-weight premium proxy

**Artifact:** `data/ghostflow/artifacts/capWeightPremiumProxy.v1.json`  
**Lane:** Display-only; no score wiring (`mappingStatus: not_final`)

#### Required data

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

**Conditional Marketstack helper path (future script):**

- Export `Date,Close` CSV for SPY + RSP via explicit `--source marketstack --allow-marketstack`
- Run study with `Close` column (parser records `priceColumnUsed: close`)
- Set `source.note` that series used unadjusted EOD close from Marketstack; keep `dataQuality: manual_unverified` unless cross-checked against adj-close source

**Best Marketstack candidate** for a future operator export script — still secondary to adj-close CSVs for production quality.

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
| `treasuryLongEndIncomeLens` | 6 FRED yields/breakeven | FRED (API or CSV) | **not appropriate** | **no** — FRED only | **0** | Official Fed series; prior API success 2026-06-02 | `FRED_API_KEY` or `tmp/fred/` CSVs → spike → transcribe |
| `leveredEtfRebalancePressure` | 6× AUM + 3× index return | Issuer pages + StockAnalysis/CSV | **helper** (returns only) | **conditional** — AUM always manual; returns helper OK with `source.note` | **~3** (QQQ/SPY/IWM, short window) | Close ≠ adj; issuer AUM not from API | Six-row manual extract ≤ 2026-07-01 |
| `capWeightPremiumProxy` | SPY/RSP daily history | Yahoo/manual **adj-close** CSV | **helper** (close export only) | **conditional** — adj-close primary; close-only helper with caveat | **~12** (full history SPY+RSP, paginated EOD) | Close-only ≠ adj-close for spread quality | Adj-close CSVs → study → transcribe |
| `indexConcentration` | Top-10 index weight % | US SSGA SPY PDF | **not appropriate** | **no** — PDF only | **0** | Holdings not derivable from EOD | Watch PDF; score-impact report when updated |

### Marketstack role definitions

| Role | Meaning |
|------|---------|
| **primary** | Canonical production source (none of the four blockers use Marketstack as primary today) |
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

1. **Cap-weight premium** — Yahoo/manual adj-close CSVs → existing study script (fastest unblock; best future Marketstack helper ROI for close export)
2. **Levered ETF rebalance** — hybrid manual AUM + index return (Marketstack optional helper for QQQ/SPY/IWM only)
3. **Treasury FRED income lens** — `FRED_API_KEY` or local CSVs (zero Marketstack)
4. **Index concentration** — watch-only until US SSGA PDF updates; score-impact report required when unblocked

### Next implementation task (code — out of scope for this doc)

First code follow-up after this strategy: **GhostFlow Marketstack EOD→CSV export helper** for cap-weight (and optionally levered returns), with:

- `--source marketstack --allow-marketstack` explicit opt-in
- `MARKETSTACK_ACCESS_KEY` only
- Output compatible with `cap-weight-premium-study` (`Date,Close` or `Date,Adj Close` if confirmed)
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
