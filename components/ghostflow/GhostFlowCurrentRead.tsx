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
  const { score, passiveSharePercent, signals } = data;
  const { publicCount, derivedCount, mockCount } = countScoreInputMix(passiveShareProxySource);
  const distanceSignal = signals.find((s) => s.id === 'distance-65');

  const iciLine =
    passiveShareProxySource === 'public'
      ? `ICI fund/ETF index share is ${passiveSharePercent}%, but this uses a narrower fund/ETF denominator and is not a market-wide passive-share estimate.`
      : 'ICI index share proxy is on mock fallback; score uses placeholder passive-share inputs.';

  return (
    <GlassCard className="p-4 sm:p-5 border-zinc-700/50 bg-neutral-950/40">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Current read</h2>
      <div className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed max-w-4xl">
        <p>
          GhostFlow research composite reads <strong className="text-zinc-100">{score.score}</strong> ·{' '}
          <strong className="text-zinc-100">{score.bandLabel}</strong> ({publicCount} public artifact-driven
          {derivedCount > 0 ? `, ${derivedCount} derived score input` : ''}, and {mockCount} static mock score
          inputs).
        </p>
        {distanceSignal && passiveShareProxySource === 'public' && (
          <p className="text-zinc-400">
            Distance to model-stress-zone reference (~65% in published framing, 60–65% zone depending on definition):{' '}
            <strong className="text-zinc-200">{distanceSignal.value}</strong> below — derived from ICI index-share
            proxy only, not market-wide passive share. Pressure gauge context, not a crash countdown.
          </p>
        )}
        <p className="text-zinc-400">{iciLine}</p>
        <p className="text-zinc-400">
          Current read:{' '}
          {score.bandLabel.toLowerCase().replace(/\s*\/\s*/g, '/')} mechanical and structural pressure in the research
          preview, not a crash forecast.
        </p>
      </div>
    </GlassCard>
  );
}
