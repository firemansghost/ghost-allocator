/**
 * Authorized Risk headline-yield resolver contract.
 * Does not mutate candidate data. SEC yield is never a fallback.
 * CEF payout stress may still coexist with this absolute-level term.
 */

import assert from 'node:assert/strict';
import { computeGhostYieldRiskScore, effectiveRiskHeadlineYield } from '../scoring';
import { deriveEvidenceGate } from '../evidenceGate';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const fresh = {
  status: 'fresh' as const,
  warnings: [] as string[],
  applyScoringPenalty: false,
};

{
  const row = baseCandidate({
    currentYield: 0.13,
    distributionRate: 0.08,
    secYield: 0.2,
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
  });
  assert.equal(effectiveRiskHeadlineYield(row), 0.13, 'currentYield always wins');
}

{
  const row = baseCandidate({
    currentYield: null,
    distributionRate: 0.11,
    secYield: 0.2,
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    cefMetrics: undefined,
  });
  assert.equal(effectiveRiskHeadlineYield(row), 0.11);
  const withDist = computeGhostYieldRiskScore(row, fresh);
  const noDist = computeGhostYieldRiskScore({ ...row, distributionRate: undefined }, fresh);
  assert.ok(withDist > noDist, 'CEF distributionRate drives yieldRiskPoints when currentYield is null');
}

{
  const structured = baseCandidate({
    currentYield: null,
    distributionRate: 0.08,
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    cefMetrics: { distributionRate: 0.12, sourceNote: 'characterization' },
  });
  const topOnly = baseCandidate({
    currentYield: null,
    distributionRate: 0.12,
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    cefMetrics: { sourceNote: 'characterization' },
  });
  assert.equal(effectiveRiskHeadlineYield(structured), 0.12);
  assert.equal(effectiveRiskHeadlineYield(topOnly), 0.12);
  assert.equal(
    computeGhostYieldRiskScore(structured, fresh),
    computeGhostYieldRiskScore(topOnly, fresh),
    'cefMetrics.distributionRate uses the same structured precedence as CEF payout-stress'
  );
}

{
  const row = baseCandidate({
    currentYield: null,
    distributionRate: 0.1116,
    secYield: 0.2,
    sleeveType: 'option_income',
    structureLabel: 'ETF',
  });
  assert.equal(effectiveRiskHeadlineYield(row), 0.1116);
}

{
  const row = baseCandidate({
    currentYield: null,
    distributionRate: undefined,
    secYield: 0.2,
    sleeveType: 'option_income',
    structureLabel: 'ETF',
  });
  assert.equal(effectiveRiskHeadlineYield(row), null, 'option_income does not fall back to secYield');
}

{
  const row = baseCandidate({
    currentYield: null,
    distributionRate: 0.114,
    secYield: 0.2,
    sleeveType: 'bdc_income',
    structureLabel: 'Listed BDC (stock)',
    bdcMetrics: { sourceNote: 'characterization' },
  });
  assert.equal(effectiveRiskHeadlineYield(row), null, 'structured BDC must not use Dist/SEC headline fallback');
}

{
  const listedNoMetrics = baseCandidate({
    currentYield: null,
    distributionRate: 0.114,
    secYield: 0.2,
    sleeveType: 'bdc_income',
    structureLabel: 'Listed BDC (stock)',
    bdcMetrics: undefined,
  });
  assert.equal(effectiveRiskHeadlineYield(listedNoMetrics), null);
}

{
  const cash = baseCandidate({
    currentYield: null,
    distributionRate: undefined,
    secYield: 0.2,
    sleeveType: 'cash_tbills',
    structureLabel: 'ETF',
  });
  const credit = baseCandidate({
    currentYield: null,
    distributionRate: undefined,
    secYield: 0.2,
    sleeveType: 'credit_income',
    structureLabel: 'ETF',
  });
  const pref = baseCandidate({
    currentYield: null,
    distributionRate: undefined,
    secYield: 0.2,
    sleeveType: 'preferred_income',
    structureLabel: 'ETF',
  });
  assert.equal(effectiveRiskHeadlineYield(cash), null);
  assert.equal(effectiveRiskHeadlineYield(credit), null);
  assert.equal(effectiveRiskHeadlineYield(pref), null);
  assert.equal(
    computeGhostYieldRiskScore(cash, fresh),
    computeGhostYieldRiskScore({ ...cash, secYield: undefined }, fresh)
  );
  assert.equal(
    computeGhostYieldRiskScore(credit, fresh),
    computeGhostYieldRiskScore({ ...credit, secYield: undefined }, fresh)
  );
  assert.equal(
    computeGhostYieldRiskScore(pref, fresh),
    computeGhostYieldRiskScore({ ...pref, secYield: undefined }, fresh)
  );
}

{
  const row = baseCandidate({
    currentYield: null,
    distributionRate: 0.11,
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
  });
  const originalDist = row.distributionRate;
  computeGhostYieldRiskScore(row, fresh);
  assert.equal(row.currentYield, null);
  assert.equal(row.distributionRate, originalDist, 'resolver does not mutate row fields');
}

{
  const row = baseCandidate({
    currentYield: null,
    distributionRate: 0.11,
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    nav: 100,
    navDataAsOf: '2026-05-07',
    dataConfidence: 'high',
    confidence: 'high',
  });
  const f = evaluateCandidateFreshness(row, TEST_REFERENCE_AS_OF);
  assert.equal(deriveEvidenceGate(row, f), 'clear');
  computeGhostYieldRiskScore(row, f);
  assert.equal(deriveEvidenceGate(row, f), 'clear', 'Evidence gate is independent of headline-yield Risk');
}

{
  const a = baseCandidate({
    currentYield: null,
    distributionRate: 0.11,
    sleeveType: 'option_income',
    structureLabel: 'ETF',
  });
  const b = { ...a };
  assert.equal(computeGhostYieldRiskScore(a, fresh), computeGhostYieldRiskScore(b, fresh));
}

console.log('ghostyield/headlineYieldRisk.test.ts: ok');
