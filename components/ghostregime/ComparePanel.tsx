/**
 * Compare Panel
 * 
 * Shows a compact diff between current and previous snapshot
 */

'use client';

import { GlassCard } from '@/components/GlassCard';
import type { GhostRegimeRow } from '@/lib/ghostregime/types';
import {
  computeAxisStatDeltas,
  computeRegimeConfidenceLabel,
  computeRegimeConvictionIndex,
  computeAxisStats,
  computeConviction,
  computeAxisNetVote,
  computeCompareBiggestChange,
} from '@/lib/ghostregime/ui';
import {
  COMPARE_PANEL_TITLE,
  COMPARE_REGIME_UNCHANGED,
  COMPARE_BIGGEST_CHANGE_LABEL,
  COMPARE_BIGGEST_CHANGE_TOOLTIP,
} from '@/lib/ghostregime/ghostregimePageCopy';
import { Tooltip } from '@/components/Tooltip';

interface ComparePanelProps {
  currentRow: GhostRegimeRow;
  prevRow: GhostRegimeRow | null;
  currentAsOf: string;
  prevAsOf: string | null;
}

export function ComparePanel({
  currentRow,
  prevRow,
  currentAsOf,
  prevAsOf,
}: ComparePanelProps) {
  if (!prevRow || !prevAsOf) {
    return null;
  }

  // Compute regime metrics for both rows
  const riskAxisDirectionCurr = currentRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  const riskStatsCurr = computeAxisStats(currentRow.risk_receipts, riskAxisDirectionCurr);
  const riskNetVoteCurr = currentRow.risk_receipts && currentRow.risk_receipts.length > 0
    ? computeAxisNetVote(currentRow.risk_receipts, 'risk').net
    : currentRow.risk_score;
  const riskConvictionCurr = computeConviction(
    riskNetVoteCurr,
    riskStatsCurr.totalSignals || (currentRow.risk_receipts?.length ?? null)
  );
  
  const inflAxisCurr = currentRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
  const inflStatsCurr = computeAxisStats(currentRow.inflation_receipts, inflAxisCurr);
  const inflNetVoteCurr = currentRow.inflation_receipts && currentRow.inflation_receipts.length > 0
    ? computeAxisNetVote(currentRow.inflation_receipts, 'inflation').net
    : currentRow.infl_score;
  const inflConvictionCurr = computeConviction(
    inflNetVoteCurr,
    inflStatsCurr.totalSignals || (currentRow.inflation_receipts?.length ?? null)
  );
  
  const regimeConvictionCurr = computeRegimeConvictionIndex(riskConvictionCurr.index, inflConvictionCurr.index);
  const regimeConfidenceCurr = computeRegimeConfidenceLabel(riskStatsCurr.confidence.label, inflStatsCurr.confidence.label);

  const riskAxisDirectionPrev = prevRow.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
  const riskStatsPrev = computeAxisStats(prevRow.risk_receipts, riskAxisDirectionPrev);
  const riskNetVotePrev = prevRow.risk_receipts && prevRow.risk_receipts.length > 0
    ? computeAxisNetVote(prevRow.risk_receipts, 'risk').net
    : prevRow.risk_score;
  const riskConvictionPrev = computeConviction(
    riskNetVotePrev,
    riskStatsPrev.totalSignals || (prevRow.risk_receipts?.length ?? null)
  );
  
  const inflAxisPrev = prevRow.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
  const inflStatsPrev = computeAxisStats(prevRow.inflation_receipts, inflAxisPrev);
  const inflNetVotePrev = prevRow.inflation_receipts && prevRow.inflation_receipts.length > 0
    ? computeAxisNetVote(prevRow.inflation_receipts, 'inflation').net
    : prevRow.infl_score;
  const inflConvictionPrev = computeConviction(
    inflNetVotePrev,
    inflStatsPrev.totalSignals || (prevRow.inflation_receipts?.length ?? null)
  );
  
  const regimeConvictionPrev = computeRegimeConvictionIndex(riskConvictionPrev.index, inflConvictionPrev.index);
  const regimeConfidencePrev = computeRegimeConfidenceLabel(riskStatsPrev.confidence.label, inflStatsPrev.confidence.label);

  // Compute deltas
  const riskDelta = computeAxisStatDeltas(currentRow, prevRow, 'risk');
  const inflDelta = computeAxisStatDeltas(currentRow, prevRow, 'inflation');

  // Compute biggest change headline
  const biggestChange = computeCompareBiggestChange(currentRow, prevRow);

  // Format dates
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-semibold text-zinc-50 mb-3">
        {COMPARE_PANEL_TITLE} {formatDate(prevAsOf)} → {formatDate(currentAsOf)}
      </h3>
      
      <div className="space-y-3 text-xs">
        {/* Regime summary */}
        <div>
          <div className="text-zinc-300 mb-1">
            <strong>Regime:</strong>{' '}
            {currentRow.regime === prevRow.regime ? (
              <span className="text-zinc-400">
                {COMPARE_REGIME_UNCHANGED} ({currentRow.regime})
              </span>
            ) : (
              <span>
                {prevRow.regime} → {currentRow.regime}
              </span>
            )}
          </div>
          
          {regimeConfidenceCurr && regimeConfidencePrev && regimeConfidenceCurr !== regimeConfidencePrev && (
            <div className="text-zinc-400 text-[10px]">
              <strong>Confidence:</strong> {regimeConfidencePrev} → {regimeConfidenceCurr}
            </div>
          )}
          
          {regimeConvictionCurr !== null && regimeConvictionPrev !== null && regimeConvictionCurr !== regimeConvictionPrev && (
            <div className="text-zinc-400 text-[10px]">
              <strong>Conviction:</strong>{' '}
              {regimeConvictionCurr > regimeConvictionPrev ? '+' : ''}
              {regimeConvictionCurr - regimeConvictionPrev}
            </div>
          )}
        </div>

        {/* Axis deltas */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
          {riskDelta && (
            <div className="text-zinc-300 text-[10px]">
              <strong>Risk:</strong> {riskDelta}
            </div>
          )}
          {inflDelta && (
            <div className="text-zinc-300 text-[10px]">
              <strong>Inflation:</strong> {inflDelta}
            </div>
          )}
        </div>

        {/* Biggest change */}
        {biggestChange && (
          <div className="pt-2 border-t border-zinc-800">
            <Tooltip content={COMPARE_BIGGEST_CHANGE_TOOLTIP}>
              <div className="text-zinc-300 text-[10px]">
                <strong className="text-amber-300/80">{COMPARE_BIGGEST_CHANGE_LABEL}</strong> {biggestChange.text}
              </div>
            </Tooltip>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
