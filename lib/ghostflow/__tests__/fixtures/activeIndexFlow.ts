/**
 * Fixed Active vs Index Flow artifacts for deterministic GhostFlow tests.
 */

import type { ActiveIndexFlowArtifactV1 } from '@/lib/ghostflow/artifacts/types';

/** March 2026 domestic equity flows — differential 53714 → proxy 72. */
export const FIXTURE_ACTIVE_INDEX_FLOW_MERGE: ActiveIndexFlowArtifactV1 = {
  artifactVersion: '1',
  signalId: 'active-index-flow',
  asOf: '2026-03-31',
  publishedAt: '2026-04-30',
  source: {
    name: 'ICI Active and Index Investing (test fixture)',
    url: 'https://www.ici.org/research/stats/combined_active_index',
    note: 'Deterministic test fixture — not live data.',
  },
  seriesDefinition: 'domestic_equity_active_index_monthly_net_flows',
  updateFrequency: 'monthly',
  dataQuality: 'verified_manual',
  observations: {
    activeDomesticEquityNetFlowMillionsUsd: -22251,
    indexDomesticEquityNetFlowMillionsUsd: 31463,
  },
};

export const FIXTURE_ACTIVE_INDEX_MERGE_REFERENCE_AS_OF = '2026-05-21';

/** Reference 56 calendar days after publishedAt → stale monthly artifact. */
export const FIXTURE_ACTIVE_INDEX_STALE_REFERENCE_AS_OF = '2026-06-25';

export const FIXTURE_ACTIVE_INDEX_MERGE_EXPECTED = {
  differentialMillions: 53714,
  flowTiltProxy: 72,
  /** Active-index only merge (mock structural inputs otherwise). */
  activeIndexOnlyStructuralFragility: 66,
} as const;

/** Triple-artifact fixture with vol + ETF + active/index at reference 2026-05-21. */
export const FIXTURE_TRIPLE_MERGE_EXPECTED = {
  compositeScore: 61,
  structuralFragility: 66,
} as const;
