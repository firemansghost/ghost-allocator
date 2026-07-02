/**
 * GhostFlow v1.2b/c — Retirement flow pressure proxy artifact tests (no network).
 */

import assert from 'assert';
import productionArtifact from '@/data/ghostflow/artifacts/retirementFlowPressureProxy.v1.json';
import {
  computeQuarterOverQuarterAssetGrowthPct,
  computeYearOverYearAssetGrowthPct,
  loadRetirementFlowPressureProxyArtifact,
  validateRetirementFlowPressureProxyArtifact,
} from '../artifacts/retirementFlowPressureProxy';
import type { RetirementFlowPressureArtifactV1 } from '../artifacts/types';
import {
  cloneRetirementFlowExample,
  FIXTURE_RETIREMENT_FLOW_EXAMPLE,
  FIXTURE_RETIREMENT_FLOW_REFERENCE_AS_OF,
} from './fixtures/retirementFlowPressureProxy';

const production = productionArtifact as RetirementFlowPressureArtifactV1;

// --- Growth helpers ---
const qoq = computeQuarterOverQuarterAssetGrowthPct(45, 44);
assert.ok(Math.abs(qoq - 2.272727) < 0.001);

const yoy = computeYearOverYearAssetGrowthPct(45, 42);
assert.ok(Math.abs(yoy - 7.142857) < 0.001);

// --- Example validates (example mode) ---
const valid = validateRetirementFlowPressureProxyArtifact(
  FIXTURE_RETIREMENT_FLOW_EXAMPLE,
  { mode: 'example', referenceAsOf: FIXTURE_RETIREMENT_FLOW_REFERENCE_AS_OF }
);
assert.ok(valid.ok, valid.ok ? '' : valid.errors.join('; '));

// --- Production artifact validates (production mode) ---
const prodValid = validateRetirementFlowPressureProxyArtifact(production, {
  mode: 'production',
  referenceAsOf: FIXTURE_RETIREMENT_FLOW_REFERENCE_AS_OF,
});
assert.ok(prodValid.ok, prodValid.ok ? '' : prodValid.errors.join('; '));
assert.strictEqual(production.designOnly, undefined);
assert.strictEqual(production.dataQuality, 'verified_manual');
assert.ok(
  production.source.note?.includes('display-only') &&
    production.source.note?.includes('retirement-asset-growth') &&
    production.source.note?.includes('MOCK 58')
);
assert.strictEqual(production.asOf, '2026-03-31');
assert.strictEqual(production.publishedAt, '2026-06-18');
assert.strictEqual(production.observations.totalRetirementMarketAssetsTrillionsUsd, 47.6);

// --- Loader returns ok ---
const loaded = loadRetirementFlowPressureProxyArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

// --- designOnly false fails in example mode ---
const noDesign = cloneRetirementFlowExample();
delete (noDesign as { designOnly?: true }).designOnly;
const noDesignResult = validateRetirementFlowPressureProxyArtifact(noDesign, {
  mode: 'example',
});
assert.ok(!noDesignResult.ok);
assert.ok(noDesignResult.errors.some((e) => e.includes('designOnly')));

// --- missing source.url fails ---
const noUrl = cloneRetirementFlowExample();
noUrl.source = { ...noUrl.source, url: '' };
const noUrlResult = validateRetirementFlowPressureProxyArtifact(noUrl, { mode: 'example' });
assert.ok(!noUrlResult.ok);
assert.ok(noUrlResult.errors.some((e) => e.includes('source.url')));

// --- bad ISO date fails ---
const badDate = cloneRetirementFlowExample();
badDate.asOf = 'not-a-date';
const badDateResult = validateRetirementFlowPressureProxyArtifact(badDate, { mode: 'example' });
assert.ok(!badDateResult.ok);
assert.ok(badDateResult.errors.some((e) => e.includes('asOf')));

// --- publishedAt before asOf fails ---
const pubBefore = cloneRetirementFlowExample();
pubBefore.publishedAt = '2025-01-01';
pubBefore.asOf = '2025-12-31';
const pubBeforeResult = validateRetirementFlowPressureProxyArtifact(pubBefore, {
  mode: 'example',
});
assert.ok(!pubBeforeResult.ok);
assert.ok(pubBeforeResult.errors.some((e) => e.includes('publishedAt')));

// --- negative total assets fails (production clone) ---
const negative = JSON.parse(JSON.stringify(production)) as RetirementFlowPressureArtifactV1;
negative.observations.totalRetirementMarketAssetsTrillionsUsd = -1;
const negativeResult = validateRetirementFlowPressureProxyArtifact(negative, {
  mode: 'production',
});
assert.ok(!negativeResult.ok);
assert.ok(
  negativeResult.errors.some((e) => e.includes('totalRetirementMarketAssetsTrillionsUsd'))
);

// --- mappingStatus final fails (production) ---
const finalMapping = JSON.parse(JSON.stringify(production)) as RetirementFlowPressureArtifactV1;
(finalMapping.observations as { mappingStatus: string }).mappingStatus = 'final';
const finalResult = validateRetirementFlowPressureProxyArtifact(finalMapping, {
  mode: 'production',
});
assert.ok(!finalResult.ok);
assert.ok(finalResult.errors.some((e) => e.includes('mappingStatus')));

// --- mappedPressureScore fails ---
const mappedRoot = cloneRetirementFlowExample() as Record<string, unknown>;
mappedRoot.mappedPressureScore = 60;
const mappedRootResult = validateRetirementFlowPressureProxyArtifact(mappedRoot, {
  mode: 'example',
});
assert.ok(!mappedRootResult.ok);
assert.ok(mappedRootResult.errors.some((e) => e.includes('mappedPressureScore')));

const mappedProd = JSON.parse(JSON.stringify(production)) as Record<string, unknown>;
mappedProd.mappedPressureScore = 60;
const mappedProdResult = validateRetirementFlowPressureProxyArtifact(mappedProd, {
  mode: 'production',
});
assert.ok(!mappedProdResult.ok);

const mappedObs = cloneRetirementFlowExample();
(mappedObs.observations as Record<string, unknown>).mappedPressureScore = 60;
const mappedObsResult = validateRetirementFlowPressureProxyArtifact(mappedObs, {
  mode: 'example',
});
assert.ok(!mappedObsResult.ok);
assert.ok(mappedObsResult.errors.some((e) => e.includes('mappedPressureScore')));

// --- candidatePressureScore fails ---
const candidate = cloneRetirementFlowExample() as Record<string, unknown>;
candidate.candidatePressureScore = 55;
const candidateResult = validateRetirementFlowPressureProxyArtifact(candidate, {
  mode: 'example',
});
assert.ok(!candidateResult.ok);
assert.ok(candidateResult.errors.some((e) => e.includes('candidatePressureScore')));

// --- growth reconciliation catches mismatch ---
const mismatch = cloneRetirementFlowExample();
mismatch.observations.quarterOverQuarterAssetGrowthPct = 10;
const mismatchResult = validateRetirementFlowPressureProxyArtifact(mismatch, { mode: 'example' });
assert.ok(!mismatchResult.ok);
assert.ok(mismatchResult.errors.some((e) => e.includes('quarterOverQuarter')));

// --- example fails production mode (designOnly) ---
const exampleProdFail = validateRetirementFlowPressureProxyArtifact(
  FIXTURE_RETIREMENT_FLOW_EXAMPLE,
  { mode: 'production' }
);
assert.ok(!exampleProdFail.ok);
assert.ok(exampleProdFail.errors.some((e) => e.includes('designOnly')));

// --- production with designOnly true fails production mode ---
const prodWithDesign = { ...production, designOnly: true as const };
const prodDesignFail = validateRetirementFlowPressureProxyArtifact(prodWithDesign, {
  mode: 'production',
});
assert.ok(!prodDesignFail.ok);
assert.ok(prodDesignFail.errors.some((e) => e.includes('designOnly')));

console.log('ghostflow/retirementFlowPressureProxy.test.ts: ok');
