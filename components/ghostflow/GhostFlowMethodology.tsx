import { GlassCard } from '@/components/GlassCard';
import { PASSIVE_SHARE_BANDS } from '@/lib/ghostflow/scoring';
import type { GhostFlowDashboardData } from '@/lib/ghostflow/types';

export function GhostFlowMethodology({ data }: { data: GhostFlowDashboardData }) {
  return (
    <section className="space-y-4" aria-labelledby="ghostflow-methodology-heading">
      <h2 id="ghostflow-methodology-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Methodology &amp; model zones
      </h2>

      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">v0.1 scoring model</h3>
        <div className="mt-3 space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">GhostFlow Score</strong> = 50% Passive Pressure Score + 50% Structural
            Fragility Score. All inputs are 0–100 proxies in this preview; weights are fixed and documented below.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-zinc-800/80 bg-neutral-950/40 p-3">
              <p className="font-semibold text-zinc-300 mb-2">Passive Pressure</p>
              <ul className="space-y-1 text-zinc-500">
                <li>25% ETF / fund-flow impulse</li>
                <li>20% systematic strategy pressure</li>
                <li>20% options / volatility amplifier</li>
                <li>20% retirement-flow pressure proxy</li>
                <li>15% levered ETF rebalance pressure</li>
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-neutral-950/40 p-3">
              <p className="font-semibold text-zinc-300 mb-2">Structural Fragility</p>
              <ul className="space-y-1 text-zinc-500">
                <li>30% passive share proxy</li>
                <li>20% active share / offset proxy</li>
                <li>20% index concentration</li>
                <li>15% breadth weakness</li>
                <li>15% model-zone proximity</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Passive-share model stress zones</h3>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          The <strong className="text-zinc-300">65% zone</strong> is drawn from published passive-flow research (including
          work by Green, Krishnan, and Sturm) as an assumption-sensitive stress zone where volatility{' '}
          <em>may</em> begin rising sharply. GhostFlow does not replicate proprietary Tier-1 Alpha, Mike Green, or any
          paid flow model — it uses simplified public framing only. The 65% line is{' '}
          <strong className="text-zinc-300">not</strong> a guaranteed crash line. This dashboard uses mock proxy data;
          future versions may refine passive-share estimates.
        </p>
        <p className="mt-2 text-xs text-amber-300/90">
          Current mock passive-share proxy: {data.passiveSharePercent}% ({data.passiveShareBand.rangeLabel} —{' '}
          {data.passiveShareBand.description})
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 pr-4 font-semibold">Band</th>
                <th className="py-2 font-semibold">Model interpretation</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {PASSIVE_SHARE_BANDS.map((band) => (
                <tr key={band.id} className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4 whitespace-nowrap text-zinc-300">{band.rangeLabel}</td>
                  <td className="py-2">{band.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6 border-zinc-800/80">
        <h3 className="text-base font-semibold text-zinc-100">What GhostFlow does not claim</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400 list-disc list-inside leading-relaxed">
          <li>Does not predict exact tops or bottoms or market crashes.</li>
          <li>
            Does not reproduce proprietary Tier-1 Alpha, Mike Green, or other paid / proprietary flow models.
          </li>
          <li>Does not provide buy/sell recommendations.</li>
          <li>Does not treat model thresholds as guaranteed outcomes.</li>
          <li>Does not use live data yet — this page is a static preview with mock inputs.</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-500 border-l-2 border-amber-500/35 pl-3">
          Think plumbing, not prophecy — pressure in the pipes, not a date for the flood.
        </p>
      </GlassCard>
    </section>
  );
}
