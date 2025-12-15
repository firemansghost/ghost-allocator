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

export type RiskAxis = 'RiskOn' | 'RiskOff';
export type InflAxis = 'Inflation' | 'Disinflation';

export interface CoreSymbolStatus {
  provider: string;
  last_date: string | null;
  obs: number;
  ok: boolean;
  note?: string;
}

export interface GhostRegimeRow {
  date: string; // ISO date string (UTC) - asof_date (latest common market close)
  run_date_utc: string; // ISO date string (UTC) - actual server date when computed
  regime: RegimeType;
  risk_regime: RiskRegime;
  risk_score: number;
  infl_score: number;
  infl_core_score: number;
  infl_sat_score: number;
  infl_total_score_pre_tiebreak?: number; // Core + satellites before tie-breaker
  risk_total_score_pre_tiebreak?: number; // Risk score before tie-breaker (for consistency)
  risk_axis: RiskAxis;
  infl_axis: InflAxis;
  risk_tiebreaker_used: boolean;
  infl_tiebreaker_used: boolean;
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
  missing_core_symbols?: string[];
  core_symbol_status?: Record<string, CoreSymbolStatus>;
  core_proxy_used?: Record<string, string>; // Map of original symbol -> proxy symbol (e.g., "PDBC" -> "DBC")
  debug_votes?: DebugVotes; // Vote breakdown (only included when debug=1)
  debug_enabled?: boolean; // True when debug mode was used
  engine_version?: string; // Model version (e.g., ghostregime-v1.0.2)
  build_commit?: string; // Git commit hash or build identifier
  data_source?: 'persisted' | 'computed' | 'computed_debug'; // How this row was obtained
}

export interface DebugVotes {
  risk: {
    spy: VoteDetail;
    hyg_ief: VoteDetail;
    vix: VoteDetail;
    eem_spy: VoteDetail;
    tiebreak?: TieBreakDetail;
  };
  inflation: {
    pdbc: VoteDetail & { proxy_used?: string };
    tip_ief?: VoteDetail; // May be missing if TIP not available
    tlt: VoteDetail;
    uup: VoteDetail;
    tiebreak?: TieBreakDetail;
  };
  infl_total_score_pre_tiebreak: number;
}

export interface VoteDetail {
  tr_63?: number; // TR_63 value (or TR_21 for VIX)
  tr_21?: number; // TR_21 value (for tie-breakers)
  vote: number; // +1, -1, or 0
  threshold_hit?: string; // Description of which threshold was hit
}

export interface TieBreakDetail {
  reason: 'score_zero' | 'not_applicable';
  input_value?: number; // TR_21 value used for tie-break
  input_sign?: number; // Sign result (+1 or -1)
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

