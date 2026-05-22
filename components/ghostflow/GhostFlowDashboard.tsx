import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { MOCK_GHOSTFLOW_SNAPSHOT, GHOSTFLOW_SNAPSHOT_AS_OF } from '@/data/ghostflow/mockGhostflowSnapshot';
import { scoreGhostFlowSnapshot } from '@/lib/ghostflow/scoring';
import { GhostFlowScoreCard } from './GhostFlowScoreCard';
import { GhostFlowSignalGrid } from './GhostFlowSignalGrid';
import { GhostFlowMethodology } from './GhostFlowMethodology';
import { GhostFlowWatchlist } from './GhostFlowWatchlist';

const BADGES = [
  'Static preview',
  'No live feeds yet',
  'Research only',
  'Not financial advice',
] as const;

export function GhostFlowDashboard() {
  const data = scoreGhostFlowSnapshot(MOCK_GHOSTFLOW_SNAPSHOT);

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
        <p className="text-xs text-zinc-500">Mock snapshot as of {GHOSTFLOW_SNAPSHOT_AS_OF}. Not live market data.</p>
      </header>

      <GlassCard className="p-4 sm:p-5 border-amber-500/20 bg-amber-950/15">
        <p className="text-sm text-zinc-200 leading-relaxed max-w-4xl">
          <strong className="text-amber-200/95">Disclaimer:</strong> GhostFlow is for education and research only. Scores
          and signals are illustrative mock inputs — not buy/sell advice, not a crash predictor, and not a substitute
          for your own judgment.
        </p>
      </GlassCard>

      <GhostFlowScoreCard data={data} />
      <GhostFlowSignalGrid signals={data.signals} />
      <GhostFlowMethodology data={data} />
      <GhostFlowWatchlist />
    </div>
  );
}
