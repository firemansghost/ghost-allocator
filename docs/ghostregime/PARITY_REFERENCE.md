# GhostRegime Parity Harness: External Reference Workbook

## Overview

This parity harness validates that GhostRegime allocation wiring matches an external reference workbook. It answers one crisp question:

**"If the reference states are known, do we produce the same allocations as the reference workbook?"**

## What This Is

- A **validation tool** that locks allocation math when states are known
- A **test suite** that prevents BTC sizing bugs from returning
- A **debug panel** for viewing reference workbook allocations
- A **parity check** against 2,091 backtest rows

## What This Is NOT

- **NOT** a reverse-engineering of reference state computation (VAMS math)
- **NOT** a change to GhostRegime default behavior
- **NOT** a replacement for GhostRegime's own allocation logic
- **NOT** used in normal GhostRegime mode (debug/toggle only)

## Naming Convention

- **GhostRegime** = our product/module
- **Reference Workbook** = the external reference model/data source

We are building GhostRegime parity tooling using reference workbook data.

## Reference Files

Reference files must be placed in a local-only directory (not in the repo or public/):

- `reference_latest_snapshot.json` - Latest snapshot (2026-01-02)
- `reference_backtest.csv` - 2,091 backtest rows (2017-12-29 to 2025-12-31)
- `reference_states.csv` - Historical states (optional)

Default location: `.local/reference/`

Override via env var: `GHOSTREGIME_REFERENCE_DATA_DIR`

These files are inputs for tests + parity UI. They are **not** used in normal GhostRegime mode.

## Reference Behavior Spec (Truth)

### 1. Regime → Targets

**If Market Regime ∈ {GOLDILOCKS, REFLATION}** (Risk On):
- Stocks target = 0.60
- Gold target = 0.30
- Bitcoin target = 0.10

**If Market Regime ∈ {INFLATION, DEFLATION}** (Risk Off):
- Stocks target = 0.30
- Gold target = 0.30
- Bitcoin target = 0.05

### 2. State → Scale

- `+2` → `1.0` (100% of target)
- `0` → `0.5` (50% of target)
- `-2` → `0.0` (0% of target)

### 3. Actual Exposures

```
stocks_actual = stocks_target × scale(stocks_state)
gold_actual = gold_target × scale(gold_state)
btc_actual = btc_target × scale(btc_state)
cash = 1 - (stocks_actual + gold_actual + btc_actual)
```

## Known Mismatch (The Bug We're Catching)

**As-of 2026-01-02:**
- Market Regime = GOLDILOCKS
- States: ES1 = +2, XAU = +2, XBT = -2
- **Expected:**
  - BTC actual = 0.00 (because -2 → 0.0 scale)
  - Cash = 0.10
  - Stocks = 0.60
  - Gold = 0.30

GhostRegime currently shows BTC as "half" (state 0) which is **wrong** vs the reference workbook.

## Running Tests

```bash
# Run parity tests (opt-in, requires reference data)
RUN_PARITY_TESTS=1 npm run test:parity

# Or use the alias
RUN_PARITY_TESTS=1 npm run ghostregime:parity
```

Tests validate:
1. Latest snapshot parity (2026-01-02) - BTC must be 0.0
2. All 2,091 backtest rows match within tolerance (1e-9)

**Note:** Tests are opt-in and will skip if `RUN_PARITY_TESTS != 1` or reference data is not found locally.

## Using the Parity Panel

1. Navigate to `/ghostregime`
2. Set `NEXT_PUBLIC_ENABLE_PARITY=1` in your environment
3. Click "Parity: External Reference" toggle (near Advanced Details)
4. Click "Load Reference Snapshot"

**Note:** Reference data must be available locally (not served from public/). The panel will show a friendly error if data is not found.

The panel shows:
- Snapshot info (date, regime)
- States (ES1, XAU, XBT)
- Targets (from regime)
- Scales (from states: +2→1.0, 0→0.5, -2→0.0)
- Final allocations (stocks, gold, bitcoin, cash)
- Reference sheet values

## Module Structure

```
lib/ghostregime/parity/
├── kissTypes.ts          # Type definitions
├── kissLoaders.ts        # Node.js loaders (for tests)
├── kissLoaders.browser.ts # Browser loaders (for UI)
├── kissAlloc.ts          # Pure allocation engine
└── __tests__/
    └── kissAlloc.test.ts # Parity tests
```

## Guardrails

**If you change data schema/providers, update loaders/tests. UI should not lie.**

This comment appears at the top of all parity files to prevent drift.

**Vendor naming is forbidden in UI/docs.** Use neutral language:
- "External Reference Workbook" not "42 Macro KISS"
- "Reference" not "KISS"

Run `npm run check:parity-names` to verify.

## The Real Problem (Future Work)

Once this harness is in place, the real question becomes:

**"Why does GhostRegime compute BTC state differently than the reference?"**

That's a whole separate boss fight. This harness only validates allocation math, not state computation.

## Acceptance Test

With parity mode using `reference_latest_snapshot.json`:
- Date: 2026-01-02
- Regime: GOLDILOCKS
- States: ES1 +2, XAU +2, XBT -2
- **Outputs must be:**
  - Stocks 0.60
  - Gold 0.30
  - Bitcoin 0.00 ✓
  - Cash 0.10

If this test fails, the harness is working correctly - it caught a mismatch.
