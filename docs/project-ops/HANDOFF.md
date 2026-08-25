# HANDOFF

## Last Session Summary (2026-08-25)
Starting `main`: `0cf02b922baf0f5a6ade38f700dee886f307e4d7` (PR **#139** Board H.15 adapter merged). Implemented manual **report-only operator runner** (`npm run ghostflow:refresh-report`) for three non-score-fed adapters: systematic CFTC, Treasury CFTC, and Board H.15 long-end. Runner validates current production artifacts, executes existing fetch/parse/normalize adapters, compares observation dates, and feeds the existing offline refresh planner. Writes nothing. VIX / Gate C excluded; breadth remains blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Manual operator report path is implemented for the explicit three-artifact allowlist.
- H.15, CFTC systematic, and CFTC Treasury adapters remain production-unwired.
- VIX adapter remains implemented and excluded from the operator runner.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Design human-reviewed candidate generation for report-ready non-score-fed observations (not scheduled automation)
2. Breadth: decide written permission vs licensed SKU (neither approved)
3. Do not wire VIX, Gate C, or production writers without explicit approval

## Open Questions
- What candidate-generation approval workflow should follow operator reports?
- When should display adapters move from report-only to durable candidate artifacts?

---

## Archive — Board H.15 adapter (2026-07-13)
Starting `main`: `9cf9fa4` (PR **#138** Treasury long-end source audit merged). Implemented fixture-driven **Board H.15 Treasury yields adapter** (`frb-h15-treasury-yields-csv` → `implemented` / `1.0.0`) after Bobby approved migrating `treasuryLongEndIncomeLens` off FRED. Dual DDP packages: official TCM + `RIFLGFCY30_XII_N.B`. Required 30Y nom + 30Y real; optional 2/5/10Y; **T10YIE omitted** (no derived breakeven). Unwired; no production write. DECISIONS appended. CFTC systematic/Treasury + VIX remain unwired. Breadth / Gate C blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Long-end H.15 adapter: fixture-tested, registry implemented, production-unwired.
- Source decision recorded; FRED graph CSV / API not production transports for this artifact.
- Treasury CFTC + systematic + VIX adapters remain implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Do not wire H.15 / CFTC / VIX adapters into CLI/workflows/production writers yet
2) Breadth: decide written permission vs licensed SKU (neither approved)
3) Optional: human-approved artifact refresh path using H.15 (separate from this adapter PR)

## Open Questions
- When should display adapters become operator-driven vs remain research/fixture-only?
- Later breakeven posture: omit permanently, derived H.15, or FRED under written permission?

---

## Archive — Treasury long-end source audit (2026-07-13)
