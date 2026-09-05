/**
 * CURRENT BEHAVIOR CHARACTERIZATION — not desired behavior.
 *
 * Documents committed JEPI on the static snapshot: missing NAV → Data Gaps,
 * Risk 56, Fit 100 (Strong Fit band). Future confidence-gate / semantic work
 * is expected to change this result; do not treat these asserts as product goals.
 */

import assert from 'node:assert/strict';
import { GHOSTYIELD_SCORED_CANDIDATES } from '../sampleCandidates';
import { fitScoreBand, fitScoreBandWord } from '../screenerDisplay';

const jepi = GHOSTYIELD_SCORED_CANDIDATES.find((c) => c.ticker === 'JEPI');
assert.ok(jepi, 'JEPI must exist in committed candidates');

assert.equal(jepi.nav, null);
assert.equal(jepi.structureLabel, 'ETF');
assert.equal(jepi.dataConfidence, 'high');

assert.equal(jepi.freshness.status, 'missing');
assert.equal(jepi.freshness.applyScoringPenalty, true);
assert.ok(jepi.freshness.warnings.some((w) => /Missing NAV/i.test(w)));

assert.equal(jepi.riskScore, 56);
assert.equal(jepi.fitScore, 100);
assert.equal(fitScoreBand(jepi.fitScore), 'strong');
assert.equal(fitScoreBandWord(jepi.fitScore), 'Strong Fit');

const riskLabels = jepi.riskDrivers.map((d) => d.label);
assert.ok(riskLabels.includes('Missing NAV'));
assert.ok(riskLabels.includes('Stale or incomplete snapshot'));

const fitLabels = jepi.fitDrivers.map((d) => d.label);
assert.ok(fitLabels.includes('Distribution quality'));
assert.ok(fitLabels.includes('NAV trend'));
assert.ok(fitLabels.includes('Data confidence'));
// CURRENT BEHAVIOR: applied freshness/missing Fit penalty is not among top Fit drivers.
assert.ok(!fitLabels.includes('Snapshot freshness'));
assert.ok(!fitLabels.includes('Fresh snapshot'));

console.log('ghostyield/jepiCharacterization.test.ts: ok (CURRENT BEHAVIOR — Fit 100 + missing NAV)');
