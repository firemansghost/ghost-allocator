# GhostFlow Artifact Runbook (v0.2)

Manual refresh workflow for GhostFlow public-data artifacts. **No live fetches in v0.2** — all values are hand-edited into static JSON files committed to the repo.

## Volatility Regime (CBOE VIX)

### Source

Official CBOE VIX History CSV:

https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv

Columns: `Date`, `Open`, `High`, `Low`, `Close` (MM/DD/YYYY dates).

### What to copy

1. Open the CSV in a browser or spreadsheet.
2. Find the **last trading-day row** (skip blank trailing lines).
3. Copy:
   - **Date** → convert to ISO `YYYY-MM-DD` for `asOf`
   - **Close** → `observations.vixClose`

Example: `05/20/2026,...,17.440000` → `asOf: "2026-05-20"`, `vixClose: 17.44`

### Update the artifact

Edit [`data/ghostflow/artifacts/volatilityRegime.v1.json`](../data/ghostflow/artifacts/volatilityRegime.v1.json):

```json
{
  "asOf": "2026-05-20",
  "publishedAt": "2026-05-20",
  "dataQuality": "verified_manual",
  "observations": { "vixClose": 17.44 }
}
```

- Set `dataQuality` to `verified_manual` after double-checking the CSV extract.
- Use `manual_unverified` if you have not verified against CBOE yet.
- Do **not** set `mock_fallback` in the JSON — that status is runtime-only.

Optional fields (`vix9dClose`, `vix3mClose`, `spyRealizedVol21dAnn`) may stay `null`; v0.2 ignores them.

### Update reference date

Edit [`lib/ghostflow/reference.ts`](../lib/ghostflow/reference.ts):

```typescript
export const GHOSTFLOW_REFERENCE_AS_OF = '2026-05-20';
```

Set this to the date you want freshness checks evaluated against (typically the latest trading day when you refreshed artifacts).

### Validate

```bash
npm run ghostflow:validate-artifacts
npm run test:ghostflow
npm test
npm run lint
npm run build
```

Routine VIX refreshes only require updating the artifact JSON and `GHOSTFLOW_REFERENCE_AS_OF`. GhostFlow unit tests use fixed fixtures — you do **not** need to edit test files unless mapping, scoring, schema, or merge behavior changes.

## Freshness states

Evaluated as **trading days** between artifact `asOf` and `GHOSTFLOW_REFERENCE_AS_OF`:

| Trading days | Status | Behavior |
|---|---|---|
| 0–2 | `fresh` | Normal public-proxy display |
| 3–5 | `caution` | Amber warning; artifact values still shown |
| >5 | `stale` | Prominent stale warning; artifact values **still shown** |
| Invalid / missing | `missing` | Mock fallback for vol-regime; dashboard warning |

Stale artifacts **do not** revert to mock. Only invalid or missing artifacts trigger mock fallback.

## Scoring impact

VIX close maps to `passivePressure.optionsVolatilityAmplifier` (20% of Passive Pressure) and the `vol-regime` signal card. See methodology on `/ghostflow` for the VIX → 0–100 mapping table.

## Reminders

- No live client or server fetches in v0.2.
- No cron jobs — refresh is manual.
- GhostYield, GhostRegime, and allocator routes are out of scope.
- VIX is a **volatility amplifier proxy**, not passive flow and not a crash countdown.
