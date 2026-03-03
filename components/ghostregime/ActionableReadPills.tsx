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
  ACTIONABLE_CASH_PILL_TOOLTIP,
  BASE_CASH_PILL_TOOLTIP,
} from '@/lib/ghostregime/ghostregimePageCopy';
import { formatCashPillLabel } from '@/lib/ghostregime/ui';

interface ActionableReadPillsProps {
  regime: string;
  riskRegime: string;
  inflAxis: string;
  regimeConfidenceLabel: string | null;
  regimeConvictionIndex: number | null;
  regimeConvictionLabel?: string | null; // Optional bucket label
  isCrowded?: boolean;
  btcScale: number;
  cashSources: string[];
  /** Base cash (posture) as fraction 0–1; when > 0.5%, show Base cash pill */
  cashTargetPct?: number;
}

export function ActionableReadPills({
  regime,
  riskRegime,
  inflAxis,
  regimeConfidenceLabel,
  regimeConvictionIndex,
  regimeConvictionLabel,
  isCrowded,
  btcScale,
  cashSources,
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
  
  // 6) BTC throttled
  if (btcScale < 1) {
    const scaleLabel = btcScale === 0.5 ? 'half size' : 'off';
    pills.push({ label: `BTC throttled (${scaleLabel})` });
  }

  // 6b) Base cash (posture)
  if (cashTargetPct > 0.005) {
    const pct = (cashTargetPct * 100).toFixed(0);
    pills.push({
      label: `Base cash ${pct}%`,
      tooltip: BASE_CASH_PILL_TOOLTIP,
    });
  }

  // 7) Cash source (throttle)
  if (cashSources.length > 0) {
    pills.push({ 
      label: formatCashPillLabel(cashSources),
      tooltip: ACTIONABLE_CASH_PILL_TOOLTIP,
    });
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

