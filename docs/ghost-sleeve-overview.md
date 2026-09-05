# Ghost Sleeve Overview

This document explains the conceptual "Ghost sleeves" and how they map to actual funds/ETFs in Ghost Allocator.

## What Are Ghost Sleeves?

Ghost sleeves are conceptual building blocks for a post-60/40 portfolio allocation. They represent different roles in a portfolio:

- **Growth sleeves**: Equity exposure
- **Defensive sleeves**: Bonds, cash, and stability-focused assets
- **Diversification sleeves**: Gold, commodities, managed futures, and rate hedges that provide non-correlated returns

Sleeves are defined in `lib/sleeves.ts` and are used to construct model portfolios for different risk levels (`lib/modelPortfolios.ts`).

## Active Ghost Sleeves (current standard models)

### 1. Core Equity (Value & Quality)
- **Role**: Broad market equity exposure with a focus on value and quality factors
- **Typical ETF mapping (Schwab, standard):** SPYV, QUAL
- **Voya mapping**: Northern Trust S&P 500 Index Fund, SSgA Russell Small/Mid Cap Index Fund (and related equity menu items in core mixes)

### 2. Gold
- **Role**: Physical gold exposure for inflation protection and diversification
- **Typical ETF mapping (Schwab):** **GLDM**
- **Voya mapping**: Often approximated via diversified real-assets / inflation-oriented funds in complementary mixes (not a 1:1 gold ETF)

### 3. Commodities
- **Role**: Broad commodity exposure for inflation protection and diversification
- **Typical ETF mapping (Schwab, standard):** **DBC** · Simplify mode: **HARD**
- **Voya mapping**: Often approximated via PIMCO Diversified Real Assets Fund in complementary mixes

### 4. T-Bills / Short Duration
- **Role**: Short-term Treasury bills for liquidity and stability
- **Typical ETF mapping (Schwab):** SHV, BIL · Simplify mode: SBIL
- **Voya mapping**: Stable Value Option Fund (approximate cash-like role)

### 5. Core Bonds
- **Role**: Traditional bond exposure for income and diversification
- **Typical ETF mapping (Schwab):** AGG · Simplify mode: AGGH
- **Voya mapping**: JPMorgan Core Bond Fund

### 6. Managed Futures / Trend Following
- **Role**: Systematic trend-following strategies that can profit in both rising and falling markets
- **Typical ETF mapping (Schwab):** DBMF, KMLM · Simplify mode: CTA
- **Voya mapping**: Not directly available; approximated by other diversification sleeves where needed

### 7. Rate Hedge / Crisis Protection
- **Role**: Instruments designed to hedge against rising rates and market crises
- **Typical ETF mapping (Schwab):** SHY · Simplify mode: PFIX
- **Voya mapping**: Pioneer Multi-Sector Fixed Income Fund CL R1 (approximate)

### 8. Cash / cash-equivalent
- **Role**: Cash reserves for liquidity and optionality
- **Typical ETF mapping (Schwab, standard):** **USFR** (floating-rate Treasury cash-equivalent parking — illustration only)
- **Voya mapping**: Stable Value Option Fund (plan cash-like implementation)

## Legacy / historical sleeves (not active in standard model weights)

| Sleeve | Status |
|--------|--------|
| **`real_assets`** | Still present in `SleeveId` / sleeve definitions for backward compatibility. **Not** used in current `MODEL_PORTFOLIOS` weights or Schwab lineups. Gold and commodities are separate. |
| **`convex_equity`** | **Removed** from model portfolios, builder, and sleeve system. Historical weight was merged into `core_equity`. Do not document as an active Ghost sleeve. |

## Mapping Cheat Sheet (Sleeve → Role → Implementation)

| Ghost Sleeve | Role | Voya-Only (examples) | Voya + Schwab (examples) |
|--------------|------|----------------------|---------------------------|
| **Core Equity** | Broad market equity (value & quality) | Northern Trust S&P 500 / small-mid / intl index funds | **Schwab:** SPYV, QUAL (standard) or SPYM (Simplify) |
| **Gold** | Inflation / diversifier | Approximated in inflation/real-asset-oriented funds | **Schwab:** GLDM |
| **Commodities** | Inflation / diversifier | Approximated in diversified real assets fund | **Schwab:** DBC (standard) or HARD (Simplify) |
| **T-Bills / Short Duration** | Liquidity / short rates | Stable Value Option (approximate) | **Schwab:** SHV, BIL / SBIL |
| **Core Bonds** | Bond ballast | JPMorgan Core Bond Fund | **Schwab:** AGG / AGGH |
| **Managed Futures** | Trend diversifier | Approximated / limited menu | **Schwab:** DBMF, KMLM / CTA |
| **Rate Hedge** | Rate / crisis hedge | Pioneer Multi-Sector (approximate) | **Schwab:** SHY / PFIX |
| **Cash** | Cash / optionality | Stable Value Option | **Schwab:** **USFR** (standard) / SBIL (Simplify cash sleeve) |

**Note:** For Schwab ETF examples, see `lib/sleeves.ts` → `exampleETFs` and `lib/schwabLineups.ts`. Tickers are illustrations only.

**Important:** In Voya + Schwab mode, Voya is used as the **defensive + inflation bucket** to avoid duplicating broad equity exposure. Schwab carries most of the equity / alts risk.

## How Sleeves Map to Funds

### For Voya-Only Users

When a user chooses Voya-only, the app builds a "core mix" that approximates the Ghost sleeves using available Voya funds. The mapping is role-based, not 1:1. Percentages won't match the Ghost sleeve blueprint exactly — they're matched on role (growth vs defensive), not labels.

### For Voya + Schwab Users

When a user chooses Voya + Schwab, the app splits responsibilities:

- **Voya (defensive bucket)**: Stable Value Option Fund, JPMorgan Core Bond Fund, Pioneer Multi-Sector Fixed Income Fund CL R1, PIMCO Diversified Real Assets Fund (as applicable)
- **Schwab (growth / alts bucket)**: Example ETFs for active sleeves (SPYV/QUAL, GLDM, DBC, DBMF/KMLM, SHV/BIL, AGG, SHY, **USFR**, etc.)

## Where the Config Lives

- **Sleeve definitions**: `lib/sleeves.ts` → `sleeveDefinitions` object
- **Example ETFs**: `lib/sleeves.ts` → `exampleETFs` array
- **Model portfolios**: `lib/modelPortfolios.ts` → `MODEL_PORTFOLIOS`
- **Schwab lineups**: `lib/schwabLineups.ts`
- **Voya fund mappings**: `lib/voya.ts` → `getCoreMixForRisk()` / `getComplementaryMixForRisk()`
- **Voya fund menu**: `lib/voyaFunds.ts` → `VOYA_FUNDS` (see [voya-menu.md](voya-menu.md))
- **Risk level computation**: `lib/portfolioEngine.ts` → `computeRiskLevel()`

## Risk Band Variations

Model portfolios are defined for different risk levels:

- **Risk Level 1–2** (Conservative): Higher allocation to defensive assets and cash
- **Risk Level 3** (Moderate): Balanced allocation
- **Risk Level 4–5** (Aggressive): Higher equity allocation

Exact percentages: `lib/modelPortfolios.ts` and [model-portfolios.md](model-portfolios.md).
