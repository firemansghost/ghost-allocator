/**
 * Fixed Volatility Regime artifacts for deterministic GhostFlow tests.
 * Do not tie these to the committed manual artifact in data/ghostflow/artifacts/.
 */

import type { VolatilityRegimeArtifactV1 } from '@/lib/ghostflow/artifacts/types';

/** VIX 17.44 — maps to proxy 37; merged composite score 59 with default mock inputs. */
export const FIXTURE_VOL_REGIME_MERGE: VolatilityRegimeArtifactV1 = {
  artifactVersion: '1',
  signalId: 'vol-regime',
  asOf: '2026-01-15',
  publishedAt: '2026-01-15',
  source: {
    name: 'CBOE VIX History (test fixture)',
    url: 'https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv',
    note: 'Deterministic test fixture — not live data.',
  },
  updateFrequency: 'daily',
  dataQuality: 'verified_manual',
  observations: { vixClose: 17.44 },
};

export const FIXTURE_MERGE_REFERENCE_AS_OF = '2026-01-15';

/** Reference date 10+ trading days after FIXTURE_VOL_REGIME_MERGE.asOf → stale. */
export const FIXTURE_STALE_REFERENCE_AS_OF = '2026-01-29';

/** Expected deterministic outputs for FIXTURE_VOL_REGIME_MERGE + default mock snapshot. */
export const FIXTURE_MERGE_EXPECTED = {
  volProxy: 37,
  passivePressure: 56,
  structuralFragility: 62,
  compositeScore: 59,
} as const;
