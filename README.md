# Ghost Allocator

A GrayGhost Labs **multi-tool** web app for OKC firefighters and first responders.

- **Ghost Allocator (primary):** turns "Ghost sleeve" model portfolios into real allocations using OKC 457 **Voya core funds** and optional **Schwab BrokerageLink ETFs**.  
- **GhostRegime (secondary):** rules-based regime + Risk On/Off signals for adjusting exposure.

## Who This Is For

- OKC 457 participants using the Voya core menu  
- Optional: folks who also use Schwab BrokerageLink as a "growth sleeve" sidecar  
- People who want a plan they can actually implement

## What It Does

### Ghost Allocator

Ghost Allocator translates conceptual "Ghost sleeve" allocations:

- Core Equity
- Convex Equity
- Real Assets
- Managed Futures
- T-Bills / Short Duration
- Core Bonds
- Rate Hedge / Crisis Protection
- Cash

…into actionable fund selections from the OKC 457 plan menu.

**Two user paths:**

- **Voya-only:** uses the Voya core fund menu exclusively (index equity, international, real assets, core bonds, etc.).  
- **Voya + Schwab:** targets a roughly **50/50 balance split** between:
  - **Voya:** defensive + inflation bucket  
  - **Schwab BrokerageLink:** growth/equity sleeves via example ETFs (illustrations only)

### GhostRegime

GhostRegime classifies market conditions into regimes (Goldilocks, Reflation, Inflation, Deflation) and produces Risk On/Off signals for adjusting exposure. It uses volatility-adjusted momentum signals (VAMS) to help avoid overreacting to small moves.

## OKC 457 Reality (Read This Before You Yell At The Screen)

**Important:** In the OKC 457 plan, **every paycheck lands in Voya first.** The plan **cannot** route contributions directly to Schwab from payroll.

For **Voya + Schwab** users:

- Keep your contribution allocation **100% into Voya core funds**
- Manually move money from Voya → Schwab **monthly or quarterly** when you rebalance
- Aim to maintain roughly a **50/50 split over time** (close enough is good enough)

The builder calls this out in the action plan so users don't "set it and forget it" into the wrong bucket.

## Routes

- `/` - Home page  
- `/onboarding` - Questionnaire to build your portfolio  
- `/builder` - Your Ghost allocation plan (requires completing questionnaire)  
- `/ghostregime` - GhostRegime signals and regime classification  
- `/ghostregime/how-it-works` - How GhostRegime works  
- `/ghostregime/methodology` - GhostRegime methodology details  
- `/models` - Model portfolios overview  
- `/why-60-40-dead` - Educational content on post-60/40 investing  

## Docs

See [`docs/README.md`](docs/README.md) for the full docs index.

Quick links:
- [Ghost Allocator flows](docs/flows.md)  
- [Ghost sleeve overview](docs/ghost-sleeve-overview.md)  
- [GhostRegime runbook](docs/ghostregime/RUNBOOK.md)  
- [GhostRegime seed data](data/ghostregime/seed/README.md)  

## Getting Started

### Prerequisites
- Node.js
- npm (or compatible package manager)

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```

Starts the Next.js dev server at `http://localhost:3000`.

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Test
```bash
npm test
```

Runs the current test suite (e.g. `lib/ghostregime/__tests__/regimeCore.test.ts`).

### Environment Variables

No environment variables are required for the core Ghost Allocator builder flow.

GhostRegime endpoints may require environment variables depending on how you run it; see [`docs/ghostregime/RUNBOOK.md`](docs/ghostregime/RUNBOOK.md).

## Safety / Disclaimer

For education, not advice. Example funds/ETFs are illustrations only — not recommendations.

This app doesn't know your life, your taxes, or your tolerance for pain. We show rules and examples — you make the calls.

For full disclaimer text, see `components/Disclaimer.tsx`.

**This project is not affiliated with the City of Oklahoma City, Voya, or Schwab.**

## License

MIT License. See `LICENSE` for details.

Copyright (c) 2025 firemansghost
