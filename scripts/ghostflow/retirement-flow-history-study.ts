/**
 * GhostFlow v1.2e-calibration — ICI Table 1 quarterly retirement asset history study (research only).
 *
 * Requires operator-provided ICI `.xls` (Table 1). No live fetch. No score wiring.
 *
 * Usage:
 *   npm run ghostflow:retirement-flow-history-study -- --xls path/to/ret_25_q4_data.xls
 *   npm run ghostflow:retirement-flow-history-study -- --xls path/to/file.xls --since 2007:Q1
 *   npm run ghostflow:retirement-flow-history-study -- --xls path/to/file.xls --out data/ghostflow/research/retirementFlowQuarterly.v1.json
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ARTIFACT_Q4_2025,
  buildQuarterlySeries,
  buildRetirementMappingComparison,
  buildRetirementScoreImpactPreview,
  CURRENT_QUARTER_LABEL,
  DEFAULT_SINCE_QUARTER,
  distributionOfGrowth,
  findLatestQuarter,
  loadTable1RowsFromXls,
  MOCK_RETIREMENT_SCORE,
} from '@/lib/ghostflow/research/retirementFlowHistory';
import { percentileRank as distPercentileRank } from '@/lib/ghostflow/research/distribution';

export {};

function parseArgs(argv: string[]): { xls?: string; since: string; out?: string } {
  let xls: string | undefined;
  let since = DEFAULT_SINCE_QUARTER;
  let out: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--xls' && argv[i + 1]) xls = argv[++i];
    else if (a === '--since' && argv[i + 1]) since = argv[++i]!;
    else if (a === '--out' && argv[i + 1]) out = argv[++i];
  }

  return { xls, since, out };
}

function fmtPct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  return `${Math.round(n * 10) / 10}%`;
}

function fmtTrillions(billions: number): string {
  return `${Math.round((billions / 1000) * 10) / 10}T`;
}

function main(): void {
  const { xls, since, out } = parseArgs(process.argv.slice(2));

  if (!xls) {
    console.error('Required: --xls <path-to-ici-table1.xls>');
    process.exit(1);
  }

  const workbookPath = resolve(xls);
  console.log('GhostFlow retirement-flow history study (v1.2e-calibration, research only)');
  console.log(`Workbook: ${workbookPath}`);
  console.log(`Since: ${since}`);
  console.log('');

  let rows;
  try {
    rows = loadTable1RowsFromXls(workbookPath);
  } catch (err) {
    console.error('Failed to parse ICI Table 1 from XLS (xlrd/python required):');
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const parsed = buildQuarterlySeries(rows, since);
  const { quarterly, skippedRows, allRowsRead } = parsed;

  if (quarterly.length < 4) {
    console.error(`Insufficient quarterly observations (${quarterly.length}); cannot calibrate.`);
    process.exit(1);
  }

  const latest = findLatestQuarter(quarterly, CURRENT_QUARTER_LABEL);
  if (!latest) {
    console.error(`Latest quarter ${CURRENT_QUARTER_LABEL} not found in series.`);
    process.exit(1);
  }

  const first = quarterly[0]!;
  const last = quarterly[quarterly.length - 1]!;

  const qoqDist = distributionOfGrowth(quarterly, 'qoqTotalGrowthPct');
  const yoyDist = distributionOfGrowth(quarterly, 'yoyTotalGrowthPct');

  const qoqHist = quarterly
    .map((q) => q.qoqTotalGrowthPct)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const yoyHist = quarterly
    .map((q) => q.yoyTotalGrowthPct)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);

  const latestQoQ = latest.qoqTotalGrowthPct ?? 0;
  const latestYoY = latest.yoyTotalGrowthPct ?? 0;
  const qoqPctile = distPercentileRank(qoqHist, latestQoQ);
  const yoyPctile = distPercentileRank(yoyHist, latestYoY);

  const mapping = buildRetirementMappingComparison(quarterly, latest);
  const scorePreview = buildRetirementScoreImpactPreview(mapping);

  console.log(`Date/quarter range: ${first.period} → ${last.period}`);
  console.log(`N quarterly observations (since ${since}): ${quarterly.length}`);
  console.log(`Table 1 rows read: ${allRowsRead}`);
  console.log(`Skipped / excluded periods: ${skippedRows.length}`);
  if (skippedRows.length > 0 && skippedRows.length <= 20) {
    console.log(`  ${skippedRows.join(', ')}`);
  } else if (skippedRows.length > 20) {
    console.log(`  (first 10) ${skippedRows.slice(0, 10).join(', ')} …`);
  }
  console.log('');

  console.log(`Current quarter: ${latest.period}`);
  console.log(`  Total retirement assets: ${fmtTrillions(latest.totalBillions)} (${Math.round(latest.totalBillions)}B)`);
  console.log(`  IRA: ${fmtTrillions(latest.iraBillions)} (${latest.iraSharePct.toFixed(1)}% of total)`);
  console.log(`  DC plans: ${fmtTrillions(latest.dcBillions)} (${latest.dcSharePct.toFixed(1)}% of total)`);
  console.log(`  QoQ total asset growth: ${fmtPct(latest.qoqTotalGrowthPct)}`);
  console.log(`  YoY total asset growth: ${fmtPct(latest.yoyTotalGrowthPct)}`);
  console.log('');

  console.log('Production artifact cross-check (Q4 2025):');
  console.log(
    `  Artifact QoQ/YoY ${ARTIFACT_Q4_2025.qoqPct}% / ${ARTIFACT_Q4_2025.yoyPct}% vs study ${fmtPct(latest.qoqTotalGrowthPct)} / ${fmtPct(latest.yoyTotalGrowthPct)}`
  );
  console.log('');

  console.log('QoQ growth distribution (%):');
  console.log(
    `  min ${qoqDist.min} | p25 ${qoqDist.p25} | median ${qoqDist.median} | p75 ${qoqDist.p75} | max ${qoqDist.max} | mean ${qoqDist.mean}`
  );
  console.log(`  Current QoQ percentile (since ${since}): ${qoqPctile}`);
  console.log('');

  console.log('YoY growth distribution (%):');
  console.log(
    `  min ${yoyDist.min} | p25 ${yoyDist.p25} | median ${yoyDist.median} | p75 ${yoyDist.p75} | max ${yoyDist.max} | mean ${yoyDist.mean}`
  );
  console.log(`  Current YoY percentile (since ${since}): ${yoyPctile}`);
  console.log('');

  console.log('Candidate mapping comparison (latest quarter scores):');
  for (const m of mapping) {
    console.log(
      `  ${m.mapping}: latest R=${m.latestScore} | ≥70: ${m.pctQuartersGte70}% | ≥80: ${m.pctQuartersGte80}% | median ${m.medianScore} | p90 ${m.p90Score}`
    );
  }
  console.log('');

  console.log(`Score-impact preview vs MOCK R=${MOCK_RETIREMENT_SCORE} (passive weight 0.20 on retirement):`);
  for (const row of scorePreview) {
    console.log(
      `  ${row.label}: passive ${row.passivePressure} | composite ${row.composite} (${row.bandLabel})`
    );
  }
  console.log('');

  console.log(
    'Caveat: ICI Table 1 tracks quarterly structural retirement market assets (levels), not payroll contribution flow or live retirement-flow telemetry. Market returns dominate asset growth; release is lagged; overlaps other ICI artifacts.'
  );

  if (out) {
    const outPath = resolve(out);
    writeFileSync(
      outPath,
      JSON.stringify(
        {
          workbookPath,
          since,
          quarterly,
          latest,
          qoqDist,
          yoyDist,
          qoqPctile,
          yoyPctile,
          mapping,
          scorePreview,
        },
        null,
        2
      ),
      'utf8'
    );
    console.log(`Wrote ${outPath}`);
  }
}

main();
