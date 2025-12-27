/**
 * GhostRegime Allocation Calculations
 * Compute targets, scales, and actual allocations with cash normalization
 */

import type { RegimeType, VamsState, AllocationOutput } from './types';
import { ALLOCATION_TARGETS, ALLOCATION_TOLERANCE } from './config';
import { mapToRiskRegime } from './regimeCore';
import { vamsStateToScale } from './vams';

/**
 * Compute allocations from regime and VAMS states
 */
export function computeAllocations(
  regime: RegimeType,
  vamsStates: { stocks: VamsState; gold: VamsState; btc: VamsState }
): AllocationOutput {
  const riskRegime = mapToRiskRegime(regime);

  // Get targets based on regime
  const stocksTarget =
    riskRegime === 'RISK ON'
      ? ALLOCATION_TARGETS.STOCKS_RISK_ON
      : ALLOCATION_TARGETS.STOCKS_RISK_OFF;
  const goldTarget = ALLOCATION_TARGETS.GOLD;
  const btcTarget =
    riskRegime === 'RISK ON'
      ? ALLOCATION_TARGETS.BTC_RISK_ON
      : ALLOCATION_TARGETS.BTC_RISK_OFF;

  // Get scales from VAMS states
  const stocksScale = vamsStateToScale(vamsStates.stocks);
  const goldScale = vamsStateToScale(vamsStates.gold);
  const btcScale = vamsStateToScale(vamsStates.btc);

  // Calculate actuals: actual_i = target_i × scale_i
  let stocksActual = stocksTarget * stocksScale;
  let goldActual = goldTarget * goldScale;
  let btcActual = btcTarget * btcScale;

  // Calculate cash: cash = 1 - Σ actuals
  let cash = 1 - stocksActual - goldActual - btcActual;

  // Clamp cash to [0, 1]
  cash = Math.max(0, Math.min(1, cash));

  // Normalize to ensure sum = 1 within tolerance
  const total = stocksActual + goldActual + btcActual + cash;
  const diff = 1 - total;

  if (Math.abs(diff) > ALLOCATION_TOLERANCE) {
    // Distribute difference proportionally (or to cash if small)
    if (Math.abs(diff) < 0.01) {
      cash += diff;
    } else {
      // Proportional adjustment
      const scale = 1 / total;
      stocksActual *= scale;
      goldActual *= scale;
      btcActual *= scale;
      cash = 1 - stocksActual - goldActual - btcActual;
    }
  }

  // Final clamp of cash
  cash = Math.max(0, Math.min(1, cash));

  // Verify sum is within tolerance
  const finalTotal = stocksActual + goldActual + btcActual + cash;
  if (Math.abs(finalTotal - 1) > ALLOCATION_TOLERANCE) {
    console.warn(
      `Allocation sum (${finalTotal}) not within tolerance. Adjusting cash.`
    );
    cash = 1 - stocksActual - goldActual - btcActual;
    cash = Math.max(0, Math.min(1, cash));
  }

  return {
    stocks_target: stocksTarget,
    gold_target: goldTarget,
    btc_target: btcTarget,
    stocks_scale: stocksScale,
    gold_scale: goldScale,
    btc_scale: btcScale,
    stocks_actual: stocksActual,
    gold_actual: goldActual,
    btc_actual: btcActual,
    cash: cash,
  };
}














