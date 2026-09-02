/**
 * R6B — evidence / procedural-resolution separation.
 * Display-time only. Does not encode R6C advice-copy cleanup.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { GhostRegimeRow, SignalReceipt } from '../types';
import {
  isResolutionReceipt,
  getEvidenceReceipts,
  getResolutionReceipt,
  formatResolvedByLine,
  pickTopDrivers,
  computeAxisAgreement,
  computeAxisStats,
  computeAxisNetVote,
  computeConviction,
  computeRegimeConfidenceLabel,
  computeRegimeConvictionIndex,
  computePrimaryDriver,
  computeCrowdingTag,
  isAxisCrowded,
  computeCompareBiggestChange,
} from '../ui';
import {
  PARTICIPATION_TOOLTIP,
  COVERAGE_TOOLTIP,
  CONFIDENCE_TOOLTIP,
  CONVICTION_TOOLTIP,
  TOP_DRIVERS_FOOTNOTE,
  LEGEND_PARTICIPATION,
  LEGEND_COVERAGE,
  EVIDENCE_NET_LABEL_PREFIX,
} from '../ghostregimePageCopy';

function receipt(
  key: string,
  vote: number,
  direction: SignalReceipt['direction'],
  label?: string,
  note?: string
): SignalReceipt {
  return { key, label: label ?? key, vote, direction, note };
}

const LIVE_RISK: SignalReceipt[] = [
  receipt('spy', 0, 'Risk Off', 'SPY trend'),
  receipt('hyg_ief', 1, 'Risk On', 'Credit vs Treasuries'),
  receipt('vix', 0, 'Risk Off', 'VIX'),
  receipt('eem_spy', -1, 'Risk Off', 'EM vs US'),
  receipt('risk_tiebreak', 1, 'Risk On', 'Risk tie-breaker (SPY TR_21)', 'Tie-breaker applied'),
];

const LIVE_INFL: SignalReceipt[] = [
  receipt('pdbc', 1, 'Inflation', 'Commodities'),
  receipt('tip_ief', -1, 'Disinflation', 'TIPS vs Treasuries'),
  receipt('tlt', 1, 'Inflation', 'Long bonds'),
  receipt('uup', -1, 'Disinflation', 'Dollar'),
  receipt(
    'infl_tiebreak',
    1,
    'Inflation',
    'Inflation tie-breaker (PDBC TR21)',
    'Tie-breaker applied; source: PDBC TR21; rule: GTE_ZERO'
  ),
];

const NO_TIE_RISK: SignalReceipt[] = [
  receipt('spy', 1, 'Risk On'),
  receipt('hyg_ief', 1, 'Risk On'),
  receipt('vix', 0, 'Risk Off'),
  receipt('eem_spy', -1, 'Risk Off'),
];

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
    risk_receipts: LIVE_RISK,
    inflation_receipts: LIVE_INFL,
    ...partial,
  };
}

describe('R6B resolution-receipt filtering', () => {
  it('identifies tie-breaks by stable key, not label text', () => {
    assert.strictEqual(isResolutionReceipt({ key: 'risk_tiebreak' }), true);
    assert.strictEqual(isResolutionReceipt({ key: 'infl_tiebreak' }), true);
    assert.strictEqual(
      isResolutionReceipt({ key: 'pdbc' }),
      false,
      'ordinary score receipt stays evidence even if someone reused tie-break wording'
    );
    const fakeLabel = receipt(
      'pdbc',
      1,
      'Inflation',
      'Inflation tie-breaker (PDBC TR21)'
    );
    assert.strictEqual(isResolutionReceipt(fakeLabel), false);
  });

  it('getEvidenceReceipts drops both axis resolvers and keeps score-fed receipts', () => {
    const mixed = [...LIVE_RISK, receipt('future_sat', 1, 'Risk On')];
    const evidence = getEvidenceReceipts(mixed);
    assert.deepStrictEqual(
      evidence.map((r) => r.key),
      ['spy', 'hyg_ief', 'vix', 'eem_spy', 'future_sat']
    );
    assert.strictEqual(getResolutionReceipt(LIVE_RISK)?.key, 'risk_tiebreak');
    assert.strictEqual(getResolutionReceipt(NO_TIE_RISK), undefined);
  });
});

describe('R6B live 2026-09-01 fixture', () => {
  it('Risk evidence metrics match the approved contract', () => {
    const stats = computeAxisStats(LIVE_RISK, 'Risk On');
    const agree = computeAxisAgreement(LIVE_RISK, 'Risk On');
    const net = computeAxisNetVote(LIVE_RISK, 'risk');
    const conv = computeConviction(net.net, stats.totalSignals);

    assert.strictEqual(stats.totalSignals, 4);
    assert.strictEqual(stats.nonNeutral, 2);
    assert.strictEqual(agree.agree, 1);
    assert.strictEqual(agree.total, 2);
    assert.strictEqual(agree.pct, 50);
    assert.strictEqual(stats.participationPct, 50);
    assert.ok(stats.participationLabel.includes('2/4'));
    assert.ok(stats.participationLabel.startsWith('Participation:'));
    assert.doesNotMatch(stats.participationLabel, /Coverage/);
    assert.strictEqual(net.net, 0);
    assert.strictEqual(conv.index, 0);
    assert.ok(stats.confidence.score !== null);
    assert.ok(Math.abs((stats.confidence.score ?? 0) - 0.5) < 1e-9);
    assert.strictEqual(stats.confidence.label, 'Low');
    assert.strictEqual(formatResolvedByLine(LIVE_RISK), 'Resolved by SPY TR21 tie-break');
  });

  it('Inflation evidence metrics match the approved contract', () => {
    const stats = computeAxisStats(LIVE_INFL, 'Inflation');
    const agree = computeAxisAgreement(LIVE_INFL, 'Inflation');
    const net = computeAxisNetVote(LIVE_INFL, 'inflation');
    const conv = computeConviction(net.net, stats.totalSignals);

    assert.strictEqual(stats.totalSignals, 4);
    assert.strictEqual(stats.nonNeutral, 4);
    assert.strictEqual(agree.agree, 2);
    assert.strictEqual(agree.total, 4);
    assert.strictEqual(agree.pct, 50);
    assert.strictEqual(stats.participationPct, 100);
    assert.ok(stats.participationLabel.includes('4/4'));
    assert.strictEqual(net.net, 0);
    assert.strictEqual(conv.index, 0);
    assert.ok(stats.confidence.score !== null);
    assert.ok(Math.abs((stats.confidence.score ?? 0) - 0.65) < 1e-9);
    assert.strictEqual(stats.confidence.label, 'Medium');
    assert.strictEqual(formatResolvedByLine(LIVE_INFL), 'Resolved by PDBC TR21 tie-break');
  });

  it('both-axis tie-break fixture: overall Low / 0 / Tie weak / not crowded', () => {
    const riskStats = computeAxisStats(LIVE_RISK, 'Risk On');
    const inflStats = computeAxisStats(LIVE_INFL, 'Inflation');
    const riskNet = computeAxisNetVote(LIVE_RISK, 'risk');
    const inflNet = computeAxisNetVote(LIVE_INFL, 'inflation');
    const riskConv = computeConviction(riskNet.net, riskStats.totalSignals);
    const inflConv = computeConviction(inflNet.net, inflStats.totalSignals);
    const riskAgree = computeAxisAgreement(LIVE_RISK, 'Risk On');
    const inflAgree = computeAxisAgreement(LIVE_INFL, 'Inflation');
    const primary = computePrimaryDriver(
      1,
      1,
      riskConv.index,
      inflConv.index,
      riskStats.confidence.label,
      inflStats.confidence.label,
      riskAgree.pct,
      inflAgree.pct
    );

    assert.strictEqual(computeRegimeConfidenceLabel(riskStats.confidence.label, inflStats.confidence.label), 'Low');
    assert.strictEqual(computeRegimeConvictionIndex(riskConv.index, inflConv.index), 0);
    assert.strictEqual(primary.label, 'Tie');
    assert.strictEqual(primary.whyReason, 'Tie: both axes weak');
    assert.strictEqual(isAxisCrowded(riskStats, riskConv.index), false);
    assert.strictEqual(isAxisCrowded(inflStats, inflConv.index), false);
  });

  it('does not replace final model scores with evidence net', () => {
    const row = makeRow({});
    assert.strictEqual(row.risk_score, 1);
    assert.strictEqual(row.infl_score, 1);
    assert.strictEqual(computeAxisNetVote(row.risk_receipts, 'risk').net, 0);
    assert.strictEqual(computeAxisNetVote(row.inflation_receipts, 'inflation').net, 0);
  });
});

describe('R6B one-axis / no-tie / missing / all-neutral', () => {
  it('one-axis tie-break only changes that axis', () => {
    const inflNoTie = LIVE_INFL.filter((r) => r.key !== 'infl_tiebreak');
    const inflStats = computeAxisStats(inflNoTie, 'Inflation');
    const riskStats = computeAxisStats(LIVE_RISK, 'Risk On');
    assert.strictEqual(inflStats.totalSignals, 4);
    assert.strictEqual(inflStats.participationPct, 100);
    assert.strictEqual(formatResolvedByLine(inflNoTie), null);
    assert.strictEqual(formatResolvedByLine(LIVE_RISK), 'Resolved by SPY TR21 tie-break');
    assert.strictEqual(riskStats.totalSignals, 4);
  });

  it('no-tie-break parity matches the unfiltered formula', () => {
    const withFilter = computeAxisStats(NO_TIE_RISK, 'Risk On');
    const agree = computeAxisAgreement(NO_TIE_RISK, 'Risk On');
    const net = computeAxisNetVote(NO_TIE_RISK, 'risk');
    const conv = computeConviction(net.net, withFilter.totalSignals);
    assert.strictEqual(withFilter.totalSignals, 4);
    assert.strictEqual(withFilter.nonNeutral, 3);
    assert.strictEqual(agree.agree, 2);
    assert.strictEqual(agree.total, 3);
    assert.ok(Math.abs((agree.pct ?? 0) - (2 / 3) * 100) < 1e-9);
    assert.strictEqual(net.net, 1);
    assert.strictEqual(conv.index, 25);
    assert.strictEqual(formatResolvedByLine(NO_TIE_RISK), null);
    assert.deepStrictEqual(
      pickTopDrivers(NO_TIE_RISK, 2).map((r) => r.key),
      ['eem_spy', 'hyg_ief']
    );
  });

  it('all-neutral evidence yields n/a agreement, 0 participation, n/a confidence', () => {
    const allNeutral = [
      receipt('a', 0, 'Risk On'),
      receipt('b', 0, 'Risk Off'),
      receipt('risk_tiebreak', 1, 'Risk On', 'Risk tie-breaker (SPY TR_21)'),
    ];
    const stats = computeAxisStats(allNeutral, 'Risk On');
    const agree = computeAxisAgreement(allNeutral, 'Risk On');
    assert.strictEqual(stats.totalSignals, 2);
    assert.strictEqual(stats.nonNeutral, 0);
    assert.strictEqual(stats.participationPct, 0);
    assert.strictEqual(agree.total, 0);
    assert.strictEqual(agree.pct, null);
    assert.strictEqual(stats.confidence.label, 'n/a');
    assert.strictEqual(computeAxisNetVote(allNeutral, 'risk').net, 0);
  });

  it('missing receipts stay graceful and do not fabricate resolution', () => {
    const stats = computeAxisStats(undefined, 'Risk On');
    assert.strictEqual(stats.totalSignals, 0);
    assert.strictEqual(stats.participationLabel, 'Participation: n/a');
    assert.strictEqual(computeAxisAgreement([], 'Risk On').pct, null);
    assert.strictEqual(formatResolvedByLine(undefined), null);
    assert.strictEqual(formatResolvedByLine([]), null);
    assert.deepStrictEqual(pickTopDrivers(undefined, 2), []);
  });
});

describe('R6B participation / confidence / conviction / crowded / drivers', () => {
  it('public Participation wording replaces Coverage', () => {
    assert.match(PARTICIPATION_TOOLTIP, /Participation|evidence/i);
    assert.doesNotMatch(PARTICIPATION_TOOLTIP, /signals expected/i);
    assert.strictEqual(COVERAGE_TOOLTIP, PARTICIPATION_TOOLTIP);
    assert.strictEqual(LEGEND_COVERAGE, LEGEND_PARTICIPATION);
    assert.match(CONFIDENCE_TOOLTIP, /participation/i);
    assert.doesNotMatch(CONFIDENCE_TOOLTIP, /coverage/i);
    assert.match(CONVICTION_TOOLTIP, /evidence net/i);
    assert.match(TOP_DRIVERS_FOOTNOTE, /evidence votes/i);
    assert.match(EVIDENCE_NET_LABEL_PREFIX, /Evidence net/);
  });

  it('Top Drivers exclude tie-breaks', () => {
    assert.deepStrictEqual(
      pickTopDrivers(LIVE_INFL, 2).map((r) => r.key),
      ['pdbc', 'tip_ief']
    );
    assert.ok(!pickTopDrivers(LIVE_INFL, 4).some((r) => r.key === 'infl_tiebreak'));
    assert.ok(!pickTopDrivers(LIVE_RISK, 4).some((r) => r.key === 'risk_tiebreak'));
  });

  it('Resolved by… is derived from the receipt and absent without one', () => {
    assert.strictEqual(
      formatResolvedByLine([
        receipt('infl_tiebreak', -1, 'Disinflation', 'Inflation tie-breaker (DBC TR21)'),
      ]),
      'Resolved by DBC TR21 tie-break'
    );
    assert.strictEqual(formatResolvedByLine(NO_TIE_RISK), null);
  });

  it('Crowded uses the shared helper and evidence-only inputs', () => {
    const crowdedStats = {
      confidence: { label: 'High' as const },
      agreementPct: 80,
      totalSignals: 4,
      nonNeutral: 3,
    };
    assert.strictEqual(isAxisCrowded(crowdedStats, 80), true);
    assert.strictEqual(isAxisCrowded(crowdedStats, 75), false);
    assert.strictEqual(
      computeCrowdingTag({
        convictionIndex: 80,
        confidenceLabel: 'High',
        agreementPct: 80,
        participationPct: 0.75,
      }),
      true
    );
    assert.strictEqual(isAxisCrowded(computeAxisStats(LIVE_RISK, 'Risk On'), 0), false);
  });
});

describe('R6B Compare consistent evidence derivation', () => {
  it('current and previous snapshots both use evidence-only metrics', () => {
    const current = makeRow({ date: '2026-09-01' });
    const prev = makeRow({
      date: '2026-08-28',
      risk_receipts: NO_TIE_RISK,
      inflation_receipts: LIVE_INFL.filter((r) => r.key !== 'infl_tiebreak'),
      risk_tiebreaker_used: false,
      infl_tiebreaker_used: false,
    });
    const change = computeCompareBiggestChange(current, prev);
    const currNet = computeAxisNetVote(current.risk_receipts, 'risk').net;
    const prevNet = computeAxisNetVote(prev.risk_receipts, 'risk').net;
    assert.strictEqual(currNet, 0);
    assert.strictEqual(prevNet, 1);
    assert.ok(change === null || change.kind !== 'regime');
  });
});
