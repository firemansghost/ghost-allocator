/**
 * Display-only helpers for Pressure Watch (meters and tags). No allocation or regime logic.
 */

import type { AxisPressureDirection, AxisPressureLine, ClosestSleevePressure } from './flipWatchPressure';

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
