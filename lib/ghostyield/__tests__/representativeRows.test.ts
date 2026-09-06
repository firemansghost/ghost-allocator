/**
 * CHARACTERIZATION: representative committed rows after evidence-gate activation.
 */

import assert from 'node:assert/strict';
import { GHOSTYIELD_SCORED_CANDIDATES } from '../sampleCandidates';
import { isFitDisplaySuppressed } from '../evidenceGate';

function row(ticker: string) {
  const c = GHOSTYIELD_SCORED_CANDIDATES.find((x) => x.ticker === ticker);
  assert.ok(c, `${ticker} must exist`);
  return c;
}

// SGOV — high-confidence / complete control
{
  const c = row('SGOV');
  assert.equal(c.dataConfidence, 'high');
  assert.equal(c.freshness.status, 'fresh');
  assert.equal(c.evidenceGate, 'clear');
  assert.equal(c.riskScore, 4);
  assert.equal(c.fitScore, 100);
  assert.equal(isFitDisplaySuppressed(c.evidenceGate), false);
}

// HYG — caution → Qualified
{
  const c = row('HYG');
  assert.equal(c.freshness.status, 'caution');
  assert.equal(c.evidenceGate, 'qualified');
  assert.equal(c.riskScore, 31);
}

// ARDC — CEF structured metrics; medium conf → Qualified; Extreme economic Risk retained
{
  const c = row('ARDC');
  assert.equal(c.structureLabel, 'CEF');
  assert.ok(c.cefMetrics);
  assert.equal(c.freshness.status, 'fresh');
  assert.equal(c.evidenceGate, 'qualified');
  assert.equal(c.riskScore, 97);
}

// ARCC — stale BDC → Qualified
{
  const c = row('ARCC');
  assert.equal(c.sleeveType, 'bdc_income');
  assert.ok(c.bdcMetrics);
  assert.equal(c.freshness.status, 'stale');
  assert.equal(c.evidenceGate, 'qualified');
  assert.equal(c.riskScore, 36);
}

// KIO — stale CEF; Extreme economic Risk retained without freshness penalty
{
  const c = row('KIO');
  assert.equal(c.structureLabel, 'CEF');
  assert.equal(c.freshness.status, 'stale');
  assert.equal(c.evidenceGate, 'qualified');
  assert.equal(c.riskScore, 92);
}

// BXSL — listed BDC NAV-quoted dist must not become headline-yield Risk
{
  const c = row('BXSL');
  assert.ok(c.bdcMetrics);
  assert.equal(c.currentYield, null);
  assert.ok(c.distributionRate != null);
  assert.equal(c.evidenceGate, 'qualified');
  assert.equal(c.riskScore, 38);
  assert.equal(c.fitScore, 89);
}

// BRW — CEF Dist fallback; Extreme
{
  const c = row('BRW');
  assert.equal(c.structureLabel, 'CEF');
  assert.equal(c.currentYield, null);
  assert.equal(c.evidenceGate, 'qualified');
  assert.equal(c.riskScore, 95);
}

// JEPI — missing NAV → Insufficient; Fit withheld
{
  const c = row('JEPI');
  assert.equal(c.nav, null);
  assert.equal(c.freshness.status, 'missing');
  assert.equal(c.evidenceGate, 'insufficient');
  assert.equal(c.riskScore, 34);
  assert.equal(c.fitScore, 100);
  assert.equal(isFitDisplaySuppressed(c.evidenceGate), true);
}

// JEPQ — option-income Dist fallback; Elevated
{
  const c = row('JEPQ');
  assert.equal(c.sleeveType, 'option_income');
  assert.equal(c.currentYield, null);
  assert.equal(c.evidenceGate, 'insufficient');
  assert.equal(c.riskScore, 60);
  assert.equal(isFitDisplaySuppressed(c.evidenceGate), true);
}

// JAAA — missing NAV + stale lineage warnings; Insufficient
{
  const c = row('JAAA');
  assert.equal(c.nav, null);
  assert.equal(c.freshness.status, 'missing');
  assert.equal(c.evidenceGate, 'insufficient');
  assert.ok(c.freshness.warnings.some((w) => /Missing NAV/i.test(w)));
  assert.ok(c.freshness.warnings.some((w) => /90 days \(stale\)/i.test(w)));
  assert.ok(c.freshness.warnings.some((w) => /Quarterly fundamentals/i.test(w)));
  assert.equal(c.riskScore, 30);
  assert.equal(isFitDisplaySuppressed(c.evidenceGate), true);
}

console.log('ghostyield/representativeRows.test.ts: ok');
