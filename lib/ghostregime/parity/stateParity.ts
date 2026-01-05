/**
 * State Parity Comparator
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * Compares GhostRegime-computed states vs 42 Macro KISS reference states.
 * Pure, deterministic comparison for diagnostic purposes.
 */

import type { GhostRegimeRow } from '../types';
import { loadKissStates } from './kissLoaders';
import type { KissStatesRow, KissState } from './kissTypes';
import { getGhostRegimeHistory } from '../engine';
import { loadReplayHistory } from '../replayLoader';
import { getStorageAdapter } from '../persistence';

export interface StateParityRow {
  date: string; // YYYY-MM-DD
  ghost: {
    regime?: string;
    spy?: number; // stocks_vams_state
    gld?: number; // gold_vams_state
    btc?: number; // btc_vams_state
  };
  kiss: {
    regime?: string;
    es1?: number | null; // ES1_state
    xau?: number | null; // XAU_state
    xbt?: number | null; // XBT_state
  };
  match: {
    regime?: boolean;
    stocks?: boolean; // spy vs es1
    gold?: boolean; // gld vs xau
    bitcoin?: boolean; // btc vs xbt
  };
}

/**
 * Compare GhostRegime states vs KISS reference states
 * Returns rows for all overlapping dates
 * Works in both dev (replay only) and prod (replay + computed)
 */
export async function compareStateParity(
  startDate?: Date,
  endDate?: Date
): Promise<StateParityRow[]> {
  // Load KISS states
  const kissStates = loadKissStates();
  
  // Load GhostRegime history
  // Try to use getGhostRegimeHistory, but fall back to replay only if storage fails
  let ghostHistory: GhostRegimeRow[] = [];
  try {
    ghostHistory = await getGhostRegimeHistory(startDate, endDate);
  } catch (error) {
    // If storage fails (e.g., no blob token in dev), use replay history only
    console.warn('Storage unavailable, using replay history only:', error);
    const replayHistory = loadReplayHistory();
    ghostHistory = replayHistory;
    
    // Apply date filtering if provided
    if (startDate || endDate) {
      const { parseISO, isBefore } = await import('date-fns');
      ghostHistory = ghostHistory.filter((row) => {
        const rowDate = parseISO(row.date);
        if (startDate && isBefore(rowDate, startDate)) return false;
        if (endDate && isBefore(endDate, rowDate)) return false;
        return true;
      });
    }
  }
  
  // Create date maps for efficient lookup
  const ghostMap = new Map<string, GhostRegimeRow>();
  for (const row of ghostHistory) {
    ghostMap.set(row.date, row);
  }
  
  const kissMap = new Map<string, KissStatesRow>();
  for (const row of kissStates) {
    kissMap.set(row.date, row);
  }
  
  // Get all unique dates from both sources
  const allDates = new Set<string>();
  for (const date of ghostMap.keys()) {
    allDates.add(date);
  }
  for (const date of kissMap.keys()) {
    allDates.add(date);
  }
  
  // Sort dates
  const sortedDates = Array.from(allDates).sort();
  
  // Build comparison rows
  const results: StateParityRow[] = [];
  
  for (const date of sortedDates) {
    const ghost = ghostMap.get(date);
    const kiss = kissMap.get(date);
    
    // Only include rows where both sources have data
    if (!ghost || !kiss) {
      continue;
    }
    
    // Map KISS states to GhostRegime equivalents
    // ES1 → stocks (SPY), XAU → gold (GLD), XBT → bitcoin (BTC)
    const ghostSpy = ghost.stocks_vams_state;
    const ghostGld = ghost.gold_vams_state;
    const ghostBtc = ghost.btc_vams_state;
    
    const kissEs1 = kiss.ES1_state;
    const kissXau = kiss.XAU_state;
    const kissXbt = kiss.XBT_state;
    
    // Compare states (only if both are non-null)
    const stocksMatch = kissEs1 !== null ? ghostSpy === kissEs1 : undefined;
    const goldMatch = kissXau !== null ? ghostGld === kissXau : undefined;
    const bitcoinMatch = kissXbt !== null ? ghostBtc === kissXbt : undefined;
    
    // Compare regimes
    const regimeMatch = ghost.regime === kiss.market_regime;
    
    results.push({
      date,
      ghost: {
        regime: ghost.regime,
        spy: ghostSpy,
        gld: ghostGld,
        btc: ghostBtc,
      },
      kiss: {
        regime: kiss.market_regime,
        es1: kissEs1,
        xau: kissXau,
        xbt: kissXbt,
      },
      match: {
        regime: regimeMatch,
        stocks: stocksMatch,
        gold: goldMatch,
        bitcoin: bitcoinMatch,
      },
    });
  }
  
  return results;
}

/**
 * Get mismatch statistics
 */
export interface StateParityStats {
  totalDates: number;
  datesWithBothSources: number;
  regimeMismatches: number;
  stocksMismatches: number;
  goldMismatches: number;
  bitcoinMismatches: number;
  mismatchDates: string[]; // Dates with any mismatch
}

export function computeStateParityStats(rows: StateParityRow[]): StateParityStats {
  const stats: StateParityStats = {
    totalDates: rows.length,
    datesWithBothSources: rows.length,
    regimeMismatches: 0,
    stocksMismatches: 0,
    goldMismatches: 0,
    bitcoinMismatches: 0,
    mismatchDates: [],
  };
  
  for (const row of rows) {
    let hasMismatch = false;
    
    if (row.match.regime === false) {
      stats.regimeMismatches++;
      hasMismatch = true;
    }
    
    if (row.match.stocks === false) {
      stats.stocksMismatches++;
      hasMismatch = true;
    }
    
    if (row.match.gold === false) {
      stats.goldMismatches++;
      hasMismatch = true;
    }
    
    if (row.match.bitcoin === false) {
      stats.bitcoinMismatches++;
      hasMismatch = true;
    }
    
    if (hasMismatch) {
      stats.mismatchDates.push(row.date);
    }
  }
  
  return stats;
}
