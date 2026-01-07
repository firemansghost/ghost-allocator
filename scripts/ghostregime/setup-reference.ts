/**
 * Setup Reference Data
 * 
 * Copies reference data files from drop folder (docs/KISS/) to canonical location (.local/reference/).
 * 
 * Usage: tsx scripts/ghostregime/setup-reference.ts [--from <dir>]
 */

// Bootstrap: Set CLI runtime flags for local persistence
import './_bootstrapDiagnostics';

import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { getReferenceDir, getDropDirCandidates } from '../../lib/ghostregime/parity/referencePaths';

interface FileMapping {
  sourceName: string; // Filename in drop folder
  targetName: string; // Filename in canonical location
  description: string;
}

const FILE_MAPPINGS: FileMapping[] = [
  {
    sourceName: 'kiss_states_market_regime_ES1_XAU_XBT.csv',
    targetName: 'reference_states.csv',
    description: 'Reference states (market regime + ES1/XAU/XBT states)',
  },
  {
    sourceName: 'kiss_prices_ES1_XAU_XBT.csv',
    targetName: 'reference_prices.csv',
    description: 'Reference prices (optional)',
  },
  {
    sourceName: 'kiss_reference_kiss_backtest.csv',
    targetName: 'reference_backtest.csv',
    description: 'Reference backtest data (optional)',
  },
  {
    sourceName: 'kiss_latest_snapshot.json',
    targetName: 'reference_latest_snapshot.json',
    description: 'Reference latest snapshot (optional)',
  },
];

function findSourceDirectory(fromArg?: string): string | null {
  // If --from specified, use that
  if (fromArg) {
    const customPath = join(process.cwd(), fromArg);
    if (existsSync(customPath)) {
      return customPath;
    }
    console.warn(`Warning: --from directory not found: ${fromArg}`);
    return null;
  }

  // Otherwise check drop directories
  for (const dropDir of getDropDirCandidates()) {
    const dropPath = join(process.cwd(), dropDir);
    if (existsSync(dropPath)) {
      return dropPath;
    }
  }

  return null;
}

function main() {
  const args = process.argv.slice(2);
  const fromIndex = args.indexOf('--from');
  const fromArg = fromIndex !== -1 && fromIndex < args.length - 1
    ? args[fromIndex + 1]
    : undefined;

  console.log('Setting up reference data...\n');

  // Find source directory
  const sourceDir = findSourceDirectory(fromArg);
  if (!sourceDir) {
    console.error('Error: No source directory found.');
    console.error('');
    console.error('Expected locations:');
    for (const dropDir of getDropDirCandidates()) {
      console.error(`  - ${dropDir}/`);
    }
    if (fromArg) {
      console.error(`  - ${fromArg}/ (specified via --from)`);
    }
    console.error('');
    console.error('Expected filenames:');
    for (const mapping of FILE_MAPPINGS) {
      console.error(`  - ${mapping.sourceName}`);
    }
    console.error('');
    console.error('Usage: npm run ghostregime:setup-reference [--from <directory>]');
    process.exit(1);
  }

  console.log(`Source directory: ${sourceDir}\n`);

  // Get target directory
  const targetDir = join(process.cwd(), getReferenceDir());
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    console.log(`Created target directory: ${targetDir}`);
  }

  console.log(`Target directory: ${targetDir}\n`);

  // Copy files
  let copiedCount = 0;
  let skippedCount = 0;

  for (const mapping of FILE_MAPPINGS) {
    const sourcePath = join(sourceDir, mapping.sourceName);
    const targetPath = join(targetDir, mapping.targetName);

    if (!existsSync(sourcePath)) {
      console.log(`⏭️  Skipped: ${mapping.sourceName} (not found in source)`);
      skippedCount++;
      continue;
    }

    if (existsSync(targetPath)) {
      console.log(`⏭️  Skipped: ${mapping.targetName} (already exists)`);
      skippedCount++;
      continue;
    }

    try {
      copyFileSync(sourcePath, targetPath);
      console.log(`✓ Copied: ${mapping.sourceName} → ${targetPath}`);
      console.log(`  ${mapping.description}`);
      copiedCount++;
    } catch (error) {
      console.error(`✗ Failed to copy ${mapping.sourceName}:`, error);
    }
  }

  console.log('');
  if (copiedCount > 0) {
    console.log(`✓ Setup complete: ${copiedCount} file(s) copied`);
  } else if (skippedCount > 0) {
    console.log(`ℹ️  No files copied (${skippedCount} skipped - already exist or not found)`);
  } else {
    console.log(`ℹ️  No files found to copy`);
  }
  console.log('');
  console.log('Reference data is now in:', targetDir);
  console.log('(This directory is gitignored - do not commit these files)');
}

main();
