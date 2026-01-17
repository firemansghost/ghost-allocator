/**
 * Schwab Gold + Bitcoin Tilt Helper
 * Applies optional tilt to Standard preset Schwab lineup
 */

import type { GoldBtcTilt, Sleeve, ExampleETF } from './types';

export interface TiltedSchwabItem {
  type: 'sleeve' | 'tilt';
  id: string;
  label: string;
  ticker?: string;
  weight: number; // % of Schwab slice
  etfs?: ExampleETF[]; // for sleeve items
}

/**
 * Get Gold and Bitcoin percentages from tilt option
 */
export function getTiltPercentages(tilt: GoldBtcTilt): { goldPct: number; btcPct: number } {
  switch (tilt) {
    case 'gold10_btc5':
      return { goldPct: 10, btcPct: 5 };
    case 'gold15_btc5':
      return { goldPct: 15, btcPct: 5 };
    case 'none':
    default:
      return { goldPct: 0, btcPct: 0 };
  }
}

/**
 * Apply Gold + Bitcoin tilt to Standard preset Schwab lineup
 * 
 * Takes existing sleeve-based lineup and:
 * 1. Adds GLDM (Gold) and FBTC (Bitcoin) at specified weights
 * 2. Scales down all existing sleeve weights proportionally to make room
 * 3. Returns a flat list of items (sleeves + tilt items)
 */
export function applySchwabTilt(
  sleeves: Sleeve[],
  sleeveEtfs: Record<string, ExampleETF[]>,
  tilt: GoldBtcTilt
): TiltedSchwabItem[] {
  const { goldPct, btcPct } = getTiltPercentages(tilt);
  const tiltTotal = goldPct + btcPct;

  // If no tilt, return original lineup structure
  if (tiltTotal === 0) {
    return sleeves
      .filter((s) => s.weight > 0)
      .map((sleeve) => ({
        type: 'sleeve' as const,
        id: sleeve.id,
        label: sleeve.name,
        weight: sleeve.weight * 100, // convert to percentage
        etfs: sleeveEtfs[sleeve.id] || [],
      }));
  }

  // Calculate scale factor for existing sleeves
  // We need to reduce total from 100% to (100% - tiltTotal%)
  const scaleFactor = (100 - tiltTotal) / 100;

  // Build tilted lineup: tilt items first, then scaled sleeves
  const result: TiltedSchwabItem[] = [];

  // Add tilt items at the top
  if (goldPct > 0) {
    result.push({
      type: 'tilt',
      id: 'gldm_tilt',
      label: 'Gold',
      ticker: 'GLDM',
      weight: goldPct,
    });
  }
  if (btcPct > 0) {
    result.push({
      type: 'tilt',
      id: 'fbtc_tilt',
      label: 'Bitcoin',
      ticker: 'FBTC',
      weight: btcPct,
    });
  }

  // Add scaled-down sleeves
  for (const sleeve of sleeves) {
    if (sleeve.weight > 0) {
      const scaledWeight = (sleeve.weight * 100) * scaleFactor;
      
      // When gold tilt is active, remove gold ETFs from Real Assets sleeve
      let etfs = sleeveEtfs[sleeve.id] || [];
      let label = sleeve.name;
      
      if (goldPct > 0 && sleeve.id === 'real_assets') {
        // Filter out gold ETFs (GLDM, YGLD) from Real Assets
        etfs = etfs.filter((etf) => etf.ticker !== 'GLDM' && etf.ticker !== 'YGLD');
        // Update label to indicate gold is handled separately
        label = 'Commodities';
      }
      
      result.push({
        type: 'sleeve',
        id: sleeve.id,
        label: label,
        weight: scaledWeight,
        etfs: etfs,
      });
    }
  }

  return result;
}







