# GhostFlow Active vs Index Flow Artifact Runbook (v0.4)

Manual refresh workflow for the **Active vs Index Flow Differential** public artifact. **No live fetches in v0.4** — values are hand-edited into static JSON committed to the repo.

See also: [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (CBOE VIX), [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md).

## Source

Official ICI monthly release:

https://www.ici.org/research/stats/combined_active_index

Also listed under ICI Monthly Statistical Publications → Monthly Active and Index Data.

## Which table/row to copy

From **Flows of Long-Term Mutual Funds and ETFs** (millions of dollars):

| Copy | Do not use for v0.4 |
|---|---|
| **Equity → Domestic equity → Active** | World equity, Hybrid, Bond, Total rows |
| **Equity → Domestic equity → Index** | AUM tables, fund-count tables |

Example (April 30, 2026 release, March 2026 flows):

- Active domestic equity: **-22,251** (millions USD) → display **-$22.3B**
- Index domestic equity: **31,463** (millions USD) → display **+$31.5B**
- Flow differential (index − active): **53,714** → display **+$53.7B**

## Units and dates

| Field | Meaning |
|---|---|
| `observations.activeDomesticEquityNetFlowMillionsUsd` | Active column, domestic equity row ($M) |
| `observations.indexDomesticEquityNetFlowMillionsUsd` | Index column, domestic equity row ($M) |
| `asOf` | **Month ended** date (ISO `YYYY-MM-DD`, last calendar day of month, e.g. `2026-03-31`) |
| `publishedAt` | **ICI release date** (e.g. `2026-04-30`) |

Do **not** store billions in the JSON. Store millions; the UI formats rounded billions (one decimal).

**Differential formula:** `indexDomesticEquityNetFlowMillionsUsd - activeDomesticEquityNetFlowMillionsUsd`

## Update the artifact

Edit [`data/ghostflow/artifacts/activeIndexFlow.v1.json`](../data/ghostflow/artifacts/activeIndexFlow.v1.json):

```json
{
  "asOf": "2026-03-31",
  "publishedAt": "2026-04-30",
  "dataQuality": "verified_manual",
  "observations": {
    "activeDomesticEquityNetFlowMillionsUsd": -22251,
    "indexDomesticEquityNetFlowMillionsUsd": 31463
  }
}
```

- `dataQuality`: `verified_manual` after double-checking the ICI release; `manual_unverified` if not yet verified
- Do **not** set `mock_fallback` in JSON (runtime-only)

Optional fields may stay `null`; v0.4 ignores them.

## Update reference date

When refreshing artifacts, update [`lib/ghostflow/reference.ts`](../lib/ghostflow/reference.ts):

```typescript
export const GHOSTFLOW_REFERENCE_AS_OF = '2026-05-21';
```

Use the date you want freshness evaluated against (typically when you refreshed).

## Validate

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

**Routine active/index refreshes** only require updating `activeIndexFlow.v1.json` and optionally `GHOSTFLOW_REFERENCE_AS_OF`. Unit tests use fixed fixtures — **do not edit tests** unless mapping, schema, or merge behavior changes.

## Freshness (monthly)

Calendar days since `publishedAt` (or `asOf` if absent):

| Days | Status |
|---|---|
| 0–35 | `fresh` |
| 36–55 | `caution` |
| >55 | `stale` |

Valid stale artifacts still display with warning. Invalid/missing artifacts fall back to mock for `active-index-flow` only.

## Scoring impact

Flow differential maps to `structuralFragility.activeShareOffsetProxy` (20% of Structural Fragility) and the `active-index-flow` signal card. This is a **monthly flow-tilt proxy** — not passive share, not active ownership, not true active-offset capacity.

## Reminders

- No live fetches, scraping, or cron.
- ICI may revise prior months — re-verify after refresh.
- Weekly active/index split is not available from ICI; do not fake weekly precision.
- GhostYield, GhostRegime, and allocator routes are out of scope.
