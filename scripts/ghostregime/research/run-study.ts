/**
 * R7C frozen-panel study runner.
 *
 * --plan-only never computes candidate performance.
 * A real run is atomic: all scenarios + integrity checks, then write outputs.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { computeResearchModelState, resolveResearchSatellites } from './model-state';
import { loadResearchSnapshot, type LoadedSnapshot } from './io';
import {
  assertFrozenModelVersion,
  CANDIDATE_IDS,
  CUTOVER_DATE,
  MANIFEST_SHA256,
  MODEL_VERSION_EXPECTED,
  RESEARCH_END,
  SNAPSHOT_ID,
  VALIDATION_REPORT_SHA256,
} from './study-contract';
import { runPostCutoverParity } from './model-state';
import {
  buildStudyScenarios,
  expectedStudyMatrixCounts,
  planOnlyContract,
  R7C_STUDY_NAME,
} from './r7c-run-plan';
import {
  developmentLastSession,
  endMinus3mSession,
  finalResearchSession,
  firstEligibleHoldoutSession,
  firstValidSignalSession,
  publishedTargetForState,
  replayAnnotated,
  runIntegrityChecks,
  summarizeScenario,
  verifyCommonInception,
  type ScenarioResult,
} from './study-engine';
import { buildCloseMap } from './study-engine';
import {
  buildResultFiles,
  createResultDir,
  existingR7cResultDirs,
  relativeResultDir,
  sha256File,
  writeInvalidReceipt,
  writeValidBundle,
} from './study-report';
import type { DateKey, ResearchModelState, Weights } from './types';

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function gitSha(repoRoot: string): string {
  return execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function utcStamp(date = new Date()): string {
  const iso = date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return iso.replace('T', '-');
}

function studyFileHashes(repoRoot: string): Record<string, string> {
  const files = [
    'scripts/ghostregime/research/study-contract.ts',
    'scripts/ghostregime/research/allocation-candidates.ts',
    'scripts/ghostregime/research/r7c-run-plan.ts',
    'scripts/ghostregime/research/run-study.ts',
    'scripts/ghostregime/research/study-engine.ts',
    'scripts/ghostregime/research/study-report.ts',
  ];
  return Object.fromEntries(files.map((file) => [file, sha256File(join(repoRoot, file))]));
}

export async function reconstructModelStates(
  snapshot: LoadedSnapshot,
  from: DateKey,
  to: DateKey,
  onProgress?: (done: number, total: number) => void
): Promise<Map<DateKey, ResearchModelState>> {
  const sessions = snapshot.calendar
    .map((row) => row.session_date)
    .filter((date) => date >= from && date <= to);
  const out = new Map<DateKey, ResearchModelState>();
  let done = 0;
  for (const session of sessions) {
    const asof = new Date(`${session}T00:00:00.000Z`);
    const satelliteData = await resolveResearchSatellites(snapshot.signalMarketData, asof);
    const state = await computeResearchModelState(snapshot.signalMarketData, asof, { satelliteData });
    out.set(session, state);
    done += 1;
    if (onProgress && (done % 100 === 0 || done === sessions.length)) {
      onProgress(done, sessions.length);
    }
  }
  return out;
}

function targetsForScenario(
  sessions: DateKey[],
  states: Map<DateKey, ResearchModelState>,
  scenario: ReturnType<typeof buildStudyScenarios>[number]
): { publishedTargets: Map<DateKey, Weights>; publishedRegimes: Map<DateKey, string | null> } {
  const publishedTargets = new Map<DateKey, Weights>();
  const publishedRegimes = new Map<DateKey, string | null>();
  for (const session of sessions) {
    const state = states.get(session);
    if (!state) throw new Error(`MISSING_MODEL_STATE: ${session}`);
    publishedTargets.set(session, publishedTargetForState(state, scenario));
    const usesRegime = scenario.rebalanceMode === 'event' && scenario.ablation !== 'VAMS_ONLY' && scenario.ablation !== 'STATIC_601030' && scenario.ablation !== 'SPY_100' && scenario.benchmarkId == null;
    publishedRegimes.set(session, usesRegime || scenario.ablation === 'REGIME_ONLY' || scenario.ablation === 'COMBINED' || scenario.ablation === 'VAMS_ONLY' ? state.regime : null);
  }
  return { publishedTargets, publishedRegimes };
}

export async function planOnly(snapshot: LoadedSnapshot): Promise<Record<string, unknown>> {
  const sessions = snapshot.calendar.map((row) => row.session_date).filter((d) => d <= RESEARCH_END);
  const s0 = firstValidSignalSession(sessions, snapshot.signalRows);
  if (!s0) throw new Error('FIRST_VALID_SIGNAL_NOT_FOUND');
  const { s1, s2 } = verifyCommonInception(sessions, s0);
  const holdoutFirst = firstEligibleHoldoutSession(sessions);
  const developmentLast = developmentLastSession(sessions);
  const finalDate = finalResearchSession(sessions);
  const endMinus3m = endMinus3mSession(sessions);
  return {
    ...planOnlyContract(),
    snapshot_id: snapshot.snapshotId,
    manifest_sha256: snapshot.manifestSha256,
    validation_report_sha256: snapshot.validationReportSha256,
    known_data_warnings: snapshot.warnings,
    btc_stale_sessions: snapshot.btcStaleSessions,
    vix_extra_count: snapshot.vixExtraDates.length,
    derived_s0: s0,
    derived_s1: s1,
    derived_s2: s2,
    derived_holdout_first: holdoutFirst,
    derived_development_last: developmentLast,
    derived_final_date: finalDate,
    derived_end_minus_3m: endMinus3m,
    candidate_performance: 'not_run',
    cagr: 'not_run',
    drawdown: 'not_run',
    sharpe: 'not_run',
    sortino: 'not_run',
    final_nav: 'not_run',
    ranking: 'not_run',
  };
}

export async function executeStudy(args: {
  snapshot: LoadedSnapshot;
  repoRoot: string;
  command: string;
  startedAt: string;
}): Promise<{ status: 'VALID' | 'INVALID'; dir: string; receipt: Record<string, unknown> }> {
  const existing = existingR7cResultDirs(args.repoRoot);
  if (existing.length > 0) {
    throw new Error(`EXISTING_R7C_RESULT_DIR: ${existing.join(', ')}`);
  }

  const sessionsAll = args.snapshot.calendar.map((row) => row.session_date).filter((d) => d <= RESEARCH_END);
  const s0 = firstValidSignalSession(sessionsAll, args.snapshot.signalRows);
  if (!s0) throw new Error('FIRST_VALID_SIGNAL_NOT_FOUND');
  const { s1, s2 } = verifyCommonInception(sessionsAll, s0);
  const holdoutFirst = firstEligibleHoldoutSession(sessionsAll);
  const developmentLast = developmentLastSession(sessionsAll);
  const finalDate = finalResearchSession(sessionsAll);
  const endMinus3m = endMinus3mSession(sessionsAll);
  const studySessions = sessionsAll.filter((date) => date >= s0 && date <= finalDate);

  console.error(`R7C reconstructing model states ${s0} → ${finalDate} (${studySessions.length} sessions)`);
  const modelStates = await reconstructModelStates(args.snapshot, s0, finalDate, (done, total) => {
    console.error(`R7C model states ${done}/${total}`);
  });

  const spyDates = args.snapshot.signalRows.filter((row) => row.symbol === 'SPY').map((row) => row.date_key);
  const parity = await runPostCutoverParity({
    marketData: args.snapshot.signalMarketData,
    spyDates,
    cutover: CUTOVER_DATE,
    end: RESEARCH_END,
  });
  if (parity.total_mismatches !== 0 || parity.nonzero_infl_sat_score_dates !== 0) {
    throw new Error('POST_CUTOVER_PARITY_FAILED');
  }

  const closeMap = buildCloseMap(args.snapshot.returnRows);
  const scenarios = buildStudyScenarios();
  const results: ScenarioResult[] = [];

  console.error(`R7C computing ${scenarios.length} scenarios (metrics withheld until integrity checks)`);
  for (const scenario of scenarios) {
    const { publishedTargets, publishedRegimes } = targetsForScenario(studySessions, modelStates, scenario);
    const steps = replayAnnotated({
      sessions: studySessions,
      publishedTargets,
      publishedRegimes,
      closeMap,
      scenario,
    });
    results.push(
      summarizeScenario(scenario, steps, {
        s1,
        finalDate,
        developmentLast,
        holdoutFirst,
        publishedTargets,
        studySessions,
      })
    );
  }

  const integrity = runIntegrityChecks({
    results,
    s1,
    finalDate,
    holdoutFirst,
    developmentLast,
    modelStates,
    closeMap,
    btcStaleCount: args.snapshot.btcStaleSessions.length,
    btcPostCloseLeak: args.snapshot.returnRows.some((row) => row.post_close_leak === true),
  });
  const allPassed = integrity.every((check) => check.passed);
  const completedAt = new Date().toISOString();
  const runnerSha = gitSha(args.repoRoot);
  const dir = createResultDir(args.repoRoot, utcStamp());

  const receiptBase = {
    study: R7C_STUDY_NAME,
    snapshot_id: args.snapshot.snapshotId,
    manifest_sha256: args.snapshot.manifestSha256,
    validation_report_sha256: args.snapshot.validationReportSha256,
    expected_manifest_sha256: MANIFEST_SHA256,
    expected_validation_report_sha256: VALIDATION_REPORT_SHA256,
    base_main_sha: '2a06d73a5a52d7e9e79d7c7230402540a159b12c',
    runner_commit_sha: runnerSha,
    model_version: MODEL_VERSION_EXPECTED,
    research_start: '2016-01-01',
    research_end: RESEARCH_END,
    signal_panel_policy: 'raw_close_and_vix_index',
    return_panel_policy: 'adjusted_etf_plus_session_aligned_btc',
    execution_convention: 'one_session_lag',
    common_signal_date: s0,
    common_inception_date: s1,
    first_return_end_date: s2,
    holdout_calendar_start: '2024-09-01',
    holdout_first_session: holdoutFirst,
    holdout_end: '2026-09-01',
    development_last_session: developmentLast,
    end_minus_3m_session: endMinus3m,
    end_plus_3m: 'UNAVAILABLE_BY_FROZEN_SNAPSHOT',
    primary_candidate_ids: [...CANDIDATE_IDS],
    benchmark_ids: ['STATIC_601030', 'STATIC_6040', 'SPY_100'],
    ablation_ids: ['STATIC_601030', 'REGIME_ONLY', 'VAMS_ONLY', 'COMBINED', 'SPY_100'],
    cost_scenarios: [0, 5, 10],
    cash_policy: 'BIL_ADJUSTED',
    no_btc_policy: 'NO_BTC_TO_CASH',
    static_rebalance_primary: 'annual_first_xnys_session_of_calendar_year',
    static_rebalance_sensitivity: 'monthly_first_xnys_session',
    btc_stale_count: args.snapshot.btcStaleSessions.length,
    btc_stale_date: args.snapshot.btcStaleSessions[0] ?? null,
    vix_extra_count: args.snapshot.vixExtraDates.length,
    matrix: expectedStudyMatrixCounts(),
    started_at_utc: args.startedAt,
    completed_at_utc: completedAt,
    command: args.command,
    integrity_checks: integrity,
    study_file_hashes: studyFileHashes(args.repoRoot),
    post_cutover_parity: {
      dates_tested: parity.dates_tested,
      total_mismatches: parity.total_mismatches,
      nonzero_infl_sat_score_dates: parity.nonzero_infl_sat_score_dates,
    },
  };

  if (!allPassed) {
    const receipt = { ...receiptBase, status: 'INVALID' as const };
    writeInvalidReceipt(dir, receipt);
    return { status: 'INVALID', dir, receipt };
  }

  const files = buildResultFiles({
    results,
    sessions: studySessions,
    s0,
    s1,
    s2,
    finalDate,
    developmentLast,
    holdoutFirst,
    endMinus3m,
  });
  const written = writeValidBundle({
    dir,
    files,
    receipt: { ...receiptBase, status: 'VALID' },
  });
  return {
    status: 'VALID',
    dir,
    receipt: { ...receiptBase, status: 'VALID', output_file_hashes: written.hashes, receipt_sha256: written.receiptSha256 },
  };
}

async function main(): Promise<void> {
  assertFrozenModelVersion();
  const snapshotArg = argValue('--snapshot');
  if (!snapshotArg) {
    console.error('Usage: tsx scripts/ghostregime/research/run-study.ts --snapshot <path> [--plan-only]');
    process.exit(2);
  }
  const repoRoot = resolve('.');
  const root = resolve(snapshotArg);
  if (!existsSync(root)) {
    console.error(`SNAPSHOT_MISSING: ${root}`);
    process.exit(2);
  }
  if (SNAPSHOT_ID !== 'r7b0-20260902-210842Z') {
    throw new Error('SNAPSHOT_ID_DRIFT');
  }

  const snapshot = loadResearchSnapshot(root);
  const plan = hasFlag('--plan-only');
  if (plan) {
    const report = await planOnly(snapshot);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const startedAt = new Date().toISOString();
  const command = process.argv.slice(2).join(' ');
  const result = await executeStudy({ snapshot, repoRoot, command, startedAt });
  if (result.status !== 'VALID') {
    console.error(JSON.stringify({
      status: 'INVALID',
      result_dir: relativeResultDir(repoRoot, result.dir),
      integrity_checks: result.receipt.integrity_checks,
    }, null, 2));
    process.exit(1);
  }

  const summaryPath = join(result.dir, 'SUMMARY.md');
  const summary = existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '';
  console.log(JSON.stringify({
    status: 'VALID',
    result_dir: relativeResultDir(repoRoot, result.dir),
    receipt_sha256: result.receipt.receipt_sha256,
    runner_commit_sha: result.receipt.runner_commit_sha,
    snapshot_id: snapshot.snapshotId,
  }, null, 2));
  console.log(summary);
}

const isDirect = process.argv[1] != null && process.argv[1].replace(/\\/g, '/').endsWith('run-study.ts');
if (isDirect) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
}
