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
            GhostRegime snapshot
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
                Stale
              </span>
            )}
          </div>

          {/* "So what?" explanation */}
          {soWhatLines.length > 0 && (
            <div className="text-[11px] text-zinc-300 space-y-1">
              {soWhatLines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
              <p className="text-zinc-400 italic">
                Anything scaled down sits as Schwab cash until you rebalance.
              </p>
            </div>
          )}

          {/* What changed section */}
          {changeSummary !== null ? (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-400 font-medium mb-1.5">
                What changed since last update:
              </p>
              <div className="text-[10px] text-zinc-300 space-y-1">
                {changeSummary.length === 0 ? (
                  <p className="text-zinc-400 italic">
                    No change since the last update. Markets were boring. (Enjoy it.)
                  </p>
                ) : (
                  changeSummary.map((change, idx) => <p key={idx}>{change}</p>)
                )}
              </div>
            </div>
          ) : ghostRegimeHistoryError ? (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 italic">
                Change summary unavailable — showing today&apos;s snapshot only.
              </p>
            </div>
          ) : null}

          {/* Links */}
          <div className="pt-2 border-t border-zinc-800 flex gap-3">
            <Link
              href="/ghostregime"
              className="text-[10px] text-amber-400 hover:text-amber-300 underline"
            >
              Open dashboard
            </Link>
            <Link
              href="/ghostregime/methodology"
              className="text-[10px] text-amber-400 hover:text-amber-300 underline"
            >
              Read methodology
            </Link>
          </div>

          {/* Micro-glossary */}
          <details className="text-[10px] text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-400">What do these mean?</summary>
            <div className="mt-2 space-y-1 pl-2">
              <p>
                <strong className="text-zinc-400">Regime</strong> = macro backdrop (growth/inflation
                mix).
              </p>
              <p>
                <strong className="text-zinc-400">Scales</strong> = how much exposure we&apos;re
                taking today (1, 0.5, 0).
              </p>
              <p>
                <strong className="text-zinc-400">Cash</strong> = unallocated Schwab cash created
                when something is scaled down.
              </p>
            </div>
          </details>
        </div>

        {/* GhostRegime scaling callout */}
        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-amber-200 font-medium">GhostRegime scaling applied</span>
            {ghostRegimeData.stale && (
              <span className="text-amber-400/80 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px]">
                Stale
              </span>
            )}
          </div>
          {ghostRegimeData.date && (
            <p className="text-zinc-400 text-[10px] mb-1">
              As of: {new Date(ghostRegimeData.date).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-3 text-[10px] text-zinc-300 mt-1">
            <span>Stocks ×{ghostRegimeData.stocks_scale.toFixed(2)}</span>
            <span>Gold ×{ghostRegimeData.gold_scale.toFixed(2)}</span>
            <span>BTC ×{ghostRegimeData.btc_scale.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            Targets can change as regimes change. Most people apply changes on a simple cadence
            (e.g., monthly) rather than reacting daily.
          </p>
        </div>

        {/* Rebalance Cheatsheet */}
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
              Rebalance cheatsheet
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Based on your Schwab slice. Use your chosen cadence.
            </p>
          </div>

          {rebalanceActions.trims.length > 0 || rebalanceActions.adds.length > 0 ? (
            <div className="space-y-2 text-[11px] text-zinc-300">
              <p className="text-zinc-400 font-medium">If you&apos;re rebalancing today:</p>
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
                  <li className="text-zinc-400 italic">Use Schwab cash to fund the adds</li>
                )}
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-300">
              You&apos;re basically on target. Do nothing. Touch grass.
            </p>
          )}

          {/* How do I execute this? */}
          <details className="text-[10px] text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-400">How do I execute this?</summary>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>In Schwab, you&apos;re adjusting ETFs + Schwab cash.</li>
              <li>In Voya, you&apos;re adjusting core funds (Stable Value is cash-like).</li>
              <li>House preset uses Schwab for Gold/BTC exposure.</li>
            </ul>
          </details>
        </div>

        {/* Why this setup? */}
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            Why this setup?
          </h3>

          {/* Why 60/30/10? */}
          <details className="text-[11px] text-zinc-300">
            <summary className="cursor-pointer hover:text-zinc-400 font-medium">
              Why {stocksTarget}/{goldTarget}/{btcTarget}?
            </summary>
            <div className="mt-2 space-y-1.5 pl-2">
              <p>
                <strong className="text-zinc-200">{stocksTarget}% Stocks</strong> = growth engine
                ({houseModel.allocations.find((a) => a.id === 'spym')?.ticker ?? 'SPYM'})
              </p>
              <p>
                <strong className="text-zinc-200">{goldTarget}% Gold</strong> = inflation/monetary
                weirdness hedge ({goldLabel})
              </p>
              <p>
                <strong className="text-zinc-200">{btcTarget}% Bitcoin</strong> = asymmetric
                &quot;call option on chaos&quot; ({btcLabel})
              </p>
              <p className="text-zinc-400 italic mt-2">
                It&apos;s diversified… but still admits we live in interesting times.
              </p>
              <p className="text-[10px] text-zinc-500 mt-2">
                These targets are for your Schwab brokerage slice (not your whole 457).
              </p>
            </div>
          </details>

          {/* What do the scales mean? */}
          <details className="text-[11px] text-zinc-300">
            <summary className="cursor-pointer hover:text-zinc-400 font-medium">
              What do the scales mean?
            </summary>
            <div className="mt-2 space-y-1.5 pl-2">
              <ul className="space-y-1 pl-4 list-disc">
                <li>
                  <strong className="text-zinc-200">1.0</strong> = full size (normal exposure)
                </li>
                <li>
                  <strong className="text-zinc-200">0.5</strong> = half size (cautious)
                </li>
                <li>
                  <strong className="text-zinc-200">0.0</strong> = off (risk control)
                </li>
              </ul>
              <p className="text-zinc-400 text-[10px] mt-2">
                When something is scaled down, the unused portion sits as Schwab cash (unallocated)
                until your next rebalance.
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
                    {item.isCash ? 'Schwab cash (unallocated)' : item.label}
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
                  <p className="text-[11px] text-zinc-400">
                    This is cash sitting in your Schwab brokerage slice — not your Voya
                    &quot;Stable Value Option&quot;.
                  </p>
                  <p className="text-[10px] text-zinc-500 italic">
                    When GhostRegime scales an asset down, the difference stays as Schwab cash until
                    you rebalance.
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
        <p className="text-[11px] text-zinc-500 mt-2 italic">
          GhostRegime data isn&apos;t available right now — showing base targets (no scaling).
        </p>
      )}

      {/* Why this setup? (static targets) */}
      <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
          Why this setup?
        </h3>

        {/* Why 60/30/10? */}
        <details className="text-[11px] text-zinc-300">
          <summary className="cursor-pointer hover:text-zinc-400 font-medium">
            Why {stocksTarget}/{goldTarget}/{btcTarget}?
          </summary>
          <div className="mt-2 space-y-1.5 pl-2">
            <p>
              <strong className="text-zinc-200">{stocksTarget}% Stocks</strong> = growth engine
              ({houseModel.allocations.find((a) => a.id === 'spym')?.ticker ?? 'SPYM'})
            </p>
            <p>
              <strong className="text-zinc-200">{goldTarget}% Gold</strong> = inflation/monetary
              weirdness hedge ({goldLabel})
            </p>
            <p>
              <strong className="text-zinc-200">{btcTarget}% Bitcoin</strong> = asymmetric
              &quot;call option on chaos&quot; ({btcLabel})
            </p>
            <p className="text-zinc-400 italic mt-2">
              It&apos;s diversified… but still admits we live in interesting times.
            </p>
            <p className="text-[10px] text-zinc-500 mt-2">
              These targets are for your Schwab brokerage slice (not your whole 457).
            </p>
          </div>
        </details>

        {/* What do the scales mean? */}
        <details className="text-[11px] text-zinc-300">
          <summary className="cursor-pointer hover:text-zinc-400 font-medium">
            What do the scales mean?
          </summary>
          <div className="mt-2 space-y-1.5 pl-2">
            <p className="text-zinc-400 text-[10px]">
              Scales come from GhostRegime. Data isn&apos;t available right now, so you&apos;re
              seeing base targets (no scaling).
            </p>
          </div>
        </details>
      </div>

      {/* Rebalance Cheatsheet (static targets) */}
      <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            Rebalance cheatsheet
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Based on your Schwab slice. Use your chosen cadence.
          </p>
        </div>

        <p className="text-[11px] text-zinc-300">
          You&apos;re basically on target. Do nothing. Touch grass.
        </p>

        {/* How do I execute this? */}
        <details className="text-[10px] text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-400">How do I execute this?</summary>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>In Schwab, you&apos;re adjusting ETFs + Schwab cash.</li>
            <li>In Voya, you&apos;re adjusting core funds (Stable Value is cash-like).</li>
            <li>House preset uses Schwab for Gold/BTC exposure.</li>
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

