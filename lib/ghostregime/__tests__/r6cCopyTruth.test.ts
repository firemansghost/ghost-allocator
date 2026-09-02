/**
 * R6C — educational / advice-like copy. Does not retune R6A/R6B metrics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GhostRegimeRow, SignalReceipt } from '../types';
import {
  buildShareSummary,
  buildMicroFlowLine,
  buildTodaySnapshotBlocks,
  computeAxisAgreement,
  computeAxisStats,
  computeAxisNetVote,
  computeConviction,
  computePrimaryDriver,
  formatResolvedByLine,
  pickTopDrivers,
} from '../ui';
import {
  POSTURE_MODEL_MIX_LABEL,
  POSTURE_HOLD_NOW_LABEL,
  MODEL_READ_PREFIX,
  ACTIONABLE_READ_PREFIX,
  HOW_TO_USE_THIS_TITLE,
  HOW_TO_USE_THIS_LINES,
  HOW_IT_WORKS_MODEL_MIX_DEFINITION,
  HOW_IT_WORKS_REALITY_CHECK,
} from '../ghostregimePageCopy';
import { GLOSSARY_TERMS } from '../../content/glossary';
import { GHOSTREGIME_SEO_DESCRIPTION, GHOSTREGIME_PRODUCT_TAGLINE } from '../productPositioning';

const ROOT = join(__dirname, '../../..');

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
  receipt('tip_ief', -1, 'Disinflation', 'TIP/IEF ratio'),
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

const PUBLIC_SURFACES = [
  'lib/ghostregime/ghostregimePageCopy.ts',
  'lib/ghostregime/ui.ts',
  'app/ghostregime/GhostRegimeClient.tsx',
  'app/ghostregime/how-it-works/page.tsx',
  'lib/content/glossary.ts',
  'components/ghostregime/ActionableReadPills.tsx',
  'components/learn/DrawdownRealityCheck.tsx',
];

function publicSource(): string {
  return PUBLIC_SURFACES.map((rel) => readFileSync(join(ROOT, rel), 'utf8')).join('\n');
}

describe('R6C public vocabulary', () => {
  it('uses Model mix / Model read / How to use this', () => {
    assert.strictEqual(POSTURE_MODEL_MIX_LABEL, 'Model mix');
    assert.strictEqual(POSTURE_HOLD_NOW_LABEL, 'Model mix');
    assert.strictEqual(MODEL_READ_PREFIX, 'Model read:');
    assert.strictEqual(ACTIONABLE_READ_PREFIX, 'Model read:');
    assert.strictEqual(HOW_TO_USE_THIS_TITLE, 'How to use this');
    assert.match(HOW_IT_WORKS_MODEL_MIX_DEFINITION, /published mix after the brake/i);
    assert.ok(HOW_TO_USE_THIS_LINES.some((line) => /research posture/i.test(line)));
  });

  it('share and micro-flow copy use Model mix, not Hold now', () => {
    const row: GhostRegimeRow = {
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
    };
    const blocks = buildTodaySnapshotBlocks(row);
    assert.ok(blocks);
    const share = buildShareSummary(row, blocks!, null);
    const micro = buildMicroFlowLine(row);
    assert.match(share, /Model mix:/);
    assert.doesNotMatch(share, /Hold now/);
    assert.doesNotMatch(share, /Actionable read/);
    assert.match(micro ?? '', /Model mix/);
    assert.doesNotMatch(micro ?? '', /Hold now/);
    assert.match(blocks!.actual, /60\/15\/5 \+ 20 cash/);
  });

  it('glossary uses Model mix and keeps the public anchor id', () => {
    const entry = GLOSSARY_TERMS.find((item) => item.id === 'targets-scales-actual');
    assert.ok(entry);
    assert.match(entry!.term, /Model mix/);
    assert.doesNotMatch(entry!.term, /Hold now/);
    assert.doesNotMatch(entry!.short, /should actually hold|practical instruction|Cash now/i);
    assert.doesNotMatch(entry!.why, /practical instruction|Hold now/);
  });

  it('forbids leftover advice / efficacy phrases on current GhostRegime product surfaces', () => {
    const src = publicSource();
    assert.doesNotMatch(src, /Hold now/);
    assert.doesNotMatch(src, /Actionable read/);
    assert.doesNotMatch(src, /What to do now/);
    assert.doesNotMatch(src, /should actually hold/i);
    assert.doesNotMatch(src, /practical instruction/i);
    assert.doesNotMatch(src, /sidestep/);
    assert.doesNotMatch(src, /train wreck/i);
    assert.doesNotMatch(src, /get you back in/i);
    assert.doesNotMatch(src, /sell near the top/i);
    assert.doesNotMatch(src, /buy near the bottom/i);
    assert.doesNotMatch(src, /Cash now/);
    assert.doesNotMatch(src, /keep you from getting wrecked/i);
    assert.match(HOW_IT_WORKS_REALITY_CHECK, /Exposure changes only when the published regime or sleeve-brake rules change/);
  });

  it('locks DrawdownRealityCheck full-variant wording to factual drawdown / rules language', () => {
    const src = readFileSync(join(ROOT, 'components/learn/DrawdownRealityCheck.tsx'), 'utf8');
    assert.doesNotMatch(src, /keep you from getting wrecked/i);
    assert.doesNotMatch(src, /That's why GhostRegime exists: not to be 'right'/);
    assert.match(
      src,
      /Large drawdowns can take years to recover from\. That is why GhostRegime makes its exposure rules explicit instead of pretending it can call the exact top or bottom\./
    );
  });

  it('rejects leftover How It Works outcome / cadence / hold-instruction copy', () => {
    const howItWorks = readFileSync(join(ROOT, 'app/ghostregime/how-it-works/page.tsx'), 'utf8');
    assert.doesNotMatch(howItWorks, /you win by/i);
    assert.doesNotMatch(howItWorks, /captures upside and limits downside/i);
    assert.doesNotMatch(howItWorks, /fewer faceplants during bear markets/i);
    assert.doesNotMatch(howItWorks, /solid participation during bull markets/i);
    assert.doesNotMatch(howItWorks, /What You Do With the Signal/);
    assert.doesNotMatch(howItWorks, /hold 100% of the starting point/i);
    assert.doesNotMatch(howItWorks, /hold 50% of the starting point/i);
    assert.doesNotMatch(howItWorks, /hold 0%/i);
    assert.doesNotMatch(howItWorks, /monthly calendar reminder/i);
    assert.doesNotMatch(howItWorks, /helps you decide what to hold inside the plan/i);
    assert.doesNotMatch(howItWorks, /The Promise/);
    assert.match(howItWorks, /How to use the model mix/);
    assert.match(howItWorks, /Design intent/);
    assert.match(howItWorks, /100% of the sleeve starting point/);
    assert.match(howItWorks, /maps the published exposures into the supported plan \/ ETF lineup/);
  });
});

describe('R6C does not change R6B live-fixture metrics', () => {
  it('keeps the 2026-09-01 evidence / resolution contract', () => {
    const riskStats = computeAxisStats(LIVE_RISK, 'Risk On');
    const inflStats = computeAxisStats(LIVE_INFL, 'Inflation');
    const riskAgree = computeAxisAgreement(LIVE_RISK, 'Risk On');
    const inflAgree = computeAxisAgreement(LIVE_INFL, 'Inflation');
    const riskNet = computeAxisNetVote(LIVE_RISK, 'risk');
    const inflNet = computeAxisNetVote(LIVE_INFL, 'inflation');
    const riskConv = computeConviction(riskNet.net, riskStats.totalSignals);
    const inflConv = computeConviction(inflNet.net, inflStats.totalSignals);
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

    assert.strictEqual(riskAgree.agree, 1);
    assert.strictEqual(riskAgree.total, 2);
    assert.ok(riskStats.participationLabel.includes('2/4'));
    assert.strictEqual(riskStats.confidence.label, 'Low');
    assert.strictEqual(riskConv.index, 0);
    assert.strictEqual(riskNet.net, 0);
    assert.strictEqual(formatResolvedByLine(LIVE_RISK), 'Resolved by SPY TR21 tie-break');

    assert.strictEqual(inflAgree.agree, 2);
    assert.strictEqual(inflAgree.total, 4);
    assert.ok(inflStats.participationLabel.includes('4/4'));
    assert.strictEqual(inflStats.confidence.label, 'Medium');
    assert.strictEqual(inflConv.index, 0);
    assert.strictEqual(inflNet.net, 0);
    assert.strictEqual(formatResolvedByLine(LIVE_INFL), 'Resolved by PDBC TR21 tie-break');

    assert.strictEqual(primary.label, 'Tie');
    assert.strictEqual(primary.whyReason, 'Tie: both axes weak');
    assert.ok(!pickTopDrivers(LIVE_INFL, 4).some((r) => r.key === 'infl_tiebreak'));
  });

  it('does not rewrite product positioning SEO copy', () => {
    assert.match(GHOSTREGIME_PRODUCT_TAGLINE, /Rules-based market regime model/);
    assert.match(GHOSTREGIME_SEO_DESCRIPTION, /not a price prediction/);
  });
});
