/**
 * CHARACTERIZATION — documents current Risk Score blend of investment facts + data QA.
 * Not an endorsement of blending; evidence for later semantic separation / confidence gate.
 */

import assert from 'node:assert/strict';
import { computeGhostYieldRiskScore } from '../scoring';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;

function riskFor(
  overrides: Parameters<typeof baseCandidate>[0],
  freshnessOverrides?: Partial<ReturnType<typeof evaluateCandidateFreshness>>
) {
  const row = baseCandidate(overrides);
  const freshness = {
    ...evaluateCandidateFreshness(row, REF),
    ...freshnessOverrides,
  };
  return computeGhostYieldRiskScore(row, freshness);
}

// Confidence penalty: otherwise-identical investment facts
{
  const high = riskFor({ dataConfidence: 'high', confidence: 'high' });
  const low = riskFor({ dataConfidence: 'low', confidence: 'low' });
  assert.ok(low > high, `low-confidence Risk (${low}) should exceed high (${high})`);
  // Current confidencePenalty: low=12 vs high=0; freshness also differs (caution vs fresh).
  assert.ok(low - high >= 12);
}

{
  const high = riskFor({ dataConfidence: 'high', confidence: 'high' });
  const medium = riskFor({ dataConfidence: 'medium', confidence: 'medium' });
  // medium adds confidencePenalty 5; may also change freshness if warnings appear — medium alone does not warn.
  assert.equal(medium - high, 5);
}

// Missing NAV penalty (+14) for ETF/CEF wrappers
{
  const withNav = riskFor({ nav: 100, navDataAsOf: '2026-05-07' });
  const missingNav = riskFor({
    nav: null,
    navDataAsOf: undefined,
    structureLabel: 'ETF',
  });
  assert.ok(missingNav > withNav);
  // missingNavPoints 14 + freshness missing penalty 14 vs fresh 0 → large gap
  assert.ok(missingNav - withNav >= 14);
}

// Freshness penalty: force identical applyScoringPenalty paths via explicit freshness objects
{
  const row = baseCandidate();
  const baseFresh = evaluateCandidateFreshness(row, REF);
  assert.equal(baseFresh.status, 'fresh');

  const freshRisk = computeGhostYieldRiskScore(row, baseFresh);
  const staleRisk = computeGhostYieldRiskScore(row, {
    status: 'stale',
    warnings: ['forced stale for characterization'],
    applyScoringPenalty: true,
  });
  const cautionRisk = computeGhostYieldRiskScore(row, {
    status: 'caution',
    warnings: ['forced caution for characterization'],
    applyScoringPenalty: true,
  });
  const missingRisk = computeGhostYieldRiskScore(row, {
    status: 'missing',
    warnings: ['forced missing for characterization'],
    applyScoringPenalty: true,
  });

  assert.equal(staleRisk - freshRisk, 12);
  assert.equal(cautionRisk - freshRisk, 7);
  assert.equal(missingRisk - freshRisk, 14);
}

console.log('ghostyield/riskDataPenalties.test.ts: ok (CHARACTERIZATION of current blend)');
