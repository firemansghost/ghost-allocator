/**
 * GhostFlow v1.1e-calibration — levered ETF rebalance history research (no network).
 */

import assert from 'assert';
import productionArtifact from '@/data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json';
import type { LeveredEtfRebalancePressureArtifactV1 } from '@/lib/ghostflow/artifacts/types';
import { computeEstimatedRebalanceNotional } from '@/lib/ghostflow/artifacts/leveredEtfRebalancePressure';
import {
  AGGREGATE_NOTIONAL_TOLERANCE_MILLIONS,
  AGGREGATE_PCT_TOLERANCE,
  alignSessions,
  aumMapFromProductionRows,
  buildLeveredMappingComparison,
  buildTier1RowsForSession,
  fixedCurrentAumResolver,
  mappingCapped,
  mappingLinearPct,
  mappingManualBands,
  mappingPercentile,
  percentileRank,
  previewScoreWithLevered,
  type DailyProxyReturns,
} from '../research/leveredEtfRebalanceHistory';

const artifact = productionArtifact as LeveredEtfRebalancePressureArtifactV1;
const aumMap = aumMapFromProductionRows(artifact.etfRows);
const aumResolver = fixedCurrentAumResolver(aumMap);

const prodReturns: DailyProxyReturns = {
  date: artifact.asOf,
  qqqPct: -1.52,
  spyPct: -0.14,
  iwmPct: -0.38,
};

// --- row notional ---
assert.strictEqual(
  Math.round(computeEstimatedRebalanceNotional(35276.57, 3, -1.52) * 100) / 100,
  -3217.22
);

// --- session aggregate cross-check ---
const { rows } = buildTier1RowsForSession(prodReturns.date, prodReturns, aumResolver);
assert.ok(rows);
const { aligned } = alignSessions([prodReturns], aumResolver);
assert.strictEqual(aligned.length, 1);
const o = aligned[0]!.observations;
assert.ok(
  Math.abs(o.aggregateRebalancePctOfUniverseAum - artifact.observations.aggregateRebalancePctOfUniverseAum) <=
    AGGREGATE_PCT_TOLERANCE
);
assert.ok(
  Math.abs(o.aggregateAbsRebalanceNotionalMillionsUsd - artifact.observations.aggregateAbsRebalanceNotionalMillionsUsd) <=
    AGGREGATE_NOTIONAL_TOLERANCE_MILLIONS
);
assert.strictEqual(o.dominantDirection, 'sell_underlying');

// --- skip missing IWM ---
const missingIwm: DailyProxyReturns = {
  date: '2026-05-21',
  qqqPct: 0.1,
  spyPct: 0.05,
  iwmPct: Number.NaN,
};
const skip = alignSessions([missingIwm, prodReturns], aumResolver);
assert.strictEqual(skip.aligned.length, 1);
assert.strictEqual(skip.skippedSessions.length, 1);

// --- mappings ---
assert.strictEqual(mappingLinearPct(2.78, 20), 56);
assert.strictEqual(mappingLinearPct(2.78, 10), 28);
assert.strictEqual(mappingManualBands(2.78), 60);
assert.strictEqual(mappingCapped(5, 20, 80), 80);
const sorted = [1, 2, 3, 4, 5];
assert.ok(percentileRank(sorted, 3) >= 40 && percentileRank(sorted, 3) <= 60);
assert.strictEqual(mappingPercentile(3, [1, 2, 3, 4, 5]), 50);

// --- score preview ---
const mock = previewScoreWithLevered(55);
assert.strictEqual(mock.passivePressure, 45);
assert.strictEqual(mock.composite, 56);
assert.strictEqual(mock.band, 'elevated_flow');
const l56 = previewScoreWithLevered(56);
assert.strictEqual(l56.passivePressure, 45);
assert.strictEqual(l56.composite, 56);
assert.strictEqual(l56.band, 'elevated_flow');

// --- mapping comparison shape ---
const multi: DailyProxyReturns[] = [
  { date: '2026-05-20', qqqPct: -0.5, spyPct: -0.3, iwmPct: -0.8 },
  prodReturns,
];
const multiAlign = alignSessions(multi, aumResolver);
const cmp = buildLeveredMappingComparison(multiAlign.aligned, multiAlign.aligned[1]!, 20);
assert.strictEqual(cmp.length, 5);

console.log('ghostflow/leveredEtfRebalanceHistory.test.ts: ok');
