/**
 * Guardrail: Check for vendor naming in repo
 * 
 * Fails if repo contains "42 macro" or "kiss" (case-insensitive) in non-generated source files.
 * This prevents accidental reintroduction of vendor names in UI/docs.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const FORBIDDEN_STRINGS = [
  '42 macro',
  'kiss',
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.cache/,
  /reports\//, // Generated reports
  /\.local/, // Local-only data
  /package-lock\.json/,
  /\.log$/,
  /\.md$/, // Allow in markdown docs (we'll update those separately)
];

const INCLUDE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.json',
];

function shouldCheckFile(filePath) {
  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  
  // Check extension
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  return INCLUDE_EXTENSIONS.includes(ext);
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Skip comments that are just file paths or imports
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('import') || line.includes('from')) {
      // Allow in comments/imports if it's just a file path
      if (line.includes('.ts') || line.includes('.js') || line.includes('.mjs')) {
        continue;
      }
    }
    
    // Skip JSON keys (like in package.json scripts)
    if (filePath.endsWith('.json')) {
      // Allow in JSON if it's a file path reference
      if (line.includes('.ts') || line.includes('.js') || line.includes('.mjs')) {
        continue;
      }
    }
    
    for (const forbidden of FORBIDDEN_STRINGS) {
      if (lowerLine.includes(forbidden.toLowerCase())) {
        issues.push({
          file: filePath,
          line: i + 1,
          text: line.trim(),
          forbidden,
        });
      }
    }
  }
  
  return issues;
}

function walkDir(dir, baseDir = dir) {
  const issues = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = fullPath.replace(baseDir + '/', '');
    
    if (shouldCheckFile(relativePath)) {
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          issues.push(...walkDir(fullPath, baseDir));
        } else if (stat.isFile()) {
          issues.push(...checkFile(fullPath));
        }
      } catch (err) {
        // Skip files we can't read
      }
    }
  }
  
  return issues;
}

// Main
const rootDir = process.cwd();
const issues = walkDir(rootDir);

if (issues.length > 0) {
  console.error('❌ Vendor naming found in source files:');
  console.error('');
  
  for (const issue of issues) {
    console.error(`  ${issue.file}:${issue.line}`);
    console.error(`    Found "${issue.forbidden}" in: ${issue.text.substring(0, 80)}${issue.text.length > 80 ? '...' : ''}`);
    console.error('');
  }
  
  console.error('Please remove vendor names from UI/docs. Use neutral language like:');
  console.error('  - "External Reference Workbook" instead of "42 Macro KISS"');
  console.error('  - "Reference" instead of "KISS"');
  console.error('');
  
  process.exit(1);
} else {
  console.log('✓ No vendor naming found in source files');
  process.exit(0);
}
