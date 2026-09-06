/**
 * DESIRED BEHAVIOR after economic Risk/Fit separation + Evidence gate.
 *
 * JEPI: missing expected NAV → Evidence Insufficient.
 * Economic Risk 34 (Moderate) after authorized option-income distributionRate
 * headline-yield fallback; Fit computed internally but display withheld.
 */

import assert from 'node:assert/strict';
import { GHOSTYIELD_SCORED_CANDIDATES } from '../sampleCandidates';
import { isFitDisplaySuppressed } from '../evidenceGate';
import { fitScoreBand, fitScoreBandWord } from '../screenerDisplay';

const jepi = GHOSTYIELD_SCORED_CANDIDATES.find((c) => c.ticker === 'JEPI');
assert.ok(jepi, 'JEPI must exist in committed candidates');

assert.equal(jepi.nav, null);
assert.equal(jepi.structureLabel, 'ETF');
assert.equal(jepi.dataConfidence, 'high');

assert.equal(jepi.freshness.status, 'missing');
assert.equal(jepi.freshness.applyScoringPenalty, true);
assert.ok(jepi.freshness.warnings.some((w) => /Missing NAV/i.test(w)));

assert.equal(jepi.evidenceGate, 'insufficient');
assert.equal(isFitDisplaySuppressed(jepi.evidenceGate), true);

assert.equal(jepi.riskScore, 34);
assert.equal(jepi.fitScore, 100); // economic Fit still computed
assert.equal(fitScoreBand(jepi.fitScore), 'strong');
assert.equal(fitScoreBandWord(jepi.fitScore), 'Strong Fit');

const riskLabels = jepi.riskDrivers.map((d) => d.label);
assert.ok(riskLabels.includes('Sleeve category risk'));
assert.ok(riskLabels.includes('Headline yield level'));
assert.ok(!riskLabels.includes('Missing NAV'));
assert.ok(!riskLabels.includes('Stale or incomplete snapshot'));
assert.match(
  jepi.riskDrivers.find((d) => d.label === 'Headline yield level')?.explanation ?? '',
  /option-income distribution rate/i
);

const fitLabels = jepi.fitDrivers.map((d) => d.label);
assert.ok(fitLabels.includes('Distribution quality'));
assert.ok(!fitLabels.includes('Data confidence'));
assert.ok(!fitLabels.includes('Snapshot freshness'));
assert.ok(!fitLabels.includes('Fresh snapshot'));

console.log('ghostyield/jepiCharacterization.test.ts: ok (Evidence Insufficient; Fit withheld; Risk 34)');
