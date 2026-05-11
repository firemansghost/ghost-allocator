'use client';

import type { ReactNode } from 'react';
import type { GhostYieldCandidate } from '@/lib/ghostyield/types';
import { incomeSleeveLabel } from '@/lib/ghostyield/incomeSleeveLabels';
import {
  effectiveDataConfidence,
  effectiveDisplayYield,
  isListedBdcStock,
} from '@/lib/ghostyield/candidateFields';
import {
  fitScoreBandWord,
  fitScoreTooltip,
  riskScoreBandWord,
  riskScoreTooltip,
} from '@/lib/ghostyield/screenerDisplay';
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

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-800/65 bg-zinc-950/30 p-3 sm:p-4 space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-400/90">{title}</h3>
      <div className="space-y-3 border-t border-zinc-800/50 pt-3">{children}</div>
    </section>
  );
}

function Subheading({ children }: { children: ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{children}</h4>
  );
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
  const tableYield = effectiveDisplayYield(candidate);

  return (
    <GlassCard className="p-4 sm:p-5 space-y-4">
      <DetailSection title="Overview">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            {candidate.ticker}{' '}
            <span className="text-zinc-500 font-normal text-sm font-mono">— {candidate.name}</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
            <span className="text-zinc-200">Risk Score</span>{' '}
            <span className="text-zinc-300 font-medium" title={riskScoreTooltip(candidate.riskScore)}>
              {candidate.riskScore} ({riskScoreBandWord(candidate.riskScore)})
            </span>
            {' — '}
            sleeve / investment risk in this model (not the same as Data QA on the snapshot).
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            <span className="text-zinc-200">Fit Score</span>:{' '}
            <span className="text-zinc-300 font-medium" title={fitScoreTooltip(candidate.fitScore)}>
              {candidate.fitScore} ({fitScoreBandWord(candidate.fitScore)})
            </span>
          </p>
        </div>
        <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
          <DetailRow label="Income sleeve" value={incomeSleeveLabel(candidate.sleeveType)} wide />
          {candidate.structureLabel ? (
            <DetailRow label="Structure / wrapper" value={candidate.structureLabel} wide />
          ) : null}
          <DetailRow label="Yield source" value={candidate.yieldSource} wide />
          <DetailRow label="Role" value={candidate.role} wide />
        </div>
      </DetailSection>

      <DetailSection title="Pricing / NAV">
        <div className="space-y-3">
          <Subheading>Pricing</Subheading>
          <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
            <DetailRow label="Market price (illustr.)" value={fmtNum(candidate.marketPrice, 2)} />
            <DetailRow label="NAV (illustr.)" value={fmtNum(candidate.nav, 2)} />
            <DetailRow label="Premium / discount to NAV" value={fmtPct(candidate.premiumDiscount)} />
            <DetailRow label="Leverage (approx.)" value={fmtNum(candidate.leverage, 3)} />
            <DetailRow
              label="Expense ratio"
              value={candidate.expenseRatio != null ? fmtPct(candidate.expenseRatio) : '—'}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Subheading>NAV performance (illustr.)</Subheading>
          <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
            <DetailRow label="NAV 1M" value={fmtPct(candidate.navPerformance1M)} />
            <DetailRow label="NAV 3M" value={fmtPct(candidate.navPerformance3M)} />
            <DetailRow label="NAV 1Y" value={fmtPct(candidate.navPerformance1Y ?? candidate.navTrend1Y)} />
            <DetailRow label="NAV 3Y" value={fmtPct(candidate.navPerformance3Y ?? candidate.navTrend3Y)} />
            {legacyOnly1y ? <DetailRow label="Legacy NAV trend 1Y" value={fmtPct(candidate.navTrend1Y)} /> : null}
            {legacyOnly3y ? <DetailRow label="Legacy NAV trend 3Y" value={fmtPct(candidate.navTrend3Y)} /> : null}
            <DetailRow label="NAV data as of" value={fmtDate(candidate.navDataAsOf)} />
          </div>
        </div>
        <div className="space-y-3">
          <Subheading>Market performance (illustr.)</Subheading>
          <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
            <DetailRow label="Mkt 1M" value={fmtPct(candidate.marketPerformance1M)} />
            <DetailRow label="Mkt 3M" value={fmtPct(candidate.marketPerformance3M)} />
            <DetailRow label="Mkt 1Y" value={fmtPct(candidate.marketPerformance1Y)} />
            <DetailRow label="Mkt 3Y" value={fmtPct(candidate.marketPerformance3Y)} />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Yield & distributions">
        <div className="space-y-2">
          <Subheading>Yield (screener column)</Subheading>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {tableYield.kind === 'currentYield' ? (
              <>
                The table &ldquo;Yield&rdquo; column uses <span className="text-zinc-200">current yield</span> (
                {fmtPct(tableYield.value)}).
              </>
            ) : tableYield.kind === 'distributionRate' ? (
              <>
                The table &ldquo;Yield&rdquo; column uses{' '}
                <span className="text-zinc-200">distribution rate</span> as a fallback ({fmtPct(tableYield.value)}),
                since current yield is not set for this row.
                {isListedBdcStock(candidate) ? (
                  <>
                    {' '}
                    For this listed BDC, that figure is{' '}
                    <span className="text-zinc-200">NAV-based (annualized distribution ÷ NAV/sh per source)</span>, not a
                    traded share-price yield unless you compute it separately.
                  </>
                ) : null}
              </>
            ) : tableYield.kind === 'secYield' ? (
              <>
                The table &ldquo;Yield&rdquo; column uses <span className="text-zinc-200">SEC yield</span> as a fallback (
                {fmtPct(tableYield.value)}), since current yield and distribution rate are not set.
              </>
            ) : (
              <>The table &ldquo;Yield&rdquo; column has no value — all yield fields below are missing.</>
            )}
          </p>
        </div>
        <div className="space-y-3">
          <Subheading>Distributions (illustr.)</Subheading>
          <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
            <DetailRow label="Latest distribution amount" value={fmtNum(candidate.latestDistributionAmount, 3)} />
            <DetailRow label="Latest distribution date" value={fmtDate(candidate.latestDistributionDate)} />
            <DetailRow label="Frequency" value={candidate.distributionFrequency ?? '—'} capitalize />
            <DetailRow label="Current yield" value={fmtPct(candidate.currentYield)} />
            <DetailRow
              label={
                isListedBdcStock(candidate) && candidate.distributionRate != null
                  ? 'Distribution rate (NAV/sh basis per source when applicable)'
                  : 'Distribution rate'
              }
              value={fmtPct(candidate.distributionRate)}
            />
            <DetailRow label="SEC yield" value={fmtPct(candidate.secYield)} />
            <DetailRow label="Est. return of capital %" value={fmtPct(candidate.estimatedReturnOfCapitalPct)} />
            <DetailRow label="NAV / yield spread (illustr.)" value={fmtPct(candidate.navYieldSpread)} />
            <DetailRow label="Distribution data as of" value={fmtDate(candidate.distributionDataAsOf)} />
            <DetailRow label="Quarterly fundamentals as of" value={fmtDate(candidate.quarterlyFundamentalDataAsOf)} />
            <DetailRow label="Distribution quality" value={candidate.distributionQuality} capitalize />
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Source & data quality">
        {candidate.freshness.warnings.length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90 mb-1">
              Data snapshot warnings
            </h4>
            <p className="text-[10px] text-amber-200/70 mb-1.5 leading-snug">
              These flags describe the data row, not the investment itself. Missing snapshot fields are not a verdict on
              fund quality.
            </p>
            <ul className="list-disc list-inside text-xs text-amber-100/90 space-y-0.5">
              {candidate.freshness.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="space-y-3">
          <Subheading>Lineage</Subheading>
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
        </div>
      </DetailSection>

      <DetailSection title="Risks / use case">
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/85 mb-1.5">Main risks</h4>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1 leading-snug">
            {candidate.mainRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Best use</h4>
            <p className="text-zinc-300 leading-snug">{candidate.bestUseCase}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Avoid if</h4>
            <p className="text-zinc-300 leading-snug">{candidate.avoidIf}</p>
          </div>
        </div>
      </DetailSection>
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
