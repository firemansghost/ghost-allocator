# Model Portfolio Specification

## Purpose

Model portfolios define the target allocation across Ghost sleeves for each risk level (1–5). These are the "blueprints" that drive the builder output: when a user completes the questionnaire and receives a risk level, the system selects the corresponding model portfolio and displays it as the target allocation.

The model portfolios are:
- **Human-readable** (this document) for review and trust
- **Code-backed** (`lib/modelPortfolios.ts`) so outputs match the spec
- **Single source of truth** for all sleeve weights — **code wins** if this document drifts

## Terminology

- **RiskLevel**: Integer 1–5, computed from questionnaire answers
- **Active sleeves (standard models):** `core_equity`, `gold`, `commodities`, `t_bills`, `core_bonds`, `managed_futures`, `rate_hedge`, `cash`
- **Legacy type only:** `real_assets` remains in `SleeveId` for backward compatibility and is **not** used in current standard model weights or Schwab lineups (gold and commodities are separate)
- **Removed from standard models:** `convex_equity` (historical — weight was merged into `core_equity`; see `docs/project-ops/DECISIONS.md`)
- **Blueprint vs Implementation**: The model portfolio is the blueprint (sleeve weights). The implementation is how those sleeves are translated into actual funds:
  - **Voya-only**: Translation using the limited OKC Voya menu (core mix)
  - **Voya+Schwab**: Schwab example ETFs for growth/alts sleeves; Voya complementary mix for the defensive/inflation bucket

## Model Portfolio Definitions

Weights below match `MODEL_PORTFOLIOS` in `lib/modelPortfolios.ts` exactly (percent of total Ghost sleeve blueprint).

### Risk Level 1 (r1) — Conservative
**Intent**: Lower risk, higher allocation to defensive assets and cash. Suitable for those near retirement or with low risk tolerance.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 30% |
| gold | 10% |
| commodities | 5% |
| t_bills | 20% |
| core_bonds | 15% |
| managed_futures | 10% |
| rate_hedge | 5% |
| cash | 5% |
| **Total** | **100%** |

### Risk Level 2 (r2) — Conservative
**Intent**: Same conservative model as r1.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 30% |
| gold | 10% |
| commodities | 5% |
| t_bills | 20% |
| core_bonds | 15% |
| managed_futures | 10% |
| rate_hedge | 5% |
| cash | 5% |
| **Total** | **100%** |

### Risk Level 3 (r3) — Moderate
**Intent**: Balanced allocation across asset classes. Designed for investors with medium-term horizons and moderate risk tolerance.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 45% |
| gold | 10% |
| commodities | 5% |
| t_bills | 10% |
| core_bonds | 10% |
| managed_futures | 12% |
| rate_hedge | 5% |
| cash | 3% |
| **Total** | **100%** |

### Risk Level 4 (r4) — Aggressive
**Intent**: Higher equity allocation with separate gold and commodities sleeves. For investors with longer horizons and higher risk tolerance.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 55% |
| gold | 10% |
| commodities | 5% |
| t_bills | 5% |
| core_bonds | 5% |
| managed_futures | 15% |
| rate_hedge | 3% |
| cash | 2% |
| **Total** | **100%** |

### Risk Level 5 (r5) — Aggressive
**Intent**: Same allocation as r4.

| Sleeve | Allocation |
|--------|-----------|
| core_equity | 55% |
| gold | 10% |
| commodities | 5% |
| t_bills | 5% |
| core_bonds | 5% |
| managed_futures | 15% |
| rate_hedge | 3% |
| cash | 2% |
| **Total** | **100%** |

## Implementation Notes

### Voya-Only Implementation
For users with only Voya access, the model portfolio sleeves are translated into a **core mix** via `lib/voya.ts` (`getCoreMixForRisk`, `getComplementaryMixForRisk` / `buildVoyaImplementation`).

**Important**: Recommended mixes are screened for target-date funds using both classification (fund group) and name patterns. Target-date funds are not recommended as they contradict the "post-60/40" premise, but they remain available for users to enter as current holdings.

### Voya + Schwab Implementation
For users with both platforms:
- **Schwab** (growth / alts bucket): Example ETFs for active sleeves (including `core_equity`, `gold`, `commodities`, managed futures, etc.) via `lib/schwabLineups.ts`
- **Voya** (defensive / inflation bucket): Complementary fund mix (stable value, bonds, diversified real assets fund where applicable)

This split avoids duplicating broad equity funds across platforms.

### Example ETF illustrations (Schwab standard mode)

From `lib/sleeves.ts` → `exampleETFs` (illustrations only, not recommendations):

| Sleeve | Example tickers |
|--------|-----------------|
| core_equity | SPYV, QUAL |
| gold | GLDM |
| commodities | DBC |
| t_bills | SHV, BIL |
| core_bonds | AGG |
| managed_futures | DBMF, KMLM |
| rate_hedge | SHY |
| cash | **USFR** (cash-equivalent parking) |

Voya cash-like implementation commonly uses the **Stable Value Option**; Schwab cash sleeve examples use **USFR** as a cash-equivalent parking vehicle — not an investment recommendation.

## Where It Lives in Code

- **Spec definition**: `lib/modelPortfolios.ts` — `MODEL_PORTFOLIOS` constant
- **Risk-to-model mapping**: `lib/modelPortfolios.ts` — `RISK_TO_MODEL` constant
- **Usage**: `lib/portfolioEngine.ts` — `selectModelPortfolio()` function
- **Sleeve definitions**: `lib/sleeves.ts` — `sleeveDefinitions`
- **ETF examples**: `lib/sleeves.ts` — `exampleETFs` array
- **Schwab lineups**: `lib/schwabLineups.ts`

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
  - Core mix path: Does the fund mix approximate the sleeve allocations using available Voya funds?
  - Are the fund allocations clear and actionable (user can set them in Voya)?
  - **No target-date funds in recommended mix**: The recommended mix must not include any target-date funds (screened by group classification and name patterns)

### Voya+Schwab Implementation Checks
- ✅ **Does Voya+Schwab avoid duplicate broad equity exposure?**
  - Schwab should carry growth / alts example ETFs
  - Voya should carry the defensive/inflation complementary mix
  - No unnecessary duplication of the same equity role across platforms

### ETF Examples Checks
- ✅ **Do the ETF examples cover the sleeves logically?**
  - Each non-zero sleeve should have at least one example ETF
  - Gold uses **GLDM**; commodities use **DBC** (standard) or **HARD** (Simplify mode); cash uses **USFR** (standard)

### Important Note: Blueprint vs Implementation

The model portfolios are the **blueprint** (sleeve allocations). The builder is the **implementation layer** that translates these blueprints into actual fund recommendations. The implementation may differ from the blueprint in order to:

- Work within platform constraints (Voya menu limitations)
- Provide actionable guidance (specific fund names, not abstract sleeves)
- Optimize for user experience

When reviewing, focus on whether the implementation **achieves the blueprint's intent** rather than matching it exactly.

## UI Templates

The `/models` page displays templates from `lib/modelTemplates.ts` (code is authority):

1. **Conservative** — available (standard Ghost sleeves; risk override 2)
2. **Balanced** — available (risk override 3)
3. **Growth** — available (risk override 4)
4. **Aggressive** — available (risk override 5)
5. **GhostRegime 60/30/10** — house / Live — 60% stocks, 30% gold, 10% BTC with regime-based scaling; Schwab/BrokerageLink; example implementation SPYM / GLDM / FBTC

**Note**: Builder shows Template DNA when a template prefill was used. The Template DNA banner displays the template name and indicates whether risk is pinned (via override) or computed. You can copy/share your DNA from the Builder banner or the Action Plan.

### Shareable DNA Links

The Action Plan Template DNA block includes a "Share link" button that generates a shareable URL (e.g., `/onboarding?dna=XXXX`) containing the encoded template configuration. When someone visits that URL, the onboarding form is automatically prefilled with the same template settings. On onboarding, you can paste a Share link (or dna token) into Import DNA to prefill the questionnaire.

**Important notes:**
- DNA links only include configuration fields (no personal info like age, yearsToGoal)
- Links are versioned (currently v1) and use base64url encoding for compactness
- Invalid or unsupported DNA links fail gracefully with a non-scary warning
- No server-side storage: DNA links are stateless URL parameters
- DNA import takes precedence over template query params if both are present

## House Presets (Schwab)

House presets are an alternative to the standard Ghost sleeve-based approach for users with Schwab BrokerageLink access. They replace the Schwab ETF sleeve lineup with a simplified house model allocation.

### Standard vs House Preset

- **Standard preset**: Uses Ghost sleeves (`core_equity`, `gold`, `commodities`, etc.) mapped to example ETFs. This is the default approach.
- **House presets**: Replace the Schwab lineup with a fixed allocation (S&P + Gold + Bitcoin). Currently available:
  - **GhostRegime 60/30/10**: 60% SPYM (S&P 500), 30% GLDM (Gold), 10% FBTC (Bitcoin)
  - **GhostRegime 60/25/15**: 60% SPYM (S&P 500), 25% GLDM (Gold), 15% FBTC (Bitcoin)

### Important Notes

- **House presets are Schwab-only**: They require `platform === "voya_and_schwab"`. Voya-only users cannot select house presets.
- **Percentages are of Schwab slice**: The allocations (60%, 30%, 10%) are percentages of the Schwab portion of the 457, not the total 457 balance.
- **Voya defensive-only**: When a house preset is selected, the Voya mix becomes defensive-only (stable value + bonds) with no real assets fund, because Gold is already handling inflation protection on the Schwab side.
- **Standard behavior unchanged**: When Standard preset is selected, all existing behavior remains unchanged.

The house model definitions live in `lib/houseModels.ts` and are the single source of truth for house preset allocations.

## Optional Gold + Bitcoin Tilt (Standard preset, Schwab only)

For users with Schwab BrokerageLink access using the Standard preset, an optional tilt can be applied to the Schwab lineup.

### How It Works

- **Applies only to Standard preset**: The tilt is not available for house presets (which already include Gold/BTC) or Voya-only users.
- **Adjusts Schwab slice only**: Percentages are of the Schwab portion of the 457, not the total 457 balance.
- **Proportional scaling**: When tilt is enabled, GLDM (Gold) and FBTC (Bitcoin) are added at the specified weights, and other Standard Schwab ETF sleeve weights are scaled down proportionally (`lib/schwabTilt.ts` excludes legacy `real_assets`).
- **Voya mix unchanged**: The Voya mix remains the same as Standard preset (no defensive-only changes).

### Tilt Options

- **None** (default): No tilt applied
- **10% Gold / 5% Bitcoin**: Adds 10% GLDM and 5% FBTC to Schwab slice
- **15% Gold / 5% Bitcoin**: Adds 15% GLDM and 5% FBTC to Schwab slice

## Schwab ETF Lineup Style

For users with Schwab BrokerageLink access using the Standard preset, you can choose between two lineup styles (`lib/schwabLineups.ts`):

### Standard Mode (Default)

- Uses core index / sleeve example ETFs (SPYV, QUAL, GLDM, DBC, AGG, USFR, etc.)

### Simplify Mode (Advanced)

Building-block ETFs by sleeve (no separate convex-equity sleeve):

- **Core equity**: SPYM
- **Managed futures**: CTA
- **Rate hedge**: PFIX
- **T-bills / Cash**: SBIL
- **Gold**: GLDM
- **Commodities**: HARD
- **Core bonds**: AGGH

**Note**: Tilt is disabled when Simplify mode is selected to avoid complex combinations.

## Instrument Wrappers (Advanced)

For users who want income-style distributions, optional wrappers can swap Gold and Bitcoin instruments:

### Gold Instruments

- **GLDM** (default): Spot gold exposure
- **YGLD**: Gold strategy with options overlay, designed for income-style distributions

### Bitcoin Instruments

- **FBTC** (default): Spot Bitcoin exposure
- **MAXI**: Bitcoin strategy with options overlay; distribution may include Return of Capital (ROC)

**Important Notes**:

- Wrappers only change the ticker symbol; weights remain unchanged
- Income wrappers (YGLD/MAXI) use options overlays and may have ROC-style distributions
- Wrappers are available for both Standard preset (with tilt) and House presets
- Wrappers are shown in the UI only when Gold/BTC will appear in the lineup

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

## Historical note (do not use as current weights)

Older drafts of this document listed active `convex_equity` and a single `real_assets` sleeve with different percentages. Those weights are **obsolete**. Current production removed `convex_equity` from model portfolios / builder and uses separate `gold` + `commodities` sleeves. See project-ops DECISIONS for the removal record.
