'use client';

import type { GhostYieldCandidate, YieldSleeveCategory } from '@/lib/ghostyield/types';

const CATEGORY_LABEL: Record<YieldSleeveCategory, string> = {
  credit_income: 'Credit Income',
  bdc_income: 'BDC Income',
  cef_credit: 'CEF Credit',
  midstream_income: 'Midstream',
  preferred_income: 'Preferred',
  option_income: 'Option Income',
  crypto_yield_coming_soon: 'Crypto (soon)',
  cash_tbills: 'Cash / T-Bills',
};

function pct(y: number) {
  return `${(y * 100).toFixed(1)}%`;
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
            <th className="px-3 py-2 font-medium whitespace-nowrap">Category</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Yield</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Risk</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Fit</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Distribution</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((row) => {
            const sel = row.ticker === selectedTicker;
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
                <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">
                  {CATEGORY_LABEL[row.sleeveType]}
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">
                  {pct(row.currentYield)}
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{row.riskScore}</td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{row.fitScore}</td>
                <td className="px-3 py-2 text-zinc-400 capitalize whitespace-nowrap">{row.distributionQuality}</td>
                <td className="px-3 py-2 text-zinc-500 capitalize whitespace-nowrap">{row.confidence}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
