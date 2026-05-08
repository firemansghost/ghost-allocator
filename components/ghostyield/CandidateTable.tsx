'use client';

import type { GhostYieldCandidate } from '@/lib/ghostyield/types';
import { incomeSleeveLabel } from '@/lib/ghostyield/incomeSleeveLabels';
import { effectiveNavPerformance1Y } from '@/lib/ghostyield/candidateFields';

function pct(y: number | undefined) {
  if (y == null) return '—';
  return `${(y * 100).toFixed(1)}%`;
}

function distAbbr(q: string) {
  return q.slice(0, 4);
}

function FreshnessBadge({ status }: { status: GhostYieldCandidate['freshness']['status'] }) {
  const label =
    status === 'illustrative'
      ? 'Sample'
      : status === 'fresh'
        ? 'Fresh'
        : status.charAt(0).toUpperCase() + status.slice(1);
  const cls =
    status === 'fresh'
      ? 'bg-emerald-950/60 text-emerald-300/95 border-emerald-500/35'
      : status === 'caution'
        ? 'bg-amber-950/50 text-amber-200/95 border-amber-500/40'
        : status === 'stale'
          ? 'bg-orange-950/50 text-orange-200/95 border-orange-500/40'
          : status === 'missing'
            ? 'bg-red-950/40 text-red-200/95 border-red-500/35'
            : 'bg-violet-950/40 text-violet-200/95 border-violet-500/35';
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium sm:text-xs ${cls}`}>
      {label}
    </span>
  );
}

export function CandidateTable({
  candidates,
  selectedTicker,
  onSelect,
}: {
  candidates: GhostYieldCandidate[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
      <table className="min-w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-zinc-800/90 text-zinc-500">
            <th className="sticky left-0 z-[1] bg-zinc-950/95 px-3 py-2 font-medium">Ticker</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap min-w-[11rem]">Income sleeve</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Yield</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">NAV 1Y</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Prem/disc</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Dist</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Data</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Risk</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Fit</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((row) => {
            const sel = row.ticker === selectedTicker;
            const nav1y = effectiveNavPerformance1Y(row);
            return (
              <tr
                key={row.ticker}
                className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
                  sel ? 'bg-amber-950/30' : 'hover:bg-zinc-900/50'
                }`}
                onClick={() => onSelect(row.ticker)}
              >
                <td className="sticky left-0 z-[1] bg-inherit px-3 py-2 font-mono font-medium text-zinc-200">
                  {row.ticker}
                </td>
                <td className="px-3 py-2 text-zinc-400 whitespace-normal sm:whitespace-nowrap">
                  {incomeSleeveLabel(row.sleeveType)}
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{pct(row.currentYield)}</td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{pct(nav1y)}</td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">
                  {pct(row.premiumDiscount)}
                </td>
                <td className="px-3 py-2 text-zinc-400 capitalize whitespace-nowrap">{distAbbr(row.distributionQuality)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <FreshnessBadge status={row.freshness.status} />
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{row.riskScore}</td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{row.fitScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
