/**
 * DESIRED BEHAVIOR: Fit no longer includes confidence/freshness numeric adjustments.
 */

import assert from 'node:assert/strict';
import { computeGhostYieldFitScore } from '../scoring';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;

{
  const shared = {
    currentYield: 0.04,
    distributionQuality: 'mixed' as const,
    sleeveType: 'preferred_income' as const,
    yieldSource:
      'Long characterization yield source string that exceeds the simple-source length bonus threshold used by Fit scoring in the current model.',
  };
  const rowHigh = baseCandidate({ ...shared, dataConfidence: 'high', confidence: 'high' });
  const rowLow = baseCandidate({ ...shared, dataConfidence: 'low', confidence: 'low' });
  const fresh = {
    status: 'fresh' as const,
    warnings: [] as string[],
    applyScoringPenalty: false,
  };
  assert.equal(
    computeGhostYieldFitScore(rowHigh, fresh),
    computeGhostYieldFitScore(rowLow, fresh),
    'confidence must not change economic Fit'
  );
}

{
  const row = baseCandidate({
    dataConfidence: 'high',
    confidence: 'high',
    currentYield: 0.04,
    distributionQuality: 'mixed',
    sleeveType: 'preferred_income',
    yieldSource:
      'Long characterization yield source string that exceeds the simple-source length bonus threshold used by Fit scoring in the current model.',
  });
  const freshFit = computeGhostYieldFitScore(row, {
    status: 'fresh',
    warnings: [],
    applyScoringPenalty: false,
  });
  const missingFit = computeGhostYieldFitScore(row, {
    status: 'missing',
    warnings: ['forced'],
    applyScoringPenalty: true,
  });
  const staleFit = computeGhostYieldFitScore(row, {
    status: 'stale',
    warnings: ['forced'],
    applyScoringPenalty: true,
  });
  assert.equal(freshFit, missingFit);
  assert.equal(freshFit, staleFit);
}

{
  const withNav = baseCandidate({ nav: 100, navDataAsOf: '2026-05-07' });
  const noNav = baseCandidate({ nav: null, navDataAsOf: undefined });
  const fNav = evaluateCandidateFreshness(withNav, REF);
  const fMissing = evaluateCandidateFreshness(noNav, REF);
  assert.equal(fNav.status, 'fresh');
  assert.equal(fMissing.status, 'missing');
  assert.equal(
    computeGhostYieldFitScore(withNav, fNav),
    computeGhostYieldFitScore(noNav, fMissing),
    'missing NAV must not change economic Fit'
  );
}

console.log('ghostyield/fitDataPenalties.test.ts: ok (evidence no longer in Fit)');
