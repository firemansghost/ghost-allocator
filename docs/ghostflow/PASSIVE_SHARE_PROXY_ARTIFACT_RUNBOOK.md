# GhostFlow ICI Index Share Proxy Artifact Runbook (v0.6)

Manual refresh workflow for the **ICI Index Share Proxy** (Public Passive Share Proxy) public artifact. **No live fetches in v0.6** — values are hand-edited into static JSON committed to the repo.

See also: [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md), [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md).

## Source

Official ICI monthly release:

https://www.ici.org/research/stats/combined_active_index

Also listed under ICI Monthly Statistical Publications → Monthly Active and Index Data.

## Which table/row to copy

From **Total Net Assets of Long-Term Mutual Funds and ETFs** (billions of dollars on the page; store **millions USD** in JSON):

| Copy | Do not use for v0.6 |
|---|---|
| **Equity → Domestic equity → Active** | Flows table (that is v0.4 active/index differential) |
| **Equity → Domestic equity → Index** | World equity, Hybrid, Bond, Total rows |
| **Index as a % of Total** (optional cross-check) | Fund-count tables |

Example (April 30, 2026 release, March 2026 assets):

- Active domestic equity: **7,537.8B** → **7,537,800** millions USD
- Index domestic equity: **12,945.7B** → **12,945,700** millions USD
- Index share: **63.2%** (ICI published column; verify against formula)

## Formula

```
indexAssetSharePercent =
  indexDomesticEquityAssetsMillionsUsd /
  (activeDomesticEquityAssetsMillionsUsd + indexDomesticEquityAssetsMillionsUsd) × 100
```

## Units and dates

| Field | Meaning |
|---|---|
| `observations.activeDomesticEquityAssetsMillionsUsd` | Active column, domestic equity row ($M) |
| `observations.indexDomesticEquityAssetsMillionsUsd` | Index column, domestic equity row ($M) |
| `observations.indexAssetSharePercent` | Computed index share (percent) |
| `asOf` | **Month ended** (ISO `YYYY-MM-DD`, e.g. `2026-03-31`) |
| `publishedAt` | **ICI release date** (e.g. `2026-04-30`) |

Do **not** store billions in the JSON. Store millions; round percent to one decimal.

## Update the artifact

Edit [`data/ghostflow/artifacts/passiveShareProxy.v1.json`](../data/ghostflow/artifacts/passiveShareProxy.v1.json):

```json
{
  "asOf": "2026-03-31",
  "publishedAt": "2026-04-30",
  "dataQuality": "verified_manual",
  "observations": {
    "activeDomesticEquityAssetsMillionsUsd": 7537800,
    "indexDomesticEquityAssetsMillionsUsd": 12945700,
    "indexAssetSharePercent": 63.2
  }
}
```

- `dataQuality`: `verified_manual` after double-checking the ICI release; `manual_unverified` if not yet verified
- Do **not** set `mock_fallback` in JSON (runtime-only)
- In `source.note`, state this is ICI fund-industry index asset share — **not** GKS market passive share

## What this is / is not

- **What it is:** ICI domestic equity index fund + ETF assets as a share of active + index domestic equity fund assets.
- **What it is not:** not true market passive share, not GKS model passive share, not market ownership, not float ownership, not trading volume, not marginal price-setting, not a crash predictor.

## Scoring impact

- Sets `raw.passiveSharePercent` and `structuralFragility.passiveShareProxy` (30% of Structural Fragility)
- Structural sub-input = `round(indexAssetSharePercent)` clamped 0–100 (identity mapping in v0.6)
- Derives `distance-65` signal card from the same artifact (not a separate manual artifact)
- Does **not** wire `modelZoneProximity` (stays mock)

## Validate

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

Routine artifact refreshes only require updating `passiveShareProxy.v1.json` and optionally `GHOSTFLOW_REFERENCE_AS_OF`. Unit tests use fixed fixtures — **do not edit tests** unless mapping, schema, or merge behavior changes.

## Freshness (monthly)

Calendar days since `publishedAt` (or `asOf` if absent):

| Days | Status |
|---|---|
| 0–35 | `fresh` |
| 36–55 | `caution` |
| >55 | `stale` |

Valid stale artifacts still display with warning. Invalid/missing artifacts fall back to mock for `passive-share`, `passiveShareProxy`, `passiveSharePercent`, and `distance-65` only.

## Reminders

- **Do not copy from the Flows table** — that feeds v0.4 active/index flow differential, not passive share.
- Refresh alongside `activeIndexFlow.v1.json` when possible (same ICI release).
- ICI may revise prior months — re-verify after refresh.
- GhostYield, GhostRegime, and allocator routes are out of scope.
