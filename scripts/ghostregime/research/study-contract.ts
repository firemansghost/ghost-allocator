/**
 * Frozen R7 study contract. Definitions only — no candidate results.
 */

import { ALLOCATION_TOLERANCE, MODEL_VERSION } from '../../../lib/ghostregime/config';
import type { AblationId, BenchmarkId, CandidateId, DateKey } from './types';

export const SNAPSHOT_ID = 'r7b0-20260902-210842Z';
export const MANIFEST_SHA256 =
  'bb68cdfbbfa854bfa7edeed226e42d2e5a1328e201bc821efcb43a274a63ca00';
export const VALIDATION_REPORT_SHA256 =
  '397712e67a72500badd705bc369105f82bb52ba3fc7af6ff016821000abbcf22';

export const MODEL_VERSION_EXPECTED = 'ghostregime-v1.0.4';

export const RESEARCH_START: DateKey = '2016-01-01';
export const RESEARCH_END: DateKey = '2026-09-01';

export const HOLDOUT_CALENDAR_START: DateKey = '2024-09-01';
export const HOLDOUT_CALENDAR_END: DateKey = '2026-09-01';
export const HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED: DateKey = '2024-09-03';

export const CUTOVER_DATE: DateKey = '2025-11-28';

export const EXECUTION_CONVENTION = {
  name: 'one_session_lag',
  signal_after_close_T: 'compute published target A_T after session T close',
  interval_T_to_T1: 'previously executed holdings earn T → T+1; A_T does not',
  execute_at_close_T1: 'apply return, drift, then execute pending A_T if published target changed',
  first_eligible_return_for_A_T: 'T+1 → T+2',
} as const;

export const INCEPTION_CONVENTION = {
  first_valid_model_signal: 'S0',
  first_executable_close: 'next XNYS session S1',
  initial_target_established_at: 'S1 close',
  initial_turnover: 0,
  initial_transaction_cost: 0,
  first_portfolio_return: 'S1 → S2',
  shared_primary_inception: true,
  note: 'All primary strategies begin from newly supplied research capital at the same S1.',
} as const;

export const CASH_CONVENTION = {
  primary_cash_asset: 'BIL',
  primary_cash_series: 'adjusted_return',
  raw_bil_forbidden_as_primary: true,
  primary_sharpe_sortino_rf: 'matching daily BIL adjusted return',
  required_future_sensitivity: 'ZERO_CASH_ZERO_RF',
} as const;

export const COST_CONVENTION = {
  primary_bps: 0,
  sensitivity_bps: [5, 10] as const,
  cost_fraction: '(cost_bps / 10000) * gross_two_sided_traded_notional',
  one_way_turnover: '0.5 * gross_two_sided_traded_notional',
  nav_after_cost: 'NAV_after_market * (1 - cost_fraction)',
  extra_cash_transaction_leg: false,
} as const;

export const STATIC_REBALANCE_CONVENTION = {
  primary: 'annual_first_xnys_session_of_calendar_year',
  sensitivity: 'monthly_first_xnys_session_of_calendar_month',
  spy_100: 'no_scheduled_rebalance',
  run_monthly_sensitivity_in_r7b1: false,
} as const;

export const NUMERIC_TOLERANCE = ALLOCATION_TOLERANCE;
export const METRIC_UNDEFINED_POLICY = 'return null and emit a warning when a denominator is undefined or zero';

export const REQUIRED_WARNING_POLICY = {
  btc_stale_session_count: 1,
  btc_stale_session_date: '2017-02-28',
  btc_stale_disposition: 'accept_with_warning_do_not_repair',
  btc_post_close_leak: 'reject',
  unexpected_nonzero_infl_sat_score: 'stop',
  weekend_vix_extra: 'stop',
  duplicate_or_malformed_source_rows: 'stop',
  raw_bil_as_primary_performance: 'reject',
  adjusted_close_as_signal: 'reject',
} as const;

export const SIGNAL_SYMBOLS = [
  'SPY',
  'GLD',
  'HYG',
  'IEF',
  'EEM',
  'PDBC',
  'TIP',
  'TLT',
  'UUP',
  'BTC-USD',
  'VIX',
] as const;

export const RETURN_SYMBOLS = ['SPY', 'GLD', 'IEF', 'BIL', 'BTC-USD'] as const;

export const CANDIDATE_IDS: readonly CandidateId[] = [
  'P0_CURRENT',
  'P1_LESS_BTC',
  'P2_MORE_EQUITY',
  'P3_MORE_GOLD_RO',
  'P4_INFL_GOLD_30',
  'P5_DEEPER_OFF',
  'P6_HOUSE_601525',
];

export const ABLATION_IDS: readonly AblationId[] = [
  'STATIC_601030',
  'REGIME_ONLY',
  'VAMS_ONLY',
  'COMBINED',
  'SPY_100',
];

export const BENCHMARK_IDS: readonly BenchmarkId[] = ['STATIC_601030', 'STATIC_6040', 'SPY_100'];

export const RESEARCH_ASSET_IDS = {
  SPY: 'SPY',
  GLD: 'GLD',
  BTC: 'BTC-USD',
  BIL: 'BIL',
  IEF: 'IEF',
} as const;

export function assertFrozenModelVersion(): void {
  if (MODEL_VERSION !== MODEL_VERSION_EXPECTED) {
    throw new Error(
      `MODEL_VERSION_MISMATCH: expected ${MODEL_VERSION_EXPECTED}, got ${MODEL_VERSION}`
    );
  }
}
