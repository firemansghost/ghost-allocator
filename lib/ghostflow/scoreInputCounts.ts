/**
 * GhostFlow display helper: count public vs mock score sub-inputs (no scoring impact).
 */

import type { GhostFlowDashboardData } from './types';

const TOTAL_SCORE_SUB_INPUTS = 10;

export function countScoreInputMix(data: Pick<
  GhostFlowDashboardData,
  'publicPassiveInputKeys' | 'publicStructuralInputKeys'
>): { publicCount: number; mockCount: number; total: number } {
  const publicCount =
    (data.publicPassiveInputKeys?.length ?? 0) + (data.publicStructuralInputKeys?.length ?? 0);
  return {
    publicCount,
    mockCount: TOTAL_SCORE_SUB_INPUTS - publicCount,
    total: TOTAL_SCORE_SUB_INPUTS,
  };
}
