/**
 * Fixed Index Concentration artifacts for deterministic GhostFlow tests.
 */

import type { IndexConcentrationArtifactV1 } from '@/lib/ghostflow/artifacts/types';

/** March 2026 SSGA SPY fact sheet — top 10 weight 36.5% → proxy 70. */
export const FIXTURE_INDEX_CONCENTRATION_MERGE: IndexConcentrationArtifactV1 = {
  artifactVersion: '1',
  signalId: 'concentration',
  asOf: '2026-03-31',
  publishedAt: '2026-04-09',
  source: {
    name: 'SSGA SPY US Monthly Fact Sheet (test fixture)',
    url: 'https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf',
    note: 'Deterministic test fixture — not live data.',
  },
  seriesDefinition: 'sp500_index_top10_weight_percent',
  updateFrequency: 'monthly',
  dataQuality: 'verified_manual',
  observations: {
    sp500Top10IndexWeightPercent: 36.5,
  },
};

export const FIXTURE_INDEX_CONCENTRATION_MERGE_REFERENCE_AS_OF = '2026-05-21';

/** Reference 56 calendar days after publishedAt → stale monthly artifact. */
export const FIXTURE_INDEX_CONCENTRATION_STALE_REFERENCE_AS_OF = '2026-06-04';

export const FIXTURE_INDEX_CONCENTRATION_MERGE_EXPECTED = {
  top10WeightPercent: 36.5,
  concentrationProxy: 70,
  /** Index-concentration only merge (mock structural inputs otherwise). */
  indexConcentrationOnlyStructuralFragility: 63,
} as const;

/** Quad-artifact fixture with vol + ETF + active/index + concentration at reference 2026-05-21. */
export const FIXTURE_QUAD_MERGE_EXPECTED = {
  compositeScore: 61,
  structuralFragility: 66,
} as const;
