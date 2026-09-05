/**
 * CHARACTERIZATION — documents current Fit Score confidence/freshness adjustments.
 * Not desired semantics; locks current blend before confidence-gate work.
 */

import assert from 'node:assert/strict';
import { computeGhostYieldFitScore } from '../scoring';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;

{
  // Keep scores away from the 0–100 clamp so confidence weights are visible.
  const shared = {
    currentYield: 0.04,
    distributionQuality: 'mixed' as const,
    sleeveType: 'preferred_income' as const,
    yieldSource:
      'Long characterization yield source string that exceeds the simple-source length bonus threshold used by Fit scoring in the current model.',
  };
  const rowHigh = baseCandidate({ ...shared, dataConfidence: 'high', confidence: 'high' });
  const rowLow = baseCandidate({ ...shared, dataConfidence: 'low', confidence: 'low' });
  // Hold freshness constant so only confidence weights differ.
  // Note: fresh+high also gets +4 freshness bonus; fresh+low gets no freshness term.
  const fresh = {
    status: 'fresh' as const,
    warnings: [] as string[],
    applyScoringPenalty: false,
  };
  const fitHigh = computeGhostYieldFitScore(rowHigh, fresh);
  const fitLow = computeGhostYieldFitScore(rowLow, fresh);
  // Current: high +6 and fresh+high +4; low -8 and fresh+low +0 → delta 18
  assert.equal(fitHigh - fitLow, 18);
  assert.ok(fitHigh < 100 && fitLow > 0, 'scores must be unclamped for this characterization');
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
  const cautionFit = computeGhostYieldFitScore(row, {
    status: 'caution',
    warnings: ['forced'],
    applyScoringPenalty: true,
  });

  // Current: fresh+high +4; missing/stale -10; caution -4
  assert.equal(freshFit - missingFit, 14);
  assert.equal(freshFit - staleFit, 14);
  assert.equal(freshFit - cautionFit, 8);
  assert.ok(freshFit < 100 && missingFit > 0);
}

// End-to-end: missing NAV path reduces Fit vs identical row with NAV (current rules)
{
  const withNav = baseCandidate({ nav: 100, navDataAsOf: '2026-05-07' });
  const noNav = baseCandidate({ nav: null, navDataAsOf: undefined });
  const fNav = evaluateCandidateFreshness(withNav, REF);
  const fMissing = evaluateCandidateFreshness(noNav, REF);
  assert.equal(fNav.status, 'fresh');
  assert.equal(fMissing.status, 'missing');
  const fitNav = computeGhostYieldFitScore(withNav, fNav);
  const fitMissing = computeGhostYieldFitScore(noNav, fMissing);
  assert.ok(fitNav > fitMissing);
}

console.log('ghostyield/fitDataPenalties.test.ts: ok (CHARACTERIZATION of current blend)');
