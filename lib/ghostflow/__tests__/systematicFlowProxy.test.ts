/**
 * GhostFlow v0.9d — CFTC TFF systematic-flow-proxy artifact design tests.
 */

import assert from 'assert';
import {
  computeBasketMetrics,
  computeDeltaNetContracts,
  computeNetContracts,
  computeNetPctOi,
  loadSystematicFlowProxyArtifact,
  mapBasketNetPctOiToPressureScore,
  resolveBasketDirection,
  validateSystematicFlowProxyArtifact,
  evaluateSystematicFlowProxyArtifactFreshness,
} from '../artifacts/systematicFlowProxy';
import { GHOSTFLOW_REFERENCE_AS_OF } from '../reference';
import productionArtifact from '@/data/ghostflow/artifacts/systematicFlowProxy.v1.json';
import type { SystematicFlowProxyArtifactV1 } from '../artifacts/types';
import {
  cloneExample,
  FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE,
  FIXTURE_SYSTEMATIC_FLOW_REFERENCE_AS_OF,
} from './fixtures/systematicFlowProxy';

// --- Per-contract math ---
assert.strictEqual(computeNetContracts(164096, 565650), -401554);
assert.strictEqual(computeDeltaNetContracts(15589, -15295), 30884);

const netPct = computeNetPctOi(-401554, 2068443);
assert.ok(netPct !== null && Math.abs(netPct - -19.4) < 0.15);

// --- Mapping anchors ---
assert.strictEqual(mapBasketNetPctOiToPressureScore(0), 0);
assert.strictEqual(mapBasketNetPctOiToPressureScore(5), 25);
assert.strictEqual(mapBasketNetPctOiToPressureScore(10), 50);
assert.strictEqual(mapBasketNetPctOiToPressureScore(15), 75);
assert.strictEqual(mapBasketNetPctOiToPressureScore(20), 100);
assert.strictEqual(mapBasketNetPctOiToPressureScore(-18.5), 93);

// --- Direction ---
assert.strictEqual(resolveBasketDirection(0.5), 'flat');
assert.strictEqual(resolveBasketDirection(-18.5), 'net_short');
assert.strictEqual(resolveBasketDirection(2), 'net_long');

// --- Basket from example contracts ---
const basket = computeBasketMetrics(FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE.scoreContracts);
assert.strictEqual(basket.basketNetContracts, -514354);
assert.strictEqual(basket.basketOpenInterestAll, 2782871);
assert.strictEqual(basket.basketNetPctOi, -18.5);
assert.strictEqual(basket.basketAbsNetPctOi, 18.5);
assert.strictEqual(basket.basketDirection, 'net_short');
assert.strictEqual(basket.basketWeeklyDeltaNetContracts, 30757);
assert.strictEqual(basket.basketScore, 93);

// --- Example artifact validates ---
const valid = validateSystematicFlowProxyArtifact(
  FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE,
  FIXTURE_SYSTEMATIC_FLOW_REFERENCE_AS_OF
);
assert.ok(valid.ok, valid.ok ? '' : valid.errors.join('; '));

const fresh = evaluateSystematicFlowProxyArtifactFreshness(
  FIXTURE_SYSTEMATIC_FLOW_PROXY_EXAMPLE,
  FIXTURE_SYSTEMATIC_FLOW_REFERENCE_AS_OF
);
assert.strictEqual(fresh.status, 'fresh');

// --- Negative change fields allowed ---
const negativeChange = cloneExample();
negativeChange.scoreContracts[2].observations.changeLong = -16615;
negativeChange.scoreContracts[2].observations.changeShort = -9817;
negativeChange.basket = computeBasketMetrics(negativeChange.scoreContracts);
const negOk = validateSystematicFlowProxyArtifact(negativeChange, FIXTURE_SYSTEMATIC_FLOW_REFERENCE_AS_OF);
assert.ok(negOk.ok, negOk.ok ? '' : negOk.errors.join('; '));

// --- Missing required contract ---
const missingRty = cloneExample();
missingRty.scoreContracts = missingRty.scoreContracts.filter((c) => c.cftcContractMarketCode !== '239742');
const missingResult = validateSystematicFlowProxyArtifact(missingRty);
assert.ok(!missingResult.ok);
assert.ok(missingResult.errors.some((e) => e.includes('239742')));

// --- VIX usedInScore true fails ---
const vixInScore = cloneExample();
if (vixInScore.vixContext) {
  (vixInScore.vixContext as { usedInScore: boolean }).usedInScore = true;
}
const vixResult = validateSystematicFlowProxyArtifact(vixInScore);
assert.ok(!vixResult.ok);
assert.ok(vixResult.errors.some((e) => e.includes('usedInScore')));

// --- Invalid dates ---
const badDates = cloneExample();
badDates.publishedAt = '2026-05-10';
const dateResult = validateSystematicFlowProxyArtifact(badDates);
assert.ok(!dateResult.ok);
assert.ok(dateResult.errors.some((e) => e.includes('publishedAt')));

// --- Mismatched basket ---
const badBasket = cloneExample();
badBasket.basket.basketNetContracts = 0;
const basketResult = validateSystematicFlowProxyArtifact(badBasket);
assert.ok(!basketResult.ok);
assert.ok(basketResult.errors.some((e) => e.includes('basketNetContracts')));

// --- Mismatched reportDate vs asOf ---
const badReportDate = cloneExample();
badReportDate.scoreContracts[0].observations.reportDate = '2026-05-12';
const reportDateResult = validateSystematicFlowProxyArtifact(badReportDate);
assert.ok(!reportDateResult.ok);
assert.ok(reportDateResult.errors.some((e) => e.includes('reportDate') && e.includes('asOf')));

// --- Mismatched reportWeek across contracts ---
const badReportWeek = cloneExample();
badReportWeek.scoreContracts[1].observations.reportWeek = '2026 Report Week 19';
const reportWeekResult = validateSystematicFlowProxyArtifact(badReportWeek);
assert.ok(!reportWeekResult.ok);
assert.ok(reportWeekResult.errors.some((e) => e.includes('reportWeek')));

// --- Production artifact validates ---
const production = productionArtifact as SystematicFlowProxyArtifactV1;
const prodValid = validateSystematicFlowProxyArtifact(production, GHOSTFLOW_REFERENCE_AS_OF);
assert.ok(prodValid.ok, prodValid.ok ? '' : prodValid.errors.join('; '));
assert.strictEqual(production.designOnly, undefined);
assert.ok(
  production.source.note?.includes('Production artifact candidate') &&
    production.source.note?.includes('not yet wired')
);
assert.strictEqual(production.publishedAt, '2026-05-22');
assert.strictEqual(production.basket.basketNetPctOi, -18.5);
assert.strictEqual(production.basket.basketScore, 93);

const prodFresh = evaluateSystematicFlowProxyArtifactFreshness(production, GHOSTFLOW_REFERENCE_AS_OF);
assert.strictEqual(prodFresh.status, 'fresh');

const loaded = loadSystematicFlowProxyArtifact();
assert.ok(loaded.ok, loaded.ok ? '' : loaded.errors.join('; '));

console.log('ghostflow/systematicFlowProxy.test.ts: ok');
