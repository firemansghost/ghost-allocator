'use client';

import type { GhostYieldCandidate } from '@/lib/ghostyield/types';
import { GlassCard } from '@/components/GlassCard';

export function DataFreshnessPanel({ candidate }: { candidate: GhostYieldCandidate | null }) {
  return (
    <GlassCard className="p-4 sm:p-5 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Data freshness</h2>
      {candidate ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 text-xs">As of (illustrative)</dt>
            <dd className="font-mono text-zinc-200">{candidate.dataAsOf}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 text-xs">Source</dt>
            <dd className="text-zinc-200">{candidate.sourceLabel}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 text-xs">Confidence</dt>
            <dd className="text-zinc-200 capitalize">{candidate.confidence}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-zinc-500">Select a candidate to see sample freshness fields.</p>
      )}
      <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800/80 pt-3">
        Phase 1 uses static placeholders only — no live NAV, no live distribution character, no tax advice.
        Do not trade from this view.
      </p>
    </GlassCard>
  );
}
