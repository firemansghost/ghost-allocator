import { GlassCard } from '@/components/GlassCard';
import type {
  GhostFlowArtifactFreshnessStatus,
  GhostFlowDataMix,
  GhostFlowDataStatus,
  GhostFlowSignalStatus,
  ScoredGhostFlowSignal,
} from '@/lib/ghostflow/types';
import { signalStatusDisplayLabel } from '@/lib/ghostflow/scoring';

function statusStyles(status: GhostFlowSignalStatus): string {
  switch (status) {
    case 'quiet':
      return 'border-zinc-600/60 bg-zinc-900/50 text-zinc-300';
    case 'watch':
      return 'border-amber-500/30 bg-amber-950/25 text-amber-200/90';
    case 'pre_stress':
      return 'border-amber-400/35 bg-amber-950/30 text-amber-100/95';
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

function freshnessStyles(status: GhostFlowArtifactFreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200/90';
    case 'caution':
      return 'border-amber-500/35 bg-amber-950/30 text-amber-200/90';
    case 'stale':
      return 'border-orange-500/40 bg-orange-950/25 text-orange-200';
    case 'missing':
      return 'border-zinc-600/60 bg-zinc-900/50 text-zinc-400';
  }
}

function dataQualityLabel(q: string | undefined): string {
  switch (q) {
    case 'verified_manual':
      return 'Verified manual';
    case 'manual_unverified':
      return 'Manual (unverified)';
    case 'mock_fallback':
      return 'Mock fallback';
    default:
      return '—';
  }
}

function artifactDateLabel(signalId: string): string {
  if (signalId === 'etf-flow') return 'Week ended';
  if (
    signalId === 'active-index-flow' ||
    signalId === 'concentration' ||
    signalId === 'passive-share' ||
    signalId === 'distance-65'
  ) {
    return 'Month ended';
  }
  return 'As of';
}

function publicSignalDescription(publicSignalCount: number): string {
  if (publicSignalCount >= 5) {
    return 'Five signals use manual public artifacts (VIX, ICI ETF issuance, ICI active/index flows, SSGA SPY top-10 concentration, ICI Index Share Proxy). Distance-to-65 is derived from the ICI Index Share Proxy, not a separate manual artifact and not a market-wide passive-share estimate. All other cards are mock proxies.';
  }
  if (publicSignalCount >= 4) {
    return 'Four signals use manual public artifacts (VIX, ICI ETF issuance, ICI active/index flows, SSGA SPY top-10 concentration). All other cards are mock proxies.';
  }
  if (publicSignalCount >= 3) {
    return 'Three public artifacts are wired; others remain mock. Check freshness warnings if an artifact is unavailable.';
  }
  if (publicSignalCount === 2) {
    return 'Two public artifacts are wired; others remain mock. Check freshness warnings if an artifact is unavailable.';
  }
  if (publicSignalCount === 1) {
    return 'One public artifact is wired; others remain mock. Check freshness warnings if an artifact is unavailable.';
  }
  return 'All signals use illustrative mock values. Public artifacts unavailable.';
}

export function GhostFlowSignalGrid({
  signals,
  dataMix = 'mock',
  publicSignalCount = 0,
  passiveShareDenominatorWarning,
}: {
  signals: ScoredGhostFlowSignal[];
  dataMix?: GhostFlowDataMix;
  publicSignalCount?: number;
  passiveShareDenominatorWarning?: string;
}) {
  return (
    <section className="space-y-3" aria-labelledby="ghostflow-signals-heading">
      <h2 id="ghostflow-signals-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Signal grid
      </h2>
      <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">{publicSignalDescription(publicSignalCount)}</p>
      {passiveShareDenominatorWarning && (
        <p className="text-xs text-amber-300/90 leading-relaxed max-w-3xl border-l-2 border-amber-500/35 pl-3">
          {passiveShareDenominatorWarning}
        </p>
      )}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {signals.map((sig) => (
          <GlassCard key={sig.id} className="p-4 flex flex-col min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-100 leading-snug">{sig.name}</h3>
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles(sig.status)}`}
              >
                {signalStatusDisplayLabel(sig.status).toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-medium tabular-nums text-zinc-50 break-words leading-snug">
              {sig.value}
            </p>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed flex-1">{sig.explanation}</p>
            {sig.dataStatus === 'public_proxy' && sig.cardCaveat && (
              <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed border-l-2 border-amber-500/30 pl-2">
                {sig.cardCaveat}
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
                <span>Data: {dataStatusLabel(sig.dataStatus)}</span>
                {dataMix === 'mock' && sig.dataStatus === 'mock' && (
                  <span>Target: {sig.updateFrequencyTarget}</span>
                )}
                {sig.dataStatus === 'public_proxy' && sig.updateFrequencyTarget && (
                  <span>{sig.updateFrequencyTarget.replace(' (manual artifact)', '')}</span>
                )}
              </div>
              {sig.dataStatus === 'public_proxy' && (
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {sig.freshnessStatus && (
                    <span
                      className={`rounded-md border px-1.5 py-0.5 font-semibold uppercase tracking-wide ${freshnessStyles(sig.freshnessStatus)}`}
                    >
                      {sig.freshnessStatus}
                    </span>
                  )}
                  {sig.dataQuality && (
                    <span className="text-zinc-500">{dataQualityLabel(sig.dataQuality)}</span>
                  )}
                </div>
              )}
              {sig.dataStatus === 'public_proxy' && sig.artifactAsOf && (
                <p className="text-[10px] text-zinc-500">
                  {artifactDateLabel(sig.id)} {sig.artifactAsOf}
                  {sig.artifactPublishedAt ? ` · Released ${sig.artifactPublishedAt}` : ''}
                </p>
              )}
              {sig.dataStatus === 'public_proxy' && sig.sourceName && (
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Source:{' '}
                  {sig.sourceUrl ? (
                    <a
                      href={sig.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
                    >
                      {sig.sourceName}
                    </a>
                  ) : (
                    sig.sourceName
                  )}
                </p>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
