'use client';

import Link from 'next/link';
import type { GhostRegimeScaleData, ScaledLineupItem } from '@/lib/houseScaling';
import type { HouseModelSpec } from '@/lib/houseModels';
import type { GoldInstrument, BtcInstrument } from '@/lib/types';
import {
  getSoWhatLines,
  summarizeLastChange,
  computeRebalanceActions,
  getHouseModelTargets,
  type GhostRegimeHistoryRow,
} from '@/lib/ghostregime/education';
import { getHouseModelWithWrappers } from '@/lib/houseModels';
import {
  BUILDER_GHOSTREGIME_SNAPSHOT_TITLE,
  BUILDER_STALE_BADGE,
  BUILDER_SO_WHAT_INTRO_LINE,
  BUILDER_CHANGE_SUMMARY_HEADER,
  BUILDER_NO_CHANGE_LINE,
  BUILDER_CHANGE_SUMMARY_FALLBACK_LINE,
  BUILDER_LINK_DASHBOARD,
  BUILDER_LINK_METHODOLOGY,
  BUILDER_GLOSSARY_SUMMARY,
  BUILDER_GLOSSARY_ITEMS,
  BUILDER_SCALING_CALLOUT_TITLE,
  BUILDER_SCALING_AS_OF_PREFIX,
  BUILDER_SCALING_STOCKS_LABEL,
  BUILDER_SCALING_GOLD_LABEL,
  BUILDER_SCALING_BTC_LABEL,
  BUILDER_SCALING_CADENCE_LINE,
  BUILDER_REBALANCE_TITLE,
  BUILDER_REBALANCE_SUBTITLE,
  BUILDER_REBALANCE_INTRO,
  BUILDER_REBALANCE_CASH_NOTE,
  BUILDER_DO_NOTHING_LINE,
  BUILDER_EXECUTION_HINT_SUMMARY,
  BUILDER_EXECUTION_HINT_LINES,
  BUILDER_WHY_SETUP_TITLE,
  BUILDER_WHY_SETUP_STOCKS_TEMPLATE,
  BUILDER_WHY_SETUP_GOLD_TEMPLATE,
  BUILDER_WHY_SETUP_BTC_TEMPLATE,
  BUILDER_WHY_SETUP_DIVERSIFICATION_NOTE,
  BUILDER_WHY_SETUP_TARGET_SCOPE_NOTE,
  BUILDER_SCALE_EXPLANATION_SUMMARY,
  BUILDER_SCALE_EXPLANATION_ITEMS,
  BUILDER_SCALE_CASH_EXPLANATION_LINE,
  BUILDER_SCALING_MISSING_LINE,
  BUILDER_DATA_UNAVAILABLE_LINE,
  BUILDER_CASH_LABEL,
  BUILDER_CASH_DISTINCTION_LINE,
  BUILDER_CASH_EXPLANATION_LINE,
} from '@/lib/ghostregime/builderCopy';

export interface GhostRegimeHouseEducationProps {
  houseModel: HouseModelSpec;
  ghostRegimeData: GhostRegimeScaleData | null;
  ghostRegimeFull: {
    regime: string;
    risk_regime: string;
    date?: string;
    stale?: boolean;
  } | null;
  ghostRegimeHistory: GhostRegimeHistoryRow[] | null;
  ghostRegimeHistoryError: boolean;
  scaledLineup: ScaledLineupItem[];
  rebalanceThresholdPct?: number;
  goldInstrument: GoldInstrument;
  btcInstrument: BtcInstrument;
  ghostRegimeError?: boolean;
}

/**
 * GhostRegime House Education Component
 * Renders micro-education panels for house preset users:
 * - GhostRegime Snapshot
 * - What changed since last update
 * - Rebalance cheatsheet
 * - Why this setup?
 * - Scaled lineup
 */
export default function GhostRegimeHouseEducation({
  houseModel,
  ghostRegimeData,
  ghostRegimeFull,
  ghostRegimeHistory,
  ghostRegimeHistoryError,
  scaledLineup,
  rebalanceThresholdPct = 3,
  goldInstrument,
  btcInstrument,
  ghostRegimeError = false,
}: GhostRegimeHouseEducationProps) {
  // Dev-only sanity checks
  if (process.env.NODE_ENV !== 'production') {
    const total = scaledLineup.reduce((sum, item) => sum + item.actualPct, 0);
    if (Math.abs(total - 100) > 1) {
      console.warn(
        `[GhostRegimeHouseEducation] Scaled lineup sums to ${total.toFixed(2)}%, expected ~100%`
      );
    }
    scaledLineup.forEach((item) => {
      if (isNaN(item.actualPct) || isNaN(item.targetPct) || isNaN(item.scale)) {
        console.warn(`[GhostRegimeHouseEducation] NaN detected in lineup item:`, item);
      }
    });
  }

  const goldLabel = goldInstrument === 'ygld' ? 'YGLD (income wrapper)' : 'GLDM';
  const btcLabel = btcInstrument === 'maxi' ? 'MAXI (income wrapper)' : 'FBTC';
  const { stocksTarget, goldTarget, btcTarget } = getHouseModelTargets(houseModel);

  if (ghostRegimeData) {
    // Active GhostRegime data available
    const soWhatLines = getSoWhatLines(ghostRegimeData);
    const rebalanceActions = computeRebalanceActions(scaledLineup, rebalanceThresholdPct);

    // Compute change summary
    let changeSummary: string[] | null = null;
    if (ghostRegimeHistory && ghostRegimeHistory.length >= 2) {
      const [current, previous] = ghostRegimeHistory;
      changeSummary = summarizeLastChange(current, previous);
    }

    return (
      <>
        {/* GhostRegime Snapshot Panel */}
        <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            {BUILDER_GHOSTREGIME_SNAPSHOT_TITLE}
          </h3>

          {/* Current state chips */}
          <div className="flex flex-wrap gap-2 text-[10px]">
            {ghostRegimeFull && (
              <>
                <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">
                  {ghostRegimeFull.regime}
                </span>
                <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">
                  {ghostRegimeFull.risk_regime}
                </span>
              </>
            )}
            {ghostRegimeData.date && (
              <span className="px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                {new Date(ghostRegimeData.date).toLocaleDateString()}
              </span>
            )}
            {ghostRegimeData.stale && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px]">
                {BUILDER_STALE_BADGE}
              </span>
            )}
          </div>

          {/* "So what?" explanation */}
          {soWhatLines.length > 0 && (
            <div className="text-[11px] text-zinc-300 space-y-1">
              {soWhatLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
              <p className="text-zinc-400 italic">{BUILDER_SO_WHAT_INTRO_LINE}</p>
            </div>
          )}

          {/* What changed section */}
          {changeSummary !== null ? (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-400 font-medium mb-1.5">
                {BUILDER_CHANGE_SUMMARY_HEADER}
              </p>
              <div className="text-[10px] text-zinc-300 space-y-1">
                {changeSummary.length === 0 ? (
                  <p className="text-zinc-400 italic">{BUILDER_NO_CHANGE_LINE}</p>
                ) : (
                  changeSummary.map((change, idx) => <p key={idx}>{change}</p>)
                )}
              </div>
            </div>
          ) : ghostRegimeHistoryError ? (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 italic">
                {BUILDER_CHANGE_SUMMARY_FALLBACK_LINE}
              </p>
            </div>
          ) : null}

          {/* Links */}
          <div className="pt-2 border-t border-zinc-800 flex gap-3">
            <Link
              href="/ghostregime"
              className="text-[10px] text-amber-400 hover:text-amber-300 underline"
            >
              {BUILDER_LINK_DASHBOARD}
            </Link>
            <Link
              href="/ghostregime/methodology"
              className="text-[10px] text-amber-400 hover:text-amber-300 underline"
            >
              {BUILDER_LINK_METHODOLOGY}
            </Link>
          </div>

          {/* Micro-glossary */}
          <details className="text-[10px] text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-400">
              {BUILDER_GLOSSARY_SUMMARY}
            </summary>
            <div className="mt-2 space-y-1 pl-2">
              {BUILDER_GLOSSARY_ITEMS.map((item) => (
                <p key={item.term}>
                  <strong className="text-zinc-400">{item.term}</strong> = {item.definition}
                </p>
              ))}
            </div>
          </details>
        </div>

        {/* GhostRegime scaling callout */}
        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-amber-200 font-medium">{BUILDER_SCALING_CALLOUT_TITLE}</span>
            {ghostRegimeData.stale && (
              <span className="text-amber-400/80 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">
                {BUILDER_STALE_BADGE}
              </span>
            )}
          </div>
          {ghostRegimeData.date && (
            <p className="text-zinc-400 text-[10px] mb-1">
              {BUILDER_SCALING_AS_OF_PREFIX}
              {new Date(ghostRegimeData.date).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-3 text-[10px] text-zinc-300 mt-1">
            <span>
              {BUILDER_SCALING_STOCKS_LABEL}
              {ghostRegimeData.stocks_scale.toFixed(2)}
            </span>
            <span>
              {BUILDER_SCALING_GOLD_LABEL}
              {ghostRegimeData.gold_scale.toFixed(2)}
            </span>
            <span>
              {BUILDER_SCALING_BTC_LABEL}
              {ghostRegimeData.btc_scale.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">{BUILDER_SCALING_CADENCE_LINE}</p>
        </div>

        {/* Rebalance Cheatsheet */}
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              {BUILDER_REBALANCE_TITLE}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">{BUILDER_REBALANCE_SUBTITLE}</p>
          </div>

          {rebalanceActions.trims.length > 0 || rebalanceActions.adds.length > 0 ? (
            <div className="space-y-2 text-[11px] text-zinc-300">
              <p className="text-zinc-400 font-medium">{BUILDER_REBALANCE_INTRO}</p>
              <ul className="space-y-1 pl-4 list-disc">
                {rebalanceActions.trims.map((d) => (
                  <li key={d.ticker}>
                    Trim {d.ticker} by ~{Math.abs(d.delta).toFixed(1)}%
                  </li>
                ))}
                {rebalanceActions.adds.map((d) => (
                  <li key={d.ticker}>
                    Add {d.ticker} by ~{Math.abs(d.delta).toFixed(1)}%
                  </li>
                ))}
                {rebalanceActions.hasCash && rebalanceActions.adds.length > 0 && (
                  <li className="text-zinc-400 italic">{BUILDER_REBALANCE_CASH_NOTE}</li>
                )}
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-300">{BUILDER_DO_NOTHING_LINE}</p>
          )}

          {/* How do I execute this? */}
          <details className="text-[10px] text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-400">
              {BUILDER_EXECUTION_HINT_SUMMARY}
            </summary>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              {BUILDER_EXECUTION_HINT_LINES.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </details>
        </div>

        {/* Why this setup? */}
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            {BUILDER_WHY_SETUP_TITLE}
          </h3>

          {/* Why 60/30/10? */}
          <details className="text-[11px] text-zinc-300">
            <summary className="cursor-pointer hover:text-zinc-400 font-medium">
              Why {stocksTarget}/{goldTarget}/{btcTarget}?
            </summary>
            <div className="mt-2 space-y-1.5 pl-2">
              <p>
                <strong className="text-zinc-200">
                  {BUILDER_WHY_SETUP_STOCKS_TEMPLATE.label.replace('{stocks}', `${stocksTarget}`)}
                </strong>{' '}
                {BUILDER_WHY_SETUP_STOCKS_TEMPLATE.description.replace(
                  '{ticker}',
                  houseModel.allocations.find((a) => a.id === 'spym')?.ticker ?? 'SPYM'
                )}
              </p>
              <p>
                <strong className="text-zinc-200">
                  {BUILDER_WHY_SETUP_GOLD_TEMPLATE.label.replace('{gold}', `${goldTarget}`)}
                </strong>{' '}
                {BUILDER_WHY_SETUP_GOLD_TEMPLATE.description.replace('{label}', goldLabel)}
              </p>
              <p>
                <strong className="text-zinc-200">
                  {BUILDER_WHY_SETUP_BTC_TEMPLATE.label.replace('{btc}', `${btcTarget}`)}
                </strong>{' '}
                {BUILDER_WHY_SETUP_BTC_TEMPLATE.description.replace('{label}', btcLabel)}
              </p>
              <p className="text-zinc-400 italic mt-2">{BUILDER_WHY_SETUP_DIVERSIFICATION_NOTE}</p>
              <p className="text-[10px] text-zinc-500 mt-2">{BUILDER_WHY_SETUP_TARGET_SCOPE_NOTE}</p>
            </div>
          </details>

          {/* What do the scales mean? */}
          <details className="text-[11px] text-zinc-300">
            <summary className="cursor-pointer hover:text-zinc-400 font-medium">
              {BUILDER_SCALE_EXPLANATION_SUMMARY}
            </summary>
            <div className="mt-2 space-y-1.5 pl-2">
              <ul className="space-y-1 pl-4 list-disc">
                {BUILDER_SCALE_EXPLANATION_ITEMS.map((item) => (
                  <li key={item.value}>
                    <strong className="text-zinc-200">{item.value}</strong> = {item.description}
                  </li>
                ))}
              </ul>
              <p className="text-zinc-400 text-[10px] mt-2">
                {BUILDER_SCALE_CASH_EXPLANATION_LINE}
              </p>
            </div>
          </details>
        </div>

        {/* Scaled lineup */}
        <div className="mt-2 space-y-2 text-xs text-zinc-300 leading-relaxed">
          {scaledLineup.map((item) => (
            <div key={item.id} className="rounded-lg border border-zinc-800 bg-black/40 p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="font-mono text-sm font-semibold">
                    {item.isCash ? 'CASH' : item.ticker}
                  </span>
                  <span className="text-xs text-zinc-400 ml-2">
                    {item.isCash ? BUILDER_CASH_LABEL : item.label}
                  </span>
                </div>
                <div className="text-right">
                  {item.isCash ? (
                    <span className="text-sm font-semibold text-amber-300">
                      {item.actualPct.toFixed(1)}%
                    </span>
                  ) : (
                    <div>
                      <span className="text-sm font-semibold text-amber-300">
                        {item.actualPct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-1">
                        ({item.targetPct}% × {item.scale.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {item.isCash && (
                <div className="mt-1 space-y-1">
                  <p className="text-[11px] text-zinc-400">{BUILDER_CASH_DISTINCTION_LINE}</p>
                  <p className="text-[10px] text-zinc-500 italic">
                    {BUILDER_CASH_EXPLANATION_LINE}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  // Fallback: no GhostRegime data
  return (
    <>
      {/* Static lineup (fallback) */}
      {ghostRegimeError && (
        <p className="text-[11px] text-zinc-500 mt-2 italic">{BUILDER_DATA_UNAVAILABLE_LINE}</p>
      )}

      {/* Why this setup? (static targets) */}
      <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
          {BUILDER_WHY_SETUP_TITLE}
        </h3>

        {/* Why 60/30/10? */}
        <details className="text-[11px] text-zinc-300">
          <summary className="cursor-pointer hover:text-zinc-400 font-medium">
            Why {stocksTarget}/{goldTarget}/{btcTarget}?
          </summary>
          <div className="mt-2 space-y-1.5 pl-2">
            <p>
              <strong className="text-zinc-200">
                {BUILDER_WHY_SETUP_STOCKS_TEMPLATE.label.replace('{stocks}', `${stocksTarget}`)}
              </strong>{' '}
              {BUILDER_WHY_SETUP_STOCKS_TEMPLATE.description.replace(
                '{ticker}',
                houseModel.allocations.find((a) => a.id === 'spym')?.ticker ?? 'SPYM'
              )}
            </p>
            <p>
              <strong className="text-zinc-200">
                {BUILDER_WHY_SETUP_GOLD_TEMPLATE.label.replace('{gold}', `${goldTarget}`)}
              </strong>{' '}
              {BUILDER_WHY_SETUP_GOLD_TEMPLATE.description.replace('{label}', goldLabel)}
            </p>
            <p>
              <strong className="text-zinc-200">
                {BUILDER_WHY_SETUP_BTC_TEMPLATE.label.replace('{btc}', `${btcTarget}`)}
              </strong>{' '}
              {BUILDER_WHY_SETUP_BTC_TEMPLATE.description.replace('{label}', btcLabel)}
            </p>
            <p className="text-zinc-400 italic mt-2">{BUILDER_WHY_SETUP_DIVERSIFICATION_NOTE}</p>
            <p className="text-[10px] text-zinc-500 mt-2">{BUILDER_WHY_SETUP_TARGET_SCOPE_NOTE}</p>
          </div>
        </details>

        {/* What do the scales mean? */}
        <details className="text-[11px] text-zinc-300">
          <summary className="cursor-pointer hover:text-zinc-400 font-medium">
            {BUILDER_SCALE_EXPLANATION_SUMMARY}
          </summary>
          <div className="mt-2 space-y-1.5 pl-2">
            <p className="text-zinc-400 text-[10px]">{BUILDER_SCALING_MISSING_LINE}</p>
          </div>
        </details>
      </div>

      {/* Rebalance Cheatsheet (static targets) */}
      <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            {BUILDER_REBALANCE_TITLE}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">{BUILDER_REBALANCE_SUBTITLE}</p>
        </div>

        <p className="text-[11px] text-zinc-300">{BUILDER_DO_NOTHING_LINE}</p>

        {/* How do I execute this? */}
        <details className="text-[10px] text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-400">
            {BUILDER_EXECUTION_HINT_SUMMARY}
          </summary>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            {BUILDER_EXECUTION_HINT_LINES.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </details>
      </div>

      {/* Static lineup */}
      <div className="mt-2 space-y-2 text-xs text-zinc-300 leading-relaxed">
        {getHouseModelWithWrappers(houseModel.id, goldInstrument, btcInstrument).map((alloc) => (
          <div key={alloc.id} className="rounded-lg border border-zinc-800 bg-black/40 p-4">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-semibold">{alloc.ticker}</span>
                <span className="text-xs text-zinc-400 ml-2">{alloc.label}</span>
              </div>
              <span className="text-sm font-semibold text-amber-300">{alloc.pct}%</span>
            </div>
            {alloc.notes && <p className="text-[11px] text-zinc-400 mt-1">{alloc.notes}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

