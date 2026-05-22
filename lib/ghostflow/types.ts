/**
 * GhostFlow — static market-structure dashboard types (mock snapshot + manual public artifacts).
 */

import type {
  GhostFlowArtifactDataQuality,
  GhostFlowArtifactFreshnessStatus,
} from './artifacts/types';

export type { GhostFlowArtifactFreshnessStatus, GhostFlowArtifactDataQuality };

export type GhostFlowSignalStatus = 'quiet' | 'watch' | 'elevated' | 'stress';

export type GhostFlowDataStatus = 'mock' | 'public_proxy' | 'future_live';

export type GhostFlowDataMix = 'mock' | 'mixed';

/** Sub-inputs for Passive Pressure Score (each 0–100, higher = more mechanical pressure). */
export interface PassivePressureInputs {
  etfFundFlowImpulse: number;
  systematicStrategyPressure: number;
  optionsVolatilityAmplifier: number;
  retirementFlowPressureProxy: number;
  leveredEtfRebalancePressure: number;
}

/** Sub-inputs for Structural Fragility Score (each 0–100, higher = more fragile structure). */
export interface StructuralFragilityInputs {
  passiveShareProxy: number;
  activeShareOffsetProxy: number;
  indexConcentration: number;
  breadthWeakness: number;
  modelZoneProximity: number;
}

export interface GhostFlowSignal {
  id: string;
  name: string;
  /** Display value (may include units, e.g. "58%"). */
  value: string;
  /** 0–100 for status derivation when applicable. */
  numericValue: number;
  explanation: string;
  dataStatus: GhostFlowDataStatus;
  updateFrequencyTarget: string;
  /** Public artifact provenance (v0.2+). */
  sourceName?: string;
  sourceUrl?: string;
  sourceNote?: string;
  dataQuality?: GhostFlowArtifactDataQuality;
  artifactAsOf?: string;
  freshnessStatus?: GhostFlowArtifactFreshnessStatus;
}

export interface GhostFlowRawSnapshot {
  asOf: string;
  passiveSharePercent: number;
  passivePressure: PassivePressureInputs;
  structuralFragility: StructuralFragilityInputs;
  signals: GhostFlowSignal[];
}

export type GhostFlowBand =
  | 'quiet_plumbing'
  | 'normal_mechanical'
  | 'elevated_flow'
  | 'crowded_reflexive'
  | 'fragility_zone';

export interface GhostFlowSubScores {
  passivePressure: number;
  structuralFragility: number;
}

export interface GhostFlowScoreResult {
  score: number;
  band: GhostFlowBand;
  bandLabel: string;
  interpretation: string;
  subScores: GhostFlowSubScores;
}

export type PassiveShareBandId =
  | 'normal'
  | 'watch'
  | 'pre_stress'
  | 'model_stress'
  | 'severe_fragility'
  | 'cubic_volatility'
  | 'theoretical_feller';

export interface PassiveShareBandInfo {
  id: PassiveShareBandId;
  rangeLabel: string;
  description: string;
}

export interface ScoredGhostFlowSignal extends GhostFlowSignal {
  status: GhostFlowSignalStatus;
}

export interface GhostFlowDashboardData {
  asOf: string;
  passiveSharePercent: number;
  passiveShareBand: PassiveShareBandInfo;
  score: GhostFlowScoreResult;
  signals: ScoredGhostFlowSignal[];
  passivePressureInputs: PassivePressureInputs;
  structuralFragilityInputs: StructuralFragilityInputs;
  /** v0.2 mixed mock/public snapshot metadata. */
  dataMix?: GhostFlowDataMix;
  freshnessWarnings?: string[];
  publicPassiveInputKeys?: Array<keyof PassivePressureInputs>;
}
