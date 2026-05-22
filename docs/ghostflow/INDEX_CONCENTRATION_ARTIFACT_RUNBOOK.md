# GhostFlow Index Concentration Artifact Runbook (v0.5)

Manual refresh workflow for the **S&P 500 top-10 index concentration** public artifact. **No live fetches in v0.5** — values are hand-edited into static JSON committed to the repo.

See also: [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (CBOE VIX), [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md), [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md).

## Source

**Primary (v0.5):** SSGA SPY US monthly fact sheet PDF:

https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf

**Backup / cross-check only:** SSGA SPY product page “Index Top Holdings”:

https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy

Do **not** use the live product page as the main artifact source unless this runbook and the monthly freshness policy are updated to match that cadence.

## What to copy

From the **monthly US fact sheet** (holdings as-of month-end):

1. Locate the **Top 10 holdings** table (index weights, not fund weights if both are shown — use index weights).
2. Sum the **10 largest S&P 500 index constituent weights** (percent).
3. Store the rounded sum in `observations.sp500Top10IndexWeightPercent` (one decimal is fine, e.g. 36.5 for raw sum 36.48).

Optional cross-checks (not required for scoring):

| Field | Meaning |
|---|---|
| `optionalObservations.sp500Top5IndexWeightPercent` | Sum of top 5 index weights |
| `optionalObservations.largestConstituentWeightPercent` | Largest single index weight |
| `optionalObservations.constituentCount` | S&P 500 constituent count if printed (often 503) |
| `optionalObservations.sourceTable` | e.g. `fact_sheet_top10_holdings` |

## Units and dates

| Field | Meaning |
|---|---|
| `asOf` | **Holdings as-of date** (ISO `YYYY-MM-DD`, month-end, e.g. `2026-03-31`) |
| `publishedAt` | **PDF control/publication date** from the fact sheet footer (e.g. `20260409` → `2026-04-09`). Use manual verification date only if the PDF does not print a control/publication date. |
| `observations.sp500Top10IndexWeightPercent` | Sum of top-10 index weights in **percent** (15.0–50.0 valid range) |

## Update the artifact

Edit [`data/ghostflow/artifacts/indexConcentration.v1.json`](../data/ghostflow/artifacts/indexConcentration.v1.json):

```json
{
  "asOf": "2026-03-31",
  "publishedAt": "2026-04-09",
  "dataQuality": "verified_manual",
  "observations": {
    "sp500Top10IndexWeightPercent": 36.5
  }
}
```

- `dataQuality`: `verified_manual` after double-checking the fact sheet; `manual_unverified` if not yet verified
- Do **not** set `mock_fallback` in JSON (runtime-only)
- In `source.note`, state whether `publishedAt` is the PDF control/publication date or a manual verification date. Holdings `asOf` is always the month-end date printed on the fact sheet.

Example `source.note`:

> publishedAt reflects the PDF control/publication date observed in the SSGA fact sheet. Holdings are as of 2026-03-31.

## Update reference date

Edit [`lib/ghostflow/reference.ts`](../lib/ghostflow/reference.ts):

```typescript
export const GHOSTFLOW_REFERENCE_AS_OF = '2026-05-21';
```

Set this to the date you want freshness checks evaluated against (typically when you refreshed artifacts).

## Validate

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

Routine artifact refreshes only require updating the relevant JSON file(s) and `GHOSTFLOW_REFERENCE_AS_OF`. GhostFlow unit tests use fixed fixtures — you do **not** need to edit test files unless mapping, scoring, schema, or merge behavior changes.

## Freshness states (monthly)

Evaluated as **calendar days** since `publishedAt` (fallback `asOf`) and `GHOSTFLOW_REFERENCE_AS_OF`:

| Calendar days | Status | Behavior |
|---|---|---|
| 0–35 | `fresh` | Normal public-proxy display |
| 36–55 | `caution` | Amber warning; artifact values still shown |
| >55 | `stale` | Prominent stale warning; artifact values **still shown** |
| Invalid / missing | `missing` | Mock fallback for `concentration` signal and `indexConcentration` sub-input only |

Valid stale artifacts **do not** revert to mock. Only invalid or missing artifacts trigger mock fallback for concentration.

## Scoring impact

Top-10 index weight maps to `structuralFragility.indexConcentration` (20% of Structural Fragility) and the `concentration` signal card.

| Top 10 weight (%) | Proxy (0–100) | Band label |
|---|---|---|
| ≤ 22 | 20 | Broad / lower concentration |
| 22 → 28 | 20 → 40 | Moderate |
| 28 → 33 | 40 → 58 | Elevated |
| 33 → 37 | 58 → 72 | Top-heavy |
| 37 → 40 | 72 → 85 | Highly concentrated |
| ≥ 40 | 85 (cap) | Highly concentrated |

Example: 36.5% → proxy **70**, label **Top-heavy**, display `Top 10 index weight 36.5% · proxy 70/100`.

## What it is / is not

- **What it is:** Sum of S&P 500 index weights for the 10 largest constituents, manually extracted from the SSGA SPY monthly fact sheet.
- **What it is not:** not passive share, not ownership share, not proof passive caused concentration, not automatically bad, not a crash countdown.
- **Why monthly:** verified manual snapshot; no live feeds in v0.5.
- **Why top 10:** simple public concentration proxy; HHI deferred.

> Cap-weight concentration can reflect earnings dominance, momentum, valuation, passive flows, or all of the above. Useful fragility context, not a verdict.

## Reminders

- No live client or server fetches in v0.5.
- No cron jobs — refresh is manual.
- GhostYield, GhostRegime, and allocator routes are out of scope.
- Do not change composite scoring weights or passive-pressure inputs when refreshing this artifact.
