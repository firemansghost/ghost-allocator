/**
 * BTC Parameter Sensitivity Scan
 * 
 * Tests different threshold and momentum weight combinations to find optimal match rate.
 * 
 * Usage: RUN_PARITY_TESTS=1 tsx scripts/ghostregime/btc-parameter-scan.ts
 * 
 * Requires:
 * - Reference states file (reference_states.csv)
 * - RUN_PARITY_TESTS=1 environment variable
 * 
 * Output: reports/btc_parameter_scan.md
 */

import { parseISO } from 'date-fns';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getGhostRegimeHistory } from '../../lib/ghostregime/engine';
import { buildBtcStateDebugRow } from '../../lib/ghostregime/parity/btcStateDebug';
import { defaultMarketDataProvider } from '../../lib/ghostregime/marketData';
import { MARKET_SYMBOLS } from '../../lib/ghostregime/config';
import { loadKissStates } from '../../lib/ghostregime/parity/kissLoaders';
import { compareStateParity } from '../../lib/ghostregime/parity/stateParity';
import type { MarketDataPoint } from '../../lib/ghostregime/types';
import { getDataForSymbol, calculateTR, getReturnsForWindow, calculateStdDev, TR_126, TR_252 } from '../../lib/ghostregime/dataWindows';

function getReferenceDataDir(): string {
  return process.env.GHOSTREGIME_REFERENCE_DATA_DIR || '.local/reference';
}

interface ParameterSet {
  thresholdNeg: number;
  thresholdPos: number;
  momentumWeight126: number;
  momentumWeight252: number;
}

interface ScanResult {
  params: ParameterSet;
  matchRate: number;
  matchCount: number;
  totalCount: number;
}

/**
 * Compute VAMS score with custom parameters
 */
function computeVamsScoreCustom(
  marketData: MarketDataPoint[],
  symbol: string,
  asofDate: Date,
  params: ParameterSet
): number {
  const symbolData = getDataForSymbol(marketData, symbol);
  const filtered = symbolData.filter(d => d.date <= asofDate);
  
  if (filtered.length < TR_252) {
    return 0;
  }
  
  // Calculate TR_126 and TR_252
  const tr126 = calculateTR(filtered, TR_126, asofDate);
  const tr252 = calculateTR(filtered, TR_252, asofDate);
  
  // Calculate momentum with custom weights
  const mom = params.momentumWeight126 * tr126 + params.momentumWeight252 * tr252;
  
  // Calculate volatility: stdev(daily_returns, 63) * sqrt(252)
  const returns = getReturnsForWindow(marketData, symbol, 63, asofDate);
  if (returns.length < 63) {
    return 0;
  }
  
  const stdDev = calculateStdDev(returns);
  const vol = stdDev * Math.sqrt(252);
  
  if (vol === 0) return 0;
  return mom / vol;
}

/**
 * Convert score to state with custom thresholds
 */
function scoreToState(score: number, params: ParameterSet): number {
  if (score >= params.thresholdPos) {
    return 2;
  } else if (score <= params.thresholdNeg) {
    return -2;
  } else {
    return 0;
  }
}

async function scanParameters(): Promise<ScanResult[]> {
  // Check if parity tests are enabled
  if (process.env.RUN_PARITY_TESTS !== '1') {
    console.error('Error: RUN_PARITY_TESTS=1 is required to run parameter scan');
    console.error('This script requires reference data and should only be run locally.');
    process.exit(1);
  }
  
  // Check for reference data
  const dataDir = getReferenceDataDir();
  const statesPath = join(process.cwd(), dataDir, 'reference_states.csv');
  
  if (!existsSync(statesPath)) {
    console.error(`Error: Reference states file not found at ${statesPath}`);
    console.error('Set GHOSTREGIME_REFERENCE_DATA_DIR or place reference_states.csv in .local/reference/');
    process.exit(1);
  }
  
  // Load reference states
  const referenceStates = loadKissStates();
  console.log(`Loaded ${referenceStates.length} reference state rows`);
  
  // Get GhostRegime history
  const ghostHistory = await getGhostRegimeHistory();
  console.log(`Loaded ${ghostHistory.length} GhostRegime history rows\n`);
  
  // Get state parity comparison
  const parityRows = await compareStateParity();
  const validRows = parityRows.filter((row) => {
    return row.ghost.btc !== undefined &&
           row.kiss.xbt !== null &&
           row.kiss.xbt !== undefined &&
           !isNaN(row.ghost.btc) &&
           !isNaN(row.kiss.xbt);
  });
  
  console.log(`Testing ${validRows.length} valid date rows\n`);
  
  // Fetch market data once for all dates
  const allDates = validRows.map((r) => parseISO(r.date));
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  const startDate = new Date(minDate);
  startDate.setDate(startDate.getDate() - 600); // ~600 calendar days for TR_252
  
  console.log('Fetching market data...');
  const marketData = await defaultMarketDataProvider.getHistoricalPrices(
    [MARKET_SYMBOLS.BTC_USD],
    startDate,
    maxDate
  );
  console.log(`Loaded ${marketData.length} market data points\n`);
  
  // Define parameter grid
  const thresholdNegValues = [-0.40, -0.45, -0.50, -0.55, -0.60];
  const thresholdPosValues = [0.40, 0.45, 0.50, 0.55, 0.60];
  const momentumWeights = [
    { tr126: 0.5, tr252: 0.5 },
    { tr126: 0.6, tr252: 0.4 }, // Default
    { tr126: 0.7, tr252: 0.3 },
  ];
  
  const parameterSets: ParameterSet[] = [];
  
  for (const thresholdNeg of thresholdNegValues) {
    for (const thresholdPos of thresholdPosValues) {
      for (const weights of momentumWeights) {
        parameterSets.push({
          thresholdNeg,
          thresholdPos,
          momentumWeight126: weights.tr126,
          momentumWeight252: weights.tr252,
        });
      }
    }
  }
  
  console.log(`Testing ${parameterSets.length} parameter combinations...\n`);
  
  const results: ScanResult[] = [];
  
  for (const params of parameterSets) {
    let matchCount = 0;
    let totalCount = 0;
    
    for (const row of validRows) {
      const date = parseISO(row.date);
      const score = computeVamsScoreCustom(
        marketData,
        MARKET_SYMBOLS.BTC_USD,
        date,
        params
      );
      
      const computedState = scoreToState(score, params);
      const referenceState = row.kiss.xbt;
      if (referenceState === null || referenceState === undefined) continue;
      
      totalCount++;
      if (computedState === referenceState) {
        matchCount++;
      }
    }
    
    const matchRate = totalCount > 0 ? matchCount / totalCount : 0;
    
    results.push({
      params,
      matchRate,
      matchCount,
      totalCount,
    });
    
    // Progress indicator
    if (results.length % 10 === 0) {
      console.log(`  Tested ${results.length}/${parameterSets.length} combinations...`);
    }
  }
  
  // Sort by match rate (descending)
  results.sort((a, b) => b.matchRate - a.matchRate);
  
  return results;
}

async function generateReport() {
  console.log('Running BTC parameter sensitivity scan...\n');
  
  const results = await scanParameters();
  
  // Generate report
  const reportsDir = join(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportPath = join(reportsDir, 'btc_parameter_scan.md');
  
  let report = `# BTC Parameter Sensitivity Scan\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total parameter combinations tested: ${results.length}\n`;
  report += `- Best match rate: ${(results[0].matchRate * 100).toFixed(1)}%\n`;
  const defaultResult = results.find(r => 
    r.params.thresholdNeg === -0.5 &&
    r.params.thresholdPos === 0.5 &&
    r.params.momentumWeight126 === 0.6 &&
    r.params.momentumWeight252 === 0.4
  );
  report += `- Current default match rate: ${((defaultResult?.matchRate || 0) * 100).toFixed(1)}%\n\n`;
  
  report += `## Top 5 Parameter Sets by Match Rate\n\n`;
  report += `| Rank | Threshold Neg | Threshold Pos | Momentum (126/252) | Match Rate | Matches | Total |\n`;
  report += `|------|---------------|---------------|-------------------|-----------|---------|-------|\n`;
  
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    report += `| ${i + 1} | ${r.params.thresholdNeg} | ${r.params.thresholdPos} | ${r.params.momentumWeight126}/${r.params.momentumWeight252} | ${(r.matchRate * 100).toFixed(1)}% | ${r.matchCount} | ${r.totalCount} |\n`;
  }
  
  report += `\n## Current Default Parameters\n\n`;
  
  if (defaultResult) {
    const rank = results.indexOf(defaultResult) + 1;
    report += `- Threshold Neg: ${defaultResult.params.thresholdNeg}\n`;
    report += `- Threshold Pos: ${defaultResult.params.thresholdPos}\n`;
    report += `- Momentum Weights: ${defaultResult.params.momentumWeight126}/${defaultResult.params.momentumWeight252}\n`;
    report += `- Match Rate: ${(defaultResult.matchRate * 100).toFixed(1)}%\n`;
    report += `- Rank: #${rank} out of ${results.length}\n\n`;
  }
  
  report += `## Interpretation\n\n`;
  report += `This scan tests different combinations of:\n`;
  report += `- Negative threshold (state = -2 when score ≤ threshold)\n`;
  report += `- Positive threshold (state = +2 when score ≥ threshold)\n`;
  report += `- Momentum weights (TR_126 and TR_252 contributions)\n\n`;
  report += `**Note:** This is analysis only. No changes to production config are made.\n`;
  report += `Use this data to inform potential threshold/math adjustments.\n`;
  
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`\nReport written to: ${reportPath}`);
  console.log(`\nTop 5 parameter sets:`);
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    console.log(`  ${i + 1}. Threshold: [${r.params.thresholdNeg}, ${r.params.thresholdPos}], Momentum: ${r.params.momentumWeight126}/${r.params.momentumWeight252}, Match: ${(r.matchRate * 100).toFixed(1)}%`);
  }
}

generateReport().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
