'use client';

import { useState, useMemo } from 'react';
import { GlassCard } from '@/components/GlassCard';
import {
  GHOSTYIELD_REFERENCE_AS_OF,
  GHOSTYIELD_SCORED_CANDIDATES,
  GHOSTYIELD_SAMPLE_ENV,
  YIELD_SLEEVE_CATEGORIES,
} from '@/lib/ghostyield/sampleCandidates';
import { YieldEnvironmentGauge } from '@/components/ghostyield/YieldEnvironmentGauge';
import { SleeveCategoryCards } from '@/components/ghostyield/SleeveCategoryCards';
import { CandidateTable } from '@/components/ghostyield/CandidateTable';
import { CandidateDetailPanel } from '@/components/ghostyield/CandidateDetailPanel';
import { DataFreshnessPanel } from '@/components/ghostyield/DataFreshnessPanel';

export function GhostYieldDashboard() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(() =>
    GHOSTYIELD_SCORED_CANDIDATES[0]?.ticker ?? null
  );

  const selected = useMemo(
    () => GHOSTYIELD_SCORED_CANDIDATES.find((c) => c.ticker === selectedTicker) ?? null,
    [selectedTicker]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">GhostYield</h1>
        <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
          Yield sleeve research dashboard — not a model portfolio, not a recommendation engine.{' '}
          <span className="text-zinc-200">
            Phase 4.1 keeps a manually maintained research snapshot: numeric fields are filled only when they can be
            tied to the cited sponsor or linked filings; otherwise they are left null. Live feeds and automated source
            validation are not active.
          </span>{' '}
          GhostYield compares how income-producing funds generate cash, what risks they layer on top of a core
          portfolio, whether NAV is cooperating, and whether distributions look durable or stretched.
        </p>
      </header>

      <GlassCard className="p-4 sm:p-5 border-amber-500/20 bg-amber-950/15">
        <p className="text-sm text-zinc-200 leading-relaxed">
          <strong className="text-amber-200/95">Disclaimer:</strong> GhostYield does not recommend purchases or
          allocations. It helps evaluate yield-producing sleeves by risk source, NAV behavior, distribution
          quality, and current conditions. High headline yield can come with credit risk, NAV erosion, leverage,
          option strategy drag, or return-of-capital mechanics. Research only. Not financial advice.
        </p>
      </GlassCard>

      <YieldEnvironmentGauge env={GHOSTYIELD_SAMPLE_ENV} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Sleeve categories</h2>
        <SleeveCategoryCards categories={YIELD_SLEEVE_CATEGORIES} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Candidate screener (Phase 4.1 manual JSON research snapshot)
        </h2>
        <CandidateTable
          candidates={GHOSTYIELD_SCORED_CANDIDATES}
          selectedTicker={selectedTicker}
          onSelect={setSelectedTicker}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CandidateDetailPanel candidate={selected} />
        </div>
        <div>
          <DataFreshnessPanel
            candidates={GHOSTYIELD_SCORED_CANDIDATES}
            selected={selected}
            referenceAsOf={GHOSTYIELD_REFERENCE_AS_OF}
          />
        </div>
      </div>

      <GlassCard className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-2">Methodology (Phase 4.1)</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          <span className="text-zinc-300">
            Phase 4.1 is still a manual research snapshot, not a live data product. Unverifiable numbers stay null even
            if a sponsor URL exists; live feeds and automated source validation are not active.
          </span>{' '}
          Rows in{' '}
          <code className="text-amber-400/90">data/ghostyield/candidates.manual.json</code> carry sponsor links and
          as-of fields for manual review — deterministic scoring still lives in{' '}
          <code className="text-amber-400/90">lib/ghostyield/scoring.ts</code> and freshness rules in{' '}
          <code className="text-amber-400/90">lib/ghostyield/dataFreshness.ts</code>. Risk rises with high headline
          yield, leverage, NAV decay, rich premiums, weak distribution labels, stale or missing figures, and gaps
          between payout and earnings-style yields. Fit rewards fresher data, steadier NAV, and cleaner payout math on
          paper — not a live model.
        </p>
      </GlassCard>
    </div>
  );
}
