/**
 * CLI: Why BTC State?
 * 
 * Usage: 
 *   tsx scripts/ghostregime/why-btc-state.ts --date YYYY-MM-DD [--source local|api|auto] [--base-url <url>] [--days <n>]
 * 
 * Prints GhostRegime's BTC debug row for a specific date.
 * If reference state exists locally, also prints comparison.
 */

// Bootstrap: Set CLI runtime flags for local persistence
import './_bootstrapDiagnostics';

import { parseISO, subDays } from 'date-fns';
import { buildBtcStateDebugRow } from '../../lib/ghostregime/parity/btcStateDebug';
import { defaultMarketDataProvider } from '../../lib/ghostregime/marketData';
import { MARKET_SYMBOLS } from '../../lib/ghostregime/config';
import { loadKissStates } from '../../lib/ghostregime/parity/kissLoaders';
import { loadGhostRegimeHistoryForDiagnostics, type HistorySource } from '../../lib/ghostregime/parity/historySource';
import { resolveReferenceStatesPath } from '../../lib/ghostregime/parity/referencePaths';

function formatNumber(value: number | null, decimals: number = 4): string {
  if (value === null) return 'N/A';
  return value.toFixed(decimals);
}

function formatPercent(value: number | null, decimals: number = 2): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

function printDebugRow(debug: ReturnType<typeof buildBtcStateDebugRow>, referenceState?: number | null) {
  console.log('\n=== BTC State Debug ===\n');
  console.log(`Date: ${debug.date}`);
  console.log(`Proxy Symbol: ${debug.proxySymbol}`);
  console.log(`Last Price Date Used: ${debug.lastPriceDateUsed || 'N/A'}`);
  console.log(`Close: ${debug.close ? `$${formatNumber(debug.close, 2)}` : 'N/A'}`);
  console.log('');
  
  if (debug.insufficientData) {
    console.log(`⚠️  Insufficient Data: ${debug.insufficientDataReason}`);
    return;
  }
  
  console.log('Momentum Calculation:');
  console.log(`  TR_126: ${formatPercent(debug.tr126)}`);
  console.log(`  TR_252: ${formatPercent(debug.tr252)}`);
  console.log(`  Momentum = ${debug.momentumWeights.tr126} × TR_126 + ${debug.momentumWeights.tr252} × TR_252`);
  console.log(`  Momentum Score: ${formatNumber(debug.momentumScore)}`);
  console.log('');
  
  console.log('Volatility Calculation:');
  console.log(`  Window: ${debug.volWindow} days`);
  console.log(`  Volatility (annualized): ${formatNumber(debug.vol)}`);
  console.log('');
  
  console.log('Combined Score:');
  console.log(`  Score = Momentum / Volatility`);
  console.log(`  Combined Score: ${formatNumber(debug.combinedScore)}`);
  console.log('');
  
  console.log('State Thresholds:');
  console.log(`  Score ≥ ${debug.thresholdPos} → State = +2 (Bullish)`);
  console.log(`  Score ≤ ${debug.thresholdNeg} → State = -2 (Bearish)`);
  console.log(`  Otherwise → State = 0 (Neutral)`);
  console.log('');
  
  // Distance to flip section
  console.log('Distance to Flip:');
  const flip = debug.distanceToFlip;
  
  if (flip.distanceToBearishScore !== null) {
    console.log(`  To Bearish (-2): score needs ≤ ${formatNumber(debug.thresholdNeg)}`);
    console.log(`    Current score: ${formatNumber(debug.combinedScore)} (distance: ${formatNumber(flip.distanceToBearishScore)} from bearish line)`);
  }
  
  if (flip.distanceToBullishScore !== null) {
    console.log(`  To Bullish (+2): score needs ≥ ${formatNumber(debug.thresholdPos)}`);
    console.log(`    Current score: ${formatNumber(debug.combinedScore)} (distance: ${formatNumber(flip.distanceToBullishScore)} from bullish line)`);
  }
  
  console.log('');
  
  // Volatility required (holding momentum fixed)
  if (flip.volRequiredForBearish !== null) {
    const volDelta = flip.volDeltaToBearish !== null ? formatNumber(flip.volDeltaToBearish) : 'N/A';
    const volDeltaSign = flip.volDeltaToBearish !== null && flip.volDeltaToBearish > 0 ? '+' : '';
    console.log(`  If momentum stays the same: bearish if vol ≤ ${formatNumber(flip.volRequiredForBearish)} (Δ vol ${volDeltaSign}${volDelta})`);
  } else if (flip.volRequiredForBearishNote) {
    console.log(`  If momentum stays the same: bearish ${flip.volRequiredForBearishNote}`);
  }
  
  if (flip.volRequiredForBullish !== null) {
    const volDelta = flip.volDeltaToBullish !== null ? formatNumber(flip.volDeltaToBullish) : 'N/A';
    const volDeltaSign = flip.volDeltaToBullish !== null && flip.volDeltaToBullish > 0 ? '+' : '';
    console.log(`  If momentum stays the same: bullish if vol ≤ ${formatNumber(flip.volRequiredForBullish)} (Δ vol ${volDeltaSign}${volDelta})`);
  } else if (flip.volRequiredForBullishNote) {
    console.log(`  If momentum stays the same: bullish ${flip.volRequiredForBullishNote}`);
  }
  
  console.log('');
  
  // Momentum required (holding vol fixed)
  if (flip.momRequiredForBearish !== null && flip.momDeltaToBearish !== null) {
    const momDelta = formatNumber(flip.momDeltaToBearish);
    const momDeltaSign = flip.momDeltaToBearish > 0 ? '+' : '';
    console.log(`  If vol stays the same: bearish if momentum ≤ ${formatNumber(flip.momRequiredForBearish)} (Δ mom ${momDeltaSign}${momDelta})`);
  } else if (flip.momRequiredNote) {
    console.log(`  If vol stays the same: bearish ${flip.momRequiredNote}`);
  }
  
  if (flip.momRequiredForBullish !== null && flip.momDeltaToBullish !== null) {
    const momDelta = formatNumber(flip.momDeltaToBullish);
    const momDeltaSign = flip.momDeltaToBullish > 0 ? '+' : '';
    console.log(`  If vol stays the same: bullish if momentum ≥ ${formatNumber(flip.momRequiredForBullish)} (Δ mom ${momDeltaSign}${momDelta})`);
  } else if (flip.momRequiredNote) {
    console.log(`  If vol stays the same: bullish ${flip.momRequiredNote}`);
  }
  
  console.log('');
  
  console.log('Result:');
  console.log(`  State: ${debug.state}`);
  console.log(`  Scale: ${debug.scale}`);
  console.log('');
  
  if (referenceState !== null && referenceState !== undefined) {
    const match = debug.state === referenceState;
    const referenceScale = referenceState === 2 ? 1.0 : referenceState === -2 ? 0.0 : 0.5;
    
    console.log('=== Comparison with Reference ===\n');
    console.log(`GhostRegime State: ${debug.state} (Scale: ${debug.scale})`);
    console.log(`Reference State: ${referenceState} (Scale: ${referenceScale})`);
    console.log(`Match: ${match ? '✓' : '✗'}`);
    
    if (!match) {
      console.log(`\n⚠️  MISMATCH: GhostRegime shows ${debug.state}, Reference shows ${referenceState}`);
    }
  }
}

function parseArgs(): {
  date: string;
  source: HistorySource;
  baseUrl?: string;
  days: number;
} {
  const args = process.argv.slice(2);
  
  // Parse --date
  const dateIndex = args.indexOf('--date');
  if (dateIndex === -1 || dateIndex === args.length - 1) {
    console.error('Usage: tsx scripts/ghostregime/why-btc-state.ts --date YYYY-MM-DD [--source local|api|auto] [--base-url <url>] [--days <n>]');
    process.exit(1);
  }
  const dateStr = args[dateIndex + 1];
  
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
  
  return { date: dateStr, source, baseUrl, days };
}

async function main() {
  const { date: dateStr, source, baseUrl, days } = parseArgs();
  
  let targetDate: Date;
  try {
    targetDate = parseISO(dateStr);
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    console.error(`Error: Invalid date format "${dateStr}". Use YYYY-MM-DD format.`);
    process.exit(1);
  }
  
  // Load GhostRegime history using the specified source
  let history;
  try {
    history = await loadGhostRegimeHistoryForDiagnostics({
      source,
      baseUrl,
      lookbackDays: days,
      endDate: targetDate,
    });
  } catch (error) {
    console.error(`Error loading history: ${error instanceof Error ? error.message : error}`);
    if (source === 'api' || source === 'auto') {
      console.error('');
      console.error('Hint: Try --source local or provide --base-url for API access');
    }
    process.exit(1);
  }
  
  const row = history.find((r) => r.date === dateStr);
  
  if (!row) {
    console.error(`Error: No GhostRegime data found for date ${dateStr}`);
    console.error('');
    if (history.length > 0) {
      console.error('Available dates (last 10):');
      history
        .slice(-10)
        .reverse()
        .forEach((r) => console.error(`  ${r.date}`));
    } else {
      console.error('No history data available.');
    }
    console.error('');
    if (source === 'local') {
      console.error('Hint: Try --source api --base-url <url> to query deployed app');
    } else if (source === 'auto' && !baseUrl) {
      console.error('Hint: Provide --base-url <url> to enable API fallback');
    } else if (source === 'api' || (source === 'auto' && baseUrl)) {
      console.error('Hint: Try increasing --days to load more history');
    }
    process.exit(1);
  }
  
  // Fetch market data for BTC
  const endDate = targetDate;
  const startDate = subDays(endDate, 600); // ~600 calendar days for TR_252
  
  const marketData = await defaultMarketDataProvider.getHistoricalPrices(
    [MARKET_SYMBOLS.BTC_USD],
    startDate,
    endDate
  );
  
  // Build debug row
  const debug = buildBtcStateDebugRow({
    date: targetDate,
    btcSeries: marketData,
    btcSymbol: MARKET_SYMBOLS.BTC_USD,
  });
  
  // Try to load reference state if available
  let referenceState: number | null = null;
  const resolved = resolveReferenceStatesPath();
  if (resolved.path) {
    try {
      const referenceStates = loadKissStates();
      const refRow = referenceStates.find((r) => r.date === dateStr);
      if (refRow) {
        referenceState = refRow.XBT_state;
      }
    } catch (error) {
      // Reference data exists but couldn't load - continue without it
      console.warn('Warning: Could not load reference states (continuing with GhostRegime-only output)');
    }
  }
  
  // Print results
  printDebugRow(debug, referenceState);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
