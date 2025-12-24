/**
 * Schwab ETF Lineup Configuration
 * Single source of truth for Schwab ETF suggestions based on lineup style
 */

import type {
  RiskLevel,
  Sleeve,
  ExampleETF,
  SchwabLineupStyle,
  GoldInstrument,
  BtcInstrument,
  GoldBtcTilt,
  PortfolioPreset,
} from './types';
import { exampleETFs } from './sleeves';
import { applySchwabTilt, getTiltPercentages } from './schwabTilt';
import { isHousePreset } from './houseModels';

/**
 * Simplify mode ETF mappings by sleeve
 * These are Simplify's building-block ETFs for alts/hedges/convexity
 */
const SIMPLIFY_ETFS: Record<string, ExampleETF[]> = {
  core_equity: [
    {
      ticker: 'SPYM',
      name: 'SPDR Portfolio S&P 500 ETF',
      description: 'Core S&P 500 exposure',
      sleeveId: 'core_equity',
    },
  ],
  convex_equity: [
    {
      ticker: 'SPD',
      name: 'Simplify US Equity PLUS Downside Convexity ETF',
      description: 'S&P 500 with downside protection (conservative/balanced)',
      sleeveId: 'convex_equity',
    },
    {
      ticker: 'SPYC',
      name: 'Simplify US Equity PLUS Convexity ETF',
      description: 'S&P 500 with options overlay (balanced)',
      sleeveId: 'convex_equity',
    },
    {
      ticker: 'SPUC',
      name: 'Simplify US Equity PLUS Upside Convexity ETF',
      description: 'S&P 500 with upside convexity (growth/aggressive)',
      sleeveId: 'convex_equity',
    },
  ],
  managed_futures: [
    {
      ticker: 'CTA',
      name: 'Simplify Managed Futures Strategy ETF',
      description: 'Systematic trend-following managed futures',
      sleeveId: 'managed_futures',
    },
  ],
  rate_hedge: [
    {
      ticker: 'PFIX',
      name: 'Simplify Interest Rate Hedge ETF',
      description: 'Rate hedge / crisis protection',
      sleeveId: 'rate_hedge',
    },
  ],
  t_bills: [
    {
      ticker: 'SBIL',
      name: 'Simplify Ultra Short Term Treasury ETF',
      description: 'Ultra-short Treasury bills',
      sleeveId: 't_bills',
    },
  ],
  real_assets: [
    {
      ticker: 'HARD',
      name: 'Simplify Commodities Strategy No K-1 ETF',
      description: 'Commodities strategy without K-1 tax complexity',
      sleeveId: 'real_assets',
    },
  ],
  core_bonds: [
    {
      ticker: 'AGGH',
      name: 'Simplify Aggregate Bond ETF',
      description: 'Broad bond market exposure (Simplify)',
      sleeveId: 'core_bonds',
    },
  ],
  cash: [
    {
      ticker: 'SBIL',
      name: 'Simplify Ultra Short Term Treasury ETF',
      description: 'Cash / ultra-short Treasury',
      sleeveId: 'cash',
    },
  ],
};

/**
 * Select convex equity ETF based on risk level
 */
function selectConvexEquityEtf(riskLevel: RiskLevel): ExampleETF {
  if (riskLevel <= 2) {
    // Conservative/Balanced: SPD
    return SIMPLIFY_ETFS.convex_equity[0];
  } else if (riskLevel <= 3) {
    // Balanced: SPYC
    return SIMPLIFY_ETFS.convex_equity[1];
  } else {
    // Growth/Aggressive: SPUC
    return SIMPLIFY_ETFS.convex_equity[2];
  }
}

/**
 * Apply instrument wrapper substitutions
 */
function applyInstrumentWrappers(
  etfs: ExampleETF[],
  goldInstrument: GoldInstrument,
  btcInstrument: BtcInstrument
): ExampleETF[] {
  return etfs.map((etf) => {
    // Replace GLDM with YGLD if goldInstrument is ygld
    if (etf.ticker === 'GLDM' && goldInstrument === 'ygld') {
      return {
        ...etf,
        ticker: 'YGLD',
        name: 'Simplify Gold Strategy ETF',
        description: 'Gold strategy with options overlay for income-style distributions',
      };
    }
    // Replace FBTC with MAXI if btcInstrument is maxi
    if (etf.ticker === 'FBTC' && btcInstrument === 'maxi') {
      return {
        ...etf,
        ticker: 'MAXI',
        name: 'Simplify Bitcoin Strategy PLUS Income ETF',
        description: 'Bitcoin strategy with options overlay; distribution may include ROC',
      };
    }
    return etf;
  });
}

/**
 * Get Schwab ETF lineup for Standard preset
 */
export function getStandardSchwabLineup(
  sleeves: Sleeve[],
  riskLevel: RiskLevel,
  lineupStyle: SchwabLineupStyle,
  goldInstrument: GoldInstrument,
  btcInstrument: BtcInstrument,
  tilt: GoldBtcTilt
): Array<{
  type: 'sleeve' | 'tilt';
  id: string;
  label: string;
  ticker?: string;
  weight: number;
  etfs?: ExampleETF[];
}> {
  // Get ETFs based on lineup style
  const etfsBySleeve: Record<string, ExampleETF[]> = {};

  if (lineupStyle === 'simplify') {
    // Simplify mode: use Simplify ETFs
    for (const sleeve of sleeves) {
      if (sleeve.weight > 0) {
        if (sleeve.id === 'convex_equity') {
          // Special handling for convex equity based on risk
          etfsBySleeve[sleeve.id] = [selectConvexEquityEtf(riskLevel)];
        } else {
          // Use Simplify ETF for this sleeve if available
          const simplifyEtfs = SIMPLIFY_ETFS[sleeve.id] || [];
          if (simplifyEtfs.length > 0) {
            etfsBySleeve[sleeve.id] = [simplifyEtfs[0]]; // Take first Simplify ETF
          } else {
            // Fallback to standard ETFs if no Simplify option
            etfsBySleeve[sleeve.id] = exampleETFs
              .filter((etf) => etf.sleeveId === sleeve.id)
              .slice(0, 1);
          }
        }
      }
    }
  } else {
    // Standard mode: use existing example ETFs
    for (const sleeve of sleeves) {
      if (sleeve.weight > 0) {
        etfsBySleeve[sleeve.id] = exampleETFs
          .filter((etf) => etf.sleeveId === sleeve.id)
          .slice(0, 2); // Keep up to 2 ETFs per sleeve
      }
    }
  }

  // Apply tilt if enabled
  if (tilt !== 'none') {
    const tilted = applySchwabTilt(sleeves, etfsBySleeve, tilt);
    // Apply instrument wrappers to tilted lineup
    return tilted.map((item) => {
      if (item.type === 'tilt') {
        // Apply wrapper to tilt items
        const ticker = item.ticker;
        if (ticker === 'GLDM' && goldInstrument === 'ygld') {
          return { ...item, ticker: 'YGLD' };
        }
        if (ticker === 'FBTC' && btcInstrument === 'maxi') {
          return { ...item, ticker: 'MAXI' };
        }
        return item;
      } else {
        // Apply wrappers to sleeve ETFs
        return {
          ...item,
          etfs: item.etfs ? applyInstrumentWrappers(item.etfs, goldInstrument, btcInstrument) : undefined,
        };
      }
    });
  }

  // No tilt: return sleeve-based lineup
  return sleeves
    .filter((s) => s.weight > 0)
    .map((sleeve) => {
      const etfs = etfsBySleeve[sleeve.id] || [];
      // Apply instrument wrappers
      const wrappedEtfs = applyInstrumentWrappers(etfs, goldInstrument, btcInstrument);
      return {
        type: 'sleeve' as const,
        id: sleeve.id,
        label: sleeve.name,
        weight: sleeve.weight * 100, // convert to percentage
        etfs: wrappedEtfs,
      };
    });
}

/**
 * Check if Gold/BTC will appear in the lineup
 */
export function willShowGoldBtc(
  preset: PortfolioPreset,
  tilt: GoldBtcTilt
): { willShowGold: boolean; willShowBtc: boolean } {
  if (isHousePreset(preset)) {
    // House presets always include Gold and BTC
    return { willShowGold: true, willShowBtc: true };
  }
  if (tilt !== 'none') {
    const { goldPct, btcPct } = getTiltPercentages(tilt);
    return { willShowGold: goldPct > 0, willShowBtc: btcPct > 0 };
  }
  return { willShowGold: false, willShowBtc: false };
}



