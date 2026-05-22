/**
 * GhostFlow v0.1 — transparent static scoring (pure functions, no I/O).
 *
 * GhostFlow Score = 50% Passive Pressure + 50% Structural Fragility
 */

import type {
  GhostFlowBand,
  GhostFlowRawSnapshot,
  GhostFlowScoreResult,
  GhostFlowDashboardData,
  GhostFlowSignalStatus,
  PassivePressureInputs,
  PassiveShareBandInfo,
  ScoredGhostFlowSignal,
  StructuralFragilityInputs,
} from './types';

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function clampInput(n: number): number {
  return clampInt(n, 0, 100);
}

export function computePassivePressureScore(inputs: PassivePressureInputs): number {
  const e = clampInput(inputs.etfFundFlowImpulse);
  const s = clampInput(inputs.systematicStrategyPressure);
  const o = clampInput(inputs.optionsVolatilityAmplifier);
  const r = clampInput(inputs.retirementFlowPressureProxy);
  const l = clampInput(inputs.leveredEtfRebalancePressure);
  return clampInt(0.25 * e + 0.2 * s + 0.2 * o + 0.2 * r + 0.15 * l, 0, 100);
}

export function computeStructuralFragilityScore(inputs: StructuralFragilityInputs): number {
  const p = clampInput(inputs.passiveShareProxy);
  const a = clampInput(inputs.activeShareOffsetProxy);
  const i = clampInput(inputs.indexConcentration);
  const b = clampInput(inputs.breadthWeakness);
  const m = clampInput(inputs.modelZoneProximity);
  return clampInt(0.3 * p + 0.2 * a + 0.2 * i + 0.15 * b + 0.15 * m, 0, 100);
}

export function computeGhostFlowScore(passivePressure: number, structuralFragility: number): number {
  return clampInt(0.5 * passivePressure + 0.5 * structuralFragility, 0, 100);
}

export function ghostFlowBand(score: number): GhostFlowBand {
  const s = clampInt(score, 0, 100);
  if (s <= 20) return 'quiet_plumbing';
  if (s <= 40) return 'normal_mechanical';
  if (s <= 60) return 'elevated_flow';
  if (s <= 80) return 'crowded_reflexive';
  return 'fragility_zone';
}

export function ghostFlowBandLabel(band: GhostFlowBand): string {
  switch (band) {
    case 'quiet_plumbing':
      return 'Quiet Plumbing';
    case 'normal_mechanical':
      return 'Normal Mechanical Pressure';
    case 'elevated_flow':
      return 'Elevated Flow Pressure';
    case 'crowded_reflexive':
      return 'Crowded / Reflexive';
    case 'fragility_zone':
      return 'Fragility Zone';
  }
}

/** GhostFlow Score bands (0–100 composite). Documented in UI and tests. */
export const GHOSTFLOW_SCORE_BANDS: ReadonlyArray<{ min: number; max: number; label: string }> = [
  { min: 0, max: 20, label: 'Quiet Plumbing' },
  { min: 21, max: 40, label: 'Normal Mechanical Pressure' },
  { min: 41, max: 60, label: 'Elevated Flow Pressure' },
  { min: 61, max: 80, label: 'Crowded / Reflexive' },
  { min: 81, max: 100, label: 'Fragility Zone' },
];

export function ghostFlowInterpretation(band: GhostFlowBand): string {
  switch (band) {
    case 'quiet_plumbing':
      return 'Mechanical flows look subdued. Still not without trade-offs—just less reflexive on the margin.';
    case 'normal_mechanical':
      return 'Autopilot is present but not dominating the tape. Worth watching, not worth panicking.';
    case 'elevated_flow':
      return 'Flow pressure is building. Price discovery may be sharing the wheel more than usual.';
    case 'crowded_reflexive':
      return 'Markets look more reflexive and flow-driven. Not apocalyptic—just less anchored to fundamentals.';
    case 'fragility_zone':
      return 'Structure looks crowded and fragile on the model. Context for caution—not a crash countdown.';
  }
}

/** Map 0–100 proxy to signal status (higher = more pressure / concern). */
export function signalStatusFromValue(n: number): GhostFlowSignalStatus {
  const v = clampInt(n, 0, 100);
  if (v <= 25) return 'quiet';
  if (v <= 45) return 'watch';
  if (v <= 65) return 'elevated';
  return 'stress';
}

export function passiveShareBand(percent: number): PassiveShareBandInfo {
  const p = Math.max(0, percent);
  if (p < 50) {
    return {
      id: 'normal',
      rangeLabel: 'Below 50%',
      description: 'Normal — passive share below early watch thresholds in the model framing.',
    };
  }
  if (p < 60) {
    return {
      id: 'watch',
      rangeLabel: '50–60%',
      description: 'Watch — passive share rising; mechanical bid influence may be increasing.',
    };
  }
  if (p < 65) {
    return {
      id: 'pre_stress',
      rangeLabel: '60–65%',
      description: 'Pre-stress — approaching assumption-sensitive model zone; not yet at 65%.',
    };
  }
  if (p < 75) {
    return {
      id: 'model_stress',
      rangeLabel: '65–75%',
      description: 'Model Stress Zone — volatility may rise sharply in published passive-flow models; not a guaranteed crash line.',
    };
  }
  if (p < 87) {
    return {
      id: 'severe_fragility',
      rangeLabel: '75–87%',
      description: 'Severe Fragility — model interpretation band for elevated structural vulnerability.',
    };
  }
  if (p < 91) {
    return {
      id: 'cubic_volatility',
      rangeLabel: '87–91%',
      description: 'Cubic Volatility Zone — theoretical model band; highly assumption-sensitive.',
    };
  }
  return {
    id: 'theoretical_feller',
    rangeLabel: 'Above 91%',
    description: 'Theoretical Feller Zone — model extreme; not treated as a forecast here.',
  };
}

export const PASSIVE_SHARE_BANDS: PassiveShareBandInfo[] = [
  { id: 'normal', rangeLabel: 'Below 50%', description: 'Normal' },
  { id: 'watch', rangeLabel: '50–60%', description: 'Watch' },
  { id: 'pre_stress', rangeLabel: '60–65%', description: 'Pre-stress' },
  {
    id: 'model_stress',
    rangeLabel: '65–75%',
    description: 'Model Stress Zone — assumption-sensitive; not a guaranteed crash line',
  },
  { id: 'severe_fragility', rangeLabel: '75–87%', description: 'Severe Fragility' },
  { id: 'cubic_volatility', rangeLabel: '87–91%', description: 'Cubic Volatility Zone' },
  { id: 'theoretical_feller', rangeLabel: 'Above 91%', description: 'Theoretical Feller Zone' },
];

export function scoreGhostFlowSnapshot(raw: GhostFlowRawSnapshot): GhostFlowDashboardData {
  const passivePressure = computePassivePressureScore(raw.passivePressure);
  const structuralFragility = computeStructuralFragilityScore(raw.structuralFragility);
  const score = computeGhostFlowScore(passivePressure, structuralFragility);
  const band = ghostFlowBand(score);

  const scoreResult: GhostFlowScoreResult = {
    score,
    band,
    bandLabel: ghostFlowBandLabel(band),
    interpretation: ghostFlowInterpretation(band),
    subScores: { passivePressure, structuralFragility },
  };

  const signals: ScoredGhostFlowSignal[] = raw.signals.map((sig) => ({
    ...sig,
    status: signalStatusFromValue(sig.numericValue),
  }));

  return {
    asOf: raw.asOf,
    passiveSharePercent: raw.passiveSharePercent,
    passiveShareBand: passiveShareBand(raw.passiveSharePercent),
    score: scoreResult,
    signals,
    passivePressureInputs: raw.passivePressure,
    structuralFragilityInputs: raw.structuralFragility,
  };
}

export function distanceToModelStressZone(passiveSharePercent: number, threshold = 65): number {
  return Math.max(0, threshold - passiveSharePercent);
}
