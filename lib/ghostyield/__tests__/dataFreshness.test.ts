/**
 * CHARACTERIZATION: current evaluateCandidateFreshness behavior.
 * Freshness is relative to the supplied reference date — never Date.now().
 */

import assert from 'node:assert/strict';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;

// A. Fresh relative to static reference
{
  const f = evaluateCandidateFreshness(baseCandidate(), REF);
  assert.equal(f.status, 'fresh');
  assert.equal(f.applyScoringPenalty, false);
  assert.equal(f.warnings.length, 0);
}

// B. NAV stale after >5 trading days vs reference
{
  const f = evaluateCandidateFreshness(
    baseCandidate({ navDataAsOf: '2026-04-30' }),
    REF
  );
  assert.equal(f.status, 'stale');
  assert.equal(f.applyScoringPenalty, true);
  assert.ok(f.warnings.some((w) => /trading days/i.test(w)));
}

// C. Distribution caution after >45 calendar days
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      navDataAsOf: '2026-05-07',
      distributionDataAsOf: '2026-03-20',
      latestDistributionDate: '2026-03-20',
    }),
    REF
  );
  assert.equal(f.status, 'caution');
  assert.equal(f.applyScoringPenalty, true);
  assert.ok(f.warnings.some((w) => /45 days \(caution\)/i.test(w)));
}

// D. Distribution stale after >90 calendar days
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      navDataAsOf: '2026-05-07',
      distributionDataAsOf: '2026-01-15',
      latestDistributionDate: '2026-01-15',
    }),
    REF
  );
  assert.equal(f.status, 'stale');
  assert.equal(f.applyScoringPenalty, true);
  assert.ok(f.warnings.some((w) => /90 days \(stale\)/i.test(w)));
}

// E. Quarterly fundamentals stale after >120 days
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      navDataAsOf: '2026-05-07',
      distributionDataAsOf: '2026-05-01',
      quarterlyFundamentalDataAsOf: '2025-12-01',
    }),
    REF
  );
  assert.equal(f.status, 'stale');
  assert.equal(f.applyScoringPenalty, true);
  assert.ok(f.warnings.some((w) => /Quarterly fundamentals/i.test(w)));
}

// F. Expected NAV missing → status missing
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      structureLabel: 'ETF',
      nav: null,
      navDataAsOf: undefined,
    }),
    REF
  );
  assert.equal(f.status, 'missing');
  assert.equal(f.applyScoringPenalty, true);
  assert.ok(f.warnings.some((w) => /Missing NAV/i.test(w)));
}

// G. Illustrative confidence → illustrative
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      dataConfidence: 'illustrative',
      confidence: 'illustrative',
    }),
    REF
  );
  assert.equal(f.status, 'illustrative');
  assert.equal(f.applyScoringPenalty, true);
}

// H. Low-confidence warning / penalty behavior
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      dataConfidence: 'low',
      confidence: 'low',
    }),
    REF
  );
  assert.ok(f.warnings.some((w) => /Low data confidence/i.test(w)));
  assert.equal(f.applyScoringPenalty, true);
  // Current behavior: low-confidence warning alone rolls status to caution when otherwise clean.
  assert.equal(f.status, 'caution');
}

// I. Caution when warnings exist but no stale/missing condition
{
  const f = evaluateCandidateFreshness(
    baseCandidate({
      latestDistributionDate: undefined,
      distributionRate: undefined,
      latestDistributionAmount: undefined,
      distributionDataAsOf: '2026-05-01',
    }),
    REF
  );
  assert.equal(f.status, 'caution');
  assert.equal(f.applyScoringPenalty, true);
  assert.ok(f.warnings.some((w) => /Missing distribution source fields/i.test(w)));
}

// Confirm: same row can flip status when reference moves (not wall clock)
{
  const row = baseCandidate({ navDataAsOf: '2026-05-01' });
  const vsMay8 = evaluateCandidateFreshness(row, '2026-05-08');
  const vsMay20 = evaluateCandidateFreshness(row, '2026-05-20');
  assert.equal(vsMay8.status, 'fresh');
  assert.equal(vsMay20.status, 'stale');
}

console.log('ghostyield/dataFreshness.test.ts: ok');
