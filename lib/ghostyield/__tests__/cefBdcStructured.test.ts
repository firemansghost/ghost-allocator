/**
 * CHARACTERIZATION — current CEF/BDC structured-field precedence in Risk scoring.
 * Does not change precedence or validator mismatch policy.
 */

import assert from 'node:assert/strict';
import { computeGhostYieldRiskScore } from '../scoring';
import { baseCandidate } from './fixtures';

const fresh = {
  status: 'fresh' as const,
  warnings: [] as string[],
  applyScoringPenalty: false,
};

// CEF: structured effectiveLeverage wins over top-level leverage
{
  const structured = baseCandidate({
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    leverage: 1.45, // would be high under generic debt/equity-style thresholds
    premiumDiscount: undefined,
    cefMetrics: {
      effectiveLeverage: 0.1, // low CEF asset leverage → small structural points
      sourceNote: 'characterization',
    },
  });
  const topLevelOnly = baseCandidate({
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    leverage: 1.45,
    premiumDiscount: undefined,
    cefMetrics: undefined,
  });
  const rStruct = computeGhostYieldRiskScore(structured, fresh);
  const rTop = computeGhostYieldRiskScore(topLevelOnly, fresh);
  assert.ok(rTop > rStruct, 'top-level leverage path should score riskier than low cefMetrics.effectiveLeverage');
}

// CEF: structured premiumDiscount preferred when cefMetrics present
{
  const fromStructured = baseCandidate({
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    leverage: undefined,
    premiumDiscount: 0, // top-level flat
    cefMetrics: {
      premiumDiscount: 0.12, // rich premium drives CEF premium risk
      sourceNote: 'characterization',
    },
  });
  const fromTop = baseCandidate({
    sleeveType: 'cef_credit',
    structureLabel: 'CEF',
    leverage: undefined,
    premiumDiscount: 0.12,
    cefMetrics: {
      // no structured premium — falls back to top-level
      sourceNote: 'characterization',
    },
  });
  assert.equal(
    computeGhostYieldRiskScore(fromStructured, fresh),
    computeGhostYieldRiskScore(fromTop, fresh)
  );
}

// BDC: structured debtToEquity replaces generic leverageRiskPoints
{
  const structured = baseCandidate({
    sleeveType: 'bdc_income',
    structureLabel: 'Listed BDC (stock)',
    leverage: 1.45,
    cefMetrics: undefined,
    bdcMetrics: {
      debtToEquity: 0.8, // low D/E tier
      sourceNote: 'characterization',
    },
  });
  const topLevelOnly = baseCandidate({
    sleeveType: 'bdc_income',
    structureLabel: 'Listed BDC (stock)',
    leverage: 1.45,
    cefMetrics: undefined,
    bdcMetrics: undefined,
  });
  assert.ok(
    computeGhostYieldRiskScore(topLevelOnly, fresh) >
      computeGhostYieldRiskScore(structured, fresh)
  );
}

console.log('ghostyield/cefBdcStructured.test.ts: ok (CHARACTERIZATION)');
