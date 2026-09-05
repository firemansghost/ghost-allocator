/**
 * CHARACTERIZATION LOCK — not approval to keep this date forever.
 *
 * Documents that the current product snapshot scores against
 * GHOSTYIELD_REFERENCE_AS_OF = 2026-05-08 via sampleCandidates.
 * Future approved refreshes may advance this constant.
 */

import assert from 'node:assert/strict';
import { GHOSTYIELD_REFERENCE_AS_OF } from '../reference';
import {
  GHOSTYIELD_REFERENCE_AS_OF as SAMPLE_REF,
  GHOSTYIELD_SCORED_CANDIDATES,
} from '../sampleCandidates';
import { evaluateCandidateFreshness } from '../dataFreshness';

assert.equal(GHOSTYIELD_REFERENCE_AS_OF, '2026-05-08');
assert.equal(SAMPLE_REF, '2026-05-08');
assert.equal(SAMPLE_REF, GHOSTYIELD_REFERENCE_AS_OF);

assert.ok(GHOSTYIELD_SCORED_CANDIDATES.length > 0);

// Scored candidates' freshness must match re-evaluation against the locked reference.
for (const c of GHOSTYIELD_SCORED_CANDIDATES) {
  const recomputed = evaluateCandidateFreshness(c, GHOSTYIELD_REFERENCE_AS_OF);
  assert.equal(
    c.freshness.status,
    recomputed.status,
    `${c.ticker} freshness.status must match evaluateCandidateFreshness(..., ${GHOSTYIELD_REFERENCE_AS_OF})`
  );
  assert.equal(c.freshness.applyScoringPenalty, recomputed.applyScoringPenalty);
}

console.log('ghostyield/staticReference.test.ts: ok (characterization lock on 2026-05-08)');
