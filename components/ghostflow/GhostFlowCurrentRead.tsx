import { GlassCard } from '@/components/GlassCard';
import { countScoreInputMix } from '@/lib/ghostflow/scoreInputCounts';
import type { GhostFlowDashboardData } from '@/lib/ghostflow/types';

export function GhostFlowCurrentRead({
  data,
  passiveShareProxySource,
}: {
  data: GhostFlowDashboardData;
  passiveShareProxySource?: 'public' | 'mock_fallback';
}) {
  const { score, passiveSharePercent } = data;
  const { publicCount, mockCount } = countScoreInputMix(data);

  const iciLine =
    passiveShareProxySource === 'public'
      ? `ICI fund/ETF index share is ${passiveSharePercent}%, but this uses a narrower fund/ETF denominator and is not a market-wide passive-share estimate.`
      : 'ICI index share proxy is on mock fallback; score uses placeholder passive-share inputs.';

  return (
    <GlassCard className="p-4 sm:p-5 border-zinc-700/50 bg-neutral-950/40">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Current read</h2>
      <div className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed max-w-4xl">
        <p>
          GhostFlow reads <strong className="text-zinc-100">{score.score}</strong> ·{' '}
          <strong className="text-zinc-100">{score.bandLabel}</strong> ({publicCount} public and {mockCount} mock
          score inputs).
        </p>
        <p className="text-zinc-400">{iciLine}</p>
        <p className="text-zinc-400">
          Current read: elevated mechanical/structural pressure, not a crash forecast.
        </p>
      </div>
    </GlassCard>
  );
}
