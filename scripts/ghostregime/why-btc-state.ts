/**
 * CLI: Why BTC State?
 * 
 * Usage: tsx scripts/ghostregime/why-btc-state.ts --date YYYY-MM-DD
 * 
 * Prints GhostRegime's BTC debug row for a specific date.
 * If reference state exists locally, also prints comparison.
 */

// Bootstrap: Set CLI runtime flags for local persistence
import './_bootstrapDiagnostics';

import { parseISO } from 'date-fns';
import { getGhostRegimeHistory } from '../../lib/ghostregime/engine';
import { buildBtcStateDebugRow } from '../../lib/ghostregime/parity/btcStateDebug';
import { defaultMarketDataProvider } from '../../lib/ghostregime/marketData';
import { MARKET_SYMBOLS } from '../../lib/ghostregime/config';
import { loadKissStates } from '../../lib/ghostregime/parity/kissLoaders';
import { existsSync } from 'fs';
import { join } from 'path';

function getReferenceDataDir(): string {
  return process.env.GHOSTREGIME_REFERENCE_DATA_DIR || '.local/reference';
}

function hasReferenceData(): boolean {
  const dataDir = getReferenceDataDir();
  const statesPath = join(process.cwd(), dataDir, 'reference_states.csv');
  return existsSync(statesPath);
}

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

async function main() {
  const args = process.argv.slice(2);
  const dateIndex = args.indexOf('--date');
  
  if (dateIndex === -1 || dateIndex === args.length - 1) {
    console.error('Usage: tsx scripts/ghostregime/why-btc-state.ts --date YYYY-MM-DD');
    process.exit(1);
  }
  
  const dateStr = args[dateIndex + 1];
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
  
  // Load GhostRegime history
  const history = await getGhostRegimeHistory();
  const row = history.find((r) => r.date === dateStr);
  
  if (!row) {
    console.error(`Error: No GhostRegime data found for date ${dateStr}`);
    console.error('Available dates (last 10):');
    history
      .slice(-10)
      .reverse()
      .forEach((r) => console.error(`  ${r.date}`));
    process.exit(1);
  }
  
  // Fetch market data for BTC
  const endDate = targetDate;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 600); // ~600 calendar days for TR_252
  
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
  if (hasReferenceData()) {
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
