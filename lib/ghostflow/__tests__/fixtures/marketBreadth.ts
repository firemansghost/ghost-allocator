/**
 * Fixed Market Breadth Participation artifacts for deterministic GhostFlow tests.
 */

import type { MarketBreadthArtifactV1 } from '@/lib/ghostflow/artifacts/types';

/** 56.8% above 50DMA → weakness proxy 42. */
export const FIXTURE_MARKET_BREADTH_MERGE: MarketBreadthArtifactV1 = {
  artifactVersion: '1',
  signalId: 'breadth',
  asOf: '2026-05-21',
  publishedAt: '2026-05-21',
  source: {
    name: 'StockCharts $SPXA50R (test fixture)',
    url: 'https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R',
    note: 'Deterministic test fixture — not live data.',
  },
  seriesDefinition: 'sp500_percent_above_50_day_ma',
  updateFrequency: 'daily',
  dataQuality: 'verified_manual',
  observations: {
    sp500Above50DayMaPercent: 56.8,
  },
  optionalObservations: {
    sourceSymbol: '$SPXA50R',
    backupSourceName: 'Barchart $S5FI (test fixture)',
    backupReadingPercent: 56.77,
  },
};

export const FIXTURE_MARKET_BREADTH_MERGE_REFERENCE_AS_OF = '2026-05-21';

/** Reference 10+ trading days after asOf → stale daily artifact. */
export const FIXTURE_MARKET_BREADTH_STALE_REFERENCE_AS_OF = '2026-06-04';

export const FIXTURE_MARKET_BREADTH_MERGE_EXPECTED = {
  strengthPercent: 56.8,
  breadthWeaknessProxy: 42,
  /** Breadth-only merge (mock structural inputs otherwise). */
  breadthOnlyStructuralFragility: 58,
} as const;

/** Hexa-artifact fixture at reference 2026-05-21. */
export const FIXTURE_HEXA_MERGE_EXPECTED = {
  compositeScore: 58,
  structuralFragility: 61,
} as const;
