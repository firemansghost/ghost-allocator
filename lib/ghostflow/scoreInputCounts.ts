/**
 * GhostFlow display helper: count public / derived / mock score sub-inputs (no scoring impact).
 */

import { countScoreInputMixDetailed } from './scoreInputClassification';

export function countScoreInputMix(passiveShareProxySource?: 'public' | 'mock_fallback'): {
  publicCount: number;
  derivedCount: number;
  mockCount: number;
  total: number;
} {
  const { publicArtifactCount, derivedScoreInputCount, mockScoreInputCount } =
    countScoreInputMixDetailed(passiveShareProxySource);
  return {
    publicCount: publicArtifactCount,
    derivedCount: derivedScoreInputCount,
    mockCount: mockScoreInputCount,
    total: 10,
  };
}
