/**
 * GhostFlow v0.2 — artifact freshness boundary tests.
 */

import assert from 'assert';
import { evaluateArtifactFreshness, tradingDaysAfter } from '../artifactFreshness';
import { buildGhostFlowSnapshot } from '../buildSnapshot';

assert.strictEqual(tradingDaysAfter('2026-05-20', '2026-05-20'), 0);
assert.strictEqual(tradingDaysAfter('2026-05-19', '2026-05-20'), 1);
assert.strictEqual(tradingDaysAfter('2026-05-18', '2026-05-20'), 2);
assert.strictEqual(tradingDaysAfter('2026-05-16', '2026-05-20'), 3);

const fresh = evaluateArtifactFreshness('2026-05-18', '2026-05-20');
assert.strictEqual(fresh.status, 'fresh');
assert.strictEqual(fresh.tradingDaysStale, 2);
assert.strictEqual(fresh.warnings.length, 0);

const caution = evaluateArtifactFreshness('2026-05-15', '2026-05-20');
assert.strictEqual(caution.status, 'caution');
assert.strictEqual(caution.tradingDaysStale, 3);
assert.ok(caution.warnings.length > 0);

const cautionEdge = evaluateArtifactFreshness('2026-05-14', '2026-05-20');
assert.strictEqual(cautionEdge.status, 'caution');
assert.strictEqual(cautionEdge.tradingDaysStale, 4);

const stale = evaluateArtifactFreshness('2026-05-12', '2026-05-20');
assert.strictEqual(stale.status, 'stale');
assert.strictEqual(stale.tradingDaysStale, 6);
assert.ok(stale.warnings.some((w) => w.includes('stale')));

// Stale artifact still public (not mock fallback)
const staleBuilt = buildGhostFlowSnapshot('2026-05-28');
assert.strictEqual(staleBuilt.meta.volRegimeSource, 'public');
assert.strictEqual(staleBuilt.meta.dataMix, 'mixed');
const vol = staleBuilt.raw.signals.find((s) => s.id === 'vol-regime');
assert.strictEqual(vol?.dataStatus, 'public_proxy');
assert.strictEqual(vol?.freshnessStatus, 'stale');

console.log('ghostflow/artifactFreshness.test.ts: ok');
