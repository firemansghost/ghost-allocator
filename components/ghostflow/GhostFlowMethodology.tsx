import { GlassCard } from '@/components/GlassCard';
import { PASSIVE_SHARE_BANDS } from '@/lib/ghostflow/scoring';
import { ETF_ISSUANCE_PROXY_ANCHORS } from '@/lib/ghostflow/artifacts/etfNetIssuance';
import { VIX_PROXY_ANCHORS } from '@/lib/ghostflow/artifacts/volatilityRegime';
import type { GhostFlowDashboardData } from '@/lib/ghostflow/types';

export function GhostFlowMethodology({
  data,
  volRegimeAsOf,
  volRegimeSource,
  etfFlowAsOf,
  etfFlowSource,
}: {
  data: GhostFlowDashboardData;
  volRegimeAsOf?: string;
  volRegimeSource?: 'public' | 'mock_fallback';
  etfFlowAsOf?: string;
  etfFlowSource?: 'public' | 'mock_fallback';
}) {
  return (
    <section className="space-y-4" aria-labelledby="ghostflow-methodology-heading">
      <h2 id="ghostflow-methodology-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Methodology &amp; model zones
      </h2>

      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">v0.3 scoring model</h3>
        <div className="mt-3 space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">GhostFlow Score</strong> = 50% Passive Pressure Score + 50% Structural
            Fragility Score. Weights are fixed and documented below. v0.3 wires two public Passive Pressure sub-inputs
            (ETF net issuance from ICI + options / volatility amplifier from CBOE VIX); all other inputs remain static
            mock proxies.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-zinc-800/80 bg-neutral-950/40 p-3">
              <p className="font-semibold text-zinc-300 mb-2">Passive Pressure</p>
              <ul className="space-y-1 text-zinc-500">
                <li>25% ETF / fund-flow impulse (public ICI in v0.3)</li>
                <li>20% systematic strategy pressure</li>
                <li>20% options / volatility amplifier (public VIX)</li>
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
        <h3 className="text-base font-semibold text-zinc-100">ETF Net Issuance public artifact (v0.3)</h3>
        <div className="mt-3 space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">What it is:</strong> ICI{' '}
            <em>estimated weekly net issuance</em> for <strong className="text-zinc-300">domestic equity ETFs</strong>{' '}
            — creation minus redemption from the industry&apos;s weekly release. Stored in millions USD; displayed as
            rounded billions (e.g. $33.9B).
          </p>
          <p>
            <strong className="text-zinc-300">What it is not:</strong> not mutual fund flows, not total ETF market
            issuance, not passive-share level, and not a complete mechanical-bid or passive-flow model. One flow proxy
            among several.
          </p>
          <p>
            <strong className="text-zinc-300">Why weekly:</strong> matches ICI release cadence. Daily refresh would imply
            fake precision — the underlying series is a weekly estimate that may be revised.
          </p>
          <p>
            <strong className="text-zinc-300">Source:</strong>{' '}
            <a
              href="https://www.ici.org/research/stats/etf_flows"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              ICI Estimated ETF Net Issuance release
            </a>{' '}
            — Equity → Domestic row. Manual artifact only; no live fetches.
          </p>
          {etfFlowSource === 'public' && etfFlowAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact week ended {etfFlowAsOf}.</p>
          )}
          {etfFlowSource === 'mock_fallback' && (
            <p className="text-xs text-amber-300/90">
              Public artifact unavailable — etf-flow is on mock fallback until the artifact is repaired.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Domestic equity net issuance (weekly, $M)</th>
                  <th className="py-2 pr-4 font-semibold">Proxy (0–100)</th>
                  <th className="py-2 font-semibold">Band label</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">≤ -10,000</td>
                  <td className="py-2 pr-4 tabular-nums">15</td>
                  <td className="py-2">Quiet outflow</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">-10,000 to 0</td>
                  <td className="py-2 pr-4 tabular-nums">15 → 35</td>
                  <td className="py-2">Outflow</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">0 to 15,000</td>
                  <td className="py-2 pr-4 tabular-nums">35 → 55</td>
                  <td className="py-2">Moderate inflow</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">15,000 to 30,000</td>
                  <td className="py-2 pr-4 tabular-nums">55 → 72</td>
                  <td className="py-2">Elevated weekly inflow pressure</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">≥ 30,000</td>
                  <td className="py-2 pr-4 tabular-nums">72 → 88 (cap)</td>
                  <td className="py-2">Elevated weekly inflow pressure</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500">
            Linear interpolation between anchors (
            {ETF_ISSUANCE_PROXY_ANCHORS.map((a) => `${a.millions}→${a.proxy}`).join(', ')}).
          </p>
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Stale policy (weekly):</strong> calendar days since ICI release date
            (publishedAt, or week ended if absent): 0–7 = fresh; 8–14 = caution; &gt;14 = stale. Valid stale artifacts
            still display with warning. ICI weekly estimates may differ from monthly actuals and can be revised.
          </p>
          <p className="text-xs text-zinc-500 border-l-2 border-amber-500/35 pl-3">
            Plumbing gauge, not proof that autopilot dominates price discovery.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Volatility Regime public artifact (v0.2+)</h3>
        <div className="mt-3 space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">Source:</strong>{' '}
            <a
              href="https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              CBOE VIX History CSV
            </a>{' '}
            — manually updated daily close. VIX is a volatility amplifier proxy, not passive flow and not a crash
            countdown.
          </p>
          {volRegimeSource === 'public' && volRegimeAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact as of {volRegimeAsOf}.</p>
          )}
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Stale policy (daily):</strong> 0–2 trading days = fresh; 3–5 = caution;
            &gt;5 = stale.
          </p>
          <p className="text-xs text-zinc-500">
            VIX mapping anchors: {VIX_PROXY_ANCHORS.map((a) => `${a.vix}→${a.proxy}`).join(', ')}.
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Passive-share model stress zones</h3>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          The <strong className="text-zinc-300">65% zone</strong> is drawn from published passive-flow research as an
          assumption-sensitive stress zone. Passive-share inputs remain mock in v0.3.
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
          <li>Does not reproduce proprietary Tier-1 Alpha, Mike Green, or other paid / proprietary flow models.</li>
          <li>Does not provide buy/sell recommendations.</li>
          <li>Does not treat model thresholds as guaranteed outcomes.</li>
          <li>Does not use live feeds — two manual public artifacts plus mock inputs elsewhere.</li>
          <li>Does not treat ETF net issuance or VIX as complete mechanical-flow or passive-share measures.</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-500 border-l-2 border-amber-500/35 pl-3">
          Think plumbing, not prophecy — pressure in the pipes, not a date for the flood.
        </p>
      </GlassCard>
    </section>
  );
}
