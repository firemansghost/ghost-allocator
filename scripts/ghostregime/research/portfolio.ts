/**
 * Generic self-financing portfolio primitives.
 * The engine operates on Record<AssetId, weight> and does not know
 * what "stocks" or "gold" mean.
 */

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

export function portfolioReturn(held: Weights, assetReturns: Weights): number {
  let total = 0;
  for (const id of unionAssetIds(held, assetReturns)) {
    total += weightOf(held, id) * weightOf(assetReturns, id);
  }
  return total;
}

export function driftWeights(held: Weights, assetReturns: Weights, portReturn: number): Weights {
  const denom = 1 + portReturn;
  const next: Weights = {};
  for (const id of unionAssetIds(held, assetReturns)) {
    next[id] = denom === 0 ? 0 : (weightOf(held, id) * (1 + weightOf(assetReturns, id))) / denom;
  }
  return next;
}

export function applyIntervalReturn(
  held: Weights,
  assetReturns: Weights
): { portfolioReturn: number; pretrade: Weights } {
  const r = portfolioReturn(held, assetReturns);
  return { portfolioReturn: r, pretrade: driftWeights(held, assetReturns, r) };
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
  portReturn: number,
  costFrac: number
): { navAfterMarket: number; navAfterCost: number } {
  const navAfterMarket = navBefore * (1 + portReturn);
  const navAfterCost = navAfterMarket * (1 - costFrac);
  return { navAfterMarket, navAfterCost };
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
      rebalanced: Boolean(options?.inception),
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
