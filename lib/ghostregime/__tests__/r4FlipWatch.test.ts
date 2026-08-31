/**
 * R4 — Flip Watch transition telemetry (stable contract)
 *
 * Flip Watch flags regime transitions. It does not delay, gate, hold, or
 * alter regime classification, allocations, VAMS, or persistence.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { MarketDataPoint, RegimeType } from '../types';
import {
  detectFlipWatch,
  isLegacyFlipWatchStatus,
  priorUniqueTradingRegime,
} from '../flipWatch';
import { applyStressOverride } from '../regimeCore';
import { MARKET_SYMBOLS, STRESS_OVERRIDE } from '../config';
import { computeGhostRegime } from '../engine';
import { computeAllocations } from '../allocations';
import {
  flipWatchPillTooltip,
  formatRegimeTransitionDisplay,
  getFlipWatchCopy,
} from '../ui';
import {
  FLIPWATCH_LEGACY_LINES,
  FLIPWATCH_LEGACY_PILL_TOOLTIP,
  FLIPWATCH_PILL_TOOLTIP,
} from '../ghostregimePageCopy';

function historyRow(
  date: string,
  regime: RegimeType,
  extra: Partial<{ stale: boolean }> = {}
): { date: string; regime: RegimeType; stale?: boolean } {
  return { date, regime, ...extra };
}

describe('R4 — detectFlipWatch status contract', () => {
  it('has no calendar-day / wall-clock parameter', () => {
    assert.strictEqual(detectFlipWatch.length, 4);
  });

  it('no previous regime → NONE', () => {
    assert.strictEqual(detectFlipWatch('INFLATION', null, 1, 1), 'NONE');
    assert.strictEqual(detectFlipWatch('INFLATION', null, 3, 3), 'NONE');
  });

  it('unchanged regime → NONE', () => {
    assert.strictEqual(detectFlipWatch('INFLATION', 'INFLATION', 1, 1), 'NONE');
  });

  it('ordinary regime change → REGIME_CHANGE', () => {
    assert.strictEqual(detectFlipWatch('INFLATION', 'REFLATION', 1, 1), 'REGIME_CHANGE');
    assert.strictEqual(detectFlipWatch('GOLDILOCKS', 'DEFLATION', 0, -1), 'REGIME_CHANGE');
  });

  it('max(|risk|, |infl|) >= 2 + regime change → STRONG_FLIP', () => {
    assert.strictEqual(detectFlipWatch('INFLATION', 'GOLDILOCKS', 2, 0), 'STRONG_FLIP');
    assert.strictEqual(detectFlipWatch('DEFLATION', 'GOLDILOCKS', 0, -2), 'STRONG_FLIP');
    assert.strictEqual(detectFlipWatch('REFLATION', 'INFLATION', -3, 1), 'STRONG_FLIP');
  });

  it('strong scores without a regime change → NONE', () => {
    assert.strictEqual(detectFlipWatch('INFLATION', 'INFLATION', 2, 2), 'NONE');
    assert.strictEqual(detectFlipWatch('GOLDILOCKS', null, 4, 4), 'NONE');
  });

  it('new compute never emits legacy BREWING or PENDING_CONFIRMATION', () => {
    const statuses = [
      detectFlipWatch('INFLATION', null, 1, 1),
      detectFlipWatch('INFLATION', 'INFLATION', 1, 1),
      detectFlipWatch('INFLATION', 'REFLATION', 1, 1),
      detectFlipWatch('INFLATION', 'REFLATION', 2, 0),
    ];
    for (const status of statuses) {
      assert.ok(status !== 'BREWING' && status !== 'PENDING_CONFIRMATION');
    }
  });
});

describe('R4 — prior unique persisted trading date', () => {
  it('empty history → null', () => {
    assert.strictEqual(priorUniqueTradingRegime([], '2026-08-28'), null);
  });

  it('current same-date row is ignored', () => {
    assert.strictEqual(
      priorUniqueTradingRegime(
        [historyRow('2026-08-28', 'INFLATION'), historyRow('2026-08-27', 'GOLDILOCKS')],
        '2026-08-28'
      ),
      'GOLDILOCKS'
    );
  });

  it('latest earlier unique date is selected', () => {
    assert.strictEqual(
      priorUniqueTradingRegime(
        [
          historyRow('2026-08-20', 'DEFLATION'),
          historyRow('2026-08-26', 'REFLATION'),
          historyRow('2026-08-22', 'GOLDILOCKS'),
        ],
        '2026-08-28'
      ),
      'REFLATION'
    );
  });

  it('duplicate older dates do not change selected prior trading date', () => {
    assert.strictEqual(
      priorUniqueTradingRegime(
        [
          historyRow('2026-08-26', 'GOLDILOCKS'),
          historyRow('2026-08-26', 'GOLDILOCKS'),
          historyRow('2026-08-27', 'INFLATION'),
          historyRow('2026-08-27', 'INFLATION'),
        ],
        '2026-08-28'
      ),
      'INFLATION'
    );
  });

  it('ordering is deterministic (last write wins per date; max earlier date wins)', () => {
    assert.strictEqual(
      priorUniqueTradingRegime(
        [
          historyRow('2026-08-27', 'GOLDILOCKS'),
          historyRow('2026-08-26', 'REFLATION'),
          historyRow('2026-08-27', 'INFLATION'),
        ],
        '2026-08-28'
      ),
      'INFLATION'
    );
  });

  it('first row in model namespace → null (NONE at detectFlipWatch)', () => {
    const prior = priorUniqueTradingRegime([], '2026-08-28');
    assert.strictEqual(prior, null);
    assert.strictEqual(detectFlipWatch('INFLATION', prior, 1, 1), 'NONE');
  });

  it('stale/fail-closed rows do not invent transition history', () => {
    assert.strictEqual(
      priorUniqueTradingRegime(
        [
          historyRow('2026-08-26', 'GOLDILOCKS'),
          historyRow('2026-08-27', 'INFLATION', { stale: true }),
        ],
        '2026-08-28'
      ),
      'GOLDILOCKS'
    );
    assert.strictEqual(
      priorUniqueTradingRegime([historyRow('2026-08-27', 'INFLATION', { stale: true })], '2026-08-28'),
      null
    );
  });
});

describe('R4 — engine Flip Watch cannot gate regime or allocations', () => {
  const asof = new Date('2026-03-02T00:00:00Z');
  const n = 280;

  function series(symbol: string, closes: number[]): MarketDataPoint[] {
    return closes.map((close, i) => {
      const date = new Date(asof);
      date.setUTCDate(date.getUTCDate() - (closes.length - 1 - i));
      return { symbol, date, close };
    });
  }

  function rising(start: number, step: number): number[] {
    return Array.from({ length: n }, (_, i) => start + i * step);
  }

  function flat(value = 100): number[] {
    return Array(n).fill(value);
  }

  const marketData: MarketDataPoint[] = [
    ...series(MARKET_SYMBOLS.SPY, rising(100, 0.4)),
    ...series(MARKET_SYMBOLS.GLD, rising(100, 0.05)),
    ...series(MARKET_SYMBOLS.HYG, rising(80, 0.05)),
    ...series(MARKET_SYMBOLS.IEF, flat(100)),
    ...series(MARKET_SYMBOLS.EEM, rising(50, 0.2)),
    ...series(MARKET_SYMBOLS.PDBC, rising(20, 0.08)),
    ...series(MARKET_SYMBOLS.TIP, flat(100)),
    ...series(MARKET_SYMBOLS.TLT, flat(90)),
    ...series(MARKET_SYMBOLS.UUP, flat(25)),
    ...series(MARKET_SYMBOLS.VIX, flat(18)),
    ...series(MARKET_SYMBOLS.BTC_USD, rising(20000, 20)),
  ];

  it('previous regime differs → telemetry active, new regime and allocations still apply', async () => {
    const baseline = await computeGhostRegime(asof, marketData, [], null);
    assert.strictEqual(baseline.flip_watch_status, 'NONE');

    const previous: RegimeType = baseline.regime === 'GOLDILOCKS' ? 'INFLATION' : 'GOLDILOCKS';
    const row = await computeGhostRegime(asof, marketData, [], previous);

    assert.strictEqual(row.regime, baseline.regime);
    assert.notStrictEqual(row.regime, previous);
    assert.ok(
      row.flip_watch_status === 'REGIME_CHANGE' || row.flip_watch_status === 'STRONG_FLIP',
      `expected transition telemetry, got ${row.flip_watch_status}`
    );

    const expected = computeAllocations(row.regime, {
      stocks: row.stocks_vams_state,
      gold: row.gold_vams_state,
      btc: row.btc_vams_state,
    });
    assert.strictEqual(row.stocks_target, expected.stocks_target);
    assert.strictEqual(row.gold_target, expected.gold_target);
    assert.strictEqual(row.btc_target, expected.btc_target);
    assert.strictEqual(row.stocks_actual, expected.stocks_actual);
    assert.strictEqual(row.gold_actual, expected.gold_actual);
    assert.strictEqual(row.btc_actual, expected.btc_actual);
    assert.strictEqual(row.cash, expected.cash);

    assert.strictEqual(row.stocks_target, baseline.stocks_target);
    assert.strictEqual(row.gold_target, baseline.gold_target);
    assert.strictEqual(row.btc_target, baseline.btc_target);
    assert.strictEqual(row.cash, baseline.cash);
  });
});

describe('R4 — legacy status read compatibility', () => {
  it('BREWING and PENDING_CONFIRMATION remain readable as legacy, not waiting', () => {
    for (const status of ['BREWING', 'PENDING_CONFIRMATION'] as const) {
      assert.strictEqual(isLegacyFlipWatchStatus(status), true);
      assert.strictEqual(formatRegimeTransitionDisplay(status), 'Legacy transition status');
      assert.ok(!/wait/i.test(formatRegimeTransitionDisplay(status) ?? ''));
      assert.strictEqual(flipWatchPillTooltip(status), FLIPWATCH_LEGACY_PILL_TOOLTIP);
      const copy = getFlipWatchCopy(status);
      assert.ok(copy);
      assert.ok(copy.title.includes('Legacy'));
      assert.deepStrictEqual(copy.lines, [...FLIPWATCH_LEGACY_LINES]);
      assert.ok(!copy.lines.some((line) => /wait|confirm|whipsaw|head fake/i.test(line)));
    }
  });

  it('current statuses use truthful non-waiting copy', () => {
    assert.strictEqual(formatRegimeTransitionDisplay('NONE'), null);
    assert.strictEqual(formatRegimeTransitionDisplay('REGIME_CHANGE'), 'Regime change');
    assert.strictEqual(formatRegimeTransitionDisplay('STRONG_FLIP'), 'Strong flip');
    assert.strictEqual(flipWatchPillTooltip('REGIME_CHANGE'), FLIPWATCH_PILL_TOOLTIP);
    assert.ok(!/wait|confirm/i.test(FLIPWATCH_PILL_TOOLTIP));
  });
});

describe('Stress override characterization (current helper; does not redesign risk_axis)', () => {
  it('VIX above threshold AND HYG/IEF at/below threshold forces RISK OFF from RISK ON', () => {
    assert.strictEqual(
      applyStressOverride(
        STRESS_OVERRIDE.VIX_THRESHOLD + 0.1,
        STRESS_OVERRIDE.HYG_IEF_RATIO_THRESHOLD,
        'RISK ON'
      ),
      'RISK OFF'
    );
  });

  it('does not trigger when only one condition is met', () => {
    assert.strictEqual(
      applyStressOverride(STRESS_OVERRIDE.VIX_THRESHOLD + 1, 0, 'RISK ON'),
      'RISK ON'
    );
    assert.strictEqual(
      applyStressOverride(
        STRESS_OVERRIDE.VIX_THRESHOLD,
        STRESS_OVERRIDE.HYG_IEF_RATIO_THRESHOLD,
        'RISK ON'
      ),
      'RISK ON'
    );
  });

  it('leaves RISK OFF unchanged when triggered', () => {
    assert.strictEqual(applyStressOverride(40, -0.05, 'RISK OFF'), 'RISK OFF');
  });
});
