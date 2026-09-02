import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeAllocations } from '../allocations';
import {
  computeCandidateAllocations,
  ghostRegimeActualsToWeights,
} from '../../../scripts/ghostregime/research/allocation-candidates';

const VAMS_FULL = { stocks: 2 as const, gold: 2 as const, btc: 2 as const };

describe('R7B1 allocation candidates', () => {
  it('P0 COMBINED matches production computeAllocations', () => {
    for (const regime of ['GOLDILOCKS', 'REFLATION', 'INFLATION', 'DEFLATION'] as const) {
      const research = computeCandidateAllocations('P0_CURRENT', regime, VAMS_FULL, 'COMBINED');
      const production = computeAllocations(regime, VAMS_FULL);
      assert.deepStrictEqual(research, production);
    }
  });

  it('REGIME_ONLY forces unit scales', () => {
    const out = computeCandidateAllocations(
      'P0_CURRENT',
      'GOLDILOCKS',
      { stocks: -2, gold: 0, btc: 2 },
      'REGIME_ONLY'
    );
    assert.strictEqual(out.stocks_scale, 1);
    assert.strictEqual(out.gold_scale, 1);
    assert.strictEqual(out.btc_scale, 1);
    assert.strictEqual(out.stocks_actual, 0.6);
  });

  it('VAMS_ONLY keeps 60/30/10 targets regardless of regime', () => {
    const out = computeCandidateAllocations('P5_DEEPER_OFF', 'INFLATION', VAMS_FULL, 'VAMS_ONLY');
    assert.strictEqual(out.stocks_target, 0.6);
    assert.strictEqual(out.gold_target, 0.3);
    assert.strictEqual(out.btc_target, 0.1);
  });

  it('maps GhostRegime actuals to generic asset ids', () => {
    const out = computeCandidateAllocations('P0_CURRENT', 'GOLDILOCKS', VAMS_FULL, 'COMBINED');
    const weights = ghostRegimeActualsToWeights(out);
    assert.strictEqual(weights.SPY, out.stocks_actual);
    assert.strictEqual(weights.GLD, out.gold_actual);
    assert.strictEqual(weights['BTC-USD'], out.btc_actual);
    assert.strictEqual(weights.BIL, out.cash);
    assert.ok(!('stocks' in weights));
  });
});
