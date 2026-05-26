/**
 * GhostFlow v0.8 — structured freshness summary from meta/signals (display only).
 */

import type { GhostFlowArtifactFreshnessStatus, GhostFlowPublicSignalMeta } from './artifacts/types';

const DAILY_SIGNAL_IDS = ['vol-regime', 'breadth'] as const;
const WEEKLY_SIGNAL_IDS = ['etf-flow'] as const;
const MONTHLY_SIGNAL_IDS = ['active-index-flow', 'concentration', 'passive-share'] as const;

const STATUS_RANK: Record<GhostFlowArtifactFreshnessStatus, number> = {
  stale: 3,
  caution: 2,
  missing: 1,
  fresh: 0,
};

function maxIso(dates: string[]): string | undefined {
  if (dates.length === 0) return undefined;
  return dates.reduce((a, b) => (a >= b ? a : b));
}

function pickBySignalIds(
  signals: GhostFlowPublicSignalMeta[],
  ids: readonly string[]
): GhostFlowPublicSignalMeta[] {
  const set = new Set(ids);
  return signals.filter((s) => set.has(s.signalId));
}

function worstSignal(
  signals: GhostFlowPublicSignalMeta[]
): GhostFlowPublicSignalMeta | undefined {
  if (signals.length === 0) return undefined;
  return signals.reduce((worst, cur) =>
    STATUS_RANK[cur.freshnessStatus] > STATUS_RANK[worst.freshnessStatus] ? cur : worst
  );
}

export interface GhostFlowFreshnessSummaryView {
  latestDailyAsOf?: string;
  latestWeeklyAsOf?: string;
  latestMonthlyAsOf?: string;
  cautionSignal?: GhostFlowPublicSignalMeta;
}

export function buildFreshnessSummaryView(
  publicSignals: GhostFlowPublicSignalMeta[]
): GhostFlowFreshnessSummaryView {
  const daily = pickBySignalIds(publicSignals, DAILY_SIGNAL_IDS);
  const weekly = pickBySignalIds(publicSignals, WEEKLY_SIGNAL_IDS);
  const monthly = pickBySignalIds(publicSignals, MONTHLY_SIGNAL_IDS);

  const cautionCandidates = publicSignals.filter(
    (s) => s.freshnessStatus === 'caution' || s.freshnessStatus === 'stale'
  );
  const cautionSignal = worstSignal(cautionCandidates);

  return {
    latestDailyAsOf: maxIso(daily.map((s) => s.asOf)),
    latestWeeklyAsOf: maxIso(weekly.map((s) => s.asOf)),
    latestMonthlyAsOf: maxIso(monthly.map((s) => s.asOf)),
    cautionSignal:
      cautionSignal && cautionSignal.freshnessStatus !== 'fresh' ? cautionSignal : undefined,
  };
}

export function freshnessStatusLabel(status: GhostFlowArtifactFreshnessStatus): string {
  return status;
}
