# GhostRegime Seed Data

This directory contains the seed CSV files for GhostRegime replay mode.

## Required Files

- `ghostregime_replay_history.csv` - Main seed file with historical data
- `ghostregime_replay_history.sample.csv` - Sample file showing expected format

## File Status

These files will be provided later. The application will return a 503 error with `GHOSTREGIME_NOT_SEEDED` until the main seed file is present and non-empty.

## Expected Schema

See `schema.ghostregime_row.v1.json` for the JSON schema definition.

For CSV format details, see `docs/ghostregime/IMPORT_SPEC.md`.

## Cutover Date

All rows in the seed CSV should have dates ≤ 2025-11-28 UTC (the cutover date). Dates after the cutover will be computed using Option B voting + VAMS.

## Validation

The application checks:
- File exists
- File is not empty (size >= 10 bytes)
- File has more than just a header row

If any of these checks fail, the application treats the seed as "not loaded yet" and returns 503 errors.

