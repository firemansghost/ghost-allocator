/**
 * GhostYield categorical Evidence gate — derived from existing snapshot fields only.
 * Deterministic; no wall clock. Does not invent new numeric precision scores.
 */

import type { GhostYieldCandidateRaw, GhostYieldEvidenceGate } from './types';
import type { CandidateFreshnessResult } from './types';
import { effectiveDataConfidence, expectsNavQuote } from './candidateFields';

export type { GhostYieldEvidenceGate };

/**
 * CLEAR — fresh + high confidence, no critical expected-field gaps
 * QUALIFIED — usable with caution (stale/caution/medium confidence)
 * INSUFFICIENT — critical evidence gap (missing expected NAV, low/illustrative, or missing/illustrative status)
 */
export function deriveEvidenceGate(
  row: GhostYieldCandidateRaw,
  freshness: CandidateFreshnessResult
): GhostYieldEvidenceGate {
  const dc = effectiveDataConfidence(row);
  const missingExpectedNav = expectsNavQuote(row) && row.nav == null;

  if (
    dc === 'illustrative' ||
    dc === 'low' ||
    missingExpectedNav ||
    freshness.status === 'illustrative' ||
    freshness.status === 'missing'
  ) {
    return 'insufficient';
  }

  if (freshness.status === 'stale' || freshness.status === 'caution' || dc === 'medium') {
    return 'qualified';
  }

  return 'clear';
}

/** Fit Score is withheld from display when evidence is insufficient. */
export function isFitDisplaySuppressed(gate: GhostYieldEvidenceGate): boolean {
  return gate === 'insufficient';
}
