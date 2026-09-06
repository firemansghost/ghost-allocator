/**
 * All-20 committed-snapshot locks after authorized headline-yield Risk resolver.
 * Fit and Evidence must stay at the pre-change values.
 */

import assert from 'node:assert/strict';
import { GHOSTYIELD_SCORED_CANDIDATES } from '../sampleCandidates';
import { riskScoreBand } from '../screenerDisplay';

const EXPECTED: Record<
  string,
  { risk: number; fit: number; evidence: 'clear' | 'qualified' | 'insufficient'; band: string }
> = {
  SGOV: { risk: 4, fit: 100, evidence: 'clear', band: 'low' },
  HYG: { risk: 31, fit: 94, evidence: 'qualified', band: 'moderate' },
  BKLN: { risk: 31, fit: 82, evidence: 'insufficient', band: 'moderate' },
  JAAA: { risk: 30, fit: 94, evidence: 'insufficient', band: 'moderate' },
  ARDC: { risk: 97, fit: 64, evidence: 'qualified', band: 'extreme' },
  PFF: { risk: 32, fit: 92, evidence: 'qualified', band: 'moderate' },
  BIZD: { risk: 38, fit: 80, evidence: 'insufficient', band: 'moderate' },
  ARCC: { risk: 36, fit: 90, evidence: 'qualified', band: 'moderate' },
  BXSL: { risk: 38, fit: 89, evidence: 'qualified', band: 'moderate' },
  KIO: { risk: 92, fit: 64, evidence: 'qualified', band: 'extreme' },
  EMO: { risk: 61, fit: 85, evidence: 'qualified', band: 'elevated' },
  TYG: { risk: 64, fit: 78, evidence: 'qualified', band: 'elevated' },
  SPE: { risk: 76, fit: 79, evidence: 'qualified', band: 'high' },
  BRW: { risk: 95, fit: 72, evidence: 'qualified', band: 'extreme' },
  PEO: { risk: 46, fit: 93, evidence: 'qualified', band: 'moderate' },
  NML: { risk: 57, fit: 80, evidence: 'qualified', band: 'elevated' },
  SRV: { risk: 66, fit: 78, evidence: 'qualified', band: 'elevated' },
  KYN: { risk: 55, fit: 85, evidence: 'qualified', band: 'elevated' },
  JEPI: { risk: 34, fit: 100, evidence: 'insufficient', band: 'moderate' },
  JEPQ: { risk: 60, fit: 98, evidence: 'insufficient', band: 'elevated' },
};

assert.equal(GHOSTYIELD_SCORED_CANDIDATES.length, 20);
assert.deepEqual(
  GHOSTYIELD_SCORED_CANDIDATES.map((c) => c.ticker).sort(),
  Object.keys(EXPECTED).sort()
);

for (const c of GHOSTYIELD_SCORED_CANDIDATES) {
  const exp = EXPECTED[c.ticker];
  assert.ok(exp, `${c.ticker} must be in the lock table`);
  assert.equal(c.riskScore, exp.risk, `${c.ticker} Risk`);
  assert.equal(c.fitScore, exp.fit, `${c.ticker} Fit must be unchanged`);
  assert.equal(c.evidenceGate, exp.evidence, `${c.ticker} Evidence must be unchanged`);
  assert.equal(riskScoreBand(c.riskScore), exp.band, `${c.ticker} band`);
}

console.log('ghostyield/allCandidatesRisk.test.ts: ok (20/20)');
