/**
 * Axis Stats Block
 * 
 * Reusable component for rendering axis statistics (Risk/Inflation) with consistent layout
 */

'use client';

import { Tooltip } from '@/components/Tooltip';
import { AgreementChipStrip } from '@/components/ghostregime/AgreementChipStrip';
import type { AgreementSeriesItem } from '@/components/ghostregime/AgreementChipStrip';
import {
  AGREEMENT_TOOLTIP,
  COVERAGE_TOOLTIP,
  CONFIDENCE_LABEL_PREFIX,
  CONVICTION_LABEL_PREFIX,
  CROWDED_LABEL,
  CROWDED_TOOLTIP,
  AGREEMENT_HISTORY_LABEL,
} from '@/lib/ghostregime/ghostregimePageCopy';

interface AxisStatsBlockProps {
  axisLine: string; // e.g., "Risk axis: RISK ON (risk score: +2)"
  stats: {
    nonNeutral: number;
    agreementLabel: string;
    coverageLabel: string;
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
}

export function AxisStatsBlock({
  axisLine,
  stats,
  conviction,
  agreementSeries,
  deltaLine,
  axisName,
}: AxisStatsBlockProps) {
  // Extract agreement percentage from label (e.g., "Agreement: 3/4 (75%)")
  const agreementMatch = stats.agreementLabel.match(/\((\d+)%\)/);
  const agreementPct = agreementMatch ? parseInt(agreementMatch[1]) : null;
  
  // Extract coverage percentage (e.g., "Coverage: 2/4 signals")
  const coverageMatch = stats.coverageLabel.match(/(\d+)\/(\d+)/);
  const coveragePct = coverageMatch ? parseInt(coverageMatch[1]) / parseInt(coverageMatch[2]) : null;
  
  // Compute crowding tag
  const showCrowded = conviction.index !== null && 
                      conviction.index >= 76 && 
                      stats.confidence.label === 'High' &&
                      agreementPct !== null && agreementPct >= 80 &&
                      coveragePct !== null && coveragePct >= 0.5;

  return (
    <div>
      <p>{axisLine}</p>
      {stats.nonNeutral > 0 && (
        <>
          {/* Line A: Agreement + Coverage */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
            <Tooltip content={AGREEMENT_TOOLTIP}>
              <span>{stats.agreementLabel}</span>
            </Tooltip>
            <span>•</span>
            <Tooltip content={COVERAGE_TOOLTIP}>
              <span>{stats.coverageLabel}</span>
            </Tooltip>
          </div>
          
          {/* Line B: Confidence + Conviction + Crowded */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
            <Tooltip content={stats.confidence.tooltip}>
              <span className="px-2 py-0.5 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80">
                {CONFIDENCE_LABEL_PREFIX} {stats.confidence.label}
              </span>
            </Tooltip>
            {conviction.index !== null && (
              <>
                <span>•</span>
                <Tooltip content={conviction.tooltip}>
                  <span className="px-2 py-0.5 rounded border border-amber-400/15 bg-amber-400/3 text-amber-300/70">
                    {conviction.label}
                  </span>
                </Tooltip>
              </>
            )}
            {showCrowded && (
              <>
                <span>•</span>
                <Tooltip content={CROWDED_TOOLTIP}>
                  <span className="px-2 py-0.5 rounded border border-amber-400/10 bg-amber-400/2 text-amber-300/60">
                    {CROWDED_LABEL}
                  </span>
                </Tooltip>
              </>
            )}
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

