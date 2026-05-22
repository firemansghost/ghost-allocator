import { GlassCard } from '@/components/GlassCard';
import type { GhostFlowDataStatus, GhostFlowSignalStatus, ScoredGhostFlowSignal } from '@/lib/ghostflow/types';

function statusStyles(status: GhostFlowSignalStatus): string {
  switch (status) {
    case 'quiet':
      return 'border-zinc-600/60 bg-zinc-900/50 text-zinc-300';
    case 'watch':
      return 'border-amber-500/30 bg-amber-950/25 text-amber-200/90';
    case 'elevated':
      return 'border-amber-400/40 bg-amber-950/35 text-amber-200';
    case 'stress':
      return 'border-orange-500/35 bg-orange-950/20 text-orange-200/90';
  }
}

function dataStatusLabel(s: GhostFlowDataStatus): string {
  switch (s) {
    case 'mock':
      return 'Mock';
    case 'public_proxy':
      return 'Public proxy';
    case 'future_live':
      return 'Future live feed';
  }
}

export function GhostFlowSignalGrid({ signals }: { signals: ScoredGhostFlowSignal[] }) {
  return (
    <section className="space-y-3" aria-labelledby="ghostflow-signals-heading">
      <h2 id="ghostflow-signals-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Signal grid (mock v0.1)
      </h2>
      <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
        All signals below use illustrative mock values for this static preview. Data status labels describe the intended
        future source type — not a live feed today.
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {signals.map((sig) => (
          <GlassCard key={sig.id} className="p-4 flex flex-col min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{sig.name}</h3>
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles(sig.status)}`}
              >
                {sig.status}
              </span>
            </div>
            <p className="mt-2 text-lg font-medium tabular-nums text-zinc-50 break-words">{sig.value}</p>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed flex-1">{sig.explanation}</p>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
              <span>Data: {dataStatusLabel(sig.dataStatus)}</span>
              <span>Target: {sig.updateFrequencyTarget}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
