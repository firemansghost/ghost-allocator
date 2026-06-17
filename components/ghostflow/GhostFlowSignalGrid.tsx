import { GlassCard } from '@/components/GlassCard';
import {
  groupSignalsByPresentation,
  signalCardBadgeLabelForSignal,
  signalCardDisplayName,
  signalCardExplanation,
  type SignalCardVariant,
} from '@/lib/ghostflow/signalPresentation';
import type {
  GhostFlowArtifactFreshnessStatus,
  GhostFlowDataMix,
  GhostFlowDataStatus,
  GhostFlowSignalStatus,
  ScoredGhostFlowSignal,
} from '@/lib/ghostflow/types';

function proxyLevelBadgeStyles(status: GhostFlowSignalStatus): string {
  switch (status) {
    case 'quiet':
      return 'border-zinc-600/60 bg-zinc-900/50 text-zinc-300';
    case 'watch':
      return 'border-amber-500/30 bg-amber-950/25 text-amber-200/90';
    case 'pre_stress':
      return 'border-amber-400/35 bg-amber-950/30 text-amber-100/95';
    case 'elevated':
    case 'stress':
      return 'border-amber-400/40 bg-amber-950/35 text-amber-200';
  }
}

function derivedBadgeStyles(status: GhostFlowSignalStatus): string {
  return proxyLevelBadgeStyles(status);
}

function placeholderBadgeStyles(): string {
  return 'border-zinc-600/50 bg-zinc-900/40 text-zinc-400';
}

function cardBadgeStyles(variant: SignalCardVariant, status: GhostFlowSignalStatus): string {
  if (variant === 'mock') return placeholderBadgeStyles();
  if (variant === 'derived') return derivedBadgeStyles(status);
  return proxyLevelBadgeStyles(status);
}

function cardShellClass(variant: SignalCardVariant): string {
  if (variant === 'mock') {
    return 'p-4 flex flex-col min-w-0 border-zinc-800/60 bg-neutral-950/25 opacity-95';
  }
  return 'p-4 flex flex-col min-w-0';
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
  if (signalId === 'systematic-flow') return 'Positions as of';
  if (signalId === 'levered-etf-rebalance') return 'Session';
  if (signalId === 'retirement-asset-growth') return 'Quarter ended';
  if (signalId === 'options-activity-proxy') return 'Session';
  if (signalId === 'index-inclusion-events') return 'Event window';
  if (signalId === 'cap-weight-premium') return 'As of';
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

function SignalCard({
  sig,
  variant,
  dataMix,
}: {
  sig: ScoredGhostFlowSignal;
  variant: SignalCardVariant;
  dataMix: GhostFlowDataMix;
}) {
  const badgeLabel = signalCardBadgeLabelForSignal(sig, variant);

  return (
    <GlassCard className={cardShellClass(variant)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={`text-sm font-semibold leading-snug ${variant === 'mock' ? 'text-zinc-400' : 'text-zinc-100'}`}
        >
          {signalCardDisplayName(sig)}
        </h3>
        {badgeLabel && (
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cardBadgeStyles(variant, sig.status)}`}
          >
            {badgeLabel}
          </span>
        )}
      </div>
      <p
        className={`mt-2 text-base sm:text-lg font-medium tabular-nums break-words leading-snug ${variant === 'mock' ? 'text-zinc-400' : 'text-zinc-50'}`}
      >
        {sig.value}
      </p>
      <p className={`mt-2 text-xs leading-relaxed flex-1 ${variant === 'mock' ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {signalCardExplanation(sig)}
      </p>
      {sig.dataStatus === 'public_proxy' && sig.cardCaveat && (
        <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed border-l-2 border-amber-500/30 pl-2">
          {sig.cardCaveat}
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
        {variant === 'mock' ? (
          <p className="text-[10px] text-zinc-500">
            PLACEHOLDER card — illustrative future signal, not included in the current research composite score.
          </p>
        ) : variant === 'derived' ? (
          <p className="text-[10px] text-zinc-500">
            DERIVED from public ICI index-share context — displayed for reference, not an additional score sub-input.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
              <span>Data: {dataStatusLabel(sig.dataStatus)}</span>
              {sig.dataStatus === 'public_proxy' && sig.updateFrequencyTarget && (
                <span>{sig.updateFrequencyTarget.replace(' (manual artifact)', '').replace('Derived (', 'Derived · ')}</span>
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
          </>
        )}
        {variant === 'mock' && dataMix === 'mixed' && (
          <p className="text-[10px] text-zinc-600">Target: {sig.updateFrequencyTarget}</p>
        )}
      </div>
    </GlassCard>
  );
}

const SCORE_FED_SIGNAL_ORDER = [
  'vol-regime',
  'breadth',
  'etf-flow',
  'active-index-flow',
  'passive-share',
  'concentration',
] as const;

const DISPLAY_ONLY_SIGNAL_ORDER = [
  'systematic-flow',
  'levered-etf-rebalance',
  'retirement-asset-growth',
  'options-activity-proxy',
  'index-inclusion-events',
  'cap-weight-premium',
] as const;

function orderSignals(
  signals: ScoredGhostFlowSignal[],
  order: readonly string[]
): ScoredGhostFlowSignal[] {
  const byId = new Map(signals.map((s) => [s.id, s]));
  return order.map((id) => byId.get(id)).filter((s): s is ScoredGhostFlowSignal => s != null);
}

function SignalSection({
  title,
  intro,
  signals,
  variant,
  dataMix,
}: {
  title: string;
  intro: string;
  signals: ScoredGhostFlowSignal[];
  variant: SignalCardVariant;
  dataMix: GhostFlowDataMix;
}) {
  if (signals.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">{intro}</p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {signals.map((sig) => (
          <SignalCard key={sig.id} sig={sig} variant={variant} dataMix={dataMix} />
        ))}
      </div>
    </div>
  );
}

export function GhostFlowSignalGrid({
  signals,
  dataMix = 'mock',
}: {
  signals: ScoredGhostFlowSignal[];
  dataMix?: GhostFlowDataMix;
  publicSignalCount?: number;
}) {
  const grouped = groupSignalsByPresentation(signals);
  const scoreFedSignals = orderSignals(grouped.publicArtifacts, SCORE_FED_SIGNAL_ORDER);
  const displayOnlySignals = orderSignals(grouped.publicArtifacts, DISPLAY_ONLY_SIGNAL_ORDER);

  return (
    <section className="space-y-6" aria-labelledby="ghostflow-signals-heading">
      <div>
        <h2 id="ghostflow-signals-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Market-structure signals
        </h2>
        <p className="mt-2 text-xs text-zinc-500 leading-relaxed max-w-3xl">
          Six public score artifacts and one derived input feed the Research Composite. Six additional public artifacts
          are display-only context cards — visible on the dashboard, but not score inputs.
        </p>
      </div>

      <SignalSection
        title="Score-fed public artifacts"
        intro="Hand-updated from public sources. Mapped 0–100 proxy levels feed Passive Pressure or Structural Fragility sub-scores."
        signals={scoreFedSignals}
        variant="public"
        dataMix={dataMix}
      />

      <SignalSection
        title="Display-only public artifacts"
        intro="Hand-updated context cards. Metrics may appear on the card but do not replace static MOCK score inputs or change the Research Composite."
        signals={displayOnlySignals}
        variant="public"
        dataMix={dataMix}
      />

      <SignalSection
        title="Derived context"
        intro="Derived from the ICI Index Share Proxy — gap to a model-stress-zone reference (~65% in published framing; 60–65% zone depending on definition). Context only, not an additional score sub-input."
        signals={grouped.derivedContext}
        variant="derived"
        dataMix={dataMix}
      />

      {grouped.mockProxies.length > 0 && (
        <SignalSection
          title="Placeholder signal cards"
          intro="Illustrative placeholder cards not included in the research composite."
          signals={grouped.mockProxies}
          variant="mock"
          dataMix={dataMix}
        />
      )}
    </section>
  );
}
