/**
 * Evidence gate characterization — Clear / Qualified / Insufficient.
 */

import assert from 'node:assert/strict';
import { deriveEvidenceGate, isFitDisplaySuppressed } from '../evidenceGate';
import { evaluateCandidateFreshness } from '../dataFreshness';
import { GHOSTYIELD_SCORED_CANDIDATES } from '../sampleCandidates';
import { baseCandidate, TEST_REFERENCE_AS_OF } from './fixtures';

const REF = TEST_REFERENCE_AS_OF;

{
  const row = baseCandidate();
  const f = evaluateCandidateFreshness(row, REF);
  assert.equal(f.status, 'fresh');
  assert.equal(deriveEvidenceGate(row, f), 'clear');
  assert.equal(isFitDisplaySuppressed('clear'), false);
}

{
  const row = baseCandidate({ dataConfidence: 'medium', confidence: 'medium' });
  const f = evaluateCandidateFreshness(row, REF);
  assert.equal(deriveEvidenceGate(row, f), 'qualified');
}

{
  const row = baseCandidate({ nav: null, navDataAsOf: undefined, structureLabel: 'ETF' });
  const f = evaluateCandidateFreshness(row, REF);
  assert.equal(f.status, 'missing');
  assert.equal(deriveEvidenceGate(row, f), 'insufficient');
  assert.equal(isFitDisplaySuppressed('insufficient'), true);
}

{
  const row = baseCandidate({ dataConfidence: 'low', confidence: 'low' });
  const f = evaluateCandidateFreshness(row, REF);
  assert.equal(deriveEvidenceGate(row, f), 'insufficient');
}

{
  const sgov = GHOSTYIELD_SCORED_CANDIDATES.find((c) => c.ticker === 'SGOV');
  const jepi = GHOSTYIELD_SCORED_CANDIDATES.find((c) => c.ticker === 'JEPI');
  const arcc = GHOSTYIELD_SCORED_CANDIDATES.find((c) => c.ticker === 'ARCC');
  assert.equal(sgov?.evidenceGate, 'clear');
  assert.equal(jepi?.evidenceGate, 'insufficient');
  assert.equal(arcc?.evidenceGate, 'qualified');
}

console.log('ghostyield/evidenceGate.test.ts: ok');
