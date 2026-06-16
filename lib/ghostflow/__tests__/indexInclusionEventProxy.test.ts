/**
 * Index inclusion event proxy artifact — design-only validator tests (v1.9c.3).
 */

import assert from 'node:assert/strict';
import { validateIndexInclusionEventProxyArtifact } from '@/lib/ghostflow/artifacts/indexInclusionEventProxy';
import {
  cloneIndexInclusionEventExample,
  FIXTURE_INDEX_INCLUSION_EVENT_EXAMPLE,
  FIXTURE_INDEX_INCLUSION_REFERENCE_ASOF,
} from '@/lib/ghostflow/__tests__/fixtures/indexInclusionEventProxy';

// --- example validates in example mode ---
const exampleOk = validateIndexInclusionEventProxyArtifact(FIXTURE_INDEX_INCLUSION_EVENT_EXAMPLE, {
  mode: 'example',
  referenceAsOf: FIXTURE_INDEX_INCLUSION_REFERENCE_ASOF,
});
assert.ok(exampleOk.ok, exampleOk.ok ? '' : exampleOk.errors.join('; '));

// --- example fails in production mode (designOnly) ---
const prodFail = validateIndexInclusionEventProxyArtifact(FIXTURE_INDEX_INCLUSION_EVENT_EXAMPLE, {
  mode: 'production',
});
assert.ok(!prodFail.ok);
assert.ok(prodFail.errors.some((e) => e.includes('designOnly')));

// --- wrong signalId fails ---
const wrongId = cloneIndexInclusionEventExample();
wrongId.signalId = 'wrong-signal' as typeof wrongId.signalId;
const wrongIdResult = validateIndexInclusionEventProxyArtifact(wrongId, { mode: 'example' });
assert.ok(!wrongIdResult.ok);
assert.ok(wrongIdResult.errors.some((e) => e.includes('signalId')));

// --- wrong observationType fails ---
const wrongObsType = cloneIndexInclusionEventExample();
wrongObsType.observationType = 'wrong_type' as typeof wrongObsType.observationType;
const wrongObsTypeResult = validateIndexInclusionEventProxyArtifact(wrongObsType, {
  mode: 'example',
});
assert.ok(!wrongObsTypeResult.ok);
assert.ok(wrongObsTypeResult.errors.some((e) => e.includes('observationType')));

// --- wrong seriesDefinition fails ---
const wrongSeries = cloneIndexInclusionEventExample();
wrongSeries.seriesDefinition = 'wrong_series' as typeof wrongSeries.seriesDefinition;
const wrongSeriesResult = validateIndexInclusionEventProxyArtifact(wrongSeries, { mode: 'example' });
assert.ok(!wrongSeriesResult.ok);
assert.ok(wrongSeriesResult.errors.some((e) => e.includes('seriesDefinition')));

// --- root mappingStatus other than not_final fails ---
const badRootMapping = cloneIndexInclusionEventExample();
(badRootMapping as { mappingStatus: string }).mappingStatus = 'final';
const badRootMappingResult = validateIndexInclusionEventProxyArtifact(badRootMapping, {
  mode: 'example',
});
assert.ok(!badRootMappingResult.ok);
assert.ok(badRootMappingResult.errors.some((e) => e.includes('mappingStatus')));

// --- observations mappingStatus other than not_final fails ---
const badObsMapping = cloneIndexInclusionEventExample();
(badObsMapping.observations as { mappingStatus: string }).mappingStatus = 'final';
const badObsMappingResult = validateIndexInclusionEventProxyArtifact(badObsMapping, {
  mode: 'example',
});
assert.ok(!badObsMappingResult.ok);
assert.ok(badObsMappingResult.errors.some((e) => e.includes('mappingStatus')));

// --- eventCount mismatch fails ---
const badEventCount = cloneIndexInclusionEventExample();
badEventCount.observations.eventCount = 99;
const badEventCountResult = validateIndexInclusionEventProxyArtifact(badEventCount, {
  mode: 'example',
});
assert.ok(!badEventCountResult.ok);
assert.ok(badEventCountResult.errors.some((e) => e.includes('eventCount')));

// --- sourceEventCount mismatch fails ---
const badSourceCount = cloneIndexInclusionEventExample();
badSourceCount.observations.sourceEventCount = 99;
const badSourceCountResult = validateIndexInclusionEventProxyArtifact(badSourceCount, {
  mode: 'example',
});
assert.ok(!badSourceCountResult.ok);
assert.ok(badSourceCountResult.errors.some((e) => e.includes('sourceEventCount')));

// --- dated event count reconciliation mismatch fails ---
const badReconcile = cloneIndexInclusionEventExample();
badReconcile.observations.upcomingEventCount = 0;
const badReconcileResult = validateIndexInclusionEventProxyArtifact(badReconcile, {
  mode: 'example',
});
assert.ok(!badReconcileResult.ok);
assert.ok(
  badReconcileResult.errors.some(
    (e) => e.includes('upcomingEventCount') || e.includes('recentEventCount')
  )
);

// --- missing required event field fails ---
const missingTicker = cloneIndexInclusionEventExample();
delete (missingTicker.observations.events[0] as { ticker?: string }).ticker;
const missingTickerResult = validateIndexInclusionEventProxyArtifact(missingTicker, {
  mode: 'example',
});
assert.ok(!missingTickerResult.ok);
assert.ok(missingTickerResult.errors.some((e) => e.includes('ticker')));

// --- floatEstimateAvailable: true fails ---
const floatTrue = cloneIndexInclusionEventExample();
floatTrue.observations.events[0].floatEstimateAvailable = true;
const floatTrueResult = validateIndexInclusionEventProxyArtifact(floatTrue, { mode: 'example' });
assert.ok(!floatTrueResult.ok);
assert.ok(floatTrueResult.errors.some((e) => e.includes('floatEstimateAvailable')));

// --- demandEstimateAvailable: true fails ---
const demandTrue = cloneIndexInclusionEventExample();
demandTrue.observations.events[0].demandEstimateAvailable = true;
const demandTrueResult = validateIndexInclusionEventProxyArtifact(demandTrue, { mode: 'example' });
assert.ok(!demandTrueResult.ok);
assert.ok(demandTrueResult.errors.some((e) => e.includes('demandEstimateAvailable')));

// --- operatorVerified: false fails ---
const notVerified = cloneIndexInclusionEventExample();
notVerified.observations.events[0].operatorVerified = false;
const notVerifiedResult = validateIndexInclusionEventProxyArtifact(notVerified, { mode: 'example' });
assert.ok(!notVerifiedResult.ok);
assert.ok(notVerifiedResult.errors.some((e) => e.includes('operatorVerified')));

// --- publicPassiveInputKey at root fails ---
const passiveKey = cloneIndexInclusionEventExample() as Record<string, unknown>;
passiveKey.publicPassiveInputKey = 'concentration';
const passiveKeyResult = validateIndexInclusionEventProxyArtifact(passiveKey, { mode: 'example' });
assert.ok(!passiveKeyResult.ok);
assert.ok(passiveKeyResult.errors.some((e) => e.includes('publicPassiveInputKey')));

// --- mappedPressureScore forbidden ---
const mappedRoot = cloneIndexInclusionEventExample() as Record<string, unknown>;
mappedRoot.mappedPressureScore = 60;
const mappedRootResult = validateIndexInclusionEventProxyArtifact(mappedRoot, { mode: 'example' });
assert.ok(!mappedRootResult.ok);
assert.ok(mappedRootResult.errors.some((e) => e.includes('mappedPressureScore')));

// --- candidatePressureScore forbidden ---
const candidateObs = cloneIndexInclusionEventExample();
(candidateObs.observations as Record<string, unknown>).candidatePressureScore = 55;
const candidateObsResult = validateIndexInclusionEventProxyArtifact(candidateObs, { mode: 'example' });
assert.ok(!candidateObsResult.ok);
assert.ok(candidateObsResult.errors.some((e) => e.includes('candidatePressureScore')));

// --- basketScore forbidden ---
const basketRoot = cloneIndexInclusionEventExample() as Record<string, unknown>;
basketRoot.basketScore = 60;
const basketRootResult = validateIndexInclusionEventProxyArtifact(basketRoot, { mode: 'example' });
assert.ok(!basketRootResult.ok);
assert.ok(basketRootResult.errors.some((e) => e.includes('basketScore')));

// --- floatAbsorptionScore forbidden ---
const absorptionEvent = cloneIndexInclusionEventExample();
(absorptionEvent.observations.events[0] as Record<string, unknown>).floatAbsorptionScore = 70;
const absorptionEventResult = validateIndexInclusionEventProxyArtifact(absorptionEvent, {
  mode: 'example',
});
assert.ok(!absorptionEventResult.ok);
assert.ok(absorptionEventResult.errors.some((e) => e.includes('floatAbsorptionScore')));

// --- numericValue at root fails ---
const numericRoot = cloneIndexInclusionEventExample() as Record<string, unknown>;
numericRoot.numericValue = 62;
const numericRootResult = validateIndexInclusionEventProxyArtifact(numericRoot, { mode: 'example' });
assert.ok(!numericRootResult.ok);
assert.ok(numericRootResult.errors.some((e) => e.includes('numericValue')));

// --- empty event window passes ---
const emptyWindow = cloneIndexInclusionEventExample();
emptyWindow.observations.events = [];
emptyWindow.observations.eventCount = 0;
emptyWindow.observations.upcomingEventCount = 0;
emptyWindow.observations.recentEventCount = 0;
emptyWindow.observations.majorIndexEventCount = 0;
emptyWindow.observations.sourceEventCount = 0;
const emptyWindowResult = validateIndexInclusionEventProxyArtifact(emptyWindow, { mode: 'example' });
assert.ok(emptyWindowResult.ok, emptyWindowResult.ok ? '' : emptyWindowResult.errors.join('; '));

// --- effectiveDate: null with empty notes fails ---
const nullNoNotes = cloneIndexInclusionEventExample();
nullNoNotes.observations.events[0].effectiveDate = null;
nullNoNotes.observations.events[0].notes = '';
const nullNoNotesResult = validateIndexInclusionEventProxyArtifact(nullNoNotes, { mode: 'example' });
assert.ok(!nullNoNotesResult.ok);
assert.ok(nullNoNotesResult.errors.some((e) => e.includes('notes')));

// --- effectiveDate: null with notes passes and skips dated count reconciliation ---
const nullWithNotes = cloneIndexInclusionEventExample();
nullWithNotes.observations.events[0].effectiveDate = null;
nullWithNotes.observations.events[0].notes = 'Effective date pending official confirmation.';
nullWithNotes.observations.upcomingEventCount = 1;
nullWithNotes.observations.recentEventCount = 1;
const nullWithNotesResult = validateIndexInclusionEventProxyArtifact(nullWithNotes, {
  mode: 'example',
});
assert.ok(nullWithNotesResult.ok, nullWithNotesResult.ok ? '' : nullWithNotesResult.errors.join('; '));

// --- publishedAt before asOf fails ---
const pubBefore = cloneIndexInclusionEventExample();
pubBefore.publishedAt = '2026-06-14';
pubBefore.asOf = '2026-06-15';
const pubBeforeResult = validateIndexInclusionEventProxyArtifact(pubBefore, { mode: 'example' });
assert.ok(!pubBeforeResult.ok);
assert.ok(pubBeforeResult.errors.some((e) => e.includes('publishedAt')));

// --- eventWindowStart > eventWindowEnd fails ---
const badWindow = cloneIndexInclusionEventExample();
badWindow.observations.eventWindowStart = '2026-07-31';
badWindow.observations.eventWindowEnd = '2026-05-01';
const badWindowResult = validateIndexInclusionEventProxyArtifact(badWindow, { mode: 'example' });
assert.ok(!badWindowResult.ok);
assert.ok(badWindowResult.errors.some((e) => e.includes('eventWindowStart')));

console.log('indexInclusionEventProxy.test.ts: all assertions passed');
