# Ghost Sleeve Overview

This document explains the conceptual "Ghost sleeves" and how they map to actual funds/ETFs in Ghost Allocator.

## What Are Ghost Sleeves?

Ghost sleeves are conceptual building blocks for a post-60/40 portfolio allocation. They represent different roles in a portfolio:

- **Growth sleeves**: Equity exposure with different risk/return profiles
- **Defensive sleeves**: Bonds, cash, and stability-focused assets
- **Diversification sleeves**: Real assets, managed futures, and rate hedges that provide non-correlated returns

Sleeves are defined in `lib/sleeves.ts` and are used to construct model portfolios for different risk levels.

## The Eight Ghost Sleeves

### 1. Core Equity (Value & Quality)
- **Role**: Broad market equity exposure with a focus on value and quality factors
- **Typical ETF mapping (Schwab)**: SPYV (SPDR Portfolio S&P 500 Value ETF), QUAL (iShares MSCI USA Quality Factor ETF)
- **Voya mapping**: Northern Trust S&P 500 Index Fund, SSgA Russell Small/Mid Cap Index Fund

### 2. Convex Equity (Options-Overlay ETFs)
- **Role**: Equity ETFs that embed options strategies for downside protection
- **Typical ETF mapping (Schwab)**: SPYC (Simplify US Equity PLUS Convexity ETF)
- **Voya mapping**: Not directly available; approximated by Core Equity funds

### 3. Real Assets
- **Role**: Gold, commodities, and resource equities for inflation protection
- **Typical ETF mapping (Schwab)**: GLD (SPDR Gold Trust), DBC (Invesco DB Commodity Index Tracking Fund)
- **Voya mapping**: PIMCO Diversified Real Assets Fund

### 4. T-Bills / Short Duration
- **Role**: Short-term Treasury bills for liquidity and stability
- **Typical ETF mapping (Schwab)**: SHV (iShares Short Treasury Bond ETF), BIL (SPDR Bloomberg 1-3 Month T-Bill ETF)
- **Voya mapping**: Stable Value Option Fund (approximate)

### 5. Core Bonds
- **Role**: Traditional bond exposure for income and diversification
- **Typical ETF mapping (Schwab)**: AGG (iShares Core U.S. Aggregate Bond ETF)
- **Voya mapping**: JPMorgan Core Bond Fund

### 6. Managed Futures / Trend Following
- **Role**: Systematic trend-following strategies that can profit in both rising and falling markets
- **Typical ETF mapping (Schwab)**: DBMF (iMGP DBi Managed Futures Strategy ETF), KMLM (KFA Mount Lucas Managed Futures Index Strategy ETF)
- **Voya mapping**: Not directly available; approximated by other diversification sleeves

### 7. Rate Hedge / Crisis Protection
- **Role**: ETFs designed to hedge against rising rates and market crises
- **Typical ETF mapping (Schwab)**: SHY (iShares 1-3 Year Treasury Bond ETF)
- **Voya mapping**: Pioneer Multi-Sector Fixed Income Fund CL R1 (approximate)

### 8. Cash
- **Role**: Cash reserves for liquidity and optionality
- **Typical ETF mapping (Schwab)**: Cash position (not an ETF)
- **Voya mapping**: Stable Value Option Fund (approximate)

## Mapping Cheat Sheet (Sleeve → Role → Implementation)

| Ghost Sleeve | Role | Voya-Only Implementation (examples) | Voya + Schwab Implementation |
|--------------|------|-------------------------------------|------------------------------|
| **Core Equity** | Broad market equity (value & quality) | Northern Trust S&P 500 Index Fund<br>SSgA Russell Small/Mid Cap Index Fund<br>SSgA All Country World ex-US Index Fund | **Schwab:** Example ETFs (SPYV, QUAL)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **Convex Equity** | Equity with options overlay (downside protection) | Approximated by Core Equity funds (not directly available) | **Schwab:** Example ETFs (SPYC)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **Real Assets** | Gold, commodities, inflation protection | PIMCO Diversified Real Assets Fund | **Voya:** PIMCO Diversified Real Assets Fund<br>**Schwab:** Example ETFs (GLD, DBC)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **T-Bills / Short Duration** | Short-term Treasuries, liquidity | Stable Value Option Fund (approximate) | **Voya:** Stable Value Option Fund<br>**Schwab:** Example ETFs (SHV, BIL)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **Core Bonds** | Traditional bond exposure | JPMorgan Core Bond Fund | **Voya:** JPMorgan Core Bond Fund<br>**Schwab:** Example ETFs (AGG)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **Managed Futures** | Trend-following strategies | Approximated by other diversification sleeves (not directly available) | **Schwab:** Example ETFs (DBMF, KMLM)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **Rate Hedge / Crisis Protection** | Rate/crisis hedging | Pioneer Multi-Sector Fixed Income Fund CL R1 (approximate) | **Voya:** Pioneer Multi-Sector Fixed Income Fund CL R1<br>**Schwab:** Example ETFs (SHY)<br>See `lib/sleeves.ts` → `exampleETFs` |
| **Cash** | Cash reserves, optionality | Stable Value Option Fund (approximate) | **Voya:** Stable Value Option Fund<br>**Schwab:** Cash position |

**Note:** For Schwab ETF examples, see `lib/sleeves.ts` → `exampleETFs` array. The table above shows example tickers only; the actual list in code may include additional options.

**Important:** In Voya + Schwab mode, Voya is used as the **defensive + inflation bucket** to avoid duplicating equity exposure. Schwab handles most of the equity risk (Core Equity, Convex Equity, Managed Futures), while Voya focuses on bonds, stable value, and real assets.

## How Sleeves Map to Funds

### For Voya-Only Users

When a user chooses Voya-only, the app builds a "core mix" that approximates the Ghost sleeves using available Voya funds. The mapping is role-based, not 1:1:

- **Core Equity + Convex Equity** → Northern Trust S&P 500 Index Fund, SSgA Russell Small/Mid Cap Index Fund, SSgA All Country World ex-US Index Fund
- **Real Assets** → PIMCO Diversified Real Assets Fund
- **T-Bills + Cash** → Stable Value Option Fund
- **Core Bonds** → JPMorgan Core Bond Fund
- **Rate Hedge** → Pioneer Multi-Sector Fixed Income Fund CL R1 (if available)

The percentages won't match the Ghost sleeve blueprint exactly — they're matched on role (growth vs defensive), not labels.

### For Voya + Schwab Users

When a user chooses Voya + Schwab, the app splits responsibilities:

- **Voya (defensive bucket)**: Stable Value Option Fund, JPMorgan Core Bond Fund, Pioneer Multi-Sector Fixed Income Fund CL R1, PIMCO Diversified Real Assets Fund
- **Schwab (growth bucket)**: SPYV/QUAL, SPYC, GLD/DBC, DBMF/KMLM, SHV/BIL, AGG, SHY

This avoids duplicating S&P/small-mid/international equity in Voya since Schwab handles most of the equity risk.

## Where the Config Lives

- **Sleeve definitions**: `lib/sleeves.ts` → `sleeveDefinitions` object
- **Example ETFs**: `lib/sleeves.ts` → `exampleETFs` array
- **Model portfolios**: `lib/modelPortfolios.ts` → `MODEL_PORTFOLIOS` (single source of truth for risk level → sleeve weights)
- **Voya fund mappings**: `lib/voya.ts` → `getCoreMixForRisk()` (Voya-only) and `getComplementaryMixForRisk()` (Voya + Schwab)
- **Voya fund menu**: `lib/voyaFunds.ts` → `VOYA_FUNDS` array (canonical source for all OKC Voya 457 funds). See [voya-menu.md](voya-menu.md) for the complete listing.
- **Risk level computation**: `lib/portfolioEngine.ts` → `computeRiskLevel()`

## Risk Band Variations

Model portfolios are defined for different risk levels:

- **Risk Level 1** (Very Conservative): Higher allocation to defensive assets and cash
- **Risk Level 2** (Conservative): Capital preservation focus
- **Risk Level 3** (Moderate): Balanced allocation (default)
- **Risk Level 4** (Aggressive): Higher equity allocation
- **Risk Level 5** (Very Aggressive): Maximum equity allocation

Each risk level has different sleeve weights. See `lib/modelPortfolios.ts` and [model-portfolios.md](model-portfolios.md) for the exact percentages and specification.
