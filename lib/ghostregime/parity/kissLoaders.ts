/**
 * KISS Reference Data Loaders (Node.js - for tests only)
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * Node.js-only loaders for KISS reference files (uses fs).
 * For browser usage, see kissLoaders.browser.ts
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import type {
  KissLatestSnapshot,
  KissBacktestRow,
  KissStatesRow,
  KissRegime,
  KissState,
} from './kissTypes';

const KISS_DATA_DIR = 'data/kiss';

/**
 * Normalize date string to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * Parse KISS state value from CSV (can be empty string, number, or null)
 */
function parseKissState(value: string | number | null | undefined): KissState | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    if (value === 2 || value === 0 || value === -2) {
      return value as KissState;
    }
    throw new Error(`Invalid KISS state value: ${value} (must be -2, 0, or 2)`);
  }
  const str = String(value).trim();
  if (str === '') {
    return null;
  }
  const num = parseInt(str, 10);
  if (isNaN(num)) {
    return null;
  }
  if (num === 2 || num === 0 || num === -2) {
    return num as KissState;
  }
  throw new Error(`Invalid KISS state value: ${value} (must be -2, 0, or 2)`);
}

/**
 * Parse KISS regime from string
 */
function parseKissRegime(value: string): KissRegime {
  const regimes: KissRegime[] = ['GOLDILOCKS', 'REFLATION', 'INFLATION', 'DEFLATION'];
  if (regimes.includes(value as KissRegime)) {
    return value as KissRegime;
  }
  throw new Error(`Invalid KISS regime: ${value}`);
}

/**
 * Load KISS latest snapshot from JSON file (sync, Node.js only, for tests)
 */
export function loadKissLatestSnapshotSync(): KissLatestSnapshot {
  const filePath = `${KISS_DATA_DIR}/kiss_latest_snapshot.json`;
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content) as KissLatestSnapshot;
  
  // Validate and normalize
  data.date = normalizeDate(data.date);
  data.market_regime = parseKissRegime(data.market_regime);
  
  // Validate states
  const validStates: KissState[] = [-2, 0, 2];
  if (!validStates.includes(data.states.es1_state)) {
    throw new Error(`Invalid ES1 state: ${data.states.es1_state}`);
  }
  if (!validStates.includes(data.states.xau_state)) {
    throw new Error(`Invalid XAU state: ${data.states.xau_state}`);
  }
  if (!validStates.includes(data.states.xbt_state)) {
    throw new Error(`Invalid XBT state: ${data.states.xbt_state}`);
  }
  
  return data;
}

/**
 * Load KISS backtest CSV file (sync, Node.js only, for tests)
 */
export function loadKissBacktest(): KissBacktestRow[] {
  const filePath = `${KISS_DATA_DIR}/kiss_reference_kiss_backtest.csv`;
  const content = readFileSync(filePath, 'utf-8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: (value: string, context: any) => {
      // Handle numeric columns
      if (['ta_stocks', 'ta_gold', 'ta_btc', 'ae_cash', 'ae_stocks', 'ae_gold', 'ae_btc'].includes(context.column)) {
        return parseFloat(value) || 0;
      }
      // Don't cast state columns here - parse them manually below
      return value;
    },
  }) as any[];
  
  return records.map((row) => {
    const backtestRow: KissBacktestRow = {
      date: normalizeDate(row.date),
      market_regime: parseKissRegime(row.market_regime),
      risk_regime: row.risk_regime as 'RISK ON' | 'RISK OFF',
      spy_state: parseKissState(row.spy_state) as KissState,
      gld_state: parseKissState(row.gld_state) as KissState,
      xbt_state: parseKissState(row.xbt_state) as KissState,
      ta_stocks: parseFloat(row.ta_stocks) || 0,
      ta_gold: parseFloat(row.ta_gold) || 0,
      ta_btc: parseFloat(row.ta_btc) || 0,
      ae_cash: parseFloat(row.ae_cash) || 0,
      ae_stocks: parseFloat(row.ae_stocks) || 0,
      ae_gold: parseFloat(row.ae_gold) || 0,
      ae_btc: parseFloat(row.ae_btc) || 0,
    };
    
    // Validate states are not null (backtest should have all states)
    if (backtestRow.spy_state === null || backtestRow.gld_state === null || backtestRow.xbt_state === null) {
      throw new Error(`Missing state in backtest row ${backtestRow.date}`);
    }
    
    return backtestRow;
  });
}

/**
 * Load KISS states CSV file (sync, Node.js only, for tests)
 */
export function loadKissStates(): KissStatesRow[] {
  const filePath = `${KISS_DATA_DIR}/kiss_states_market_regime_ES1_XAU_XBT.csv`;
  const content = readFileSync(filePath, 'utf-8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as any[];
  
  return records.map((row) => ({
    date: normalizeDate(row.date),
    market_regime: parseKissRegime(row.market_regime),
    ES1_state: parseKissState(row.ES1_state),
    XAU_state: parseKissState(row.XAU_state),
    XBT_state: parseKissState(row.XBT_state),
  }));
}
