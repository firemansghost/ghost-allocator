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
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md border border-amber-500/35 bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
            Manual snapshot
          </span>
          <span className="inline-flex items-center rounded-md border border-zinc-600/80 bg-zinc-900/45 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Not live data
          </span>
        </div>
        <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
          GhostYield is a yield sleeve research dashboard for comparing income-producing funds around an existing
          portfolio. It looks at yield source, NAV behavior, payout quality, data freshness, and sleeve risk — not just
          headline yield. Not a model portfolio and not a recommendation engine.
        </p>
        <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
          Phase 4.11 uses a manually maintained JSON research snapshot. Live feeds and automated source validation are not
          active yet.
        </p>
      </header>

      <GlassCard className="p-4 sm:p-5 border-amber-500/20 bg-amber-950/15">
        <p className="text-sm text-zinc-200 leading-relaxed max-w-3xl">
          <strong className="text-amber-200/95">Disclaimer:</strong> GhostYield does not recommend purchases or
          allocations. It helps you evaluate yield-producing sleeves by risk source, NAV behavior, distribution quality,
          and current conditions. High headline yield can come with credit risk, NAV erosion, leverage, option strategy
          drag, or return-of-capital mechanics. <strong className="text-zinc-100">Research only. Not financial advice.</strong>
        </p>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5 border-zinc-800/80 bg-zinc-950/35">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">What GhostYield is — and is not</h2>
        <div className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/85">GhostYield is</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 leading-snug">
              <li>A yield sleeve research dashboard</li>
              <li>
                A way to compare income-producing funds by yield source, NAV behavior, payout quality, data quality, and
                sleeve risk
              </li>
              <li>A tool for asking better questions before adding yield around an existing portfolio</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">GhostYield is not</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 leading-snug">
              <li>A buy/sell recommendation engine</li>
              <li>A complete portfolio builder</li>
              <li>A promise that high yield equals high return</li>
              <li>A substitute for reading fund documents, filings, and tax details</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-zinc-500 italic border-t border-zinc-800/60 pt-3">
          Yield is not magic. It is usually compensation for some kind of risk — including credit, leverage, NAV erosion,
          option strategy drag, or return-of-capital mechanics.
        </p>
      </GlassCard>

      <YieldEnvironmentGauge env={GHOSTYIELD_SAMPLE_ENV} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Sleeve categories</h2>
        <SleeveCategoryCards categories={YIELD_SLEEVE_CATEGORIES} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Candidate screener (Phase 4.11 manual JSON research snapshot)
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-4xl border-l-2 border-zinc-700 pl-3">
          <span className="text-zinc-300">Screener guide:</span> Yield uses the best available sourced metric on each row:
          current yield, then distribution rate, then SEC yield. <span className="text-zinc-300">Payout</span> reflects
          distribution quality from the snapshot. <span className="text-zinc-300">Data QA</span> reflects source-data
          freshness and completeness — <span className="text-zinc-200">not investment risk</span> (gaps don&apos;t
          automatically mean a bad fund; fresh doesn&apos;t automatically mean safe).{' '}
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
        <h2 className="text-sm font-semibold text-zinc-200 mb-2">Methodology & source data (Phase 4.11)</h2>
        <div className="text-sm text-zinc-400 leading-relaxed space-y-3 max-w-4xl">
          <p className="text-zinc-300">
            <span className="text-zinc-200">Risk Score</span> is GhostYield&apos;s sleeve / investment risk estimate
            (structure, leverage, distribution stress signals, etc.).{' '}
            <span className="text-zinc-200">Data QA</span> (the Source & data quality column and badges) is only about how
            complete and fresh the manual snapshot is for that row. Read them together — they answer different questions —
            and do not treat one as a substitute for the other.
          </p>
          <p className="text-zinc-300">
            Manual JSON research snapshot only — not live pricing or feeds. Phase 4.11 keeps the same discipline: fields
            are filled only when a number can be tied to a <span className="text-zinc-200">cited source</span> (sponsor
            page, factsheet PDF, CEF Connect summary, SEC filing, etc.); otherwise they stay{' '}
            <span className="text-zinc-200">null</span>. A Phase 4.4 refresh updated several ETF and option-income rows
            from sponsor PDFs and SEC documents; the grid remains manually maintained and static.
          </p>
          <p>
            Some closed-end rows cite <span className="text-zinc-300">CEF Connect</span> (Nuveen / Morningstar-style
            summaries) as an <span className="text-zinc-300">interim secondary</span> source for figures — always read each
            row&apos;s <span className="text-zinc-300">sourceLabel</span> and{' '}
            <span className="text-zinc-300">sourceUrl</span> for what was actually used, not an assumed sponsor-primary
            chain. <span className="text-zinc-300">No automated source validation.</span>
          </p>
          <p>
            Phase 4.11 clarifies screener copy so <span className="text-zinc-300">Data QA</span> (snapshot completeness)
            is not confused with <span className="text-zinc-300">Risk Score</span> (investment / sleeve risk). Rows in{' '}
            <code className="text-amber-400/90">data/ghostyield/candidates.manual.json</code> carry{' '}
            <span className="text-zinc-300">sourceUrl</span>, <span className="text-zinc-300">sourceLabel</span>, and
            lineage as-of fields — scoring in{' '}
            <code className="text-amber-400/90">lib/ghostyield/scoring.ts</code>, freshness in{' '}
            <code className="text-amber-400/90">lib/ghostyield/dataFreshness.ts</code>. The screener Yield column prefers
            current yield, then distribution rate, then SEC yield (see detail panel).
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
