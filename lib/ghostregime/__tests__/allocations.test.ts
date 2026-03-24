/**
 * Production allocation engine: KISS 8.0 regime targets + VAMS scales
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeAllocations } from '../allocations';

const TOL = 1e-9;

describe('computeAllocations (KISS 8.0)', () => {
  it('GOLDILOCKS: risk-on targets 60/30/10', () => {
    const out = computeAllocations(
      'GOLDILOCKS',
      { stocks: 2, gold: 2, btc: 2 }
    );
    assert.strictEqual(out.stocks_target, 0.6);
    assert.strictEqual(out.gold_target, 0.3);
    assert.strictEqual(out.btc_target, 0.1);
  });

  it('DEFLATION: risk-off targets 30/30/5', () => {
    const out = computeAllocations(
      'DEFLATION',
      { stocks: 2, gold: 2, btc: 2 }
    );
    assert.strictEqual(out.stocks_target, 0.3);
    assert.strictEqual(out.gold_target, 0.3);
    assert.strictEqual(out.btc_target, 0.05);
  });

  it('INFLATION: risk-off stocks/BTC, gold target 15%', () => {
    const out = computeAllocations(
      'INFLATION',
      { stocks: 2, gold: 2, btc: 2 }
    );
    assert.strictEqual(out.stocks_target, 0.3);
    assert.strictEqual(out.gold_target, 0.15);
    assert.strictEqual(out.btc_target, 0.05);
  });

  it('INFLATION + bearish stocks + neutral gold + bearish BTC → 0 / 7.5% / 0, ~92.5% cash', () => {
    const out = computeAllocations(
      'INFLATION',
      { stocks: -2, gold: 0, btc: -2 }
    );
    assert.ok(Math.abs(out.stocks_actual) < TOL);
    assert.ok(Math.abs(out.gold_actual - 0.075) < TOL);
    assert.ok(Math.abs(out.btc_actual) < TOL);
    assert.ok(Math.abs(out.cash - 0.925) < TOL, `cash ${out.cash}`);
  });
});
