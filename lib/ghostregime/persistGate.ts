/**
 * Validates computed rows before they replace persisted "latest" (no bad writes).
 */

import type { GhostRegimeRow } from './types';

/**
 * Minimum fields required for a row to be safe to persist as latest (post-cutover computed snapshots).
 */
export function isValidPersistableSnapshot(row: GhostRegimeRow): boolean {
  return Boolean(
    row.date &&
    row.regime &&
    row.row_computed_at_utc &&
    row.row_engine_version &&
    row.row_build_commit &&
    typeof row.risk_score === 'number' &&
    typeof row.infl_score === 'number'
  );
}
