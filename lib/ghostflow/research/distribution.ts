/**
 * GhostFlow research — generic distribution / percentile helpers (no I/O).
 */

export interface DistributionSummary {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  mean: number;
}

/** Percentile rank 0–100: share of sample <= value. */
export function percentileRank(sortedAsc: readonly number[], value: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return value >= sortedAsc[0]! ? 100 : 0;

  let below = 0;
  let equal = 0;
  for (const v of sortedAsc) {
    if (v < value) below++;
    else if (v === value) equal++;
    else break;
  }
  const rank = (below + 0.5 * equal) / sortedAsc.length;
  return Math.round(rank * 1000) / 10;
}

function percentileLinear(sortedAsc: readonly number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0]!;
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo]!;
  const w = idx - lo;
  return sortedAsc[lo]! * (1 - w) + sortedAsc[hi]! * w;
}

export function summarizeDistribution(values: readonly number[]): DistributionSummary {
  if (values.length === 0) {
    return { min: 0, p25: 0, median: 0, p75: 0, max: 0, mean: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    min: sorted[0]!,
    p25: Math.round(percentileLinear(sorted, 0.25) * 10) / 10,
    median: Math.round(percentileLinear(sorted, 0.5) * 10) / 10,
    p75: Math.round(percentileLinear(sorted, 0.75) * 10) / 10,
    max: sorted[sorted.length - 1]!,
    mean: Math.round((sum / sorted.length) * 10) / 10,
  };
}

export function pctAtOrAbove(values: readonly number[], threshold: number): number {
  if (values.length === 0) return 0;
  const count = values.filter((s) => s >= threshold).length;
  return Math.round((1000 * count) / values.length) / 10;
}

export function distributionP90(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(percentileLinear(sorted, 0.9));
}
