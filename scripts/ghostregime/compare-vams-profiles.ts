/**
 * CLI: Compare production VAMS profile (SPY/GLD/BTC-USD) vs diagnostic profile (VT/GLDM/FBTC).
 *
 * Usage:
 *   tsx scripts/ghostregime/compare-vams-profiles.ts [--date YYYY-MM-DD] [--json]
 *
 * Requires network (Stooq). Deterministic given the same fetched data.
 */

import './_bootstrapDiagnostics';

import { parseISO, subDays } from 'date-fns';
import { defaultMarketDataProvider } from '../../lib/ghostregime/marketData';
import { MARKET_SYMBOLS } from '../../lib/ghostregime/config';
import {
  VAMS_PROFILE_PRODUCTION,
  VAMS_PROFILE_CLOSER_PARITY,
  compareVamsProfiles,
} from '../../lib/ghostregime/vamsProfiles';

/** Stooq-backed symbols for Level-2 compare (must exist in marketData STOOQ_SYMBOL_MAP). */
const COMPARE_SYMBOLS = [
  MARKET_SYMBOLS.SPY,
  MARKET_SYMBOLS.GLD,
  MARKET_SYMBOLS.BTC_USD,
  VAMS_PROFILE_CLOSER_PARITY.stocks,
  VAMS_PROFILE_CLOSER_PARITY.gold,
  VAMS_PROFILE_CLOSER_PARITY.btc,
] as const;

const LOOKBACK_CALENDAR_DAYS = 600;

function parseArgs(): { dateStr: string; json: boolean } {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const dateIdx = args.indexOf('--date');
  if (dateIdx !== -1 && dateIdx < args.length - 1) {
    return { dateStr: args[dateIdx + 1]!, json };
  }
  const y = new Date();
  y.setUTCDate(y.getUTCDate() - 1);
  const defaultStr = y.toISOString().slice(0, 10);
  return { dateStr: defaultStr, json };
}

function formatRow(
  label: string,
  prod: { symbol: string; score: number; state: number; scale: number },
  alt: { symbol: string; score: number; state: number; scale: number },
  div: { statesEqual: boolean; scoreDelta: number }
): string {
  const stateMatch = div.statesEqual ? 'yes' : 'no';
  return [
    label.padEnd(8),
    `${prod.symbol}`.padEnd(10),
    prod.score.toFixed(4).padStart(10),
    `${prod.state}`.padStart(4),
    `${prod.scale}`.padStart(5),
    ' | ',
    `${alt.symbol}`.padEnd(10),
    alt.score.toFixed(4).padStart(10),
    `${alt.state}`.padStart(4),
    `${alt.scale}`.padStart(5),
    ' | ',
    `Δscore ${div.scoreDelta >= 0 ? '+' : ''}${div.scoreDelta.toFixed(4)}`.padStart(16),
    ` same state: ${stateMatch}`,
  ].join('');
}

async function main() {
  const { dateStr, json } = parseArgs();

  let asofDate: Date;
  try {
    asofDate = parseISO(dateStr);
    if (Number.isNaN(asofDate.getTime())) {
      throw new Error('invalid');
    }
  } catch {
    console.error(`Error: invalid --date "${dateStr}". Use YYYY-MM-DD.`);
    process.exit(1);
  }

  const endDate = asofDate;
  const startDate = subDays(endDate, LOOKBACK_CALENDAR_DAYS);

  const marketData = await defaultMarketDataProvider.getHistoricalPrices(
    [...COMPARE_SYMBOLS],
    startDate,
    endDate
  );

  const diag = defaultMarketDataProvider.getDiagnostics();
  const missing: string[] = [];
  for (const sym of COMPARE_SYMBOLS) {
    const hasPoints = marketData.some((p) => p.symbol === sym);
    const err = diag.errors[sym];
    if (!hasPoints || err) {
      const hint =
        sym === 'VT'
          ? 'vt.us'
          : sym === 'GLDM'
            ? 'gldm.us'
            : sym === 'FBTC'
              ? 'fbtc.us'
              : 'see lib/ghostregime/marketData STOOQ_SYMBOL_MAP';
      missing.push(`${sym}: ${err || 'no rows'} (Stooq: ${hint})`);
    }
  }
  if (missing.length > 0) {
    console.error('Fetch/incomplete data for symbols:\n');
    missing.forEach((m) => console.error(`  - ${m}`));
    console.error(
      '\nEnsure VT→vt.us, GLDM→gldm.us, FBTC→fbtc.us are valid on Stooq for this range.'
    );
    process.exit(1);
  }

  const result = compareVamsProfiles(marketData, asofDate);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('\n=== VAMS profile compare (production vs closer-parity tickers) ===\n');
  console.log(`As-of date: ${dateStr}`);
  console.log(
    `Production: ${VAMS_PROFILE_PRODUCTION.stocks} / ${VAMS_PROFILE_PRODUCTION.gold} / ${VAMS_PROFILE_PRODUCTION.btc}`
  );
  console.log(
    `Closer (diagnostic): ${VAMS_PROFILE_CLOSER_PARITY.stocks} / ${VAMS_PROFILE_CLOSER_PARITY.gold} / ${VAMS_PROFILE_CLOSER_PARITY.btc}`
  );
  console.log('');
  console.log(
    'Sleeve    Prod sym   Prod score  St  Sc  |  Alt sym    Alt score  St  Sc  |  Divergence'
  );
  console.log(
    formatRow(
      'Stocks',
      result.production.stocks,
      result.closerParity.stocks,
      result.divergence.stocks
    )
  );
  console.log(
    formatRow('Gold', result.production.gold, result.closerParity.gold, result.divergence.gold)
  );
  console.log(
    formatRow('BTC', result.production.btc, result.closerParity.btc, result.divergence.btc)
  );
  console.log('');
  console.log(
    'St/Sc = VAMS state / scale. Diagnostic profile is not a guarantee of any external model.'
  );
  console.log('');
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
