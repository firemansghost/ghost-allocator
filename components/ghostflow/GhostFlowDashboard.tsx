import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildGhostFlowSnapshot } from '@/lib/ghostflow/buildSnapshot';
import { scoreGhostFlowSnapshot } from '@/lib/ghostflow/scoring';
import { GhostFlowScoreCard } from './GhostFlowScoreCard';
import { GhostFlowSignalGrid } from './GhostFlowSignalGrid';
import { GhostFlowMethodology } from './GhostFlowMethodology';
import { GhostFlowWatchlist } from './GhostFlowWatchlist';

const BADGES = [
  'Static preview',
  'Manual public artifacts, no live feeds',
  '4 public signals',
  'Research only',
  'Not financial advice',
] as const;

export function GhostFlowDashboard() {
  const { raw, meta } = buildGhostFlowSnapshot();
  const scored = scoreGhostFlowSnapshot(raw);
  const data = {
    ...scored,
    dataMix: meta.dataMix,
    freshnessWarnings: meta.freshnessWarnings,
    publicPassiveInputKeys: meta.publicPassiveInputKeys,
    publicStructuralInputKeys: meta.publicStructuralInputKeys,
    publicSignalCount: meta.publicSignalCount,
  };

  const volAsOf = meta.volRegimeAsOf;
  const etfWeekEnded = meta.etfFlowAsOf;
  const activeIndexMonthEnded = meta.activeIndexFlowAsOf;
  const indexConcentrationAsOf = meta.indexConcentrationAsOf;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-1 sm:px-0">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex text-sm text-amber-400/90 hover:text-amber-300 hover:underline decoration-amber-400/40"
        >
          ← Back to home
        </Link>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {BADGES.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-950/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90"
            >
              {badge}
            </span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
          GhostFlow: Passive Pressure Gauge
        </h1>
        <p className="text-sm font-medium text-zinc-300 max-w-3xl">
          A market-structure dashboard for watching the mechanical bid underneath modern markets.
        </p>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
          GhostFlow tracks passive-flow pressure, ETF issuance, concentration, volatility mechanics, and systematic-flow
          proxies. It does not predict crashes — it watches whether price discovery is sharing the wheel with autopilot.
        </p>
        <p className="text-xs text-zinc-500">
          Mixed snapshot (v0.5): Volatility Regime uses CBOE VIX
          {volAsOf ? ` as of ${volAsOf}` : ''}; ETF Net Issuance uses ICI domestic equity weekly estimated net issuance
          {etfWeekEnded ? ` (week ended ${etfWeekEnded})` : ''}; Active vs Index Flow Differential uses ICI monthly
          domestic-equity active/index net flows
          {activeIndexMonthEnded ? ` (month ended ${activeIndexMonthEnded})` : ''}; Index Concentration uses SSGA SPY
          monthly fact sheet top-10 index weights
          {indexConcentrationAsOf ? ` (as of ${indexConcentrationAsOf})` : ''}. Other inputs remain mock. Not live
          market data.
        </p>
      </header>

      {data.freshnessWarnings && data.freshnessWarnings.length > 0 && (
        <GlassCard className="p-4 sm:p-5 border-amber-500/25 bg-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90 mb-2">Data freshness</p>
          <ul className="space-y-1.5 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            {data.freshnessWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GlassCard className="p-4 sm:p-5 border-amber-500/20 bg-amber-950/15">
        <p className="text-sm text-zinc-200 leading-relaxed max-w-4xl">
          <strong className="text-amber-200/95">Disclaimer:</strong> GhostFlow is for education and research only. Four
          signals use manually updated public artifacts (CBOE VIX, ICI domestic equity ETF net issuance, ICI
          domestic-equity active/index flow differential, and SSGA SPY monthly top-10 index concentration); remaining
          scores and signals are static mock proxies — not buy/sell advice, not a crash predictor, and not a substitute
          for your own judgment.
        </p>
      </GlassCard>

      <GhostFlowScoreCard data={data} />
      <GhostFlowSignalGrid signals={data.signals} dataMix={data.dataMix} publicSignalCount={data.publicSignalCount} />
      <GhostFlowMethodology
        data={data}
        volRegimeAsOf={meta.volRegimeAsOf}
        volRegimeSource={meta.volRegimeSource}
        etfFlowAsOf={meta.etfFlowAsOf}
        etfFlowSource={meta.etfFlowSource}
        activeIndexFlowAsOf={meta.activeIndexFlowAsOf}
        activeIndexFlowSource={meta.activeIndexFlowSource}
        indexConcentrationAsOf={meta.indexConcentrationAsOf}
        indexConcentrationSource={meta.indexConcentrationSource}
      />
      <GhostFlowWatchlist />
    </div>
  );
}
