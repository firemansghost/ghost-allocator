/**
 * Canonical Regime Legend
 * 
 * Single source of truth for regime descriptions and positioning.
 * 
 * GUARDRAIL: If you change a regime description, do it here. Pages should not hardcode regime copy.
 * This module is imported by:
 * - /ghostregime (dashboard page)
 * - /ghostregime/methodology (docs page)
 * 
 * To prevent drift, see: scripts/check-ghostregime-regime-legend-drift.mjs
 */

import type { RegimeType } from './types';

export type RegimeKey = 'GOLDILOCKS' | 'REFLATION' | 'INFLATION' | 'DEFLATION';

export interface RegimeLegendItem {
  key: RegimeKey;
  label: string;
  description: string;
  risk: 'on' | 'off';
  infl: 'inflation' | 'disinflation';
}

/**
 * Canonical regime legend items
 * 
 * This is the single source of truth for regime descriptions.
 * All pages should import from here, not duplicate these descriptions.
 */
export const REGIME_LEGEND_ITEMS: RegimeLegendItem[] = [
  {
    key: 'GOLDILOCKS',
    label: 'GOLDILOCKS',
    description: 'Risk On + Disinflation. Markets are brave and prices are calm.',
    risk: 'on',
    infl: 'disinflation',
  },
  {
    key: 'REFLATION',
    label: 'REFLATION',
    description: 'Risk On + Inflation. Markets are brave but prices are rising.',
    risk: 'on',
    infl: 'inflation',
  },
  {
    key: 'INFLATION',
    label: 'INFLATION',
    description: 'Risk Off + Inflation. Markets are cautious and prices are rising.',
    risk: 'off',
    infl: 'inflation',
  },
  {
    key: 'DEFLATION',
    label: 'DEFLATION',
    description: 'Risk Off + Disinflation. Markets are cautious and prices are falling.',
    risk: 'off',
    infl: 'disinflation',
  },
];

/**
 * Get regime legend item by key
 */
export function getRegimeLegendItem(key: RegimeKey): RegimeLegendItem | null {
  return REGIME_LEGEND_ITEMS.find(item => item.key === key) || null;
}

/**
 * Get regime description by key
 * Returns the description string or an empty string if not found
 */
export function getRegimeDescription(key: RegimeKey): string {
  const item = getRegimeLegendItem(key);
  return item?.description || '';
}

/**
 * Axis labels for regime map
 */
export const REGIME_AXIS_LABELS = {
  riskOn: 'Risk On',
  riskOff: 'Risk Off',
  inflation: 'Inflation',
  disinflation: 'Disinflation',
} as const;
