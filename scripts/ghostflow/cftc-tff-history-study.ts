/**
 * GhostFlow v1.0a — CFTC TFF historical basket calibration study (research only).
 *
 * Fetches weekly FutOnly rows from PRE/SODA, aligns MVP contracts, computes basket metrics.
 * Does NOT touch scoring, buildSnapshot, production artifacts, or UI.
 *
 * Usage:
 *   npm run ghostflow:cftc-tff-history-study
 *   npm run ghostflow:cftc-tff-history-study -- --since 2020-01-01
 *   npm run ghostflow:cftc-tff-history-study -- --out data/ghostflow/research/cftcTffBasketWeekly.v1.json
 *   npm run ghostflow:cftc-tff-history-study -- --include-vix
 *
 * Network required. No secrets.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MVP_SCORE_CONTRACT_CODES } from '@/lib/ghostflow/artifacts/systematicFlowProxy';
import {
  alignWeeklyBaskets,
  buildMappingComparison,
  CFTC_PRE_RESOURCE_URL,
  directionMix,
  filterMvpRows,
  isVixRow,
  percentileRank,
  summarizeDistribution,
  TFF_FUTURES_ONLY_DATASET_ID,
  topWeeksByNetPctOi,
  type CftcTffRawRow,
  type WeeklyAlignedBasket,
} from '@/lib/ghostflow/research/cftcTffHistory';

const PRE_BASE = 'https://publicreporting.cftc.gov';
const PAGE_SIZE = 50_000;

const SELECT_FIELDS = [
  'report_date_as_yyyy_mm_dd',
  'yyyy_report_week_ww',
  'contract_market_name',
  'cftc_contract_market_code',
  'open_interest_all',
  'lev_money_positions_long',
  'lev_money_positions_short',
  'lev_money_positions_spread',
  'change_in_lev_money_long',
  'change_in_lev_money_short',
  'change_in_lev_money_spread',
  'pct_of_oi_lev_money_long',
  'pct_of_oi_lev_money_short',
  'pct_of_oi_lev_money_spread',
].join(',');

function parseArgs(argv: string[]): {
  since?: string;
  out?: string;
  includeVix: boolean;
} {
  let since: string | undefined;
  let out: string | undefined;
  let includeVix = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--since' && argv[i + 1]) {
      since = argv[++i];
    } else if (a === '--out' && argv[i + 1]) {
      out = argv[++i];
    } else if (a === '--include-vix') {
      includeVix = true;
    }
  }
  return { since, out, includeVix };
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const res = await fetchWithTimeout(url, 120_000);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${label}: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

function buildHistoryUrl(codes: readonly string[], offset: number, since?: string): string {
  const codeList = codes.map((c) => `'${c}'`).join(',');
  let where = `cftc_contract_market_code in (${codeList}) AND futonly_or_combined = 'FutOnly'`;
  if (since) {
    where += ` AND report_date_as_yyyy_mm_dd >= '${since}'`;
  }
  const params = new URLSearchParams({
    $select: SELECT_FIELDS,
    $where: where,
    $order: 'report_date_as_yyyy_mm_dd ASC',
    $limit: String(PAGE_SIZE),
    $offset: String(offset),
  });
  return `${CFTC_PRE_RESOURCE_URL}?${params.toString()}`;
}

async function fetchAllRows(codes: readonly string[], since?: string): Promise<CftcTffRawRow[]> {
  const all: CftcTffRawRow[] = [];
  let offset = 0;
  for (;;) {
    const url = buildHistoryUrl(codes, offset, since);
    const page = await fetchJson<CftcTffRawRow[]>(url, `History offset ${offset}`);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

function printDistribution(label: string, values: number[]): void {
  const s = summarizeDistribution(values);
  console.log(
    `  ${label}: min ${s.min} | p25 ${s.p25} | median ${s.median} | p75 ${s.p75} | max ${s.max} | mean ${s.mean}`
  );
}

function printWeekLine(w: WeeklyAlignedBasket): void {
  const b = w.basket;
  console.log(
    `    ${w.reportDate} (${w.reportWeek}) | net ${b.basketNetPctOi}% OI | abs ${b.basketAbsNetPctOi}% | score ${b.basketScore} | ${b.basketDirection}`
  );
}

async function runCftcTffHistoryStudy(): Promise<void> {
  const { since, out, includeVix } = parseArgs(process.argv.slice(2));
  const codes = includeVix
    ? [...MVP_SCORE_CONTRACT_CODES, '1170E1']
    : [...MVP_SCORE_CONTRACT_CODES];

  console.log('GhostFlow v1.0a — CFTC TFF historical calibration study');
  console.log(`Dataset: TFF Futures Only (${TFF_FUTURES_ONLY_DATASET_ID})`);
  console.log(`Endpoint: ${CFTC_PRE_RESOURCE_URL}`);
  console.log(`MVP contracts: ${MVP_SCORE_CONTRACT_CODES.join(', ')}`);
  if (since) console.log(`Since filter: ${since}`);
  if (includeVix) console.log('VIX 1170E1: fetched for appendix only (not in basket score)');
  console.log('');

  const rows = await fetchAllRows(codes, since);
  const mvpRows = filterMvpRows(rows);
  console.log(`Rows fetched (all codes): ${rows.length}`);
  console.log(`Rows for MVP basket: ${mvpRows.length}`);
  console.log('');

  const alignment = alignWeeklyBaskets(mvpRows, { since });
  const { aligned, skippedWeeks, totalReportDatesSeen } = alignment;

  if (aligned.length === 0) {
    console.error('No aligned weeks — cannot produce calibration summary.');
    process.exitCode = 1;
    return;
  }

  const latest = aligned[aligned.length - 1]!;
  const absPctOi = aligned.map((w) => w.basket.basketAbsNetPctOi);
  const netPctOi = aligned.map((w) => w.basket.basketNetPctOi);
  const scores = aligned.map((w) => w.basket.basketScore);
  const sortedAbs = [...absPctOi].sort((a, b) => a - b);

  const currentAbsPct = latest.basket.basketAbsNetPctOi;
  const currentPctRank = percentileRank(sortedAbs, currentAbsPct);
  const currentSignedRank = percentileRank(
    [...netPctOi].sort((a, b) => a - b),
    latest.basket.basketNetPctOi
  );

  console.log('--- Alignment ---');
  console.log(`  Date range: ${aligned[0]!.reportDate} → ${latest.reportDate}`);
  console.log(`  Report dates seen (raw): ${totalReportDatesSeen}`);
  console.log(`  Aligned weeks (N): ${aligned.length}`);
  console.log(`  Skipped weeks: ${skippedWeeks.length}`);
  if (skippedWeeks.length > 0 && skippedWeeks.length <= 5) {
    for (const s of skippedWeeks) {
      console.log(`    skip ${s.reportDate}: missing ${s.missingCodes.join(', ')}`);
    }
  } else if (skippedWeeks.length > 5) {
    console.log(`    (first skip: ${skippedWeeks[0]!.reportDate} missing ${skippedWeeks[0]!.missingCodes.join(', ')})`);
  }
  console.log('');

  console.log('--- Latest week ---');
  printWeekLine(latest);
  console.log(`  Current |net % OI| percentile (history): ${currentPctRank}th`);
  console.log(`  Current signed net % OI percentile: ${currentSignedRank}th`);
  console.log('');

  console.log('--- Distributions ---');
  printDistribution('basketNetPctOi (signed %)', netPctOi);
  printDistribution('basketAbsNetPctOi (%)', absPctOi);
  printDistribution('basketScore (mapping A)', scores);
  console.log('');
  console.log('  Mapping A — % weeks at or above threshold:');
  console.log(`    >= 70: ${aligned.filter((w) => w.basket.basketScore >= 70).length} weeks (${((100 * aligned.filter((w) => w.basket.basketScore >= 70).length) / aligned.length).toFixed(1)}%)`);
  console.log(`    >= 80: ${aligned.filter((w) => w.basket.basketScore >= 80).length} weeks (${((100 * aligned.filter((w) => w.basket.basketScore >= 80).length) / aligned.length).toFixed(1)}%)`);
  console.log(`    >= 90: ${aligned.filter((w) => w.basket.basketScore >= 90).length} weeks (${((100 * aligned.filter((w) => w.basket.basketScore >= 90).length) / aligned.length).toFixed(1)}%)`);
  console.log('');

  const mix = directionMix(aligned.map((w) => w.basket.basketDirection));
  console.log('--- Direction mix ---');
  console.log(`  net_long: ${mix.net_long}% | net_short: ${mix.net_short}% | flat: ${mix.flat}%`);
  console.log('');

  console.log('--- Top 5 net-short weeks (lowest basketNetPctOi) ---');
  for (const w of topWeeksByNetPctOi(aligned, 'net_short', 5)) {
    printWeekLine(w);
  }
  console.log('');

  console.log('--- Top 5 net-long weeks (highest basketNetPctOi) ---');
  for (const w of topWeeksByNetPctOi(aligned, 'net_long', 5)) {
    printWeekLine(w);
  }
  console.log('');

  console.log('--- Mapping comparison (full history) ---');
  const mappingRows = buildMappingComparison(aligned, latest, 80);
  console.log(
    '  mapping | latest | %wk>=70 | %wk>=80 | %wk>=90 | median | p90'
  );
  for (const m of mappingRows) {
    console.log(
      `  ${m.mapping} | ${m.latestScore} | ${m.pctWeeksGte70}% | ${m.pctWeeksGte80}% | ${m.pctWeeksGte90}% | ${m.medianScore} | ${m.p90Score}`
    );
  }
  console.log('');

  console.log('--- Production artifact cross-check (2026-05-19) ---');
  console.log('  Expected: net -18.5% OI, abs 18.5%, score 93, net_short');
  const prodWeek = aligned.find((w) => w.reportDate === '2026-05-19');
  if (prodWeek) {
    printWeekLine(prodWeek);
  } else {
    console.log('  (2026-05-19 not in aligned series — check date range)');
  }
  console.log('');

  if (out) {
    const payload = {
      generatedAt: new Date().toISOString(),
      datasetId: TFF_FUTURES_ONLY_DATASET_ID,
      since: since ?? null,
      dateRange: { start: aligned[0]!.reportDate, end: latest.reportDate },
      alignedWeekCount: aligned.length,
      skippedWeekCount: skippedWeeks.length,
      weeks: aligned.map((w) => ({
        reportDate: w.reportDate,
        reportWeek: w.reportWeek,
        basket: w.basket,
      })),
      mappingComparison: mappingRows,
      currentWeekPercentileAbsOi: currentPctRank,
    };
    const path = resolve(process.cwd(), out);
    writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`Wrote research JSON: ${path}`);
  }

  console.log('Study complete. Populate docs/ghostflow/CFTC_TFF_CALIBRATION_STUDY.md from this output.');
}

runCftcTffHistoryStudy().catch((err) => {
  console.error('\n--- History study failed ---');
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

export {};
