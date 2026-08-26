/**
 * Treasury long-end income lens — v1.7c design-only validator and helpers.
 */

import assert from 'node:assert/strict';
import exampleJson from '@/data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.example.json';
import productionJson from '@/data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json';
import {
  computeCurveSpread,
  formatYieldPct,
  loadTreasuryLongEndIncomeLensArtifact,
  reconcileCurveSpread,
  TREASURY_LONG_END_BOARD_RELEASE_URL,
  TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
  TREASURY_LONG_END_BOARD_SOURCE_NAME,
  TREASURY_LONG_END_BOARD_SOURCE_NOTE,
  TREASURY_LONG_END_BOARD_SOURCE_SERIES,
  TREASURY_LONG_END_BOARD_CAVEATS,
  validatePercentRate,
  validateTreasuryLongEndIncomeLensArtifact,
} from '@/lib/ghostflow/artifacts/treasuryLongEndIncomeLens';

function cloneExample(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(exampleJson)) as Record<string, unknown>;
}

function buildBoardNativeFixture(): Record<string, unknown> {
  return {
    artifactVersion: '1',
    signalId: 'treasury-long-end-income-lens',
    asOf: '2026-08-24',
    source: {
      name: TREASURY_LONG_END_BOARD_SOURCE_NAME,
      url: TREASURY_LONG_END_BOARD_RELEASE_URL,
      note: TREASURY_LONG_END_BOARD_SOURCE_NOTE,
      series: TREASURY_LONG_END_BOARD_SOURCE_SERIES.map((spec) => ({
        id: spec.id,
        label: spec.label,
        url: TREASURY_LONG_END_BOARD_RELEASE_URL,
        role: spec.role,
      })),
    },
    observationType: 'treasury_long_end_income_snapshot',
    seriesDefinition: TREASURY_LONG_END_BOARD_SERIES_DEFINITION,
    updateFrequency: 'daily',
    dataQuality: 'verified_automated',
    mappingStatus: 'not_final',
    caveats: [...TREASURY_LONG_END_BOARD_CAVEATS],
    observations: {
      thirtyYearNominalYieldPct: 4.97,
      thirtyYearTipsRealYieldPct: 2.78,
      twoYearYieldPct: 4.17,
      fiveYearYieldPct: 4.24,
      tenYearYieldPct: 4.48,
      curve2s30sPct: 0.8,
      curve5s30sPct: 0.73,
      curve10s30sPct: 0.49,
      nominalYieldPercentile: null,
      realYieldPercentile: null,
      mappingStatus: 'not_final',
    },
  };
}

// --- production artifact validates ---
const productionOk = validateTreasuryLongEndIncomeLensArtifact(productionJson, { mode: 'production' });
assert.ok(productionOk.ok, productionOk.ok ? '' : productionOk.errors.join('; '));

const loaderOk = loadTreasuryLongEndIncomeLensArtifact();
assert.ok(loaderOk.ok);

assert.equal((productionJson as { designOnly?: boolean }).designOnly, undefined);
assert.equal(productionOk.artifact.observations.mappingStatus, 'not_final');
assert.ok(productionOk.artifact.source.series.length >= 6);
const prodIds = productionOk.artifact.source.series.map((s) => s.id);
for (const id of ['DGS30', 'DFII30', 'DGS2', 'DGS5', 'DGS10', 'T10YIE']) {
  assert.ok(prodIds.includes(id), `missing series ${id}`);
}
assert.equal(productionOk.artifact.observations.nominalYieldPercentile, null);
assert.equal(productionOk.artifact.observations.realYieldPercentile, null);

// --- example validates ---
const exampleOk = validateTreasuryLongEndIncomeLensArtifact(exampleJson, { mode: 'example' });
assert.ok(exampleOk.ok, exampleOk.ok ? '' : exampleOk.errors.join('; '));

// --- production rejects designOnly ---
const prodFail = validateTreasuryLongEndIncomeLensArtifact(exampleJson, { mode: 'production' });
assert.ok(!prodFail.ok);
assert.ok(prodFail.errors.some((e) => e.includes('designOnly')));

// --- missing source ---
const noSource = cloneExample();
delete noSource.source;
const noSourceResult = validateTreasuryLongEndIncomeLensArtifact(noSource, { mode: 'example' });
assert.ok(!noSourceResult.ok);
assert.ok(noSourceResult.errors.some((e) => e.includes('source')));

// --- missing source series ---
const noSeries = cloneExample();
(noSeries.source as Record<string, unknown>).series = [];
const noSeriesResult = validateTreasuryLongEndIncomeLensArtifact(noSeries, { mode: 'example' });
assert.ok(!noSeriesResult.ok);
assert.ok(noSeriesResult.errors.some((e) => e.includes('source.series')));

// --- missing required nominal yield ---
const noNom = cloneExample();
delete (noNom.observations as Record<string, unknown>).thirtyYearNominalYieldPct;
const noNomResult = validateTreasuryLongEndIncomeLensArtifact(noNom, { mode: 'example' });
assert.ok(!noNomResult.ok);
assert.ok(noNomResult.errors.some((e) => e.includes('thirtyYearNominalYieldPct')));

// --- missing required real yield ---
const noReal = cloneExample();
delete (noReal.observations as Record<string, unknown>).thirtyYearTipsRealYieldPct;
const noRealResult = validateTreasuryLongEndIncomeLensArtifact(noReal, { mode: 'example' });
assert.ok(!noRealResult.ok);
assert.ok(noRealResult.errors.some((e) => e.includes('thirtyYearTipsRealYieldPct')));

// --- bad asOf ---
const badDate = cloneExample();
badDate.asOf = 'bad';
const badDateResult = validateTreasuryLongEndIncomeLensArtifact(badDate, { mode: 'example' });
assert.ok(!badDateResult.ok);
assert.ok(badDateResult.errors.some((e) => e.includes('asOf')));

// --- publishedAt before asOf ---
const pubBefore = cloneExample();
pubBefore.publishedAt = '2026-05-20';
pubBefore.asOf = '2026-05-22';
const pubBeforeResult = validateTreasuryLongEndIncomeLensArtifact(pubBefore, { mode: 'example' });
assert.ok(!pubBeforeResult.ok);
assert.ok(pubBeforeResult.errors.some((e) => e.includes('publishedAt')));

// --- impossible rate ---
const impossible = cloneExample();
(impossible.observations as Record<string, unknown>).thirtyYearNominalYieldPct = 150;
const impossibleResult = validateTreasuryLongEndIncomeLensArtifact(impossible, { mode: 'example' });
assert.ok(!impossibleResult.ok);
assert.ok(impossibleResult.errors.some((e) => e.includes('100')));

// --- negative real yield allowed ---
const negReal = cloneExample();
(negReal.observations as Record<string, unknown>).thirtyYearTipsRealYieldPct = -0.35;
const negRealResult = validateTreasuryLongEndIncomeLensArtifact(negReal, { mode: 'example' });
assert.ok(negRealResult.ok, negRealResult.ok ? '' : negRealResult.errors.join('; '));

// --- inverted curve allowed (reconciled) ---
const inverted = cloneExample();
const invObs = inverted.observations as Record<string, unknown>;
invObs.thirtyYearNominalYieldPct = 4.0;
invObs.twoYearYieldPct = 4.55;
invObs.fiveYearYieldPct = 4.62;
invObs.tenYearYieldPct = 4.48;
invObs.curve2s30sPct = -0.55;
invObs.curve5s30sPct = -0.62;
invObs.curve10s30sPct = -0.48;
const invertedResult = validateTreasuryLongEndIncomeLensArtifact(inverted, { mode: 'example' });
assert.ok(invertedResult.ok, invertedResult.ok ? '' : invertedResult.errors.join('; '));

// --- curve spread mismatch ---
const curveBad = cloneExample();
(curveBad.observations as Record<string, unknown>).curve2s30sPct = 9.99;
const curveBadResult = validateTreasuryLongEndIncomeLensArtifact(curveBad, { mode: 'example' });
assert.ok(!curveBadResult.ok);
assert.ok(curveBadResult.errors.some((e) => e.includes('curve2s30sPct')));

// --- percentile out of range ---
const pctBad = cloneExample();
(pctBad.observations as Record<string, unknown>).nominalYieldPercentile = 101;
const pctBadResult = validateTreasuryLongEndIncomeLensArtifact(pctBad, { mode: 'example' });
assert.ok(!pctBadResult.ok);
assert.ok(pctBadResult.errors.some((e) => e.includes('nominalYieldPercentile')));

// --- null percentiles allowed ---
const pctNull = cloneExample();
(pctNull.observations as Record<string, unknown>).nominalYieldPercentile = null;
(pctNull.observations as Record<string, unknown>).realYieldPercentile = null;
const pctNullResult = validateTreasuryLongEndIncomeLensArtifact(pctNull, { mode: 'example' });
assert.ok(pctNullResult.ok);

// --- forbidden score fields (production) ---
const mappedProd = JSON.parse(JSON.stringify(productionJson)) as Record<string, unknown>;
mappedProd.mappedPressureScore = 50;
const mappedProdResult = validateTreasuryLongEndIncomeLensArtifact(mappedProd, { mode: 'production' });
assert.ok(!mappedProdResult.ok);

// --- forbidden score fields (example) ---
const mapped = cloneExample();
mapped.mappedPressureScore = 50;
const mappedResult = validateTreasuryLongEndIncomeLensArtifact(mapped, { mode: 'example' });
assert.ok(!mappedResult.ok);
assert.ok(mappedResult.errors.some((e) => e.includes('mappedPressureScore')));

const neglect = cloneExample();
(neglect.observations as Record<string, unknown>).neglectScore = 80;
const neglectResult = validateTreasuryLongEndIncomeLensArtifact(neglect, { mode: 'example' });
assert.ok(!neglectResult.ok);

// --- forbidden advice/allocation fields (production) ---
const buyProd = JSON.parse(JSON.stringify(productionJson)) as Record<string, unknown>;
buyProd.buySignal = true;
const buyProdResult = validateTreasuryLongEndIncomeLensArtifact(buyProd, { mode: 'production' });
assert.ok(!buyProdResult.ok);

// --- forbidden advice/allocation fields ---
const buy = cloneExample();
buy.buySignal = true;
const buyResult = validateTreasuryLongEndIncomeLensArtifact(buy, { mode: 'example' });
assert.ok(!buyResult.ok);
assert.ok(buyResult.errors.some((e) => e.includes('buySignal')));

const duration = cloneExample();
duration.durationSignal = 'extend';
const durationResult = validateTreasuryLongEndIncomeLensArtifact(duration, { mode: 'example' });
assert.ok(!durationResult.ok);

const alloc = cloneExample();
alloc.allocationRecommendation = 'overweight bonds';
const allocResult = validateTreasuryLongEndIncomeLensArtifact(alloc, { mode: 'example' });
assert.ok(!allocResult.ok);

// --- pattern guard ---
const pattern = cloneExample();
(pattern.observations as Record<string, unknown>).suggestedBondBuy = 'yes';
const patternResult = validateTreasuryLongEndIncomeLensArtifact(pattern, { mode: 'example' });
assert.ok(!patternResult.ok);
assert.ok(patternResult.errors.some((e) => e.includes('suggestedBondBuy')));

// --- wrong signalId ---
const wrongSignal = cloneExample();
wrongSignal.signalId = 'bond-neglect-income-lens';
const wrongSignalResult = validateTreasuryLongEndIncomeLensArtifact(wrongSignal, { mode: 'example' });
assert.ok(!wrongSignalResult.ok);

// --- wrong observationType / seriesDefinition ---
const wrongObs = cloneExample();
wrongObs.observationType = 'wrong';
const wrongObsResult = validateTreasuryLongEndIncomeLensArtifact(wrongObs, { mode: 'example' });
assert.ok(!wrongObsResult.ok);

const wrongSeries = cloneExample();
wrongSeries.seriesDefinition = 'wrong';
const wrongSeriesResult = validateTreasuryLongEndIncomeLensArtifact(wrongSeries, { mode: 'example' });
assert.ok(!wrongSeriesResult.ok);

// --- helper math ---
assert.equal(computeCurveSpread(4.72, 4.18), 0.54);
assert.ok(reconcileCurveSpread(0.54, 0.54));
assert.ok(!reconcileCurveSpread(0.54, 1.0));
assert.equal(validatePercentRate(-0.5, 'test'), null);
assert.equal(validatePercentRate(150, 'test')?.includes('100'), true);
assert.equal(formatYieldPct(4.72, 2), '4.72%');

// --- Board-native branch ---
const boardOk = validateTreasuryLongEndIncomeLensArtifact(buildBoardNativeFixture(), {
  mode: 'production',
});
assert.ok(boardOk.ok, boardOk.ok ? '' : boardOk.errors.join('; '));

const boardNoPublished = buildBoardNativeFixture();
delete boardNoPublished.publishedAt;
assert.ok(validateTreasuryLongEndIncomeLensArtifact(boardNoPublished, { mode: 'production' }).ok);

const boardWithPublished = buildBoardNativeFixture();
boardWithPublished.publishedAt = '2026-08-24';
assert.ok(validateTreasuryLongEndIncomeLensArtifact(boardWithPublished, { mode: 'production' }).ok);

const boardBadPublished = buildBoardNativeFixture();
boardBadPublished.publishedAt = '2026-08-20';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardBadPublished, { mode: 'production' }).ok);

const fredAutomated = cloneExample();
fredAutomated.dataQuality = 'verified_automated';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(fredAutomated, { mode: 'example' }).ok);

const boardT10yie = buildBoardNativeFixture();
(boardT10yie.source as { series: Array<{ id: string }> }).series.push({
  id: 'T10YIE',
  label: 'bad',
  url: TREASURY_LONG_END_BOARD_RELEASE_URL,
  role: 'context',
});
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardT10yie, { mode: 'production' }).ok);

const boardBreakeven = buildBoardNativeFixture();
(boardBreakeven.observations as Record<string, unknown>).tenYearBreakevenInflationPct = 2.1;
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardBreakeven, { mode: 'production' }).ok);

const boardDgs = buildBoardNativeFixture();
(boardDgs.source as { series: Array<{ id: string }> }).series[0]!.id = 'DGS30';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardDgs, { mode: 'production' }).ok);

const boardPrefix = buildBoardNativeFixture();
(boardPrefix.source as { series: Array<{ id: string }> }).series[0]!.id = 'H15/H15/RIFLGFCY30_N.B';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardPrefix, { mode: 'production' }).ok);

const boardFredUrl = buildBoardNativeFixture();
(boardFredUrl.source as { url: string }).url = 'https://fred.stlouisfed.org/';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardFredUrl, { mode: 'production' }).ok);

const boardWrongRole = buildBoardNativeFixture();
(boardWrongRole.source as { series: Array<{ role: string }> }).series[0]!.role = 'context';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardWrongRole, { mode: 'production' }).ok);

const boardMissingNom = buildBoardNativeFixture();
delete (boardMissingNom.observations as Record<string, unknown>).thirtyYearNominalYieldPct;
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardMissingNom, { mode: 'production' }).ok);

const boardMissingReal = buildBoardNativeFixture();
delete (boardMissingReal.observations as Record<string, unknown>).thirtyYearTipsRealYieldPct;
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardMissingReal, { mode: 'production' }).ok);

const boardDuplicate = buildBoardNativeFixture();
const series = (boardDuplicate.source as { series: unknown[] }).series;
series.push(JSON.parse(JSON.stringify(series[0])));
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardDuplicate, { mode: 'production' }).ok);

const boardExtra = buildBoardNativeFixture();
(boardExtra.source as { series: unknown[] }).series.push({
  id: 'RIFLGFCY01_N.B',
  label: 'extra',
  url: TREASURY_LONG_END_BOARD_RELEASE_URL,
  role: 'context',
});
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardExtra, { mode: 'production' }).ok);

const fredWithBoardSource = cloneExample();
(fredWithBoardSource.source as { series: unknown[] }).series = (
  buildBoardNativeFixture().source as { series: unknown[] }
).series;
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(fredWithBoardSource, { mode: 'example' }).ok);

const boardWithFredSource = buildBoardNativeFixture();
boardWithFredSource.source = (productionJson as { source: unknown }).source;
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardWithFredSource, { mode: 'production' }).ok);

const boardManualQuality = buildBoardNativeFixture();
boardManualQuality.dataQuality = 'verified_manual';
assert.ok(!validateTreasuryLongEndIncomeLensArtifact(boardManualQuality, { mode: 'production' }).ok);

console.log('ghostflow/treasuryLongEndIncomeLens.test.ts: ok');
