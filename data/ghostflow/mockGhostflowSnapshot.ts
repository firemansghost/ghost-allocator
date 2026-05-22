/**
 * GhostFlow v0.1 — illustrative mock snapshot (no live feeds).
 * Inputs tuned so composite GhostFlow Score ≈ 62 (Crowded / Reflexive band).
 */

import type { GhostFlowRawSnapshot } from '@/lib/ghostflow/types';

export const GHOSTFLOW_SNAPSHOT_AS_OF = '2026-05-01';

export const MOCK_GHOSTFLOW_SNAPSHOT: GhostFlowRawSnapshot = {
  asOf: GHOSTFLOW_SNAPSHOT_AS_OF,
  passiveSharePercent: 58,
  passivePressure: {
    etfFundFlowImpulse: 64,
    systematicStrategyPressure: 62,
    optionsVolatilityAmplifier: 70,
    retirementFlowPressureProxy: 58,
    leveredEtfRebalancePressure: 55,
  },
  structuralFragility: {
    passiveShareProxy: 65,
    activeShareOffsetProxy: 55,
    indexConcentration: 68,
    breadthWeakness: 68,
    modelZoneProximity: 52,
  },
  signals: [
    {
      id: 'passive-share',
      name: 'Passive Share Proxy',
      value: '58%',
      numericValue: 58,
      explanation:
        'Illustrative passive-share proxy — not a live estimate. In the watch band (50–60%); below the 65% model zone.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Monthly (future)',
    },
    {
      id: 'distance-65',
      name: 'Distance to 65% Model Stress Zone',
      value: '7 pp',
      numericValue: 42,
      explanation:
        'Seven percentage points below the 65% assumption-sensitive stress zone in published passive-flow research framing — not a countdown.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Monthly (future)',
    },
    {
      id: 'etf-flow',
      name: 'ETF Flow Impulse',
      value: 'Elevated inflow bias',
      numericValue: 64,
      explanation:
        'Mock proxy for ETF/fund-flow impulse — systematic buying pressure from index-linked products.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Weekly (future)',
    },
    {
      id: 'concentration',
      name: 'Index Concentration',
      value: 'Top-heavy',
      numericValue: 68,
      explanation:
        'Mock proxy for cap-weight concentration — fewer names driving more of the index return.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Monthly (future)',
    },
    {
      id: 'breadth',
      name: 'Breadth Participation',
      value: 'Narrow',
      numericValue: 68,
      explanation:
        'Mock breadth proxy — participation looks uneven; rallies may be driven by a smaller set of leaders.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Daily (future)',
    },
    {
      id: 'vol-regime',
      name: 'Volatility Regime',
      value: 'Elevated',
      numericValue: 62,
      explanation:
        'Mock vol-regime proxy — implied and realized vol above a quiet baseline; not a crash signal.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Daily (future)',
    },
    {
      id: 'odte-options',
      name: '0DTE / Options Pressure',
      value: 'High gamma sensitivity',
      numericValue: 70,
      explanation:
        'Mock options-market pressure proxy — short-dated positioning may amplify moves; plumbing, not prophecy.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Daily (future)',
    },
    {
      id: 'systematic-flow',
      name: 'Systematic Flow Proxy',
      value: 'CTA / vol-control tilt',
      numericValue: 62,
      explanation:
        'Mock systematic-strategy pressure — trend and vol-targeting flows may reinforce direction; watch, don’t worship.',
      dataStatus: 'mock',
      updateFrequencyTarget: 'Weekly (future)',
    },
  ],
};
