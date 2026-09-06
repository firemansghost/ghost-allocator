/**
 * DESIRED BEHAVIOR: Risk/Fit no longer include evidence-quality numeric terms.
 * Evidence gate is separate (tested in evidenceGate.test.ts).
 */

import assert from 'node:assert/strict';
import { computeGhostYieldRiskScore } from '../scoring';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;

{
  const high = baseCandidate({ dataConfidence: 'high', confidence: 'high' });
  const low = baseCandidate({ dataConfidence: 'low', confidence: 'low' });
  const fHigh = evaluateCandidateFreshness(high, REF);
  const fLow = evaluateCandidateFreshness(low, REF);
  assert.equal(
    computeGhostYieldRiskScore(high, fHigh),
    computeGhostYieldRiskScore(low, fLow),
    'confidence must not change economic Risk'
  );
}

{
  const withNav = baseCandidate({ nav: 100, navDataAsOf: '2026-05-07' });
  const missingNav = baseCandidate({
    nav: null,
    navDataAsOf: undefined,
    structureLabel: 'ETF',
  });
  const fNav = evaluateCandidateFreshness(withNav, REF);
  const fMissing = evaluateCandidateFreshness(missingNav, REF);
  assert.equal(fMissing.status, 'missing');
  assert.equal(
    computeGhostYieldRiskScore(withNav, fNav),
    computeGhostYieldRiskScore(missingNav, fMissing),
    'missing NAV must not change economic Risk (handled by Evidence gate)'
  );
}

{
  const row = baseCandidate();
  const fresh = evaluateCandidateFreshness(row, REF);
  assert.equal(fresh.status, 'fresh');
  const freshRisk = computeGhostYieldRiskScore(row, fresh);
  const staleRisk = computeGhostYieldRiskScore(row, {
    status: 'stale',
    warnings: ['forced'],
    applyScoringPenalty: true,
  });
  const missingRisk = computeGhostYieldRiskScore(row, {
    status: 'missing',
    warnings: ['forced'],
    applyScoringPenalty: true,
  });
  assert.equal(freshRisk, staleRisk);
  assert.equal(freshRisk, missingRisk);
}

console.log('ghostyield/riskDataPenalties.test.ts: ok (evidence no longer in Risk)');
