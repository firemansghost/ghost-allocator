/**
 * R1 STABLE INVARIANTS
 *
 * These contracts should remain true after later remediation phases.
 * They characterize currently authorized policy; they do not reopen 60/30/10.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { classifyRegime, mapToRiskRegime } from '../regimeCore';
import { computeAllocations } from '../allocations';
import { vamsStateToScale } from '../vams';
import { ALLOCATION_TOLERANCE } from '../config';
import type { RegimeType, VamsState } from '../types';

const TOL = ALLOCATION_TOLERANCE;
const REGIMES: RegimeType[] = ['GOLDILOCKS', 'REFLATION', 'INFLATION', 'DEFLATION'];
const VAMS_STATES: VamsState[] = [-2, 0, 2];

describe('Regime classification contract (current zero behavior)', () => {
  it('RiskOn + non-positive inflation → GOLDILOCKS', () => {
    assert.strictEqual(classifyRegime(1, 0), 'GOLDILOCKS');
    assert.strictEqual(classifyRegime(1, -1), 'GOLDILOCKS');
  });

  it('RiskOn + positive inflation → REFLATION', () => {
    assert.strictEqual(classifyRegime(1, 1), 'REFLATION');
  });

  it('RiskOff + positive inflation → INFLATION', () => {
    assert.strictEqual(classifyRegime(0, 1), 'INFLATION');
    assert.strictEqual(classifyRegime(-1, 1), 'INFLATION');
  });

  it('RiskOff + non-positive inflation → DEFLATION', () => {
    assert.strictEqual(classifyRegime(0, 0), 'DEFLATION');
    assert.strictEqual(classifyRegime(-1, 0), 'DEFLATION');
    assert.strictEqual(classifyRegime(-1, -1), 'DEFLATION');
  });

  it('mapToRiskRegime follows GOLDILOCKS/REFLATION vs INFLATION/DEFLATION', () => {
    assert.strictEqual(mapToRiskRegime('GOLDILOCKS'), 'RISK ON');
    assert.strictEqual(mapToRiskRegime('REFLATION'), 'RISK ON');
    assert.strictEqual(mapToRiskRegime('INFLATION'), 'RISK OFF');
    assert.strictEqual(mapToRiskRegime('DEFLATION'), 'RISK OFF');
  });
});

describe('Current allocation policy (authorized; 60/30/10 not reopened)', () => {
  it('GOLDILOCKS and REFLATION full-risk targets are 60/30/10', () => {
    for (const regime of ['GOLDILOCKS', 'REFLATION'] as const) {
      const out = computeAllocations(regime, { stocks: 2, gold: 2, btc: 2 });
      assert.strictEqual(out.stocks_target, 0.6, `${regime} stocks`);
      assert.strictEqual(out.gold_target, 0.3, `${regime} gold`);
      assert.strictEqual(out.btc_target, 0.1, `${regime} btc`);
      assert.ok(Math.abs(out.cash) < TOL, `${regime} cash`);
    }
  });

  it('INFLATION full-risk targets are 30/15/5 + 50 base cash', () => {
    const out = computeAllocations('INFLATION', { stocks: 2, gold: 2, btc: 2 });
    assert.strictEqual(out.stocks_target, 0.3);
    assert.strictEqual(out.gold_target, 0.15);
    assert.strictEqual(out.btc_target, 0.05);
    assert.ok(Math.abs(out.cash - 0.5) < TOL, `cash ${out.cash}`);
  });

  it('DEFLATION full-risk targets are 30/30/5 + 35 base cash', () => {
    const out = computeAllocations('DEFLATION', { stocks: 2, gold: 2, btc: 2 });
    assert.strictEqual(out.stocks_target, 0.3);
    assert.strictEqual(out.gold_target, 0.3);
    assert.strictEqual(out.btc_target, 0.05);
    assert.ok(Math.abs(out.cash - 0.35) < TOL, `cash ${out.cash}`);
  });
});

describe('Allocation arithmetic', () => {
  it('valid VAMS scales remain 0 / 0.5 / 1', () => {
    assert.strictEqual(vamsStateToScale(-2), 0);
    assert.strictEqual(vamsStateToScale(0), 0.5);
    assert.strictEqual(vamsStateToScale(2), 1);
  });

  it('stocks + gold + btc + cash = 1 across regimes and VAMS scales', () => {
    for (const regime of REGIMES) {
      for (const stocks of VAMS_STATES) {
        for (const gold of VAMS_STATES) {
          for (const btc of VAMS_STATES) {
            const out = computeAllocations(regime, { stocks, gold, btc });
            const sum = out.stocks_actual + out.gold_actual + out.btc_actual + out.cash;
            assert.ok(
              Math.abs(sum - 1) <= TOL,
              `${regime} ${stocks}/${gold}/${btc} sum=${sum}`
            );
            for (const scale of [out.stocks_scale, out.gold_scale, out.btc_scale]) {
              assert.ok(scale === 0 || scale === 0.5 || scale === 1, `scale ${scale}`);
            }
          }
        }
      }
    }
  });
});

describe('R0 live-like inflation fixture', () => {
  it('core 0 + satellite +1 ⇒ final inflation +1 classifies inflationary', () => {
    const core = 0;
    const satellite = 1;
    const finalInfl = core + satellite;
    assert.strictEqual(finalInfl, 1);
    assert.strictEqual(classifyRegime(-1, finalInfl), 'INFLATION');
    assert.strictEqual(classifyRegime(1, finalInfl), 'REFLATION');
  });

  it('C0→C1 relationship that leaves core at 0 still ends at +1 with satellite', () => {
    // Live 2026-08-28 C0 votes: TLT −1, UUP +1. Formula relates old C0 to authorized C1.
    // Production implements C1 signs directly; this is forensic math, not a production path.
    const tltVote = -1;
    const uupVote = 1;
    const c0Core = 0;
    const c1Core = c0Core - 2 * (tltVote + uupVote);
    assert.strictEqual(c1Core, 0);
    assert.strictEqual(c1Core + 1, 1);
    assert.strictEqual(classifyRegime(-1, c1Core + 1), 'INFLATION');
  });
});

describe('C0↔C1 relationship (R0 forensic math; production implements C1 signs directly)', () => {
  it('C1_core = C0_core − 2×(oldTltVote + oldUupVote)', () => {
    const cases = [
      { c0: 2, tlt: 1, uup: 1, expected: -2 },
      { c0: 0, tlt: -1, uup: 1, expected: 0 },
      { c0: -1, tlt: -1, uup: 0, expected: 1 },
      { c0: 1, tlt: 0, uup: 1, expected: -1 },
    ];
    for (const row of cases) {
      const c1 = row.c0 - 2 * (row.tlt + row.uup);
      assert.strictEqual(c1, row.expected, JSON.stringify(row));
    }
  });
});

describe('Seed is output history only', () => {
  it('seed CSV has no individual TR / TLT / UUP / PDBC columns', () => {
    const header = readFileSync(
      'data/ghostregime/seed/ghostregime_replay_history.csv',
      'utf8'
    )
      .split(/\r?\n/, 1)[0]
      .split(',');
    const forbidden = [
      'tlt',
      'uup',
      'pdbc',
      'tip',
      'tr_21',
      'tr_63',
      'debug_votes',
      'risk_axis',
      'infl_axis',
    ];
    for (const name of forbidden) {
      assert.ok(!header.includes(name), `seed must not contain ${name}`);
    }
    assert.ok(header.includes('infl_core_score'));
    assert.ok(header.includes('regime'));
  });
});
