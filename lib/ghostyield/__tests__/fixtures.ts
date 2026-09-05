/**
 * Synthetic GhostYield rows for characterization tests only.
 * Not production data; do not use to refresh candidates.manual.json.
 */

import type { GhostYieldCandidateRaw } from '../types';

/** Fixed reference used by synthetic freshness tests — not Date.now(). */
export const TEST_REFERENCE_AS_OF = '2026-05-08';

export function baseCandidate(
  overrides: Partial<GhostYieldCandidateRaw> = {}
): GhostYieldCandidateRaw {
  return {
    ticker: 'TEST',
    name: 'Characterization Fixture',
    sleeveType: 'credit_income',
    structureLabel: 'ETF',
    yieldSource: 'Corporate credit coupons.',
    currentYield: 0.05,
    distributionQuality: 'strong',
    role: 'Test role',
    mainRisks: ['Test risk'],
    bestUseCase: 'Test use',
    avoidIf: 'Test avoid',
    dataAsOf: TEST_REFERENCE_AS_OF,
    sourceLabel: 'Characterization fixture (not a live source)',
    confidence: 'high',
    dataConfidence: 'high',
    nav: 100,
    marketPrice: 100,
    navDataAsOf: '2026-05-07',
    distributionDataAsOf: '2026-05-01',
    latestDistributionDate: '2026-05-01',
    latestDistributionAmount: 0.1,
    distributionRate: 0.05,
    ...overrides,
  };
}
