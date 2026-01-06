/**
 * Guardrail: Check git history for reference data files
 * 
 * Scans all reachable git objects for forbidden paths and suspicious patterns.
 * This verifies that history has been purged of reference data files.
 * 
 * Fails if any forbidden paths or suspicious patterns are found in git history.
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

function getAllGitObjects() {
  try {
    // Get all reachable objects with their paths
    const output = execSync('git rev-list --objects --all', { encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(Boolean);
    
    // Extract paths (format: <hash> <path>)
    const paths = lines
      .map(line => {
        const parts = line.split(/\s+/);
        return parts.slice(1).join(' '); // Everything after the hash
      })
      .filter(path => path && path.length > 0);
    
    return paths;
  } catch (error) {
    console.error('Error scanning git history:', error.message);
    console.error('Make sure you are in a git repository.');
    process.exit(1);
  }
}

function checkHistory() {
  const allPaths = getAllGitObjects();
  const violations = [];
  
  for (const path of allPaths) {
    // Check forbidden paths
    for (const forbidden of FORBIDDEN_PATHS) {
      if (path.includes(forbidden)) {
        violations.push({
          path,
          reason: `Matches forbidden path: ${forbidden}`,
        });
      }
    }
    
    // Check suspicious patterns in suspicious directories
    for (const dir of SUSPICIOUS_DIRS) {
      if (path.startsWith(dir)) {
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.test(path)) {
            violations.push({
              path,
              reason: `Matches suspicious pattern in ${dir}: ${pattern}`,
            });
          }
        }
      }
    }
  }
  
  return violations;
}

// Main
const violations = checkHistory();

if (violations.length > 0) {
  console.error('❌ Git history still contains reference data files:');
  console.error('');
  
  // Show top 10 matches
  const topMatches = violations.slice(0, 10);
  for (const violation of topMatches) {
    console.error(`  ${violation.path}`);
    console.error(`    Reason: ${violation.reason}`);
  }
  
  if (violations.length > 10) {
    console.error(`  ... and ${violations.length - 10} more matches`);
  }
  
  console.error('');
  console.error('Next steps:');
  console.error('  1. Run the history purge runbook: docs/ghostregime/HISTORY_PURGE_WINDOWS.md');
  console.error('  2. Use git-filter-repo to remove these paths from history');
  console.error('  3. Force push the cleaned history');
  console.error('  4. Re-run this check to verify');
  console.error('');
  console.error('History purge is required to remove these files from git history.');
  console.error('Deleting files from the working tree is not enough.');
  console.error('');
  
  process.exit(1);
} else {
  console.log('✓ No reference data files found in git history');
  process.exit(0);
}
