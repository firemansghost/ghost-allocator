/**
 * Actionable Read Pills
 * 
 * Renders actionable read information as a compact pill strip instead of a long sentence
 */

'use client';

import { Tooltip } from '@/components/Tooltip';
import {
  ACTIONABLE_READ_PREFIX,
  REGIME_CONFIDENCE_TOOLTIP,
  REGIME_CONVICTION_TOOLTIP,
  CROWDED_TOOLTIP,
  BASE_CASH_PILL_TOOLTIP,
  THROTTLE_OFF_PILL_TOOLTIP,
} from '@/lib/ghostregime/ghostregimePageCopy';
import type { CashBreakdown } from '@/lib/ghostregime/ui';

interface ActionableReadPillsProps {
  regime: string;
  riskRegime: string;
  inflAxis: string;
  regimeConfidenceLabel: string | null;
  regimeConvictionIndex: number | null;
  regimeConvictionLabel?: string | null; // Optional bucket label
  isCrowded?: boolean;
  btcScale: number;
  /** Cash breakdown for throttle pills (e.g. "BTC off → +5% cash") */
  cashBreakdown?: CashBreakdown | null;
  /** Base cash (posture) as fraction 0–1; when > 0.5%, show Base cash pill */
  cashTargetPct?: number;
}

const THROTTLE_LABELS: Record<string, string> = {
  Stocks: 'Stocks',
  Gold: 'Gold',
  Bitcoin: 'BTC',
};

export function ActionableReadPills({
  regime,
  riskRegime,
  inflAxis,
  regimeConfidenceLabel,
  regimeConvictionIndex,
  regimeConvictionLabel,
  isCrowded,
  btcScale,
  cashBreakdown,
  cashTargetPct = 0,
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

  // 6) Base cash (posture)
  if (cashTargetPct > 0.005) {
    const pct = (cashTargetPct * 100).toFixed(0);
    pills.push({
      label: `Base cash ${pct}%`,
      tooltip: BASE_CASH_PILL_TOOLTIP,
    });
  }

  // 7) Throttle pills: "BTC off → +5% cash" (explanatory, replaces redundant BTC throttled + Cash from throttle)
  if (cashBreakdown && cashBreakdown.cashFromThrottles > 0.005) {
    const parts: string[] = [];
    if (cashBreakdown.cashFromBtc > 0.001) {
      parts.push(`${THROTTLE_LABELS.Bitcoin} off → +${(cashBreakdown.cashFromBtc * 100).toFixed(0)}% cash`);
    }
    if (cashBreakdown.cashFromStocks > 0.001) {
      parts.push(`${THROTTLE_LABELS.Stocks} → +${(cashBreakdown.cashFromStocks * 100).toFixed(0)}% cash`);
    }
    if (cashBreakdown.cashFromGold > 0.001) {
      parts.push(`${THROTTLE_LABELS.Gold} → +${(cashBreakdown.cashFromGold * 100).toFixed(0)}% cash`);
    }
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
  
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((pill, idx) => {
        const content = (
          <span className="px-2.5 py-1 rounded border border-amber-400/15 bg-amber-400/3 text-amber-300/70 text-xs">
            {pill.label}
          </span>
        );
        
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

