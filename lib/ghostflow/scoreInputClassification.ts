/**
 * GhostFlow v0.8 — display-only classification for composite score sub-inputs (no scoring impact).
 */

import type {
  GhostFlowDashboardData,
  PassivePressureInputs,
  StructuralFragilityInputs,
} from './types';

export type ScoreInputBadge = 'PUBLIC' | 'DERIVED' | 'MOCK' | 'PLACEHOLDER';

export type ScoreInputKind = 'passive' | 'structural';

export interface ScoreInputRowMeta {
  badge: ScoreInputBadge;
  mockFootnote?: string;
}

const MOCK_FOOTNOTE = 'Static mock input included in research composite';

export function classifyPassiveScoreInput(
  key: keyof PassivePressureInputs,
  publicKeys: Array<keyof PassivePressureInputs> | undefined
): ScoreInputRowMeta {
  if (publicKeys?.includes(key)) {
    return { badge: 'PUBLIC' };
  }
  return { badge: 'MOCK', mockFootnote: MOCK_FOOTNOTE };
}

export function classifyStructuralScoreInput(
  key: keyof StructuralFragilityInputs,
  publicKeys: Array<keyof StructuralFragilityInputs> | undefined
): ScoreInputRowMeta {
  if (publicKeys?.includes(key)) {
    return { badge: 'PUBLIC' };
  }
  return { badge: 'MOCK', mockFootnote: MOCK_FOOTNOTE };
}

export function scoreInputBadgeLabel(badge: ScoreInputBadge): string {
  return badge;
}

/** Signal cards only: illustrative futures not wired into the 10 score sub-inputs. */
export function signalCardInputBadge(variant: 'public' | 'derived' | 'mock'): ScoreInputBadge | null {
  if (variant === 'mock') return 'PLACEHOLDER';
  if (variant === 'derived') return 'DERIVED';
  return 'PUBLIC';
}

export function countMockScoreInputs(data: Pick<
  GhostFlowDashboardData,
  'publicPassiveInputKeys' | 'publicStructuralInputKeys'
>): number {
  const publicCount =
    (data.publicPassiveInputKeys?.length ?? 0) + (data.publicStructuralInputKeys?.length ?? 0);
  return 10 - publicCount;
}
