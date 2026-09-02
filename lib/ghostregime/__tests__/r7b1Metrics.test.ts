import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  annualizedVolatility,
  calmar,
  cagr,
  downsideDeviation,
  drawdownStats,
  sampleStdev,
  sharpe,
  sortino,
  worstCompleteCalendarYear,
} from '../../../scripts/ghostregime/research/metrics';

const TOL = 1e-10;

describe('R7B1 frozen metrics', () => {
  it('J. CAGR uses actual elapsed calendar days / 365.25', () => {
    const out = cagr(1, 1.1, '2019-01-01', '2020-01-01');
    const years = 365 / 365.25;
    assert.ok(out.value != null);
    assert.ok(Math.abs(out.value - (1.1 ** (1 / years) - 1)) < TOL);
  });

  it('J. annualized vol uses sample daily stdev × sqrt(252)', () => {
    const xs = [0.01, -0.01, 0.02];
    const sd = sampleStdev(xs);
    assert.ok(sd != null);
    const expected = Math.sqrt(((0.01 - 0.02 / 3) ** 2 + (-0.01 - 0.02 / 3) ** 2 + (0.02 - 0.02 / 3) ** 2) / 2);
    assert.ok(Math.abs(sd - expected) < TOL);
    const vol = annualizedVolatility(xs);
    assert.ok(vol.value != null);
    assert.ok(Math.abs(vol.value - expected * Math.sqrt(252)) < TOL);
  });

  it('J. Sharpe and Sortino use daily excess vs the cash series', () => {
    const points = [
      { date: '2024-01-02', portfolioReturn: 0.01, rfReturn: 0 },
      { date: '2024-01-03', portfolioReturn: -0.02, rfReturn: 0 },
      { date: '2024-01-04', portfolioReturn: 0.03, rfReturn: 0 },
    ];
    const excess = [0.01, -0.02, 0.03];
    const sh = sharpe(points);
    const so = sortino(points);
    const sd = sampleStdev(excess);
    const dd = downsideDeviation(excess);
    assert.ok(sh.value != null && sd != null);
    assert.ok(Math.abs(sh.value - (Math.sqrt(252) * (0.02 / 3)) / sd) < TOL);
    assert.ok(so.value != null && dd != null);
    assert.ok(Math.abs(dd - Math.sqrt((0.02 ** 2) / 3)) < TOL);
    assert.ok(Math.abs(so.value - (Math.sqrt(252) * (0.02 / 3)) / dd) < TOL);
  });

  it('J. max drawdown, Calmar, and TUW use the running-peak definition', () => {
    const equity = [
      { date: '2024-01-01', nav: 1 },
      { date: '2024-01-02', nav: 1.2 },
      { date: '2024-01-03', nav: 0.9 },
      { date: '2024-01-04', nav: 1.1 },
      { date: '2024-01-05', nav: 1.3 },
    ];
    const dd = drawdownStats(equity);
    assert.ok(dd.maxDrawdown != null);
    assert.ok(Math.abs(dd.maxDrawdown - (0.9 / 1.2 - 1)) < TOL);
    assert.strictEqual(dd.peakDate, '2024-01-02');
    assert.strictEqual(dd.troughDate, '2024-01-03');
    assert.strictEqual(dd.recoveredDate, '2024-01-05');
    assert.strictEqual(dd.tuwMaxDdCalendarDays, 3);
    assert.ok((dd.tuwLongestCalendarDays ?? 0) >= 2);
    const c = calmar(0.1, dd.maxDrawdown);
    assert.ok(c.value != null);
    assert.ok(Math.abs(c.value - 0.1 / 0.25) < TOL);
  });

  it('J. worst calendar year uses complete Jan–Dec years only', () => {
    const equity = [
      { date: '2023-12-29', nav: 1 },
      { date: '2024-01-02', nav: 1 },
      { date: '2024-12-31', nav: 0.9 },
      { date: '2025-01-02', nav: 0.9 },
      { date: '2025-12-31', nav: 1.2 },
    ];
    const worst = worstCompleteCalendarYear(equity);
    assert.strictEqual(worst.year, 2024);
    assert.ok(worst.value != null);
    assert.ok(Math.abs(worst.value - -0.1) < TOL);
  });

  it('returns null plus warning for undefined denominators', () => {
    assert.strictEqual(cagr(0, 1, '2024-01-01', '2025-01-01').value, null);
    assert.strictEqual(annualizedVolatility([0.01]).value, null);
    assert.strictEqual(sharpe([{ date: '2024-01-02', portfolioReturn: 0.01, rfReturn: 0.01 }, { date: '2024-01-03', portfolioReturn: 0.02, rfReturn: 0.02 }]).value, null);
    assert.strictEqual(sortino([{ date: '2024-01-02', portfolioReturn: 0.01, rfReturn: 0 }]).value, null);
    assert.strictEqual(calmar(0.1, 0).value, null);
    assert.strictEqual(worstCompleteCalendarYear([{ date: '2024-06-01', nav: 1 }]).value, null);
  });
});
