/**
 * Cap-weight premium proxy artifact — design-only validator tests (v1.9b.3).
 */

import assert from 'node:assert/strict';
import { validateCapWeightPremiumProxyArtifact } from '@/lib/ghostflow/artifacts/capWeightPremiumProxy';
import {
  cloneCapWeightPremiumExample,
  FIXTURE_CAP_WEIGHT_PREMIUM_EXAMPLE,
  FIXTURE_CAP_WEIGHT_PREMIUM_REFERENCE_ASOF,
} from '@/lib/ghostflow/__tests__/fixtures/capWeightPremiumProxy';

// --- example validates in example mode ---
const exampleOk = validateCapWeightPremiumProxyArtifact(FIXTURE_CAP_WEIGHT_PREMIUM_EXAMPLE, {
  mode: 'example',
  referenceAsOf: FIXTURE_CAP_WEIGHT_PREMIUM_REFERENCE_ASOF,
});
assert.ok(exampleOk.ok, exampleOk.ok ? '' : exampleOk.errors.join('; '));

// --- example fails in production mode (designOnly) ---
const prodFail = validateCapWeightPremiumProxyArtifact(FIXTURE_CAP_WEIGHT_PREMIUM_EXAMPLE, {
  mode: 'production',
});
assert.ok(!prodFail.ok);
assert.ok(prodFail.errors.some((e) => e.includes('designOnly')));

// --- wrong signalId fails ---
const wrongId = cloneCapWeightPremiumExample();
wrongId.signalId = 'wrong-signal' as typeof wrongId.signalId;
const wrongIdResult = validateCapWeightPremiumProxyArtifact(wrongId, { mode: 'example' });
assert.ok(!wrongIdResult.ok);
assert.ok(wrongIdResult.errors.some((e) => e.includes('signalId')));

// --- missing observations fails ---
const noObs = cloneCapWeightPremiumExample() as Record<string, unknown>;
delete noObs.observations;
const noObsResult = validateCapWeightPremiumProxyArtifact(noObs, { mode: 'example' });
assert.ok(!noObsResult.ok);
assert.ok(noObsResult.errors.some((e) => e.includes('observations')));

// --- percentile outside 0–100 fails ---
const badPct = cloneCapWeightPremiumExample();
badPct.observations.ratioPercentile = 101;
const badPctResult = validateCapWeightPremiumProxyArtifact(badPct, { mode: 'example' });
assert.ok(!badPctResult.ok);
assert.ok(badPctResult.errors.some((e) => e.includes('ratioPercentile')));

// --- non-positive prices fail ---
const badSpy = cloneCapWeightPremiumExample();
badSpy.observations.spyAdjustedClose = 0;
const badSpyResult = validateCapWeightPremiumProxyArtifact(badSpy, { mode: 'example' });
assert.ok(!badSpyResult.ok);
assert.ok(badSpyResult.errors.some((e) => e.includes('spyAdjustedClose')));

// --- mappingStatus other than not_final fails ---
const badMapping = cloneCapWeightPremiumExample();
(badMapping.observations as { mappingStatus: string }).mappingStatus = 'final';
const badMappingResult = validateCapWeightPremiumProxyArtifact(badMapping, { mode: 'example' });
assert.ok(!badMappingResult.ok);
assert.ok(badMappingResult.errors.some((e) => e.includes('mappingStatus')));

// --- publicPassiveInputKey at root fails ---
const passiveKey = cloneCapWeightPremiumExample() as Record<string, unknown>;
passiveKey.publicPassiveInputKey = 'concentration';
const passiveKeyResult = validateCapWeightPremiumProxyArtifact(passiveKey, { mode: 'example' });
assert.ok(!passiveKeyResult.ok);
assert.ok(passiveKeyResult.errors.some((e) => e.includes('publicPassiveInputKey')));

// --- basketScore at root fails ---
const basketRoot = cloneCapWeightPremiumExample() as Record<string, unknown>;
basketRoot.basketScore = 60;
const basketRootResult = validateCapWeightPremiumProxyArtifact(basketRoot, { mode: 'example' });
assert.ok(!basketRootResult.ok);
assert.ok(basketRootResult.errors.some((e) => e.includes('basketScore')));

// --- basketScore in observations fails ---
const basketObs = cloneCapWeightPremiumExample();
(basketObs.observations as Record<string, unknown>).basketScore = 55;
const basketObsResult = validateCapWeightPremiumProxyArtifact(basketObs, { mode: 'example' });
assert.ok(!basketObsResult.ok);
assert.ok(basketObsResult.errors.some((e) => e.includes('basketScore')));

// --- mappedPressureScore forbidden ---
const mappedRoot = cloneCapWeightPremiumExample() as Record<string, unknown>;
mappedRoot.mappedPressureScore = 60;
const mappedRootResult = validateCapWeightPremiumProxyArtifact(mappedRoot, { mode: 'example' });
assert.ok(!mappedRootResult.ok);
assert.ok(mappedRootResult.errors.some((e) => e.includes('mappedPressureScore')));

// --- candidatePressureScore forbidden ---
const candidateObs = cloneCapWeightPremiumExample();
(candidateObs.observations as Record<string, unknown>).candidatePressureScore = 55;
const candidateObsResult = validateCapWeightPremiumProxyArtifact(candidateObs, { mode: 'example' });
assert.ok(!candidateObsResult.ok);
assert.ok(candidateObsResult.errors.some((e) => e.includes('candidatePressureScore')));

// --- numericValue at root fails ---
const numericRoot = cloneCapWeightPremiumExample() as Record<string, unknown>;
numericRoot.numericValue = 62;
const numericRootResult = validateCapWeightPremiumProxyArtifact(numericRoot, { mode: 'example' });
assert.ok(!numericRootResult.ok);
assert.ok(numericRootResult.errors.some((e) => e.includes('numericValue')));

// --- missing designOnly fails in example mode ---
const noDesign = cloneCapWeightPremiumExample();
delete (noDesign as { designOnly?: true }).designOnly;
const noDesignResult = validateCapWeightPremiumProxyArtifact(noDesign, { mode: 'example' });
assert.ok(!noDesignResult.ok);
assert.ok(noDesignResult.errors.some((e) => e.includes('designOnly')));

// --- publishedAt before asOf fails ---
const pubBefore = cloneCapWeightPremiumExample();
pubBefore.publishedAt = '2026-06-14';
pubBefore.asOf = '2026-06-15';
const pubBeforeResult = validateCapWeightPremiumProxyArtifact(pubBefore, { mode: 'example' });
assert.ok(!pubBeforeResult.ok);
assert.ok(pubBeforeResult.errors.some((e) => e.includes('publishedAt')));

// --- overlapStart > overlapEnd fails ---
const badOverlap = cloneCapWeightPremiumExample();
badOverlap.observations.overlapStart = '2026-06-15';
badOverlap.observations.overlapEnd = '2003-05-01';
const badOverlapResult = validateCapWeightPremiumProxyArtifact(badOverlap, { mode: 'example' });
assert.ok(!badOverlapResult.ok);
assert.ok(badOverlapResult.errors.some((e) => e.includes('overlapStart')));

// --- latestDate > asOf fails ---
const badLatest = cloneCapWeightPremiumExample();
badLatest.observations.latestDate = '2026-06-16';
badLatest.asOf = '2026-06-15';
const badLatestResult = validateCapWeightPremiumProxyArtifact(badLatest, { mode: 'example' });
assert.ok(!badLatestResult.ok);
assert.ok(badLatestResult.errors.some((e) => e.includes('latestDate')));

// --- bad spyRspRatio reconciliation fails ---
const badRatio = cloneCapWeightPremiumExample();
badRatio.observations.spyRspRatio = 9.99;
const badRatioResult = validateCapWeightPremiumProxyArtifact(badRatio, { mode: 'example' });
assert.ok(!badRatioResult.ok);
assert.ok(badRatioResult.errors.some((e) => e.includes('spyRspRatio')));

// --- priceColumnUsed not adjusted fails in example mode ---
const badPriceCol = cloneCapWeightPremiumExample();
badPriceCol.observations.priceColumnUsed = { spy: 'close', rsp: 'adjusted' };
const badPriceColResult = validateCapWeightPremiumProxyArtifact(badPriceCol, { mode: 'example' });
assert.ok(!badPriceColResult.ok);
assert.ok(badPriceColResult.errors.some((e) => e.includes('priceColumnUsed.spy')));

console.log('capWeightPremiumProxy.test.ts: all assertions passed');
