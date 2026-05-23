# GhostFlow Market Breadth Participation Runbook (v0.7)

Manual refresh workflow for the **Market Breadth Participation** public artifact. **No live fetches** — values are hand-edited into static JSON committed to the repo.

## Source

### Primary: StockCharts $SPXA50R

- **Symbol:** `$SPXA50R`
- **Series:** S&P 500 percent of constituents above their own 50-day moving average
- **ChartSchool:** [StockCharts Percent Above Moving Average](https://chartschool.stockcharts.com/table-of-contents/index-and-market-indicator-catalog/stockcharts-percent-above-moving-average)
- **Summary page:** [StockCharts symbol summary ($SPXA50R)](https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R)
- **Update cadence:** End-of-day after the US market close (typically by ~6:00 PM ET)

### Backup cross-check: Barchart $S5FI

- **Symbol:** `$S5FI` — S&P 500 Stocks Above 50-Day Average
- **Quote page:** [Barchart $S5FI](https://www.barchart.com/stocks/quotes/$S5FI)
- Use only to **verify** the StockCharts extract before marking `verified_manual`. Vendor methodologies may differ slightly (constituent lists, dividend adjustment).

## What to copy

1. Open StockCharts `$SPXA50R` (SharpCharts or symbol summary).
2. Find the **last trading-day EOD reading** (percentage 0–100).
3. Record **one decimal place** only (e.g. `56.8`, not `56.812`).
4. Cross-check against Barchart `$S5FI` on the same session.
5. Set `asOf` to that **last trading day** (ISO `YYYY-MM-DD`).
6. Set `publishedAt` to the same date unless the source clearly shows a later publication timestamp.

## Data quality rule

| Condition | `dataQuality` |
|---|---|
| StockCharts extract cross-checked against backup; directionally consistent (typically within ~1 pp) | `verified_manual` |
| Not cross-checked, or vendors materially disagree | `manual_unverified` |

Document the cross-check in `source.note` (primary reading, backup reading, date). Do **not** blend vendors into `observations` without explaining it.

## Update the artifact

Edit [`data/ghostflow/artifacts/marketBreadth.v1.json`](../data/ghostflow/artifacts/marketBreadth.v1.json):

```json
{
  "asOf": "2026-05-21",
  "publishedAt": "2026-05-21",
  "dataQuality": "verified_manual",
  "source": {
    "name": "StockCharts S&P 500 % Above 50-Day SMA ($SPXA50R)",
    "url": "https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R",
    "note": "Manual extract: ... Cross-checked against Barchart $S5FI ..."
  },
  "observations": {
    "sp500Above50DayMaPercent": 56.8
  },
  "optionalObservations": {
    "sourceSymbol": "$SPXA50R",
    "sp500Above200DayMaPercent": null,
    "backupSourceName": "Barchart S&P 500 Stocks Above 50-Day Average ($S5FI)",
    "backupReadingPercent": 56.77
  }
}
```

## Update reference date

When refreshing daily artifacts, also update [`lib/ghostflow/reference.ts`](../lib/ghostflow/reference.ts) and consider refreshing VIX in the same pass:

```typescript
export const GHOSTFLOW_REFERENCE_AS_OF = '2026-05-21';
```

## Mapping (no formula changes)

Participation **strength** (% above 50DMA) maps inversely to **breadth weakness** (0–100 structural sub-input):

| Strength % | Weakness proxy |
|---|---|
| ≥ 75 | 20 |
| 60 | 38 |
| 50 | 52 |
| 40 | 68 |
| 30 | 80 |
| ≤ 20 | 92 |

Linear interpolation between anchors; clamped 0–100.

## Freshness states

Evaluated as **trading days** between artifact `asOf` and `GHOSTFLOW_REFERENCE_AS_OF` (same as VIX):

| Trading days | Status |
|---|---|
| 0–2 | `fresh` |
| 3–5 | `caution` |
| >5 | `stale` |

## Validate

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

Routine artifact refreshes only require updating the JSON file(s) and `GHOSTFLOW_REFERENCE_AS_OF`. GhostFlow unit tests use fixed fixtures — you do **not** need to edit test files unless mapping, schema, or merge behavior changes.

## Caveats (copy-safe)

- Breadth weakness is a **participation proxy**, not a crash signal.
- **Weak breadth can persist.** Strong breadth does **not** guarantee safety.
- Structural context only — **not timing advice**.
- Does **not** prove passive flows caused market narrowing.
- S&P 500 scope only; not total-market breadth.
