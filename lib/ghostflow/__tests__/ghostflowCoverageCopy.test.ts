/**
 * GhostFlow v1.10a — trust badge coverage copy (display-only count disclosure).
 */

import assert from 'assert';
import {
  GHOSTFLOW_COVERAGE_BADGES_MIXED,
  GHOSTFLOW_COVERAGE_SUMMARY,
} from '@/components/ghostflow/GhostFlowTrustBadges';

assert.ok(
  GHOSTFLOW_COVERAGE_SUMMARY.includes('7 display-only'),
  'coverage summary must state 7 display-only public artifacts'
);
assert.ok(
  !GHOSTFLOW_COVERAGE_SUMMARY.includes('6 display-only'),
  'coverage summary must not contain stale 6 display-only count'
);
assert.ok(
  GHOSTFLOW_COVERAGE_BADGES_MIXED.includes('7 display-only public artifacts'),
  'mixed badges must include 7 display-only public artifacts'
);
assert.ok(
  !GHOSTFLOW_COVERAGE_BADGES_MIXED.includes('6 display-only public artifacts'),
  'mixed badges must not contain stale 6 display-only count'
);

console.log('ghostflow/ghostflowCoverageCopy.test.ts: ok');
