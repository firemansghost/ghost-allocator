#!/usr/bin/env node

/**
 * GhostRegime Regime Legend Drift Checker
 * 
 * Scans for hardcoded regime descriptions that should only exist in
 * lib/ghostregime/regimeLegend.ts (the canonical source).
 * 
 * Usage: npm run check:ghostregime-legend
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Sentinel phrases that should only exist in regimeLegend.ts
// These are unique substrings from the canonical descriptions
const SENTINEL_PHRASES = [
  'Markets are brave and prices are calm',
  'Markets are brave but prices are rising',
  'Markets are cautious and prices are rising',
  'Markets are cautious and prices are falling',
  'Risk On + Disinflation',
  'Risk On + Inflation',
  'Risk Off + Inflation',
  'Risk Off + Disinflation',
];

// Files to scan (excluding the canonical source itself)
const FILES_TO_SCAN = [
  'app/ghostregime/page.tsx',
  'app/ghostregime/methodology/page.tsx',
  'lib/ghostregime/ghostregimePageCopy.ts',
  'lib/ghostregime/ui.ts',
];

let hasErrors = false;

console.log('Checking for regime legend drift...\n');

for (const filePath of FILES_TO_SCAN) {
  const fullPath = join(rootDir, filePath);
  try {
    const content = readFileSync(fullPath, 'utf-8');
    
    for (const phrase of SENTINEL_PHRASES) {
      if (content.includes(phrase)) {
        // Check if it's importing from regimeLegend (allowed)
        if (content.includes('regimeLegend') || content.includes('REGIME_LEGEND_ITEMS')) {
          // This is likely fine - it's using the canonical source
          continue;
        }
        
        console.error(`❌ ${filePath}`);
        console.error(`   Found hardcoded phrase: "${phrase}"`);
        console.error(`   This should only exist in lib/ghostregime/regimeLegend.ts\n`);
        hasErrors = true;
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, skip
      continue;
    }
    console.error(`Error reading ${filePath}:`, err.message);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Drift detected! Please remove hardcoded regime descriptions and use lib/ghostregime/regimeLegend.ts instead.');
  process.exit(1);
} else {
  console.log('✅ No drift detected. All regime descriptions are using the canonical source.');
  process.exit(0);
}
