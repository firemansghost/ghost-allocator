'use client';

import type { ReactNode } from 'react';
import type { GhostYieldCandidate } from '@/lib/ghostyield/types';
import { incomeSleeveLabel } from '@/lib/ghostyield/incomeSleeveLabels';
import { effectiveDataConfidence } from '@/lib/ghostyield/candidateFields';
import { GlassCard } from '@/components/GlassCard';

function fmtPct(n: number | null | undefined) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function fmtNum(n: number | null | undefined, d = 2) {
  if (n == null) return '—';
  return n.toFixed(d);
}

function fmtDate(iso: string | undefined) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function CandidateDetailPanel({ candidate }: { candidate: GhostYieldCandidate | null }) {
  if (!candidate) {
    return (
      <GlassCard className="p-4 sm:p-5 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-zinc-500 text-center px-4">
          Select a row in the screener to inspect yield source, NAV behavior, and trade-offs.
        </p>
      </GlassCard>
    );
  }

  const legacyOnly1y = candidate.navPerformance1Y == null && candidate.navTrend1Y != null;
  const legacyOnly3y = candidate.navPerformance3Y == null && candidate.navTrend3Y != null;
  const dc = effectiveDataConfidence(candidate);

  return (
    <GlassCard className="p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          {candidate.ticker}{' '}
          <span className="text-zinc-500 font-normal text-sm font-mono">— {candidate.name}</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          GhostYield Risk Score: <span className="text-zinc-300 font-medium">{candidate.riskScore}</span> · Fit
          Score: <span className="text-zinc-300 font-medium">{candidate.fitScore}</span>
        </p>
      </div>

      {candidate.freshness.warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90 mb-1">Data warnings</h3>
          <ul className="list-disc list-inside text-xs text-amber-100/90 space-y-0.5">
            {candidate.freshness.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
        <DetailRow label="Income sleeve" value={incomeSleeveLabel(candidate.sleeveType)} wide />
        {candidate.structureLabel ? (
          <DetailRow label="Structure / wrapper" value={candidate.structureLabel} wide />
        ) : null}
        <DetailRow label="Yield source" value={candidate.yieldSource} wide />
        <DetailRow label="Role" value={candidate.role} wide />
      </div>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">Pricing</h3>
        <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
          <DetailRow label="Market price (illustr.)" value={fmtNum(candidate.marketPrice, 2)} />
          <DetailRow label="NAV (illustr.)" value={fmtNum(candidate.nav, 2)} />
          <DetailRow label="Premium / discount to NAV" value={fmtPct(candidate.premiumDiscount)} />
          <DetailRow label="Leverage (approx.)" value={fmtNum(candidate.leverage, 3)} />
          <DetailRow label="Expense ratio" value={candidate.expenseRatio != null ? fmtPct(candidate.expenseRatio) : '—'} />
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">NAV performance (illustr.)</h3>
        <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
          <DetailRow label="NAV 1M" value={fmtPct(candidate.navPerformance1M)} />
          <DetailRow label="NAV 3M" value={fmtPct(candidate.navPerformance3M)} />
          <DetailRow label="NAV 1Y" value={fmtPct(candidate.navPerformance1Y ?? candidate.navTrend1Y)} />
          <DetailRow label="NAV 3Y" value={fmtPct(candidate.navPerformance3Y ?? candidate.navTrend3Y)} />
          {legacyOnly1y ? <DetailRow label="Legacy NAV trend 1Y" value={fmtPct(candidate.navTrend1Y)} /> : null}
          {legacyOnly3y ? <DetailRow label="Legacy NAV trend 3Y" value={fmtPct(candidate.navTrend3Y)} /> : null}
          <DetailRow label="NAV data as of" value={fmtDate(candidate.navDataAsOf)} />
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">Market performance (illustr.)</h3>
        <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
          <DetailRow label="Mkt 1M" value={fmtPct(candidate.marketPerformance1M)} />
          <DetailRow label="Mkt 3M" value={fmtPct(candidate.marketPerformance3M)} />
          <DetailRow label="Mkt 1Y" value={fmtPct(candidate.marketPerformance1Y)} />
          <DetailRow label="Mkt 3Y" value={fmtPct(candidate.marketPerformance3Y)} />
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">Distributions (illustr.)</h3>
        <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
          <DetailRow label="Latest distribution amount" value={fmtNum(candidate.latestDistributionAmount, 3)} />
          <DetailRow label="Latest distribution date" value={fmtDate(candidate.latestDistributionDate)} />
          <DetailRow label="Frequency" value={candidate.distributionFrequency ?? '—'} capitalize />
          <DetailRow label="Distribution rate (annualized est.)" value={fmtPct(candidate.distributionRate)} />
          <DetailRow label="Current yield (indicative)" value={fmtPct(candidate.currentYield)} />
          <DetailRow label="SEC yield" value={fmtPct(candidate.secYield)} />
          <DetailRow label="Est. return of capital %" value={fmtPct(candidate.estimatedReturnOfCapitalPct)} />
          <DetailRow label="NAV / yield spread (illustr.)" value={fmtPct(candidate.navYieldSpread)} />
          <DetailRow label="Distribution data as of" value={fmtDate(candidate.distributionDataAsOf)} />
          <DetailRow label="Quarterly fundamentals as of" value={fmtDate(candidate.quarterlyFundamentalDataAsOf)} />
          <DetailRow label="Distribution quality" value={candidate.distributionQuality} capitalize />
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">Lineage</h3>
        <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
          <DetailRow label="Row data as of" value={fmtDate(candidate.dataAsOf)} />
          <DetailRow label="Update frequency" value={candidate.updateFrequency ?? '—'} capitalize />
          <DetailRow label="Source label" value={candidate.sourceLabel} wide />
          <DetailRow
            label="Source URL"
            value={
              candidate.sourceUrl ? (
                <a
                  href={candidate.sourceUrl}
                  className="text-amber-400/90 hover:underline break-all"
                  target="_blank"
                  rel="noreferrer"
                >
                  {candidate.sourceUrl}
                </a>
              ) : (
                '—'
              )
            }
            wide
          />
          <DetailRow label="Data confidence" value={dc} capitalize />
        </div>
      </section>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400/85 mb-1">Main risks</h3>
        <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
          {candidate.mainRisks.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">Best use</h3>
          <p className="text-zinc-300">{candidate.bestUseCase}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">Avoid if</h3>
          <p className="text-zinc-300">{candidate.avoidIf}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function DetailRow({
  label,
  value,
  wide,
  capitalize,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
  capitalize?: boolean;
}) {
  const isStr = typeof value === 'string';
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`text-zinc-200 ${isStr && capitalize ? 'capitalize' : ''}`}>{value}</div>
    </div>
  );
}
