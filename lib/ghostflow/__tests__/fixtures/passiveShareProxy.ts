/**
 * Fixed ICI Index Share Proxy artifacts for deterministic GhostFlow tests.
 */

import type { PassiveShareProxyArtifactV1 } from '@/lib/ghostflow/artifacts/types';

/** March 2026 ICI domestic equity index asset share 63.2% → structural proxy 63. */
export const FIXTURE_PASSIVE_SHARE_PROXY_MERGE: PassiveShareProxyArtifactV1 = {
  artifactVersion: '1',
  signalId: 'passive-share',
  asOf: '2026-03-31',
  publishedAt: '2026-04-30',
  source: {
    name: 'ICI Active and Index Investing (test fixture)',
    url: 'https://www.ici.org/research/stats/combined_active_index',
    note: 'Deterministic test fixture — not live data.',
  },
  seriesDefinition: 'ici_domestic_equity_index_asset_share_percent',
  updateFrequency: 'monthly',
  dataQuality: 'verified_manual',
  observations: {
    activeDomesticEquityAssetsMillionsUsd: 7537800,
    indexDomesticEquityAssetsMillionsUsd: 12945700,
    indexAssetSharePercent: 63.2,
  },
};

export const FIXTURE_PASSIVE_SHARE_MERGE_REFERENCE_AS_OF = '2026-05-21';

/** Reference 56 calendar days after publishedAt → stale monthly artifact. */
export const FIXTURE_PASSIVE_SHARE_STALE_REFERENCE_AS_OF = '2026-06-25';

export const FIXTURE_PASSIVE_SHARE_MERGE_EXPECTED = {
  indexAssetSharePercent: 63.2,
  structuralProxy: 63,
  distancePp: 1.8,
  /** Passive-share only merge (mock structural inputs otherwise). */
  passiveShareOnlyStructuralFragility: 62,
} as const;

/** Penta-artifact fixture at reference 2026-05-21. */
export const FIXTURE_PENTA_MERGE_EXPECTED = {
  compositeScore: 60,
  structuralFragility: 65,
} as const;
