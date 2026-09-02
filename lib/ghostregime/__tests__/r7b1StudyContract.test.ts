import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { ALLOCATION_TARGETS, MODEL_VERSION } from '../config';
import {
  ABLATION_IDS,
  BENCHMARK_IDS,
  CANDIDATE_IDS,
  CASH_CONVENTION,
  COST_CONVENTION,
  HOLDOUT_CALENDAR_END,
  HOLDOUT_CALENDAR_START,
  HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED,
  MANIFEST_SHA256,
  MODEL_VERSION_EXPECTED,
  RESEARCH_END,
  RESEARCH_START,
  SNAPSHOT_ID,
  STATIC_REBALANCE_CONVENTION,
  assertFrozenModelVersion,
} from '../../../scripts/ghostregime/research/study-contract';
import {
  CANDIDATE_DEFINITIONS,
  assertCandidateFamilyFrozen,
  assertP0MatchesProductionTargets,
} from '../../../scripts/ghostregime/research/allocation-candidates';

describe('R7B1 study contract', () => {
  it('pins the frozen snapshot and model version', () => {
    assert.strictEqual(SNAPSHOT_ID, 'r7b0-20260902-210842Z');
    assert.strictEqual(MANIFEST_SHA256, 'bb68cdfbbfa854bfa7edeed226e42d2e5a1328e201bc821efcb43a274a63ca00');
    assert.strictEqual(MODEL_VERSION_EXPECTED, 'ghostregime-v1.0.4');
    assert.strictEqual(MODEL_VERSION, MODEL_VERSION_EXPECTED);
    assertFrozenModelVersion();
  });

  it('freezes research dates, holdout, cash, cost, and inception', () => {
    assert.strictEqual(RESEARCH_START, '2016-01-01');
    assert.strictEqual(RESEARCH_END, '2026-09-01');
    assert.strictEqual(HOLDOUT_CALENDAR_START, '2024-09-01');
    assert.strictEqual(HOLDOUT_CALENDAR_END, '2026-09-01');
    assert.strictEqual(HOLDOUT_FIRST_ELIGIBLE_SESSION_EXPECTED, '2024-09-03');
    assert.strictEqual(CASH_CONVENTION.primary_cash_series, 'adjusted_return');
    assert.strictEqual(CASH_CONVENTION.raw_bil_forbidden_as_primary, true);
    assert.strictEqual(COST_CONVENTION.primary_bps, 0);
    assert.deepStrictEqual([...COST_CONVENTION.sensitivity_bps], [5, 10]);
    assert.strictEqual(STATIC_REBALANCE_CONVENTION.run_monthly_sensitivity_in_r7b1, false);
  });

  it('freezes exactly P0–P6 and does not add a no-BTC primary candidate', () => {
    assert.deepStrictEqual([...CANDIDATE_IDS], [
      'P0_CURRENT',
      'P1_LESS_BTC',
      'P2_MORE_EQUITY',
      'P3_MORE_GOLD_RO',
      'P4_INFL_GOLD_30',
      'P5_DEEPER_OFF',
      'P6_HOUSE_601525',
    ]);
    assert.deepStrictEqual([...ABLATION_IDS], [
      'STATIC_601030',
      'REGIME_ONLY',
      'VAMS_ONLY',
      'COMBINED',
      'SPY_100',
    ]);
    assert.deepStrictEqual([...BENCHMARK_IDS], ['STATIC_601030', 'STATIC_6040', 'SPY_100']);
    assertCandidateFamilyFrozen();
  });

  it('keeps P0_CURRENT identical to production ALLOCATION_TARGETS', () => {
    assertP0MatchesProductionTargets();
    assert.strictEqual(CANDIDATE_DEFINITIONS.P0_CURRENT.riskOn.stocks, ALLOCATION_TARGETS.STOCKS_RISK_ON);
    assert.strictEqual(CANDIDATE_DEFINITIONS.P0_CURRENT.inflation.gold, ALLOCATION_TARGETS.GOLD_INFLATION);
  });

  it('does not store candidate results in the contract file', () => {
    const source = readFileSync('scripts/ghostregime/research/study-contract.ts', 'utf8');
    assert.doesNotMatch(source, /cagr|max_drawdown|winner|ranking_result/i);
  });
});
