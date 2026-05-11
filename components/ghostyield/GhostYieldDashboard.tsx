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
            Phase 4.2–4.4 keeps a manual research snapshot in JSON: numbers are filled only when tied to a cited source
            (sponsor page, factsheet PDF, CEF Connect summary, or filing); otherwise null. Phase 4.4 refreshed several ETF
            and option-income rows from sponsor PDFs and SEC documents. This is not live data and automated validation
            is not active. Some closed-end rows cite CEF Connect as an interim aggregation source — see each row&apos;s
            sourceLabel, not sponsor-primary.
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
          Candidate screener (Phase 4.4 manual JSON research snapshot)
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl border-l-2 border-zinc-700 pl-3">
          <span className="text-zinc-300">Screener guide (Phase 4.6):</span> Yield uses the best available sourced
          metric on each row: current yield, then distribution rate, then SEC yield. <span className="text-zinc-300">Payout</span>{' '}
          reflects distribution quality from the snapshot. <span className="text-zinc-300">Data QA</span> reflects source-data
          freshness and completeness —{' '}
          <span className="text-zinc-200">not investment risk</span>.{' '}
          <span className="text-zinc-300">Risk Score</span> is 0–100 where higher is riskier (sleeve and structure risk).
          <span className="text-zinc-300"> Fit Score</span> is 0–100 where higher is a cleaner fit as a yield sleeve. Hover
          column headers or scores for band definitions.
        </p>
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
        <h2 className="text-sm font-semibold text-zinc-200 mb-2">Methodology (Phase 4.4)</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          <span className="text-zinc-300">
            Manual research snapshot only — not live pricing or feeds. Rows may cite sponsor URLs, CEF Connect (Nuveen /
            Morningstar summaries) as an interim secondary source for some CEF figures, or SEC links; sourceLabel on each
            row states what was used. Unverifiable fields stay null.
          </span>{' '}
          Phase 4.6 clarifies screener columns so <span className="text-zinc-300">Data QA</span> (snapshot completeness)
          is not confused with <span className="text-zinc-300">Risk Score</span> (investment/sleeve risk).{' '}
          Rows in{' '}
          <code className="text-amber-400/90">data/ghostyield/candidates.manual.json</code> carry source URLs and as-of
          fields — scoring in{' '}
          <code className="text-amber-400/90">lib/ghostyield/scoring.ts</code>, freshness in{' '}
          <code className="text-amber-400/90">lib/ghostyield/dataFreshness.ts</code>. The screener Yield column prefers
          current yield, then distribution rate, then SEC yield (see detail panel).
        </p>
      </GlassCard>
    </div>
  );
}
