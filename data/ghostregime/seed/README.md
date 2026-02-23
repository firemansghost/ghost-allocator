# GhostRegime Seed Data

This directory contains the seed CSV used to bootstrap GhostRegime history and enable deterministic local behavior.

## Seed File Location

- **Path in repo**: `data/ghostregime/seed/ghostregime_replay_history.csv`
- **Config reference**: `lib/ghostregime/config.ts` → `SEED_FILE_PATH`

The application reads this file at runtime. If it is missing or empty, GhostRegime API endpoints return `503` with `GHOSTREGIME_NOT_SEEDED` (today, explain, history) or health returns `503 NOT_READY` when no persisted latest row exists.

## What the Seed Is For

- **Bootstrap history**: Provides pre-computed regime rows for dates up to the cutover date so the app can serve history and “today” without requiring live market data for past dates.
- **Deterministic local behavior**: Enables local development and CLI diagnostics to behave consistently without Blob storage or production secrets.

## Cutover Date

- **Config**: `NEXT_PUBLIC_GHOSTREGIME_CUTOVER_DATE_UTC` (default: `2025-11-28T00:00:00Z`), see `lib/ghostregime/config.ts`.
- **Behavior**:
  - **Dates ≤ cutover**: Served from the seed CSV (rows with `date` ≤ cutover are used; source is replay).
  - **Dates after cutover**: Computed from live market data and persisted to Blob storage (Option B voting + VAMS). No seed rows are used for those dates.

So: seed covers “up to cutover”; after cutover, runtime persistence is used.

## What Breaks If the Seed Is Missing

| Endpoint / behavior | When seed missing or empty |
|--------------------|----------------------------|
| `GET /api/ghostregime/today` | `503` with `error: "GHOSTREGIME_NOT_SEEDED"` |
| `GET /api/ghostregime/explain` | `503` with `error: "GHOSTREGIME_NOT_SEEDED"` |
| `GET /api/ghostregime/history` | `503` with `error: "GHOSTREGIME_NOT_SEEDED"` |
| `GET /api/ghostregime/health` | May return `503 NOT_READY` if there is no persisted latest row (e.g. no successful force refresh yet). Health does not itself check the seed file; today/explain/history do. |

The daily workflow (`.github/workflows/ghostregime-daily.yml`) skips the refresh and health steps if the seed file is missing or empty.

## Validation (What the App Checks)

- File exists at `SEED_FILE_PATH`
- File size ≥ 10 bytes
- File contains more than a header row (at least one data row)

If any of these fail, the seed is treated as “not loaded” and the above endpoints return `503` as described.

## Schema and Format

- **JSON schema**: `schema.ghostregime_row.v1.json` in this directory.
- **CSV format**: See `docs/ghostregime/IMPORT_SPEC.md`.

## Refreshing or Updating the Seed

Process for refreshing or updating the seed file is currently manual:

1. **TBD**: Source for authoritative history (e.g. export from production persistence or from a trusted replay pipeline).
2. **TBD**: Generate or export CSV rows with `date` ≤ cutover, matching the schema.
3. **TBD**: Validate CSV (schema, date range, no dates after cutover).
4. Replace `data/ghostregime/seed/ghostregime_replay_history.csv` with the new file.
5. Commit and deploy (or run locally). No application config change is required if the path and cutover date are unchanged.

Until the TBD steps are finalized, treat seed updates as a manual, documented operation.
