# Ghost Allocator

Ghost Allocator turns a post-60/40 "Ghost sleeve" model portfolio into a real, implementable allocation using the OKC 457 Voya core funds and optional Schwab BrokerageLink ETFs.

## What This App Does

Ghost Allocator is a small web app inside the GrayGhost Labs ecosystem designed for **OKC firefighters and first responders** who participate in the OKC 457 plan. It translates conceptual "Ghost sleeve" allocations (Core Equity, Convex Equity, Real Assets, Managed Futures, T-Bills, Core Bonds, Rate Hedge, Cash) into actionable fund selections from your actual plan menu.

### Target Users

- OKC firefighters and first responders
- OKC 457 plan participants
- Users who want to implement a post-60/40 allocation strategy without needing an MBA

### Two Implementation Paths

**Voya-only path**: Uses the Voya core fund menu exclusively (Northern Trust S&P 500 Index Fund, SSGA Russell Small/Mid Cap Index Fund, SSGA All Country World ex-US Index Fund, PIMCO Diversified Real Assets Fund, JPMorgan Core Bond Fund, etc.).

**Voya + Schwab path**: Splits the 457 balance roughly 50/50 between Voya (defensive + inflation bucket) and Schwab BrokerageLink (growth/equity sleeves via ETFs like SPYV/QUAL, SPYC, GLD/DBC, DBMF/KMLM, SHV/BIL, AGG, etc.).

## How It Works

### User Flow

1. **Questionnaire** → User answers questions about:
   - Age, years to retirement goal, retired status
   - Risk tolerance and drawdown tolerance
   - Income stability and complexity preference
   - Pension/guaranteed income coverage (income floor detection)
   - Platform choice: Voya-only vs Voya + Schwab

2. **Risk Band Detection** → App computes a risk level (1–5) based on questionnaire answers, with pension/income floor adjustments that allow the portfolio to take more growth risk.

3. **Ghost Sleeve Blueprint** → App displays the conceptual Ghost sleeve allocation for the user's risk band (e.g., 30% Core Equity, 15% Convex Equity, 15% Real Assets, etc.).

4. **Implementation Mapping**:
   - **Voya-only**: Shows a Voya core-fund mix that approximates the Ghost sleeves using available funds.
   - **Voya + Schwab**: Shows a defensive Voya mix (stable value, bonds, real assets) plus a Schwab ETF lineup for the growth sleeves.

5. **Current Mix Input** → User can enter their current Voya holdings (percentages per fund), stored in localStorage.

6. **Delta Plan** → App computes what to reduce and what to add to move from current mix to target mix, with a firefighter-friendly summary like "Move about 15% out of Fund X, and split it into 10% to Fund Y, 5% to Fund Z."

7. **Action Plan** → Step-by-step guidance in plain English:
   - For Voya-only: Use Voya core menu, clean up current mix, update paycheck split.
   - For Voya + Schwab: Platform split guidance, Voya defensive mix, Schwab ETF lineup, and instructions for maintaining the 50/50 split over time (since OKC 457 contributions land in Voya first; users manually transfer to Schwab monthly/quarterly).

### Key Behaviors

- **Income floor logic**: If pension/guaranteed income covers expenses, the app explains that the 457 can do more "growth & flexibility" work and less "keep the lights on" work. This is surfaced in an "Income Floor Detected" card.
- **Ghost sleeves**: Sleeves are defined conceptually and then mapped onto actual funds/ETFs based on the user's platform choice.
- **OKC 457 reality**: In the OKC 457 plan, every paycheck lands in Voya first. Users manually move money from Voya to Schwab periodically (monthly/quarterly) to maintain the target split. The app explicitly calls this out in the action plan.

## Key Features

- **Ghost sleeve breakdown** + Sleeve Details showing what each sleeve represents
- **Voya-only core mix mapping** that approximates Ghost sleeves using available Voya funds
- **Voya + Schwab split** with Voya as defensive bucket and Schwab as growth bucket
- **Step-by-step Action plan** cards in plain firefighter English
- **Current Voya mix input** + "reduce/add" delta plan with firefighter-friendly summaries
- **LocalStorage persistence** for current mix so users can revisit and adjust
- **Pro tip** on rebalance cadence (monthly/quarterly, not every paycheck)
- **Global disclaimer** component handling educational-only language

## Screens / UX Structure

The main builder page (`/builder`) displays:

- **Action plan** at the top (step-by-step guidance)
- **2-column layout**:
  - Left: "You told us" summary, Income Floor Detected card (if applicable), Current Voya mix form, Step 2 delta plan
  - Right: Voya-only implementation OR Voya core funds card (for Voya + Schwab users)
- **Schwab ETF sleeve lineup** card (for Voya + Schwab users only)
- **"Details behind the plan"** section:
  - Allocation breakdown chart (Ghost sleeve blueprint)
  - Sleeve Details (descriptions of each sleeve)
- **Optional ETF lineup** card (for Voya-only users, showing what they could use if they ever open a brokerage account)

## Tech Stack & Architecture

- **Next.js 16.0.7** (App Router, React 19, TypeScript 5.9)
- **Tailwind CSS 4.1** for styling
- **Custom components**: `GlassCard`, `AllocationChart`, `SleeveBreakdown`, `CurrentVoyaForm`, `QuestionnaireForm`, `Tooltip`, `Disclaimer`, `Footer`, `Navbar`
- **Portfolio logic** lives in `lib/`:
  - `lib/portfolioEngine.ts`: Risk level computation, model portfolio selection, platform split logic
  - `lib/voya.ts`: Voya implementation building (core mix vs target-date fund, Voya-only vs complementary mix)
  - `lib/voyaDelta.ts`: Current mix vs target mix delta computation
  - `lib/sleeves.ts`: Ghost sleeve definitions, example ETFs, model portfolios
  - `lib/types.ts`: TypeScript type definitions
- **Routing**: App Router (`app/` directory)
- **State management**: React hooks + localStorage for questionnaire persistence

## Getting Started

### Prerequisites

- Node.js (check `package.json` for required version)
- npm or compatible package manager

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Next.js development server (typically at `http://localhost:3000`).

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

(Note: GhostRegime API endpoints may require environment variables; see `docs/ghostregime/` for details.)

## Safety / Disclaimer

**Ghost Allocator is for educational purposes only and does not provide personalized investment advice.** Example funds/ETFs are illustrations only, not recommendations.

This app doesn't know your life, your taxes, or your tolerance for pain. We show rules and examples — you make the calls.

For the full disclaimer text, see `components/Disclaimer.tsx`.

## Roadmap / Future Work

These are non-committal ideas, not promises:

- **Schwab-side current mix + delta**: Mirror the Voya delta flow for Schwab holdings
- **Print/PDF "My Plan" export**: Generate a printable summary of the user's allocation plan
- **Gentle cadence/reminder hints**: Help users remember to rebalance monthly/quarterly
- **More risk bands / named presets**: Additional model portfolio variations
- **"What changed?" view**: Show differences between sessions (if user updates questionnaire)
- **Better internal docs of sleeve → fund mappings**: More detailed documentation of how sleeves map to specific funds/ETFs

## License

MIT License. See `LICENSE` file for details.

Copyright (c) 2025 firemansghost
