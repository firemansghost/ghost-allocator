import { GlassCard } from '@/components/GlassCard';
import { PASSIVE_SHARE_BANDS } from '@/lib/ghostflow/scoring';
import { BREADTH_STRENGTH_ANCHORS } from '@/lib/ghostflow/artifacts/marketBreadth';
import { INDEX_CONCENTRATION_ANCHORS } from '@/lib/ghostflow/artifacts/indexConcentration';
import { ACTIVE_INDEX_DIFFERENTIAL_ANCHORS } from '@/lib/ghostflow/artifacts/activeIndexFlow';
import { ETF_ISSUANCE_PROXY_ANCHORS } from '@/lib/ghostflow/artifacts/etfNetIssuance';
import { VIX_PROXY_ANCHORS } from '@/lib/ghostflow/artifacts/volatilityRegime';
import type { GhostFlowDashboardData } from '@/lib/ghostflow/types';
import type { ReactNode } from 'react';

function MethodologyDetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-zinc-800/80 bg-neutral-950/30">
      <summary className="cursor-pointer list-none p-4 sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <span
            aria-hidden
            className="text-zinc-500 text-xs shrink-0 transition-transform group-open:rotate-180"
          >
            ▼
          </span>
        </div>
      </summary>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">{children}</div>
    </details>
  );
}

export function GhostFlowMethodology({
  data,
  volRegimeAsOf,
  volRegimeSource,
  etfFlowAsOf,
  etfFlowSource,
  activeIndexFlowAsOf,
  activeIndexFlowSource,
  indexConcentrationAsOf,
  indexConcentrationSource,
  passiveShareProxyAsOf,
  passiveShareProxySource,
  breadthAsOf,
  breadthSource,
}: {
  data: GhostFlowDashboardData;
  volRegimeAsOf?: string;
  volRegimeSource?: 'public' | 'mock_fallback';
  etfFlowAsOf?: string;
  etfFlowSource?: 'public' | 'mock_fallback';
  activeIndexFlowAsOf?: string;
  activeIndexFlowSource?: 'public' | 'mock_fallback';
  indexConcentrationAsOf?: string;
  indexConcentrationSource?: 'public' | 'mock_fallback';
  passiveShareProxyAsOf?: string;
  passiveShareProxySource?: 'public' | 'mock_fallback';
  breadthAsOf?: string;
  breadthSource?: 'public' | 'mock_fallback';
}) {
  return (
    <section className="space-y-4" aria-labelledby="ghostflow-methodology-heading">
      <h2 id="ghostflow-methodology-heading" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Methodology &amp; model zones
      </h2>
      <p className="text-xs text-zinc-500">
        Trust &amp; clarity pass v1.3a — scoring weights unchanged; display-only artifact cards documented separately
        from composite inputs.
      </p>

      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base font-semibold text-zinc-100">Scoring model</h3>
        <div className="mt-3 space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">GhostFlow Research Composite</strong> = 50% Passive Pressure Score + 50% Structural
            Fragility Score. Weights are fixed and documented below. The composite uses <strong className="text-zinc-300">six
            score-fed public artifacts</strong> (ETF issuance, VIX, ICI index share, active/index flows, SPY concentration,
            breadth), <strong className="text-zinc-300">one derived structural input</strong> (model-zone proximity from ICI
            index share), and <strong className="text-zinc-300">three static MOCK passive inputs</strong> (systematic **62**,
            retirement-flow **58**, levered ETF **55**). Four <strong className="text-zinc-300">display-only public artifact
            cards</strong> (CFTC TFF positioning, levered ETF rebalance estimate, retirement asset growth, OCC index options
            intensity from Daily Volume Statistics) show measured context but do <strong className="text-zinc-300">not</strong>{' '}
            feed the composite. The scored options/vol input remains CBOE VIX — not the OCC activity card (not 0DTE/GEX). The ICI
            index share score
            input is not a market-wide passive-share estimate.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-zinc-800/80 bg-neutral-950/40 p-3">
              <p className="font-semibold text-zinc-300 mb-2">Passive Pressure</p>
              <ul className="space-y-1 text-zinc-500">
                <li>25% ETF / fund-flow impulse (public ICI weekly in v0.3+)</li>
                <li>20% systematic strategy pressure</li>
                <li>20% options / volatility amplifier (public VIX)</li>
                <li>20% retirement-flow pressure proxy</li>
                <li>15% levered ETF rebalance pressure</li>
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-neutral-950/40 p-3">
              <p className="font-semibold text-zinc-300 mb-2">Structural Fragility</p>
              <ul className="space-y-1 text-zinc-500">
                <li>30% ICI index share proxy (public ICI monthly assets in v0.6)</li>
                <li>20% active share / offset proxy (public ICI monthly flow-tilt in v0.4+)</li>
                <li>20% index concentration (public SSGA SPY monthly top-10 weights in v0.5)</li>
                <li>15% breadth weakness (public StockCharts $SPXA50R daily in v0.7)</li>
                <li>15% model-zone proximity</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassCard>

      <p className="text-xs text-zinc-500">Methodology details: expand per artifact.</p>

      <MethodologyDetailsSection title="ICI Index Share Proxy public artifact">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">What it is:</strong> ICI domestic equity index fund + ETF assets as a
            share of active + index domestic equity fund assets, from the monthly Total Net Assets table (not the Flows
            table). Stored as a percent (e.g. 63.2) and wired into the ICI index share structural sub-input using
            identity mapping: <code className="text-zinc-300">round(percent)</code> clamped 0–100.
          </p>
          <p>
            <strong className="text-zinc-300">What it is not:</strong> not true market passive share, not
            Green/Krishnan/Sturm model passive share, not market ownership, not float ownership, not trading volume,
            not marginal price-setting, and not proof of crash risk.
          </p>
          <p>
            <strong className="text-zinc-300">Why domestic equity:</strong> cleaner equity market-structure proxy than
            all long-term assets (which mix bond and hybrid index funds).
          </p>
          <p>
            <strong className="text-zinc-300">Why assets not flows:</strong> share is a stock/level concept. ETF
            issuance (v0.3) and active/index flow differential (v0.4) already cover flow pressure.
          </p>
          <p>
            <strong className="text-zinc-300">Relationship to the 65% zone:</strong> 65% is an assumption-sensitive
            model stress zone from published passive-flow research, not a guaranteed crash line. Distance-to-65 is
            derived from this public proxy for context only, not a calibrated model forecast.
          </p>
          <p>
            <strong className="text-zinc-300">Source:</strong>{' '}
            <a
              href="https://www.ici.org/research/stats/combined_active_index"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              ICI Active and Index Investing release
            </a>{' '}
            Total Net Assets, Equity → Domestic equity, Active and Index columns. Manual artifact only; no live
            fetches.
          </p>
          {passiveShareProxySource === 'public' && passiveShareProxyAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact month ended {passiveShareProxyAsOf}.</p>
          )}
          {passiveShareProxySource === 'mock_fallback' && (
            <p className="text-xs text-amber-300/90">
              Public artifact unavailable. ICI Index Share Proxy is on mock fallback until the artifact is repaired.
            </p>
          )}
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Stale policy (monthly):</strong> calendar days since ICI release date
            (publishedAt, or month ended if absent): 0–35 = fresh; 36–55 = caution; &gt;55 = stale. Caution between
            monthly updates is expected for manual artifacts.
          </p>
          <p className="text-xs text-zinc-500 border-l-2 border-amber-500/35 pl-3">
            This is a public fund-industry proxy. Useful plumbing context, not the market&apos;s true passive ownership
            map.
          </p>
        </div>
      </MethodologyDetailsSection>

      <MethodologyDetailsSection
        title={`Why ${data.passiveSharePercent}% is not a market-wide passive-share estimate`}
      >
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">{data.passiveSharePercent}%</strong> = ICI domestic equity index mutual
            fund + ETF assets divided by active + index domestic equity mutual fund + ETF assets. That is a narrow
            fund-industry product-structure denominator.
          </p>
          <p>
            Broader market-structure passive-share estimates try to approximate passive share across the equity market or
            price-setting ecosystem. Those wider definitions often land closer to the{' '}
            <strong className="text-zinc-300">mid-50% range</strong>, not because GhostFlow is wrong, but because the
            denominators differ.
          </p>
          <p>
            Read the ICI proxy as fund/ETF index-vs-active product mix, not total market passive ownership, float
            ownership, trading volume, or Green/Krishnan/Sturm model passive-share input.
          </p>
          <p>
            The <strong className="text-zinc-300">65% zone</strong> remains an assumption-sensitive model stress zone
            from published passive-flow research, not a guaranteed crash line. Distance-to-65 is derived from this ICI
            proxy for context only.
          </p>
        </div>
      </MethodologyDetailsSection>

      <MethodologyDetailsSection title="Index Concentration public artifact">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">What it is:</strong> Sum of S&amp;P 500 index weights for the 10 largest
            constituents, manually extracted from the SSGA SPY US monthly fact sheet. Stored as a percent (e.g. 36.5)
            and mapped to a 0–100 structural fragility proxy wired into the index concentration sub-input.
          </p>
          <p>
            <strong className="text-zinc-300">What it is not:</strong> not passive share, not ownership share, not
            proof passive flows caused concentration, not automatically bad, and not a crash countdown.
          </p>
          <p>
            <strong className="text-zinc-300">Why monthly:</strong> verified manual snapshot from the monthly fact
            sheet, no live feeds in v0.5. The SSGA product page “Index Top Holdings” is a backup cross-check only.
          </p>
          <p>
            <strong className="text-zinc-300">Why top 10:</strong> simple public concentration proxy; HHI and deeper
            ownership metrics deferred.
          </p>
          <p>
            <strong className="text-zinc-300">Source:</strong>{' '}
            <a
              href="https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-spy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              SSGA SPY US Monthly Fact Sheet
            </a>{' '}
            Top 10 holdings index weights. Manual artifact only; no live fetches.
          </p>
          {indexConcentrationSource === 'public' && indexConcentrationAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact month ended {indexConcentrationAsOf}.</p>
          )}
          {indexConcentrationSource === 'mock_fallback' && (
            <p className="text-xs text-amber-300/90">
              Public artifact unavailable. Concentration is on mock fallback until the artifact is repaired.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Top 10 index weight (%)</th>
                  <th className="py-2 pr-4 font-semibold">Proxy (0–100)</th>
                  <th className="py-2 font-semibold">Band label</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">≤ 22</td>
                  <td className="py-2 pr-4 tabular-nums">20</td>
                  <td className="py-2">Broad / lower concentration</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">22 → 28</td>
                  <td className="py-2 pr-4 tabular-nums">20 → 40</td>
                  <td className="py-2">Moderate</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">28 → 33</td>
                  <td className="py-2 pr-4 tabular-nums">40 → 58</td>
                  <td className="py-2">Elevated</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">33 → 37</td>
                  <td className="py-2 pr-4 tabular-nums">58 → 72</td>
                  <td className="py-2">Top-heavy</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">37 → 40</td>
                  <td className="py-2 pr-4 tabular-nums">72 → 85</td>
                  <td className="py-2">Highly concentrated</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">≥ 40</td>
                  <td className="py-2 pr-4 tabular-nums">85 (cap)</td>
                  <td className="py-2">Highly concentrated</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500">
            Linear interpolation between anchors (
            {INDEX_CONCENTRATION_ANCHORS.map((a) => `${a.percent}→${a.proxy}`).join(', ')}).
          </p>
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Stale policy (monthly):</strong> calendar days since PDF
            control/publication date (publishedAt, or month ended if absent): 0–35 = fresh; 36–55 = caution; &gt;55 =
            stale. Caution between monthly updates is expected for manual artifacts. Valid stale artifacts still
            display with warning.
          </p>
          <p className="text-xs text-zinc-500 border-l-2 border-amber-500/35 pl-3">
            Cap-weight concentration can reflect earnings dominance, momentum, valuation, passive flows, or all of the
            above. Useful fragility context, not a verdict.
          </p>
        </div>
      </MethodologyDetailsSection>

      <MethodologyDetailsSection title="Active vs Index Flow Differential public artifact">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">What it is:</strong> ICI monthly domestic-equity{' '}
            <strong className="text-zinc-300">Active</strong> and <strong className="text-zinc-300">Index</strong> net
            cash flows (long-term mutual funds + ETFs combined). GhostFlow computes a flow differential (index minus
            active) and maps it to a 0–100 flow-tilt proxy wired into the active share / offset sub-input.
          </p>
          <p>
            <strong className="text-zinc-300">What it is not:</strong> not passive share, not ownership share, not true
            active-offset capacity, and not proprietary flow modeling. A monthly public flow-tilt proxy only.
          </p>
          <p>
            <strong className="text-zinc-300">Why monthly:</strong> ICI publishes the active/index split on a monthly
            cadence. Weekly active/index decomposition is not available in ICI public tables; weekly refresh would
            imply fake precision.
          </p>
          <p>
            <strong className="text-zinc-300">Relationship to ETF artifact:</strong> the ETF artifact (v0.3) tracks
            weekly domestic-equity ETF creation/redemption pressure. This artifact tracks monthly style-flow tilt toward
            index versus active, complementary dimensions, not redundant copies.
          </p>
          <p>
            <strong className="text-zinc-300">Source:</strong>{' '}
            <a
              href="https://www.ici.org/research/stats/combined_active_index"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              ICI Active and Index Investing release
            </a>{' '}
            Flows table, Equity → Domestic equity, Active and Index columns. Manual artifact only; no live fetches.
          </p>
          {activeIndexFlowSource === 'public' && activeIndexFlowAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact month ended {activeIndexFlowAsOf}.</p>
          )}
          {activeIndexFlowSource === 'mock_fallback' && (
            <p className="text-xs text-amber-300/90">
              Public artifact unavailable. Active-index-flow is on mock fallback until the artifact is repaired.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="py-2 pr-4 font-semibold">Flow differential (monthly, $M)</th>
                  <th className="py-2 pr-4 font-semibold">Proxy (0–100)</th>
                  <th className="py-2 font-semibold">Band label</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">≤ 0</td>
                  <td className="py-2 pr-4 tabular-nums">20</td>
                  <td className="py-2">Active tilt / balanced</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">0 to 20,000</td>
                  <td className="py-2 pr-4 tabular-nums">20 → 45</td>
                  <td className="py-2">Modest index-flow tilt</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">20,000 to 50,000</td>
                  <td className="py-2 pr-4 tabular-nums">45 → 70</td>
                  <td className="py-2">Elevated index-flow tilt</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">50,000 to 80,000</td>
                  <td className="py-2 pr-4 tabular-nums">70 → 85</td>
                  <td className="py-2">Strong index-flow tilt</td>
                </tr>
                <tr className="border-b border-zinc-800/60">
                  <td className="py-2 pr-4">≥ 80,000</td>
                  <td className="py-2 pr-4 tabular-nums">85 (cap)</td>
                  <td className="py-2">Strong index-flow tilt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500">
            Differential = index domestic-equity flow minus active domestic-equity flow (both in millions USD). Linear
            interpolation between anchors (
            {ACTIVE_INDEX_DIFFERENTIAL_ANCHORS.map((a) => `${a.millions}→${a.proxy}`).join(', ')}).
          </p>
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Stale policy (monthly):</strong> calendar days since ICI release date
            (publishedAt, or month ended if absent): 0–35 = fresh; 36–55 = caution; &gt;55 = stale. Caution between
            monthly updates is expected for manual artifacts. Valid stale artifacts still display with warning. ICI may
            revise prior months.
          </p>
          <p className="text-xs text-zinc-500 border-l-2 border-amber-500/35 pl-3">
            This is a flow-tilt proxy. Useful plumbing, not a full map of price discovery.
          </p>
        </div>
      </MethodologyDetailsSection>

      <MethodologyDetailsSection title="ETF Net Issuance public artifact">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">What it is:</strong> ICI{' '}
            <em>estimated weekly net issuance</em> for <strong className="text-zinc-300">domestic equity ETFs</strong>{' '}
            creation minus redemption from the industry&apos;s weekly release. Stored in millions USD; displayed as
            rounded billions (e.g. $33.9B).
          </p>
          <p>
            <strong className="text-zinc-300">What it is not:</strong> not mutual fund flows, not total ETF market
            issuance, not passive-share level, and not a complete mechanical-bid or passive-flow model. One flow proxy
            among several.
          </p>
          <p>
            <strong className="text-zinc-300">Why weekly:</strong> matches ICI release cadence. Daily refresh would imply
            fake precision. The underlying series is a weekly estimate that may be revised.
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
            Equity → Domestic row. Manual artifact only; no live fetches.
          </p>
          {etfFlowSource === 'public' && etfFlowAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact week ended {etfFlowAsOf}.</p>
          )}
          {etfFlowSource === 'mock_fallback' && (
            <p className="text-xs text-amber-300/90">
              Public artifact unavailable. Etf-flow is on mock fallback until the artifact is repaired.
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
      </MethodologyDetailsSection>

      <MethodologyDetailsSection title="Volatility Regime public artifact">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
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
            manually updated daily close. VIX is a volatility amplifier proxy, not passive flow and not a crash
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
      </MethodologyDetailsSection>

      <MethodologyDetailsSection title="Market Breadth Participation public artifact">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            <strong className="text-zinc-300">What it is:</strong> StockCharts{' '}
            <a
              href="https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              $SPXA50R
            </a>{' '}
            — the percentage of S&P 500 constituents trading above their own 50-day moving average. Mapped inversely
            into the breadth weakness structural sub-input (higher participation → lower weakness score).
          </p>
          <p>
            <strong className="text-zinc-300">Why 50DMA:</strong> More responsive to current participation than 200DMA,
            which moves slowly and is better suited as optional context later. 50DMA breadth fits a daily manual
            artifact without pretending to time crashes.
          </p>
          <p>
            <strong className="text-zinc-300">Why not 200DMA yet:</strong> Deferred to optional observations only.
            v0.7 keeps one scored series to avoid fake precision and mixed-vendor complexity.
          </p>
          <p>
            <strong className="text-zinc-300">Pairs with Index Concentration:</strong> Concentration tracks cap-weight
            top-10 dominance; breadth tracks how many names are in short-term uptrends. Both can flag a narrow market
            or diverge — neither proves passive flows caused narrowing.
          </p>
          {breadthSource === 'public' && breadthAsOf && (
            <p className="text-xs text-amber-300/90">Current public artifact as of {breadthAsOf}.</p>
          )}
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Mapping (strength % → weakness proxy):</strong>{' '}
            {BREADTH_STRENGTH_ANCHORS.map((a) => `${a.strength}%→${a.weakness}`).join(', ')} (linear interpolation,
            clamped 0–100).
          </p>
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Stale policy (daily):</strong> 0–2 trading days = fresh; 3–5 = caution;
            &gt;5 = stale. Same rules as VIX.
          </p>
          <p className="text-xs text-zinc-500 border-l-2 border-amber-500/35 pl-3">
            Participation proxy only — not a crash signal. Weak breadth can persist; strong breadth does not guarantee
            safety. Structural context, not timing advice.
          </p>
        </div>
      </MethodologyDetailsSection>

      <MethodologyDetailsSection title="ICI index share proxy model stress zones">
        <p className="text-sm text-zinc-400 leading-relaxed">
          The <strong className="text-zinc-300">65% zone</strong> is drawn from published passive-flow research as an
          assumption-sensitive stress zone. The public ICI fund/ETF index share proxy supplies the level display when
            available; model-zone proximity sub-input is derived from the same distance-to-65 mapping when the ICI
          artifact is present (v0.9b). This is not a market-wide passive-share estimate.
        </p>
        <p className="mt-2 text-xs text-amber-300/90">
          Current ICI fund/ETF index share: {data.passiveSharePercent}% ({data.passiveShareBand.rangeLabel},{' '}
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
      </MethodologyDetailsSection>

      <GlassCard className="p-4 sm:p-6 border-zinc-800/80">
        <h3 className="text-base font-semibold text-zinc-100">What GhostFlow does not claim</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400 list-disc list-inside leading-relaxed">
          <li>Does not predict exact tops or bottoms or market crashes.</li>
          <li>Does not provide buy/sell recommendations.</li>
          <li>Does not treat model thresholds as guaranteed outcomes.</li>
          <li>
            Does not use live feeds. Six score-fed manual public artifacts plus four display-only public cards and static MOCK
            composite inputs elsewhere.
          </li>
          <li>
            Does not treat display-only CFTC, levered ETF rebalance, retirement asset-growth, or OCC index options intensity
            cards as Research Composite inputs — MOCK **62**, **55**, and **58** still drive those passive sub-inputs; VIX still
            drives options/vol.
          </li>
          <li>
            Does not treat ETF net issuance, active/index flow differential, ICI Index Share Proxy, index
            concentration, market breadth participation, or VIX as complete mechanical-flow or true passive-share
            measures.
          </li>
          <li>Does not claim the ICI {data.passiveSharePercent}% proxy equals a market-wide passive-share estimate.</li>
        </ul>
        <p className="mt-3 text-sm text-zinc-500 border-l-2 border-amber-500/35 pl-3">
          Think plumbing, not prophecy: pressure in the pipes, not a date for the flood.
        </p>
      </GlassCard>
    </section>
  );
}
