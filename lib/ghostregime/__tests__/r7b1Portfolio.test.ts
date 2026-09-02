import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  applyIntervalReturn,
  costFraction,
  grossTwoSidedNotional,
  oneWayTurnover,
  rebalanceToTarget,
} from '../../../scripts/ghostregime/research/portfolio';

const TOL = 1e-12;

describe('R7B1 generic portfolio accounting', () => {
  it('A. no-rebalance drift for 50/50 with unequal returns', () => {
    const { portfolioReturn: r, pretrade } = applyIntervalReturn(
      { SPY: 0.5, GLD: 0.5 },
      { SPY: 0.1, GLD: 0 }
    );
    assert.ok(Math.abs(r - 0.05) < TOL);
    assert.ok(Math.abs(pretrade.SPY - 0.5 * 1.1 / 1.05) < TOL);
    assert.ok(Math.abs(pretrade.GLD - 0.5 / 1.05) < TOL);
  });

  it('B. 10% transfer SPY → GLD has 20% gross and 10% one-way turnover', () => {
    const pretrade = { SPY: 0.5, GLD: 0.5, BIL: 0 };
    const target = { SPY: 0.4, GLD: 0.6, BIL: 0 };
    const gross = grossTwoSidedNotional(pretrade, target);
    assert.ok(Math.abs(gross - 0.2) < TOL);
    assert.ok(Math.abs(oneWayTurnover(gross) - 0.1) < TOL);
  });

  it('C. 5 bps cost uses gross two-sided notional', () => {
    const cost = costFraction(5, 0.2);
    assert.ok(Math.abs(cost - 0.0001) < TOL);
  });

  it('D. BIL movement is included once with no extra cash leg', () => {
    const pretrade = { SPY: 0.6, GLD: 0.3, 'BTC-USD': 0.1, BIL: 0 };
    const target = { SPY: 0.5, GLD: 0.3, 'BTC-USD': 0.1, BIL: 0.1 };
    const gross = grossTwoSidedNotional(pretrade, target);
    assert.ok(Math.abs(gross - 0.2) < TOL, `gross ${gross}`);
    assert.ok(Math.abs(oneWayTurnover(gross) - 0.1) < TOL);
  });

  it('E. no published-target change leaves turnover and cost at 0 after drift', () => {
    const { pretrade } = applyIntervalReturn({ SPY: 0.6, GLD: 0.4 }, { SPY: 0.2, GLD: 0 });
    const skipped = rebalanceToTarget(pretrade, { SPY: 0.6, GLD: 0.4 }, 5, { skip: true });
    assert.strictEqual(skipped.oneWayTurnover, 0);
    assert.strictEqual(skipped.costFraction, 0);
    assert.deepStrictEqual(skipped.held, pretrade);
  });
});
