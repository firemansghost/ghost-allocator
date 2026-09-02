import { describe, it } from 'node:test';
import assert from 'node:assert';
import { firstSessionOfEachMonth, firstSessionOfEachYear } from '../../../scripts/ghostregime/research/execution';
import {
  applyNoBtcToCash,
  type StudyScenario,
} from '../../../scripts/ghostregime/research/r7c-run-plan';
import {
  allocationChangeCount,
  btcAttributionFor,
  endMinus3mSession,
  expandingCheckpoints,
  firstValidSignalSession,
  lastSessionOnOrBefore,
  rebaseHoldout,
  regimeConditioned,
  replayAnnotated,
  runIntegrityChecks,
  sliceBySession,
  type AnnotatedStep,
} from '../../../scripts/ghostregime/research/study-engine';
import { RESEARCH_ASSET_IDS } from '../../../scripts/ghostregime/research/study-contract';
import type { DateKey, ResearchModelState, ReturnObservation, Weights } from '../../../scripts/ghostregime/research/types';
import { buildCloseMap } from '../../../scripts/ghostregime/research/study-engine';

const EVENT: StudyScenario = {
  scenarioId: 'SYN_EVENT',
  family: 'primary',
  candidateId: 'P0_CURRENT',
  benchmarkId: null,
  ablation: 'COMBINED',
  costBps: 0,
  cashPolicy: 'BIL_ADJUSTED',
  noBtcPolicy: 'none',
  rebalanceMode: 'event',
  staticSchedule: 'none',
};

function closes(
  sessions: DateKey[],
  prices: Record<string, number[]>
): Map<string, Map<DateKey, number>> {
  const rows: ReturnObservation[] = [];
  for (const [asset, series] of Object.entries(prices)) {
    series.forEach((price, i) => {
      rows.push({
        asset_id: asset,
        date_key: sessions[i],
        performance_close: price,
        source: 'synthetic',
      });
    });
  }
  return buildCloseMap(rows);
}

function constantTargets(sessions: DateKey[], weights: Weights): Map<DateKey, Weights> {
  return new Map(sessions.map((session) => [session, { ...weights }]));
}

describe('R7C study engine (synthetic)', () => {
  it('derives first valid signal from the observation floor', () => {
    const sessions = ['2017-08-01', '2017-08-02', '2017-08-03'];
    const signalRows = [
      ...sessions.map((date_key) => ({ symbol: 'SPY', date_key, close: 1, source: 's' })),
      ...sessions.map((date_key) => ({ symbol: 'GLD', date_key, close: 1, source: 's' })),
      ...sessions.map((date_key) => ({ symbol: 'BTC-USD', date_key, close: 1, source: 's' })),
    ];
    assert.strictEqual(firstValidSignalSession(sessions, signalRows, 3), '2017-08-03');
    assert.strictEqual(firstValidSignalSession(sessions, signalRows, 4), null);
  });

  it('does not restart the holdout portfolio', () => {
    const sessions = ['2024-08-29', '2024-08-30', '2024-09-03', '2026-09-01'];
    const targets = constantTargets(sessions, { SPY: 1 });
    const closeMap = closes(sessions, { SPY: [100, 100, 110, 121], BIL: [1, 1, 1, 1], 'BTC-USD': [1, 1, 1, 1] });
    const steps = replayAnnotated({
      sessions,
      publishedTargets: targets,
      publishedRegimes: new Map(sessions.map((s) => [s, 'GOLDILOCKS'])),
      closeMap,
      scenario: { ...EVENT, rebalanceMode: 'none' },
    });
    const holdout = rebaseHoldout({ allSteps: steps, holdoutFirst: '2024-09-03', holdoutEnd: '2026-09-01' });
    assert.ok(holdout.steps.every((step) => !step.inception));
    assert.ok(holdout.startNavBase > 0);
    assert.notStrictEqual(holdout.steps[0]?.nav, 1);
    const sliced = sliceBySession(steps, '2024-09-03', '2026-09-01');
    assert.ok(sliced.every((step) => !step.inception));
  });

  it('uses net returns for positive cost and leaves 0 bps net equal to market', () => {
    const sessions = ['2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
    const targets = new Map<DateKey, Weights>([
      ['2024-01-02', { SPY: 1, BIL: 0 }],
      ['2024-01-03', { SPY: 1, BIL: 0 }],
      ['2024-01-04', { SPY: 0, BIL: 1 }],
      ['2024-01-05', { SPY: 0, BIL: 1 }],
    ]);
    const closeMap = closes(sessions, { SPY: [100, 100, 100, 100], BIL: [1, 1, 1, 1] });
    const zero = replayAnnotated({
      sessions,
      publishedTargets: targets,
      publishedRegimes: new Map(sessions.map((s) => [s, 'GOLDILOCKS'])),
      closeMap,
      scenario: EVENT,
    });
    const five = replayAnnotated({
      sessions,
      publishedTargets: targets,
      publishedRegimes: new Map(sessions.map((s) => [s, 'GOLDILOCKS'])),
      closeMap,
      scenario: { ...EVENT, costBps: 5 },
    });
    const trade = five.find((step) => step.rebalanced);
    assert.ok(trade);
    assert.ok(trade.netPortfolioReturn < trade.marketReturn);
    assert.ok(zero.filter((step) => !step.inception).every((step) => Math.abs(step.netPortfolioReturn - step.marketReturn) < 1e-12));
  });

  it('annual and monthly first-session schedules differ', () => {
    const sessions = ['2024-01-02', '2024-01-03', '2024-02-01', '2024-02-02'];
    assert.deepStrictEqual(firstSessionOfEachYear(sessions), ['2024-01-02']);
    assert.deepStrictEqual(firstSessionOfEachMonth(sessions), ['2024-01-02', '2024-02-01']);
    const targets = constantTargets(sessions, { SPY: 0.6, IEF: 0.4 });
    const closeMap = closes(sessions, { SPY: [100, 110, 100, 100], IEF: [100, 100, 100, 100] });
    const annual = replayAnnotated({
      sessions,
      publishedTargets: targets,
      publishedRegimes: new Map(sessions.map((s) => [s, null])),
      closeMap,
      scenario: { ...EVENT, rebalanceMode: 'scheduled', staticSchedule: 'annual', candidateId: null, benchmarkId: 'STATIC_6040' },
    });
    const monthly = replayAnnotated({
      sessions,
      publishedTargets: targets,
      publishedRegimes: new Map(sessions.map((s) => [s, null])),
      closeMap,
      scenario: { ...EVENT, rebalanceMode: 'scheduled', staticSchedule: 'monthly', candidateId: null, benchmarkId: 'STATIC_6040' },
    });
    assert.ok(monthly.filter((s) => s.rebalanced).length > annual.filter((s) => s.rebalanced).length);
  });

  it('SPY_100 has zero post-inception turnover and identical 0/5/10 paths', () => {
    const sessions = ['2024-01-02', '2024-01-03', '2024-01-04'];
    const targets = constantTargets(sessions, { SPY: 1 });
    const closeMap = closes(sessions, { SPY: [100, 100, 110] });
    const navs: number[] = [];
    for (const costBps of [0, 5, 10]) {
      const steps = replayAnnotated({
        sessions,
        publishedTargets: targets,
        publishedRegimes: new Map(sessions.map((s) => [s, null])),
        closeMap,
        scenario: {
          ...EVENT,
          family: 'benchmark',
          candidateId: null,
          benchmarkId: 'SPY_100',
          costBps,
          rebalanceMode: 'none',
        },
      });
      assert.strictEqual(steps.filter((s) => s.rebalanced).length, 0);
      assert.ok(steps.filter((s) => !s.inception).every((s) => s.oneWayTurnover === 0));
      navs.push(steps[steps.length - 1].nav);
    }
    assert.ok(navs.every((nav) => Math.abs(nav - navs[0]) < 1e-12));
    assert.ok(Math.abs(navs[0] - 1.1) < 1e-12);
  });

  it('labels regime-conditioned intervals with the executed regime, not the fresh T signal', () => {
    const sessions = ['2024-01-02', '2024-01-03', '2024-01-04'];
    const targets = new Map<DateKey, Weights>([
      ['2024-01-02', { SPY: 1 }],
      ['2024-01-03', { SPY: 1 }],
      ['2024-01-04', { BIL: 1 }],
    ]);
    const regimes = new Map<DateKey, string | null>([
      ['2024-01-02', 'GOLDILOCKS'],
      ['2024-01-03', 'INFLATION'],
      ['2024-01-04', 'DEFLATION'],
    ]);
    const closeMap = closes(sessions, { SPY: [100, 100, 110], BIL: [1, 1, 1] });
    const steps = replayAnnotated({
      sessions,
      publishedTargets: targets,
      publishedRegimes: regimes,
      closeMap,
      scenario: EVENT,
    });
    const returnStep = steps.find((step) => step.session === '2024-01-04');
    assert.ok(returnStep);
    assert.strictEqual(returnStep.governingRegime, 'GOLDILOCKS');
    assert.notStrictEqual(returnStep.governingRegime, 'INFLATION');
    const rows = regimeConditioned(steps);
    assert.ok(rows.some((row) => row.regime === 'GOLDILOCKS'));
    assert.ok(!rows.some((row) => row.regime === 'INFLATION' && row.intervalCount > 0 && returnStep.governingRegime === 'INFLATION'));
  });

  it('selects endpoint-minus-3m and expanding year-end checkpoints', () => {
    const sessions = ['2018-12-31', '2019-12-31', '2026-06-01', '2026-09-01'];
    assert.strictEqual(endMinus3mSession(sessions), '2026-06-01');
    assert.strictEqual(lastSessionOnOrBefore(sessions, '2026-06-01'), '2026-06-01');
    const checkpoints = expandingCheckpoints(sessions, '2026-09-01');
    assert.ok(checkpoints.includes('2018-12-31'));
    assert.ok(checkpoints.includes('2019-12-31'));
    assert.strictEqual(checkpoints[checkpoints.length - 1], '2026-09-01');
  });

  it('counts published allocation changes without ranking candidates', () => {
    const sessions = ['2024-01-02', '2024-01-03', '2024-01-04'];
    const targets = new Map<DateKey, Weights>([
      ['2024-01-02', { SPY: 1 }],
      ['2024-01-03', { SPY: 1 }],
      ['2024-01-04', { BIL: 1 }],
    ]);
    assert.strictEqual(allocationChangeCount(targets, sessions), 1);
  });

  it('BTC arithmetic contribution uses held weight times BTC return', () => {
    const step = {
      inception: false,
      heldBeforeReturn: { 'BTC-USD': 0.1, SPY: 0.9 },
      intervalReturns: { 'BTC-USD': 0.5, SPY: 0 },
    } as AnnotatedStep;
    const row = btcAttributionFor([step], 'FULL');
    assert.ok(Math.abs(row.arithmeticSum - 0.05) < 1e-12);
    assert.ok(Math.abs(row.avgHeldBtc - 0.1) < 1e-12);
  });

  it('integrity failure is reported and does not invent a winner', () => {
    const fakeState = {
      date: '2017-08-03',
      stocks_actual: 0.6,
      gold_actual: 0.3,
      btc_actual: 0.1,
      cash: 0,
    } as ResearchModelState;
    const checks = runIntegrityChecks({
      results: [],
      s1: '2017-08-04',
      finalDate: '2026-09-01',
      holdoutFirst: '2024-09-03',
      developmentLast: '2024-08-30',
      modelStates: new Map([['2017-08-03', fakeState]]),
      closeMap: new Map(),
      btcStaleCount: 2,
      btcPostCloseLeak: true,
    });
    assert.ok(checks.some((check) => check.id === 'G_btc_stale_count' && !check.passed));
    assert.ok(checks.some((check) => check.id === 'F_no_btc_post_close_leak' && !check.passed));
    assert.ok(checks.some((check) => check.id === 'L_primary_ids_p0_p6' && !check.passed));
  });

  it('no-BTC helper is available to the engine without entering CANDIDATE_IDS', () => {
    const weights = applyNoBtcToCash({
      [RESEARCH_ASSET_IDS.SPY]: 0.55,
      [RESEARCH_ASSET_IDS.GLD]: 0.35,
      [RESEARCH_ASSET_IDS.BTC]: 0.1,
      [RESEARCH_ASSET_IDS.BIL]: 0,
    });
    assert.strictEqual(weights[RESEARCH_ASSET_IDS.BTC], 0);
    assert.strictEqual(weights[RESEARCH_ASSET_IDS.BIL], 0.1);
  });
});
