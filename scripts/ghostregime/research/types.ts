/**
 * R7 research-only types. Not imported by production engine, UI, or providers.
 */

import type { RegimeType, RiskRegime, VamsState } from '../../../lib/ghostregime/types';

export type DateKey = string; // YYYY-MM-DD UTC civil date
export type AssetId = string;

export type Weights = Record<AssetId, number>;

export const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseUtcDateKey(dateKey: string): Date {
  if (!DATE_KEY_RE.test(dateKey)) {
    throw new Error(`MALFORMED_DATE_KEY: ${dateKey}`);
  }
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateKey) {
    throw new Error(`MALFORMED_DATE_KEY: ${dateKey}`);
  }
  return date;
}

export function dateKeyFromUtc(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

export function calendarDaysBetween(start: DateKey, end: DateKey): number {
  return Math.round((parseUtcDateKey(end).getTime() - parseUtcDateKey(start).getTime()) / 86_400_000);
}

export function utcWeekday(dateKey: DateKey): number {
  return parseUtcDateKey(dateKey).getUTCDay();
}

export function utcWeekdayName(dateKey: DateKey): 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' {
  return (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const)[utcWeekday(dateKey)];
}

export interface ResearchModelState {
  date: DateKey;
  regime: RegimeType;
  risk_regime: RiskRegime;
  risk_score: number;
  infl_score: number;
  infl_core_score: number;
  infl_sat_score: number;
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
}

export const MODEL_STATE_PARITY_FIELDS = [
  'regime',
  'risk_regime',
  'risk_score',
  'infl_score',
  'infl_core_score',
  'infl_sat_score',
  'risk_tiebreaker_used',
  'infl_tiebreaker_used',
  'stocks_vams_state',
  'gold_vams_state',
  'btc_vams_state',
  'stocks_target',
  'gold_target',
  'btc_target',
  'stocks_scale',
  'gold_scale',
  'btc_scale',
  'stocks_actual',
  'gold_actual',
  'btc_actual',
  'cash',
] as const;

export type ModelStateParityField = (typeof MODEL_STATE_PARITY_FIELDS)[number];

export type CandidateId =
  | 'P0_CURRENT'
  | 'P1_LESS_BTC'
  | 'P2_MORE_EQUITY'
  | 'P3_MORE_GOLD_RO'
  | 'P4_INFL_GOLD_30'
  | 'P5_DEEPER_OFF'
  | 'P6_HOUSE_601525';

export type AblationId = 'STATIC_601030' | 'REGIME_ONLY' | 'VAMS_ONLY' | 'COMBINED' | 'SPY_100';

export type BenchmarkId = 'STATIC_601030' | 'STATIC_6040' | 'SPY_100';

export interface SleeveTargets {
  stocks: number;
  gold: number;
  btc: number;
}

export interface CandidateDefinition {
  id: CandidateId;
  riskOn: SleeveTargets;
  inflation: SleeveTargets;
  deflation: SleeveTargets;
}

export interface ResearchWarning {
  code: string;
  message: string;
  date?: DateKey;
}

export interface SignalObservation {
  symbol: string;
  date_key: DateKey;
  close: number;
  timestamp_utc?: string;
  source: string;
}

export interface ReturnObservation {
  asset_id: AssetId;
  date_key: DateKey;
  performance_close: number;
  raw_close?: number;
  source: string;
  btc_candle_start_utc?: string;
  btc_candle_end_utc?: string;
  equity_close_utc?: string;
  stale_hours?: number;
  post_close_leak?: boolean;
}

export interface SessionCalendarRow {
  session_date: DateKey;
  regular_close_utc: string;
  early_close: boolean;
}

export interface VixExtraDate {
  date: DateKey;
  weekday: ReturnType<typeof utcWeekdayName>;
  classification: 'weekend' | 'non_xnys_weekday';
}
