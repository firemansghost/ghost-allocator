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
import {
  getDataForSymbol,
  calculateRatioTR,
  computeAsofDate,
  hasSufficientData,
  TR_21,
  TR_63,
} from './dataWindows';
import type { RiskAxis, InflAxis } from './types';
import { checkCoreSymbolStatus } from './diagnostics';

/**
 * Compute GhostRegime for a specific date (asof_date)
 */
export async function computeGhostRegime(
  asofDate: Date,
  marketData: MarketDataPoint[],
  satelliteData: SatelliteData[],
  previousRegime: RegimeType | null = null,
  runDateUtc?: Date
): Promise<GhostRegimeRow> {
  // Check if asof_date is before/at cutover (should use replay, but this is computed mode)
  const cutoverDate = CUTOVER_DATE_UTC;
  if (isBefore(asofDate, cutoverDate) || asofDate.getTime() === cutoverDate.getTime()) {
    // This shouldn't happen in computed mode, but handle gracefully
    throw new Error('Date is at or before cutover - use replay mode');
  }

  // Compute Option B votes with asof_date
  const votes = computeOptionBVotes(marketData, asofDate);
  let riskScore = votes.risk_score;
  let inflCoreScore = votes.infl_score;
  
  // Determine risk_axis and infl_axis
  const riskAxis: RiskAxis = riskScore > 0 ? 'RiskOn' : 'RiskOff';
  const inflAxis: InflAxis = inflCoreScore > 0 ? 'Inflation' : 'Disinflation';

  // Process satellites and combine with core inflation score
  const inflSatScore = processSatellites(satelliteData, SATELLITE_CONFIGS, asofDate);
  const inflTotalScore = inflCoreScore + inflSatScore;
  
  // Update infl_axis after satellites
  const finalInflAxis: InflAxis = inflTotalScore > 0 ? 'Inflation' : 'Disinflation';

  // Classify regime
  let regime = classifyRegime(riskScore, inflTotalScore);
  let riskRegime = mapToRiskRegime(regime);

  // Apply stress override
  const vixData = getDataForSymbol(marketData, MARKET_SYMBOLS.VIX);
  const hygData = getDataForSymbol(marketData, MARKET_SYMBOLS.HYG);
  const iefData = getDataForSymbol(marketData, MARKET_SYMBOLS.IEF);
  
  // Filter to asof_date
  let filteredVixData = vixData;
  let filteredHygData = hygData;
  let filteredIefData = iefData;
  if (asofDate) {
    filteredVixData = vixData.filter(d => d.date <= asofDate);
    filteredHygData = hygData.filter(d => d.date <= asofDate);
    filteredIefData = iefData.filter(d => d.date <= asofDate);
  }
  
  if (filteredVixData.length > 0 && filteredHygData.length >= TR_63 && filteredIefData.length >= TR_63) {
    const latestVix = filteredVixData[filteredVixData.length - 1].close;
    const hygIefRatio = calculateRatioTR(filteredHygData, filteredIefData, TR_63, asofDate);
    riskRegime = applyStressOverride(latestVix, hygIefRatio, riskRegime);
    
    // Reclassify if risk regime changed
    if (riskRegime === 'RISK OFF' && (regime === 'GOLDILOCKS' || regime === 'REFLATION')) {
      regime = inflTotalScore > 0 ? 'INFLATION' : 'DEFLATION';
    }
  }

  // Compute VAMS states with asof_date
  const vamsStates = computeAllVamsStates(marketData, MARKET_SYMBOLS.BTC_USD, asofDate);

  // Compute allocations
  const allocations = computeAllocations(regime, vamsStates);

  // Detect flip watch
  const daysSinceLastFlip = previousRegime ? differenceInDays(asofDate, new Date()) : 0; // Simplified
  const flipWatchStatus = detectFlipWatch(
    regime,
    previousRegime,
    riskScore,
    inflTotalScore,
    daysSinceLastFlip
  );

  // Build row
  const row: GhostRegimeRow = {
    date: formatISO(asofDate, { representation: 'date' }),
    run_date_utc: runDateUtc ? formatISO(runDateUtc, { representation: 'date' }) : formatISO(new Date(), { representation: 'date' }),
    regime,
    risk_regime: riskRegime,
    risk_score: riskScore,
    infl_score: inflTotalScore,
    infl_core_score: inflCoreScore,
    infl_sat_score: inflSatScore,
    risk_axis: riskAxis,
    infl_axis: finalInflAxis,
    risk_tiebreaker_used: votes.risk_tiebreaker_used,
    infl_tiebreaker_used: votes.infl_tiebreaker_used,
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
  const runDateUtc = new Date();
  const cutoverDate = CUTOVER_DATE_UTC;

  // Check if run date is before/at cutover - use replay
  if (isBefore(runDateUtc, cutoverDate) || runDateUtc.getTime() === cutoverDate.getTime()) {
    const replayHistory = loadReplayHistory();
    const runDateStr = formatISO(runDateUtc, { representation: 'date' });
    const todayRow = replayHistory.find((r) => r.date === runDateStr);
    if (todayRow) {
      return todayRow;
    }
  }

  // Try to read from storage first
  const storage = getStorageAdapter();
  const latest = await storage.readLatest();

  // Core symbols for diagnostics
  const coreSymbols = [
    MARKET_SYMBOLS.SPY,
    MARKET_SYMBOLS.HYG,
    MARKET_SYMBOLS.IEF,
    MARKET_SYMBOLS.EEM,
    MARKET_SYMBOLS.PDBC,
    MARKET_SYMBOLS.TLT,
    MARKET_SYMBOLS.UUP,
    MARKET_SYMBOLS.VIX,
  ];

  // Compute for today
  try {
    // Fetch market data - need at least 400 trading days for VAMS (TR_252 + vol_63)
    // 400 trading days ≈ 1.6 years, so fetch 600 calendar days to ensure coverage
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 600); // ~600 calendar days = ~400+ trading days

    const allSymbols = Object.values(MARKET_SYMBOLS);
    const marketData = await defaultMarketDataProvider.getHistoricalPrices(
      allSymbols,
      startDate,
      endDate
    );

    // Get provider diagnostics (resolved IDs, errors)
    const providerDiagnostics = defaultMarketDataProvider.getDiagnostics();

    if (marketData.length === 0) {
      // Return stale data if available, or 503
      if (latest) {
        // Build diagnostics even with no data
        const diagnostics = checkCoreSymbolStatus(marketData, null, providerDiagnostics);
        return {
          ...latest,
          run_date_utc: formatISO(runDateUtc, { representation: 'date' }),
          stale: true,
          stale_reason: 'MARKET_DATA_UNAVAILABLE',
          missing_core_symbols: diagnostics.missingSymbols.length > 0 ? diagnostics.missingSymbols : coreSymbols,
          core_symbol_status: diagnostics.status,
        };
      }
      throw new Error('GHOSTREGIME_NOT_READY');
    }

    // Compute asof_date as minimum of last available dates across core instruments
    const asofDate = computeAsofDate(marketData, coreSymbols);
    
    // Check core symbol status and build diagnostics
    const diagnostics = checkCoreSymbolStatus(marketData, asofDate, providerDiagnostics);
    
    // VAMS history check is now handled in checkCoreSymbolStatus (requires ≥400 obs)
    
    if (!asofDate || !diagnostics.allOk) {
      // Missing or insufficient core/VAMS data - return last persisted row with diagnostics
      if (latest) {
        const staleReason = !asofDate 
          ? 'MISSING_CORE_SERIES' 
          : 'INSUFFICIENT_HISTORY';
        return {
          ...latest,
          run_date_utc: formatISO(runDateUtc, { representation: 'date' }),
          stale: true,
          stale_reason: staleReason,
          missing_core_symbols: diagnostics.missingSymbols,
          core_symbol_status: diagnostics.status,
          core_proxy_used: diagnostics.proxies,
        };
      }
      throw new Error('GHOSTREGIME_NOT_READY');
    }

    // Check if we already have data for this asof_date
    if (latest) {
      const latestDate = parseISO(latest.date);
      const asofDateStr = formatISO(asofDate, { representation: 'date' });
      const latestStr = formatISO(latestDate, { representation: 'date' });
      
      // If we have data for this asof_date and it's not stale, return it with updated run_date_utc
      if (latestStr === asofDateStr && !latest.stale) {
        return {
          ...latest,
          run_date_utc: formatISO(runDateUtc, { representation: 'date' }),
          core_proxy_used: diagnostics.proxies, // Update proxy info
        };
      }
    }

    // Resolve satellite data
    const satelliteProvider = new DefaultSatelliteDataProvider();
    satelliteProvider.setMarketData(marketData);
    const satelliteData: SatelliteData[] = [];

    for (const config of SATELLITE_CONFIGS) {
      const data = await resolveSatelliteData(config, satelliteProvider, marketData, asofDate);
      if (data) {
        satelliteData.push(data);
      }
    }

    // Get previous regime for flip watch
    const previousRegime = latest?.regime || null;

    // Compute using asof_date
    const row = await computeGhostRegime(asofDate, marketData, satelliteData, previousRegime, runDateUtc);

    // Add proxy info if any proxies were used
    if (Object.keys(diagnostics.proxies).length > 0) {
      row.core_proxy_used = diagnostics.proxies;
    }

    // Only persist if not stale
    if (!row.stale) {
      await storage.writeLatest(row);
      await storage.appendToHistory(row);
      await storage.writeMeta({
        version: MODEL_VERSION,
        lastUpdated: runDateUtc,
      });
    }

    return row;
  } catch (error) {
    console.error('Error computing GhostRegime:', error);
    
    // Return stale data if available with diagnostics
    if (latest) {
      // Try to get diagnostics if we have market data
      let diagnostics: { missingSymbols: string[]; status: Record<string, any>; proxies: Record<string, string> } | null = null;
      try {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 600); // Match main fetch window
        const allSymbols = Object.values(MARKET_SYMBOLS);
        const marketData = await defaultMarketDataProvider.getHistoricalPrices(
          allSymbols,
          startDate,
          endDate
        );
        if (marketData.length > 0) {
          const asofDate = computeAsofDate(marketData, coreSymbols);
          const providerDiagnostics = defaultMarketDataProvider.getDiagnostics();
          diagnostics = checkCoreSymbolStatus(marketData, asofDate, providerDiagnostics);
        }
      } catch {
        // Diagnostics failed, use basic error info
      }

      return {
        ...latest,
        run_date_utc: formatISO(runDateUtc, { representation: 'date' }),
        stale: true,
        stale_reason: error instanceof Error ? error.message : 'FETCH_ERROR',
        missing_core_symbols: diagnostics?.missingSymbols || [],
        core_symbol_status: diagnostics?.status || {},
        core_proxy_used: diagnostics?.proxies || latest.core_proxy_used,
      };
    }
    
    // Re-throw if it's a NOT_READY error
    if (error instanceof Error && error.message === 'GHOSTREGIME_NOT_READY') {
      throw error;
    }
    
    throw new Error('GHOSTREGIME_NOT_READY');
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

