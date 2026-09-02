/**
 * Actionable Read Pills
 *
 * Renders actionable read information as a compact pill strip instead of a long sentence
 */

'use client';

import { Tooltip } from '@/components/Tooltip';
import {
  REGIME_CONFIDENCE_TOOLTIP,
  REGIME_CONVICTION_TOOLTIP,
  CROWDED_TOOLTIP,
  CASH_NOW_PILL_TOOLTIP,
  THROTTLE_OFF_PILL_TOOLTIP,
} from '@/lib/ghostregime/ghostregimePageCopy';
import {
  formatAllocPct,
  formatThrottleCashPart,
  type CashBreakdown,
} from '@/lib/ghostregime/ui';

interface ActionableReadPillsProps {
  regime: string;
  riskRegime: string;
  inflAxis: string;
  regimeConfidenceLabel: string | null;
  regimeConvictionIndex: number | null;
  regimeConvictionLabel?: string | null; // Optional bucket label
  isCrowded?: boolean;
  stocksScale: number;
  goldScale: number;
  btcScale: number;
  /** Cash breakdown for throttle pills (e.g. "BTC half → +5% cash") and Cash now pill */
  cashBreakdown?: CashBreakdown | null;
}

export function ActionableReadPills({
  regime,
  riskRegime,
  inflAxis,
  regimeConfidenceLabel,
  regimeConvictionIndex,
  regimeConvictionLabel,
  isCrowded,
  stocksScale,
  goldScale,
  btcScale,
  cashBreakdown,
}: ActionableReadPillsProps) {
  const pills: Array<{ label: string; tooltip?: string }> = [];

  // 1) Regime
  pills.push({ label: regime });

  // 2) Axes
  const riskLabel = riskRegime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  pills.push({ label: `${riskLabel} + ${inflAxis}` });

  // 3) Regime Confidence
  if (regimeConfidenceLabel) {
    pills.push({
      label: `Confidence: ${regimeConfidenceLabel}`,
      tooltip: REGIME_CONFIDENCE_TOOLTIP,
    });
  }

  // 4) Regime Conviction
  if (regimeConvictionIndex !== null) {
    const convictionLabel = regimeConvictionLabel || `${regimeConvictionIndex}`;
    pills.push({
      label: `Conviction: ${convictionLabel}`,
      tooltip: REGIME_CONVICTION_TOOLTIP,
    });
  }

  // 5) Crowded
  if (isCrowded) {
    pills.push({
      label: 'Crowded',
      tooltip: CROWDED_TOOLTIP,
    });
  }

  // 6) Cash now X% (actual/hold-now cash; show when >= 1%)
  if (cashBreakdown && cashBreakdown.cashTotal >= 0.01) {
    pills.push({
      label: `Cash now ${formatAllocPct(cashBreakdown.cashTotal)}%`,
      tooltip: CASH_NOW_PILL_TOOLTIP,
    });
  }

  // 7) Throttle pills from actual sleeve scale (never infer off from cash)
  if (cashBreakdown && cashBreakdown.cashFromThrottles > 0.005) {
    const parts = [
      formatThrottleCashPart('BTC', btcScale, cashBreakdown.cashFromBtc),
      formatThrottleCashPart('Stocks', stocksScale, cashBreakdown.cashFromStocks),
      formatThrottleCashPart('Gold', goldScale, cashBreakdown.cashFromGold),
    ].filter((part): part is string => part !== null);
    if (parts.length > 0) {
      pills.push({
        label: parts.join(' • '),
        tooltip: THROTTLE_OFF_PILL_TOOLTIP,
      });
    }
  }

  if (pills.length === 0) {
    return null;
  }

  const pillPrimary =
    'px-2.5 py-1 rounded-md border border-amber-400/22 bg-amber-400/[0.06] text-amber-200/80 text-xs';
  const pillSecondary =
    'px-2 py-0.5 rounded-md border border-zinc-700/40 bg-zinc-900/30 text-zinc-400/95 text-[11px] leading-snug';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((pill, idx) => {
        const tierClass = idx < 2 ? pillPrimary : pillSecondary;
        const content = <span className={tierClass}>{pill.label}</span>;

        return pill.tooltip ? (
          <Tooltip key={idx} content={pill.tooltip}>
            {content}
          </Tooltip>
        ) : (
          <span key={idx}>{content}</span>
        );
      })}
    </div>
  );
}
