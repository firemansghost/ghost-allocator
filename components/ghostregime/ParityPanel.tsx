/**
 * GhostRegime Parity Panel
 * 
 * If you change data schema/providers, update loaders/tests. UI should not lie.
 * 
 * Debug panel for viewing 42 Macro KISS reference allocations.
 * This is a parity validation tool - NOT for normal GhostRegime computation.
 */

'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Tooltip } from '@/components/Tooltip';
import type {
  KissLatestSnapshot,
  KissAllocationOutput,
} from '@/lib/ghostregime/parity/kissTypes';
import {
  loadKissLatestSnapshot,
} from '@/lib/ghostregime/parity/kissLoaders.browser';
import {
  computeKissAllocations,
  scaleFromState,
} from '@/lib/ghostregime/parity/kissAlloc';

export interface ParityPanelProps {
  onClose?: () => void;
}

export function ParityPanel({ onClose }: ParityPanelProps) {
  const [snapshot, setSnapshot] = useState<KissLatestSnapshot | null>(null);
  const [allocations, setAllocations] = useState<KissAllocationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSnapshot = async () => {
    try {
      setError(null);
      const loaded = await loadKissLatestSnapshot();
      setSnapshot(loaded);
      
      const computed = computeKissAllocations({
        marketRegime: loaded.market_regime,
        stocksState: loaded.states.es1_state,
        goldState: loaded.states.xau_state,
        bitcoinState: loaded.states.xbt_state,
      });
      setAllocations(computed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshot');
    }
  };

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Parity: 42 Macro KISS</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-300"
          >
            Close
          </button>
        )}
      </div>

      <div className="text-xs text-zinc-400 space-y-2">
        <p>
          This panel shows allocations computed using 42 Macro KISS reference logic.
          It validates that our allocation wiring matches the KISS workbook.
        </p>
        <p className="text-amber-400/80">
          <strong>Note:</strong> This does NOT reverse-engineer KISS state computation.
          It only validates allocation math when states are known.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleLoadSnapshot}
          className="px-3 py-1.5 text-xs rounded border border-amber-400/30 bg-amber-400/5 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 hover:border-amber-400/50 transition-colors"
        >
          Load KISS Reference Snapshot
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/30 rounded px-3 py-2">
          {error}
        </div>
      )}

      {snapshot && allocations && (
        <div className="space-y-4 pt-2 border-t border-zinc-700">
          {/* Snapshot Info */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">Snapshot Info</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Date:</span>{' '}
                <span className="text-zinc-200">{snapshot.date}</span>
              </div>
              <div>
                <span className="text-zinc-500">Market Regime:</span>{' '}
                <span className="text-zinc-200">{snapshot.market_regime}</span>
              </div>
              <div>
                <span className="text-zinc-500">Risk Regime:</span>{' '}
                <span className="text-zinc-200">{snapshot.risk_regime}</span>
              </div>
            </div>
          </div>

          {/* States */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">States</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">ES1:</span>{' '}
                <span className="text-zinc-200">{snapshot.states.es1_state}</span>
              </div>
              <div>
                <span className="text-zinc-500">XAU:</span>{' '}
                <span className="text-zinc-200">{snapshot.states.xau_state}</span>
              </div>
              <div>
                <span className="text-zinc-500">XBT:</span>{' '}
                <span className="text-zinc-200">{snapshot.states.xbt_state}</span>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              State mapping: +2 → 1.0, 0 → 0.5, -2 → 0.0
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">Targets</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Stocks:</span>{' '}
                <span className="text-zinc-200">{(allocations.stocks_target * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Gold:</span>{' '}
                <span className="text-zinc-200">{(allocations.gold_target * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Bitcoin:</span>{' '}
                <span className="text-zinc-200">{(allocations.bitcoin_target * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Scales */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">Scales (from states)</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Stocks:</span>{' '}
                <span className="text-zinc-200">{allocations.stocks_scale.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Gold:</span>{' '}
                <span className="text-zinc-200">{allocations.gold_scale.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Bitcoin:</span>{' '}
                <span className="text-zinc-200">{allocations.bitcoin_scale.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Final Allocations */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-300">Final Allocations</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Stocks:</span>{' '}
                <span className="text-zinc-200">{(allocations.stocks_actual * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Gold:</span>{' '}
                <span className="text-zinc-200">{(allocations.gold_actual * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Bitcoin:</span>{' '}
                <span className={`${allocations.bitcoin_actual === 0 ? 'text-amber-400 font-medium' : 'text-zinc-200'}`}>
                  {(allocations.bitcoin_actual * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Cash:</span>{' '}
                <span className="text-zinc-200">{(allocations.cash * 100).toFixed(1)}%</span>
              </div>
            </div>
            {allocations.bitcoin_actual === 0 && (
              <div className="text-[10px] text-amber-400/80 mt-1">
                ✓ Bitcoin is 0% when state is -2 (correct)
              </div>
            )}
          </div>

          {/* KISS Sheet Reference */}
          <div className="space-y-2 pt-2 border-t border-zinc-700">
            <div className="text-xs font-medium text-zinc-300">KISS Sheet Reference</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Stocks:</span>{' '}
                <span className="text-zinc-200">{(snapshot.kiss_sheet.stocks.actual * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Gold:</span>{' '}
                <span className="text-zinc-200">{(snapshot.kiss_sheet.gold.actual * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Bitcoin:</span>{' '}
                <span className="text-zinc-200">{(snapshot.kiss_sheet.bitcoin.actual * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Cash:</span>{' '}
                <span className="text-zinc-200">{(snapshot.kiss_sheet.cash.actual * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
