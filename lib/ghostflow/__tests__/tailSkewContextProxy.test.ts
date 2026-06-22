/**
 * Tail Skew Context artifact — validator tests (v1.9e.3 example + v1.9e.4 production).
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  computeTailSkewDailyChange,
  computeTailSkewDailyChangePct,
  loadTailSkewContextArtifact,
  reconcileTailSkewDailyChange,
  reconcileTailSkewDailyChangePct,
  SKEW_CHANGE_TOLERANCE,
  TAIL_SKEW_CBOE_CSV_URL,
  TAIL_SKEW_PRODUCTION_ARTIFACT_PATH,
  validateTailSkewContextArtifact,
} from '@/lib/ghostflow/artifacts/tailSkewContext';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import {
  cloneTailSkewExample,
  FIXTURE_TAIL_SKEW_EXAMPLE,
  FIXTURE_TAIL_SKEW_REFERENCE_ASOF,
} from '@/lib/ghostflow/__tests__/fixtures/tailSkewContextProxy';

// --- valid example validates in example mode ---
const exampleOk = validateTailSkewContextArtifact(FIXTURE_TAIL_SKEW_EXAMPLE, {
  mode: 'example',
  referenceAsOf: FIXTURE_TAIL_SKEW_REFERENCE_ASOF,
});
assert.ok(exampleOk.ok, exampleOk.ok ? '' : exampleOk.errors.join('; '));

// --- example fails in production mode (designOnly) ---
const prodFail = validateTailSkewContextArtifact(FIXTURE_TAIL_SKEW_EXAMPLE, {
  mode: 'production',
});
assert.ok(!prodFail.ok);
assert.ok(prodFail.errors.some((e) => e.includes('designOnly')));

// --- production JSON validates in production mode ---
const productionPath = join(process.cwd(), TAIL_SKEW_PRODUCTION_ARTIFACT_PATH);
assert.ok(existsSync(productionPath), 'Production tailSkewContext.v1.json must exist in v1.9e.4');

const productionOk = loadTailSkewContextArtifact();
assert.ok(productionOk.ok, productionOk.ok ? '' : productionOk.errors.join('; '));
assert.strictEqual(productionOk.artifact.asOf, GHOSTFLOW_REFERENCE_AS_OF);
assert.strictEqual(productionOk.artifact.observations.currentSkew, 137.39);

// --- wrong signalId fails ---
const wrongId = cloneTailSkewExample();
wrongId.signalId = 'wrong-signal' as typeof wrongId.signalId;
const wrongIdResult = validateTailSkewContextArtifact(wrongId, { mode: 'example' });
assert.ok(!wrongIdResult.ok);
assert.ok(wrongIdResult.errors.some((e) => e.includes('signalId')));

// --- wrong observationType fails ---
const wrongObsType = cloneTailSkewExample();
(wrongObsType as { observationType: string }).observationType = 'wrong_type';
const wrongObsTypeResult = validateTailSkewContextArtifact(wrongObsType, { mode: 'example' });
assert.ok(!wrongObsTypeResult.ok);
assert.ok(wrongObsTypeResult.errors.some((e) => e.includes('observationType')));

// --- wrong seriesDefinition fails ---
const wrongSeries = cloneTailSkewExample();
(wrongSeries as { seriesDefinition: string }).seriesDefinition = 'wrong_series';
const wrongSeriesResult = validateTailSkewContextArtifact(wrongSeries, { mode: 'example' });
assert.ok(!wrongSeriesResult.ok);
assert.ok(wrongSeriesResult.errors.some((e) => e.includes('seriesDefinition')));

// --- wrong source.url fails ---
const wrongUrl = cloneTailSkewExample();
wrongUrl.source.url = 'https://example.com/skew.csv';
const wrongUrlResult = validateTailSkewContextArtifact(wrongUrl, { mode: 'example' });
assert.ok(!wrongUrlResult.ok);
assert.ok(wrongUrlResult.errors.some((e) => e.includes('source.url')));

// --- mappingStatus other than not_final fails ---
const badMapping = cloneTailSkewExample();
(badMapping.observations as { mappingStatus: string }).mappingStatus = 'final';
const badMappingResult = validateTailSkewContextArtifact(badMapping, { mode: 'example' });
assert.ok(!badMappingResult.ok);
assert.ok(badMappingResult.errors.some((e) => e.includes('mappingStatus')));

// --- dailyChange reconciliation failure fails ---
const badChange = cloneTailSkewExample();
badChange.observations.dailyChange = 99;
const badChangeResult = validateTailSkewContextArtifact(badChange, { mode: 'example' });
assert.ok(!badChangeResult.ok);
assert.ok(badChangeResult.errors.some((e) => e.includes('dailyChange')));

// --- dailyChangePct reconciliation failure fails ---
const badChangePct = cloneTailSkewExample();
badChangePct.observations.dailyChangePct = 99;
const badChangePctResult = validateTailSkewContextArtifact(badChangePct, { mode: 'example' });
assert.ok(!badChangePctResult.ok);
assert.ok(badChangePctResult.errors.some((e) => e.includes('dailyChangePct')));

// --- historySummary.latestSourceDate before asOf fails ---
const badSourceDate = cloneTailSkewExample();
if (badSourceDate.historySummary) {
  badSourceDate.historySummary.latestSourceDate = '2026-06-17';
}
const badSourceDateResult = validateTailSkewContextArtifact(badSourceDate, {
  mode: 'example',
  referenceAsOf: FIXTURE_TAIL_SKEW_REFERENCE_ASOF,
});
assert.ok(!badSourceDateResult.ok);
assert.ok(badSourceDateResult.errors.some((e) => e.includes('latestSourceDate')));

// --- observations.latestObservation.date !== asOf fails ---
const badObsDate = cloneTailSkewExample();
if (badObsDate.observations.latestObservation) {
  badObsDate.observations.latestObservation.date = '2026-06-17';
}
const badObsDateResult = validateTailSkewContextArtifact(badObsDate, {
  mode: 'example',
  referenceAsOf: FIXTURE_TAIL_SKEW_REFERENCE_ASOF,
});
assert.ok(!badObsDateResult.ok);
assert.ok(badObsDateResult.errors.some((e) => e.includes('latestObservation.date')));

// --- forbidden score field fails ---
const scoreField = cloneTailSkewExample() as Record<string, unknown>;
scoreField.score = 62;
const scoreFieldResult = validateTailSkewContextArtifact(scoreField, { mode: 'example' });
assert.ok(!scoreFieldResult.ok);
assert.ok(scoreFieldResult.errors.some((e) => e.includes('score')));

// --- forbidden zeroDte, gex, cor1m, publicPassiveInputKey fails ---
const forbiddenNested = cloneTailSkewExample();
(forbiddenNested.observations as Record<string, unknown>).zeroDte = 0.5;
const zeroDteResult = validateTailSkewContextArtifact(forbiddenNested, { mode: 'example' });
assert.ok(!zeroDteResult.ok);
assert.ok(zeroDteResult.errors.some((e) => e.includes('zeroDte')));

const gexField = cloneTailSkewExample() as Record<string, unknown>;
gexField.gex = 1;
const gexResult = validateTailSkewContextArtifact(gexField, { mode: 'example' });
assert.ok(!gexResult.ok);
assert.ok(gexResult.errors.some((e) => e.includes('gex')));

const cor1mField = cloneTailSkewExample() as Record<string, unknown>;
cor1mField.cor1m = 0.8;
const cor1mResult = validateTailSkewContextArtifact(cor1mField, { mode: 'example' });
assert.ok(!cor1mResult.ok);
assert.ok(cor1mResult.errors.some((e) => e.includes('cor1m')));

const passiveKey = cloneTailSkewExample() as Record<string, unknown>;
passiveKey.publicPassiveInputKey = 'concentration';
const passiveKeyResult = validateTailSkewContextArtifact(passiveKey, { mode: 'example' });
assert.ok(!passiveKeyResult.ok);
assert.ok(passiveKeyResult.errors.some((e) => e.includes('publicPassiveInputKey')));

// --- helper math tests ---
assert.ok(Math.abs(computeTailSkewDailyChange(146.72, 142.62) - 4.1) < SKEW_CHANGE_TOLERANCE);
assert.ok(Math.abs(computeTailSkewDailyChangePct(4.1, 142.62) - 2.87) < 0.01);
assert.ok(reconcileTailSkewDailyChange(137.39, 136.96, 0.43));
assert.ok(reconcileTailSkewDailyChangePct(0.43, 136.96, 0.31));

// --- locked Cboe URL constant ---
assert.strictEqual(
  FIXTURE_TAIL_SKEW_EXAMPLE.source.url,
  TAIL_SKEW_CBOE_CSV_URL
);

console.log('tailSkewContextProxy.test.ts: all assertions passed');
