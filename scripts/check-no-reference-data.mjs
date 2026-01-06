/**
 * Guardrail: Check for tracked reference data files
 * 
 * Fails if any tracked files match forbidden reference data paths or suspicious patterns.
 * This prevents accidental reintroduction of reference datasets into the repo.
 */

import { execSync } from 'child_process';

const FORBIDDEN_PATHS = [
  'data/kiss/',
  'public/data/kiss/',
  'docs/KISS/',
];

const SUSPICIOUS_PATTERNS = [
  /.*_market_regime_.*\.csv$/,
  /.*_backtest.*\.csv$/,
  /.*_latest_snapshot.*\.json$/,
  /.*_states.*\.csv$/,
  /.*_prices.*\.csv$/,
];

const SUSPICIOUS_DIRS = [
  'docs/',
  'data/',
];

function checkTrackedFiles() {
  try {
    // Get all tracked files
    const output = execSync('git ls-files', { encoding: 'utf-8' });
    const trackedFiles = output.trim().split('\n').filter(Boolean);
    
    const violations = [];
    
    for (const file of trackedFiles) {
      // Check forbidden paths
      for (const forbidden of FORBIDDEN_PATHS) {
        if (file.includes(forbidden)) {
          violations.push({
            file,
            reason: `Matches forbidden path: ${forbidden}`,
          });
        }
      }
      
      // Check suspicious patterns in suspicious directories
      for (const dir of SUSPICIOUS_DIRS) {
        if (file.startsWith(dir)) {
          for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(file)) {
              violations.push({
                file,
                reason: `Matches suspicious pattern in ${dir}: ${pattern}`,
              });
            }
          }
        }
      }
    }
    
    return violations;
  } catch (error) {
    console.error('Error checking tracked files:', error.message);
    process.exit(1);
  }
}

// Main
const violations = checkTrackedFiles();

if (violations.length > 0) {
  console.error('❌ Reference data files found in tracked files:');
  console.error('');
  
  for (const violation of violations) {
    console.error(`  ${violation.file}`);
    console.error(`    Reason: ${violation.reason}`);
    console.error('');
  }
  
  console.error('How to fix:');
  console.error('  1. Move reference files to .local/reference/ (gitignored)');
  console.error('  2. Remove from git: git rm --cached <file>');
  console.error('  3. Commit the removal');
  console.error('');
  console.error('Reference data must NOT be tracked in the repo.');
  console.error('Use .local/reference/ or set GHOSTREGIME_REFERENCE_DATA_DIR for local-only storage.');
  console.error('');
  
  process.exit(1);
} else {
  console.log('✓ No reference data files found in tracked files');
  process.exit(0);
}
