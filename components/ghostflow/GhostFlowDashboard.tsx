import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildGhostFlowSnapshot } from '@/lib/ghostflow/buildSnapshot';
import { scoreGhostFlowSnapshot } from '@/lib/ghostflow/scoring';
import { GhostFlowCurrentRead } from './GhostFlowCurrentRead';
import { GhostFlowScoreCard } from './GhostFlowScoreCard';
import { GhostFlowSignalGrid } from './GhostFlowSignalGrid';
import { GhostFlowMethodology } from './GhostFlowMethodology';
import { GhostFlowWatchlist } from './GhostFlowWatchlist';

const BADGES = [
  'Static preview',
  '6 manual public artifacts',
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
  const passiveShareAsOf = meta.passiveShareProxyAsOf;
  const breadthAsOf = meta.breadthAsOf;

  const dateParts: string[] = [];
  if (volAsOf) dateParts.push(`VIX as of ${volAsOf}`);
  if (breadthAsOf) dateParts.push(`Breadth as of ${breadthAsOf}`);
  if (etfWeekEnded) dateParts.push(`ETF week ended ${etfWeekEnded}`);
  if (activeIndexMonthEnded) dateParts.push(`Active/index month ended ${activeIndexMonthEnded}`);
  if (indexConcentrationAsOf) dateParts.push(`Concentration month ended ${indexConcentrationAsOf}`);
  if (passiveShareAsOf) dateParts.push(`ICI index share month ended ${passiveShareAsOf}`);

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
          proxies. It does not predict crashes. It watches whether price discovery is sharing the wheel with autopilot.
        </p>
        {dateParts.length > 0 && (
          <p className="text-xs text-zinc-500">{dateParts.join(' · ')}</p>
        )}
      </header>

      <GlassCard className="p-4 sm:p-5 border-amber-500/20 bg-amber-950/15">
        <p className="text-sm text-zinc-200 leading-relaxed max-w-4xl">
          <strong className="text-amber-200/95">Disclaimer:</strong> GhostFlow is for education and research only. Six
          manually updated public artifacts (CBOE VIX, StockCharts S&P 500 % above 50-day MA breadth, ICI ETF issuance,
          ICI active/index flows, SSGA SPY top-10 concentration, ICI fund/ETF index share proxy) feed part of the score;
          remaining inputs are static mock proxies. Not financial advice, not a crash predictor, and not a substitute
          for your own judgment. The ICI proxy is not a market-wide passive-share estimate. Breadth is a participation
          proxy, not proof passive flows caused market narrowing.
        </p>
      </GlassCard>

      <GhostFlowCurrentRead data={data} passiveShareProxySource={meta.passiveShareProxySource} />

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
        passiveShareProxyAsOf={meta.passiveShareProxyAsOf}
        passiveShareProxySource={meta.passiveShareProxySource}
        breadthAsOf={meta.breadthAsOf}
        breadthSource={meta.breadthSource}
      />
      <GhostFlowWatchlist />
    </div>
  );
}
