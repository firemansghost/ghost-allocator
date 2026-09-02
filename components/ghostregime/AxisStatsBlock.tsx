/**
 * Axis Stats Block
 * 
 * Reusable component for rendering axis statistics (Risk/Inflation) with consistent layout
 */

'use client';

import { Tooltip } from '@/components/Tooltip';
import { AgreementChipStrip } from '@/components/ghostregime/AgreementChipStrip';
import type { AgreementSeriesItem } from '@/components/ghostregime/AgreementChipStrip';
import { isAxisCrowded } from '@/lib/ghostregime/ui';
import {
  AGREEMENT_TOOLTIP,
  PARTICIPATION_TOOLTIP,
  CONFIDENCE_LABEL_PREFIX,
  CROWDED_LABEL,
  CROWDED_TOOLTIP,
  AGREEMENT_HISTORY_LABEL,
} from '@/lib/ghostregime/ghostregimePageCopy';

interface AxisStatsBlockProps {
  axisLine: string; // e.g., "Risk axis: RISK ON (risk score: +2)"
  stats: {
    totalSignals: number;
    nonNeutral: number;
    agreementPct: number | null;
    agreementLabel: string;
    participationLabel: string;
    coverageLabel?: string;
    confidence: {
      label: string;
      tooltip: string;
    };
  };
  conviction: {
    index: number | null;
    label: string;
    tooltip: string;
  };
  agreementSeries?: AgreementSeriesItem[];
  deltaLine?: string | null;
  axisName?: string; // "Risk" or "Inflation" for chip strip
  resolvedByLine?: string | null;
}

export function AxisStatsBlock({
  axisLine,
  stats,
  conviction,
  agreementSeries,
  deltaLine,
  axisName,
  resolvedByLine,
}: AxisStatsBlockProps) {
  const showCrowded = isAxisCrowded(stats, conviction.index);
  const participationLabel = stats.participationLabel || stats.coverageLabel || 'Participation: n/a';

  return (
    <div>
      <p>{axisLine}</p>
      {resolvedByLine && (
        <p className="text-[10px] text-zinc-500 mt-1">{resolvedByLine}</p>
      )}
      {stats.nonNeutral > 0 && (
        <>
          {/* Line A: Agreement + Participation */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
            <Tooltip content={AGREEMENT_TOOLTIP}>
              <span>{stats.agreementLabel}</span>
            </Tooltip>
            <span>•</span>
            <Tooltip content={PARTICIPATION_TOOLTIP}>
              <span>{participationLabel}</span>
            </Tooltip>
          </div>
          
          {/* Line B: Confidence + Conviction + Crowded */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2 min-w-0">
              <Tooltip content={stats.confidence.tooltip}>
                <span className="px-2 py-0.5 rounded border border-amber-400/14 bg-amber-400/[0.04] text-amber-300/75 whitespace-nowrap">
                  {CONFIDENCE_LABEL_PREFIX} {stats.confidence.label}
                </span>
              </Tooltip>
              {conviction.index !== null && (
                <>
                  <span className="text-zinc-600">•</span>
                  <Tooltip content={conviction.tooltip}>
                    <span className="px-2 py-0.5 rounded border border-amber-400/12 bg-amber-400/[0.03] text-amber-300/65 whitespace-nowrap">
                      {conviction.label}
                    </span>
                  </Tooltip>
                </>
              )}
              {showCrowded && (
                <>
                  <span className="text-zinc-600">•</span>
                  <Tooltip content={CROWDED_TOOLTIP}>
                    <span className="px-2 py-0.5 rounded border border-amber-400/8 bg-amber-400/[0.02] text-amber-300/55 whitespace-nowrap">
                      {CROWDED_LABEL}
                    </span>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
          
          {/* Delta line (if available) */}
          {deltaLine && (
            <p className="text-[10px] text-zinc-500 mt-1 italic">{deltaLine}</p>
          )}
          
          {/* Agreement chip strip */}
          {agreementSeries && agreementSeries.length >= 2 && (
            <div className="mt-1">
              <AgreementChipStrip 
                items={agreementSeries} 
                label={AGREEMENT_HISTORY_LABEL} 
                axisName={axisName}
                showLegend={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
