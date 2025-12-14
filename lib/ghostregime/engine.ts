/**
 * GhostRegime Engine
 * Main orchestration for replay and computed modes
 */

import { formatISO, parseISO, isBefore, differenceInDays } from 'date-fns';
import type { GhostRegimeRow, MarketDataPoint, SatelliteData, RegimeType } from './types';
import { CUTOVER_DATE_UTC, MARKET_SYMBOLS, MODEL_VERSION } from './config';
import { loadReplayHistory } from './replayLoader';
import { defaultMarketDataProvider } from './marketData';
import { computeOptionBVotes, classifyRegime, mapToRiskRegime, applyStressOverride } from './regimeCore';
import {
  processSatellites,
  resolveSatelliteData,
  SATELLITE_CONFIGS,
  DefaultSatelliteDataProvider,
} from './satellites';
import { computeAllVamsStates } from './vams';
import { computeAllocations } from './allocations';
import { detectFlipWatch } from './flipWatch';
import { getStorageAdapter } from './persistence';
import { getDataForSymbol, calculateRatioTR, TR_63 } from './dataWindows';

/**
 * Compute GhostRegime for a specific date
 */
export async function computeGhostRegime(
  date: Date,
  marketData: MarketDataPoint[],
  satelliteData: SatelliteData[],
  previousRegime: RegimeType | null = null
): Promise<GhostRegimeRow> {
  // Check if date is before/at cutover (should use replay, but this is computed mode)
  const cutoverDate = CUTOVER_DATE_UTC;
  if (isBefore(date, cutoverDate) || date.getTime() === cutoverDate.getTime()) {
    // This shouldn't happen in computed mode, but handle gracefully
    throw new Error('Date is at or before cutover - use replay mode');
  }

  // Compute Option B votes
  const votes = computeOptionBVotes(marketData);
  let riskScore = votes.risk_score;
  let inflCoreScore = votes.infl_score;

  // Process satellites and combine with core inflation score
  const inflSatScore = processSatellites(satelliteData, SATELLITE_CONFIGS, date);
  const inflTotalScore = inflCoreScore + inflSatScore;

  // Classify regime
  let regime = classifyRegime(riskScore, inflTotalScore);
  let riskRegime = mapToRiskRegime(regime);

  // Apply stress override
  const vixData = getDataForSymbol(marketData, MARKET_SYMBOLS.VIX);
  const hygData = getDataForSymbol(marketData, MARKET_SYMBOLS.HYG);
  const iefData = getDataForSymbol(marketData, MARKET_SYMBOLS.IEF);
  
  if (vixData.length > 0 && hygData.length >= TR_63 && iefData.length >= TR_63) {
    const latestVix = vixData[vixData.length - 1].close;
    const hygIefRatio = calculateRatioTR(hygData, iefData, TR_63);
    riskRegime = applyStressOverride(latestVix, hygIefRatio, riskRegime);
    
    // Reclassify if risk regime changed
    if (riskRegime === 'RISK OFF' && (regime === 'GOLDILOCKS' || regime === 'REFLATION')) {
      regime = inflTotalScore > 0 ? 'INFLATION' : 'DEFLATION';
    }
  }

  // Compute VAMS states
  const vamsStates = computeAllVamsStates(marketData, MARKET_SYMBOLS.BTC_USD);

  // Compute allocations
  const allocations = computeAllocations(regime, vamsStates);

  // Detect flip watch
  const daysSinceLastFlip = previousRegime ? differenceInDays(date, new Date()) : 0; // Simplified
  const flipWatchStatus = detectFlipWatch(
    regime,
    previousRegime,
    riskScore,
    inflTotalScore,
    daysSinceLastFlip
  );

  // Build row
  const row: GhostRegimeRow = {
    date: formatISO(date, { representation: 'date' }),
    regime,
    risk_regime: riskRegime,
    risk_score: riskScore,
    infl_score: inflTotalScore,
    infl_core_score: inflCoreScore,
    infl_sat_score: inflSatScore,
    stocks_vams_state: vamsStates.stocks,
    gold_vams_state: vamsStates.gold,
    btc_vams_state: vamsStates.btc,
    stocks_target: allocations.stocks_target,
    gold_target: allocations.gold_target,
    btc_target: allocations.btc_target,
    stocks_scale: allocations.stocks_scale,
    gold_scale: allocations.gold_scale,
    btc_scale: allocations.btc_scale,
    stocks_actual: allocations.stocks_actual,
    gold_actual: allocations.gold_actual,
    btc_actual: allocations.btc_actual,
    cash: allocations.cash,
    flip_watch_status: flipWatchStatus,
    source: 'computed',
    stale: false,
  };

  return row;
}

/**
 * Get GhostRegime for today
 */
export async function getGhostRegimeToday(): Promise<GhostRegimeRow> {
  const today = new Date();
  const cutoverDate = CUTOVER_DATE_UTC;

  // Check if today is before/at cutover - use replay
  if (isBefore(today, cutoverDate) || today.getTime() === cutoverDate.getTime()) {
    const replayHistory = loadReplayHistory();
    const todayStr = formatISO(today, { representation: 'date' });
    const todayRow = replayHistory.find((r) => r.date === todayStr);
    if (todayRow) {
      return todayRow;
    }
  }

  // Try to read from storage first
  const storage = getStorageAdapter();
  const latest = await storage.readLatest();
  if (latest) {
    const latestDate = parseISO(latest.date);
    const todayStr = formatISO(today, { representation: 'date' });
    const latestStr = formatISO(latestDate, { representation: 'date' });
    
    // If we have today's data, return it
    if (latestStr === todayStr && !latest.stale) {
      return latest;
    }
  }

  // Compute for today
  try {
    // Fetch market data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 300); // Get enough history

    const allSymbols = Object.values(MARKET_SYMBOLS);
    const marketData = await defaultMarketDataProvider.getHistoricalPrices(
      allSymbols,
      startDate,
      endDate
    );

    if (marketData.length === 0) {
      // Return stale data if available
      if (latest) {
        return { ...latest, stale: true, stale_reason: 'MARKET_DATA_UNAVAILABLE' };
      }
      throw new Error('Market data unavailable');
    }

    // Resolve satellite data
    const satelliteProvider = new DefaultSatelliteDataProvider();
    satelliteProvider.setMarketData(marketData);
    const satelliteData: SatelliteData[] = [];

    for (const config of SATELLITE_CONFIGS) {
      const data = await resolveSatelliteData(config, satelliteProvider, marketData, today);
      if (data) {
        satelliteData.push(data);
      }
    }

    // Get previous regime for flip watch
    const previousRegime = latest?.regime || null;

    // Compute
    const row = await computeGhostRegime(today, marketData, satelliteData, previousRegime);

    // Persist
    await storage.writeLatest(row);
    await storage.appendToHistory(row);
    await storage.writeMeta({
      version: MODEL_VERSION,
      lastUpdated: today,
    });

    return row;
  } catch (error) {
    console.error('Error computing GhostRegime:', error);
    
    // Return stale data if available
    if (latest) {
      return { ...latest, stale: true, stale_reason: 'MARKET_DATA_UNAVAILABLE' };
    }
    
    throw error;
  }
}

/**
 * Get GhostRegime history
 */
export async function getGhostRegimeHistory(
  startDate?: Date,
  endDate?: Date
): Promise<GhostRegimeRow[]> {
  const cutoverDate = CUTOVER_DATE_UTC;
  const replayHistory = loadReplayHistory();

  // Load computed history from storage
  const storage = getStorageAdapter();
  const computedHistory = await storage.readHistory();

  // Combine and filter
  const allHistory = [...replayHistory, ...computedHistory].sort((a, b) => {
    return a.date.localeCompare(b.date);
  });

  if (startDate || endDate) {
    return allHistory.filter((row) => {
      const rowDate = parseISO(row.date);
      if (startDate && isBefore(rowDate, startDate)) return false;
      if (endDate && isBefore(endDate, rowDate)) return false;
      return true;
    });
  }

  return allHistory;
}

