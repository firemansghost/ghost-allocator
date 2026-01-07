/**
 * BTC Mismatch Attribution Report
 * 
 * Determines whether mismatch is due to:
 * - Different BTC price series (proxy/data issue)
 * - Different math/thresholds (calculation issue)
 * 
 * Usage: 
 *   tsx scripts/ghostregime/btc-mismatch-attribution.ts [--source local|api|auto] [--base-url <url>] [--days <n>]
 * 
 * Requires:
 * - Reference states file (reference_states.csv)
 * - Reference prices file (reference_prices.csv) - optional but recommended
 * 
 * Output: reports/btc_mismatch_attribution.md
 */

// Bootstrap: Set CLI runtime flags for local persistence
import './_bootstrapDiagnostics';

import { parseISO } from 'date-fns';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { buildBtcStateDebugRow } from '../../lib/ghostregime/parity/btcStateDebug';
import { defaultMarketDataProvider } from '../../lib/ghostregime/marketData';
import { MARKET_SYMBOLS } from '../../lib/ghostregime/config';
import { loadKissStates } from '../../lib/ghostregime/parity/kissLoaders';
import { compareStateParity } from '../../lib/ghostregime/parity/stateParity';
import { loadGhostRegimeHistoryForDiagnostics, type HistorySource } from '../../lib/ghostregime/parity/historySource';
import { resolveReferencePricesPath, resolveReferenceStatesPath } from '../../lib/ghostregime/parity/referencePaths';
import type { MarketDataPoint } from '../../lib/ghostregime/types';

interface ReferencePriceRow {
  date: string;
  XBT_close: number;
}

function loadReferencePrices(): ReferencePriceRow[] | null {
  const resolved = resolveReferencePricesPath();
  
  if (!resolved.path) {
    return null;
  }
  
  try {
    const { parse } = require('csv-parse/sync');
    const content = readFileSync(resolved.path, 'utf-8');
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as any[];
    
    return records.map((row) => ({
      date: row.date,
      XBT_close: parseFloat(row.XBT_close || row.XBT || '0'),
    })).filter((row) => !isNaN(row.XBT_close) && row.XBT_close > 0);
  } catch (error) {
    console.warn('Warning: Could not load reference prices:', error);
    return null;
  }
}

function convertReferencePricesToMarketData(
  refPrices: ReferencePriceRow[]
): MarketDataPoint[] {
  const data: MarketDataPoint[] = [];
  let prevClose: number | null = null;
  
  for (const row of refPrices) {
    const date = parseISO(row.date);
    const close = row.XBT_close;
    const returns = prevClose !== null ? (close - prevClose) / prevClose : 0;
    
    data.push({
      symbol: MARKET_SYMBOLS.BTC_USD,
      date,
      close,
      returns,
    });
    
    prevClose = close;
  }
  
  return data.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function parseArgs(): {
  source: HistorySource;
  baseUrl?: string;
  days: number;
} {
  const args = process.argv.slice(2);
  
  // Parse --source
  const sourceIndex = args.indexOf('--source');
  const sourceStr = sourceIndex !== -1 && sourceIndex < args.length - 1
    ? args[sourceIndex + 1]
    : 'auto';
  if (!['local', 'api', 'auto'].includes(sourceStr)) {
    console.error(`Error: Invalid source "${sourceStr}". Must be: local, api, or auto`);
    process.exit(1);
  }
  const source = sourceStr as HistorySource;
  
  // Parse --base-url
  const baseUrlIndex = args.indexOf('--base-url');
  const baseUrl = baseUrlIndex !== -1 && baseUrlIndex < args.length - 1
    ? args[baseUrlIndex + 1]
    : undefined;
  
  // Parse --days
  const daysIndex = args.indexOf('--days');
  const days = daysIndex !== -1 && daysIndex < args.length - 1
    ? parseInt(args[daysIndex + 1], 10)
    : 120;
  
  if (isNaN(days) || days < 1) {
    console.error(`Error: Invalid days value. Must be a positive number.`);
    process.exit(1);
  }
  
  return { source, baseUrl, days };
}

async function generateReport() {
  const { source, baseUrl, days } = parseArgs();
  
  console.log('Generating BTC mismatch attribution report...\n');
  console.log(`History source: ${source}${baseUrl ? ` (${baseUrl})` : ''}\n`);
  
  // Check for reference data
  const resolved = resolveReferenceStatesPath();
  if (!resolved.path) {
    console.error('Error: Reference states file not found.');
    console.error('Expected locations:');
    console.error('  - .local/reference/reference_states.csv');
    console.error('  - docs/KISS/kiss_states_market_regime_ES1_XAU_XBT.csv');
    console.error('');
    console.error('Run: npm run ghostregime:setup-reference to copy from drop folder.');
    process.exit(1);
  }
  
  // Load reference states
  const referenceStates = loadKissStates();
  console.log(`Loaded ${referenceStates.length} reference state rows`);
  
  // Try to load reference prices
  const referencePrices = loadReferencePrices();
  const hasReferencePrices = referencePrices !== null && referencePrices.length > 0;
  console.log(`Reference prices available: ${hasReferencePrices ? 'Yes' : 'No'}`);
  
  // Get GhostRegime history using the specified source
  let ghostHistory;
  try {
    ghostHistory = await loadGhostRegimeHistoryForDiagnostics({
      source,
      baseUrl,
      lookbackDays: days,
    });
  } catch (error) {
    console.error(`Error loading history: ${error instanceof Error ? error.message : error}`);
    if (source === 'api' || source === 'auto') {
      console.error('');
      console.error('Hint: Try --source local or provide --base-url for API access');
    }
    process.exit(1);
  }
  console.log(`Loaded ${ghostHistory.length} GhostRegime history rows\n`);
  
  // Get state parity comparison
  const parityRows = await compareStateParity();
  const btcMismatches = parityRows.filter((row) => {
    return row.ghost.btc !== undefined &&
           row.kiss.xbt !== null &&
           row.ghost.btc !== row.kiss.xbt;
  });
  
  console.log(`Found ${btcMismatches.length} BTC state mismatches\n`);
  
  // Test 1: Compare GhostRegime computed state (production series) vs reference state
  const productionMatchCount = parityRows.filter((row) => {
    return row.ghost.btc !== undefined &&
           row.kiss.xbt !== null &&
           row.ghost.btc === row.kiss.xbt;
  }).length;
  const productionMatchRate = parityRows.length > 0
    ? productionMatchCount / parityRows.length
    : 0;
  
  // Test 2: If reference prices available, recompute using GhostRegime math on reference prices
  let referencePriceMatchCount = 0;
  let referencePriceMatchRate = 0;
  const referencePriceMismatches: Array<{
    date: string;
    ghostState: number;
    refPriceState: number;
    refState: number;
  }> = [];
  
  if (hasReferencePrices && referencePrices) {
    console.log('Recomputing BTC states using reference prices with GhostRegime math...\n');
    
    const refPriceMarketData = convertReferencePricesToMarketData(referencePrices);
    
    for (const parityRow of parityRows) {
      const refState = parityRow.kiss.xbt;
      if (refState === null || refState === undefined) continue;
      
      const date = parseISO(parityRow.date);
      const debug = buildBtcStateDebugRow({
        date,
        btcSeries: refPriceMarketData,
        btcSymbol: MARKET_SYMBOLS.BTC_USD,
      });
      
      if (debug.insufficientData) continue;
      
      const refPriceState = debug.state;
      
      if (refPriceState === refState) {
        referencePriceMatchCount++;
      } else {
        referencePriceMismatches.push({
          date: parityRow.date,
          ghostState: parityRow.ghost.btc ?? 0,
          refPriceState,
          refState,
        });
      }
    }
    
    referencePriceMatchRate = parityRows.length > 0
      ? referencePriceMatchCount / parityRows.length
      : 0;
  }
  
  // Generate report
  const reportsDir = join(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = join(reportsDir, 'btc_mismatch_attribution.md');
  
  let report = `# BTC State Mismatch Attribution Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total dates compared: ${parityRows.length}\n`;
  report += `- BTC mismatches: ${btcMismatches.length}\n`;
  report += `- Production match rate: ${(productionMatchRate * 100).toFixed(1)}%\n`;
  
  if (hasReferencePrices) {
    report += `- Reference price match rate (GhostRegime math on ref prices): ${(referencePriceMatchRate * 100).toFixed(1)}%\n`;
  } else {
    report += `- Reference prices: Not available (skipping data attribution test)\n`;
  }
  
  report += `\n## Attribution Analysis\n\n`;
  
  if (hasReferencePrices) {
    const improvement = referencePriceMatchRate - productionMatchRate;
    
    if (improvement > 0.1) {
      report += `**Conclusion: Proxy/Data likely cause**\n\n`;
      report += `Using reference prices with GhostRegime math improves match rate by ${(improvement * 100).toFixed(1)}%.\n`;
      report += `This suggests the mismatch is primarily due to different BTC price series (proxy/data alignment).\n\n`;
    } else if (improvement < -0.05) {
      report += `**Conclusion: Math/Thresholds likely cause**\n\n`;
      report += `Using reference prices with GhostRegime math actually decreases match rate by ${(Math.abs(improvement) * 100).toFixed(1)}%.\n`;
      report += `This suggests the mismatch is primarily due to different calculation methods or thresholds.\n\n`;
    } else {
      report += `**Conclusion: Mixed (both data and math differences)**\n\n`;
      report += `Using reference prices with GhostRegime math changes match rate by ${(improvement * 100).toFixed(1)}%.\n`;
      report += `This suggests both data differences and math/threshold differences contribute to the mismatch.\n\n`;
    }
  } else {
    report += `**Conclusion: Cannot determine (reference prices not available)**\n\n`;
    report += `To determine if mismatch is due to data or math, provide reference_prices.csv in the reference data directory.\n\n`;
  }
  
  // Top 10 mismatch dates
  report += `## Top 10 Mismatch Dates (Latest First)\n\n`;
  const topMismatches = btcMismatches
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  
  report += `| Date | GhostRegime | Reference | Match |\n`;
  report += `|------|-------------|-----------|-------|\n`;
  for (const row of topMismatches) {
    const match = row.ghost.btc === row.kiss.xbt ? '✓' : '✗';
    report += `| ${row.date} | ${row.ghost.btc ?? 'N/A'} | ${row.kiss.xbt ?? 'N/A'} | ${match} |\n`;
  }
  
  // Debug rows for top mismatches
  if (topMismatches.length > 0) {
    report += `\n## Debug Rows for Top Mismatches\n\n`;
    
    for (const mismatch of topMismatches.slice(0, 5)) {
      const date = parseISO(mismatch.date);
      
      // Get GhostRegime market data
      const endDate = date;
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 600);
      
      const marketData = await defaultMarketDataProvider.getHistoricalPrices(
        [MARKET_SYMBOLS.BTC_USD],
        startDate,
        endDate
      );
      
      const debug = buildBtcStateDebugRow({
        date,
        btcSeries: marketData,
        btcSymbol: MARKET_SYMBOLS.BTC_USD,
      });
      
      report += `### ${mismatch.date}\n\n`;
      report += `**GhostRegime:**\n`;
      report += `- State: ${debug.state}\n`;
      report += `- TR_126: ${debug.tr126 !== null ? (debug.tr126 * 100).toFixed(2) + '%' : 'N/A'}\n`;
      report += `- TR_252: ${debug.tr252 !== null ? (debug.tr252 * 100).toFixed(2) + '%' : 'N/A'}\n`;
      report += `- Momentum: ${debug.momentumScore !== null ? debug.momentumScore.toFixed(4) : 'N/A'}\n`;
      report += `- Volatility: ${debug.vol !== null ? debug.vol.toFixed(4) : 'N/A'}\n`;
      report += `- Combined Score: ${debug.combinedScore !== null ? debug.combinedScore.toFixed(4) : 'N/A'}\n`;
      report += `- Close: ${debug.close !== null ? `$${debug.close.toFixed(2)}` : 'N/A'}\n`;
      report += `\n**Reference:**\n`;
      report += `- State: ${mismatch.kiss.xbt ?? 'N/A'}\n`;
      report += `\n`;
    }
  }
  
  // Reference price mismatches (if available)
  if (hasReferencePrices && referencePriceMismatches.length > 0) {
    report += `## Reference Price Mismatches (GhostRegime Math on Ref Prices)\n\n`;
    report += `These dates still mismatch even when using reference prices with GhostRegime math:\n\n`;
    report += `| Date | GhostRegime State | Ref Price State | Reference State |\n`;
    report += `|------|------------------|----------------|-----------------|\n`;
    for (const mismatch of referencePriceMismatches.slice(0, 10)) {
      report += `| ${mismatch.date} | ${mismatch.ghostState} | ${mismatch.refPriceState} | ${mismatch.refState} |\n`;
    }
  }
  
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`\nReport written to: ${reportPath}`);
}

generateReport().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
