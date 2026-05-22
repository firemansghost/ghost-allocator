# GhostFlow ETF Net Issuance Artifact Runbook (v0.3)

Manual refresh workflow for the **ETF Net Issuance Pressure** public artifact. **No live fetches in v0.3** — values are hand-edited into static JSON committed to the repo.

See also: [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (CBOE VIX).

## Source

Official ICI weekly release:

https://www.ici.org/research/stats/etf_flows

Also listed on:

https://www.ici.org/research/statistics/etfs/weekly-estimated-etf-net-issuance

## Which row to copy

From the **ETF Estimated Net Issuance** table (millions of dollars):

| Copy | Do not use for v0.3 |
|---|---|
| **Equity → Domestic** | Total, World, Bond, Commodity, Hybrid |

Example (May 19, 2026 release, week ended May 13, 2026):

- Domestic equity: **33,919** (millions USD) → display as **$33.9B**
- ICI prose may round to $33.92B — store the table integer, display one decimal billion

## Units and dates

| Field | Meaning |
|---|---|
| `observations.domesticEquityNetIssuanceMillionsUsd` | Raw table value (e.g. `33919`) |
| `asOf` | **Week ended** date (ISO `YYYY-MM-DD`, e.g. `2026-05-13`) |
| `publishedAt` | **ICI release date** (e.g. `2026-05-19`) |

Do **not** store billions in the JSON. Store millions; the UI formats rounded billions.

## Update the artifact

Edit [`data/ghostflow/artifacts/etfNetIssuance.v1.json`](../data/ghostflow/artifacts/etfNetIssuance.v1.json):

```json
{
  "asOf": "2026-05-13",
  "publishedAt": "2026-05-19",
  "dataQuality": "verified_manual",
  "observations": { "domesticEquityNetIssuanceMillionsUsd": 33919 }
}
```

- `dataQuality`: `verified_manual` after double-checking the ICI release; `manual_unverified` if not yet verified
- Do **not** set `mock_fallback` in JSON (runtime-only)

Optional fields may stay `null`; v0.3 ignores them.

## Update reference date

When refreshing artifacts, update [`lib/ghostflow/reference.ts`](../lib/ghostflow/reference.ts):

```typescript
export const GHOSTFLOW_REFERENCE_AS_OF = '2026-05-21';
```

Use the date you want freshness evaluated against (typically latest trading day when you refreshed).

## Validate

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

**Routine ETF refreshes** only require updating `etfNetIssuance.v1.json` and optionally `GHOSTFLOW_REFERENCE_AS_OF`. Unit tests use fixed fixtures — **do not edit tests** unless mapping, schema, or merge behavior changes.

## Freshness (weekly)

Calendar days from **`publishedAt`** (or `asOf` if `publishedAt` missing) to `GHOSTFLOW_REFERENCE_AS_OF`:

| Calendar days | Status | Behavior |
|---|---|---|
| 0–7 | fresh | Normal public-proxy display |
| 8–14 | caution | Amber warning; artifact values still shown |
| >14 | stale | Prominent stale warning; values **still shown** |
| Invalid / missing | missing | Mock fallback for `etf-flow` only |

Stale artifacts **do not** revert to mock. VIX artifact is independent.

## Caveats

- ICI weekly figures are **estimates**; monthly actuals may differ
- ICI may **revise** prior weeks
- Domestic equity ETF issuance ≠ total ETF market, mutual fund flows, or passive-share level
- Large weekly inflow = elevated **mechanical pressure proxy**, not a buy signal

## Reminders

- No live client or server fetches
- No cron — refresh is manual (typically weekly after ICI release)
- GhostYield, GhostRegime, and allocator routes are out of scope
