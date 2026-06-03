/**
 * Options activity proxy artifact — design-only validator and helpers (v1.4c).
 */

import assert from 'node:assert/strict';
import {
  computeDailyChangePct,
  computeIndexShareOfTotalPct,
  formatOptionsActivityDisplayValue,
  reconcileDailyChangePct,
  reconcileIndexSharePct,
  validateOptionsActivityProxyArtifact,
} from '@/lib/ghostflow/artifacts/optionsActivityProxy';
import {
  cloneOptionsActivityExample,
  FIXTURE_OPTIONS_ACTIVITY_EXAMPLE,
  FIXTURE_OPTIONS_ACTIVITY_REFERENCE_ASOF,
} from '@/lib/ghostflow/__tests__/fixtures/optionsActivityProxy';

// --- example validates in example mode ---
const exampleOk = validateOptionsActivityProxyArtifact(FIXTURE_OPTIONS_ACTIVITY_EXAMPLE, {
  mode: 'example',
  referenceAsOf: FIXTURE_OPTIONS_ACTIVITY_REFERENCE_ASOF,
});
assert.ok(exampleOk.ok, exampleOk.ok ? '' : exampleOk.errors.join('; '));

// --- production mode rejects designOnly: true ---
const prodFail = validateOptionsActivityProxyArtifact(FIXTURE_OPTIONS_ACTIVITY_EXAMPLE, {
  mode: 'production',
});
assert.ok(!prodFail.ok);
assert.ok(prodFail.errors.some((e) => e.includes('designOnly')));

// --- missing source URL fails ---
const noUrl = cloneOptionsActivityExample();
(noUrl.source as { url?: string }).url = '';
const noUrlResult = validateOptionsActivityProxyArtifact(noUrl, { mode: 'example' });
assert.ok(!noUrlResult.ok);
assert.ok(noUrlResult.errors.some((e) => e.includes('source.url')));

// --- bad dates fail ---
const badDate = cloneOptionsActivityExample();
badDate.asOf = 'not-a-date';
const badDateResult = validateOptionsActivityProxyArtifact(badDate, { mode: 'example' });
assert.ok(!badDateResult.ok);
assert.ok(badDateResult.errors.some((e) => e.includes('asOf')));

// --- publishedAt before asOf fails ---
const pubBefore = cloneOptionsActivityExample();
pubBefore.publishedAt = '2026-05-20';
pubBefore.asOf = '2026-05-22';
const pubBeforeResult = validateOptionsActivityProxyArtifact(pubBefore, { mode: 'example' });
assert.ok(!pubBeforeResult.ok);
assert.ok(pubBeforeResult.errors.some((e) => e.includes('publishedAt')));

// --- negative contract count fails ---
const negative = cloneOptionsActivityExample();
negative.observations.totalOptionsContracts = -1;
const negativeResult = validateOptionsActivityProxyArtifact(negative, { mode: 'example' });
assert.ok(!negativeResult.ok);
assert.ok(negativeResult.errors.some((e) => e.includes('totalOptionsContracts')));

// --- non-integer contract count fails ---
const nonInt = cloneOptionsActivityExample();
nonInt.observations.indexOptionsContracts = 12.5;
const nonIntResult = validateOptionsActivityProxyArtifact(nonInt, { mode: 'example' });
assert.ok(!nonIntResult.ok);
assert.ok(nonIntResult.errors.some((e) => e.includes('indexOptionsContracts')));

// --- index > total fails ---
const indexGtTotal = cloneOptionsActivityExample();
indexGtTotal.observations.indexOptionsContracts = 90_000_000;
const indexGtTotalResult = validateOptionsActivityProxyArtifact(indexGtTotal, {
  mode: 'example',
});
assert.ok(!indexGtTotalResult.ok);
assert.ok(indexGtTotalResult.errors.some((e) => e.includes('cannot exceed')));

// --- wrong indexShareOfTotalPct fails ---
const badShare = cloneOptionsActivityExample();
badShare.observations.indexShareOfTotalPct = 50;
const badShareResult = validateOptionsActivityProxyArtifact(badShare, { mode: 'example' });
assert.ok(!badShareResult.ok);
assert.ok(badShareResult.errors.some((e) => e.includes('indexShareOfTotalPct')));

// --- wrong indexOptionsDailyChangePct fails ---
const badDaily = cloneOptionsActivityExample();
badDaily.observations.indexOptionsDailyChangePct = 10;
const badDailyResult = validateOptionsActivityProxyArtifact(badDaily, { mode: 'example' });
assert.ok(!badDailyResult.ok);
assert.ok(badDailyResult.errors.some((e) => e.includes('indexOptionsDailyChangePct')));

// --- putCallRatio <= 0 fails ---
const badPcr = cloneOptionsActivityExample();
badPcr.observations.putCallRatio = 0;
const badPcrResult = validateOptionsActivityProxyArtifact(badPcr, { mode: 'example' });
assert.ok(!badPcrResult.ok);
assert.ok(badPcrResult.errors.some((e) => e.includes('putCallRatio')));

// --- mappedPressureScore forbidden (root) ---
const mappedRoot = cloneOptionsActivityExample() as Record<string, unknown>;
mappedRoot.mappedPressureScore = 60;
const mappedRootResult = validateOptionsActivityProxyArtifact(mappedRoot, { mode: 'example' });
assert.ok(!mappedRootResult.ok);
assert.ok(mappedRootResult.errors.some((e) => e.includes('mappedPressureScore')));

// --- candidatePressureScore forbidden (observations) ---
const candidateObs = cloneOptionsActivityExample();
(candidateObs.observations as Record<string, unknown>).candidatePressureScore = 55;
const candidateObsResult = validateOptionsActivityProxyArtifact(candidateObs, { mode: 'example' });
assert.ok(!candidateObsResult.ok);
assert.ok(candidateObsResult.errors.some((e) => e.includes('candidatePressureScore')));

// --- populated zeroDteSharePct fails ---
const zeroDte = cloneOptionsActivityExample() as Record<string, unknown>;
zeroDte.zeroDteSharePct = 12;
const zeroDteResult = validateOptionsActivityProxyArtifact(zeroDte, { mode: 'example' });
assert.ok(!zeroDteResult.ok);
assert.ok(zeroDteResult.errors.some((e) => e.includes('zeroDteSharePct')));

// --- populated gammaExposureProxy fails ---
const gamma = cloneOptionsActivityExample();
(gamma.observations as Record<string, unknown>).gammaExposureProxy = 1e9;
const gammaResult = validateOptionsActivityProxyArtifact(gamma, { mode: 'example' });
assert.ok(!gammaResult.ok);
assert.ok(gammaResult.errors.some((e) => e.includes('gammaExposureProxy')));

// --- populated sameDayExpiryVolume fails ---
const sameDay = cloneOptionsActivityExample();
(sameDay as Record<string, unknown>).sameDayExpiryVolume = 1000;
const sameDayResult = validateOptionsActivityProxyArtifact(sameDay, { mode: 'example' });
assert.ok(!sameDayResult.ok);
assert.ok(sameDayResult.errors.some((e) => e.includes('sameDayExpiryVolume')));

// --- wrong signalId / observationType / seriesDefinition ---
const wrongSignal = cloneOptionsActivityExample();
(wrongSignal as { signalId: string }).signalId = 'odte-options';
const wrongSignalResult = validateOptionsActivityProxyArtifact(wrongSignal, { mode: 'example' });
assert.ok(!wrongSignalResult.ok);
assert.ok(wrongSignalResult.errors.some((e) => e.includes('signalId')));

const wrongObsType = cloneOptionsActivityExample();
(wrongObsType as { observationType: string }).observationType = 'aggregate_volume';
const wrongObsTypeResult = validateOptionsActivityProxyArtifact(wrongObsType, { mode: 'example' });
assert.ok(!wrongObsTypeResult.ok);
assert.ok(wrongObsTypeResult.errors.some((e) => e.includes('observationType')));

const wrongSeries = cloneOptionsActivityExample();
(wrongSeries as { seriesDefinition: string }).seriesDefinition = 'cboe_0dte_v1';
const wrongSeriesResult = validateOptionsActivityProxyArtifact(wrongSeries, { mode: 'example' });
assert.ok(!wrongSeriesResult.ok);
assert.ok(wrongSeriesResult.errors.some((e) => e.includes('seriesDefinition')));

// --- helper functions ---
assert.strictEqual(
  computeIndexShareOfTotalPct(12_884_221, 83_203_970),
  (12_884_221 / 83_203_970) * 100
);
assert.strictEqual(computeDailyChangePct(12_884_221, 12_650_110), ((12_884_221 - 12_650_110) / 12_650_110) * 100);
assert.ok(reconcileIndexSharePct(15.49, 12_884_221, 83_203_970));
assert.ok(reconcileDailyChangePct(1.85, 12_884_221, 12_650_110));
assert.ok(formatOptionsActivityDisplayValue(FIXTURE_OPTIONS_ACTIVITY_EXAMPLE.observations).includes('index contracts'));

console.log('ghostflow/optionsActivityProxy.test.ts: ok');
