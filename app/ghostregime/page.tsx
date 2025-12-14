/**
 * GhostRegime Main Page
 * Displays today's regime classification and allocations
 */

'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import type { GhostRegimeRow } from '@/lib/ghostregime/types';

export default function GhostRegimePage() {
  const [data, setData] = useState<GhostRegimeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notSeeded, setNotSeeded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check seed status (client-side check is limited, but we can try)
        const response = await fetch('/api/ghostregime/today');
        
        if (response.status === 503) {
          const json = await response.json();
          if (json.error === 'GHOSTREGIME_NOT_SEEDED') {
            setNotSeeded(true);
            setLoading(false);
            return;
          }
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const row = await response.json();
        setData(row);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (notSeeded) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
          <p className="text-sm text-zinc-300">
            Market regime classification and allocation system
          </p>
        </header>

        <GlassCard className="p-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-50">
              Seed Not Loaded
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              GhostRegime seed not loaded yet. Add seed CSV under{' '}
              <code className="text-amber-300">data/ghostregime/seed/</code>.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
          <p className="text-sm text-zinc-300">Loading...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
          <p className="text-sm text-zinc-300">Error loading data</p>
        </header>
        <GlassCard className="p-6">
          <p className="text-xs text-red-300">{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
        <p className="text-sm text-zinc-300">
          Market regime classification and allocation system
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Regime Classification */}
        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Regime Classification</h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Regime</p>
              <p className="text-lg font-semibold text-amber-300">{data.regime}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Risk Regime</p>
              <p className="text-sm font-medium text-zinc-200">{data.risk_regime}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Flip Watch</p>
              <p className="text-sm font-medium text-zinc-200">{data.flip_watch_status}</p>
            </div>
            {data.stale && (
              <div>
                <p className="text-[11px] text-amber-300">
                  Stale data: {data.stale_reason || 'Unknown reason'}
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Allocations */}
        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Allocations</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-300">Stocks</span>
              <span className="text-zinc-100">
                {(data.stocks_actual * 100).toFixed(1)}% (target: {(data.stocks_target * 100).toFixed(1)}%, scale: {(data.stocks_scale * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Gold</span>
              <span className="text-zinc-100">
                {(data.gold_actual * 100).toFixed(1)}% (target: {(data.gold_target * 100).toFixed(1)}%, scale: {(data.gold_scale * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">BTC</span>
              <span className="text-zinc-100">
                {(data.btc_actual * 100).toFixed(1)}% (target: {(data.btc_target * 100).toFixed(1)}%, scale: {(data.btc_scale * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Cash</span>
              <span className="text-zinc-100">{(data.cash * 100).toFixed(1)}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Scores */}
        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Scores</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-300">Risk Score</span>
              <span className="text-zinc-100">{data.risk_score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Inflation Score (Total)</span>
              <span className="text-zinc-100">{data.infl_score.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Inflation Core</span>
              <span className="text-zinc-100">{data.infl_core_score.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Inflation Satellites</span>
              <span className="text-zinc-100">{data.infl_sat_score.toFixed(2)}</span>
            </div>
          </div>
        </GlassCard>

        {/* VAMS States */}
        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">VAMS States</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-300">Stocks</span>
              <span className="text-zinc-100">{data.stocks_vams_state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Gold</span>
              <span className="text-zinc-100">{data.gold_vams_state}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">BTC</span>
              <span className="text-zinc-100">{data.btc_vams_state}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="pt-4">
        <a
          href="/ghostregime/methodology"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          View Methodology →
        </a>
      </div>
    </div>
  );
}

