/**
 * R7C private result writer. Called only after all integrity checks pass
 * (or to persist an INVALID receipt with no performance tables).
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  END_PLUS_3M_STATUS,
  RESULT_DIR_PREFIX,
  RESULT_PARENT_DIR,
  R7C_STUDY_NAME,
  STATIC_MONTHLY_LABEL,
} from './r7c-run-plan';
import { CANDIDATE_IDS, HOLDOUT_CALENDAR_END, HOLDOUT_CALENDAR_START } from './study-contract';
import {
  DELTA_SIGN_NOTE,
  deltaVsP0,
  expandingCheckpoints,
  metricAtEndpoint,
  type IntegrityCheck,
  type MetricBundle,
  type ScenarioResult,
} from './study-engine';
import type { DateKey } from './types';

export const RESULT_FILES = [
  'RUN_RECEIPT.json',
  'SUMMARY.md',
  'PRIMARY_FULL.csv',
  'PRIMARY_HOLDOUT.csv',
  'PRIMARY_DEVELOPMENT.csv',
  'BENCHMARKS.csv',
  'ABLATIONS.csv',
  'COST_SENSITIVITIES.csv',
  'STATIC_REBALANCE_SENSITIVITY.csv',
  'ZERO_CASH_ZERO_RF.csv',
  'NO_BTC_TO_CASH.csv',
  'BTC_ATTRIBUTION.csv',
  'YEARLY_RESULTS.csv',
  'EXPANDING_ENDPOINT_STABILITY.csv',
  'ENDPOINT_SENSITIVITY.csv',
  'REGIME_CONDITIONED.csv',
  'EQUITY_SUMMARY.json',
  'HASHES.sha256',
] as const;

export function sha256Text(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function existingR7cResultDirs(repoRoot: string): string[] {
  const parent = join(repoRoot, RESULT_PARENT_DIR);
  if (!existsSync(parent)) return [];
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(RESULT_DIR_PREFIX))
    .map((entry) => join(parent, entry.name));
}

export function createResultDir(repoRoot: string, utcStamp: string): string {
  const dir = join(repoRoot, RESULT_PARENT_DIR, `${RESULT_DIR_PREFIX}${utcStamp}`);
  if (existsSync(dir)) {
    throw new Error(`RESULT_DIR_EXISTS: ${dir}`);
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function metricRow(id: string, extra: Record<string, unknown>, bundle: MetricBundle): Record<string, unknown> {
  return {
    id,
    window: bundle.label,
    start_date: bundle.startDate,
    end_date: bundle.endDate,
    final_nav: bundle.finalNav,
    cagr: bundle.cagr,
    vol: bundle.vol,
    sharpe: bundle.sharpe,
    sortino: bundle.sortino,
    max_drawdown: bundle.maxDrawdown,
    calmar: bundle.calmar,
    tuw_maxdd_calendar_days: bundle.tuwMaxDdCalendarDays,
    tuw_longest_calendar_days: bundle.tuwLongestCalendarDays,
    worst_complete_calendar_year: bundle.worstCompleteCalendarYear,
    worst_complete_calendar_year_return: bundle.worstCompleteCalendarYearReturn,
    cumulative_gross_two_sided: bundle.cumulativeGrossTwoSided,
    cumulative_one_way_turnover: bundle.cumulativeOneWayTurnover,
    rebalance_count_ex_inception: bundle.rebalanceCountExInception,
    allocation_change_count: bundle.allocationChangeCount,
    avg_spy: bundle.avgSpy,
    avg_gld: bundle.avgGld,
    avg_btc: bundle.avgBtc,
    avg_bil: bundle.avgBil,
    ...extra,
  };
}

function fmt(value: number | null | undefined, digits = 4): string {
  if (value == null || Number.isNaN(value)) return 'n/a';
  return value.toFixed(digits);
}

function fmtPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'n/a';
  return `${(value * 100).toFixed(2)}%`;
}

export function orderedPrimary(results: ScenarioResult[]): ScenarioResult[] {
  return CANDIDATE_IDS.map((id) => results.find((r) => r.scenario.family === 'primary' && r.scenario.candidateId === id)).filter(
    (row): row is ScenarioResult => row != null
  );
}

export function buildResultFiles(args: {
  results: ScenarioResult[];
  sessions: DateKey[];
  s0: DateKey;
  s1: DateKey;
  s2: DateKey;
  finalDate: DateKey;
  developmentLast: DateKey;
  holdoutFirst: DateKey;
  endMinus3m: DateKey;
}): Record<string, string> {
  const primary = orderedPrimary(args.results);
  const p0 = primary.find((r) => r.scenario.candidateId === 'P0_CURRENT');
  if (!p0) throw new Error('MISSING_P0_PRIMARY');

  const benches = args.results.filter((r) => r.scenario.family === 'benchmark');
  const ablations = args.results.filter((r) => r.scenario.family === 'ablation');
  const costs = args.results.filter((r) => r.scenario.family === 'cost_sensitivity' || (r.scenario.family === 'primary' || r.scenario.family === 'benchmark') && r.scenario.costBps === 0);
  const monthly = args.results.filter((r) => r.scenario.family === 'static_monthly');
  const zeroCash = args.results.filter((r) => r.scenario.family === 'zero_cash_zero_rf');
  const noBtc = args.results.filter((r) => r.scenario.family === 'no_btc_to_cash');

  const primaryFull = primary.map((r) => metricRow(r.scenario.candidateId as string, { family: 'primary' }, r.full));
  const primaryHoldout = primary.map((r) => metricRow(r.scenario.candidateId as string, { family: 'primary' }, r.holdout));
  const primaryDev = primary.map((r) => metricRow(r.scenario.candidateId as string, { family: 'primary' }, r.development));

  const deltaFull = primary
    .filter((r) => r.scenario.candidateId !== 'P0_CURRENT')
    .map((r) => ({ id: r.scenario.candidateId, window: 'FULL', ...deltaVsP0(r.full, p0.full) }));
  const deltaHoldout = primary
    .filter((r) => r.scenario.candidateId !== 'P0_CURRENT')
    .map((r) => ({ id: r.scenario.candidateId, window: 'HOLDOUT', ...deltaVsP0(r.holdout, p0.holdout) }));

  const expandingRows: Array<Record<string, unknown>> = [];
  const checkpoints = expandingCheckpoints(args.sessions, args.finalDate);
  for (const end of checkpoints) {
    const p0End = metricAtEndpoint(p0, end, p0.scenario.cashPolicy);
    for (const row of primary) {
      const at = metricAtEndpoint(row, end, row.scenario.cashPolicy);
      const delta = row.scenario.candidateId === 'P0_CURRENT' ? null : deltaVsP0(at, p0End);
      expandingRows.push({
        id: row.scenario.candidateId,
        checkpoint: end,
        cagr: at.cagr,
        sharpe: at.sharpe,
        max_drawdown: at.maxDrawdown,
        calmar: at.calmar,
        d_cagr_pp: delta?.d_cagr_pp ?? '',
        d_sharpe: delta?.d_sharpe ?? '',
        d_maxdd_pp: delta?.d_maxdd_pp ?? '',
        d_calmar: delta?.d_calmar ?? '',
      });
    }
  }

  const endpointRows: Array<Record<string, unknown>> = [];
  for (const row of primary) {
    const truncated = metricAtEndpoint(row, args.endMinus3m, row.scenario.cashPolicy);
    endpointRows.push({
      id: row.scenario.candidateId,
      window: 'END_MINUS_3M',
      truncated_session: args.endMinus3m,
      ...metricRow(row.scenario.candidateId as string, {}, truncated),
      end_plus_3m: END_PLUS_3M_STATUS,
    });
  }

  const files: Record<string, string> = {
    'PRIMARY_FULL.csv': toCsv(primaryFull),
    'PRIMARY_HOLDOUT.csv': toCsv(primaryHoldout),
    'PRIMARY_DEVELOPMENT.csv': toCsv(primaryDev),
    'BENCHMARKS.csv': toCsv(
      benches.flatMap((r) => [
        metricRow(r.scenario.benchmarkId as string, { family: 'benchmark', window_src: 'FULL' }, r.full),
        metricRow(r.scenario.benchmarkId as string, { family: 'benchmark', window_src: 'HOLDOUT' }, r.holdout),
      ])
    ),
    'ABLATIONS.csv': toCsv(
      ablations.map((r) =>
        metricRow(r.scenario.scenarioId, { ablation: r.scenario.ablation, candidate: r.scenario.candidateId }, r.full)
      )
    ),
    'COST_SENSITIVITIES.csv': toCsv(
      costs.map((r) =>
        metricRow(r.scenario.scenarioId, { cost_bps: r.scenario.costBps, family: r.scenario.family }, r.full)
      )
    ),
    'STATIC_REBALANCE_SENSITIVITY.csv': toCsv(
      monthly.map((r) =>
        metricRow(r.scenario.scenarioId, { label: STATIC_MONTHLY_LABEL, cost_bps: r.scenario.costBps }, r.full)
      )
    ),
    'ZERO_CASH_ZERO_RF.csv': toCsv(
      zeroCash.map((r) => metricRow(r.scenario.candidateId as string, { policy: 'ZERO_CASH_ZERO_RF' }, r.full))
    ),
    'NO_BTC_TO_CASH.csv': toCsv(
      noBtc.map((r) => {
        const base = primary.find((p) => p.scenario.candidateId === r.scenario.candidateId);
        return {
          id: r.scenario.candidateId,
          policy: 'NO_BTC_TO_CASH',
          ...metricRow(r.scenario.candidateId as string, {}, r.full),
          d_cagr_pp_vs_combined: base ? deltaVsP0(r.full, base.full).d_cagr_pp : '',
          d_sharpe_vs_combined: base ? deltaVsP0(r.full, base.full).d_sharpe : '',
          d_maxdd_pp_vs_combined: base ? deltaVsP0(r.full, base.full).d_maxdd_pp : '',
        };
      })
    ),
    'BTC_ATTRIBUTION.csv': toCsv(
      primary.flatMap((r) =>
        r.btcAttribution.map((row) => ({
          id: r.scenario.candidateId,
          window: row.window,
          attribution_type: 'ARITHMETIC RETURN CONTRIBUTION',
          not_exact_compounded_wealth: true,
          arithmetic_sum: row.arithmeticSum,
          avg_held_btc: row.avgHeldBtc,
          max_held_btc: row.maxHeldBtc,
          largest_positive_session: row.largestPositiveContribution,
          largest_negative_session: row.largestNegativeContribution,
        }))
      )
    ),
    'YEARLY_RESULTS.csv': toCsv(
      [...primary, ...benches].flatMap((r) =>
        r.yearly.map((row) => ({
          id: r.scenario.candidateId ?? r.scenario.benchmarkId,
          year: row.year,
          complete: row.complete,
          partial: !row.complete,
          simple_return: row.simpleReturn,
          max_drawdown: row.maxDrawdown,
          avg_spy: row.avgSpy,
          avg_gld: row.avgGld,
          avg_btc: row.avgBtc,
          avg_bil: row.avgBil,
        }))
      )
    ),
    'EXPANDING_ENDPOINT_STABILITY.csv': toCsv(expandingRows),
    'ENDPOINT_SENSITIVITY.csv': toCsv(endpointRows),
    'REGIME_CONDITIONED.csv': toCsv(
      primary.flatMap((r) =>
        r.regimeConditioned.map((row) => ({
          id: r.scenario.candidateId,
          executed_regime: row.regime,
          interval_count: row.intervalCount,
          average_net_return: row.averageNetReturn,
          compounded_conditional_return: row.compoundedConditionalReturn,
          avg_spy: row.avgSpy,
          avg_gld: row.avgGld,
          avg_btc: row.avgBtc,
          avg_bil: row.avgBil,
          diagnostic_only: true,
        }))
      )
    ),
    'EQUITY_SUMMARY.json': `${JSON.stringify(
      {
        s0: args.s0,
        s1: args.s1,
        s2: args.s2,
        final_date: args.finalDate,
        development_last: args.developmentLast,
        holdout_first: args.holdoutFirst,
        end_minus_3m: args.endMinus3m,
        end_plus_3m: END_PLUS_3M_STATUS,
        delta_convention: DELTA_SIGN_NOTE,
        primary_order: [...CANDIDATE_IDS],
        no_automatic_winner: true,
      },
      null,
      2
    )}\n`,
  };

  files['SUMMARY.md'] = renderSummary({
    primary,
    p0,
    benches,
    ablations,
    noBtc,
    zeroCash,
    monthly,
    deltaFull,
    deltaHoldout,
    args,
  });

  void costs;
  return files;
}

function renderSummary(input: {
  primary: ScenarioResult[];
  p0: ScenarioResult;
  benches: ScenarioResult[];
  ablations: ScenarioResult[];
  noBtc: ScenarioResult[];
  zeroCash: ScenarioResult[];
  monthly: ScenarioResult[];
  deltaFull: Array<Record<string, unknown>>;
  deltaHoldout: Array<Record<string, unknown>>;
  args: {
    s0: DateKey;
    s1: DateKey;
    s2: DateKey;
    finalDate: DateKey;
    developmentLast: DateKey;
    holdoutFirst: DateKey;
    endMinus3m: DateKey;
  };
}): string {
  const lines: string[] = [
    `# ${R7C_STUDY_NAME} summary`,
    '',
    'Research evidence only. Not a production allocation decision. No candidate ranking or winner.',
    '',
    `Common signal S0: ${input.args.s0}`,
    `Common inception S1: ${input.args.s1}`,
    `First return end S2: ${input.args.s2}`,
    `Full end: ${input.args.finalDate}`,
    `Development last session: ${input.args.developmentLast}`,
    `Holdout first session: ${input.args.holdoutFirst} (CAGR elapsed ${HOLDOUT_CALENDAR_START} → ${HOLDOUT_CALENDAR_END})`,
    `END_MINUS_3M session: ${input.args.endMinus3m}`,
    `END_PLUS_3M: ${END_PLUS_3M_STATUS}`,
    '',
    `Delta convention: ${DELTA_SIGN_NOTE}`,
    '',
    '## Primary full period (P0 → P6)',
    '',
  ];
  for (const row of input.primary) {
    const m = row.full;
    lines.push(
      `- ${row.scenario.candidateId}: CAGR ${fmtPct(m.cagr)}; vol ${fmtPct(m.vol)}; Sharpe ${fmt(m.sharpe)}; Sortino ${fmt(m.sortino)}; maxDD ${fmtPct(m.maxDrawdown)}; Calmar ${fmt(m.calmar)}; TUW_maxDD ${m.tuwMaxDdCalendarDays ?? 'n/a'}d; TUW_longest ${m.tuwLongestCalendarDays ?? 'n/a'}d; worst year ${m.worstCompleteCalendarYear ?? 'n/a'} ${fmtPct(m.worstCompleteCalendarYearReturn)}; one-way turnover ${fmt(m.cumulativeOneWayTurnover)}; rebalances ${m.rebalanceCountExInception}; avg SPY/GLD/BTC/BIL ${fmt(m.avgSpy)}/${fmt(m.avgGld)}/${fmt(m.avgBtc)}/${fmt(m.avgBil)}`
    );
  }
  lines.push('', '## Primary holdout (P0 → P6)', '');
  for (const row of input.primary) {
    const m = row.holdout;
    lines.push(
      `- ${row.scenario.candidateId}: CAGR ${fmtPct(m.cagr)}; vol ${fmtPct(m.vol)}; Sharpe ${fmt(m.sharpe)}; Sortino ${fmt(m.sortino)}; maxDD ${fmtPct(m.maxDrawdown)}; Calmar ${fmt(m.calmar)}; TUW_maxDD ${m.tuwMaxDdCalendarDays ?? 'n/a'}d; TUW_longest ${m.tuwLongestCalendarDays ?? 'n/a'}d`
    );
  }
  lines.push('', '## P1–P6 deltas vs P0 (full)', '');
  for (const row of input.deltaFull) {
    lines.push(`- ${row.id}: ΔCAGR ${fmt(row.d_cagr_pp as number | null)}pp; ΔSharpe ${fmt(row.d_sharpe as number | null)}; ΔmaxDD ${fmt(row.d_maxdd_pp as number | null)}pp`);
  }
  lines.push('', '## P1–P6 deltas vs P0 (holdout)', '');
  for (const row of input.deltaHoldout) {
    lines.push(`- ${row.id}: ΔCAGR ${fmt(row.d_cagr_pp as number | null)}pp; ΔSharpe ${fmt(row.d_sharpe as number | null)}; ΔmaxDD ${fmt(row.d_maxdd_pp as number | null)}pp`);
  }
  lines.push('', '## Benchmarks (full)', '');
  for (const row of input.benches) {
    lines.push(`- ${row.scenario.benchmarkId}: CAGR ${fmtPct(row.full.cagr)}; Sharpe ${fmt(row.full.sharpe)}; maxDD ${fmtPct(row.full.maxDrawdown)}`);
  }
  lines.push('', 'Tables remain in preregistered ID order. No winner is selected.', '');
  return `${lines.join('\n')}\n`;
}

export function writeInvalidReceipt(dir: string, receipt: Record<string, unknown>): void {
  writeFileSync(join(dir, 'RUN_RECEIPT.json'), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
}

export function writeValidBundle(args: {
  dir: string;
  files: Record<string, string>;
  receipt: Record<string, unknown>;
}): { hashes: Record<string, string>; receiptSha256: string } {
  const hashes: Record<string, string> = {};
  for (const [name, body] of Object.entries(args.files)) {
    writeFileSync(join(args.dir, name), body, 'utf8');
    hashes[name] = sha256Text(body);
  }
  const receiptBody = `${JSON.stringify({ ...args.receipt, output_file_hashes: hashes }, null, 2)}\n`;
  writeFileSync(join(args.dir, 'RUN_RECEIPT.json'), receiptBody, 'utf8');
  hashes['RUN_RECEIPT.json'] = sha256Text(receiptBody);
  const hashLines = Object.entries(hashes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, hash]) => `${hash}  ${file}`)
    .join('\n');
  writeFileSync(join(args.dir, 'HASHES.sha256'), `${hashLines}\n`, 'utf8');
  hashes['HASHES.sha256'] = sha256File(join(args.dir, 'HASHES.sha256'));

  for (const [name, expected] of Object.entries(hashes)) {
    if (name === 'HASHES.sha256') continue;
    const got = sha256File(join(args.dir, name));
    if (got !== expected) {
      throw new Error(`OUTPUT_HASH_MISMATCH: ${name}`);
    }
  }
  return { hashes, receiptSha256: hashes['RUN_RECEIPT.json'] };
}

export function relativeResultDir(repoRoot: string, dir: string): string {
  return relative(repoRoot, dir).replace(/\\/g, '/');
}
