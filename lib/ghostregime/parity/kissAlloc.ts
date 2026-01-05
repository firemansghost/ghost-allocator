/**
 * KISS Allocation Engine (Parity-Only)
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * Pure, deterministic allocation engine that matches 42 Macro KISS workbook logic.
 * This is used for parity validation - NOT for normal GhostRegime computation.
 * 
 * KISS Behavior Spec (treat as truth inside parity harness):
 * 1. Regime → Targets
 *    - If Market Regime ∈ {GOLDILOCKS, REFLATION}: Stocks=0.60, Gold=0.30, Bitcoin=0.10
 *    - If Market Regime ∈ {INFLATION, DEFLATION}: Stocks=0.30, Gold=0.30, Bitcoin=0.05
 * 2. State → Scale
 *    - +2 → 1.0
 *    - 0 → 0.5
 *    - -2 → 0.0
 * 3. Actual exposures
 *    - stocks_actual = stocks_target × scale(stocks_state)
 *    - gold_actual = gold_target × scale(gold_state)
 *    - btc_actual = btc_target × scale(btc_state)
 *    - cash = 1 - (stocks_actual + gold_actual + btc_actual)
 */

import type {
  KissRegime,
  KissState,
  KissAllocationOutput,
} from './kissTypes';

/**
 * Compute KISS targets based on market regime
 */
export function computeKissTargets(marketRegime: KissRegime): {
  stocks: number;
  gold: number;
  bitcoin: number;
} {
  const isRiskOn = marketRegime === 'GOLDILOCKS' || marketRegime === 'REFLATION';
  
  if (isRiskOn) {
    return {
      stocks: 0.6,
      gold: 0.3,
      bitcoin: 0.1,
    };
  } else {
    // INFLATION or DEFLATION
    return {
      stocks: 0.3,
      gold: 0.3,
      bitcoin: 0.05,
    };
  }
}

/**
 * Convert KISS state to scale
 * +2 → 1.0, 0 → 0.5, -2 → 0.0
 */
export function scaleFromState(state: KissState): number {
  if (state === 2) {
    return 1.0;
  } else if (state === 0) {
    return 0.5;
  } else if (state === -2) {
    return 0.0;
  }
  throw new Error(`Invalid KISS state: ${state} (must be -2, 0, or 2)`);
}

/**
 * Compute KISS allocations from regime and states
 */
export function computeKissAllocations(input: {
  marketRegime: KissRegime;
  stocksState: KissState;
  goldState: KissState;
  bitcoinState: KissState;
}): KissAllocationOutput {
  // Get targets
  const targets = computeKissTargets(input.marketRegime);
  
  // Get scales from states
  const stocksScale = scaleFromState(input.stocksState);
  const goldScale = scaleFromState(input.goldState);
  const bitcoinScale = scaleFromState(input.bitcoinState);
  
  // Calculate actuals
  const stocksActual = targets.stocks * stocksScale;
  const goldActual = targets.gold * goldScale;
  const bitcoinActual = targets.bitcoin * bitcoinScale;
  
  // Cash is residual
  const cash = 1 - stocksActual - goldActual - bitcoinActual;
  
  // Clamp cash to [0, 1] (shouldn't be needed, but safety check)
  const cashClamped = Math.max(0, Math.min(1, cash));
  
  return {
    stocks_target: targets.stocks,
    gold_target: targets.gold,
    bitcoin_target: targets.bitcoin,
    stocks_scale: stocksScale,
    gold_scale: goldScale,
    bitcoin_scale: bitcoinScale,
    stocks_actual: stocksActual,
    gold_actual: goldActual,
    bitcoin_actual: bitcoinActual,
    cash: cashClamped,
  };
}
