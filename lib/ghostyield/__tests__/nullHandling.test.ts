/**
 * CHARACTERIZATION — current null handling in Risk/Fit (not a fix).
 */

import assert from 'node:assert/strict';
import { computeGhostYieldRiskScore, computeGhostYieldFitScore } from '../scoring';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;
const fresh = {
  status: 'fresh' as const,
  warnings: [] as string[],
  applyScoringPenalty: false,
};

// NAV null (ETF) — Risk rises via missing-NAV + freshness path
{
  const withNav = baseCandidate({ nav: 100 });
  const noNav = baseCandidate({ nav: null, navDataAsOf: undefined });
  const r1 = computeGhostYieldRiskScore(withNav, evaluateCandidateFreshness(withNav, REF));
  const r0 = computeGhostYieldRiskScore(noNav, evaluateCandidateFreshness(noNav, REF));
  assert.ok(r0 > r1);
}

// marketPrice null — no direct Risk/Fit change when premium already null
{
  const a = baseCandidate({ marketPrice: 100, premiumDiscount: undefined });
  const b = baseCandidate({ marketPrice: undefined, premiumDiscount: undefined });
  assert.equal(computeGhostYieldRiskScore(a, fresh), computeGhostYieldRiskScore(b, fresh));
  assert.equal(computeGhostYieldFitScore(a, fresh), computeGhostYieldFitScore(b, fresh));
}

// premiumDiscount null — skip premium schedule contribution
{
  const none = baseCandidate({
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    premiumDiscount: undefined,
    cefMetrics: undefined,
  });
  const rich = baseCandidate({
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    premiumDiscount: 0.12,
    cefMetrics: undefined,
  });
  assert.ok(computeGhostYieldRiskScore(rich, fresh) > computeGhostYieldRiskScore(none, fresh));
}

// leverage null — skip generic leverage contribution
{
  const none = baseCandidate({ leverage: undefined, cefMetrics: undefined, bdcMetrics: undefined });
  const high = baseCandidate({ leverage: 1.45, cefMetrics: undefined, bdcMetrics: undefined });
  assert.ok(computeGhostYieldRiskScore(high, fresh) > computeGhostYieldRiskScore(none, fresh));
}

// navPerformance null — skip NAV trend risk/fit terms
{
  const none = baseCandidate({
    navPerformance1Y: undefined,
    navPerformance3Y: undefined,
    navTrend1Y: undefined,
    navTrend3Y: undefined,
  });
  const weak = baseCandidate({
    navPerformance1Y: -0.1,
    navPerformance3Y: -0.2,
    navTrend1Y: undefined,
    navTrend3Y: undefined,
  });
  assert.ok(computeGhostYieldRiskScore(weak, fresh) > computeGhostYieldRiskScore(none, fresh));
}

/**
 * CURRENT BEHAVIOR (evidence for later scoring decision — do not "fix"):
 * yieldRiskPoints uses currentYield only. When currentYield is null but
 * distributionRate / secYield are populated, generic headline-yield Risk
 * contribution remains absent.
 */
{
  const withCurrent = baseCandidate({
    currentYield: 0.12,
    distributionRate: 0.12,
    secYield: 0.12,
  });
  const nullCurrent = baseCandidate({
    currentYield: null,
    distributionRate: 0.12,
    secYield: 0.12,
  });
  const rCurrent = computeGhostYieldRiskScore(withCurrent, fresh);
  const rNull = computeGhostYieldRiskScore(nullCurrent, fresh);
  assert.ok(
    rCurrent > rNull,
    'currentYield=0.12 adds yieldRiskPoints; null currentYield does not use distributionRate/secYield for that term'
  );
  // Isolate: only currentYield differs
  assert.ok(rCurrent - rNull >= 12);
}

console.log('ghostyield/nullHandling.test.ts: ok (CHARACTERIZATION)');
