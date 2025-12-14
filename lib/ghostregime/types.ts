/**
 * GhostRegime v1 Type Definitions
 * Core types for market regime classification and allocation system
 */

export type RegimeType = 'GOLDILOCKS' | 'REFLATION' | 'INFLATION' | 'DEFLATION';

export type RiskRegime = 'RISK ON' | 'RISK OFF';

export type VamsState = -2 | 0 | 2;

export type FlipWatchStatus = 'NONE' | 'BREWING' | 'PENDING_CONFIRMATION' | 'STRONG_FLIP';

export type SourceType = 'replay' | 'computed';

export interface MarketDataPoint {
  symbol: string;
  date: Date;
  close: number;
  returns?: number; // Daily close-to-close return
}

export interface SatelliteData {
  series: string;
  value: number;
  observationDate: Date;
  age_days: number;
}

export interface AllocationOutput {
  stocks_target: number;
  gold_target: number;
  btc_target: number;
  stocks_scale: number;
  gold_scale: number;
  btc_scale: number;
  stocks_actual: number;
  gold_actual: number;
  btc_actual: number;
  cash: number;
}

export interface GhostRegimeRow {
  date: string; // ISO date string (UTC)
  regime: RegimeType;
  risk_regime: RiskRegime;
  risk_score: number;
  infl_score: number;
  infl_core_score: number;
  infl_sat_score: number;
  stocks_vams_state: VamsState;
  gold_vams_state: VamsState;
  btc_vams_state: VamsState;
  stocks_target: number;
  gold_target: number;
  btc_target: number;
  stocks_scale: number;
  gold_scale: number;
  btc_scale: number;
  stocks_actual: number;
  gold_actual: number;
  btc_actual: number;
  cash: number;
  flip_watch_status: FlipWatchStatus;
  source: SourceType;
  stale?: boolean;
  stale_reason?: string;
}

export interface SeedStatus {
  exists: boolean;
  isEmpty: boolean;
  path: string;
}

export interface StorageMeta {
  version: string;
  lastUpdated: Date;
}

export interface CalibrationResult {
  thresholds: Record<string, number>;
  disagreementReduction: number;
}

