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
  derivedFootnote?: string;
}

const MOCK_FOOTNOTE = 'Static mock input included in research composite';
const MODEL_ZONE_DERIVED_FOOTNOTE =
  'Derived from ICI index-share distance-to-65 logic (same mapping as distance-to-65 context)';

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
  publicKeys: Array<keyof StructuralFragilityInputs> | undefined,
  passiveShareProxySource?: 'public' | 'mock_fallback'
): ScoreInputRowMeta {
  if (
    key === 'modelZoneProximity' &&
    passiveShareProxySource === 'public'
  ) {
    return { badge: 'DERIVED', derivedFootnote: MODEL_ZONE_DERIVED_FOOTNOTE };
  }
  if (publicKeys?.includes(key)) {
    return { badge: 'PUBLIC' };
  }
  return { badge: 'MOCK', mockFootnote: MOCK_FOOTNOTE };
}

export function countScoreInputMixDetailed(passiveShareProxySource?: 'public' | 'mock_fallback'): {
  publicArtifactCount: number;
  derivedScoreInputCount: number;
  mockScoreInputCount: number;
} {
  const publicArtifactCount = 6;
  const derivedScoreInputCount = passiveShareProxySource === 'public' ? 1 : 0;
  const mockScoreInputCount = 10 - publicArtifactCount - derivedScoreInputCount;
  return { publicArtifactCount, derivedScoreInputCount, mockScoreInputCount };
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

export function countMockScoreInputs(
  data: Pick<GhostFlowDashboardData, 'publicPassiveInputKeys' | 'publicStructuralInputKeys'>,
  passiveShareProxySource?: 'public' | 'mock_fallback'
): number {
  return countScoreInputMixDetailed(passiveShareProxySource).mockScoreInputCount;
}
