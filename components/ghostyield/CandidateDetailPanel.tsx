'use client';

import type { GhostYieldCandidate } from '@/lib/ghostyield/types';
import { GlassCard } from '@/components/GlassCard';

function fmtPct(n: number | undefined) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function fmtNum(n: number | undefined) {
  if (n == null) return '—';
  return n.toFixed(3);
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

  return (
    <GlassCard className="p-4 sm:p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          {candidate.ticker}{' '}
          <span className="text-zinc-500 font-normal text-sm font-mono">— {candidate.name}</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          GhostYield Risk Score: <span className="text-zinc-300 font-medium">{candidate.riskScore}</span> · Fit
          Score: <span className="text-zinc-300 font-medium">{candidate.fitScore}</span> (higher risk = riskier
          sleeve; higher fit = better satellite fit on paper).
        </p>
      </div>

      <div className="grid gap-2 text-xs sm:text-sm sm:grid-cols-2">
        <DetailRow label="Yield source" value={candidate.yieldSource} wide />
        <DetailRow label="Role" value={candidate.role} wide />
        <DetailRow label="Current yield (illustr.)" value={fmtPct(candidate.currentYield)} />
        <DetailRow label="SEC yield" value={candidate.secYield != null ? fmtPct(candidate.secYield) : '—'} />
        <DetailRow label="NAV trend 1Y" value={fmtPct(candidate.navTrend1Y)} />
        <DetailRow label="NAV trend 3Y" value={fmtPct(candidate.navTrend3Y)} />
        <DetailRow label="Premium / discount to NAV" value={fmtPct(candidate.premiumDiscount)} />
        <DetailRow label="Leverage (approx.)" value={fmtNum(candidate.leverage)} />
        <DetailRow label="Expense ratio" value={candidate.expenseRatio != null ? fmtPct(candidate.expenseRatio) : '—'} />
        <DetailRow label="Distribution quality" value={candidate.distributionQuality} capitalize />
      </div>

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
  value: string;
  wide?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`text-zinc-200 ${capitalize ? 'capitalize' : ''}`}>{value}</div>
    </div>
  );
}
