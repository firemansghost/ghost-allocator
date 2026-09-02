/**
 * R7C operational run plan.
 *
 * Makes preregistered-but-operationally-incomplete sensitivities deterministic.
 * Does not alter the primary frozen study contract, P0–P6, holdout, or costs.
 */

import { VAMS_MIN_OBSERVATIONS_AT_ASOF } from '../../../lib/ghostregime/config';
import {
  ABLATION_IDS,
  BENCHMARK_IDS,
  CANDIDATE_IDS,
  COST_CONVENTION,
  HOLDOUT_CALENDAR_END,
  HOLDOUT_CALENDAR_START,
  HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED,
  RESEARCH_END,
  RESEARCH_START,
} from './study-contract';
import { NUMERIC_TOLERANCE } from './study-contract';
import { RESEARCH_ASSET_IDS } from './study-contract';
import { weightOf } from './portfolio';
import type { AblationId, BenchmarkId, CandidateId, DateKey, Weights } from './types';

export const R7C_STUDY_NAME = 'GhostRegime R7C';

export const EXPECTED_COMMON_SIGNAL_DATE: DateKey = '2017-08-03';
export const EXPECTED_COMMON_INCEPTION_DATE: DateKey = '2017-08-04';
export const EXPECTED_FIRST_RETURN_END_DATE: DateKey = '2017-08-07';
export const EXPECTED_DEVELOPMENT_LAST_SESSION: DateKey = '2024-08-30';

export const FIRST_VALID_SIGNAL_MIN_OBSERVATIONS = VAMS_MIN_OBSERVATIONS_AT_ASOF;

export const END_MINUS_3M_BOUNDARY: DateKey = '2026-06-01';
export const END_PLUS_3M_STATUS = 'UNAVAILABLE_BY_FROZEN_SNAPSHOT' as const;

export const EXPANDING_YEAR_ENDS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

export const NO_BTC_POLICY_ID = 'NO_BTC_TO_CASH' as const;
export const ZERO_CASH_POLICY_ID = 'ZERO_CASH_ZERO_RF' as const;
export const STATIC_MONTHLY_LABEL = 'STATIC_REBALANCE_MONTHLY_SENSITIVITY' as const;

export const PRIMARY_COST_BPS = COST_CONVENTION.primary_bps;
export const COST_SCENARIO_BPS = [0, 5, 10] as const;

export const RESULT_PARENT_DIR = 'tmp/ghostregime-r7';
export const RESULT_DIR_PREFIX = 'r7c-';

export const DELTA_CONVENTION = {
  definition: 'candidate_minus_P0',
  max_drawdown:
    'Positive Δ maxDrawdown means a shallower (less negative) drawdown than P0_CURRENT.',
} as const;

export type CashPolicy = 'BIL_ADJUSTED' | 'ZERO_CASH_ZERO_RF';
export type NoBtcPolicy = 'none' | 'NO_BTC_TO_CASH';
export type StaticSchedule = 'annual' | 'monthly' | 'none';
export type ScenarioFamily =
  | 'primary'
  | 'benchmark'
  | 'ablation'
  | 'cost_sensitivity'
  | 'static_monthly'
  | 'zero_cash_zero_rf'
  | 'no_btc_to_cash';

export interface StudyScenario {
  scenarioId: string;
  family: ScenarioFamily;
  candidateId: CandidateId | null;
  benchmarkId: BenchmarkId | null;
  ablation: AblationId | null;
  costBps: number;
  cashPolicy: CashPolicy;
  noBtcPolicy: NoBtcPolicy;
  rebalanceMode: 'event' | 'scheduled' | 'none';
  staticSchedule: StaticSchedule;
}

function scenarioId(parts: string[]): string {
  return parts.join('__');
}

export function applyNoBtcToCash(weights: Weights): Weights {
  const spy = weightOf(weights, RESEARCH_ASSET_IDS.SPY);
  const gld = weightOf(weights, RESEARCH_ASSET_IDS.GLD);
  const btc = weightOf(weights, RESEARCH_ASSET_IDS.BTC);
  const bil = weightOf(weights, RESEARCH_ASSET_IDS.BIL);
  const ief = weightOf(weights, RESEARCH_ASSET_IDS.IEF);
  const next: Weights = {
    [RESEARCH_ASSET_IDS.SPY]: spy,
    [RESEARCH_ASSET_IDS.GLD]: gld,
    [RESEARCH_ASSET_IDS.BTC]: 0,
    [RESEARCH_ASSET_IDS.BIL]: bil + btc,
  };
  if (Math.abs(ief) > NUMERIC_TOLERANCE) {
    next[RESEARCH_ASSET_IDS.IEF] = ief;
  }
  return next;
}

export function zeroCashAssetReturns(assetReturns: Weights): Weights {
  return { ...assetReturns, [RESEARCH_ASSET_IDS.BIL]: 0 };
}

export function assertNoBtcNotPrimaryCandidate(): void {
  if (CANDIDATE_IDS.some((id) => /NO_BTC|BTC_ZERO|ZERO_BTC/i.test(id))) {
    throw new Error('NO_BTC_TO_CASH must not appear in CANDIDATE_IDS');
  }
}

export function buildStudyScenarios(): StudyScenario[] {
  assertNoBtcNotPrimaryCandidate();
  const out: StudyScenario[] = [];

  for (const candidateId of CANDIDATE_IDS) {
    out.push({
      scenarioId: scenarioId([candidateId, 'COMBINED', 'BIL', '0BPS']),
      family: 'primary',
      candidateId,
      benchmarkId: null,
      ablation: 'COMBINED',
      costBps: PRIMARY_COST_BPS,
      cashPolicy: 'BIL_ADJUSTED',
      noBtcPolicy: 'none',
      rebalanceMode: 'event',
      staticSchedule: 'none',
    });
  }

  for (const benchmarkId of BENCHMARK_IDS) {
    const scheduled = benchmarkId === 'SPY_100' ? 'none' : 'annual';
    out.push({
      scenarioId: scenarioId([benchmarkId, 'BENCH', 'BIL', '0BPS', scheduled.toUpperCase()]),
      family: 'benchmark',
      candidateId: null,
      benchmarkId,
      ablation: null,
      costBps: PRIMARY_COST_BPS,
      cashPolicy: 'BIL_ADJUSTED',
      noBtcPolicy: 'none',
      rebalanceMode: benchmarkId === 'SPY_100' ? 'none' : 'scheduled',
      staticSchedule: scheduled,
    });
  }

  for (const candidateId of CANDIDATE_IDS) {
    out.push({
      scenarioId: scenarioId([candidateId, 'REGIME_ONLY', 'BIL', '0BPS']),
      family: 'ablation',
      candidateId,
      benchmarkId: null,
      ablation: 'REGIME_ONLY',
      costBps: PRIMARY_COST_BPS,
      cashPolicy: 'BIL_ADJUSTED',
      noBtcPolicy: 'none',
      rebalanceMode: 'event',
      staticSchedule: 'none',
    });
  }

  out.push({
    scenarioId: scenarioId(['VAMS_ONLY', 'BIL', '0BPS']),
    family: 'ablation',
    candidateId: null,
    benchmarkId: null,
    ablation: 'VAMS_ONLY',
    costBps: PRIMARY_COST_BPS,
    cashPolicy: 'BIL_ADJUSTED',
    noBtcPolicy: 'none',
    rebalanceMode: 'event',
    staticSchedule: 'none',
  });

  out.push({
    scenarioId: scenarioId(['STATIC_601030', 'ABLATION', 'BIL', '0BPS']),
    family: 'ablation',
    candidateId: null,
    benchmarkId: 'STATIC_601030',
    ablation: 'STATIC_601030',
    costBps: PRIMARY_COST_BPS,
    cashPolicy: 'BIL_ADJUSTED',
    noBtcPolicy: 'none',
    rebalanceMode: 'scheduled',
    staticSchedule: 'annual',
  });

  out.push({
    scenarioId: scenarioId(['SPY_100', 'ABLATION', 'BIL', '0BPS']),
    family: 'ablation',
    candidateId: null,
    benchmarkId: 'SPY_100',
    ablation: 'SPY_100',
    costBps: PRIMARY_COST_BPS,
    cashPolicy: 'BIL_ADJUSTED',
    noBtcPolicy: 'none',
    rebalanceMode: 'none',
    staticSchedule: 'none',
  });

  for (const candidateId of CANDIDATE_IDS) {
    for (const costBps of [5, 10] as const) {
      out.push({
        scenarioId: scenarioId([candidateId, 'COMBINED', 'BIL', `${costBps}BPS`]),
        family: 'cost_sensitivity',
        candidateId,
        benchmarkId: null,
        ablation: 'COMBINED',
        costBps,
        cashPolicy: 'BIL_ADJUSTED',
        noBtcPolicy: 'none',
        rebalanceMode: 'event',
        staticSchedule: 'none',
      });
    }
  }

  for (const benchmarkId of BENCHMARK_IDS) {
    for (const costBps of [5, 10] as const) {
      const scheduled = benchmarkId === 'SPY_100' ? 'none' : 'annual';
      out.push({
        scenarioId: scenarioId([benchmarkId, 'BENCH', 'BIL', `${costBps}BPS`, scheduled.toUpperCase()]),
        family: 'cost_sensitivity',
        candidateId: null,
        benchmarkId,
        ablation: null,
        costBps,
        cashPolicy: 'BIL_ADJUSTED',
        noBtcPolicy: 'none',
        rebalanceMode: benchmarkId === 'SPY_100' ? 'none' : 'scheduled',
        staticSchedule: scheduled,
      });
    }
  }

  for (const benchmarkId of ['STATIC_601030', 'STATIC_6040'] as const) {
    for (const costBps of COST_SCENARIO_BPS) {
      out.push({
        scenarioId: scenarioId([benchmarkId, STATIC_MONTHLY_LABEL, 'BIL', `${costBps}BPS`]),
        family: 'static_monthly',
        candidateId: null,
        benchmarkId,
        ablation: null,
        costBps,
        cashPolicy: 'BIL_ADJUSTED',
        noBtcPolicy: 'none',
        rebalanceMode: 'scheduled',
        staticSchedule: 'monthly',
      });
    }
  }

  for (const candidateId of CANDIDATE_IDS) {
    out.push({
      scenarioId: scenarioId([candidateId, 'COMBINED', ZERO_CASH_POLICY_ID, '0BPS']),
      family: 'zero_cash_zero_rf',
      candidateId,
      benchmarkId: null,
      ablation: 'COMBINED',
      costBps: PRIMARY_COST_BPS,
      cashPolicy: 'ZERO_CASH_ZERO_RF',
      noBtcPolicy: 'none',
      rebalanceMode: 'event',
      staticSchedule: 'none',
    });
  }

  for (const candidateId of CANDIDATE_IDS) {
    out.push({
      scenarioId: scenarioId([candidateId, 'COMBINED', NO_BTC_POLICY_ID, '0BPS']),
      family: 'no_btc_to_cash',
      candidateId,
      benchmarkId: null,
      ablation: 'COMBINED',
      costBps: PRIMARY_COST_BPS,
      cashPolicy: 'BIL_ADJUSTED',
      noBtcPolicy: 'NO_BTC_TO_CASH',
      rebalanceMode: 'event',
      staticSchedule: 'none',
    });
  }

  return out;
}

export function expectedStudyMatrixCounts(): {
  primary: number;
  benchmarks: number;
  regime_only: number;
  vams_only: number;
  static_spy_ablations: number;
  cost_sensitivity: number;
  static_monthly: number;
  zero_cash_zero_rf: number;
  no_btc_to_cash: number;
  total: number;
} {
  const scenarios = buildStudyScenarios();
  const count = (family: ScenarioFamily) => scenarios.filter((s) => s.family === family).length;
  return {
    primary: count('primary'),
    benchmarks: count('benchmark'),
    regime_only: scenarios.filter((s) => s.ablation === 'REGIME_ONLY').length,
    vams_only: scenarios.filter((s) => s.ablation === 'VAMS_ONLY').length,
    static_spy_ablations: scenarios.filter(
      (s) => s.family === 'ablation' && (s.ablation === 'STATIC_601030' || s.ablation === 'SPY_100')
    ).length,
    cost_sensitivity: count('cost_sensitivity'),
    static_monthly: count('static_monthly'),
    zero_cash_zero_rf: count('zero_cash_zero_rf'),
    no_btc_to_cash: count('no_btc_to_cash'),
    total: scenarios.length,
  };
}

export function planOnlyContract(): Record<string, unknown> {
  return {
    study: R7C_STUDY_NAME,
    mode: 'plan_only',
    research_start: RESEARCH_START,
    research_end: RESEARCH_END,
    holdout_calendar_start: HOLDOUT_CALENDAR_START,
    holdout_calendar_end: HOLDOUT_CALENDAR_END,
    holdout_first_eligible_session_expected: HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED,
    expected_s0: EXPECTED_COMMON_SIGNAL_DATE,
    expected_s1: EXPECTED_COMMON_INCEPTION_DATE,
    expected_s2: EXPECTED_FIRST_RETURN_END_DATE,
    expected_development_last_session: EXPECTED_DEVELOPMENT_LAST_SESSION,
    first_valid_signal_min_observations: FIRST_VALID_SIGNAL_MIN_OBSERVATIONS,
    primary_candidate_ids: [...CANDIDATE_IDS],
    benchmark_ids: [...BENCHMARK_IDS],
    ablation_ids: [...ABLATION_IDS],
    cost_scenarios_bps: [...COST_SCENARIO_BPS],
    cash_policy_primary: 'BIL_ADJUSTED',
    zero_cash_policy: ZERO_CASH_POLICY_ID,
    no_btc_policy: {
      id: NO_BTC_POLICY_ID,
      primary_candidate: false,
      rule: 'preserve SPY and GLD actuals; set BTC to 0; add removed BTC weight to BIL',
    },
    static_rebalance_primary: 'annual_first_xnys_session_of_calendar_year',
    static_rebalance_sensitivity: STATIC_MONTHLY_LABEL,
    end_minus_3m_boundary: END_MINUS_3M_BOUNDARY,
    end_plus_3m: END_PLUS_3M_STATUS,
    expanding_year_ends: [...EXPANDING_YEAR_ENDS],
    matrix: expectedStudyMatrixCounts(),
    candidate_performance: 'not_run',
    ranking: 'not_run',
  };
}
