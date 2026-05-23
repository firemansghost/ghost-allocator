/**
 * GhostFlow display helpers: signal grouping and proxy-level badge labels (no scoring impact).
 */

import { signalStatusDisplayLabel } from './scoring';
import type { GhostFlowSignalStatus, ScoredGhostFlowSignal } from './types';

export type SignalCardVariant = 'public' | 'derived' | 'mock';

export const PUBLIC_ARTIFACT_SIGNAL_IDS = [
  'passive-share',
  'etf-flow',
  'vol-regime',
  'active-index-flow',
  'concentration',
  'breadth',
] as const;

export const DERIVED_SIGNAL_IDS = ['distance-65'] as const;

export const MOCK_SIGNAL_IDS = ['odte-options', 'systematic-flow'] as const;

export interface GroupedSignals {
  publicArtifacts: ScoredGhostFlowSignal[];
  derivedContext: ScoredGhostFlowSignal[];
  mockProxies: ScoredGhostFlowSignal[];
}

export function groupSignalsByPresentation(signals: ScoredGhostFlowSignal[]): GroupedSignals {
  const byId = new Map(signals.map((s) => [s.id, s]));
  return {
    publicArtifacts: PUBLIC_ARTIFACT_SIGNAL_IDS.map((id) => byId.get(id)).filter(
      (s): s is ScoredGhostFlowSignal => s != null
    ),
    derivedContext: DERIVED_SIGNAL_IDS.map((id) => byId.get(id)).filter(
      (s): s is ScoredGhostFlowSignal => s != null
    ),
    mockProxies: MOCK_SIGNAL_IDS.map((id) => byId.get(id)).filter(
      (s): s is ScoredGhostFlowSignal => s != null
    ),
  };
}

function proxyLevelLabel(status: GhostFlowSignalStatus): string {
  const label = signalStatusDisplayLabel(status);
  if (label === 'stress') return 'high';
  return label;
}

/** Display badge text for signal cards (UI only; does not change scoring). */
export function signalCardBadgeLabel(
  variant: SignalCardVariant,
  status: GhostFlowSignalStatus
): string | null {
  if (variant === 'mock') return 'Placeholder';
  if (variant === 'public') return `Proxy level: ${proxyLevelLabel(status)}`;
  return signalStatusDisplayLabel(status).toUpperCase();
}
