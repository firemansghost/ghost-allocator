/**
 * GhostFlow display helpers: signal grouping and proxy-level badge labels (no scoring impact).
 */

import { signalStatusDisplayLabel } from './scoring';
import type { GhostFlowDataStatus, GhostFlowSignalStatus, ScoredGhostFlowSignal } from './types';

export type SignalCardVariant = 'public' | 'derived' | 'mock';

export const PUBLIC_ARTIFACT_SIGNAL_IDS = [
  'passive-share',
  'etf-flow',
  'vol-regime',
  'active-index-flow',
  'concentration',
  'breadth',
  'systematic-flow',
  'levered-etf-rebalance',
  'retirement-asset-growth',
] as const;

export const DERIVED_SIGNAL_IDS = ['distance-65'] as const;

export const MOCK_SIGNAL_IDS = ['odte-options'] as const;

export interface GroupedSignals {
  publicArtifacts: ScoredGhostFlowSignal[];
  derivedContext: ScoredGhostFlowSignal[];
  mockProxies: ScoredGhostFlowSignal[];
}

export function groupSignalsByPresentation(signals: ScoredGhostFlowSignal[]): GroupedSignals {
  const byId = new Map(signals.map((s) => [s.id, s]));

  const publicArtifacts = PUBLIC_ARTIFACT_SIGNAL_IDS.map((id) => byId.get(id)).filter(
    (s): s is ScoredGhostFlowSignal => s != null && s.dataStatus === 'public_proxy'
  );

  const derivedContext = DERIVED_SIGNAL_IDS.map((id) => byId.get(id)).filter(
    (s): s is ScoredGhostFlowSignal => s != null
  );

  const mockFromIds = MOCK_SIGNAL_IDS.map((id) => byId.get(id)).filter(
    (s): s is ScoredGhostFlowSignal => s != null
  );
  const systematicFallback = byId.get('systematic-flow');
  const mockProxies = [
    ...mockFromIds,
    ...(systematicFallback?.dataStatus === 'mock' ? [systematicFallback] : []),
  ];

  return { publicArtifacts, derivedContext, mockProxies };
}

function proxyLevelLabel(status: GhostFlowSignalStatus): string {
  const label = signalStatusDisplayLabel(status);
  if (label === 'stress') return 'high';
  return label;
}

/** Card title override for placeholder signals (UI only; does not change scoring). */
export function signalCardDisplayName(sig: {
  id: string;
  name: string;
  dataStatus: GhostFlowDataStatus;
}): string {
  if (sig.id === 'systematic-flow' && sig.dataStatus === 'mock') {
    return 'Future Systematic Flow Feed';
  }
  return sig.name;
}

/** Card body override for placeholder signals (UI only; does not change scoring). */
export function signalCardExplanation(sig: {
  id: string;
  explanation: string;
  dataStatus: GhostFlowDataStatus;
}): string {
  if (sig.id === 'systematic-flow' && sig.dataStatus === 'mock') {
    return (
      'Future signal slot for a defensible positioning or systematic-pressure proxy. Not a current measured ' +
      'reading and not included in the Research Composite.'
    );
  }
  return sig.explanation;
}

/** Display badge text for signal cards (UI only; does not change scoring). */
export function signalCardBadgeLabel(
  variant: SignalCardVariant,
  status: GhostFlowSignalStatus
): string | null {
  if (variant === 'mock') return 'PLACEHOLDER';
  if (variant === 'derived') return 'DERIVED';
  if (variant === 'public') return `Proxy level: ${proxyLevelLabel(status)}`;
  return signalStatusDisplayLabel(status).toUpperCase();
}

/** Per-signal badge override (e.g. display-only levered ETF card). */
export function signalCardBadgeLabelForSignal(
  sig: Pick<ScoredGhostFlowSignal, 'id' | 'dataStatus' | 'status'>,
  variant: SignalCardVariant
): string | null {
  if (
    (sig.id === 'systematic-flow' ||
      sig.id === 'levered-etf-rebalance' ||
      sig.id === 'retirement-asset-growth') &&
    sig.dataStatus === 'public_proxy'
  ) {
    return 'DISPLAY ONLY';
  }
  return signalCardBadgeLabel(variant, sig.status);
}
