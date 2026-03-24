/**
 * VAMS profile drift study: production (SPY/GLD/BTC-USD) vs closer-parity (VT/GLDM/FBTC)
 * over a date range. Network required (Stooq). Does not change production behavior.
 *
 * Usage:
 *   tsx scripts/ghostregime/vams-profile-drift-study.ts [--months 12] [--end YYYY-MM-DD]
 *   [--csv path/to/out.csv] [--json] [--spot YYYY-MM-DD,YYYY-MM-DD]
 *
 * Defaults: --months 12, --end yesterday UTC. Fallback: use --months 6 if fetch fails (retry manually).
 */

import './_bootstrapDiagnostics';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseISO, subDays, subMonths } from 'date-fns';
import { getDataForSymbol } from '../../lib/ghostregime/dataWindows';
import { defaultMarketDataProvider } from '../../lib/ghostregime/marketData';
import { MARKET_SYMBOLS } from '../../lib/ghostregime/config';
import {
  VAMS_PROFILE_CLOSER_PARITY,
  VAMS_PROFILE_PRODUCTION,
  compareVamsProfiles,
} from '../../lib/ghostregime/vamsProfiles';
import type { VamsState } from '../../lib/ghostregime/types';

const COMPARE_SYMBOLS = [
  MARKET_SYMBOLS.SPY,
  MARKET_SYMBOLS.GLD,
  MARKET_SYMBOLS.BTC_USD,
  VAMS_PROFILE_CLOSER_PARITY.stocks,
  VAMS_PROFILE_CLOSER_PARITY.gold,
  VAMS_PROFILE_CLOSER_PARITY.btc,
] as const;

/** Calendar lookback before range end so earliest as-of still has TR_252 history */
const LOOKBACK_BUFFER_DAYS = 650;

type SleeveKey = 'stocks' | 'gold' | 'btc';

function stateGap(a: VamsState, b: VamsState): 0 | 2 | 4 {
  const g = Math.abs(a - b);
  if (g === 0) return 0;
  if (g === 2) return 2;
  return 4;
}

function parseArgs(): {
  months: number;
  endStr: string;
  csvPath: string | null;
  jsonOnly: boolean;
  spots: string[];
} {
  const argv = process.argv.slice(2);
  const jsonOnly = argv.includes('--json');
  let months = 12;
  const mi = argv.indexOf('--months');
  if (mi !== -1 && argv[mi + 1]) {
    months = Math.max(1, parseInt(argv[mi + 1]!, 10) || 12);
  }
  let endStr = '';
  const ei = argv.indexOf('--end');
  if (ei !== -1 && argv[ei + 1]) {
    endStr = argv[ei + 1]!;
  } else {
    const y = new Date();
    y.setUTCDate(y.getUTCDate() - 1);
    endStr = y.toISOString().slice(0, 10);
  }
  let csvPath: string | null = null;
  const ci = argv.indexOf('--csv');
  if (ci !== -1 && argv[ci + 1]) {
    csvPath = argv[ci + 1]!;
  }
  let spots: string[] = [];
  const si = argv.indexOf('--spot');
  if (si !== -1 && argv[si + 1]) {
    spots = argv[si + 1]!.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return { months, endStr, csvPath, jsonOnly, spots };
}

function loadOptionalRegimeMap(): Map<string, string> {
  const m = new Map<string, string>();
  const p = path.join(
    process.cwd(),
    'data',
    'ghostregime',
    'seed',
    'ghostregime_replay_history.csv'
  );
  if (!fs.existsSync(p)) return m;
  const text = fs.readFileSync(p, 'utf8');
  const lines = text.trim().split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const comma = line.indexOf(',');
    if (comma === -1) continue;
    const date = line.slice(0, comma);
    const rest = line.slice(comma + 1);
    const comma2 = rest.indexOf(',');
    const regime = comma2 === -1 ? rest : rest.slice(0, comma2);
    if (date && regime) m.set(date, regime);
  }
  return m;
}

/** US/Eastern calendar date — aligns Stooq daily rows with human "trading day" labels (avoids UTC off-by-one). */
function ymdNy(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

async function main() {
  const { months, endStr, csvPath, jsonOnly, spots } = parseArgs();

  let endDate: Date;
  try {
    endDate = parseISO(endStr);
    if (Number.isNaN(endDate.getTime())) throw new Error('bad');
  } catch {
    console.error(`Invalid --end "${endStr}"`);
    process.exit(1);
  }

  const rangeStart = subMonths(endDate, months);
  const fetchStart = subDays(endDate, LOOKBACK_BUFFER_DAYS);
  const endKey = ymdNy(endDate);
  const startKey = ymdNy(rangeStart);

  const marketData = await defaultMarketDataProvider.getHistoricalPrices(
    [...COMPARE_SYMBOLS],
    fetchStart,
    endDate
  );

  const diag = defaultMarketDataProvider.getDiagnostics();
  const missing: string[] = [];
  for (const sym of COMPARE_SYMBOLS) {
    const hasPoints = marketData.some((p) => p.symbol === sym);
    const err = diag.errors[sym];
    if (!hasPoints || err) {
      missing.push(`${sym}: ${err || 'no rows'}`);
    }
  }
  if (missing.length > 0) {
    console.error('Missing/incomplete symbol data:\n');
    missing.forEach((x) => console.error(`  - ${x}`));
    process.exit(1);
  }

  const spySeries = getDataForSymbol(marketData, MARKET_SYMBOLS.SPY).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const datesInWindow = spySeries
    .map((p) => p.date)
    .filter((d) => {
      const k = ymdNy(d);
      return k >= startKey && k <= endKey;
    });

  const regimeMap = loadOptionalRegimeMap();

  type Row = {
    date: string;
    regime: string | null;
    stocks_p: VamsState;
    stocks_c: VamsState;
    gold_p: VamsState;
    gold_c: VamsState;
    btc_p: VamsState;
    btc_c: VamsState;
    stocks_gap: 0 | 2 | 4;
    gold_gap: 0 | 2 | 4;
    btc_gap: 0 | 2 | 4;
    stocks_sp: number;
    stocks_sc: number;
    gold_sp: number;
    gold_sc: number;
    btc_sp: number;
    btc_sc: number;
  };

  const rows: Row[] = [];

  const sleeveStats: Record<
    SleeveKey,
    { match: number; mild: number; extreme: number; total: number }
  > = {
    stocks: { match: 0, mild: 0, extreme: 0, total: 0 },
    gold: { match: 0, mild: 0, extreme: 0, total: 0 },
    btc: { match: 0, mild: 0, extreme: 0, total: 0 },
  };

  const regimeBuckets: Record<
    string,
    { days: number; stocksMismatch: number; goldMismatch: number; btcMismatch: number }
  > = {};

  let allThreeMatch = 0;

  for (const asof of datesInWindow) {
    const cmp = compareVamsProfiles(marketData, asof);
    const ds = cmp.production.stocks.state;
    const cs = cmp.closerParity.stocks.state;
    const dg = cmp.production.gold.state;
    const cg = cmp.closerParity.gold.state;
    const db = cmp.production.btc.state;
    const cb = cmp.closerParity.btc.state;

    const gs = stateGap(ds, cs);
    const gg = stateGap(dg, cg);
    const gb = stateGap(db, cb);

    const dateStr = ymdNy(asof);
    const regime = regimeMap.get(dateStr) ?? null;

    const row: Row = {
      date: dateStr,
      regime,
      stocks_p: ds,
      stocks_c: cs,
      gold_p: dg,
      gold_c: cg,
      btc_p: db,
      btc_c: cb,
      stocks_gap: gs,
      gold_gap: gg,
      btc_gap: gb,
      stocks_sp: cmp.production.stocks.score,
      stocks_sc: cmp.closerParity.stocks.score,
      gold_sp: cmp.production.gold.score,
      gold_sc: cmp.closerParity.gold.score,
      btc_sp: cmp.production.btc.score,
      btc_sc: cmp.closerParity.btc.score,
    };
    rows.push(row);

    const sleeves: { key: SleeveKey; gap: 0 | 2 | 4 }[] = [
      { key: 'stocks', gap: gs },
      { key: 'gold', gap: gg },
      { key: 'btc', gap: gb },
    ];
    for (const { key, gap } of sleeves) {
      sleeveStats[key].total++;
      if (gap === 0) sleeveStats[key].match++;
      else if (gap === 2) sleeveStats[key].mild++;
      else sleeveStats[key].extreme++;
    }

    if (gs === 0 && gg === 0 && gb === 0) allThreeMatch++;

    const rKey = regime ?? 'UNKNOWN';
    if (!regimeBuckets[rKey]) {
      regimeBuckets[rKey] = { days: 0, stocksMismatch: 0, goldMismatch: 0, btcMismatch: 0 };
    }
    regimeBuckets[rKey].days++;
    if (gs !== 0) regimeBuckets[rKey].stocksMismatch++;
    if (gg !== 0) regimeBuckets[rKey].goldMismatch++;
    if (gb !== 0) regimeBuckets[rKey].btcMismatch++;
  }

  const n = rows.length;
  const pct = (x: number) => (n === 0 ? 0 : (100 * x) / n);

  const summary = {
    window: {
      months,
      rangeStart: startKey,
      rangeEnd: endKey,
      tradingDaysAnalyzed: n,
    },
    productionProfile: { ...VAMS_PROFILE_PRODUCTION },
    closerParityProfile: { ...VAMS_PROFILE_CLOSER_PARITY },
    regimeMapRows: regimeMap.size,
    sleeves: {
      stocks: {
        matchPct: pct(sleeveStats.stocks.match),
        mildMismatchPct: pct(sleeveStats.stocks.mild),
        extremeMismatchPct: pct(sleeveStats.stocks.extreme),
        mildMismatchCount: sleeveStats.stocks.mild,
        extremeMismatchCount: sleeveStats.stocks.extreme,
      },
      gold: {
        matchPct: pct(sleeveStats.gold.match),
        mildMismatchPct: pct(sleeveStats.gold.mild),
        extremeMismatchPct: pct(sleeveStats.gold.extreme),
        mildMismatchCount: sleeveStats.gold.mild,
        extremeMismatchCount: sleeveStats.gold.extreme,
      },
      btc: {
        matchPct: pct(sleeveStats.btc.match),
        mildMismatchPct: pct(sleeveStats.btc.mild),
        extremeMismatchPct: pct(sleeveStats.btc.extreme),
        mildMismatchCount: sleeveStats.btc.mild,
        extremeMismatchCount: sleeveStats.btc.extreme,
      },
    },
    allThreeSleevesMatchPct: pct(allThreeMatch),
    byRegime: Object.fromEntries(
      Object.entries(regimeBuckets).map(([k, v]) => [
        k,
        {
          days: v.days,
          stocksMismatchRate: v.days ? v.stocksMismatch / v.days : 0,
          goldMismatchRate: v.days ? v.goldMismatch / v.days : 0,
          btcMismatchRate: v.days ? v.btcMismatch / v.days : 0,
        },
      ])
    ),
    note:
      'Mild = adjacent state (-2 vs 0 or 0 vs +2). Extreme = bull vs bear. Regime column uses seed CSV when date overlaps; otherwise UNKNOWN.',
  };

  if (csvPath) {
    const header = [
      'date',
      'regime',
      'stocks_prod_state',
      'stocks_closer_state',
      'stocks_gap',
      'gold_prod_state',
      'gold_closer_state',
      'gold_gap',
      'btc_prod_state',
      'btc_closer_state',
      'btc_gap',
      'stocks_prod_score',
      'stocks_closer_score',
      'gold_prod_score',
      'gold_closer_score',
      'btc_prod_score',
      'btc_closer_score',
    ].join(',');
    const lines = rows.map((r) =>
      [
        r.date,
        r.regime ?? '',
        r.stocks_p,
        r.stocks_c,
        r.stocks_gap,
        r.gold_p,
        r.gold_c,
        r.gold_gap,
        r.btc_p,
        r.btc_c,
        r.btc_gap,
        r.stocks_sp.toFixed(6),
        r.stocks_sc.toFixed(6),
        r.gold_sp.toFixed(6),
        r.gold_sc.toFixed(6),
        r.btc_sp.toFixed(6),
        r.btc_sc.toFixed(6),
      ].join(',')
    );
    fs.writeFileSync(csvPath, [header, ...lines].join('\n') + '\n', 'utf8');
  }

  if (jsonOnly) {
    console.log(JSON.stringify({ summary, rows }, null, 2));
    return;
  }

  console.log('\n=== VAMS profile drift study (production vs closer-parity) ===\n');
  console.log(`Window: ${summary.window.rangeStart} .. ${summary.window.rangeEnd} (${months} mo), SPY trading days: ${n}`);
  console.log(`Production: ${VAMS_PROFILE_PRODUCTION.stocks} / ${VAMS_PROFILE_PRODUCTION.gold} / ${VAMS_PROFILE_PRODUCTION.btc}`);
  console.log(`Closer:     ${VAMS_PROFILE_CLOSER_PARITY.stocks} / ${VAMS_PROFILE_CLOSER_PARITY.gold} / ${VAMS_PROFILE_CLOSER_PARITY.btc}`);
  console.log(`Regime join: ${regimeMap.size} rows in seed CSV (UNKNOWN if date not in file)\n`);

  console.log('Per-sleeve state agreement (prod vs closer, same VAMS math):');
  for (const k of ['stocks', 'gold', 'btc'] as const) {
    const s = summary.sleeves[k];
    console.log(
      `  ${k.padEnd(6)} match ${s.matchPct.toFixed(1)}% | mild Δ ${s.mildMismatchPct.toFixed(1)}% | extreme Δ ${s.extremeMismatchPct.toFixed(1)}%`
    );
  }
  console.log(`\nAll three sleeves match: ${summary.allThreeSleevesMatchPct.toFixed(1)}% of days\n`);

  console.log('Drift by regime (seed CSV only; UNKNOWN = no row):');
  for (const [reg, v] of Object.entries(summary.byRegime).sort((a, b) => b[1].days - a[1].days)) {
    console.log(
      `  ${reg.padEnd(12)} n=${String(v.days).padStart(4)}  stockMis=${(100 * v.stocksMismatchRate).toFixed(1)}%  goldMis=${(100 * v.goldMismatchRate).toFixed(1)}%  btcMis=${(100 * v.btcMismatchRate).toFixed(1)}%`
    );
  }

  if (spots.length > 0) {
    console.log('\n--- Spot dates ---\n');
    const byDate = new Map(rows.map((r) => [r.date, r]));
    for (const spot of spots) {
      let d = byDate.get(spot);
      let note = '';
      if (!d) {
        const asof = parseISO(spot);
        if (Number.isNaN(asof.getTime())) {
          console.log(`${spot}: invalid date\n`);
          continue;
        }
        const cmp = compareVamsProfiles(marketData, asof);
        const ds = cmp.production.stocks.state;
        const cs = cmp.closerParity.stocks.state;
        const dg = cmp.production.gold.state;
        const cg = cmp.closerParity.gold.state;
        const db = cmp.production.btc.state;
        const cb = cmp.closerParity.btc.state;
        d = {
          date: spot,
          regime: regimeMap.get(spot) ?? null,
          stocks_p: ds,
          stocks_c: cs,
          gold_p: dg,
          gold_c: cg,
          btc_p: db,
          btc_c: cb,
          stocks_gap: stateGap(ds, cs),
          gold_gap: stateGap(dg, cg),
          btc_gap: stateGap(db, cb),
          stocks_sp: cmp.production.stocks.score,
          stocks_sc: cmp.closerParity.stocks.score,
          gold_sp: cmp.production.gold.score,
          gold_sc: cmp.closerParity.gold.score,
          btc_sp: cmp.production.btc.score,
          btc_sc: cmp.closerParity.btc.score,
        };
        note =
          ' (as-of calendar date; VAMS uses last available prices ≤ this date — same as compare-vams-profiles)\n';
      }
      console.log(`${d.date} regime=${d.regime ?? 'n/a'}${note}`);
      console.log(
        `  stocks  prod ${d.stocks_p} (${d.stocks_sp.toFixed(4)})  closer ${d.stocks_c} (${d.stocks_sc.toFixed(4)})  gap=${d.stocks_gap}`
      );
      console.log(
        `  gold    prod ${d.gold_p} (${d.gold_sp.toFixed(4)})  closer ${d.gold_c} (${d.gold_sc.toFixed(4)})  gap=${d.gold_gap}`
      );
      console.log(
        `  btc     prod ${d.btc_p} (${d.btc_sp.toFixed(4)})  closer ${d.btc_c} (${d.btc_sc.toFixed(4)})  gap=${d.btc_gap}`
      );
      console.log('');
    }
  }

  console.log('\n--- Interpretation ---');
  console.log(
    'This compares two symbol sets under identical GhostRegime VAMS rules; it does not observe 42-published sleeve labels.'
  );
  if (csvPath) console.log(`Wrote ${csvPath}`);
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
