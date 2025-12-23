/**
 * House Model Presets
 * Single source of truth for GhostRegime house model allocations (Schwab lineup replacements)
 */

import type { GoldInstrument, BtcInstrument } from './types';

export type HouseModelId = 'ghostregime_60_30_10' | 'ghostregime_60_25_15';

export interface HouseModelAllocation {
  id: string;
  label: string; // e.g., "S&P 500 core"
  ticker: string; // e.g., "SPYM"
  pct: number; // % of Schwab slice (not total 457)
  notes?: string;
}

export interface HouseModelSpec {
  id: HouseModelId;
  name: string; // "GhostRegime 60/30/10"
  description: string;
  allocations: HouseModelAllocation[];
}

export const HOUSE_MODELS: Record<HouseModelId, HouseModelSpec> = {
  ghostregime_60_30_10: {
    id: 'ghostregime_60_30_10',
    name: 'GhostRegime 60/30/10',
    description: '60% S&P, 30% Gold, 10% Bitcoin (house preset).',
    allocations: [
      { id: 'spym', label: 'S&P 500 core', ticker: 'SPYM', pct: 60 },
      { id: 'gldm', label: 'Gold', ticker: 'GLDM', pct: 30 },
      { id: 'fbtc', label: 'Bitcoin', ticker: 'FBTC', pct: 10 },
    ],
  },
  ghostregime_60_25_15: {
    id: 'ghostregime_60_25_15',
    name: 'GhostRegime 60/25/15',
    description: '60% S&P, 25% Gold, 15% Bitcoin (alternate preset).',
    allocations: [
      { id: 'spym', label: 'S&P 500 core', ticker: 'SPYM', pct: 60 },
      { id: 'gldm', label: 'Gold', ticker: 'GLDM', pct: 25 },
      { id: 'fbtc', label: 'Bitcoin', ticker: 'FBTC', pct: 15 },
    ],
  },
};

/**
 * Get a house model by ID
 */
export function getHouseModel(id: HouseModelId): HouseModelSpec {
  return HOUSE_MODELS[id];
}

/**
 * Get house model allocations with instrument wrappers applied
 */
export function getHouseModelWithWrappers(
  id: HouseModelId,
  goldInstrument: GoldInstrument,
  btcInstrument: BtcInstrument
): HouseModelAllocation[] {
  const model = HOUSE_MODELS[id];
  return model.allocations.map((alloc) => {
    if (alloc.ticker === 'GLDM' && goldInstrument === 'ygld') {
      return {
        ...alloc,
        ticker: 'YGLD',
        label: 'Gold (income wrapper)',
      };
    }
    if (alloc.ticker === 'FBTC' && btcInstrument === 'maxi') {
      return {
        ...alloc,
        ticker: 'MAXI',
        label: 'Bitcoin (income wrapper)',
      };
    }
    return alloc;
  });
}

/**
 * Type guard to check if a preset is a house model
 */
export function isHousePreset(preset: unknown): preset is HouseModelId {
  return preset === 'ghostregime_60_30_10' || preset === 'ghostregime_60_25_15';
}

// Dev-time validation: ensure allocations sum to 100%
if (process.env.NODE_ENV !== 'production') {
  for (const [id, model] of Object.entries(HOUSE_MODELS)) {
    const sum = model.allocations.reduce((acc, alloc) => acc + alloc.pct, 0);
    if (Math.abs(sum - 100) > 0.5) {
      console.error(
        `[houseModels.ts] Model ${id}: allocations sum to ${sum}%, expected ~100%`
      );
    }
  }
}

