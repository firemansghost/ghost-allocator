#!/usr/bin/env node

/**
 * GhostRegime Builder Copy Drift Check
 * 
 * Ensures that GhostRegime Builder education copy stays centralized in
 * lib/ghostregime/builderCopy.ts and doesn't get re-hardcoded in components.
 * 
 * This script scans target files for "sentinel phrases" that should only
 * exist in the canonical copy module. If found, it fails with a helpful error.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Sentinel phrases that should only exist in lib/ghostregime/builderCopy.ts
 * These are distinctive phrases that would be obviously wrong to reintroduce as literals.
 */
const SENTINEL_PHRASES = [
  'GhostRegime snapshot',
  'Rebalance cheatsheet',
  'Why this setup?',
  'Touch grass',
  'Schwab cash (unallocated)',
  'Markets were boring. (Enjoy it.)',
  "You're basically on target. Do nothing.",
  'What do these mean?',
  'GhostRegime scaling applied',
  'How do I execute this?',
  "It's diversified… but still admits we live in interesting times.",
];

/**
 * Files to scan for copy drift
 */
const TARGET_FILES = [
  'components/ghostregime/GhostRegimeHouseEducation.tsx',
  'app/builder/page.tsx',
];

/**
 * Check a file for sentinel phrases
 * Returns array of violations: [{ phrase, lineNumber, lineContent }]
 */
function checkFile(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${filePath}`);
    return [{ phrase: 'FILE_NOT_FOUND', lineNumber: 0, lineContent: filePath }];
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip comments (allow phrases in comments - they're just documentation)
    // Check for single-line comments (//) and multi-line comment markers (*)
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('*/')) {
      continue;
    }
    
    // Skip import statements (phrases might appear in import paths or module names)
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
      continue;
    }

    // Check each sentinel phrase
    for (const phrase of SENTINEL_PHRASES) {
      // Check if phrase appears as a literal string (not in a comment or import)
      // Look for the phrase in quotes (single, double, or template literals)
      // We need to check various quote patterns to catch all cases
      const patterns = [
        `"${phrase}"`,      // Double quotes
        `'${phrase}'`,      // Single quotes
        `\`${phrase}\``,    // Template literals
        `"${phrase.replace(/"/g, '\\"')}"`, // Escaped quotes in double quotes
        `'${phrase.replace(/'/g, "\\'")}'`, // Escaped quotes in single quotes
      ];
      
      // Check if any pattern matches
      const found = patterns.some((pattern) => line.includes(pattern));
      
      // Also check for JSX text content (phrase not in quotes but as direct text)
      // This catches cases like: <p>Touch grass</p>
      const inJSXText = line.includes(`>${phrase}<`) || line.includes(`>${phrase}</`);
      
      if (found || inJSXText) {
        violations.push({
          phrase,
          lineNumber,
          lineContent: line.trim(),
        });
      }
    }
  }

  return violations;
}

/**
 * Main check function
 */
function main() {
  console.log('Checking for GhostRegime Builder copy drift...\n');

  let hasErrors = false;
  const allViolations = [];

  for (const file of TARGET_FILES) {
    const violations = checkFile(file);
    
    if (violations.length > 0) {
      hasErrors = true;
      allViolations.push({ file, violations });
    }
  }

  if (hasErrors) {
    console.error('❌ Copy drift detected!\n');
    console.error('The following phrases were found as literals in component files:');
    console.error('These should be imported from lib/ghostregime/builderCopy.ts instead.\n');

    for (const { file, violations } of allViolations) {
      console.error(`📄 ${file}:`);
      for (const violation of violations) {
        console.error(`   Line ${violation.lineNumber}: "${violation.phrase}"`);
        console.error(`   ${violation.lineContent}`);
        console.error('');
      }
    }

    console.error('💡 Fix: Move copy to lib/ghostregime/builderCopy.ts and import it.');
    console.error('   See lib/ghostregime/builderCopy.ts for the canonical constants.\n');
    process.exit(1);
  }

  console.log('✅ No copy drift detected. All Builder education copy is properly centralized.\n');
  process.exit(0);
}

main();

