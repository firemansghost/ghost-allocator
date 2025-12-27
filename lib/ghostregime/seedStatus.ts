/**
 * GhostRegime Seed Status Detection
 * Checks if seed CSV file exists and is non-empty
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { SeedStatus } from './types';
import { SEED_FILE_PATH } from './config';

export function checkSeedStatus(): SeedStatus {
  const seedPath = join(process.cwd(), SEED_FILE_PATH);

  if (!existsSync(seedPath)) {
    return {
      exists: false,
      isEmpty: true,
      path: seedPath,
    };
  }

  try {
    const stats = statSync(seedPath);
    const fileSize = stats.size;

    // Check if file is too small (likely empty or header-only)
    if (fileSize < 10) {
      return {
        exists: true,
        isEmpty: true,
        path: seedPath,
      };
    }

    // Check if file is header-only (single line)
    const content = readFileSync(seedPath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length <= 1) {
      return {
        exists: true,
        isEmpty: true,
        path: seedPath,
      };
    }

    return {
      exists: true,
      isEmpty: false,
      path: seedPath,
    };
  } catch (error) {
    // If we can't read the file, treat it as missing
    return {
      exists: false,
      isEmpty: true,
      path: seedPath,
    };
  }
}














