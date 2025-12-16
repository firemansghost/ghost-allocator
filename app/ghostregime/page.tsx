/**
 * GhostRegime Main Page
 * Displays today's regime classification and allocations
 */

'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Tooltip } from '@/components/Tooltip';
import type { GhostRegimeRow } from '@/lib/ghostregime/types';
import Link from 'next/link';

interface HealthStatus {
  ok: boolean;
  status: 'OK' | 'WARN' | 'NOT_READY';
  freshness?: {
    latest_date: string;
    age_days: number;
    max_age_days: number;
    is_fresh: boolean;
  };
  warnings?: string[];
  message?: string;
}

export default function GhostRegimePage() {
  const [data, setData] = useState<GhostRegimeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notSeeded, setNotSeeded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both today's data and health status
        const [todayResponse, healthResponse] = await Promise.all([
          fetch('/api/ghostregime/today'),
          fetch('/api/ghostregime/health'),
        ]);
        
        // Handle health status
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          setHealthStatus(health);
        }
        
        // Handle today's data
        if (todayResponse.status === 503) {
          const json = await todayResponse.json();
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

        if (!todayResponse.ok) {
          throw new Error(`HTTP ${todayResponse.status}`);
        }

        const row = await todayResponse.json();
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

  // Format date for display (treat as calendar date, not UTC)
  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD as local calendar date to avoid timezone shift
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Check if data is stale or old
  const isStaleOrOld = data?.stale || (healthStatus?.status === 'WARN' && !healthStatus?.freshness?.is_fresh);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
        <p className="text-sm text-zinc-300">
          Rules-based signals for adjusting portfolio exposure
        </p>
      </header>

      {/* Stale/Old Data Banner */}
      {isStaleOrOld && (
        <GlassCard className="p-4 border-amber-400/30 bg-amber-400/10">
          <p className="text-xs text-amber-300">
            ⚠️ Heads up: The latest signal may be stale or old (weekends/holidays happen). 
            {data?.stale && data.stale_reason && ` Reason: ${data.stale_reason}`}
            {healthStatus?.freshness && !healthStatus.freshness.is_fresh && 
              ` Data is ${healthStatus.freshness.age_days} days old.`}
          </p>
        </GlassCard>
      )}

      {/* Today's Signal - Beginner View */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-4">Today's Signal</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide">As-of Date</p>
            <p className="text-sm font-medium text-zinc-200 mt-1">{formatDate(data.date)}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
              <Tooltip content="The model's read on the market &quot;weather&quot; (Goldilocks / Reflation / Inflation / Deflation). Not a prediction — a label for the lane we're driving in right now.">
                Regime
              </Tooltip>
            </p>
            <p className="text-lg font-semibold text-amber-300 mt-1">{data.regime}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
              <Tooltip content="Risk On: we give growth assets more leash. Risk Off: we cut exposure and play defense. Seatbelt, not bubble wrap.">
                Risk
              </Tooltip>
            </p>
            <p className="text-sm font-medium text-zinc-200 mt-1">
              <Tooltip content="Risk On: we give growth assets more leash. Risk Off: we cut exposure and play defense. Seatbelt, not bubble wrap.">
                {data.risk_regime}
              </Tooltip>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Inflation Axis</p>
            <p className="text-sm font-medium text-zinc-200 mt-1">{data.infl_axis}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-800 grid gap-2 sm:grid-cols-2 text-[11px] text-zinc-400">
          {data.row_computed_at_utc && (
            <div>
              <span className="text-zinc-500">Last updated: </span>
              <span>{formatTimestamp(data.row_computed_at_utc)}</span>
            </div>
          )}
          {data.run_date_utc && (
            <div>
              <span className="text-zinc-500">Served: </span>
              <span>{formatTimestamp(data.run_date_utc)}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* What This Means */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What This Means</h2>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>
              <strong className="text-zinc-200">
                <Tooltip content="Targets = the plan (top-down, based on regime). Actuals = what we hold after VAMS scales things to 100% / 50% / 0%. The gap usually shows up as cash.">
                  Targets (top-down)
                </Tooltip>
              </strong>: Stocks and BTC scale up/down based on{' '}
              <Tooltip content="Risk On: we give growth assets more leash. Risk Off: we cut exposure and play defense. Seatbelt, not bubble wrap.">
                Risk On/Off
              </Tooltip>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>
              <strong className="text-zinc-200">
                <Tooltip content="Targets = the plan (top-down, based on regime). Actuals = what we hold after VAMS scales things to 100% / 50% / 0%. The gap usually shows up as cash.">
                  Actuals (bottom-up)
                </Tooltip>
              </strong>:{' '}
              <Tooltip content="Volatility-Adjusted Momentum Signal. Trend + a volatility filter. Bullish = 100% of target, Neutral = 50%, Bearish = 0%. It's how we avoid overreacting to every tiny wiggle.">
                VAMS
              </Tooltip> can reduce exposure to 50% or 0% when volatility is high
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span><strong className="text-zinc-200">Cash:</strong> What's left when exposure is reduced</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Reality check: This won't protect you from every 2–5% wobble. It's built to help sidestep the 20% train wrecks — and get you back in when the trend turns.</span>
          </li>
        </ul>
      </GlassCard>

      {/* System Status */}
      {healthStatus && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">System Status</p>
              {healthStatus.status === 'OK' && (
                <p className="text-xs text-green-400 mt-1">✓ Data is fresh</p>
              )}
              {healthStatus.status === 'WARN' && (
                <div className="mt-1">
                  <p className="text-xs text-amber-300">⚠️ Warning</p>
                  {healthStatus.warnings && healthStatus.warnings.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-amber-200">
                      {healthStatus.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {healthStatus.status === 'NOT_READY' && (
                <p className="text-xs text-red-300 mt-1">
                  ✗ System not ready. Run force refresh via workflow.
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Use This Signal in Portfolio - Coming Soon */}
      <GlassCard className="p-6 border-amber-400/30 bg-amber-400/5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Use This Signal in Your Portfolio</h2>
        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          Soon you'll be able to apply GhostRegime signals to model portfolios. Pick a template, 
          map it to your 457 fund menu, and follow the target/actual exposures with simple rebalance steps.
        </p>
        <button
          disabled
          className="rounded-md bg-zinc-800 text-zinc-500 px-4 py-2 text-xs font-medium cursor-not-allowed"
        >
          Apply to a Model Portfolio (Coming Soon)
        </button>
      </GlassCard>

      {/* Advanced Details Toggle */}
      <div className="space-y-1">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          <span>Advanced Details (Nerd Mode)</span>
        </button>
        <p className="text-[11px] text-zinc-500 ml-6">
          {showAdvanced 
            ? "Receipts only: targets, actuals, VAMS states, and the 'what ran when' metadata. No new magic, just the paper trail."
            : "If you read commit hashes for fun, welcome home. If not, nothing down here changes the signal."}
        </p>
      </div>

      {showAdvanced && (
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
              <p className="text-xs text-zinc-400 uppercase tracking-wide">
                <Tooltip content="The model's read on the market &quot;weather&quot; (Goldilocks / Reflation / Inflation / Deflation). Not a prediction — a label for the lane we're driving in right now.">
                  Regime
                </Tooltip>
              </p>
              <p className="text-lg font-semibold text-amber-300">{data.regime}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">
                <Tooltip content="Risk On: we give growth assets more leash. Risk Off: we cut exposure and play defense. Seatbelt, not bubble wrap.">
                  Risk Regime
                </Tooltip>
              </p>
              <p className="text-sm font-medium text-zinc-200">{data.risk_regime}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">
                <Tooltip content="Risk On: we give growth assets more leash. Risk Off: we cut exposure and play defense. Seatbelt, not bubble wrap.">
                  Risk Axis
                </Tooltip>
              </p>
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

          {/* Advanced: Allocations */}
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-50">
              <Tooltip content="Targets = the plan (top-down, based on regime). Actuals = what we hold after VAMS scales things to 100% / 50% / 0%. The gap usually shows up as cash.">
                Allocations
              </Tooltip>
            </h2>
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

          {/* Advanced: Scores */}
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

          {/* Advanced: VAMS States */}
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-50">
              <Tooltip content="Volatility-Adjusted Momentum Signal. Trend + a volatility filter. Bullish = 100% of target, Neutral = 50%, Bearish = 0%. It's how we avoid overreacting to every tiny wiggle.">
                VAMS States
              </Tooltip>
            </h2>
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
      )}

      <div className="pt-4 flex gap-4">
        <Link
          href="/ghostregime/how-it-works"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          How It Works →
        </Link>
        <Link
          href="/models"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          Model Portfolios →
        </Link>
      </div>
    </div>
  );
}

