/**
 * House Model Scaling
 * Pure helper to compute scaled house lineup from GhostRegime scales
 */

import type { HouseModelAllocation, HouseModelSpec } from './houseModels';
import type { GoldInstrument, BtcInstrument } from './types';

/**
 * GhostRegime scale data (subset of GhostRegimeRow)
 */
export interface GhostRegimeScaleData {
  stocks_scale: number;
  gold_scale: number;
  btc_scale: number;
  date?: string; // ISO date string
  stale?: boolean;
  stale_reason?: string;
}

/**
 * Scaled lineup item
 */
export interface ScaledLineupItem {
  id: string;
  label: string;
  ticker: string;
  targetPct: number; // Target % from house model
  scale: number; // Scale factor (0-1)
  actualPct: number; // Actual % = target * scale
  isCash?: boolean; // True if this is the cash line
}

/**
 * Compute scaled house lineup from house model and GhostRegime scales
 * 
 * @param houseModel - House model spec (e.g., GhostRegime 60/30/10)
 * @param scaleData - GhostRegime scale data (stocks_scale, gold_scale, btc_scale)
 * @param goldInstrument - Gold wrapper selection (GLDM vs YGLD)
 * @param btcInstrument - BTC wrapper selection (FBTC vs MAXI)
 * @returns Scaled lineup items + cash if applicable, always sums to ~100%
 */
export function computeScaledHouseLineup(
  houseModel: HouseModelSpec,
  scaleData: GhostRegimeScaleData | null,
  goldInstrument: GoldInstrument = 'gldm',
  btcInstrument: BtcInstrument = 'fbtc'
): ScaledLineupItem[] {
  // Start with base allocations (apply wrappers)
  const baseAllocations = houseModel.allocations.map((alloc) => {
    let ticker = alloc.ticker;
    let label = alloc.label;
    
    // Apply wrappers
    if (alloc.id === 'gldm' && goldInstrument === 'ygld') {
      ticker = 'YGLD';
      label = 'Gold (income wrapper)';
    } else if (alloc.id === 'fbtc' && btcInstrument === 'maxi') {
      ticker = 'MAXI';
      label = 'Bitcoin (income wrapper)';
    }
    
    return {
      ...alloc,
      ticker,
      label,
    };
  });

  // If no scale data, return static targets (no cash)
  if (!scaleData) {
    return baseAllocations.map((alloc) => ({
      id: alloc.id,
      label: alloc.label,
      ticker: alloc.ticker,
      targetPct: alloc.pct,
      scale: 1,
      actualPct: alloc.pct,
      isCash: false,
    }));
  }

  // Map allocations to scales
  const scaleMap: Record<string, number> = {
    spym: scaleData.stocks_scale,
    gldm: scaleData.gold_scale,
    fbtc: scaleData.btc_scale,
  };

  // Compute scaled items
  const scaledItems: ScaledLineupItem[] = baseAllocations.map((alloc) => {
    const scale = scaleMap[alloc.id] ?? 1; // Default to 1 if ID not found
    const actualPct = alloc.pct * scale;
    
    return {
      id: alloc.id,
      label: alloc.label,
      ticker: alloc.ticker,
      targetPct: alloc.pct,
      scale,
      actualPct,
      isCash: false,
    };
  });

  // Compute cash
  const totalActual = scaledItems.reduce((sum, item) => sum + item.actualPct, 0);
  const cash = Math.max(0, Math.min(100, 100 - totalActual));

  // Add cash line if > 0
  if (cash > 0.01) {
    scaledItems.push({
      id: 'cash',
      label: 'Cash / T-bills (unallocated)',
      ticker: 'CASH',
      targetPct: 0,
      scale: 0,
      actualPct: cash,
      isCash: true,
    });
  }

  // Normalize to ensure sum is exactly 100% (within tolerance)
  const finalSum = scaledItems.reduce((sum, item) => sum + item.actualPct, 0);
  if (Math.abs(finalSum - 100) > 0.01) {
    // Adjust cash to make sum exactly 100
    const cashItem = scaledItems.find((item) => item.isCash);
    if (cashItem) {
      cashItem.actualPct = Math.max(0, cashItem.actualPct + (100 - finalSum));
    } else if (finalSum < 100) {
      // Add cash if missing
      scaledItems.push({
        id: 'cash',
        label: 'Cash / T-bills (unallocated)',
        ticker: 'CASH',
        targetPct: 0,
        scale: 0,
        actualPct: 100 - finalSum,
        isCash: true,
      });
    }
  }

  return scaledItems;
}





