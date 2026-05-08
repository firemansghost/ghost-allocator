'use client';

import type { GhostYieldCandidate } from '@/lib/ghostyield/types';
import { summarizePortfolioFreshness } from '@/lib/ghostyield/dataFreshness';
import { effectiveDataConfidence } from '@/lib/ghostyield/candidateFields';
import { GlassCard } from '@/components/GlassCard';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function DataFreshnessPanel({
  candidates,
  selected,
  referenceAsOf,
}: {
  candidates: GhostYieldCandidate[];
  selected: GhostYieldCandidate | null;
  referenceAsOf: string;
}) {
  const summary = summarizePortfolioFreshness(candidates, referenceAsOf);
  const selNav = selected?.navDataAsOf ?? null;
  const selDist = selected?.distributionDataAsOf ?? null;

  return (
    <GlassCard className="p-4 sm:p-5 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">Data freshness</h2>
      <p className="text-[11px] text-zinc-500">
        Reference as of (static):{' '}
        <span className="font-mono text-zinc-300">{referenceAsOf}</span>
      </p>
      <dl className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Latest NAV as-of (sample universe)</dt>
          <dd className="font-mono text-zinc-200">{fmtDate(summary.latestNavDataAsOf)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Latest distribution as-of (sample universe)</dt>
          <dd className="font-mono text-zinc-200">{fmtDate(summary.latestDistributionDataAsOf)}</dd>
        </div>
        {selected ? (
          <>
            <div>
              <dt className="text-zinc-500">Selected — NAV as-of</dt>
              <dd className="font-mono text-zinc-200">{fmtDate(selNav)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Selected — distribution as-of</dt>
              <dd className="font-mono text-zinc-200">{fmtDate(selDist)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Selected — confidence</dt>
              <dd className="text-zinc-200 capitalize">{effectiveDataConfidence(selected)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Selected — status</dt>
              <dd className="text-zinc-200 capitalize">{selected.freshness.status}</dd>
            </div>
          </>
        ) : null}
      </dl>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <CountPill label="Stale" value={summary.staleCount} />
        <CountPill label="Missing" value={summary.missingCount} />
        <CountPill label="Low conf." value={summary.lowConfidenceCount} />
        <CountPill label="Illustrative" value={summary.illustrativeCount} />
      </div>

      {summary.topWarnings.length > 0 ? (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Top sample data issues
          </h3>
          <ul className="list-decimal list-inside text-xs text-zinc-400 space-y-1">
            {summary.topWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800/80 pt-3">
        Phase 3 sample rows are loaded from manual JSON (
        <code className="text-amber-400/80 text-[11px]">data/ghostyield/candidates.manual.json</code>
        ). Live feeds, source validation, and automated NAV updates are not active yet. These dates and figures are
        placeholders for UI and scoring logic only—not tax or trade advice.
      </p>
    </GlassCard>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-800/90 bg-zinc-950/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-zinc-200">{value}</div>
    </div>
  );
}
