/**
 * Fixed ETF Net Issuance artifacts for deterministic GhostFlow tests.
 */

import type { EtfNetIssuanceArtifactV1 } from '@/lib/ghostflow/artifacts/types';

/** $20.0B domestic equity weekly issuance — maps to proxy 61 with default mock + vol fixture. */
export const FIXTURE_ETF_NET_ISSUANCE_MERGE: EtfNetIssuanceArtifactV1 = {
  artifactVersion: '1',
  signalId: 'etf-flow',
  asOf: '2026-01-08',
  publishedAt: '2026-01-15',
  source: {
    name: 'ICI Estimated ETF Net Issuance (test fixture)',
    url: 'https://www.ici.org/research/stats/etf_flows',
    note: 'Deterministic test fixture — not live data.',
  },
  seriesDefinition: 'domestic_equity_etf_estimated_weekly_net_issuance',
  updateFrequency: 'weekly',
  dataQuality: 'verified_manual',
  observations: { domesticEquityNetIssuanceMillionsUsd: 20000 },
};

export const FIXTURE_ETF_MERGE_REFERENCE_AS_OF = '2026-01-15';

/** Reference 16 calendar days after publishedAt → stale weekly artifact. */
export const FIXTURE_ETF_STALE_REFERENCE_AS_OF = '2026-01-31';

export const FIXTURE_ETF_MERGE_EXPECTED = {
  issuanceProxy: 61,
  /** ETF-only merge (mock vol 70 unchanged). */
  etfOnlyPassivePressure: 62,
  structuralFragility: 62,
} as const;

/** Dual-artifact fixture: vol 17.44 + ETF 20000 with reference 2026-01-15. */
export const FIXTURE_DUAL_MERGE_EXPECTED = {
  compositeScore: 59,
  passivePressure: 55,
} as const;
