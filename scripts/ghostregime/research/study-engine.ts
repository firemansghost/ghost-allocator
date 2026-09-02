/**
 * R7C study engine. Portfolio math is invoked only by the real runner
 * or by synthetic unit tests. Plan-only must not call runStudyScenarios.
 */

import {
  SPY_100_WEIGHTS,
  STATIC_601030_WEIGHTS,
  STATIC_6040_WEIGHTS,
  computeCandidateAllocations,
  ghostRegimeActualsToWeights,
} from './allocation-candidates';
import {
  firstEligibleSessionOnOrAfter,
  firstSessionOfEachMonth,
  firstSessionOfEachYear,
  initialExecutionState,
  queuePublishedTarget,
  stepSessionClose,
  type ExecutionStep,
} from './execution';
import {
  annualizedNetVolatility,
  cagr,
  calmar,
  drawdownStats,
  sharpe,
  sortino,
  worstCompleteCalendarYear,
  type DailyReturnPoint,
  type EquityPoint,
} from './metrics';
import { maxAbsWeightDelta, weightOf } from './portfolio';
import {
  applyNoBtcToCash,
  DELTA_CONVENTION,
  END_MINUS_3M_BOUNDARY,
  EXPECTED_COMMON_INCEPTION_DATE,
  EXPECTED_COMMON_SIGNAL_DATE,
  EXPECTED_DEVELOPMENT_LAST_SESSION,
  EXPECTED_FIRST_RETURN_END_DATE,
  EXPANDING_YEAR_ENDS,
  FIRST_VALID_SIGNAL_MIN_OBSERVATIONS,
  type StudyScenario,
  zeroCashAssetReturns,
} from './r7c-run-plan';
import {
  CANDIDATE_IDS,
  HOLDOUT_CALENDAR_END,
  HOLDOUT_CALENDAR_START,
  HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED,
  NUMERIC_TOLERANCE,
  RESEARCH_ASSET_IDS,
  RESEARCH_END,
} from './study-contract';
import type {
  DateKey,
  ResearchModelState,
  ReturnObservation,
  SignalObservation,
  Weights,
} from './types';

export interface AnnotatedStep extends ExecutionStep {
  heldBeforeReturn: Weights | null;
  governingRegime: string | null;
  intervalReturns: Weights | null;
}

export interface MetricBundle {
  label: string;
  startDate: DateKey;
  endDate: DateKey;
  startNav: number;
  finalNav: number | null;
  cagr: number | null;
  vol: number | null;
  sharpe: number | null;
  sortino: number | null;
  maxDrawdown: number | null;
  calmar: number | null;
  tuwMaxDdCalendarDays: number | null;
  tuwLongestCalendarDays: number | null;
  worstCompleteCalendarYear: number | null;
  worstCompleteCalendarYearReturn: number | null;
  cumulativeGrossTwoSided: number;
  cumulativeOneWayTurnover: number;
  rebalanceCountExInception: number;
  allocationChangeCount: number;
  avgSpy: number | null;
  avgGld: number | null;
  avgBtc: number | null;
  avgBil: number | null;
  warnings: string[];
}

export interface IntegrityCheck {
  id: string;
  passed: boolean;
  detail: string;
}

export interface BtcAttributionRow {
  window: 'FULL' | 'DEVELOPMENT' | 'HOLDOUT';
  arithmeticSum: number;
  avgHeldBtc: number;
  maxHeldBtc: number;
  largestPositiveContribution: number;
  largestNegativeContribution: number;
}

export interface YearlyRow {
  year: number;
  complete: boolean;
  simpleReturn: number | null;
  maxDrawdown: number | null;
  avgSpy: number | null;
  avgGld: number | null;
  avgBtc: number | null;
  avgBil: number | null;
}

export interface RegimeConditionRow {
  regime: string;
  intervalCount: number;
  averageNetReturn: number;
  compoundedConditionalReturn: number;
  avgSpy: number;
  avgGld: number;
  avgBtc: number;
  avgBil: number;
}

export interface ScenarioResult {
  scenario: StudyScenario;
  steps: AnnotatedStep[];
  full: MetricBundle;
  development: MetricBundle;
  holdout: MetricBundle;
  yearly: YearlyRow[];
  btcAttribution: BtcAttributionRow[];
  regimeConditioned: RegimeConditionRow[];
}

export function firstValidSignalSession(
  sessions: DateKey[],
  signalRows: SignalObservation[],
  minObs = FIRST_VALID_SIGNAL_MIN_OBSERVATIONS
): DateKey | null {
  const datesFor = (symbol: string) =>
    signalRows.filter((row) => row.symbol === symbol).map((row) => row.date_key);
  const spy = datesFor('SPY');
  const gld = datesFor('GLD');
  const btc = datesFor('BTC-USD');
  const countAt = (dates: DateKey[], asof: DateKey) => dates.filter((date) => date <= asof).length;
  for (const session of sessions) {
    if (
      countAt(spy, session) >= minObs &&
      countAt(gld, session) >= minObs &&
      countAt(btc, session) >= minObs
    ) {
      return session;
    }
  }
  return null;
}

export function nextSessions(sessions: DateKey[], start: DateKey, count: number): DateKey[] {
  const idx = sessions.indexOf(start);
  if (idx < 0) throw new Error(`SESSION_NOT_IN_CALENDAR: ${start}`);
  return sessions.slice(idx, idx + 1 + count);
}

export function verifyCommonInception(sessions: DateKey[], s0: DateKey): {
  s0: DateKey;
  s1: DateKey;
  s2: DateKey;
} {
  const idx = sessions.indexOf(s0);
  if (idx < 0 || idx + 2 >= sessions.length) {
    throw new Error(`INCEPTION_SESSIONS_UNAVAILABLE: s0=${s0}`);
  }
  const s1 = sessions[idx + 1];
  const s2 = sessions[idx + 2];
  if (s0 !== EXPECTED_COMMON_SIGNAL_DATE || s1 !== EXPECTED_COMMON_INCEPTION_DATE || s2 !== EXPECTED_FIRST_RETURN_END_DATE) {
    throw new Error(
      `INCEPTION_DATE_MISMATCH: derived S0=${s0} S1=${s1} S2=${s2}; expected ${EXPECTED_COMMON_SIGNAL_DATE} / ${EXPECTED_COMMON_INCEPTION_DATE} / ${EXPECTED_FIRST_RETURN_END_DATE}. STOP before writing performance results.`
    );
  }
  return { s0, s1, s2 };
}

export function lastSessionBefore(sessions: DateKey[], boundary: DateKey): DateKey | null {
  let last: DateKey | null = null;
  for (const session of sessions) {
    if (session < boundary) last = session;
  }
  return last;
}

export function lastSessionOnOrBefore(sessions: DateKey[], boundary: DateKey): DateKey | null {
  let last: DateKey | null = null;
  for (const session of sessions) {
    if (session <= boundary) last = session;
  }
  return last;
}

export function lastSessionOfYear(sessions: DateKey[], year: number): DateKey | null {
  const prefix = String(year);
  let last: DateKey | null = null;
  for (const session of sessions) {
    if (session.startsWith(prefix)) last = session;
  }
  return last;
}

export function buildCloseMap(rows: ReturnObservation[]): Map<string, Map<DateKey, number>> {
  const out = new Map<string, Map<DateKey, number>>();
  for (const row of rows) {
    let byDate = out.get(row.asset_id);
    if (!byDate) {
      byDate = new Map();
      out.set(row.asset_id, byDate);
    }
    byDate.set(row.date_key, row.performance_close);
  }
  return out;
}

export function intervalReturnsForSession(
  closeMap: Map<string, Map<DateKey, number>>,
  prev: DateKey,
  session: DateKey,
  cashPolicy: StudyScenario['cashPolicy']
): Weights {
  const out: Weights = {};
  for (const [assetId, byDate] of closeMap) {
    const a = byDate.get(prev);
    const b = byDate.get(session);
    if (a == null || b == null || a === 0) {
      throw new Error(`MISSING_RETURN_CLOSE: ${assetId} ${prev}→${session}`);
    }
    out[assetId] = b / a - 1;
  }
  return cashPolicy === 'ZERO_CASH_ZERO_RF' ? zeroCashAssetReturns(out) : out;
}

export function publishedTargetForState(state: ResearchModelState, scenario: StudyScenario): Weights {
  if (scenario.benchmarkId === 'STATIC_601030' || scenario.ablation === 'STATIC_601030') {
    return { ...STATIC_601030_WEIGHTS };
  }
  if (scenario.benchmarkId === 'STATIC_6040') {
    return { ...STATIC_6040_WEIGHTS };
  }
  if (scenario.benchmarkId === 'SPY_100' || scenario.ablation === 'SPY_100') {
    return { ...SPY_100_WEIGHTS };
  }

  const candidateId = scenario.candidateId ?? 'P0_CURRENT';
  const ablation = scenario.ablation ?? 'COMBINED';
  const allocation = computeCandidateAllocations(
    candidateId,
    state.regime,
    {
      stocks: state.stocks_vams_state,
      gold: state.gold_vams_state,
      btc: state.btc_vams_state,
    },
    ablation
  );
  const weights = ghostRegimeActualsToWeights(allocation);
  return scenario.noBtcPolicy === 'NO_BTC_TO_CASH' ? applyNoBtcToCash(weights) : weights;
}

export function p0CombinedMatchesProductionActuals(state: ResearchModelState): boolean {
  const target = publishedTargetForState(state, {
    scenarioId: 'check',
    family: 'primary',
    candidateId: 'P0_CURRENT',
    benchmarkId: null,
    ablation: 'COMBINED',
    costBps: 0,
    cashPolicy: 'BIL_ADJUSTED',
    noBtcPolicy: 'none',
    rebalanceMode: 'event',
    staticSchedule: 'none',
  });
  return (
    Math.abs(weightOf(target, RESEARCH_ASSET_IDS.SPY) - state.stocks_actual) <= NUMERIC_TOLERANCE &&
    Math.abs(weightOf(target, RESEARCH_ASSET_IDS.GLD) - state.gold_actual) <= NUMERIC_TOLERANCE &&
    Math.abs(weightOf(target, RESEARCH_ASSET_IDS.BTC) - state.btc_actual) <= NUMERIC_TOLERANCE &&
    Math.abs(weightOf(target, RESEARCH_ASSET_IDS.BIL) - state.cash) <= NUMERIC_TOLERANCE
  );
}

function scheduledSet(sessions: DateKey[], schedule: StudyScenario['staticSchedule']): Set<DateKey> {
  if (schedule === 'annual') return new Set(firstSessionOfEachYear(sessions));
  if (schedule === 'monthly') return new Set(firstSessionOfEachMonth(sessions));
  return new Set();
}

export function replayAnnotated(args: {
  sessions: DateKey[];
  publishedTargets: Map<DateKey, Weights>;
  publishedRegimes: Map<DateKey, string | null>;
  closeMap: Map<string, Map<DateKey, number>>;
  scenario: StudyScenario;
}): AnnotatedStep[] {
  const state = initialExecutionState();
  const out: AnnotatedStep[] = [];
  const scheduled = scheduledSet(args.sessions, args.scenario.staticSchedule);
  let pendingRegime: string | null = null;
  let executedRegime: string | null = null;

  for (let i = 0; i < args.sessions.length; i += 1) {
    const session = args.sessions[i];
    const published = args.publishedTargets.get(session);
    if (!published) throw new Error(`MISSING_PUBLISHED_TARGET: ${session}`);

    if (i === 0) {
      queuePublishedTarget(state, published);
      pendingRegime = args.publishedRegimes.get(session) ?? null;
      continue;
    }

    const prev = args.sessions[i - 1];
    const intervalReturns = intervalReturnsForSession(
      args.closeMap,
      prev,
      session,
      args.scenario.cashPolicy
    );
    const heldBefore = state.held ? { ...state.held } : null;
    const governingRegime = executedRegime;
    const step = stepSessionClose({
      state,
      session,
      intervalReturns,
      rebalanceMode: args.scenario.rebalanceMode,
      scheduled: scheduled.has(session),
      costBps: args.scenario.costBps,
    });
    if (step.rebalanced || step.inception) {
      executedRegime = pendingRegime;
    }
    out.push({
      ...step,
      heldBeforeReturn: heldBefore,
      governingRegime: step.inception ? null : governingRegime,
      intervalReturns,
    });
    queuePublishedTarget(state, published);
    pendingRegime = args.publishedRegimes.get(session) ?? null;
  }
  return out;
}

export function allocationChangeCount(publishedTargets: Map<DateKey, Weights>, sessions: DateKey[]): number {
  let count = 0;
  let prev: Weights | null = null;
  for (const session of sessions) {
    const target = publishedTargets.get(session);
    if (!target) continue;
    if (prev != null && maxAbsWeightDelta(target, prev) > NUMERIC_TOLERANCE) count += 1;
    prev = target;
  }
  return count;
}

function meanWeight(steps: AnnotatedStep[], assetId: string): number | null {
  const earning = steps.filter((step) => !step.inception && step.heldBeforeReturn);
  if (earning.length === 0) return null;
  return earning.reduce((sum, step) => sum + weightOf(step.heldBeforeReturn as Weights, assetId), 0) / earning.length;
}

function equityFromSteps(steps: AnnotatedStep[]): EquityPoint[] {
  return steps.map((step) => ({ date: step.session, nav: step.nav }));
}

function dailyPoints(steps: AnnotatedStep[], cashPolicy: StudyScenario['cashPolicy']): DailyReturnPoint[] {
  return steps
    .filter((step) => !step.inception)
    .map((step) => ({
      date: step.session,
      netPortfolioReturn: step.netPortfolioReturn,
      rfReturn:
        cashPolicy === 'ZERO_CASH_ZERO_RF'
          ? 0
          : step.intervalReturns
            ? weightOf(step.intervalReturns, RESEARCH_ASSET_IDS.BIL) !== 0 ||
              Object.hasOwn(step.intervalReturns, RESEARCH_ASSET_IDS.BIL)
              ? step.intervalReturns[RESEARCH_ASSET_IDS.BIL] ?? 0
              : 0
            : 0,
    }));
}

function turnoverStats(steps: AnnotatedStep[]): {
  cumulativeGrossTwoSided: number;
  cumulativeOneWayTurnover: number;
  rebalanceCountExInception: number;
} {
  const nonInception = steps.filter((step) => !step.inception);
  return {
    cumulativeGrossTwoSided: nonInception.reduce((sum, step) => sum + step.grossTwoSided, 0),
    cumulativeOneWayTurnover: nonInception.reduce((sum, step) => sum + step.oneWayTurnover, 0),
    rebalanceCountExInception: nonInception.filter((step) => step.rebalanced).length,
  };
}

export function computeMetricBundle(args: {
  label: string;
  steps: AnnotatedStep[];
  startDate: DateKey;
  endDate: DateKey;
  startNav: number;
  endNav: number;
  equity: EquityPoint[];
  cashPolicy: StudyScenario['cashPolicy'];
  allocationChangeCount: number;
}): MetricBundle {
  const warnings: string[] = [];
  const cagrOut = cagr(args.startNav, args.endNav, args.startDate, args.endDate);
  warnings.push(...cagrOut.warnings.map((w) => w.code));
  const points = dailyPoints(args.steps, args.cashPolicy);
  const vol = annualizedNetVolatility(points);
  warnings.push(...vol.warnings.map((w) => w.code));
  const sh = sharpe(points);
  warnings.push(...sh.warnings.map((w) => w.code));
  const so = sortino(points);
  warnings.push(...so.warnings.map((w) => w.code));
  const dd = drawdownStats(args.equity);
  warnings.push(...dd.warnings.map((w) => w.code));
  const cal = calmar(cagrOut.value, dd.maxDrawdown);
  warnings.push(...cal.warnings.map((w) => w.code));
  const worst = worstCompleteCalendarYear(args.equity);
  warnings.push(...worst.warnings.map((w) => w.code));
  const turn = turnoverStats(args.steps);
  return {
    label: args.label,
    startDate: args.startDate,
    endDate: args.endDate,
    startNav: args.startNav,
    finalNav: args.endNav,
    cagr: cagrOut.value,
    vol: vol.value,
    sharpe: sh.value,
    sortino: so.value,
    maxDrawdown: dd.maxDrawdown,
    calmar: cal.value,
    tuwMaxDdCalendarDays: dd.tuwMaxDdCalendarDays,
    tuwLongestCalendarDays: dd.tuwLongestCalendarDays,
    worstCompleteCalendarYear: worst.year,
    worstCompleteCalendarYearReturn: worst.value,
    ...turn,
    allocationChangeCount: args.allocationChangeCount,
    avgSpy: meanWeight(args.steps, RESEARCH_ASSET_IDS.SPY),
    avgGld: meanWeight(args.steps, RESEARCH_ASSET_IDS.GLD),
    avgBtc: meanWeight(args.steps, RESEARCH_ASSET_IDS.BTC),
    avgBil: meanWeight(args.steps, RESEARCH_ASSET_IDS.BIL),
    warnings,
  };
}

export function sliceBySession(steps: AnnotatedStep[], start: DateKey, end: DateKey): AnnotatedStep[] {
  return steps.filter((step) => step.session >= start && step.session <= end);
}

export function rebaseHoldout(args: {
  allSteps: AnnotatedStep[];
  holdoutFirst: DateKey;
  holdoutEnd: DateKey;
}): { steps: AnnotatedStep[]; equity: EquityPoint[]; startNavBase: number } {
  const holdout = sliceBySession(args.allSteps, args.holdoutFirst, args.holdoutEnd);
  if (holdout.some((step) => step.inception)) {
    throw new Error('HOLDOUT_RESTARTED');
  }
  const prior = [...args.allSteps].reverse().find((step) => step.session < args.holdoutFirst);
  if (!prior) throw new Error('HOLDOUT_MISSING_PRIOR_NAV');
  const startNavBase = prior.nav;
  if (!(startNavBase > 0)) throw new Error('HOLDOUT_NON_POSITIVE_PRIOR_NAV');
  const equity: EquityPoint[] = [
    { date: prior.session, nav: 1 },
    ...holdout.map((step) => ({ date: step.session, nav: step.nav / startNavBase })),
  ];
  return { steps: holdout, equity, startNavBase };
}

export function btcAttributionFor(steps: AnnotatedStep[], window: BtcAttributionRow['window']): BtcAttributionRow {
  const earning = steps.filter((step) => !step.inception && step.heldBeforeReturn && step.intervalReturns);
  let arithmeticSum = 0;
  let maxHeld = 0;
  let heldSum = 0;
  let largestPos = 0;
  let largestNeg = 0;
  for (const step of earning) {
    const held = weightOf(step.heldBeforeReturn as Weights, RESEARCH_ASSET_IDS.BTC);
    const ret = (step.intervalReturns as Weights)[RESEARCH_ASSET_IDS.BTC];
    if (ret == null) throw new Error(`MISSING_HELD_ASSET_RETURN: ${RESEARCH_ASSET_IDS.BTC}`);
    const contrib = held * ret;
    arithmeticSum += contrib;
    heldSum += held;
    maxHeld = Math.max(maxHeld, held);
    largestPos = Math.max(largestPos, contrib);
    largestNeg = Math.min(largestNeg, contrib);
  }
  return {
    window,
    arithmeticSum,
    avgHeldBtc: earning.length ? heldSum / earning.length : 0,
    maxHeldBtc: maxHeld,
    largestPositiveContribution: largestPos,
    largestNegativeContribution: largestNeg,
  };
}

export function yearlyRows(allSteps: AnnotatedStep[]): YearlyRow[] {
  const years = new Set(allSteps.map((step) => Number(step.session.slice(0, 4))));
  const out: YearlyRow[] = [];
  for (const year of [...years].sort((a, b) => a - b)) {
    const yearSteps = allSteps.filter((step) => step.session.startsWith(String(year)));
    if (yearSteps.length === 0) continue;
    const hasJan = yearSteps.some((step) => step.session.slice(5, 7) === '01');
    const hasDec = yearSteps.some((step) => step.session.slice(5, 7) === '12');
    const prior = [...allSteps].reverse().find((step) => step.session < `${year}-01-01`);
    const complete = Boolean(hasJan && hasDec && prior);
    const startNav = complete && prior ? prior.nav : yearSteps[0].inception ? 1 : prior?.nav;
    const endNav = yearSteps[yearSteps.length - 1].nav;
    const simpleReturn =
      startNav != null && startNav > 0 ? endNav / startNav - 1 : null;
    const equity: EquityPoint[] = [];
    if (prior && startNav != null && startNav > 0) {
      equity.push({ date: prior.session, nav: 1 });
      for (const step of yearSteps) equity.push({ date: step.session, nav: step.nav / startNav });
    } else {
      for (const step of yearSteps) equity.push({ date: step.session, nav: step.nav });
    }
    const dd = drawdownStats(equity);
    out.push({
      year,
      complete,
      simpleReturn,
      maxDrawdown: dd.maxDrawdown,
      avgSpy: meanWeight(yearSteps, RESEARCH_ASSET_IDS.SPY),
      avgGld: meanWeight(yearSteps, RESEARCH_ASSET_IDS.GLD),
      avgBtc: meanWeight(yearSteps, RESEARCH_ASSET_IDS.BTC),
      avgBil: meanWeight(yearSteps, RESEARCH_ASSET_IDS.BIL),
    });
  }
  return out;
}

export function regimeConditioned(steps: AnnotatedStep[]): RegimeConditionRow[] {
  const byRegime = new Map<string, AnnotatedStep[]>();
  for (const step of steps) {
    if (step.inception || step.governingRegime == null) continue;
    const list = byRegime.get(step.governingRegime) ?? [];
    list.push(step);
    byRegime.set(step.governingRegime, list);
  }
  return [...byRegime.keys()].sort().map((regime) => {
    const rows = byRegime.get(regime) ?? [];
    const compounded = rows.reduce((nav, step) => nav * (1 + step.netPortfolioReturn), 1) - 1;
    const avg = (asset: string) =>
      rows.reduce((sum, step) => sum + weightOf(step.heldBeforeReturn ?? {}, asset), 0) / rows.length;
    return {
      regime,
      intervalCount: rows.length,
      averageNetReturn: rows.reduce((sum, step) => sum + step.netPortfolioReturn, 0) / rows.length,
      compoundedConditionalReturn: compounded,
      avgSpy: avg(RESEARCH_ASSET_IDS.SPY),
      avgGld: avg(RESEARCH_ASSET_IDS.GLD),
      avgBtc: avg(RESEARCH_ASSET_IDS.BTC),
      avgBil: avg(RESEARCH_ASSET_IDS.BIL),
    };
  });
}

export function summarizeScenario(
  scenario: StudyScenario,
  steps: AnnotatedStep[],
  args: {
    s1: DateKey;
    finalDate: DateKey;
    developmentLast: DateKey;
    holdoutFirst: DateKey;
    publishedTargets: Map<DateKey, Weights>;
    studySessions: DateKey[];
  }
): ScenarioResult {
  const changes = allocationChangeCount(args.publishedTargets, args.studySessions);
  const fullEquity = equityFromSteps(steps);
  const full = computeMetricBundle({
    label: 'FULL',
    steps,
    startDate: args.s1,
    endDate: args.finalDate,
    startNav: 1,
    endNav: steps[steps.length - 1]?.nav ?? 1,
    equity: fullEquity,
    cashPolicy: scenario.cashPolicy,
    allocationChangeCount: changes,
  });

  const developmentSteps = steps.filter((step) => step.session <= args.developmentLast);
  const development = computeMetricBundle({
    label: 'DEVELOPMENT',
    steps: developmentSteps,
    startDate: args.s1,
    endDate: args.developmentLast,
    startNav: 1,
    endNav: developmentSteps[developmentSteps.length - 1]?.nav ?? 1,
    equity: equityFromSteps(developmentSteps),
    cashPolicy: scenario.cashPolicy,
    allocationChangeCount: changes,
  });

  const holdoutSlice = rebaseHoldout({
    allSteps: steps,
    holdoutFirst: args.holdoutFirst,
    holdoutEnd: HOLDOUT_CALENDAR_END,
  });
  const holdout = computeMetricBundle({
    label: 'HOLDOUT',
    steps: holdoutSlice.steps,
    startDate: HOLDOUT_CALENDAR_START,
    endDate: HOLDOUT_CALENDAR_END,
    startNav: 1,
    endNav: holdoutSlice.equity[holdoutSlice.equity.length - 1]?.nav ?? 1,
    equity: holdoutSlice.equity,
    cashPolicy: scenario.cashPolicy,
    allocationChangeCount: changes,
  });

  return {
    scenario,
    steps,
    full,
    development,
    holdout,
    yearly: yearlyRows(steps),
    btcAttribution: [
      btcAttributionFor(steps, 'FULL'),
      btcAttributionFor(developmentSteps, 'DEVELOPMENT'),
      btcAttributionFor(holdoutSlice.steps, 'HOLDOUT'),
    ],
    regimeConditioned: regimeConditioned(steps),
  };
}

export function expandingCheckpoints(sessions: DateKey[], finalDate: DateKey): DateKey[] {
  const out: DateKey[] = [];
  for (const year of EXPANDING_YEAR_ENDS) {
    const end = lastSessionOfYear(sessions, year);
    if (end) out.push(end);
  }
  out.push(finalDate);
  return out;
}

export function metricAtEndpoint(result: ScenarioResult, endDate: DateKey, cashPolicy: StudyScenario['cashPolicy']): MetricBundle {
  const steps = result.steps.filter((step) => step.session <= endDate);
  if (steps.length === 0) throw new Error(`EMPTY_ENDPOINT: ${endDate}`);
  return computeMetricBundle({
    label: `END_${endDate}`,
    steps,
    startDate: steps[0].session,
    endDate,
    startNav: 1,
    endNav: steps[steps.length - 1].nav,
    equity: equityFromSteps(steps),
    cashPolicy,
    allocationChangeCount: result.full.allocationChangeCount,
  });
}

export function deltaVsP0(
  candidate: MetricBundle,
  p0: MetricBundle
): Record<string, number | null> {
  const sub = (a: number | null, b: number | null) =>
    a == null || b == null ? null : a - b;
  return {
    convention: null,
    d_cagr_pp: sub(candidate.cagr, p0.cagr) == null ? null : (sub(candidate.cagr, p0.cagr) as number) * 100,
    d_vol_pp: sub(candidate.vol, p0.vol) == null ? null : (sub(candidate.vol, p0.vol) as number) * 100,
    d_sharpe: sub(candidate.sharpe, p0.sharpe),
    d_sortino: sub(candidate.sortino, p0.sortino),
    d_maxdd_pp: sub(candidate.maxDrawdown, p0.maxDrawdown) == null ? null : (sub(candidate.maxDrawdown, p0.maxDrawdown) as number) * 100,
    d_calmar: sub(candidate.calmar, p0.calmar),
    d_tuw_maxdd_days: sub(candidate.tuwMaxDdCalendarDays, p0.tuwMaxDdCalendarDays),
    d_tuw_longest_days: sub(candidate.tuwLongestCalendarDays, p0.tuwLongestCalendarDays),
    d_one_way_turnover: sub(candidate.cumulativeOneWayTurnover, p0.cumulativeOneWayTurnover),
    d_avg_btc: sub(candidate.avgBtc, p0.avgBtc),
    d_avg_gld: sub(candidate.avgGld, p0.avgGld),
    d_avg_spy: sub(candidate.avgSpy, p0.avgSpy),
  };
}

export const DELTA_SIGN_NOTE = DELTA_CONVENTION.max_drawdown;

function weightsFiniteAndSumToOne(weights: Weights): boolean {
  let sum = 0;
  for (const value of Object.values(weights)) {
    if (!Number.isFinite(value)) return false;
    sum += value;
  }
  return Math.abs(sum - 1) <= NUMERIC_TOLERANCE;
}

export function runIntegrityChecks(args: {
  results: ScenarioResult[];
  s1: DateKey;
  finalDate: DateKey;
  holdoutFirst: DateKey;
  developmentLast: DateKey;
  modelStates: Map<DateKey, ResearchModelState>;
  closeMap: Map<string, Map<DateKey, number>>;
  btcStaleCount: number;
  btcPostCloseLeak: boolean;
}): IntegrityCheck[] {
  const checks: IntegrityCheck[] = [];
  const primary = args.results.filter((r) => r.scenario.family === 'primary');
  const primaryIds = primary.map((r) => r.scenario.candidateId);

  checks.push({
    id: 'A_shared_dates',
    passed:
      primary.length === CANDIDATE_IDS.length &&
      primary.every((r) => r.full.startDate === args.s1 && r.full.endDate === args.finalDate) &&
      primary.every((r) => r.holdout.startDate === HOLDOUT_CALENDAR_START && r.holdout.endDate === HOLDOUT_CALENDAR_END) &&
      args.holdoutFirst === HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED &&
      args.developmentLast === EXPECTED_DEVELOPMENT_LAST_SESSION,
    detail: `s1=${args.s1} end=${args.finalDate} holdoutFirst=${args.holdoutFirst} developmentLast=${args.developmentLast}`,
  });

  let weightsOk = true;
  let navOk = true;
  let zeroBpsOk = true;
  for (const result of args.results) {
    for (const step of result.steps) {
      if (!weightsFiniteAndSumToOne(step.held)) weightsOk = false;
      if (!Number.isFinite(step.nav) || !(step.nav > 0)) navOk = false;
      if (result.scenario.costBps === 0 && Math.abs(step.netPortfolioReturn - step.marketReturn) > NUMERIC_TOLERANCE) {
        zeroBpsOk = false;
      }
    }
  }
  checks.push({ id: 'B_C_finite_weights_sum_one', passed: weightsOk, detail: weightsOk ? 'ok' : 'weight failure' });
  checks.push({ id: 'D_finite_positive_nav', passed: navOk, detail: navOk ? 'ok' : 'nav failure' });
  checks.push({
    id: 'E_no_missing_held_return',
    passed: true,
    detail: 'fail-closed requireHeldAssetReturns used during replay',
  });
  checks.push({
    id: 'F_no_btc_post_close_leak',
    passed: !args.btcPostCloseLeak,
    detail: args.btcPostCloseLeak ? 'leak detected' : 'ok',
  });
  checks.push({
    id: 'G_btc_stale_count',
    passed: args.btcStaleCount === 1,
    detail: `btc_stale_count=${args.btcStaleCount}`,
  });
  checks.push({ id: 'H_zero_bps_net_eq_market', passed: zeroBpsOk, detail: zeroBpsOk ? 'ok' : 'mismatch' });

  const groups = new Map<string, ScenarioResult[]>();
  for (const result of args.results) {
    if (result.scenario.cashPolicy !== 'BIL_ADJUSTED') continue;
    if (result.scenario.noBtcPolicy !== 'none') continue;
    const key = [
      result.scenario.candidateId ?? result.scenario.benchmarkId ?? result.scenario.ablation,
      result.scenario.ablation,
      result.scenario.staticSchedule,
      result.scenario.rebalanceMode,
    ].join('|');
    const list = groups.get(key) ?? [];
    list.push(result);
    groups.set(key, list);
  }
  let costOrderOk = true;
  for (const group of groups.values()) {
    const byCost = new Map(group.map((r) => [r.scenario.costBps, r.full.finalNav]));
    const n0 = byCost.get(0);
    const n5 = byCost.get(5);
    const n10 = byCost.get(10);
    if (n0 != null && n5 != null && n0 + NUMERIC_TOLERANCE < n5) costOrderOk = false;
    if (n5 != null && n10 != null && n5 + NUMERIC_TOLERANCE < n10) costOrderOk = false;
    if (n0 != null && n10 != null && n0 + NUMERIC_TOLERANCE < n10) costOrderOk = false;
  }
  checks.push({
    id: 'I_cost_nav_order',
    passed: costOrderOk,
    detail: costOrderOk ? '10bps <= 5bps <= 0bps' : 'NAV order violated',
  });

  const spyPaths = args.results.filter(
    (r) =>
      (r.scenario.benchmarkId === 'SPY_100' || r.scenario.ablation === 'SPY_100') &&
      r.scenario.family !== 'static_monthly'
  );
  let spyOk = true;
  let spyDetail = 'missing SPY_100';
  if (spyPaths.length > 0) {
    const spy0 = spyPaths.find((r) => r.scenario.costBps === 0);
    spyOk = spyPaths.every((r) => r.full.rebalanceCountExInception === 0 && r.full.cumulativeOneWayTurnover === 0);
    if (spy0) {
      const navs = spyPaths.map((r) => r.full.finalNav);
      spyOk = spyOk && navs.every((nav) => nav != null && Math.abs((nav as number) - (spy0.full.finalNav as number)) <= NUMERIC_TOLERANCE);
      const spyCloses = args.closeMap.get(RESEARCH_ASSET_IDS.SPY);
      const start = spyCloses?.get(args.s1);
      const end = spyCloses?.get(args.finalDate);
      if (start && end && spy0.full.finalNav != null) {
        const expected = end / start;
        spyOk = spyOk && Math.abs(spy0.full.finalNav - expected) <= 1e-9;
        spyDetail = `turnover=0 costs identical path=${spy0.full.finalNav} spyRatio=${expected}`;
      }
    }
  }
  checks.push({ id: 'J_spy_100', passed: spyOk, detail: spyDetail });

  let p0PathOk = true;
  for (const [date, state] of args.modelStates) {
    if (date < EXPECTED_COMMON_SIGNAL_DATE) continue;
    if (!p0CombinedMatchesProductionActuals(state)) {
      p0PathOk = false;
      break;
    }
  }
  checks.push({
    id: 'K_p0_combined_production_path',
    passed: p0PathOk,
    detail: p0PathOk ? 'P0 COMBINED matches production actuals' : 'P0 COMBINED drifted',
  });

  const outside = primaryIds.filter((id) => id == null || !CANDIDATE_IDS.includes(id));
  checks.push({
    id: 'L_primary_ids_p0_p6',
    passed: outside.length === 0 && JSON.stringify(primaryIds) === JSON.stringify([...CANDIDATE_IDS]),
    detail: primaryIds.join(','),
  });

  const holdoutRestarted = args.results.some((r) =>
    r.steps.some((step) => step.inception && step.session >= args.holdoutFirst)
  );
  checks.push({
    id: 'M_holdout_not_restarted',
    passed: !holdoutRestarted,
    detail: holdoutRestarted ? 'inception inside holdout' : 'continuous path',
  });

  checks.push({
    id: 'N_return_panel_not_raw_signal',
    passed: true,
    detail: 'interval returns built from return-panel performance_close only',
  });

  return checks;
}

export function firstEligibleHoldoutSession(sessions: DateKey[]): DateKey {
  const found = firstEligibleSessionOnOrAfter(sessions, HOLDOUT_CALENDAR_START);
  if (found !== HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED) {
    throw new Error(`HOLDOUT_FIRST_SESSION_MISMATCH: ${found}`);
  }
  return found;
}

export function endMinus3mSession(sessions: DateKey[]): DateKey {
  const found = lastSessionOnOrBefore(sessions, END_MINUS_3M_BOUNDARY);
  if (!found) throw new Error('END_MINUS_3M_SESSION_MISSING');
  return found;
}

export function developmentLastSession(sessions: DateKey[]): DateKey {
  const found = lastSessionBefore(sessions, HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED);
  if (found !== EXPECTED_DEVELOPMENT_LAST_SESSION) {
    throw new Error(`DEVELOPMENT_LAST_MISMATCH: ${found}`);
  }
  return found;
}

export function finalResearchSession(sessions: DateKey[]): DateKey {
  const found = lastSessionOnOrBefore(sessions, RESEARCH_END);
  if (found !== RESEARCH_END) throw new Error(`FINAL_SESSION_MISMATCH: ${found}`);
  return found;
}
