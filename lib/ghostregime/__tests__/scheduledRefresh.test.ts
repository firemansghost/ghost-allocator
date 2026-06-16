/**
 * Scheduled refresh preflight (health-aligned freshness, max_age_days = 4)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { GhostRegimeRow } from '../types';
import {
  GHOSTREGIME_HEALTH_MAX_AGE_DAYS,
  computeSnapshotAgeDays,
  evaluateScheduledRefreshPreflight,
  isPersistedRowSchemaOutdated,
  isSnapshotFreshByHealthStandard,
} from '../scheduledRefresh';

function baseRow(overrides: Partial<GhostRegimeRow> = {}): GhostRegimeRow {
  return {
    date: '2026-06-13',
    run_date_utc: '2026-06-13',
    regime: 'GOLDILOCKS',
    risk_regime: 'RISK ON',
    risk_score: 1,
    infl_score: 0,
    infl_core_score: 0,
    infl_sat_score: 0,
    infl_total_score_pre_tiebreak: 1,
    risk_axis: 'RiskOn',
    infl_axis: 'Disinflation',
    risk_tiebreaker_used: false,
    infl_tiebreaker_used: false,
    stocks_vams_state: 0,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.5,
    gold_target: 0.2,
    btc_target: 0.05,
    stocks_scale: 1,
    gold_scale: 1,
    btc_scale: 1,
    stocks_actual: 0.5,
    gold_actual: 0.2,
    btc_actual: 0.05,
    cash: 0.2,
    flip_watch_status: 'NONE',
    source: 'computed',
    row_computed_at_utc: '2026-06-13T12:00:00.000Z',
    row_build_commit: 'abc',
    row_engine_version: 'ghostregime-v1',
    ...overrides,
  };
}

describe('GHOSTREGIME_HEALTH_MAX_AGE_DAYS', () => {
  it('matches health endpoint max_age_days', () => {
    assert.strictEqual(GHOSTREGIME_HEALTH_MAX_AGE_DAYS, 4);
  });
});

describe('computeSnapshotAgeDays', () => {
  it('returns 3 for Monday run vs Friday snapshot (weekend-safe)', () => {
    const monday = new Date('2026-06-15T03:30:00.000Z');
    assert.strictEqual(computeSnapshotAgeDays(monday, '2026-06-12'), 3);
    assert.strictEqual(isSnapshotFreshByHealthStandard(3), true);
  });

  it('returns 5 when snapshot exceeds max age', () => {
    const run = new Date('2026-06-15T12:00:00.000Z');
    assert.strictEqual(computeSnapshotAgeDays(run, '2026-06-10'), 5);
    assert.strictEqual(isSnapshotFreshByHealthStandard(5), false);
  });
});

describe('isPersistedRowSchemaOutdated', () => {
  it('flags missing modern fields', () => {
    const row = baseRow({ infl_total_score_pre_tiebreak: undefined });
    assert.strictEqual(isPersistedRowSchemaOutdated(row), true);
  });
});

describe('evaluateScheduledRefreshPreflight', () => {
  const mondayCron = new Date('2026-06-15T03:30:00.000Z');

  it('skips fetch when Friday snapshot is fresh on Monday (age 3 <= 4)', () => {
    const latest = baseRow({ date: '2026-06-12', stale: undefined });
    const r = evaluateScheduledRefreshPreflight(latest, mondayCron);
    assert.strictEqual(r.shouldSkipFetch, true);
    assert.strictEqual(r.ageDays, 3);
    assert.strictEqual(r.denyReason, undefined);
  });

  it('denies when latest missing', () => {
    const r = evaluateScheduledRefreshPreflight(null, mondayCron);
    assert.strictEqual(r.shouldSkipFetch, false);
    assert.strictEqual(r.denyReason, 'missing_latest');
  });

  it('denies when latest stale', () => {
    const r = evaluateScheduledRefreshPreflight(baseRow({ stale: true }), mondayCron);
    assert.strictEqual(r.shouldSkipFetch, false);
    assert.strictEqual(r.denyReason, 'latest_stale');
  });

  it('denies when schema outdated', () => {
    const r = evaluateScheduledRefreshPreflight(
      baseRow({ row_engine_version: undefined as unknown as string }),
      mondayCron
    );
    assert.strictEqual(r.shouldSkipFetch, false);
    assert.strictEqual(r.denyReason, 'schema_outdated');
  });

  it('denies when snapshot too old (age > 4)', () => {
    const r = evaluateScheduledRefreshPreflight(baseRow({ date: '2026-06-09' }), mondayCron);
    assert.strictEqual(r.shouldSkipFetch, false);
    assert.strictEqual(r.denyReason, 'snapshot_too_old');
    assert.strictEqual(r.ageDays, 6);
  });
});
