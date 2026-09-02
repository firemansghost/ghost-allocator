/**
 * R6A — factual display truth contracts.
 * Display-only. Does not encode R6B evidence/resolution or R6C copy.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { SignalReceipt } from '../types';
import {
  formatAllocPct,
  formatBrakeStateLabel,
  formatThrottleCashPart,
  formatDriverLine,
  displayReceiptDirection,
  deriveVotedLabel,
  computePrimaryDriver,
  computeAxisAgreement,
  computeAxisStats,
  DEFAULT_ALLOCATION_VIEW,
  pctOfMax,
  getMaxTargets,
  buildTodaySnapshotBlocks,
  buildTodaySnapshotLine,
  buildMicroFlowLine,
  PRIMARY_DRIVER_CLEAN_AGREEMENT_PCT,
  PRIMARY_DRIVER_MIXED_AGREEMENT_PCT,
} from '../ui';
import { computeOptionBVotes } from '../regimeCore';
import { MARKET_SYMBOLS } from '../config';
import type { GhostRegimeRow, MarketDataPoint } from '../types';

function displayedMixSum(stocks: number, gold: number, btc: number, cash: number): number {
  return [stocks, gold, btc, cash]
    .map((v) => Number(formatAllocPct(v)))
    .reduce((a, b) => a + b, 0);
}

function makeRow(partial: Partial<GhostRegimeRow>): GhostRegimeRow {
  return {
    date: '2026-09-01',
    run_date_utc: '2026-09-02T16:03:18Z',
    regime: 'REFLATION',
    risk_regime: 'RISK ON',
    risk_score: 1,
    infl_score: 1,
    infl_core_score: 0,
    infl_sat_score: 0,
    risk_axis: 'RiskOn',
    infl_axis: 'Inflation',
    risk_tiebreaker_used: true,
    infl_tiebreaker_used: true,
    stocks_vams_state: 2,
    gold_vams_state: 0,
    btc_vams_state: 0,
    stocks_target: 0.6,
    gold_target: 0.3,
    btc_target: 0.1,
    stocks_scale: 1,
    gold_scale: 0.5,
    btc_scale: 0.5,
    stocks_actual: 0.6,
    gold_actual: 0.15,
    btc_actual: 0.05,
    cash: 0.2,
    flip_watch_status: 'NONE',
    source: 'computed',
    risk_receipts: [],
    inflation_receipts: [],
    ...partial,
  };
}

function createMockData(symbol: string, closes: number[]): MarketDataPoint[] {
  const baseDate = new Date('2025-01-01');
  return closes.map((close, i) => ({
    symbol,
    date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
    close,
    returns: i > 0 ? (close - closes[i - 1]) / closes[i - 1] : 0,
  }));
}

function mixedBranchPrimary(riskAgreementPct: number, inflAgreementPct: number) {
  return computePrimaryDriver(
    1,
    1,
    40,
    45,
    'Medium',
    'Medium',
    riskAgreementPct,
    inflAgreementPct
  );
}

describe('R6A brake-state labels', () => {
  const sleeves: Array<'Stocks' | 'Gold' | 'BTC'> = ['Stocks', 'Gold', 'BTC'];

  it('maps scale 1 / 0.5 / 0 to full / half / off', () => {
    assert.strictEqual(formatBrakeStateLabel(1), 'full');
    assert.strictEqual(formatBrakeStateLabel(0.5), 'half');
    assert.strictEqual(formatBrakeStateLabel(0), 'off');
  });

  it('never labels half-size as off, for every sleeve', () => {
    for (const sleeve of sleeves) {
      const part = formatThrottleCashPart(sleeve, 0.5, 0.05);
      assert.ok(part, `${sleeve} half should show a cash part`);
      assert.match(part!, new RegExp(`${sleeve} half`));
      assert.doesNotMatch(part!, /off/i);
    }
  });

  it('labels scale 0 as off when that sleeve contributed cash', () => {
    for (const sleeve of sleeves) {
      const part = formatThrottleCashPart(sleeve, 0, 0.3);
      assert.strictEqual(part, `${sleeve} off → +30% cash`);
    }
  });

  it('does not imply throttle cash at scale 1.0 even if cashFromSleeve is positive', () => {
    for (const sleeve of sleeves) {
      assert.strictEqual(formatThrottleCashPart(sleeve, 1, 0.05), null);
    }
  });

  it('omits a sleeve that contributed no cash', () => {
    assert.strictEqual(formatThrottleCashPart('BTC', 0.5, 0), null);
    assert.strictEqual(formatThrottleCashPart('Gold', 0, 0), null);
  });

  it('live-like v1.0.4 row: BTC half → +5% cash, Gold half → +15% cash', () => {
    const btc = formatThrottleCashPart('BTC', 0.5, 0.05);
    const gold = formatThrottleCashPart('Gold', 0.5, 0.15);
    const stocks = formatThrottleCashPart('Stocks', 1, 0);
    assert.strictEqual(btc, 'BTC half → +5% cash');
    assert.strictEqual(gold, 'Gold half → +15% cash');
    assert.strictEqual(stocks, null);
  });
});

describe('R6A allocation rounding', () => {
  it('prints integers without .0 and half-points with one decimal', () => {
    assert.strictEqual(formatAllocPct(0.6), '60');
    assert.strictEqual(formatAllocPct(0.3), '30');
    assert.strictEqual(formatAllocPct(0.15), '15');
    assert.strictEqual(formatAllocPct(0.075), '7.5');
    assert.strictEqual(formatAllocPct(0.025), '2.5');
    assert.strictEqual(formatAllocPct(0.2), '20');
  });

  it('classic 30 / 7.5 / 2.5 + 60 displays 100, not 101', () => {
    assert.strictEqual(displayedMixSum(0.3, 0.075, 0.025, 0.6), 100);
    const oldIntegerSum =
      Number((0.3 * 100).toFixed(0)) +
      Number((0.075 * 100).toFixed(0)) +
      Number((0.025 * 100).toFixed(0)) +
      Number((0.6 * 100).toFixed(0));
    assert.strictEqual(oldIntegerSum, 101);
  });

  it('live REFLATION mix and snapshot helpers stay coherent', () => {
    const row = makeRow({});
    assert.strictEqual(displayedMixSum(0.6, 0.15, 0.05, 0.2), 100);
    const blocks = buildTodaySnapshotBlocks(row);
    assert.ok(blocks);
    assert.strictEqual(blocks!.actual, '60/15/5 + 20 cash');
    const line = buildTodaySnapshotLine(row);
    assert.ok(line?.includes('Actual 60/15/5 + 20 cash'));
    const micro = buildMicroFlowLine(row);
    assert.ok(micro?.includes('60/15/5 + 20 cash'));
    assert.doesNotMatch(blocks!.actual, /101/);
  });
});

describe('R6A primary-driver agreement units', () => {
  it('keeps clean/mixed thresholds on the 0–100 agreement scale', () => {
    assert.strictEqual(PRIMARY_DRIVER_CLEAN_AGREEMENT_PCT, 75);
    assert.strictEqual(PRIMARY_DRIVER_MIXED_AGREEMENT_PCT, 50);
    const agreement = computeAxisAgreement(
      [
        { key: 'a', label: 'A', vote: 1, direction: 'Risk On' },
        { key: 'b', label: 'B', vote: 1, direction: 'Risk On' },
        { key: 'c', label: 'C', vote: 1, direction: 'Risk On' },
        { key: 'd', label: 'D', vote: -1, direction: 'Risk Off' },
      ],
      'Risk On'
    );
    assert.strictEqual(agreement.pct, 75);
  });

  it('mixed branch: 80% is clean, 60% is not, 50% and 40% are mixed', () => {
    assert.strictEqual(mixedBranchPrimary(80, 80).whyReason, 'Tie: both axes strong');
    assert.strictEqual(mixedBranchPrimary(60, 60).whyReason, 'Tie: mixed signals');
    assert.strictEqual(mixedBranchPrimary(50, 50).whyReason, 'Tie: mixed signals');
    assert.strictEqual(mixedBranchPrimary(40, 40).whyReason, 'Tie: mixed signals');
    assert.strictEqual(mixedBranchPrimary(80, 40).whyReason, 'Tie: mixed signals');
  });

  it('does not treat 0–1-style 0.75 as the clean cutoff', () => {
    const atFraction = mixedBranchPrimary(0.75, 0.75);
    const atPercent = mixedBranchPrimary(75, 75);
    assert.strictEqual(atFraction.whyReason, 'Tie: mixed signals');
    assert.strictEqual(atPercent.whyReason, 'Tie: both axes strong');
  });
});

describe('R6A neutral user display', () => {
  it('vote=0 displays Neutral even when persisted direction is a side', () => {
    const receipt: SignalReceipt = {
      key: 'spy',
      label: 'SPY trend',
      vote: 0,
      direction: 'Risk Off',
    };
    assert.strictEqual(displayReceiptDirection(receipt), 'Neutral');
    assert.strictEqual(deriveVotedLabel(receipt.vote, 'risk'), 'Neutral');
    assert.match(formatDriverLine(receipt), /Neutral/);
    assert.doesNotMatch(formatDriverLine(receipt), /Risk Off/);
  });

  it('does not rewrite persisted generation: vote=0 still stores a side', () => {
    const symbols = [
      MARKET_SYMBOLS.SPY,
      MARKET_SYMBOLS.HYG,
      MARKET_SYMBOLS.IEF,
      MARKET_SYMBOLS.EEM,
      MARKET_SYMBOLS.PDBC,
      MARKET_SYMBOLS.TIP,
      MARKET_SYMBOLS.TLT,
      MARKET_SYMBOLS.UUP,
      MARKET_SYMBOLS.VIX,
    ];
    const market: MarketDataPoint[] = [];
    for (const symbol of symbols) {
      market.push(...createMockData(symbol, Array(80).fill(symbol === MARKET_SYMBOLS.VIX ? 20 : 100)));
    }
    const result = computeOptionBVotes(market, undefined, true);
    const pdbc = result.inflation_receipts.find((r) => r.key === 'pdbc');
    assert.ok(pdbc);
    assert.strictEqual(pdbc!.vote, 0);
    assert.notStrictEqual(pdbc!.direction, 'Neutral');
    assert.strictEqual(displayReceiptDirection(pdbc!), 'Neutral');
  });
});

describe('R6A allocation card default is Exposure', () => {
  it('default view is exposure, not vs-full-risk', () => {
    assert.strictEqual(DEFAULT_ALLOCATION_VIEW, 'exposure');
  });

  it('Risk Off stocks 30% scale 1.0 is 30% exposure / full brake, not 50% utilization', () => {
    const actual = 0.3;
    const scale = 1.0;
    const max = getMaxTargets();
    assert.strictEqual(formatAllocPct(actual), '30');
    assert.strictEqual(formatBrakeStateLabel(scale), 'full');
    assert.ok(Math.abs(pctOfMax(actual, max.stocks) - 50) < 0.1);
    assert.notStrictEqual(DEFAULT_ALLOCATION_VIEW, 'pctOfMax');
  });

  it('INFLATION gold 15% and Risk Off BTC 5% at scale 1.0 stay full in default terms', () => {
    const max = getMaxTargets();
    assert.strictEqual(formatAllocPct(0.15), '15');
    assert.strictEqual(formatBrakeStateLabel(1), 'full');
    assert.ok(Math.abs(pctOfMax(0.15, max.gold) - 50) < 0.1);
    assert.strictEqual(formatAllocPct(0.05), '5');
    assert.ok(Math.abs(pctOfMax(0.05, max.btc) - 50) < 0.1);
  });
});

describe('R6A no-tie receipt formula is unchanged under R6B Participation rename', () => {
  it('Participation remains non-neutral / present evidence receipts', () => {
    const receipts: SignalReceipt[] = [
      { key: 'a', label: 'A', vote: 0, direction: 'Disinflation' },
      { key: 'b', label: 'B', vote: 1, direction: 'Inflation' },
      { key: 'c', label: 'C', vote: -1, direction: 'Disinflation' },
    ];
    const stats = computeAxisStats(receipts, 'Inflation');
    assert.strictEqual(stats.totalSignals, 3);
    assert.strictEqual(stats.nonNeutral, 2);
    assert.ok(stats.participationLabel.includes('2/3'));
    assert.ok(stats.coverageLabel.includes('2/3'));
  });
});
