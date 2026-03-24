/**
 * GhostRegime Methodology Page Copy
 * 
 * Centralized copy for the methodology page.
 * Keep it educational and non-prescriptive.
 * Product stance: see `productPositioning.ts`.
 */

import {
  METHODOLOGY_LEAD_PARAGRAPH,
  METHODOLOGY_SECOND_PARAGRAPH,
} from './productPositioning';

export const METHODOLOGY_REGIMES_AT_GLANCE_TITLE = 'Regimes at a glance';
export const METHODOLOGY_HOW_MAP_CHOSEN_TITLE = 'How the map is chosen';
export const METHODOLOGY_HOW_ALLOCATIONS_TITLE = 'How allocations are produced';

export const METHODOLOGY_KISS_ALIGNMENT_SECTION_TITLE = 'KISS-aligned targets and sleeve signals';

/** KISS-style targets vs independent proxy-VAMS sleeve scaling — sourced from productPositioning. */
export const METHODOLOGY_KISS_ALIGNMENT_INTRO_PARAGRAPHS = [
  METHODOLOGY_LEAD_PARAGRAPH,
  METHODOLOGY_SECOND_PARAGRAPH,
];

/** One compact disclaimer: proxy symbols vs external daily labels */
export const METHODOLOGY_VAMS_EXTERNAL_LABELS_NOTE =
  'These proxy symbols drive our in-app VAMS scales. They are not guaranteed to match any external vendor\'s daily published sleeve labels unless we explicitly ingest those labels later.';

export const METHODOLOGY_SYMBOL_DISCLOSURE_LINES = [
  'Stocks sleeve VAMS uses SPY (close-to-close series as fetched).',
  'Gold sleeve VAMS uses GLD.',
  'Bitcoin sleeve VAMS uses BTC-USD (spot/series as implemented in the app\'s market data provider).',
];

export const METHODOLOGY_HOW_MAP_CHOSEN_STEPS = [
  'Signals vote on risk and inflation directions',
  'Axis scores determine which quadrant',
  'Quadrant maps to a regime (GOLDILOCKS, REFLATION, INFLATION, DEFLATION)',
];

export const METHODOLOGY_HOW_ALLOCATIONS_STEPS = [
  'Targets: Baseline weights by regime (not one static split everywhere)—e.g. a common anchor is 60/30/10 for stocks/gold/Bitcoin in calm regimes, with shifts such as higher gold (e.g. 15%) in INFLATION and other regime-dependent mixes',
  'Scales: How much exposure to take today (1.0 = full, 0.5 = half, 0.0 = off)',
  'Actual: Target × Scale (what you\'d allocate if rebalancing today)',
  'Cash: Leftover after scaling down (sits unallocated until rebalance)',
];
