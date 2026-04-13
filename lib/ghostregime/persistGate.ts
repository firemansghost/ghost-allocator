/**
 * Validates computed rows before they replace persisted "latest" (no bad writes).
 */

import type { GhostRegimeRow } from './types';

/**
 * If the row cannot be persisted, return a short machine-readable reason (else null).
 */
export function getPersistSnapshotRejection(row: GhostRegimeRow): string | null {
  if (!row.date) return 'missing_date';
  if (!row.regime) return 'missing_regime';
  if (!row.row_computed_at_utc) return 'missing_row_computed_at_utc';
  if (!row.row_engine_version) return 'missing_row_engine_version';
  if (row.row_build_commit === undefined || row.row_build_commit === '') return 'missing_row_build_commit';
  if (typeof row.risk_score !== 'number' || !Number.isFinite(row.risk_score)) {
    return `invalid_risk_score:${String(row.risk_score)}`;
  }
  if (typeof row.infl_score !== 'number' || !Number.isFinite(row.infl_score)) {
    return `invalid_infl_score:${String(row.infl_score)}`;
  }
  return null;
}

export function isValidPersistableSnapshot(row: GhostRegimeRow): boolean {
  return getPersistSnapshotRejection(row) === null;
}
