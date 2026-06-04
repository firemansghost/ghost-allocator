import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildGhostFlowSnapshot } from '@/lib/ghostflow/buildSnapshot';
import { scoreGhostFlowSnapshot } from '@/lib/ghostflow/scoring';
import { GhostFlowCurrentRead } from './GhostFlowCurrentRead';
import { GhostFlowFreshnessSummary } from './GhostFlowFreshnessSummary';
import { GhostFlowScoreCard } from './GhostFlowScoreCard';
import { GhostFlowScoreDrivers } from './GhostFlowScoreDrivers';
import { GhostFlowSignalGrid } from './GhostFlowSignalGrid';
import { GhostFlowMethodology } from './GhostFlowMethodology';
import { GhostFlowPassiveEndgameScenarios } from './GhostFlowPassiveEndgameScenarios';
import { GhostFlowWatchlist } from './GhostFlowWatchlist';

const HEADER_BADGES = ['Static preview', 'Research only', 'Not a forecast', 'Not financial advice'] as const;

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
          {HEADER_BADGES.map((badge) => (
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
          A market-structure research preview for watching the mechanical bid underneath modern markets.
        </p>
        {dateParts.length > 0 && (
          <p className="text-xs text-zinc-500">{dateParts.join(' · ')}</p>
        )}
      </header>

      <GhostFlowCurrentRead data={data} passiveShareProxySource={meta.passiveShareProxySource} />

      <GhostFlowScoreCard data={data} passiveShareProxySource={meta.passiveShareProxySource} />

      <GhostFlowFreshnessSummary publicSignals={meta.publicSignals} />

      <GlassCard className="p-4 sm:p-5 border-amber-500/20 bg-amber-950/15">
        <p className="text-sm text-zinc-200 leading-relaxed max-w-4xl">
          <strong className="text-amber-200/95">Disclaimer:</strong> GhostFlow is an education and research preview
          only—six manual public artifacts, one derived score input (model-zone proximity from ICI index share), and
          three static mock score inputs in the research composite. Not financial
          advice.{' '}
          <strong className="text-amber-200/90">Not a market-wide passive-share estimate.</strong>{' '}
          <strong className="text-amber-200/90">Not a crash predictor.</strong> Breadth is participation context, not
          proof passive flows caused narrowing. Full methodology below.
        </p>
      </GlassCard>

      {data.freshnessWarnings && data.freshnessWarnings.length > 0 && (
        <GlassCard className="p-4 sm:p-5 border-amber-500/25 bg-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90 mb-2">Artifact freshness detail</p>
          <ul className="space-y-1.5 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            {data.freshnessWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GhostFlowPassiveEndgameScenarios variant="teaser" />

      <GhostFlowSignalGrid signals={data.signals} dataMix={data.dataMix} publicSignalCount={data.publicSignalCount} />
      <GhostFlowScoreDrivers />
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
