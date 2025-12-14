/**
 * GhostRegime Diagnostics
 * Core symbol status checking and diagnostics generation
 */

import type { MarketDataPoint, CoreSymbolStatus } from './types';
import { getDataForSymbol, getLatestDate, hasSufficientData, TR_21, TR_63 } from './dataWindows';
import { MARKET_SYMBOLS } from './config';

const CORE_SYMBOLS = [
  MARKET_SYMBOLS.SPY,
  MARKET_SYMBOLS.HYG,
  MARKET_SYMBOLS.IEF,
  MARKET_SYMBOLS.EEM,
  MARKET_SYMBOLS.PDBC,
  MARKET_SYMBOLS.TLT,
  MARKET_SYMBOLS.UUP,
  MARKET_SYMBOLS.VIX,
] as const;

/**
 * Get provider name for a symbol
 */
function getProviderName(symbol: string): string {
  if (symbol === MARKET_SYMBOLS.VIX) {
    return 'FRED';
  } else if (symbol === MARKET_SYMBOLS.BTC_USD) {
    return 'CoinGecko';
  } else {
    return 'Stooq';
  }
}

/**
 * Check core symbol status and build diagnostics
 */
export function checkCoreSymbolStatus(
  marketData: MarketDataPoint[],
  asofDate: Date | null
): {
  allOk: boolean;
  missingSymbols: string[];
  status: Record<string, CoreSymbolStatus>;
} {
  const status: Record<string, CoreSymbolStatus> = {};
  const missingSymbols: string[] = [];

  for (const symbol of CORE_SYMBOLS) {
    const symbolData = getDataForSymbol(marketData, symbol);
    const latestDate = getLatestDate(marketData, symbol);
    const provider = getProviderName(symbol);

    let ok = true;
    let note: string | undefined;

    if (symbolData.length === 0) {
      ok = false;
      note = 'No data available';
      missingSymbols.push(symbol);
    } else if (asofDate) {
      // Check if we have sufficient data for TR_21 and TR_63
      const hasTR21 = hasSufficientData(marketData, symbol, asofDate, TR_21);
      const hasTR63 = hasSufficientData(marketData, symbol, asofDate, TR_63);

      if (!hasTR21 || !hasTR63) {
        ok = false;
        const missingWindows: string[] = [];
        if (!hasTR21) missingWindows.push('TR_21');
        if (!hasTR63) missingWindows.push('TR_63');
        note = `Insufficient data for ${missingWindows.join(', ')}`;
        missingSymbols.push(symbol);
      }
    }

    status[symbol] = {
      provider,
      last_date: latestDate ? latestDate.toISOString().split('T')[0] : null,
      obs: symbolData.length,
      ok,
      note,
    };
  }

  return {
    allOk: missingSymbols.length === 0,
    missingSymbols,
    status,
  };
}

