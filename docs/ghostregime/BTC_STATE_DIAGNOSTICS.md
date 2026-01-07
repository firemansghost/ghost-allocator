# BTC State Diagnostics

This document describes how to diagnose BTC state mismatches between GhostRegime and external reference data.

## Overview

GhostRegime computes BTC VAMS state using:
- **Momentum**: `0.6 × TR_126 + 0.4 × TR_252` (close-to-close returns)
- **Volatility**: `stdev(daily_returns, 63) × √252` (annualized)
- **Score**: `momentum / volatility`
- **State Thresholds**: 
  - Score ≥ +0.50 → State = +2 (Bullish)
  - Score ≤ -0.50 → State = -2 (Bearish)
  - Otherwise → State = 0 (Neutral)

If GhostRegime's BTC state differs from the reference, the mismatch can be due to:
1. **Different BTC price series** (proxy/data alignment issue)
2. **Different calculation methods/thresholds** (math issue)
3. **Date alignment/holiday handling** (calendar issue)

## Prerequisites

- Reference data files in `.local/reference/` (or `GHOSTREGIME_REFERENCE_DATA_DIR`):
  - `reference_states.csv` (required)
  - `reference_prices.csv` (optional but recommended for attribution)
- `RUN_PARITY_TESTS=1` environment variable (for parameter scan)

**Note:** CLI diagnostics run with local persistence and do not require `BLOB_READ_WRITE_TOKEN`. The bootstrap automatically configures the runtime to use local file storage.

## Diagnostic Workflow

### Step 1: Check BTC State for a Specific Date

Use the `why-btc-state` script to see exactly what inputs produced the BTC state:

```powershell
# Windows PowerShell
npm run ghostregime:why-btc-state -- --date 2026-01-02
```

Or directly with tsx:
```powershell
tsx scripts/ghostregime/why-btc-state.ts --date 2026-01-02
```

This will show:
- TR_126 and TR_252 values
- Momentum score
- Volatility (annualized)
- Combined score
- State and scale
- Comparison with reference state (if available)

**Example output:**
```
=== BTC State Debug ===

Date: 2026-01-02
Proxy Symbol: BTC-USD
Last Price Date Used: 2026-01-02T00:00:00.000Z
Close: $43250.00

Momentum Calculation:
  TR_126: 15.23%
  TR_252: 8.45%
  Momentum = 0.6 × TR_126 + 0.4 × TR_252
  Momentum Score: 0.1234

Volatility Calculation:
  Window: 63 days
  Volatility (annualized): 0.4567

Combined Score:
  Score = Momentum / Volatility
  Combined Score: 0.2701

State Thresholds:
  Score ≥ 0.5 → State = +2 (Bullish)
  Score ≤ -0.5 → State = -2 (Bearish)
  Otherwise → State = 0 (Neutral)

Result:
  State: 0
  Scale: 0.5

=== Comparison with Reference ===

GhostRegime State: 0 (Scale: 0.5)
Reference State: -2 (Scale: 0.0)
Match: ✗

⚠️  MISMATCH: GhostRegime shows 0, Reference shows -2
```

### Step 2: Determine Attribution (Data vs Math)

Run the attribution report to determine whether the mismatch is primarily due to:
- Different BTC price series (proxy/data issue)
- Different calculation methods/thresholds (math issue)

```powershell
# Windows PowerShell
npm run ghostregime:btc-attribution
```

Or directly with tsx:
```powershell
tsx scripts/ghostregime/btc-mismatch-attribution.ts
```

This generates `reports/btc_mismatch_attribution.md` with:
- Production match rate (GhostRegime computed state vs reference)
- Reference price match rate (GhostRegime math on reference prices vs reference)
- Attribution conclusion:
  - If reference prices improve match rate → **Proxy/Data likely cause**
  - If reference prices don't improve → **Math/Thresholds likely cause**
  - If mixed → **Both data and math differences**

**Example conclusion:**
```
**Conclusion: Proxy/Data likely cause**

Using reference prices with GhostRegime math improves match rate by 15.2%.
This suggests the mismatch is primarily due to different BTC price series (proxy/data alignment).
```

### Step 3: Parameter Sensitivity Scan (Optional)

If the attribution suggests math/threshold differences, run a parameter scan to find optimal thresholds:

```powershell
# Windows PowerShell
$env:RUN_PARITY_TESTS = "1"
npm run ghostregime:btc-parameter-scan
```

Or directly with tsx:
```powershell
$env:RUN_PARITY_TESTS = "1"
tsx scripts/ghostregime/btc-parameter-scan.ts
```

This tests different combinations of:
- Negative threshold: [-0.40, -0.45, -0.50, -0.55, -0.60]
- Positive threshold: [0.40, 0.45, 0.50, 0.55, 0.60]
- Momentum weights: (0.5/0.5), (0.6/0.4), (0.7/0.3)

Generates `reports/btc_parameter_scan.md` with:
- Top 5 parameter sets by match rate
- Current default parameters rank
- Interpretation guidance

**Note:** This is analysis only. No changes to production config are made.

## Decision Tree

```
Is there a BTC state mismatch?
│
├─→ Run why-btc-state for the date
│   │
│   └─→ Check if reference prices are available
│       │
│       ├─→ Yes → Run attribution report
│       │   │
│       │   ├─→ If "Proxy/Data likely cause"
│       │   │   └─→ Check:
│       │   │       - Proxy symbol alignment (BTC-USD vs XBT)
│       │   │       - Date alignment (holiday handling)
│       │   │       - Data source differences (Stooq vs CoinGecko vs reference)
│       │   │
│       │   ├─→ If "Math/Thresholds likely cause"
│       │   │   └─→ Run parameter scan
│       │   │       └─→ Review top parameter sets
│       │   │           └─→ Consider threshold/math adjustments (separate step)
│       │   │
│       │   └─→ If "Mixed"
│       │       └─→ Address both data and math differences
│       │
│       └─→ No → Attribution report will indicate "Cannot determine"
│           └─→ Provide reference_prices.csv to enable attribution
```

## Common Issues

### Issue: "Insufficient Data"

**Symptom:** `why-btc-state` shows "⚠️ Insufficient Data"

**Causes:**
- Not enough historical data (need at least 252 observations for TR_252)
- Date is too early in the series
- Market data fetch failed

**Fix:**
- Check market data availability for the date
- Verify data source is working
- Use a later date if testing early dates

### Issue: "Reference prices not available"

**Symptom:** Attribution report says "Cannot determine"

**Fix:**
- Place `reference_prices.csv` in `.local/reference/` (or `GHOSTREGIME_REFERENCE_DATA_DIR`)
- File should have columns: `date`, `XBT_close` (or `XBT`)

### Issue: "Date mismatch"

**Symptom:** Reference state exists but GhostRegime shows different date

**Causes:**
- Holiday handling differences
- Timezone differences
- Data source update cadence

**Fix:**
- Check `lastPriceDateUsed` in debug output
- Verify date alignment between GhostRegime and reference
- Consider calendar alignment adjustments

## Files

- `lib/ghostregime/parity/btcStateDebug.ts` - Debug exporter (pure function)
- `scripts/ghostregime/why-btc-state.ts` - CLI for specific date
- `scripts/ghostregime/btc-mismatch-attribution.ts` - Attribution report
- `scripts/ghostregime/btc-parameter-scan.ts` - Parameter sensitivity scan
- `reports/btc_mismatch_attribution.md` - Generated attribution report
- `reports/btc_parameter_scan.md` - Generated parameter scan report

## Notes

- All diagnostic tools are opt-in and require local reference data
- No changes to production config are made by these tools
- Reports are generated deterministically (same inputs = same outputs)
- Use neutral language: "External Reference Workbook", "Reference data", "Parity harness"
