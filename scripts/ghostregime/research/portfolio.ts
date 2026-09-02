/**
 * Generic self-financing portfolio primitives.
 * The engine operates on Record<AssetId, weight> and does not know
 * what "stocks" or "gold" mean.
 */

import { NUMERIC_TOLERANCE } from './study-contract';
import type { AssetId, Weights } from './types';

export function unionAssetIds(...weightSets: Array<Weights | undefined>): AssetId[] {
  const ids = new Set<AssetId>();
  for (const set of weightSets) {
    if (!set) continue;
    for (const id of Object.keys(set)) ids.add(id);
  }
  return [...ids].sort();
}

export function weightOf(weights: Weights, assetId: AssetId): number {
  return weights[assetId] ?? 0;
}

export function isEconomicallyHeld(weight: number): boolean {
  return Math.abs(weight) > NUMERIC_TOLERANCE;
}

/**
 * Fail closed: every economically held asset must have an own-key finite return >= -1.
 * Missing held returns are never defaulted to 0.
 */
export function requireHeldAssetReturns(held: Weights, assetReturns: Weights): void {
  for (const id of Object.keys(held)) {
    if (!isEconomicallyHeld(weightOf(held, id))) continue;
    if (!Object.hasOwn(assetReturns, id)) {
      throw new Error(`MISSING_HELD_ASSET_RETURN: ${id}`);
    }
    const assetReturn = assetReturns[id];
    if (!Number.isFinite(assetReturn)) {
      throw new Error(`NON_FINITE_ASSET_RETURN: ${id}`);
    }
    if (assetReturn < -1) {
      throw new Error(`INVALID_ASSET_RETURN: ${id}`);
    }
  }
}

export function marketReturnFromHoldings(held: Weights, assetReturns: Weights): number {
  requireHeldAssetReturns(held, assetReturns);
  let total = 0;
  for (const id of Object.keys(held)) {
    const weight = weightOf(held, id);
    if (!isEconomicallyHeld(weight)) continue;
    total += weight * assetReturns[id];
  }
  return total;
}

export function driftWeights(held: Weights, assetReturns: Weights, marketReturn: number): Weights {
  requireHeldAssetReturns(held, assetReturns);
  const denom = 1 + marketReturn;
  const next: Weights = {};
  for (const id of Object.keys(held)) {
    const weight = weightOf(held, id);
    if (!isEconomicallyHeld(weight)) {
      next[id] = 0;
      continue;
    }
    next[id] = denom === 0 ? 0 : (weight * (1 + assetReturns[id])) / denom;
  }
  return next;
}

export function applyIntervalReturn(
  held: Weights,
  assetReturns: Weights
): { marketReturn: number; pretrade: Weights } {
  const marketReturn = marketReturnFromHoldings(held, assetReturns);
  return { marketReturn, pretrade: driftWeights(held, assetReturns, marketReturn) };
}

export function grossTwoSidedNotional(pretrade: Weights, target: Weights): number {
  let gross = 0;
  for (const id of unionAssetIds(pretrade, target)) {
    gross += Math.abs(weightOf(target, id) - weightOf(pretrade, id));
  }
  return gross;
}

export function oneWayTurnover(grossTwoSided: number): number {
  return 0.5 * grossTwoSided;
}

export function costFraction(costBps: number, grossTwoSided: number): number {
  return (costBps / 10_000) * grossTwoSided;
}

export function applyNavPath(
  navBefore: number,
  marketReturn: number,
  costFrac: number
): { navAfterMarket: number; navAfterCost: number; netPortfolioReturn: number } {
  const navAfterMarket = navBefore * (1 + marketReturn);
  const navAfterCost = navAfterMarket * (1 - costFrac);
  const netPortfolioReturn = (1 + marketReturn) * (1 - costFrac) - 1;
  return { navAfterMarket, navAfterCost, netPortfolioReturn };
}

export interface RebalanceResult {
  held: Weights;
  grossTwoSided: number;
  oneWayTurnover: number;
  costFraction: number;
  rebalanced: boolean;
}

export function rebalanceToTarget(
  pretrade: Weights,
  target: Weights,
  costBps: number,
  options?: { inception?: boolean; skip?: boolean }
): RebalanceResult {
  if (options?.inception || options?.skip) {
    return {
      held: options?.inception ? { ...target } : { ...pretrade },
      grossTwoSided: 0,
      oneWayTurnover: 0,
      costFraction: 0,
      rebalanced: false,
    };
  }

  const gross = grossTwoSidedNotional(pretrade, target);
  return {
    held: { ...target },
    grossTwoSided: gross,
    oneWayTurnover: oneWayTurnover(gross),
    costFraction: costFraction(costBps, gross),
    rebalanced: true,
  };
}

export function maxAbsWeightDelta(a: Weights, b: Weights): number {
  let max = 0;
  for (const id of unionAssetIds(a, b)) {
    max = Math.max(max, Math.abs(weightOf(a, id) - weightOf(b, id)));
  }
  return max;
}
