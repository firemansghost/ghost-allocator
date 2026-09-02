import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  firstEligibleSessionOnOrAfter,
  firstSessionOfEachMonth,
  firstSessionOfEachYear,
  replaySyntheticExecution,
} from '../../../scripts/ghostregime/research/execution';

describe('R7B1 execution queue', () => {
  it('F. A_T cannot earn T→T+1; first effect is T+1→T+2', () => {
    const steps = replaySyntheticExecution({
      rebalanceMode: 'event',
      sessions: [
        { session: '2024-01-02', publishedTargetAfterClose: { X: 1, Y: 0 } },
        {
          session: '2024-01-03',
          publishedTargetAfterClose: { X: 0, Y: 1 },
          intervalReturns: { X: 0, Y: 0 },
        },
        {
          session: '2024-01-04',
          publishedTargetAfterClose: { X: 0, Y: 1 },
          intervalReturns: { X: 0.1, Y: 0 },
        },
        {
          session: '2024-01-05',
          publishedTargetAfterClose: { X: 0, Y: 1 },
          intervalReturns: { X: 0.5, Y: -0.1 },
        },
      ],
    });

    assert.strictEqual(steps[0].session, '2024-01-03');
    assert.strictEqual(steps[0].inception, true);
    assert.strictEqual(steps[0].rebalanced, false);
    assert.strictEqual(steps[0].marketReturn, 0);
    assert.strictEqual(steps[0].netPortfolioReturn, 0);
    assert.ok(Math.abs(steps[1].marketReturn - 0.1) < 1e-12);
    assert.ok(Math.abs(steps[1].netPortfolioReturn - 0.1) < 1e-12);
    assert.strictEqual(steps[1].rebalanced, true);
    assert.ok(Math.abs(steps[2].marketReturn - -0.1) < 1e-12);
    assert.ok(Math.abs(steps[2].netPortfolioReturn - -0.1) < 1e-12);
  });

  it('G. initial inception has turnover 0 and cost 0', () => {
    const steps = replaySyntheticExecution({
      rebalanceMode: 'event',
      costBps: 5,
      sessions: [
        { session: '2024-01-02', publishedTargetAfterClose: { SPY: 0.6, GLD: 0.4 } },
        {
          session: '2024-01-03',
          publishedTargetAfterClose: { SPY: 0.6, GLD: 0.4 },
          intervalReturns: { SPY: 0, GLD: 0 },
        },
      ],
    });
    assert.strictEqual(steps[0].inception, true);
    assert.strictEqual(steps[0].rebalanced, false);
    assert.strictEqual(steps[0].oneWayTurnover, 0);
    assert.strictEqual(steps[0].costFraction, 0);
    assert.strictEqual(steps[0].marketReturn, 0);
    assert.strictEqual(steps[0].netPortfolioReturn, 0);
    assert.strictEqual(steps[0].nav, 1);
  });

  it('H. annual static rebalance fires only on scheduled sessions', () => {
    const steps = replaySyntheticExecution({
      rebalanceMode: 'scheduled',
      costBps: 5,
      sessions: [
        { session: '2023-12-29', publishedTargetAfterClose: { SPY: 0.6, IEF: 0.4 } },
        {
          session: '2024-01-02',
          publishedTargetAfterClose: { SPY: 0.6, IEF: 0.4 },
          intervalReturns: { SPY: 0, IEF: 0 },
          scheduled: true,
        },
        {
          session: '2024-06-03',
          publishedTargetAfterClose: { SPY: 0.6, IEF: 0.4 },
          intervalReturns: { SPY: 0.1, IEF: 0 },
          scheduled: true,
        },
        {
          session: '2024-06-04',
          publishedTargetAfterClose: { SPY: 0.6, IEF: 0.4 },
          intervalReturns: { SPY: 0.1, IEF: 0 },
          scheduled: false,
        },
      ],
    });
    assert.strictEqual(steps[0].inception, true);
    assert.strictEqual(steps[0].rebalanced, false);
    assert.strictEqual(steps[0].oneWayTurnover, 0);
    assert.strictEqual(steps[1].rebalanced, true);
    assert.ok(steps[1].oneWayTurnover > 0);
    assert.strictEqual(steps[2].rebalanced, false);
    assert.strictEqual(steps[2].oneWayTurnover, 0);
    assert.strictEqual(steps[2].costFraction, 0);
  });

  it('I. monthly sensitivity scheduler uses first eligible session of each month', () => {
    const sessions = ['2024-01-02', '2024-01-03', '2024-02-01', '2024-02-02', '2024-03-01'];
    assert.deepStrictEqual(firstSessionOfEachMonth(sessions), [
      '2024-01-02',
      '2024-02-01',
      '2024-03-01',
    ]);
    assert.deepStrictEqual(firstSessionOfEachYear(sessions), ['2024-01-02']);
    assert.strictEqual(firstEligibleSessionOnOrAfter(sessions, '2024-09-01'), null);
    assert.strictEqual(
      firstEligibleSessionOnOrAfter(['2024-08-30', '2024-09-03', '2024-09-04'], '2024-09-01'),
      '2024-09-03'
    );
  });

  it('distinguishes marketReturn from after-cost netPortfolioReturn', () => {
    const priorNav = 1;
    const market = 0.1;
    const gross = 1;
    const costBps = 5;
    const expectedCost = (costBps / 10_000) * gross;
    const expectedNavAfterMarket = priorNav * (1 + market);
    const expectedNavAfterCost = expectedNavAfterMarket * (1 - expectedCost);
    const expectedNet = expectedNavAfterCost / priorNav - 1;

    const steps = replaySyntheticExecution({
      rebalanceMode: 'event',
      costBps,
      sessions: [
        { session: '2024-01-02', publishedTargetAfterClose: { SPY: 1, GLD: 0 } },
        {
          session: '2024-01-03',
          publishedTargetAfterClose: { SPY: 0.5, GLD: 0.5 },
          intervalReturns: { SPY: 0 },
        },
        {
          session: '2024-01-04',
          publishedTargetAfterClose: { SPY: 0.5, GLD: 0.5 },
          intervalReturns: { SPY: 0.1 },
        },
      ],
    });

    const step = steps[1];
    assert.strictEqual(step.inception, false);
    assert.strictEqual(step.rebalanced, true);
    assert.ok(Math.abs(step.marketReturn - market) < 1e-12);
    assert.ok(Math.abs(step.grossTwoSided - gross) < 1e-12);
    assert.ok(Math.abs(step.costFraction - expectedCost) < 1e-12);
    assert.ok(Math.abs(step.navAfterMarket - expectedNavAfterMarket) < 1e-12);
    assert.ok(Math.abs(step.nav - expectedNavAfterCost) < 1e-12);
    assert.ok(Math.abs(step.netPortfolioReturn - expectedNet) < 1e-12);
    assert.ok(Math.abs(step.netPortfolioReturn - (step.nav / priorNav - 1)) < 1e-12);
    assert.ok(step.netPortfolioReturn !== step.marketReturn);
  });
});
