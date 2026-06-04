/**
 * Treasury futures positioning proxy — v1.7b design-only validator and helpers.
 */

import assert from 'node:assert/strict';
import exampleJson from '@/data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.example.json';
import productionJson from '@/data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json';
import {
  classifyDirection,
  computeBasketGrossPctOi,
  computeBasketWeightedNetPctOi,
  computeGross,
  computeNet,
  computePctOfOpenInterest,
  loadTreasuryFuturesPositioningProxyArtifact,
  validateTreasuryFuturesPositioningProxyArtifact,
} from '@/lib/ghostflow/artifacts/treasuryFuturesPositioningProxy';
import type { TreasuryFuturesContractRowV1 } from '@/lib/ghostflow/artifacts/types';

function cloneExample(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(exampleJson)) as Record<string, unknown>;
}

// --- production artifact validates ---
const productionOk = validateTreasuryFuturesPositioningProxyArtifact(productionJson, {
  mode: 'production',
});
assert.ok(productionOk.ok, productionOk.ok ? '' : productionOk.errors.join('; '));

const loaderOk = loadTreasuryFuturesPositioningProxyArtifact();
assert.ok(loaderOk.ok);

assert.equal((productionJson as { designOnly?: boolean }).designOnly, undefined);
assert.equal(productionOk.artifact.observations.mappingStatus, 'not_final');

// --- example validates ---
const exampleOk = validateTreasuryFuturesPositioningProxyArtifact(exampleJson, { mode: 'example' });
assert.ok(exampleOk.ok, exampleOk.ok ? '' : exampleOk.errors.join('; '));

// --- production rejects designOnly ---
const prodFail = validateTreasuryFuturesPositioningProxyArtifact(exampleJson, { mode: 'production' });
assert.ok(!prodFail.ok);
assert.ok(prodFail.errors.some((e) => e.includes('designOnly')));

// --- duplicate code ---
const dup = cloneExample();
const contracts = dup.contracts as Record<string, unknown>[];
contracts.push({ ...contracts[0], contractMarketName: 'UST 2Y DUPLICATE' });
const dupResult = validateTreasuryFuturesPositioningProxyArtifact(dup, { mode: 'example' });
assert.ok(!dupResult.ok);
assert.ok(dupResult.errors.some((e) => e.includes('Duplicate')));

// --- missing source url ---
const noUrl = cloneExample();
(noUrl.source as { url: string }).url = '';
const noUrlResult = validateTreasuryFuturesPositioningProxyArtifact(noUrl, { mode: 'example' });
assert.ok(!noUrlResult.ok);
assert.ok(noUrlResult.errors.some((e) => e.includes('source.url')));

// --- bad asOf ---
const badDate = cloneExample();
badDate.asOf = 'bad';
const badDateResult = validateTreasuryFuturesPositioningProxyArtifact(badDate, { mode: 'example' });
assert.ok(!badDateResult.ok);
assert.ok(badDateResult.errors.some((e) => e.includes('asOf')));

// --- publishedAt before asOf ---
const pubBefore = cloneExample();
pubBefore.publishedAt = '2026-05-20';
pubBefore.asOf = '2026-05-26';
const pubBeforeResult = validateTreasuryFuturesPositioningProxyArtifact(pubBefore, { mode: 'example' });
assert.ok(!pubBeforeResult.ok);
assert.ok(pubBeforeResult.errors.some((e) => e.includes('publishedAt')));

// --- negative OI ---
const negOi = cloneExample();
(negOi.contracts as Record<string, unknown>[])[0].openInterestAll = -1;
const negOiResult = validateTreasuryFuturesPositioningProxyArtifact(negOi, { mode: 'example' });
assert.ok(!negOiResult.ok);

// --- non-integer position ---
const nonInt = cloneExample();
(nonInt.contracts as Record<string, unknown>[])[0].levMoneyLong = 1.5;
const nonIntResult = validateTreasuryFuturesPositioningProxyArtifact(nonInt, { mode: 'example' });
assert.ok(!nonIntResult.ok);

// --- net mismatch ---
const netBad = cloneExample();
(netBad.contracts as Record<string, unknown>[])[0].levMoneyNet = 0;
const netBadResult = validateTreasuryFuturesPositioningProxyArtifact(netBad, { mode: 'example' });
assert.ok(!netBadResult.ok);
assert.ok(netBadResult.errors.some((e) => e.includes('levMoneyNet')));

// --- gross mismatch ---
const grossBad = cloneExample();
(grossBad.contracts as Record<string, unknown>[])[0].levMoneyGross = 0;
const grossBadResult = validateTreasuryFuturesPositioningProxyArtifact(grossBad, { mode: 'example' });
assert.ok(!grossBadResult.ok);

// --- pct OI mismatch ---
const pctBad = cloneExample();
(pctBad.contracts as Record<string, unknown>[])[0].levMoneyNetPctOi = 99;
const pctBadResult = validateTreasuryFuturesPositioningProxyArtifact(pctBad, { mode: 'example' });
assert.ok(!pctBadResult.ok);

// --- basket aggregate mismatch ---
const basketBad = cloneExample();
(basketBad.observations as Record<string, unknown>).basketLevMoneyNetPctOi = 0;
const basketBadResult = validateTreasuryFuturesPositioningProxyArtifact(basketBad, { mode: 'example' });
assert.ok(!basketBadResult.ok);

// --- optional_context in aggregate ---
const optAgg = cloneExample();
const optRow = (optAgg.contracts as Record<string, unknown>[]).find(
  (c) => c.cftcContractMarketCode === '043607'
);
optRow!.usedInAggregate = true;
optRow!.role = 'optional_context';
const optAggResult = validateTreasuryFuturesPositioningProxyArtifact(optAgg, { mode: 'example' });
assert.ok(!optAggResult.ok);

// --- funding_context in aggregate ---
const fundAgg = cloneExample();
fundAgg.contracts = [
  ...(fundAgg.contracts as Record<string, unknown>[]),
  {
    contractMarketName: 'FED FUNDS',
    cftcContractMarketCode: '045601',
    tenor: '2Y',
    role: 'funding_context',
    includeInBasket: false,
    usedInAggregate: true,
    reportDate: '2026-05-26',
    reportWeek: '2026 Report Week 21',
    openInterestAll: 100000,
    levMoneyLong: 1000,
    levMoneyShort: 2000,
    levMoneySpread: 500,
    levMoneyNet: -1000,
    levMoneyNetPctOi: -1.0,
    levMoneyGross: 3000,
    levMoneyGrossPctOi: 3.0,
    assetManagerLong: 0,
    assetManagerShort: 0,
    assetManagerSpread: 0,
    assetManagerNet: 0,
    assetManagerNetPctOi: 0,
    levVsAssetManagerSpread: -1000,
    direction: 'net_short',
  },
];
const fundAggResult = validateTreasuryFuturesPositioningProxyArtifact(fundAgg, { mode: 'example' });
assert.ok(!fundAggResult.ok);

// --- forbidden scores (production) ---
const mappedProd = JSON.parse(JSON.stringify(productionJson)) as Record<string, unknown>;
mappedProd.mappedPressureScore = 50;
const mappedProdResult = validateTreasuryFuturesPositioningProxyArtifact(mappedProd, {
  mode: 'production',
});
assert.ok(!mappedProdResult.ok);

const basisProd = JSON.parse(JSON.stringify(productionJson)) as Record<string, unknown>;
(basisProd.observations as Record<string, unknown>).basisTradeMeasured = true;
const basisProdResult = validateTreasuryFuturesPositioningProxyArtifact(basisProd, {
  mode: 'production',
});
assert.ok(!basisProdResult.ok);

// --- forbidden scores (example) ---
const mapped = cloneExample();
mapped.mappedPressureScore = 50;
const mappedResult = validateTreasuryFuturesPositioningProxyArtifact(mapped, { mode: 'example' });
assert.ok(!mappedResult.ok);

const candidate = cloneExample();
(candidate.observations as Record<string, unknown>).candidatePressureScore = 50;
const candidateResult = validateTreasuryFuturesPositioningProxyArtifact(candidate, { mode: 'example' });
assert.ok(!candidateResult.ok);

const basketScore = cloneExample();
(basketScore.observations as Record<string, unknown>).basketScore = 80;
const basketScoreResult = validateTreasuryFuturesPositioningProxyArtifact(basketScore, { mode: 'example' });
assert.ok(!basketScoreResult.ok);

// --- wrong signalId ---
const wrongSignal = cloneExample();
wrongSignal.signalId = 'treasury-basis-trade-stress-proxy';
const wrongSignalResult = validateTreasuryFuturesPositioningProxyArtifact(wrongSignal, { mode: 'example' });
assert.ok(!wrongSignalResult.ok);

// --- wrong seriesDefinition ---
const wrongSeries = cloneExample();
wrongSeries.seriesDefinition = 'wrong';
const wrongSeriesResult = validateTreasuryFuturesPositioningProxyArtifact(wrongSeries, { mode: 'example' });
assert.ok(!wrongSeriesResult.ok);

// --- helper math ---
assert.equal(computeNet(10, 4), 6);
assert.equal(computeGross(10, 4), 14);
assert.equal(computePctOfOpenInterest(50, 200), 25);
assert.equal(classifyDirection(0.5), 'flat');
assert.equal(classifyDirection(-2), 'net_short');

const aggRows = (exampleJson.contracts as TreasuryFuturesContractRowV1[]).filter(
  (r) => r.usedInAggregate
);
const netPct = computeBasketWeightedNetPctOi(aggRows);
assert.ok(netPct !== null && Math.abs(netPct - (-30.7)) <= 0.2);

const grossPct = computeBasketGrossPctOi(aggRows);
assert.ok(grossPct !== null && Math.abs(grossPct - 44.2) <= 0.2);

console.log('ghostflow/treasuryFuturesPositioningProxy.test.ts: ok');
