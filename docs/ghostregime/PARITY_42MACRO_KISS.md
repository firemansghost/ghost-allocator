# GhostRegime Parity Harness: 42 Macro KISS

## Overview

This parity harness validates that GhostRegime allocation wiring matches the 42 Macro KISS reference model. It answers one crisp question:

**"If the KISS states are known, do we produce the same allocations as the KISS workbook?"**

## What This Is

- A **validation tool** that locks allocation math when states are known
- A **test suite** that prevents BTC sizing bugs from returning
- A **debug panel** for viewing KISS reference allocations
- A **parity check** against 2,091 backtest rows

## What This Is NOT

- **NOT** a reverse-engineering of KISS state computation (VAMS math)
- **NOT** a change to GhostRegime default behavior
- **NOT** a replacement for GhostRegime's own allocation logic
- **NOT** used in normal GhostRegime mode (debug/toggle only)

## Naming Convention

- **GhostRegime** = our product/module
- **KISS** = the external 42 Macro reference model/data source

We are building GhostRegime parity tooling using KISS reference data.

## Reference Files

Reference files live in `data/kiss/`:

- `kiss_latest_snapshot.json` - Latest snapshot (2026-01-02)
- `kiss_reference_kiss_backtest.csv` - 2,091 backtest rows (2017-12-29 to 2025-12-31)
- `kiss_states_market_regime_ES1_XAU_XBT.csv` - Historical states (optional)
- `kiss_prices_ES1_XAU_XBT.csv` - Historical prices (optional, not used in this step)

These files are inputs for tests + parity UI. They are **not** used in normal GhostRegime mode.

## KISS Behavior Spec (Truth)

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

GhostRegime currently shows BTC as "half" (state 0) which is **wrong** vs the KISS reference.

## Running Tests

```bash
# Run parity tests
npm run test:parity

# Or use the alias
npm run ghostregime:parity
```

Tests validate:
1. Latest snapshot parity (2026-01-02) - BTC must be 0.0
2. All 2,091 backtest rows match within tolerance (1e-9)

## Using the Parity Panel

1. Navigate to `/ghostregime`
2. Click "Parity: 42 Macro KISS" toggle (near Advanced Details)
3. Click "Load KISS Reference Snapshot"
4. Verify allocations match KISS sheet values

The panel shows:
- Snapshot info (date, regime)
- States (ES1, XAU, XBT)
- Targets (from regime)
- Scales (from states: +2→1.0, 0→0.5, -2→0.0)
- Final allocations (stocks, gold, bitcoin, cash)
- KISS sheet reference values

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

## The Real Problem (Future Work)

Once this harness is in place, the real question becomes:

**"Why does GhostRegime compute BTC state differently than KISS?"**

That's a whole separate boss fight. This harness only validates allocation math, not state computation.

## Acceptance Test

With parity mode using `kiss_latest_snapshot.json`:
- Date: 2026-01-02
- Regime: GOLDILOCKS
- States: ES1 +2, XAU +2, XBT -2
- **Outputs must be:**
  - Stocks 0.60
  - Gold 0.30
  - Bitcoin 0.00 ✓
  - Cash 0.10

If this test fails, the harness is working correctly - it caught a mismatch.
