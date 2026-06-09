import { GlassCard } from '@/components/GlassCard';
import {
  buildFreshnessSummaryView,
  freshnessStatusLabel,
} from '@/lib/ghostflow/freshnessSummary';
import type { GhostFlowPublicSignalMeta } from '@/lib/ghostflow/artifacts/types';

function freshnessPillClass(status: string): string {
  switch (status) {
    case 'fresh':
      return 'text-emerald-300/90';
    case 'caution':
      return 'text-amber-300/90';
    case 'stale':
      return 'text-orange-300/90';
    default:
      return 'text-zinc-400';
  }
}

export function GhostFlowFreshnessSummary({
  publicSignals,
}: {
  publicSignals: GhostFlowPublicSignalMeta[];
}) {
  const view = buildFreshnessSummaryView(publicSignals);

  if (
    !view.latestDailyAsOf &&
    !view.latestWeeklyAsOf &&
    !view.latestMonthlyAsOf &&
    !view.cautionSignal
  ) {
    return null;
  }

  return (
    <GlassCard className="p-4 sm:p-5 border-zinc-800/80 bg-neutral-950/35">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
        Data freshness summary
      </h2>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-zinc-300">
        {view.latestDailyAsOf && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Latest daily artifacts
            </dt>
            <dd className="mt-0.5 tabular-nums">{view.latestDailyAsOf}</dd>
          </div>
        )}
        {view.latestWeeklyAsOf && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Latest weekly artifact
            </dt>
            <dd className="mt-0.5 tabular-nums">Week ended {view.latestWeeklyAsOf}</dd>
          </div>
        )}
        {view.latestMonthlyAsOf && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Latest monthly artifacts
            </dt>
            <dd className="mt-0.5 tabular-nums">Month ended {view.latestMonthlyAsOf}</dd>
          </div>
        )}
        {view.cautionSignal && (
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Oldest / caution
            </dt>
            <dd className="mt-0.5">
              <span className="text-zinc-200">{view.cautionSignal.name}</span>
              <span className={`ml-2 text-xs font-semibold uppercase ${freshnessPillClass(view.cautionSignal.freshnessStatus)}`}>
                {freshnessStatusLabel(view.cautionSignal.freshnessStatus)}
              </span>
              <span className="text-zinc-500 text-xs ml-2 tabular-nums">
                ({view.cautionSignal.signalId === 'etf-flow' ? 'week ended' : view.cautionSignal.signalId === 'vol-regime' || view.cautionSignal.signalId === 'breadth' ? 'as of' : 'month ended'}{' '}
                {view.cautionSignal.asOf})
              </span>
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-[10px] text-zinc-600 leading-relaxed">
        Summary covers equity Research Composite artifact groups (daily, weekly, monthly score-fed inputs). Display-only
        and Treasury cards show their own dates and quality labels on each card.
      </p>
    </GlassCard>
  );
}
