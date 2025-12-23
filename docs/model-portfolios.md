# Model Portfolio Specification

## Purpose

Model portfolios define the target allocation across Ghost sleeves for each risk level (1–5). These are the "blueprints" that drive the builder output: when a user completes the questionnaire and receives a risk level, the system selects the corresponding model portfolio and displays it as the target allocation.

The model portfolios are:
- **Human-readable** (this document) for review and trust
- **Code-backed** (`lib/modelPortfolios.ts`) so outputs match the spec
- **Single source of truth** for all sleeve weights

## Terminology

- **RiskLevel**: Integer 1–5, computed from questionnaire answers
- **Sleeves**: Asset class categories (core_equity, convex_equity, real_assets, t_bills, core_bonds, managed_futures, rate_hedge, cash)
- **Blueprint vs Implementation**: The model portfolio is the blueprint (sleeve weights). The implementation is how those sleeves are translated into actual funds:
  - **Voya-only**: Translation using the limited OKC Voya menu (target date funds or core mix)
  - **Voya+Schwab**: Schwab handles growth sleeves (core_equity, convex_equity), Voya handles defensive/inflation bucket (real_assets, t_bills, core_bonds, managed_futures, rate_hedge, cash)

## Model Portfolio Definitions

### Risk Level 1 (r1) — Conservative
**Intent**: Sleep-at-night allocation. Higher defensive assets and cash. Suitable for those near retirement or with low risk tolerance.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 20% |
| convex_equity | 10% |
| real_assets | 15% |
| t_bills | 20% |
| core_bonds | 15% |
| managed_futures | 10% |
| rate_hedge | 5% |
| cash | 5% |
| **Total** | **100%** |

### Risk Level 2 (r2) — Conservative
**Intent**: Similar to r1, defensive focus. Currently maps to the same conservative model as r1.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 20% |
| convex_equity | 10% |
| real_assets | 15% |
| t_bills | 20% |
| core_bonds | 15% |
| managed_futures | 10% |
| rate_hedge | 5% |
| cash | 5% |
| **Total** | **100%** |

*Note: A retirement-specific model exists in code but is not currently used. Risk level 2 maps to conservative for consistency.*

### Risk Level 3 (r3) — Moderate
**Intent**: Balanced allocation across asset classes. Designed for investors with medium-term horizons and moderate risk tolerance.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 30% |
| convex_equity | 15% |
| real_assets | 15% |
| t_bills | 10% |
| core_bonds | 10% |
| managed_futures | 12% |
| rate_hedge | 5% |
| cash | 3% |
| **Total** | **100%** |

### Risk Level 4 (r4) — Aggressive
**Intent**: Higher equity allocation with strategic use of convexity and real assets. For investors with longer horizons and higher risk tolerance.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 35% |
| convex_equity | 20% |
| real_assets | 15% |
| t_bills | 5% |
| core_bonds | 5% |
| managed_futures | 15% |
| rate_hedge | 3% |
| cash | 2% |
| **Total** | **100%** |

### Risk Level 5 (r5) — Aggressive
**Intent**: Maximum growth focus. Same allocation as r4.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 35% |
| convex_equity | 20% |
| real_assets | 15% |
| t_bills | 5% |
| core_bonds | 5% |
| managed_futures | 15% |
| rate_hedge | 3% |
| cash | 2% |
| **Total** | **100%** |

## Implementation Notes

### Voya-Only Implementation
For users with only Voya access, the model portfolio sleeves are translated into:
- **Simple path**: Target date fund recommendation (based on years to goal and risk level)
- **Core mix path**: Custom Voya fund mix that approximates the sleeve allocation using the available OKC Voya menu

The translation is handled by `lib/voya.ts` functions (`getCoreMixForRisk`, `getComplementaryMixForRisk`).

### Voya + Schwab Implementation
For users with both platforms:
- **Schwab** (growth bucket): Handles `core_equity` and `convex_equity` sleeves via ETFs
- **Voya** (defensive/inflation bucket): Handles `real_assets`, `t_bills`, `core_bonds`, `managed_futures`, `rate_hedge`, and `cash` via complementary fund mix

This split avoids duplicating equity funds and makes the platform division intentional.

## Where It Lives in Code

- **Spec definition**: `lib/modelPortfolios.ts` — `MODEL_PORTFOLIOS` constant
- **Risk-to-model mapping**: `lib/modelPortfolios.ts` — `RISK_TO_MODEL` constant
- **Usage**: `lib/portfolioEngine.ts` — `selectModelPortfolio()` function
- **Sleeve definitions**: `lib/sleeves.ts` — `sleeveDefinitions` (names, descriptions, roles)
- **ETF examples**: `lib/sleeves.ts` — `exampleETFs` array

## Validation

The model portfolio config includes validation that runs in development:
- All sleeve keys exist in sleeve definitions
- All values are numbers
- Sleeve weights sum to ~100% (tolerance: ±0.5%)

See `lib/modelPortfolios.ts` for validation implementation.

Run `npm run audit:models` to generate a full audit report.

## Builder Output Review Checklist

When reviewing builder outputs to ensure they match these model portfolio specifications:

### Model Portfolio Sanity Checks
- ✅ **Does each model look sane for its risk band?**
  - Risk 1–2 (Conservative): Higher defensive assets (t_bills, core_bonds, cash) and lower equity
  - Risk 3 (Moderate): Balanced across asset classes
  - Risk 4–5 (Aggressive): Higher equity allocation, lower defensive assets

### Voya-Only Implementation Checks
- ✅ **Is the Voya-only target mix readable and implementable?**
  - Target date fund path: Does the recommended TDF match the risk level and years to goal?
  - Core mix path: Does the fund mix approximate the sleeve allocations using available Voya funds?
  - Are the fund allocations clear and actionable (user can set them in Voya)?

### Voya+Schwab Implementation Checks
- ✅ **Does Voya+Schwab avoid duplicate equity exposure?**
  - Schwab should handle growth sleeves (core_equity, convex_equity) via ETFs
  - Voya should handle defensive/inflation bucket (real_assets, t_bills, core_bonds, managed_futures, rate_hedge, cash)
  - No duplication of equity funds between platforms

### ETF Examples Checks
- ✅ **Do the ETF examples cover the sleeves logically?**
  - Each non-zero sleeve should have at least one example ETF
  - ETF examples should match the sleeve's role (e.g., SPYV for core_equity, GLD for real_assets)

### Important Note: Blueprint vs Implementation

The model portfolios are the **blueprint** (sleeve allocations). The builder is the **implementation layer** that translates these blueprints into actual fund recommendations. The implementation may differ from the blueprint in order to:

- Work within platform constraints (Voya menu limitations)
- Provide actionable guidance (specific fund names, not abstract sleeves)
- Optimize for user experience (simpler mixes for simple path, detailed mixes for advanced path)

When reviewing, focus on whether the implementation **achieves the blueprint's intent** rather than matching it exactly. For example, a 15% real_assets sleeve might translate to a 12% gold fund + 3% commodity fund in Voya due to menu constraints — that's acceptable as long as the intent (inflation protection) is preserved.

## UI Templates

The `/models` page displays five model portfolio templates:

1. **Conservative** — Lower risk, steady growth focus (Coming Soon)
2. **Balanced** — Moderate risk with growth potential (Coming Soon)
3. **Growth** — Higher risk, higher growth potential (Coming Soon)
4. **Aggressive** — Maximum growth focus (Coming Soon)
5. **GhostRegime 60/30/10** — Flagship template: 60% stocks, 30% gold, 10% BTC with regime-based scaling (**Live**)

### Template Status

- **GhostRegime 60/30/10** is **Live** and available for use. It is the house template and explicitly uses Gold and Bitcoin allocations with regime-based scaling. Example implementation in Schwab: SPYM (stocks), GLDM (gold), FBTC (bitcoin). Requires Schwab/BrokerageLink.
- **Other templates** (Conservative, Balanced, Growth, Aggressive) are **Coming Soon**. These templates are risk-based and do **NOT** require Gold/BTC unless enabled later. These templates use the standard Ghost sleeve allocations (core_equity, convex_equity, real_assets, etc.) and can be implemented using Voya funds and/or Schwab ETFs.

The template definitions live in `lib/modelTemplates.ts` and are the single source of truth for the `/models` page UI.

## House Presets (Schwab)

House presets are an alternative to the standard Ghost sleeve-based approach for users with Schwab BrokerageLink access. They replace the Schwab ETF sleeve lineup with a simplified house model allocation.

### Standard vs House Preset

- **Standard preset**: Uses Ghost sleeves (core_equity, convex_equity, real_assets, etc.) mapped to example ETFs. This is the default approach.
- **House presets**: Replace the Schwab lineup with a fixed allocation (S&P + Gold + Bitcoin). Currently available:
  - **GhostRegime 60/30/10**: 60% SPYM (S&P 500), 30% GLDM (Gold), 10% FBTC (Bitcoin)
  - **GhostRegime 60/25/15**: 60% SPYM (S&P 500), 25% GLDM (Gold), 15% FBTC (Bitcoin)

### Important Notes

- **House presets are Schwab-only**: They require `platform === "voya_and_schwab"`. Voya-only users cannot select house presets.
- **Percentages are of Schwab slice**: The allocations (60%, 30%, 10%) are percentages of the Schwab portion of the 457, not the total 457 balance.
- **Voya defensive-only**: When a house preset is selected, the Voya mix becomes defensive-only (stable value + bonds) with no real assets fund, because Gold is already handling inflation protection on the Schwab side. This avoids "real assets in both places" confusion.
- **Standard behavior unchanged**: When Standard preset is selected, all existing behavior remains unchanged.

The house model definitions live in `lib/houseModels.ts` and are the single source of truth for house preset allocations.

## Optional Gold + Bitcoin Tilt (Standard preset, Schwab only)

For users with Schwab BrokerageLink access using the Standard preset, an optional tilt can be applied to the Schwab lineup.

### How It Works

- **Applies only to Standard preset**: The tilt is not available for house presets (which already include Gold/BTC) or Voya-only users.
- **Adjusts Schwab slice only**: Percentages are of the Schwab portion of the 457, not the total 457 balance.
- **Proportional scaling**: When tilt is enabled, GLDM (Gold) and FBTC (Bitcoin) are added at the specified weights, and all existing Standard Schwab ETF sleeve weights are scaled down proportionally to make room.
- **Voya mix unchanged**: The Voya mix remains the same as Standard preset (no defensive-only changes).

### Tilt Options

- **None** (default): No tilt applied
- **10% Gold / 5% Bitcoin**: Adds 10% GLDM and 5% FBTC to Schwab slice
- **15% Gold / 5% Bitcoin**: Adds 15% GLDM and 5% FBTC to Schwab slice

### Important Notes

- **House presets already include Gold/BTC**: The tilt toggle is hidden when a house preset is selected, as house presets already have Gold and Bitcoin allocations built in.
- **Voya-only users**: The tilt is not available for Voya-only users (toggle is hidden).
- **Implementation**: The tilt logic lives in `lib/schwabTilt.ts` and is applied in the builder when rendering the Schwab lineup.

## Review Harness

A lightweight output review harness is available for internal QA and sanity-checking builder outputs. It renders deterministic fixtures and computed outputs in one place.

**Enable via environment variable:**
- Set `NEXT_PUBLIC_ENABLE_REVIEW_HARNESS="true"` in your `.env.local` file
- Navigate to `/review/builder` to view the review harness

**What it shows:**
- Fixtures for Voya-only + Standard, Voya+Schwab + Standard, and Voya+Schwab + House presets
- Computed outputs: Voya mix, Schwab lineup, platform splits
- Assertions: percent totals, house preset ticker validation, Voya defensive-only check for house presets

**Fixtures are defined in:** `lib/reviewFixtures.ts`

