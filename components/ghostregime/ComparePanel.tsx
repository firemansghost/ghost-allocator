/**
 * Compare Panel
 * 
 * Shows a compact diff between current and previous snapshot
 */

'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import type { GhostRegimeRow } from '@/lib/ghostregime/types';
import type { CompareKind, CompareAxis } from '@/lib/ghostregime/ui';
import {
  computeAxisStatDeltas,
  computeAxisStatDeltaTokens,
  computeRegimeConfidenceLabel,
  computeRegimeConvictionIndex,
  computeAxisStats,
  computeConviction,
  computeAxisNetVote,
  computeCompareBiggestChange,
  getDeltaTone,
  buildCompareUrl,
} from '@/lib/ghostregime/ui';
import {
  COMPARE_PANEL_TITLE,
  COMPARE_REGIME_UNCHANGED,
  COMPARE_BIGGEST_CHANGE_LABEL,
  COMPARE_BIGGEST_CHANGE_TOOLTIP,
  COMPARE_TOGGLE_SUMMARY,
  COMPARE_TOGGLE_PILLS,
  COPY_COMPARE_LINK,
  COPY_COMPARE_LINK_COPIED,
  COPY_COMPARE_LINK_TOOLTIP_DISABLED,
  COMPARE_RESET_BUTTON,
  COMPARE_RESET_TOOLTIP,
  COPY_BIGGEST_CHANGE_TOOLTIP,
  COPY_BIGGEST_CHANGE_COPIED,
  PREV_NOT_FOUND_INFO_TOOLTIP,
  COMPARE_CONTEXT_LABEL,
  COMPARE_CONTEXT_VIEWING,
  COMPARE_CONTEXT_COMPARING,
  PILLS_DELTA_COLORS_TOOLTIP,
} from '@/lib/ghostregime/ghostregimePageCopy';
import { Tooltip } from '@/components/Tooltip';

interface ComparePanelProps {
  currentRow: GhostRegimeRow;
  prevRow: GhostRegimeRow | null;
  currentAsOf: string;
  prevAsOf: string | null;
  onJump?: (opts: { kind: CompareKind; axis?: CompareAxis }) => void;
  onReset?: () => void;
  prevNotFoundHint?: boolean;
}

export function ComparePanel({
  currentRow,
  prevRow,
  currentAsOf,
  prevAsOf,
  onJump,
  onReset,
  prevNotFoundHint = false,
}: ComparePanelProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'pills'>('summary');
  const [copied, setCopied] = useState(false);
  const [biggestChangeCopied, setBiggestChangeCopied] = useState(false);

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
  const riskDeltaTokens = computeAxisStatDeltaTokens(currentRow, prevRow, 'risk');
  const inflDeltaTokens = computeAxisStatDeltaTokens(currentRow, prevRow, 'inflation');

  // Compute biggest change headline
  const biggestChange = computeCompareBiggestChange(currentRow, prevRow);

  // Format dates
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle copy compare link
  const handleCopyCompareLink = async () => {
    try {
      const url = buildCompareUrl(currentAsOf, prevAsOf);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // Fallback for older browsers
      console.error('Failed to copy:', err);
    }
  };

  // Handle biggest change copy
  const handleCopyBiggestChange = async () => {
    if (!biggestChange) return;
    try {
      const text = `${COMPARE_BIGGEST_CHANGE_LABEL} ${biggestChange.headline}${biggestChange.detail ? ` (${biggestChange.detail})` : ''}`;
      await navigator.clipboard.writeText(text);
      setBiggestChangeCopied(true);
      setTimeout(() => setBiggestChangeCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle reset
  const handleReset = () => {
    setViewMode('summary');
    setCopied(false);
    setBiggestChangeCopied(false);
    if (onReset) {
      onReset();
    }
  };

  // Handle biggest change jump
  const handleJump = () => {
    if (onJump && biggestChange) {
      onJump({ kind: biggestChange.kind, axis: biggestChange.axis });
    }
  };

  // Get tone classes
  const getToneClasses = (tone: 'pos' | 'neg' | 'flat' | 'na') => {
    switch (tone) {
      case 'pos':
        return 'text-emerald-300/70 border-emerald-400/10 bg-emerald-400/5';
      case 'neg':
        return 'text-rose-300/70 border-rose-400/10 bg-rose-400/5';
      case 'flat':
        return 'text-zinc-300/70 border-white/10 bg-white/[0.03]';
      case 'na':
        return 'text-zinc-500 border-white/5 bg-transparent';
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-50">
          {COMPARE_PANEL_TITLE} {formatDate(prevAsOf)} → {formatDate(currentAsOf)}
        </h3>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded border border-zinc-700 bg-zinc-900/50 overflow-hidden">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-2 py-0.5 text-[10px] transition-colors ${
                viewMode === 'summary'
                  ? 'bg-amber-400/10 text-amber-300 border-r border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-300 border-r border-zinc-700'
              }`}
            >
              {COMPARE_TOGGLE_SUMMARY}
            </button>
            <button
              onClick={() => setViewMode('pills')}
              className={`px-2 py-0.5 text-[10px] transition-colors ${
                viewMode === 'pills'
                  ? 'bg-amber-400/10 text-amber-300'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {COMPARE_TOGGLE_PILLS}
            </button>
          </div>
          
          {/* Copy compare link */}
          {prevRow ? (
            <button
              onClick={handleCopyCompareLink}
              className="px-2 py-0.5 text-[10px] transition-colors rounded border border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
            >
              {copied ? COPY_COMPARE_LINK_COPIED : COPY_COMPARE_LINK}
            </button>
          ) : (
            <Tooltip content={COPY_COMPARE_LINK_TOOLTIP_DISABLED}>
              <button
                disabled
                className="px-2 py-0.5 text-[10px] transition-colors rounded border border-zinc-800 text-zinc-600 cursor-not-allowed"
              >
                {COPY_COMPARE_LINK}
              </button>
            </Tooltip>
          )}
          
          {/* Reset button */}
          {onReset && (
            <Tooltip content={COMPARE_RESET_TOOLTIP}>
              <button
                onClick={handleReset}
                className="px-2 py-0.5 text-[10px] transition-colors rounded border border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              >
                {COMPARE_RESET_BUTTON}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* Context line */}
      {(currentAsOf || prevAsOf) && (
        <div className="mb-2 text-[10px] text-zinc-400">
          {COMPARE_CONTEXT_LABEL}{' '}
          {currentAsOf && (
            <span>{COMPARE_CONTEXT_VIEWING} {currentAsOf}</span>
          )}
          {currentAsOf && prevAsOf && ' • '}
          {prevAsOf && (
            <span>{COMPARE_CONTEXT_COMPARING} {prevAsOf}</span>
          )}
        </div>
      )}
      
      {/* Prev not found hint - info icon */}
      {prevNotFoundHint && (
        <div className="mb-2 flex items-center gap-1.5">
          <Tooltip content={PREV_NOT_FOUND_INFO_TOOLTIP}>
            <span className="text-zinc-400 text-[10px] cursor-help">ⓘ</span>
          </Tooltip>
        </div>
      )}
      
      <div className="space-y-3 text-xs">
        {viewMode === 'summary' ? (
          <>
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
          </>
        ) : (
          <>
            {/* Pills mode */}
            <div className="flex items-center gap-2 mb-2">
              <Tooltip content={PILLS_DELTA_COLORS_TOOLTIP}>
                <span className="text-zinc-400 text-[10px] cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {/* Regime pill */}
              <span className={`px-2 py-0.5 rounded border text-[10px] ${
                currentRow.regime === prevRow.regime
                  ? 'text-zinc-400 border-zinc-700 bg-zinc-900/50'
                  : 'text-amber-300/80 border-amber-400/20 bg-amber-400/10'
              }`}>
                Regime: {currentRow.regime === prevRow.regime ? 'unchanged' : `${prevRow.regime}→${currentRow.regime}`}
              </span>
              
              {/* Regime Confidence pill */}
              {regimeConfidenceCurr && regimeConfidencePrev && (
                <span className={`px-2 py-0.5 rounded border text-[10px] ${
                  regimeConfidenceCurr === regimeConfidencePrev
                    ? getToneClasses('flat')
                    : getToneClasses(regimeConfidenceCurr > regimeConfidencePrev ? 'pos' : 'neg')
                }`}>
                  Conf: {regimeConfidenceCurr === regimeConfidencePrev ? 'same' : `${regimeConfidencePrev}→${regimeConfidenceCurr}`}
                </span>
              )}
              
              {/* Regime Conviction pill */}
              {regimeConvictionCurr !== null && regimeConvictionPrev !== null && (
                <span className={`px-2 py-0.5 rounded border text-[10px] ${
                  regimeConvictionCurr === regimeConvictionPrev
                    ? getToneClasses('flat')
                    : getToneClasses(getDeltaTone(regimeConvictionCurr - regimeConvictionPrev))
                }`}>
                  Conv: {regimeConvictionCurr === regimeConvictionPrev ? 'same' : `${regimeConvictionCurr > regimeConvictionPrev ? '+' : ''}${regimeConvictionCurr - regimeConvictionPrev}`}
                </span>
              )}
            </div>
            
            {/* Risk axis pills */}
            {riskDeltaTokens && riskDeltaTokens.length > 0 && (
              <div className="pt-1.5 border-t border-zinc-800">
                <div className="text-[10px] text-zinc-400 mb-1">Risk:</div>
                <div className="flex flex-wrap gap-1.5">
                  {riskDeltaTokens.map((token, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded border text-[10px] ${getToneClasses(token.tone)}`}
                    >
                      {token.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Inflation axis pills */}
            {inflDeltaTokens && inflDeltaTokens.length > 0 && (
              <div className="pt-1.5 border-t border-zinc-800">
                <div className="text-[10px] text-zinc-400 mb-1">Inflation:</div>
                <div className="flex flex-wrap gap-1.5">
                  {inflDeltaTokens.map((token, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded border text-[10px] ${getToneClasses(token.tone)}`}
                    >
                      {token.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Biggest change */}
        {biggestChange && (
          <div className="pt-2 border-t border-zinc-800 group">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Tooltip content={biggestChange.tooltip}>
                  <div className="text-zinc-300 text-[10px]">
                    {onJump ? (
                      <button
                        onClick={handleJump}
                        className="text-left hover:text-amber-300/80 transition-colors"
                      >
                        <strong className="text-amber-300/80">{COMPARE_BIGGEST_CHANGE_LABEL}</strong>{' '}
                        {biggestChange.headline}
                        {biggestChange.detail && (
                          <span className="text-zinc-400 ml-1">({biggestChange.detail})</span>
                        )}
                      </button>
                    ) : (
                      <>
                        <strong className="text-amber-300/80">{COMPARE_BIGGEST_CHANGE_LABEL}</strong>{' '}
                        {biggestChange.headline}
                        {biggestChange.detail && (
                          <span className="text-zinc-400 ml-1">({biggestChange.detail})</span>
                        )}
                      </>
                    )}
                  </div>
                </Tooltip>
              </div>
              {/* Copy button - visible on hover (desktop) and always on mobile */}
              <Tooltip content={biggestChangeCopied ? COPY_BIGGEST_CHANGE_COPIED : COPY_BIGGEST_CHANGE_TOOLTIP}>
                <button
                  onClick={handleCopyBiggestChange}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 hover:border-zinc-600"
                  aria-label={COPY_BIGGEST_CHANGE_TOOLTIP}
                >
                  {biggestChangeCopied ? '✓' : 'Copy'}
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
