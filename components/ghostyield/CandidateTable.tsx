'use client';

import type { DistributionQuality, GhostYieldCandidate } from '@/lib/ghostyield/types';
import { incomeSleeveLabel } from '@/lib/ghostyield/incomeSleeveLabels';
import {
  displayYieldKindShortLabel,
  effectiveDisplayYield,
  effectiveNavPerformance1Y,
  isListedBdcStock,
} from '@/lib/ghostyield/candidateFields';
import {
  DATA_QA_COLUMN_TOOLTIP,
  FRESHNESS_STATUS_LABEL,
  fitScoreBandShort,
  fitScoreTooltip,
  freshnessBadgeTitle,
  riskScoreBandShort,
  riskScoreTooltip,
} from '@/lib/ghostyield/screenerDisplay';

function pct(y: number | null | undefined) {
  if (y == null) return '—';
  return `${(y * 100).toFixed(1)}%`;
}

const DISTRIBUTION_QUALITY_LABEL: Record<DistributionQuality, string> = {
  strong: 'Strong',
  mixed: 'Mixed',
  weak: 'Weak',
  uncertain: 'Uncertain',
};

function DistributionBadge({ q }: { q: DistributionQuality }) {
  return (
    <span
      className="inline-block rounded border border-zinc-700/80 bg-zinc-900/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 sm:text-xs whitespace-nowrap"
      title="Payout / distribution quality from the manual snapshot (durability signal), not source-data freshness."
    >
      {DISTRIBUTION_QUALITY_LABEL[q]}
    </span>
  );
}

function FreshnessBadge({ status }: { status: GhostYieldCandidate['freshness']['status'] }) {
  const label = FRESHNESS_STATUS_LABEL[status];
  const cls =
    status === 'fresh'
      ? 'bg-emerald-950/60 text-emerald-300/95 border-emerald-500/35'
      : status === 'caution'
        ? 'bg-amber-950/50 text-amber-200/95 border-amber-500/40'
        : status === 'stale'
          ? 'bg-orange-950/50 text-orange-200/95 border-orange-500/40'
          : status === 'missing'
            ? 'bg-red-950/40 text-red-200/95 border-red-500/35'
            : 'bg-violet-950/40 text-violet-300/95 border-violet-500/35';
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium sm:text-xs whitespace-nowrap ${cls}`}
      title={freshnessBadgeTitle(status)}
    >
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
            <th
              className="px-3 py-2 font-medium whitespace-nowrap"
              title="Uses the best available sourced metric on the row: current yield, else distribution rate, else SEC yield. Small suffix in each cell names which field is shown."
            >
              Yield
            </th>
            <th
              className="px-3 py-2 font-medium whitespace-nowrap"
              title="NAV total return approx. 1Y (illustrative), or legacy NAV trend when performance field is unset."
            >
              NAV 1Y
            </th>
            <th className="px-3 py-2 font-medium whitespace-nowrap" title="Premium or discount to NAV (illustrative), decimal shown as percent.">
              Prem/disc
            </th>
            <th
              className="px-3 py-2 font-medium whitespace-nowrap min-w-[5.5rem]"
              title="Distribution / payout quality from the manual snapshot — not source-data QA."
            >
              Payout
            </th>
            <th className="px-3 py-2 font-medium whitespace-nowrap" title={DATA_QA_COLUMN_TOOLTIP}>
              Data QA
            </th>
            <th
              className="px-3 py-2 font-medium whitespace-nowrap"
              title="GhostYield risk score 0–100 — higher is riskier (investment / sleeve risk, not data freshness)."
            >
              Risk Score
            </th>
            <th
              className="px-3 py-2 font-medium whitespace-nowrap"
              title="Fit score 0–100 — higher is a better fit as a yield sleeve under the static GhostYield scoring rules (not a data-QA grade)."
            >
              Fit Score
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((row) => {
            const sel = row.ticker === selectedTicker;
            const nav1y = effectiveNavPerformance1Y(row);
            const dy = effectiveDisplayYield(row);
            const yieldTitle =
              dy.kind === 'currentYield'
                ? 'Current yield (indicative)'
                : dy.kind === 'distributionRate'
                  ? isListedBdcStock(row)
                    ? 'Distribution rate on this row: when sourced from filings it is often annualized dividend ÷ NAV per share (issuer / JSON definition), not market-price current yield. currentYield is not set.'
                    : 'Distribution rate (annualized estimate). Current yield is not set for this row.'
                  : dy.kind === 'secYield'
                    ? 'SEC yield. Current yield and distribution rate are not set for this row.'
                    : 'No yield figure on this row';
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
                <td
                  className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap"
                  title={yieldTitle}
                >
                  <span>{pct(dy.value)}</span>
                  {dy.kind ? (
                    <span className="text-[9px] text-zinc-500 ml-1">
                      ({displayYieldKindShortLabel(dy.kind, row)})
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">{pct(nav1y)}</td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap">
                  {pct(row.premiumDiscount)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <DistributionBadge q={row.distributionQuality} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <FreshnessBadge status={row.freshness.status} />
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap" title={riskScoreTooltip(row.riskScore)}>
                  <span>{row.riskScore}</span>
                  <span className="ml-1 text-[9px] text-zinc-500 sm:text-[10px]">{riskScoreBandShort(row.riskScore)}</span>
                </td>
                <td className="px-3 py-2 text-zinc-300 tabular-nums whitespace-nowrap" title={fitScoreTooltip(row.fitScore)}>
                  <span>{row.fitScore}</span>
                  <span className="ml-1 text-[9px] text-zinc-500 sm:text-[10px]">{fitScoreBandShort(row.fitScore)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
