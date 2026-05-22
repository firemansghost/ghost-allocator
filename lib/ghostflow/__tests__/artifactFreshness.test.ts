/**
 * GhostFlow — artifact freshness boundary tests.
 */

import assert from 'assert';
import {
  calendarDaysAfter,
  evaluateDailyArtifactFreshness,
  evaluateWeeklyArtifactFreshness,
  tradingDaysAfter,
} from '../artifactFreshness';
import { buildGhostFlowSnapshotWithArtifacts } from '../buildSnapshot';
import {
  FIXTURE_ETF_NET_ISSUANCE_MERGE,
  FIXTURE_ETF_STALE_REFERENCE_AS_OF,
} from './fixtures/etfNetIssuance';

// --- Daily (VIX) ---
assert.strictEqual(tradingDaysAfter('2026-05-20', '2026-05-20'), 0);
assert.strictEqual(tradingDaysAfter('2026-05-19', '2026-05-20'), 1);
assert.strictEqual(tradingDaysAfter('2026-05-18', '2026-05-20'), 2);
assert.strictEqual(tradingDaysAfter('2026-05-16', '2026-05-20'), 3);

const freshDaily = evaluateDailyArtifactFreshness('2026-05-18', '2026-05-20');
assert.strictEqual(freshDaily.status, 'fresh');
assert.strictEqual(freshDaily.ageDays, 2);

const cautionDaily = evaluateDailyArtifactFreshness('2026-05-15', '2026-05-20');
assert.strictEqual(cautionDaily.status, 'caution');
assert.strictEqual(cautionDaily.ageDays, 3);

const staleDaily = evaluateDailyArtifactFreshness('2026-05-12', '2026-05-20');
assert.strictEqual(staleDaily.status, 'stale');
assert.strictEqual(staleDaily.ageDays, 6);

// --- Weekly (ETF) calendar days from publishedAt ---
assert.strictEqual(calendarDaysAfter('2026-01-15', '2026-01-15'), 0);
assert.strictEqual(calendarDaysAfter('2026-01-15', '2026-01-22'), 7);

const freshWeekly = evaluateWeeklyArtifactFreshness('2026-01-15', '2026-01-22');
assert.strictEqual(freshWeekly.status, 'fresh');
assert.strictEqual(freshWeekly.ageDays, 7);

const cautionWeekly = evaluateWeeklyArtifactFreshness('2026-01-15', '2026-01-23');
assert.strictEqual(cautionWeekly.status, 'caution');
assert.strictEqual(cautionWeekly.ageDays, 8);

const cautionEdgeWeekly = evaluateWeeklyArtifactFreshness('2026-01-15', '2026-01-29');
assert.strictEqual(cautionEdgeWeekly.status, 'caution');
assert.strictEqual(cautionEdgeWeekly.ageDays, 14);

const staleWeekly = evaluateWeeklyArtifactFreshness('2026-01-15', '2026-01-30');
assert.strictEqual(staleWeekly.status, 'stale');
assert.strictEqual(staleWeekly.ageDays, 15);

// Stale ETF artifact still public
const staleBuilt = buildGhostFlowSnapshotWithArtifacts({
  etf: FIXTURE_ETF_NET_ISSUANCE_MERGE,
  referenceAsOf: FIXTURE_ETF_STALE_REFERENCE_AS_OF,
});
assert.strictEqual(staleBuilt.meta.etfFlowSource, 'public');
assert.strictEqual(staleBuilt.raw.signals.find((s) => s.id === 'etf-flow')?.freshnessStatus, 'stale');

console.log('ghostflow/artifactFreshness.test.ts: ok');
