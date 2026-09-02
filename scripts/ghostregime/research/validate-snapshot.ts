/**
 * R7B1 validate-only / post-cutover parity CLI.
 *
 * Safe against the private frozen snapshot. Does not compute portfolio
 * performance, candidate rankings, CAGR, drawdown, or Sharpe.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CUTOVER_DATE, RESEARCH_END, SNAPSHOT_ID, assertFrozenModelVersion } from './study-contract';
import { loadResearchSnapshot } from './io';
import { runPostCutoverParity } from './model-state';

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  assertFrozenModelVersion();
  const snapshotArg = argValue('--snapshot');
  if (!snapshotArg) {
    console.error('Usage: tsx scripts/ghostregime/research/validate-snapshot.ts --snapshot <path>');
    process.exit(2);
  }
  const root = resolve(snapshotArg);
  if (!existsSync(root)) {
    console.error(`SNAPSHOT_MISSING: ${root}`);
    process.exit(2);
  }

  const snapshot = loadResearchSnapshot(root);
  const holdoutFirst = snapshot.calendar.find((row) => row.session_date >= '2024-09-01')?.session_date;
  const spyDates = snapshot.signalRows.filter((row) => row.symbol === 'SPY').map((row) => row.date_key);
  const parity = await runPostCutoverParity({
    marketData: snapshot.signalMarketData,
    spyDates,
    cutover: CUTOVER_DATE,
    end: RESEARCH_END,
  });

  const report = {
    mode: 'validate_only',
    snapshot_id: snapshot.snapshotId,
    expected_snapshot_id: SNAPSHOT_ID,
    manifest_sha256: snapshot.manifestSha256,
    validation_report_sha256: snapshot.validationReportSha256,
    hash_verification: 'pass',
    warnings: snapshot.warnings,
    btc_stale_sessions: snapshot.btcStaleSessions,
    vix_extra_date_count: snapshot.vixExtraDates.length,
    vix_extra_dates: snapshot.vixExtraDates,
    holdout_first_eligible_session: holdoutFirst ?? null,
    model_state_parity: parity,
    candidate_performance: 'not_run',
    ranking: 'not_run',
  };

  console.log(JSON.stringify(report, null, 2));

  if (snapshot.snapshotId !== SNAPSHOT_ID) {
    throw new Error('SNAPSHOT_ID_MISMATCH');
  }
  if (holdoutFirst !== '2024-09-03') {
    throw new Error(`HOLDOUT_FIRST_SESSION_MISMATCH: ${holdoutFirst}`);
  }
  if (parity.total_mismatches !== 0) {
    console.error('MODEL_STATE_PARITY_FAILED', parity.first_mismatch);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
