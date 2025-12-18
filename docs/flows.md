# Ghost Allocator User Flows

This document describes the two main user flows in Ghost Allocator: Voya-only and Voya + Schwab.

## Common Entry Point

Both flows start with the **questionnaire** (`app/onboarding/page.tsx` → `components/QuestionnaireForm.tsx`):

1. User answers questions about age, years to goal, retired status, risk tolerance, income stability, complexity preference, pension coverage, and platform choice.
2. Questionnaire results are stored in `localStorage` under key `ghostAllocatorQuestionnaire`.
3. User is redirected to `/builder` to see their allocation plan.

## Flow 1: Voya-Only

### Inputs from Questionnaire

- `platform: 'voya_only'`
- `complexityPreference: 'simple' | 'moderate' | 'advanced'`
- Other standard questionnaire fields (age, risk tolerance, pension, etc.)

### Where It's Computed

- **Risk level**: `lib/portfolioEngine.ts` → `computeRiskLevel(answers)`
- **Model portfolio**: `lib/portfolioEngine.ts` → `selectModelPortfolio(riskLevel)`
- **Voya implementation**: `lib/voya.ts` → `buildVoyaImplementation(answers, riskLevel)`
  - If `complexityPreference === 'simple'`: Returns a single Vanguard Target Retirement fund
  - Otherwise: Returns a core-fund mix via `getCoreMixForRisk(riskLevel)`
- **Platform split**: `lib/portfolioEngine.ts` → `computePlatformSplit(answers)` → Returns `{ platform: 'voya_only', targetVoyaPct: 100, targetSchwabPct: 0 }`

### OKC 457 Reality

**Important**: In the OKC 457 plan, **every paycheck lands in Voya first.** The plan cannot route contributions directly to Schwab from payroll.

For Voya-only users:
- All contributions go directly into Voya core funds
- Users update their contribution allocation in Voya to match the target mix
- No manual transfers needed (everything stays in Voya)

### Current Mix + Delta Plan

- **Current mix input**: `components/CurrentVoyaForm.tsx` allows users to enter their current Voya holdings (percentages per fund).
- **Storage**: Current holdings are stored in `localStorage` as part of the questionnaire result.
- **Delta computation**: `lib/voyaDelta.ts` → `computeVoyaDeltaPlan(implementation, currentHoldings)`
  - Compares current holdings vs target mix
  - Computes per-fund `currentPct`, `targetPct`, `deltaPct`
  - Filters into `overweight` (deltaPct < -1%) and `underweight` (deltaPct > 1%) lists
  - Ignores tiny deltas (1% tolerance)
- **Summary generation**: `lib/voyaDelta.ts` → `getVoyaDeltaSummary(plan)` generates firefighter-friendly text like "Move about 15% out of Fund X, and split it into 10% to Fund Y, 5% to Fund Z."

### UI Display (`app/builder/page.tsx`)

- **Action plan**: 3 steps (Use Voya core menu, Clean up current mix, Update paycheck split)
- **Left column**: "You told us" summary, Income Floor Detected card (if applicable), Current Voya mix form, Step 2 delta plan
- **Right column**: Voya-only implementation card (shows either target-date fund or core-fund mix)
- **Details section**: Ghost sleeve blueprint chart, Sleeve Details, Optional ETF lineup (for future reference)

## Flow 2: Voya + Schwab

### Inputs from Questionnaire

- `platform: 'voya_and_schwab'`
- `currentSchwabPct?: number` (0–75, optional)
- `schwabPreference?: 'stay_low' | 'use_full_75'` (optional)
- Other standard questionnaire fields

### Platform Split Logic

- **Computation**: `lib/portfolioEngine.ts` → `computePlatformSplit(answers)`
  - Default: Uses `currentSchwabPct` if provided, otherwise 50%
  - If `schwabPreference === 'use_full_75'`: Sets target to 75% Schwab / 25% Voya
  - Otherwise (`stay_low`): Clamps target to [25%, 60%] Schwab range
  - Returns `{ platform: 'voya_and_schwab', targetVoyaPct, targetSchwabPct }`

### Voya Implementation (Defensive Bucket)

- **Computation**: `lib/voya.ts` → `buildVoyaImplementation(answers, riskLevel)`
  - When `platform === 'voya_and_schwab'`, always returns `style: 'core_mix'`
  - Uses `getComplementaryMixForRisk(riskLevel)` which focuses on:
    - Stable Value Option Fund
    - JPMorgan Core Bond Fund
    - Pioneer Multi-Sector Fixed Income Fund CL R1
    - PIMCO Diversified Real Assets Fund
  - **Avoids** duplicating S&P/small-mid/international equity since Schwab handles that

### Schwab Implementation (Growth Bucket)

- **Computation**: `lib/portfolioEngine.ts` → `suggestExampleEtfs(modelPortfolio)`
  - Returns example ETFs grouped by sleeve (SPYV/QUAL for Core Equity, SPYC for Convex Equity, GLD/DBC for Real Assets, etc.)
  - These are displayed in the "Schwab ETF sleeve lineup" card

### OKC 457 Reality: Contributions → Voya First

**Important**: In the OKC 457 plan, **every paycheck lands in Voya first.** Users cannot route contributions directly to Schwab from payroll.

For Voya + Schwab users:
- **Keep contribution allocation 100% into Voya core funds** (the plan can't send money straight to Schwab from payroll)
- **Manually move money from Voya → Schwab monthly or quarterly** when rebalancing
- **Schwab BrokerageLink is funded by manual sweeps** (monthly/quarterly is typical, not every paycheck)
- Aim to maintain roughly the target split over time (close enough is good enough)

The app explicitly calls this out in the action plan:
- Step 4 instructs users to keep their contribution allocation 100% into Voya core funds
- Users manually move money from Voya to Schwab monthly/quarterly when rebalancing
- A pro tip reminds users: "Most folks rebalance into Schwab monthly or quarterly, not every paycheck."

### Current Mix + Delta Plan

- Same as Voya-only flow: `components/CurrentVoyaForm.tsx` + `lib/voyaDelta.ts`
- **Important**: Delta plan only applies to the **Voya slice** (percentages are of the Voya portion, not the whole 457)
  - If the target split is 50% Voya / 50% Schwab, the delta percentages are relative to the 50% Voya portion
  - For example: "Move 10% out of Fund X" means 10% of the Voya slice, not 10% of the total 457

### UI Display (`app/builder/page.tsx`)

- **Action plan**: 4 steps (Platform split, Inside Voya, Inside Schwab, Keep split over time)
- **Left column**: "You told us" summary, Income Floor Detected card (if applicable), Current Voya mix form, Step 2 delta plan
- **Right column**: "Voya core funds (X% of 457)" card (defensive mix)
- **Schwab ETF sleeve lineup** card: Shows ETFs grouped by sleeve for the growth portion
- **Details section**: Allocation breakdown chart, Sleeve Details

## What Happens When You Edit Current Voya Mix

The Current Voya mix form (`components/CurrentVoyaForm.tsx`) allows users to enter their current Voya holdings as percentages per fund.

### Live Delta Recomputation

- **No submit button**: Edits trigger delta recomputation **live** as the user types
- The delta plan updates immediately when holdings change
- Changes are automatically saved to `localStorage` as part of the questionnaire result

### Tolerance and Warnings

- **1% tolerance**: Deltas smaller than 1 percentage point are ignored (not shown in the reduce/add lists)
- **Sum validation**: If current holdings don't sum to ~100% (within 95–105%), the app shows a warning:
  - "Heads up: your current Voya percentages add up to about X%. That's okay for a rough pass, but the moves below assume they're 'about right'."
- **Delta percentages**: All percentages in the delta plan are relative to the **Voya slice only**, not the whole 457 account

### For Voya + Schwab Users

When editing current Voya mix in combo mode:
- The percentages you enter are for the **Voya portion only** (e.g., if you're 50% Voya / 50% Schwab, enter percentages that sum to 100% of the Voya slice)
- The delta plan shows moves within the Voya slice
- The Schwab portion is handled separately and doesn't affect the Voya delta calculation

## Key Functions Reference

### `lib/portfolioEngine.ts`
- `computeRiskLevel(answers)`: Computes risk level 1–5 from questionnaire answers
- `selectModelPortfolio(riskLevel)`: Maps risk level to model portfolio (conservative/moderate/aggressive)
- `computePlatformSplit(answers)`: Determines Voya-only vs Voya + Schwab and target percentages
- `suggestExampleEtfs(modelPortfolio)`: Returns example ETFs for Schwab implementation

### `lib/voya.ts`
- `buildVoyaImplementation(answers, riskLevel)`: Builds Voya fund mix based on platform choice and complexity preference
- `getCoreMixForRisk(riskLevel)`: Returns Voya core-fund mix for Voya-only users
- `getComplementaryMixForRisk(riskLevel)`: Returns defensive Voya mix for Voya + Schwab users

### `lib/voyaDelta.ts`
- `computeVoyaDeltaPlan(implementation, currentHoldings)`: Computes delta between current and target Voya mix
- `getVoyaDeltaSummary(plan)`: Generates firefighter-friendly summary sentence

### `app/builder/page.tsx`
- Main builder page that orchestrates the display
- Reads questionnaire from `localStorage`
- Computes all derived data (risk level, portfolio, platform split, Voya implementation, delta plan)
- Renders action plan, implementation cards, and details sections

## Data Flow Summary

```
Questionnaire (onboarding/page.tsx)
  ↓
localStorage (ghostAllocatorQuestionnaire)
  ↓
Builder page (builder/page.tsx)
  ↓
computeRiskLevel() → RiskLevel (1-5)
  ↓
selectModelPortfolio() → ModelPortfolio
  ↓
computePlatformSplit() → PlatformSplit
  ↓
buildVoyaImplementation() → VoyaImplementation
  ↓
suggestExampleEtfs() → ExampleETF[] (if Voya + Schwab)
  ↓
computeVoyaDeltaPlan() → VoyaDeltaPlan (if current mix provided)
  ↓
UI Rendering (action plan, implementation cards, details)
```
