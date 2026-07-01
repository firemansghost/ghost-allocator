/**
 * GhostRegime Diagnostics
 * Core symbol status checking and diagnostics generation
 */

import type { MarketDataPoint, CoreSymbolStatus, HistoryCheckDetail } from './types';
import { getDataForSymbol, getLatestDate, hasSufficientData } from './dataWindows';
import {
  MARKET_SYMBOLS,
  TR_21,
  TR_63,
  VAMS_MIN_OBSERVATIONS_AT_ASOF,
  GHOSTREGIME_MARKET_FETCH_CALENDAR_DAYS,
} from './config';
import type { ProviderDiagnostics } from './marketData';

/**
 * Must match `coreSymbols` in `engine.ts` `getGhostRegimeToday` (order differs OK).
 * Includes TIP for TIP/IEF ratio — same as-of alignment as `computeAsofDate`.
 */
const CORE_SYMBOLS = [
  MARKET_SYMBOLS.SPY,
  MARKET_SYMBOLS.HYG,
  MARKET_SYMBOLS.IEF,
  MARKET_SYMBOLS.EEM,
  MARKET_SYMBOLS.PDBC,
  MARKET_SYMBOLS.TIP,
  MARKET_SYMBOLS.TLT,
  MARKET_SYMBOLS.UUP,
  MARKET_SYMBOLS.VIX,
] as const;

const VAMS_SYMBOLS = [MARKET_SYMBOLS.SPY, MARKET_SYMBOLS.GLD, MARKET_SYMBOLS.BTC_USD] as const;

/**
 * Static requirements surfaced in API responses when stale (INSUFFICIENT_HISTORY, etc.)
 */
export const GHOSTREGIME_HISTORY_REQUIREMENTS = {
  fetch_window_calendar_days: GHOSTREGIME_MARKET_FETCH_CALENDAR_DAYS,
  tr_21: TR_21,
  tr_63: TR_63,
  vams_min_observations_at_asof: VAMS_MIN_OBSERVATIONS_AT_ASOF,
} as const;

/**
 * Get provider name for a symbol (uses resolvedIds for BTC Yahoo / CoinGecko / Stooq routing)
 */
function getProviderName(symbol: string, providerDiagnostics?: ProviderDiagnostics): string {
  if (symbol === MARKET_SYMBOLS.VIX) {
    return 'CBOE';
  } else if (symbol === MARKET_SYMBOLS.PDBC) {
    return 'AlphaVantage'; // May use DBC proxy from Stooq
  } else if (symbol === MARKET_SYMBOLS.BTC_USD) {
    const rid = providerDiagnostics?.resolvedIds?.[symbol] ?? '';
    if (rid.startsWith('yahoo:')) return 'Yahoo';
    if (rid.startsWith('coingecko')) return 'CoinGecko';
    return 'Stooq';
  } else if (providerDiagnostics?.resolvedIds?.[symbol]?.startsWith('yahoo:')) {
    return 'Yahoo';
  } else if (providerDiagnostics?.resolvedIds?.[symbol]?.startsWith('marketstack:')) {
    return 'Marketstack';
  } else {
    return 'Stooq';
  }
}

function formatBtcProbeSummary(providerDiagnostics?: ProviderDiagnostics): string {
  const probe = providerDiagnostics?.btc_probe;
  if (!probe) return '';
  const bits: string[] = [];
  bits.push(
    `attempts=${probe.provider_attempts.map((a) => `${a.provider}:${a.outcome}/${a.rows}`).join('>')}`
  );
  if (probe.oldest_date) bits.push(`oldest=${probe.oldest_date}`);
  if (probe.newest_date) bits.push(`newest=${probe.newest_date}`);
  bits.push(`obs_in_fetch=${probe.obs_in_fetch}`);
  if (probe.coingecko_public_lookback_limited) bits.push('coingecko_public_lookback_limited');
  if (probe.coingecko_public_lookback_exceeded) bits.push('coingecko_public_lookback_exceeded');
  if (!probe.bootstrap_capable_succeeded) bits.push('no_bootstrap_provider_succeeded');
  return bits.join('; ');
}

function obsAtOrBefore(marketData: MarketDataPoint[], symbol: string, asofDate: Date): number {
  const symbolData = getDataForSymbol(marketData, symbol);
  return symbolData.filter((d) => d.date <= asofDate).length;
}

/**
 * One-line human summary for stale responses / logs (INSUFFICIENT_HISTORY / MISSING_CORE_SERIES).
 */
export function formatStaleHistoryHumanSummary(
  staleReason: string,
  diagnostics: { missingSymbols: string[]; status: Record<string, CoreSymbolStatus> },
  providerDiagnostics?: ProviderDiagnostics
): string {
  if (staleReason === 'MISSING_CORE_SERIES') {
    const miss = diagnostics.missingSymbols.length
      ? diagnostics.missingSymbols.join(', ')
      : 'unknown';
    return `Could not compute a common market as-of date (MISSING_CORE_SERIES). Missing or empty series: ${miss}.`;
  }
  if (staleReason !== 'INSUFFICIENT_HISTORY') {
    return '';
  }
  const parts = diagnostics.missingSymbols.map((sym) => {
    const s = diagnostics.status[sym];
    if (!s) return `${sym}: (no status row)`;
    const bits: string[] = [`${s.provider}`];
    if (s.last_date) bits.push(`last=${s.last_date}`);
    if (s.obs_at_asof !== undefined) bits.push(`obs@asof=${s.obs_at_asof}`);
    if (s.obs !== undefined) bits.push(`obs_in_fetch=${s.obs}`);
    if (s.checks?.vams && !s.checks.vams.met) {
      bits.push(`VAMS need ${s.checks.vams.required} have ${s.checks.vams.have_at_asof}`);
    }
    if (s.checks?.tr_63 && !s.checks.tr_63.met) {
      bits.push(`TR_63 need ${s.checks.tr_63.required} have ${s.checks.tr_63.have_at_asof}`);
    }
    if (s.checks?.tr_21 && !s.checks.tr_21.met) {
      bits.push(`TR_21 need ${s.checks.tr_21.required} have ${s.checks.tr_21.have_at_asof}`);
    }
    if (s.note) bits.push(`note=${s.note}`);
    if (sym === MARKET_SYMBOLS.BTC_USD) {
      const btcExtra = formatBtcProbeSummary(providerDiagnostics);
      if (btcExtra) bits.push(btcExtra);
    }
    return `${sym}: ${bits.join('; ')}`;
  });
  return parts.join(' || ');
}

/**
 * Check core symbol status and build diagnostics
 */
export function checkCoreSymbolStatus(
  marketData: MarketDataPoint[],
  asofDate: Date | null,
  providerDiagnostics?: ProviderDiagnostics
): {
  allOk: boolean;
  missingSymbols: string[];
  status: Record<string, CoreSymbolStatus>;
  proxies: Record<string, string>; // Return proxy mapping
} {
  const status: Record<string, CoreSymbolStatus> = {};
  const missingSymbols: string[] = [];
  const proxies: Record<string, string> = {};

  for (const symbol of CORE_SYMBOLS) {
    const symbolData = getDataForSymbol(marketData, symbol);
    const latestDate = getLatestDate(marketData, symbol);
    const provider = getProviderName(symbol, providerDiagnostics);
    const obsAtAsof = asofDate ? obsAtOrBefore(marketData, symbol, asofDate) : symbolData.length;

    let ok = true;
    let note: string | undefined;
    const checks: CoreSymbolStatus['checks'] = {};

    if (providerDiagnostics) {
      const resolvedId = providerDiagnostics.resolvedIds[symbol];
      const error = providerDiagnostics.errors[symbol];
      const proxy = providerDiagnostics.proxies[symbol];

      if (proxy) {
        proxies[symbol] = proxy;
        note = `Proxy used: ${proxy}${error ? ` (${error})` : ''}`;
      } else if (error) {
        note = error;
        ok = false;
      } else if (resolvedId && provider === 'Stooq') {
        note = `Stooq ID: ${resolvedId}`;
      }
    }

    if (symbolData.length === 0) {
      ok = false;
      if (!note) {
        note = 'No data available';
      }
      missingSymbols.push(symbol);
    } else if (asofDate) {
      const hasTR21 = hasSufficientData(marketData, symbol, asofDate, TR_21);
      const hasTR63 = hasSufficientData(marketData, symbol, asofDate, TR_63);

      checks.tr_21 = {
        required: TR_21,
        met: hasTR21,
        have_at_asof: obsAtAsof,
      };
      checks.tr_63 = {
        required: TR_63,
        met: hasTR63,
        have_at_asof: obsAtAsof,
      };

      if (!hasTR21 || !hasTR63) {
        ok = false;
        const missingWindows: string[] = [];
        if (!hasTR21) missingWindows.push('TR_21');
        if (!hasTR63) missingWindows.push('TR_63');
        const windowNote = `Insufficient data for ${missingWindows.join(', ')}`;
        note = note ? `${note}; ${windowNote}` : windowNote;
        missingSymbols.push(symbol);
      }
    }

    status[symbol] = {
      provider,
      last_date: latestDate ? latestDate.toISOString().split('T')[0] : null,
      obs: symbolData.length,
      obs_at_asof: asofDate ? obsAtAsof : undefined,
      ok,
      note,
      checks: Object.keys(checks).length ? checks : undefined,
    };
  }

  // VAMS: SPY, GLD, BTC require ≥400 observations at as-of (TR_252 + vol_63).
  // SPY is also in CORE_SYMBOLS — merge VAMS check into the same row (do not skip SPY).
  for (const symbol of VAMS_SYMBOLS) {
    const symbolData = getDataForSymbol(marketData, symbol);
    const latestDate = getLatestDate(marketData, symbol);
    const provider = getProviderName(symbol, providerDiagnostics);

    let entry: CoreSymbolStatus;
    if (status[symbol]) {
      entry = status[symbol];
    } else {
      let ok = true;
      let note: string | undefined;
      if (providerDiagnostics) {
        const error = providerDiagnostics.errors[symbol];
        if (error) {
          note = error;
          ok = false;
        }
      }
      entry = {
        provider,
        last_date: latestDate ? latestDate.toISOString().split('T')[0] : null,
        obs: symbolData.length,
        ok,
        note,
      };
      if (providerDiagnostics?.proxies[symbol]) {
        proxies[symbol] = providerDiagnostics.proxies[symbol];
        entry.note = `Proxy used: ${providerDiagnostics.proxies[symbol]}${entry.note ? ` (${entry.note})` : ''}`;
      }
    }

    const obsAtAsof = asofDate ? obsAtOrBefore(marketData, symbol, asofDate) : symbolData.length;
    if (!entry.obs_at_asof && asofDate) {
      entry.obs_at_asof = obsAtAsof;
    }

    const vamsMet = asofDate ? obsAtAsof >= VAMS_MIN_OBSERVATIONS_AT_ASOF : symbolData.length >= VAMS_MIN_OBSERVATIONS_AT_ASOF;
    const vamsCheck: HistoryCheckDetail = {
      required: VAMS_MIN_OBSERVATIONS_AT_ASOF,
      met: vamsMet,
      have_at_asof: obsAtAsof,
    };
    if (!entry.checks) entry.checks = {};
    entry.checks.vams = vamsCheck;

    if (symbolData.length === 0) {
      entry.ok = false;
      if (!entry.note) entry.note = 'No data available';
      if (!missingSymbols.includes(symbol)) missingSymbols.push(symbol);
    } else if (asofDate && !vamsMet) {
      entry.ok = false;
      const windowNote = `VAMS needs ≥${VAMS_MIN_OBSERVATIONS_AT_ASOF} obs at as-of, have ${obsAtAsof}`;
      entry.note = entry.note ? `${entry.note}; ${windowNote}` : windowNote;
      if (!missingSymbols.includes(symbol)) missingSymbols.push(symbol);
    }

    status[symbol] = entry;
  }

  const missingDeduped = [...new Set(missingSymbols)].sort();
  return {
    allOk: missingDeduped.length === 0,
    missingSymbols: missingDeduped,
    status,
    proxies,
  };
}
