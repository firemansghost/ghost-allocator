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
          if (json.error === 'GHOSTREGIME_NOT_READY') {
            setError('Insufficient market data to compute regime. Please try again later.');
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
              <p className="text-xs text-zinc-400 uppercase tracking-wide">As-of</p>
              <p className="text-sm font-medium text-zinc-200">{data.date}</p>
            </div>
            {data.data_source && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Source</p>
                <p className="text-sm font-medium text-zinc-200">
                  {data.data_source}
                  {data.force_enabled && (
                    <span className="ml-2 text-[10px] text-amber-300">(forced)</span>
                  )}
                  {data.debug_enabled && (
                    <span className="ml-2 text-[10px] text-amber-300">(debug)</span>
                  )}
                </p>
              </div>
            )}
            {data.row_computed_at_utc && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Row Computed</p>
                <p className="text-[11px] text-zinc-300">
                  {new Date(data.row_computed_at_utc).toLocaleString()}
                </p>
              </div>
            )}
            {data.run_date_utc && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Served</p>
                <p className="text-[11px] text-zinc-300">
                  {new Date(data.run_date_utc).toLocaleString()}
                </p>
              </div>
            )}
            {(data.row_build_commit || data.build_commit) && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Build Commits</p>
                {data.row_build_commit && (
                  <p className="text-[10px] text-zinc-400">
                    Row: {data.row_build_commit.substring(0, 7)}
                  </p>
                )}
                {data.build_commit && (
                  <p className="text-[10px] text-zinc-400">
                    Server: {data.build_commit.substring(0, 7)}
                  </p>
                )}
              </div>
            )}
            {data.row_engine_version && (
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">Engine Version</p>
                <p className="text-[11px] text-zinc-300">{data.row_engine_version}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Regime</p>
              <p className="text-lg font-semibold text-amber-300">{data.regime}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Risk Regime</p>
              <p className="text-sm font-medium text-zinc-200">{data.risk_regime}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Risk Axis</p>
              <p className="text-sm font-medium text-zinc-200">
                {data.risk_axis}
                {data.risk_tiebreaker_used && (
                  <span className="ml-2 inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    Tie-breaker used
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Inflation Axis</p>
              <p className="text-sm font-medium text-zinc-200">
                {data.infl_axis}
                {data.infl_tiebreaker_used && (
                  <span className="ml-2 inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    Tie-breaker used
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Flip Watch</p>
              <p className="text-sm font-medium text-zinc-200">{data.flip_watch_status}</p>
            </div>
            {data.core_proxy_used && Object.keys(data.core_proxy_used).length > 0 && (
              <div className="space-y-1 rounded-md border border-amber-400/30 bg-amber-400/10 p-2">
                <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide">
                  Proxy Used
                </p>
                {Object.entries(data.core_proxy_used).map(([original, proxy]) => (
                  <p key={original} className="text-[11px] text-amber-200">
                    {original} → {proxy}
                  </p>
                ))}
              </div>
            )}
            {data.stale && (
              <div className="space-y-2">
                <p className="text-[11px] text-amber-300">
                  Stale data: {data.stale_reason || 'Unknown reason'}
                </p>
                {data.missing_core_symbols && data.missing_core_symbols.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Missing symbols</p>
                    <p className="text-[11px] text-zinc-300">
                      {data.missing_core_symbols.join(', ')}
                    </p>
                  </div>
                )}
                {data.core_symbol_status && Object.keys(data.core_symbol_status).length > 0 && (
                  <details className="text-[10px]">
                    <summary className="text-zinc-400 cursor-pointer hover:text-zinc-300">
                      Core symbol status
                    </summary>
                    <div className="mt-2 space-y-1 text-[10px] text-zinc-400">
                      {Object.entries(data.core_symbol_status).map(([symbol, status]) => (
                        <div key={symbol} className="flex justify-between gap-2">
                          <span>{symbol}</span>
                          <span className={status.ok ? 'text-green-400' : 'text-red-400'}>
                            {status.ok ? '✓' : '✗'} {status.last_date || 'N/A'} ({status.obs} obs)
                            {status.note && ` - ${status.note}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
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

