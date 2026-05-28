/**
 * GhostFlow v1.1b/c — Levered ETF rebalance pressure artifact tests.
 */

import assert from 'assert';
import productionArtifact from '@/data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json';
import {
  computeAggregateLeveredEtfRebalanceMetrics,
  computeEstimatedRebalanceDirection,
  computeEstimatedRebalanceNotional,
  loadLeveredEtfRebalancePressureArtifact,
  validateLeveredEtfRebalancePressureArtifact,
} from '../artifacts/leveredEtfRebalancePressure';
import type { LeveredEtfRebalancePressureArtifactV1 } from '../artifacts/types';
import {
  cloneLeveredEtfExample,
  FIXTURE_LEVERED_ETF_REBALANCE_EXAMPLE,
  FIXTURE_LEVERED_ETF_REBALANCE_REFERENCE_AS_OF,
} from './fixtures/leveredEtfRebalancePressure';

// --- Formula: long +3, positive return = buy ---
const longBuy = computeEstimatedRebalanceNotional(50_000, 3, 1);
assert.strictEqual(longBuy, 3000);
assert.strictEqual(computeEstimatedRebalanceDirection(longBuy), 'buy_underlying');

// --- Formula: inverse -3, positive return = buy ---
const inverseBuy = computeEstimatedRebalanceNotional(50_000, -3, 1);
assert.strictEqual(inverseBuy, 6000);
assert.strictEqual(computeEstimatedRebalanceDirection(inverseBuy), 'buy_underlying');

// --- Formula: long +3, negative return = sell ---
const longSell = computeEstimatedRebalanceNotional(50_000, 3, -2);
assert.strictEqual(longSell, -6000);
assert.strictEqual(computeEstimatedRebalanceDirection(longSell), 'sell_underlying');

// --- Formula: inverse -3, negative return = sell ---
const inverseSell = computeEstimatedRebalanceNotional(50_000, -3, -2);
assert.strictEqual(inverseSell, -12000);
assert.strictEqual(computeEstimatedRebalanceDirection(inverseSell), 'sell_underlying');

// --- Near-zero notional = flat ---
assert.strictEqual(computeEstimatedRebalanceDirection(0.005), 'flat');
assert.strictEqual(computeEstimatedRebalanceDirection(-0.005), 'flat');

// --- Aggregate reconciles with example rows ---
const agg = computeAggregateLeveredEtfRebalanceMetrics(FIXTURE_LEVERED_ETF_REBALANCE_EXAMPLE.etfRows);
assert.strictEqual(agg.aggregateAumMillionsUsd, 58200);
assert.strictEqual(agg.aggregateEstimatedRebalanceNotionalMillionsUsd, 1350);
assert.strictEqual(agg.aggregateAbsRebalanceNotionalMillionsUsd, 3846);
assert.strictEqual(agg.aggregateRebalancePctOfUniverseAum, 6.61);
assert.strictEqual(agg.dominantDirection, 'mixed');
assert.strictEqual(agg.mappingStatus, 'not_final');

// --- Example artifact validates (example mode) ---
const valid = validateLeveredEtfRebalancePressureArtifact(
  FIXTURE_LEVERED_ETF_REBALANCE_EXAMPLE,
  { mode: 'example', referenceAsOf: FIXTURE_LEVERED_ETF_REBALANCE_REFERENCE_AS_OF }
);
assert.ok(valid.ok, valid.ok ? '' : valid.errors.join('; '));

// --- Production artifact validates (production mode) ---
const production = productionArtifact as LeveredEtfRebalancePressureArtifactV1;
const prodValid = validateLeveredEtfRebalancePressureArtifact(production, {
  mode: 'production',
  referenceAsOf: FIXTURE_LEVERED_ETF_REBALANCE_REFERENCE_AS_OF,
});
assert.ok(prodValid.ok, prodValid.ok ? '' : prodValid.errors.join('; '));
assert.strictEqual(production.designOnly, undefined);
assert.ok(
  production.source.note?.includes('Production artifact candidate') &&
    production.source.note?.includes('not yet wired')
);
assert.strictEqual(production.asOf, '2026-05-22');
assert.strictEqual(production.publishedAt, '2026-05-28');
assert.strictEqual(production.dataQuality, 'manual_unverified');

// --- Example fails production mode ---
const exampleProdFail = validateLeveredEtfRebalancePressureArtifact(
  FIXTURE_LEVERED_ETF_REBALANCE_EXAMPLE,
  { mode: 'production' }
);
assert.ok(!exampleProdFail.ok);
assert.ok(exampleProdFail.errors.some((e) => e.includes('designOnly')));

// --- Production with designOnly true fails production mode ---
const prodWithDesign = { ...production, designOnly: true as const };
const prodDesignFail = validateLeveredEtfRebalancePressureArtifact(prodWithDesign, {
  mode: 'production',
});
assert.ok(!prodDesignFail.ok);
assert.ok(prodDesignFail.errors.some((e) => e.includes('designOnly')));

// --- Loader returns ok ---
const loaded = loadLeveredEtfRebalancePressureArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

// --- Missing required ticker ---
const missingTza = cloneLeveredEtfExample();
missingTza.etfRows = missingTza.etfRows.filter((r) => r.ticker !== 'TZA');
const missingResult = validateLeveredEtfRebalancePressureArtifact(missingTza, { mode: 'example' });
assert.ok(!missingResult.ok);
assert.ok(missingResult.errors.some((e) => e.includes('TZA')));

// --- Duplicate ticker ---
const dup = cloneLeveredEtfExample();
dup.etfRows.push({ ...dup.etfRows[0] });
const dupResult = validateLeveredEtfRebalancePressureArtifact(dup, { mode: 'example' });
assert.ok(!dupResult.ok);
assert.ok(dupResult.errors.some((e) => e.toLowerCase().includes('duplicate')));

// --- Deferred ticker ---
const deferred = cloneLeveredEtfExample();
deferred.etfRows[5] = {
  ...deferred.etfRows[5],
  ticker: 'SPXL',
  fundName: 'Direxion Daily S&P 500 Bull 3X',
};
const deferredResult = validateLeveredEtfRebalancePressureArtifact(deferred, { mode: 'example' });
assert.ok(!deferredResult.ok);
assert.ok(deferredResult.errors.some((e) => e.includes('SPXL')));

// --- Direction / leverage mismatch ---
const mismatch = cloneLeveredEtfExample();
mismatch.etfRows[0] = { ...mismatch.etfRows[0], direction: 'long', signedLeverage: -3 };
const mismatchResult = validateLeveredEtfRebalancePressureArtifact(mismatch, { mode: 'example' });
assert.ok(!mismatchResult.ok);

// --- Bad date ---
const badDate = cloneLeveredEtfExample();
badDate.asOf = '2026/05/22';
const badDateResult = validateLeveredEtfRebalancePressureArtifact(badDate, { mode: 'example' });
assert.ok(!badDateResult.ok);

// --- Row estimate mismatch ---
const badRow = cloneLeveredEtfExample();
badRow.etfRows[0] = {
  ...badRow.etfRows[0],
  estimatedRebalanceNotionalMillionsUsd: 9999,
};
const badRowResult = validateLeveredEtfRebalancePressureArtifact(badRow, { mode: 'example' });
assert.ok(!badRowResult.ok);

// --- Aggregate mismatch ---
const badAgg = cloneLeveredEtfExample();
badAgg.observations.aggregateAumMillionsUsd = 1;
const badAggResult = validateLeveredEtfRebalancePressureArtifact(badAgg, { mode: 'example' });
assert.ok(!badAggResult.ok);

// --- mappingStatus not not_final ---
const badMapping = cloneLeveredEtfExample();
(badMapping.observations as { mappingStatus: string }).mappingStatus = 'final';
const badMappingResult = validateLeveredEtfRebalancePressureArtifact(badMapping, {
  mode: 'example',
});
assert.ok(!badMappingResult.ok);

// --- designOnly false in example mode ---
const notDesign = cloneLeveredEtfExample();
(notDesign as { designOnly: boolean }).designOnly = false;
const notDesignResult = validateLeveredEtfRebalancePressureArtifact(notDesign, { mode: 'example' });
assert.ok(!notDesignResult.ok);

console.log('ghostflow/leveredEtfRebalancePressure.test.ts: ok');
