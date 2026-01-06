/**
 * Reference Data Loaders (Browser)
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * Browser-safe loaders for reference files (uses fetch).
 * Reference data must be in local-only directory (not in public/ or repo).
 */

import { parse } from 'csv-parse/sync';
import type {
  KissLatestSnapshot,
  KissRegime,
  KissState,
} from './kissTypes';

// Get reference data directory from env var, default to .local/reference
const getReferenceDataDir = (): string => {
  if (typeof window === 'undefined') {
    return process.env.GHOSTREGIME_REFERENCE_DATA_DIR || '.local/reference';
  }
  // Browser: reference data should be served via API or not at all
  // For now, we'll show a friendly error if data isn't available
  return '';
};

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
 * Parse reference state value
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
 * Parse reference regime from string
 */
function parseKissRegime(value: string): KissRegime {
  const regimes: KissRegime[] = ['GOLDILOCKS', 'REFLATION', 'INFLATION', 'DEFLATION'];
  if (regimes.includes(value as KissRegime)) {
    return value as KissRegime;
  }
  throw new Error(`Invalid KISS regime: ${value}`);
}

/**
 * Validate and normalize snapshot data
 */
function validateAndNormalizeSnapshot(data: KissLatestSnapshot): KissLatestSnapshot {
  data.date = normalizeDate(data.date);
  data.market_regime = parseKissRegime(data.market_regime);
  
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
 * Load reference latest snapshot from JSON file (async, browser)
 * Only works if NEXT_PUBLIC_ENABLE_PARITY=1
 * Reference data must be available via API endpoint (not from public/)
 */
export async function loadKissLatestSnapshot(): Promise<KissLatestSnapshot> {
  // Gate behind env flag
  if (process.env.NEXT_PUBLIC_ENABLE_PARITY !== '1') {
    throw new Error('Parity features are disabled. Set NEXT_PUBLIC_ENABLE_PARITY=1 to enable.');
  }
  
  // Reference data should not be served from public/ in production
  // For now, show a friendly error message
  throw new Error('Reference data not found. Reference datasets must be placed in a local-only directory (not in public/ or the repo). Set GHOSTREGIME_REFERENCE_DATA_DIR to specify the path.');
}
