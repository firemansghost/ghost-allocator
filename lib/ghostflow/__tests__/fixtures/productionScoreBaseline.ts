/**
 * Canonical GhostFlow production score baseline for test assertions.
 * Mirrors committed production expectations — not a second scoring implementation.
 */

export const PRODUCTION_SCORE_BASELINE = {
  referenceAsOf: '2026-07-01',
  composite: 60,
  passive: 53,
  structural: 67,
  bandLabel: 'Elevated Flow Pressure',
  publicSignalCount: 13,
  mockPassiveInputs: {
    systematicStrategyPressure: 62,
    retirementFlowPressureProxy: 58,
    leveredEtfRebalancePressure: 55,
  },
} as const;
