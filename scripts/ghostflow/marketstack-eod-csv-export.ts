/**
 * GhostFlow operator helper — export Marketstack EOD close history to CSV.
 *
 * Requires MARKETSTACK_ACCESS_KEY and explicit --allow-marketstack (or --source marketstack).
 * Does NOT use GhostRegime ALLOW_MARKETSTACK_FALLBACK.
 * Does NOT write production artifacts or touch buildSnapshot/scoring.
 *
 * Usage:
 *   npm run ghostflow:marketstack-eod-csv-export -- --allow-marketstack --date-from 2003-01-01 --date-to 2026-07-01 --dry-run
 *   npm run ghostflow:marketstack-eod-csv-export -- --allow-marketstack --symbols SPY,RSP --date-from 2003-01-01 --date-to 2026-07-01
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import {
  CLOSE_ONLY_CAVEAT,
  buildDryRunPlan,
  buildProvenanceSidecar,
  fetchMarketstackEodPages,
  parseExportArgs,
  rowsToCsv,
} from '@/lib/ghostflow/research/marketstackEodExport';

export {};

function csvPathFor(outDir: string, symbol: string): string {
  return join(outDir, `${symbol}.csv`);
}

function metaPathFor(outDir: string, symbol: string): string {
  return join(outDir, `${symbol}.marketstack.meta.json`);
}

function printDryRun(plan: ReturnType<typeof buildDryRunPlan>): void {
  console.log('GhostFlow Marketstack EOD CSV export — DRY RUN');
  console.log('No API calls. No files written.');
  console.log('');
  console.log(`Symbols: ${plan.symbols.join(', ')}`);
  console.log(`Date range: ${plan.dateFrom} → ${plan.dateTo}`);
  console.log(`Output dir: ${plan.outDir}`);
  console.log('');
  console.log('Estimated Marketstack API calls:');
  console.log(`  Calendar days: ${plan.estimate.calendarDays}`);
  console.log(`  Est. trading days: ${plan.estimate.estimatedTradingDays}`);
  for (const sym of plan.symbols) {
    console.log(`  ${sym}: ~${plan.estimate.callsPerSymbol[sym]} call(s)`);
  }
  console.log(`  Total: ~${plan.estimate.totalCalls} call(s)`);
  console.log('');
  console.log('Planned outputs:');
  for (const sym of plan.symbols) {
    console.log(`  ${plan.csvPaths[sym]}`);
    console.log(`  ${plan.metaPaths[sym]}`);
  }
  console.log('');
  console.log(`Caveat: ${plan.caveat}`);
  console.log('');
  console.log('Next: run study with exported CSVs (Close column — study exit code may be 2):');
  console.log(
    `  npm run ghostflow:cap-weight-premium-study -- --spy-csv ${plan.csvPaths.SPY ?? '<SPY.csv>'} --rsp-csv ${plan.csvPaths.RSP ?? '<RSP.csv>'}`
  );
}

async function main(): Promise<void> {
  const args = parseExportArgs(process.argv.slice(2), GHOSTFLOW_REFERENCE_AS_OF);
  const outDir = resolve(args.outDir);

  if (!args.allowMarketstack) {
    console.error(
      'Marketstack export requires explicit opt-in: --allow-marketstack or --source marketstack'
    );
    console.error('GhostFlow does not use GhostRegime ALLOW_MARKETSTACK_FALLBACK.');
    process.exit(1);
  }

  const plan = buildDryRunPlan(args, (sym) => csvPathFor(outDir, sym), (sym) => metaPathFor(outDir, sym));

  if (args.dryRun) {
    printDryRun(plan);
    process.exit(0);
  }

  const accessKey = process.env.MARKETSTACK_ACCESS_KEY?.trim();
  if (!accessKey) {
    console.error('MARKETSTACK_ACCESS_KEY is not set.');
    process.exit(1);
  }

  console.log('GhostFlow Marketstack EOD CSV export');
  console.log(`Symbols: ${args.symbols.join(', ')}`);
  console.log(`Date range: ${args.dateFrom} → ${args.dateTo}`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Estimated API calls (pre-fetch): ~${plan.estimate.totalCalls}`);
  console.log(`Caveat: ${CLOSE_ONLY_CAVEAT}`);
  console.log('');

  mkdirSync(outDir, { recursive: true });

  let totalApiCalls = 0;
  const generatedAt = new Date().toISOString();

  for (const symbol of args.symbols) {
    console.log(`Fetching ${symbol}...`);
    const result = await fetchMarketstackEodPages(symbol, args.dateFrom, args.dateTo, accessKey);
    totalApiCalls += result.apiCalls;

    if (result.apiError) {
      console.error(`Failed ${symbol}: ${result.apiError}`);
      console.error(`API calls used before failure: ${totalApiCalls}`);
      process.exit(1);
    }

    if (result.rows.length === 0) {
      console.error(`No rows returned for ${symbol}`);
      console.error(`API calls used: ${totalApiCalls}`);
      process.exit(1);
    }

    const csvPath = csvPathFor(outDir, symbol);
    const metaPath = metaPathFor(outDir, symbol);
    writeFileSync(csvPath, rowsToCsv(result.rows), 'utf8');
    writeFileSync(
      metaPath,
      JSON.stringify(
        buildProvenanceSidecar({
          symbol,
          dateFrom: args.dateFrom,
          dateTo: args.dateTo,
          generatedAt,
          apiCalls: result.apiCalls,
          pagesFetched: result.pagesFetched,
          rowCount: result.rows.length,
          csvFileName: `${symbol}.csv`,
        }),
        null,
        2
      ) + '\n',
      'utf8'
    );

    const first = result.rows[0]!.date;
    const last = result.rows[result.rows.length - 1]!.date;
    console.log(
      `  Wrote ${csvPath} (${result.rows.length} rows, ${first} → ${last}, ${result.apiCalls} API call(s))`
    );
    console.log(`  Wrote ${metaPath}`);
  }

  console.log('');
  console.log(`Total Marketstack API calls: ${totalApiCalls}`);
  console.log('');
  console.log('Run cap-weight study (Close-only — not equivalent to Adj Close):');
  const spyCsv = args.symbols.includes('SPY') ? csvPathFor(outDir, 'SPY') : '<SPY.csv>';
  const rspCsv = args.symbols.includes('RSP') ? csvPathFor(outDir, 'RSP') : '<RSP.csv>';
  console.log(
    `  npm run ghostflow:cap-weight-premium-study -- --spy-csv ${spyCsv} --rsp-csv ${rspCsv}`
  );
  console.log('');
  console.log('Do not transcribe into production artifact without operator review.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
