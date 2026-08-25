# STATUS

## Current State (GhostFlow — 2026-08-25)
PR **#139** merged the Board H.15 Treasury yields adapter on `main` (`0cf02b9`).

Starting `main` for this work: `0cf02b922baf0f5a6ade38f700dee886f307e4d7`.

**Manual report-only operator runner implemented** for:
- `systematicFlowProxy` (`cftc-tff-systematic-socrata`)
- `treasuryFuturesPositioningProxy` (`cftc-tff-treasury-socrata`)
- `treasuryLongEndIncomeLens` (`frb-h15-treasury-yields-csv`)

Runner behavior:
- Reads current production artifacts only for validated date summaries
- Fetches official sources through existing adapters
- Builds the existing GhostFlow refresh report (`report_only`, human review required)
- Writes nothing (no production, candidate, history, score, or reference changes)
- Cannot generate candidates or change production

VIX remains excluded because Gate C / `marketBreadth` remain blocked.

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

## Recommended next work
1. Design human-reviewed candidate generation for report-ready non-score-fed observations (not implemented)
2. Breadth: decide written provider permission **or** licensed SKU investigation (neither approved)
3. Do not wire VIX or Gate C until authorized breadth source exists

Last updated: 2026-08-25

---

## Archive — Board H.15 Treasury adapter (2026-07-13)
PR **#138** merged the Treasury long-end source feasibility audit on `main` (`9cf9fa4`).

**Board H.15 Treasury long-end adapter implemented** (fixture-driven, unwired):
- Canonical source migrated from FRED → Board of Governors H.15 DDP (`frb-h15-treasury-yields-csv` / `1.0.0`)
- Required: 30Y nominal + 30Y inflation-indexed; optional: 2Y / 5Y / 10Y nominal on common date
- **T10YIE omitted**; no derived breakeven
- Display-only / unscored / `human_required`; no production artifact writer or workflow wiring
- DECISIONS records Bobby’s 2026-07-13 source migration approval
- No production artifact refresh; historical FRED provenance in committed JSON unchanged

**Implemented but unwired adapters:**
- `cboe-vix-history-csv`
- `cftc-tff-systematic-socrata`
- `cftc-tff-treasury-socrata`
- `frb-h15-treasury-yields-csv`

Production GhostFlow state remains unchanged:
- `GHOSTFLOW_REFERENCE_AS_OF`: 2026-07-01
- Composite / Passive / Structural: 60 / 53 / 67
- Band: Elevated Flow Pressure
- `publicSignalCount`: 13
- MOCK systematic / retirement / levered: 62 / 58 / 55

Breadth and Gate C remain blocked. VIX / CFTC adapters remain unwired.

## Recommended next work
1. Do **not** wire H.15 / CFTC / VIX adapters into production refresh, CLI, or workflows yet
2. Breadth: decide written provider permission **or** licensed SKU investigation (neither approved)
3. Optional later: operator runner / human-approved long-end refresh using H.15 (no silent FRED graph CSV)

Last updated: 2026-07-13

---

## Archive — Treasury long-end source audit (2026-07-13)
