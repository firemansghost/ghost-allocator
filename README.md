# Ghost Allocator

A multi-tool GrayGhost Labs web app for OKC firefighters and first responders. **Ghost Allocator** (main) turns post-60/40 "Ghost sleeve" model portfolios into real allocations using OKC 457 Voya core funds and optional Schwab BrokerageLink ETFs. **GhostRegime** (secondary) provides rules-based signals for adjusting portfolio exposure.

## What It Does

### Ghost Allocator (Main Tool)

Ghost Allocator translates conceptual "Ghost sleeve" allocations (Core Equity, Convex Equity, Real Assets, Managed Futures, T-Bills, Core Bonds, Rate Hedge, Cash) into actionable fund selections from your actual OKC 457 plan menu.

**Two user paths:**

- **Voya-only**: Uses the Voya core fund menu exclusively (Northern Trust S&P 500 Index Fund, SSGA Russell Small/Mid Cap Index Fund, SSGA All Country World ex-US Index Fund, PIMCO Diversified Real Assets Fund, JPMorgan Core Bond Fund, etc.).

- **Voya + Schwab**: Splits the 457 balance roughly 50/50 between Voya (defensive + inflation bucket) and Schwab BrokerageLink (growth/equity sleeves via ETFs like SPYV/QUAL, SPYC, GLD/DBC, DBMF/KMLM, SHV/BIL, AGG, etc.).

### GhostRegime (Secondary Tool)

GhostRegime is a rules-based system that classifies market conditions into regimes (Goldilocks, Reflation, Inflation, Deflation) and provides Risk On/Off signals for adjusting portfolio exposure. It uses volatility-adjusted momentum signals (VAMS) to help avoid overreacting to small market movements.

## OKC 457 Reality

**Important**: In the OKC 457 plan, every paycheck lands in Voya first. The plan cannot route contributions directly to Schwab from payroll.

For Voya + Schwab users:
- Keep your contribution allocation 100% into Voya core funds
- Manually move money from Voya to Schwab monthly or quarterly when rebalancing
- Aim to maintain roughly a 50/50 split over time (close enough is good enough)

The app explicitly calls this out in the action plan and provides step-by-step guidance.

## Routes

- `/` - Home page
- `/onboarding` - Questionnaire to build your portfolio
- `/builder` - Your Ghost allocation plan (requires completing questionnaire)
- `/ghostregime` - GhostRegime signals and regime classification
- `/ghostregime/how-it-works` - How GhostRegime works (explanation)
- `/ghostregime/methodology` - GhostRegime methodology details
- `/models` - Model portfolios overview
- `/why-60-40-dead` - Educational content on post-60/40 investing

## Docs

See [`docs/README.md`](docs/README.md) for a complete index of documentation.

**Quick links:**
- [Ghost Allocator flows](docs/flows.md) - User flows (Voya-only vs Voya + Schwab)
- [Ghost sleeve overview](docs/ghost-sleeve-overview.md) - How sleeves map to funds
- [GhostRegime runbook](docs/ghostregime/RUNBOOK.md) - Daily workflow and operations
- [GhostRegime seed data](data/ghostregime/seed/README.md) - Seed CSV format and validation

## Getting Started

### Prerequisites

- Node.js
- npm or compatible package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Next.js development server at `http://localhost:3000`.

### Build

```bash
npm run build
```

Creates an optimized production build.

### Lint

```bash
npm run lint
```

Runs Next.js ESLint checks.

### Test

```bash
npm test
```

Runs the test suite (currently `lib/ghostregime/__tests__/regimeCore.test.ts`).

### Environment Variables

No environment variables are required for the core Ghost Allocator functionality. The app runs entirely client-side for the portfolio builder flow.

GhostRegime API endpoints may require environment variables; see [`docs/ghostregime/RUNBOOK.md`](docs/ghostregime/RUNBOOK.md) for details.

## Safety / Disclaimer

**Ghost Allocator is for educational purposes only and does not provide personalized investment advice.** Example funds/ETFs are illustrations only, not recommendations.

This app doesn't know your life, your taxes, or your tolerance for pain. We show rules and examples — you make the calls.

For the full disclaimer text, see `components/Disclaimer.tsx`.

## License

MIT License. See `LICENSE` file for details.

Copyright (c) 2025 firemansghost
