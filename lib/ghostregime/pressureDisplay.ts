/**
 * Display-only helpers for Pressure Watch (meters and tags). No allocation or regime logic.
 */

import type { AxisPressureDirection, AxisPressureLine, ClosestSleevePressure } from './flipWatchPressure';
import type { VamsState } from './types';

/** Axis meter: distance from 0, capped for bar width only */
export const PRESSURE_DISPLAY_AXIS_CAP = 2;

/** Sleeve band half-width in score space (matches flipWatchPressure bands) */
export const PRESSURE_DISPLAY_SLEEVE_CAP = 0.5;

/** Below this distance (score space), show "Near flip" on closest sleeve */
export const PRESSURE_DISPLAY_NEAR_FLIP_THRESHOLD = 0.08;

/**
 * Bar fill 0–1: how far the axis score is from balanced, relative to cap (cosmetic).
 */
export function axisMeterFill(distanceToZero: number): number {
  if (distanceToZero <= 0) return 0;
  return Math.min(1, distanceToZero / PRESSURE_DISPLAY_AXIS_CAP);
}

/**
 * Bar fill 0–1: room until next sleeve threshold, relative to 0.5 band (cosmetic).
 */
export function sleeveMeterFill(distanceToBoundary: number): number {
  if (distanceToBoundary <= 0) return 1;
  return Math.min(1, distanceToBoundary / PRESSURE_DISPLAY_SLEEVE_CAP);
}

export function formatPressureDirectionLabel(d: AxisPressureDirection): string {
  if (d === null) return '—';
  if (d === 'up') return '↑ vs prior';
  if (d === 'down') return '↓ vs prior';
  return '→ vs prior';
}

export type AxisPressureTag = 'near_balance' | 'stable_vs_prior';

export function axisPressureTags(line: AxisPressureLine): AxisPressureTag[] {
  const tags: AxisPressureTag[] = [];
  if (line.nearBalance) tags.push('near_balance');
  if (line.direction === 'flat') tags.push('stable_vs_prior');
  return tags;
}

export function sleeveIsNearFlip(distanceToBoundary: number): boolean {
  return distanceToBoundary >= 0 && distanceToBoundary < PRESSURE_DISPLAY_NEAR_FLIP_THRESHOLD;
}

export function closestSleeveTags(closest: ClosestSleevePressure | null): ('near_flip')[] {
  if (!closest) return [];
  return sleeveIsNearFlip(closest.distanceToBoundary) ? ['near_flip'] : [];
}

const FLIP_IMPACT_EPS = 1e-6;

/** Distance to score flip line at 0 (same as abs(score) in pressure helper). */
export function formatRiskAxisFlipLine(score: number, distanceToZero: number): string {
  const d = distanceToZero.toFixed(2);
  if (score > 0) return `${d} from flip to Risk Off`;
  if (score < 0) return `${d} from flip to Risk On`;
  return 'On the flip line';
}

export function formatInflationAxisFlipLine(score: number, distanceToZero: number): string {
  const d = distanceToZero.toFixed(2);
  if (score > 0) return `${d} from flip to Disinflation`;
  if (score < 0) return `${d} from flip to Inflation`;
  return 'On the flip line';
}

export function formatRiskDirectionVsPrior(d: AxisPressureDirection): string {
  if (d === null) return '—';
  if (d === 'up') return 'Stronger vs prior';
  if (d === 'down') return 'Weaker vs prior';
  return 'Stable vs prior';
}

export function formatInflationDirectionVsPrior(d: AxisPressureDirection): string {
  if (d === null) return '—';
  if (d === 'up') return 'Heating vs prior';
  if (d === 'down') return 'Cooling vs prior';
  return 'Stable vs prior';
}

/** Short sleeve distance line from current state and one-step next state. */
export function formatSleeveThresholdDistanceLine(
  state: VamsState,
  nextStateIfFlipped: VamsState,
  distanceToBoundary: number
): string {
  const d = distanceToBoundary.toFixed(2);
  if (state === 2 && nextStateIfFlipped === 0) return `${d} from neutral`;
  if (state === -2 && nextStateIfFlipped === 0) return `${d} from neutral`;
  if (state === 0 && nextStateIfFlipped === 2) return `${d} from bullish`;
  if (state === 0 && nextStateIfFlipped === -2) return `${d} from bearish`;
  return `${d} from next band`;
}

function pctSigned(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${(v * 100).toFixed(1)}%`;
}

/**
 * Only non-negligible allocation deltas; empty array if all ~0.
 */
export function nonZeroFlipImpactParts(deltas: {
  stocks: number;
  gold: number;
  btc: number;
  cash: number;
}): { key: 'stocks' | 'gold' | 'btc' | 'cash'; label: string; delta: number }[] {
  const order: { key: 'stocks' | 'gold' | 'btc' | 'cash'; label: string }[] = [
    { key: 'stocks', label: 'Stocks' },
    { key: 'gold', label: 'Gold' },
    { key: 'btc', label: 'Bitcoin' },
    { key: 'cash', label: 'Cash' },
  ];
  return order
    .map(({ key, label }) => ({ key, label, delta: deltas[key] }))
    .filter((x) => Math.abs(x.delta) > FLIP_IMPACT_EPS);
}

/** One-line summary: only non-zero sleeve deltas, or the negligible copy. */
export function formatNextFlipImpactLine(
  deltas: { stocks: number; gold: number; btc: number; cash: number },
  negligibleLine: string
): string {
  const parts = nonZeroFlipImpactParts(deltas);
  if (parts.length === 0) return negligibleLine;
  const suffix = parts.map((p) => `${p.label} ${pctSigned(p.delta)}`).join(', ');
  return `Next flip impact: ${suffix}`;
}
