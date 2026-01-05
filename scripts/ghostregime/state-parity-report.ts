/**
 * State Parity Report Generator
 * 
 * Generates a markdown summary and CSV detail report comparing
 * GhostRegime states vs 42 Macro KISS reference states.
 */

import { compareStateParity, computeStateParityStats } from '../../lib/ghostregime/parity/stateParity';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function generateReport() {
  console.log('Generating state parity report...');
  
  // Compare states
  const rows = await compareStateParity();
  const stats = computeStateParityStats(rows);
  
  // Ensure reports directory exists
  const reportsDir = join(process.cwd(), 'reports');
  mkdirSync(reportsDir, { recursive: true });
  
  // Generate summary markdown
  const summaryPath = join(reportsDir, 'state_parity_summary.md');
  const summary = generateSummaryMarkdown(rows, stats);
  writeFileSync(summaryPath, summary, 'utf-8');
  console.log(`✓ Summary written to ${summaryPath}`);
  
  // Generate detail CSV
  const detailPath = join(reportsDir, 'state_parity_detail.csv');
  const detail = generateDetailCSV(rows);
  writeFileSync(detailPath, detail, 'utf-8');
  console.log(`✓ Detail written to ${detailPath}`);
  
  // Print key findings
  console.log('\nKey Findings:');
  console.log(`- Total dates compared: ${stats.datesWithBothSources}`);
  console.log(`- Regime mismatches: ${stats.regimeMismatches}`);
  console.log(`- Stocks mismatches: ${stats.stocksMismatches}`);
  console.log(`- Gold mismatches: ${stats.goldMismatches}`);
  console.log(`- Bitcoin mismatches: ${stats.bitcoinMismatches}`);
  
  if (stats.bitcoinMismatches > 0) {
    console.log(`\n⚠️  Bitcoin has ${stats.bitcoinMismatches} mismatches (this is the known issue)`);
  }
}

function generateSummaryMarkdown(rows: any[], stats: any): string {
  const lines: string[] = [];
  
  lines.push('# State Parity Report: GhostRegime vs 42 Macro KISS');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  // Summary stats
  lines.push('## Summary Statistics');
  lines.push('');
  lines.push(`- **Total dates compared:** ${stats.datesWithBothSources}`);
  lines.push(`- **Regime mismatches:** ${stats.regimeMismatches} (${((stats.regimeMismatches / stats.datesWithBothSources) * 100).toFixed(1)}%)`);
  lines.push(`- **Stocks mismatches:** ${stats.stocksMismatches} (${((stats.stocksMismatches / stats.datesWithBothSources) * 100).toFixed(1)}%)`);
  lines.push(`- **Gold mismatches:** ${stats.goldMismatches} (${((stats.goldMismatches / stats.datesWithBothSources) * 100).toFixed(1)}%)`);
  lines.push(`- **Bitcoin mismatches:** ${stats.bitcoinMismatches} (${((stats.bitcoinMismatches / stats.datesWithBothSources) * 100).toFixed(1)}%)`);
  lines.push('');
  
  // Top 10 mismatch dates (latest first)
  const mismatchRows = rows
    .filter(r => r.match.bitcoin === false || r.match.stocks === false || r.match.gold === false || r.match.regime === false)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  
  if (mismatchRows.length > 0) {
    lines.push('## Top 10 Mismatch Dates (Latest First)');
    lines.push('');
    lines.push('| Date | Regime | Stocks | Gold | Bitcoin |');
    lines.push('|------|--------|--------|------|---------|');
    
    for (const row of mismatchRows) {
      const regime = row.match.regime ? '✓' : `✗ (G:${row.ghost.regime || '?'} K:${row.kiss.regime || '?'})`;
      const stocks = row.match.stocks === undefined ? '-' : (row.match.stocks ? '✓' : `✗ (G:${row.ghost.spy ?? '?'} K:${row.kiss.es1 ?? '?'})`);
      const gold = row.match.gold === undefined ? '-' : (row.match.gold ? '✓' : `✗ (G:${row.ghost.gld ?? '?'} K:${row.kiss.xau ?? '?'})`);
      const bitcoin = row.match.bitcoin === undefined ? '-' : (row.match.bitcoin ? '✓' : `✗ (G:${row.ghost.btc ?? '?'} K:${row.kiss.xbt ?? '?'})`);
      
      lines.push(`| ${row.date} | ${regime} | ${stocks} | ${gold} | ${bitcoin} |`);
    }
    lines.push('');
  }
  
  // Most common mismatch patterns
  const patterns = new Map<string, number>();
  for (const row of rows) {
    if (row.match.bitcoin === false || row.match.stocks === false || row.match.gold === false || row.match.regime === false) {
      const pattern = [
        row.match.regime === false ? 'R' : '',
        row.match.stocks === false ? 'S' : '',
        row.match.gold === false ? 'G' : '',
        row.match.bitcoin === false ? 'B' : '',
      ].filter(Boolean).join('');
      
      if (pattern) {
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    }
  }
  
  if (patterns.size > 0) {
    lines.push('## Most Common Mismatch Patterns');
    lines.push('');
    lines.push('| Pattern | Count | Description |');
    lines.push('|---------|-------|-------------|');
    
    const sortedPatterns = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [pattern, count] of sortedPatterns) {
      const desc = pattern.split('').map(p => {
        if (p === 'R') return 'Regime';
        if (p === 'S') return 'Stocks';
        if (p === 'G') return 'Gold';
        if (p === 'B') return 'Bitcoin';
        return '';
      }).filter(Boolean).join(' + ');
      
      lines.push(`| ${pattern} | ${count} | ${desc} |`);
    }
    lines.push('');
  }
  
  // Special note about 2026-01-02
  const knownDate = rows.find((r: any) => r.date === '2026-01-02');
  if (knownDate) {
    lines.push('## Known Mismatch: 2026-01-02');
    lines.push('');
    lines.push('This date is the reference snapshot used for parity validation.');
    lines.push('');
    lines.push('| Field | GhostRegime | KISS | Match |');
    lines.push('|-------|------------|------|-------|');
    lines.push(`| Regime | ${knownDate.ghost.regime || '?'} | ${knownDate.kiss.regime || '?'} | ${knownDate.match.regime ? '✓' : '✗'} |`);
    lines.push(`| Stocks | ${knownDate.ghost.spy ?? '?'} | ${knownDate.kiss.es1 ?? '?'} | ${knownDate.match.stocks === undefined ? '-' : (knownDate.match.stocks ? '✓' : '✗')} |`);
    lines.push(`| Gold | ${knownDate.ghost.gld ?? '?'} | ${knownDate.kiss.xau ?? '?'} | ${knownDate.match.gold === undefined ? '-' : (knownDate.match.gold ? '✓' : '✗')} |`);
    lines.push(`| Bitcoin | ${knownDate.ghost.btc ?? '?'} | ${knownDate.kiss.xbt ?? '?'} | ${knownDate.match.bitcoin === undefined ? '-' : (knownDate.match.bitcoin ? '✓' : '✗')} |`);
    lines.push('');
    
    if (knownDate.match.bitcoin === false) {
      lines.push(`**⚠️ Bitcoin mismatch confirmed:** GhostRegime shows \`${knownDate.ghost.btc}\` but KISS reference shows \`${knownDate.kiss.xbt}\`.`);
      lines.push('This is the root cause of the allocation mismatch.');
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

function generateDetailCSV(rows: any[]): string {
  const lines: string[] = [];
  
  // Header
  lines.push('date,ghost_regime,ghost_spy,ghost_gld,ghost_btc,kiss_regime,kiss_es1,kiss_xau,kiss_xbt,match_regime,match_stocks,match_gold,match_bitcoin');
  
  // Rows
  for (const row of rows) {
    const values = [
      row.date,
      row.ghost.regime || '',
      row.ghost.spy ?? '',
      row.ghost.gld ?? '',
      row.ghost.btc ?? '',
      row.kiss.regime || '',
      row.kiss.es1 ?? '',
      row.kiss.xau ?? '',
      row.kiss.xbt ?? '',
      row.match.regime === undefined ? '' : (row.match.regime ? '1' : '0'),
      row.match.stocks === undefined ? '' : (row.match.stocks ? '1' : '0'),
      row.match.gold === undefined ? '' : (row.match.gold ? '1' : '0'),
      row.match.bitcoin === undefined ? '' : (row.match.bitcoin ? '1' : '0'),
    ];
    
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

// Run if called directly
if (require.main === module) {
  generateReport().catch((err) => {
    console.error('Error generating report:', err);
    process.exit(1);
  });
}
