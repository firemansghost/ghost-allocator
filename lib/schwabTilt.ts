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
 * 1. Increases Gold sleeve weight to target (10% or 15% of Schwab slice)
 * 2. Adds Bitcoin as a dedicated position (5% of Schwab slice)
 * 3. Scales down other sleeves proportionally to keep total = 100%
 * 4. Returns a flat list of items (sleeves + Bitcoin position)
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
      .filter((s) => s.weight > 0 && s.id !== 'real_assets') // Exclude legacy real_assets
      .map((sleeve) => ({
        type: 'sleeve' as const,
        id: sleeve.id,
        label: sleeve.name,
        weight: sleeve.weight * 100, // convert to percentage
        etfs: sleeveEtfs[sleeve.id] || [],
      }));
  }

  // Find Gold sleeve and calculate its current weight
  const goldSleeve = sleeves.find((s) => s.id === 'gold');
  const currentGoldWeight = goldSleeve ? goldSleeve.weight * 100 : 0;
  
  // Calculate total weight of all sleeves (excluding real_assets)
  const totalSleeveWeight = sleeves
    .filter((s) => s.id !== 'real_assets' && s.weight > 0)
    .reduce((sum, s) => sum + s.weight * 100, 0);
  
  // Calculate how much weight we need to free up for gold increase + BTC
  const goldIncrease = goldPct - currentGoldWeight;
  const weightToFreeUp = goldIncrease + btcPct;
  
  // Calculate scale factor for non-gold sleeves to make room
  const nonGoldSleevesTotal = sleeves
    .filter((s) => s.id !== 'gold' && s.id !== 'real_assets' && s.weight > 0)
    .reduce((sum, s) => sum + s.weight * 100, 0);
  
  const scaleFactor = nonGoldSleevesTotal > 0 
    ? (nonGoldSleevesTotal - weightToFreeUp) / nonGoldSleevesTotal
    : 1;

  // Build tilted lineup: Gold sleeve first, then Bitcoin position, then other sleeves
  const result: TiltedSchwabItem[] = [];

  // Add Gold sleeve with increased weight
  if (goldSleeve) {
    result.push({
      type: 'sleeve',
      id: 'gold',
      label: 'Gold',
      weight: goldPct,
      etfs: sleeveEtfs['gold'] || [],
    });
  } else {
    // Gold sleeve doesn't exist yet, create it
    result.push({
      type: 'sleeve',
      id: 'gold',
      label: 'Gold',
      weight: goldPct,
      etfs: sleeveEtfs['gold'] || [],
    });
  }

  // Add Bitcoin as dedicated position
  if (btcPct > 0) {
    result.push({
      type: 'tilt',
      id: 'fbtc_tilt',
      label: 'Bitcoin',
      ticker: 'FBTC',
      weight: btcPct,
    });
  }

  // Add scaled-down other sleeves (exclude gold, real_assets, and any zero-weight sleeves)
  for (const sleeve of sleeves) {
    if (sleeve.weight > 0 && sleeve.id !== 'gold' && sleeve.id !== 'real_assets') {
      const scaledWeight = (sleeve.weight * 100) * scaleFactor;
      result.push({
        type: 'sleeve',
        id: sleeve.id,
        label: sleeve.name,
        weight: scaledWeight,
        etfs: sleeveEtfs[sleeve.id] || [],
      });
    }
  }

  return result;
}







