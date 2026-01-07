/**
 * Reference Data Path Resolution
 * 
 * Handles finding reference data files in local-only locations.
 * Supports both canonical .local/reference/ and optional drop folder docs/KISS/.
 */

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Get the canonical reference data directory
 * Precedence:
 * 1. GHOSTREGIME_REFERENCE_DATA_DIR env var
 * 2. .local/reference (default)
 */
export function getReferenceDir(): string {
  return process.env.GHOSTREGIME_REFERENCE_DATA_DIR || '.local/reference';
}

/**
 * Get candidate drop directories (optional local folders where users might place files)
 * These are gitignored and should not be committed.
 */
export function getDropDirCandidates(): string[] {
  return ['docs/KISS'];
}

/**
 * Resolve the path to reference states CSV file
 * Looks in:
 * 1. ${referenceDir}/reference_states.csv (canonical)
 * 2. ${dropDir}/kiss_states_market_regime_ES1_XAU_XBT.csv (legacy drop folder)
 * 
 * Returns the path and where it was found, or null if not found.
 */
export function resolveReferenceStatesPath(): {
  path: string | null;
  foundIn: 'referenceDir' | 'dropDir' | null;
} {
  const referenceDir = getReferenceDir();
  const canonicalPath = join(process.cwd(), referenceDir, 'reference_states.csv');
  
  if (existsSync(canonicalPath)) {
    return {
      path: canonicalPath,
      foundIn: 'referenceDir',
    };
  }
  
  // Check drop directories
  for (const dropDir of getDropDirCandidates()) {
    const dropPath = join(process.cwd(), dropDir, 'kiss_states_market_regime_ES1_XAU_XBT.csv');
    if (existsSync(dropPath)) {
      return {
        path: dropPath,
        foundIn: 'dropDir',
      };
    }
  }
  
  return {
    path: null,
    foundIn: null,
  };
}

/**
 * Resolve the path to reference prices CSV file (optional)
 * Looks in:
 * 1. ${referenceDir}/reference_prices.csv (canonical)
 * 2. ${dropDir}/kiss_prices_ES1_XAU_XBT.csv (legacy drop folder)
 */
export function resolveReferencePricesPath(): {
  path: string | null;
  foundIn: 'referenceDir' | 'dropDir' | null;
} {
  const referenceDir = getReferenceDir();
  const canonicalPath = join(process.cwd(), referenceDir, 'reference_prices.csv');
  
  if (existsSync(canonicalPath)) {
    return {
      path: canonicalPath,
      foundIn: 'referenceDir',
    };
  }
  
  // Check drop directories
  for (const dropDir of getDropDirCandidates()) {
    const dropPath = join(process.cwd(), dropDir, 'kiss_prices_ES1_XAU_XBT.csv');
    if (existsSync(dropPath)) {
      return {
        path: dropPath,
        foundIn: 'dropDir',
      };
    }
  }
  
  return {
    path: null,
    foundIn: null,
  };
}

/**
 * Print a friendly reminder that drop folder files are local-only
 */
export function ensureLocalOnlyWarning(foundIn: 'dropDir'): void {
  console.warn('');
  console.warn('⚠️  Reference data found in drop folder (local-only, not tracked)');
  console.warn('   Consider running: npm run ghostregime:setup-reference');
  console.warn('   This will copy files to the canonical .local/reference/ location.');
  console.warn('');
}
