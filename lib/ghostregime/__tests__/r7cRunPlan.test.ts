import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CANDIDATE_IDS } from '../../../scripts/ghostregime/research/study-contract';
import {
  applyNoBtcToCash,
  assertNoBtcNotPrimaryCandidate,
  buildStudyScenarios,
  expectedStudyMatrixCounts,
  NO_BTC_POLICY_ID,
  planOnlyContract,
} from '../../../scripts/ghostregime/research/r7c-run-plan';

describe('R7C run plan', () => {
  it('keeps primary candidates in P0–P6 order and excludes NO_BTC_TO_CASH', () => {
    const scenarios = buildStudyScenarios();
    const primary = scenarios.filter((s) => s.family === 'primary').map((s) => s.candidateId);
    assert.deepStrictEqual(primary, [...CANDIDATE_IDS]);
    assert.ok(scenarios.every((s) => s.candidateId == null || CANDIDATE_IDS.includes(s.candidateId)));
    assert.ok(!CANDIDATE_IDS.includes(NO_BTC_POLICY_ID as never));
    assertNoBtcNotPrimaryCandidate();
  });

  it('transfers BTC weight only to BIL and keeps the sum at 1', () => {
    const next = applyNoBtcToCash({ SPY: 0.6, GLD: 0.15, 'BTC-USD': 0.05, BIL: 0.2 });
    assert.strictEqual(next.SPY, 0.6);
    assert.strictEqual(next.GLD, 0.15);
    assert.strictEqual(next['BTC-USD'], 0);
    assert.strictEqual(next.BIL, 0.25);
    assert.ok(Math.abs(Object.values(next).reduce((sum, x) => sum + x, 0) - 1) < 1e-12);
  });

  it('plan-only contract contains no performance outcomes', () => {
    const plan = planOnlyContract();
    assert.strictEqual(plan.candidate_performance, 'not_run');
    assert.strictEqual(plan.ranking, 'not_run');
    const text = JSON.stringify(plan);
    assert.doesNotMatch(text, /"cagr":\s*-?[0-9]/);
    const counts = expectedStudyMatrixCounts();
    assert.strictEqual(counts.primary, 7);
    assert.strictEqual(counts.benchmarks, 3);
    assert.strictEqual(counts.total, buildStudyScenarios().length);
  });
});
