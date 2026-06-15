/**
 * GhostFlow v1.9b.1 — SPY vs RSP cap-weight premium study (research only).
 *
 * Requires operator-provided CSVs. No live fetch. No score wiring.
 *
 * Usage:
 *   npm run ghostflow:cap-weight-premium-study -- --spy-csv path/to/spy.csv --rsp-csv path/to/rsp.csv
 *   npm run ghostflow:cap-weight-premium-study -- --spy-csv ... --rsp-csv ... --since 2010-01-01 --windows 21,63,252
 *   npm run ghostflow:cap-weight-premium-study -- --spy-csv ... --rsp-csv ... --out ./capWeightPremiumStudy.v1.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_SINCE,
  DEFAULT_WINDOWS,
  minAlignedRequired,
  parsePriceCsv,
  alignPriceSeries,
  summarizeCapWeightPremiumStudy,
  type CapWeightPremiumStudySummary,
  type PriceColumnUsed,
} from '@/lib/ghostflow/research/capWeightPremiumHistory';

export {};

function parseArgs(argv: string[]): {
  spyCsv?: string;
  rspCsv?: string;
  since: string;
  windows: number[];
  out?: string;
} {
  let spyCsv: string | undefined;
  let rspCsv: string | undefined;
  let since = DEFAULT_SINCE;
  let windows: number[] = [...DEFAULT_WINDOWS];
  let out: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--spy-csv' && argv[i + 1]) spyCsv = argv[++i];
    else if (a === '--rsp-csv' && argv[i + 1]) rspCsv = argv[++i];
    else if (a === '--since' && argv[i + 1]) since = argv[++i]!;
    else if (a === '--windows' && argv[i + 1]) {
      windows = argv[++i]!
        .split(',')
        .map((w) => Number(w.trim()))
        .filter((w) => Number.isFinite(w) && w > 0);
      if (windows.length === 0) windows = [...DEFAULT_WINDOWS];
    } else if (a === '--out' && argv[i + 1]) out = argv[++i];
  }

  return { spyCsv, rspCsv, since, windows, out };
}

function fmtPct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return `${n}%`;
}

function printParseInfo(
  spyPath: string,
  rspPath: string,
  spyParsed: ReturnType<typeof parsePriceCsv>,
  rspParsed: ReturnType<typeof parsePriceCsv>,
  since: string,
  windows: number[],
  skippedSpy: number,
  skippedRsp: number,
  alignedCount: number
): void {
  console.log('GhostFlow cap-weight premium study (v1.9b.1, research only)');
  console.log('NOT a production artifact. NOT scored. NOT causal proof.');
  console.log('');
  console.log(`SPY CSV: ${spyPath}`);
  console.log(`RSP CSV: ${rspPath}`);
  console.log(
    `SPY rows parsed: ${spyParsed.rows.length} (${spyParsed.rows[0]?.date} → ${spyParsed.rows[spyParsed.rows.length - 1]?.date})`
  );
  console.log(
    `RSP rows parsed: ${rspParsed.rows.length} (${rspParsed.rows[0]?.date} → ${rspParsed.rows[rspParsed.rows.length - 1]?.date})`
  );
  console.log(`SPY price column: ${spyParsed.priceColumnUsed}`);
  console.log(`RSP price column: ${rspParsed.priceColumnUsed}`);
  console.log(`SPY duplicates dropped: ${spyParsed.duplicatesDropped}; skipped: ${spyParsed.skippedRows}`);
  console.log(`RSP duplicates dropped: ${rspParsed.duplicatesDropped}; skipped: ${rspParsed.skippedRows}`);
  console.log(`Since filter: ${since}`);
  console.log(`Windows (trading days): ${windows.join(', ')}`);
  console.log(`SPY rows without RSP match: ${skippedSpy}`);
  console.log(`RSP rows without SPY match: ${skippedRsp}`);
  console.log(`Aligned observations: ${alignedCount}`);
  console.log('');
}

function printMetrics(summary: CapWeightPremiumStudySummary): void {
  console.log(`Overlap: ${summary.overlapStart} → ${summary.overlapEnd}`);
  console.log(`Latest date: ${summary.latestDate}`);
  console.log(`Latest SPY: ${summary.latestSpy}`);
  console.log(`Latest RSP: ${summary.latestRsp}`);
  console.log(`Latest SPY/RSP ratio: ${summary.latestRatio}`);
  console.log(`Ratio percentile vs history: ${summary.latestRatioPercentile}`);
  console.log('');
  console.log('Rolling cap-weight premium (SPY total return − RSP total return):');
  for (const w of summary.rollingWindows) {
    console.log(
      `  ${w.label} (${w.windowDays}d): spread ${fmtPct(w.totalReturnSpreadPct)}` +
        (w.annualizedSpreadPct != null ? ` · ann. ${fmtPct(w.annualizedSpreadPct)}` : '') +
        (w.latestSpreadPercentile != null ? ` · pctile ${w.latestSpreadPercentile}` : '')
    );
  }
  console.log('');
  console.log('Drawdown:');
  console.log(
    `  SPY max ${summary.spyDrawdown.maxDrawdownPct}% · current ${summary.spyDrawdown.currentDrawdownPct}%`
  );
  console.log(
    `  RSP max ${summary.rspDrawdown.maxDrawdownPct}% · current ${summary.rspDrawdown.currentDrawdownPct}%`
  );
  console.log(`  Divergence (SPY current DD − RSP current DD): ${summary.drawdownDivergencePct}%`);
  console.log('');
  if (summary.warnings.length > 0) {
    console.log('Warnings:');
    for (const w of summary.warnings) console.log(`  - ${w}`);
    console.log('');
  }
  console.log('Caveats:');
  console.log('  - SPY/RSP is a proxy; not proof passive flows caused outperformance.');
  console.log('  - Adj Close / total-return discipline matters; Close-only may bias spreads.');
  console.log('  - RSP equal-weight rebalance and ETF fees add noise.');
  console.log('  - Companion to concentration card; not a replacement; display-only by default.');
}

function resolveExitCode(
  summary: CapWeightPremiumStudySummary,
  windows: number[],
  alignedCount: number
): number {
  const minRequired = minAlignedRequired(windows);
  if (alignedCount < minRequired) return 1;

  const closeOnly =
    summary.priceColumnUsed.spy === 'close' || summary.priceColumnUsed.rsp === 'close';
  if (closeOnly) return 2;

  const missingWindow = summary.rollingWindows.some((w) => w.totalReturnSpreadPct == null);
  if (missingWindow) return 2;

  return 0;
}

function main(): void {
  const { spyCsv, rspCsv, since, windows, out } = parseArgs(process.argv.slice(2));

  if (!spyCsv || !rspCsv) {
    console.error('Required: --spy-csv <path> and --rsp-csv <path>');
    process.exit(1);
  }

  const spyPath = resolve(spyCsv);
  const rspPath = resolve(rspCsv);

  let spyParsed;
  let rspParsed;
  try {
    spyParsed = parsePriceCsv(readFileSync(spyPath, 'utf8'), 'SPY');
    rspParsed = parsePriceCsv(readFileSync(rspPath, 'utf8'), 'RSP');
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const { aligned, skippedSpy, skippedRsp } = alignPriceSeries(
    spyParsed.rows,
    rspParsed.rows,
    since
  );

  const minRequired = minAlignedRequired(windows);
  if (aligned.length < minRequired) {
    console.error(
      `Insufficient aligned rows (${aligned.length}); need at least ${minRequired} for requested windows.`
    );
    process.exit(1);
  }

  printParseInfo(
    spyPath,
    rspPath,
    spyParsed,
    rspParsed,
    since,
    windows,
    skippedSpy,
    skippedRsp,
    aligned.length
  );

  const summary = summarizeCapWeightPremiumStudy({
    aligned,
    windows,
    spyCsvPath: spyPath,
    rspCsvPath: rspPath,
    spyPriceColumn: spyParsed.priceColumnUsed as PriceColumnUsed,
    rspPriceColumn: rspParsed.priceColumnUsed as PriceColumnUsed,
  });

  printMetrics(summary);

  if (out) {
    const outPath = resolve(out);
    writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    console.log('');
    console.log(`Wrote research JSON: ${outPath}`);
  }

  const code = resolveExitCode(summary, windows, aligned.length);
  process.exit(code);
}

main();
