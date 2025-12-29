/**
 * GhostRegime Main Page
 * Displays today's regime classification and allocations
 */

'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Tooltip } from '@/components/Tooltip';
import { AllocationBar } from '@/components/AllocationBar';
import { AgreementChipStrip } from '@/components/ghostregime/AgreementChipStrip';
import type { GhostRegimeRow } from '@/lib/ghostregime/types';
import {
  formatBucketUtilizationLine,
  formatScaleLabel,
  getCashSources,
  buildTodaySnapshotLine,
  buildMicroFlowLine,
  REGIME_MAP,
  getRegimeMapPosition,
  summarizeGhostRegimeChangeDetailed,
  describeAxisFromScores,
  formatVamsState,
  getFlipWatchCopy,
  pickTopDrivers,
  formatDriverLine,
  formatSignedNumber,
  computeAxisAgreement,
  formatAgreementBadge,
  computeAgreementDelta,
  computeAgreementSeries,
} from '@/lib/ghostregime/ui';
import {
  WHY_REGIME_TITLE,
  FLIPWATCH_TITLE_PREFIX,
  FLIPWATCH_NONE_HINT,
  TOP_DRIVERS_TITLE,
  TOP_DRIVERS_RISK_HEADER,
  TOP_DRIVERS_INFLATION_HEADER,
  TOP_DRIVERS_FALLBACK,
  TOP_DRIVERS_FOOTNOTE,
  TOP_DRIVERS_NO_STRONG_DRIVERS,
  AGREEMENT_TOOLTIP,
  AGREEMENT_TOOLTIP_NA,
  AGREEMENT_HISTORY_LABEL,
  TOP_DRIVERS_OLD_DATA_HINT,
  AGREEMENT_HISTORY_HINT,
} from '@/lib/ghostregime/ghostregimePageCopy';
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
  const [historyChangeSummary, setHistoryChangeSummary] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAvailable, setHistoryAvailable] = useState(false);
  const [historyRows, setHistoryRows] = useState<GhostRegimeRow[]>([]);

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

  // Fetch history for "what changed" summary
  useEffect(() => {
    if (!data) return;

    async function fetchHistory() {
      if (!data) return; // TypeScript guard
      setHistoryLoading(true);
      try {
        const endDate = data.date;
        // Calculate start date (approximately 10 trading days back)
        const startDateObj = new Date(endDate);
        startDateObj.setDate(startDateObj.getDate() - 14); // 14 calendar days ≈ 10 trading days
        const startDate = startDateObj.toISOString().split('T')[0];

        const response = await fetch(
          `/api/ghostregime/history?startDate=${startDate}&endDate=${endDate}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          setHistoryAvailable(false);
          setHistoryChangeSummary(null);
          return;
        }

        const history: GhostRegimeRow[] = await response.json();
        
        // Get last 2 valid rows (sorted by date descending)
        const validRows = history
          .filter((row) => !row.stale && row.date)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 2);

        if (validRows.length >= 2) {
          setHistoryAvailable(true);
          const changes = summarizeGhostRegimeChangeDetailed(validRows[0], validRows[1]);
          
          // Add agreement trend lines if available
          const agreementDelta = computeAgreementDelta(validRows[0], validRows[1]);
          const agreementLines: string[] = [];
          if (agreementDelta.risk) {
            agreementLines.push(agreementDelta.risk.line);
          }
          if (agreementDelta.inflation) {
            agreementLines.push(agreementDelta.inflation.line);
          }
          
          // Combine all changes: agreement trends first, then other changes
          const allChanges = [...agreementLines, ...changes];
          const summary = allChanges.length > 0 ? allChanges.join('; ') : null;
          setHistoryChangeSummary(summary);
        } else {
          setHistoryAvailable(false);
          setHistoryChangeSummary(null);
        }
      } catch (err) {
        // Graceful degradation: don't break the page
        setHistoryAvailable(false);
        setHistoryChangeSummary(null);
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchHistory();
  }, [data]);

  if (notSeeded) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
          <p className="text-sm text-zinc-300">
            Market regime classification and allocation system
          </p>
        </header>

        <GlassCard className="p-6 border-amber-400/30 bg-amber-400/10">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-amber-300 mb-2">
                  Seed Data Not Loaded
                </h2>
                <p className="text-xs text-amber-200 leading-relaxed mb-3">
                  GhostRegime requires seed data to compute regime signals. Add the seed CSV file to enable the system.
                </p>
                <div className="rounded-md bg-black/40 p-3 border border-zinc-800">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Next Steps</p>
                  <p className="text-xs text-zinc-300">
                    Place your seed CSV at:{' '}
                    <code className="text-amber-300 font-mono">data/ghostregime/seed/ghostregime_replay_history.csv</code>
                  </p>
                </div>
              </div>
            </div>
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
          <p className="text-sm text-zinc-300">
            Market regime classification and allocation system
          </p>
        </header>
        <GlassCard className="p-6 border-red-400/30 bg-red-400/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-red-300 mb-2">
                Unable to Load Data
              </h2>
              <p className="text-xs text-red-200 leading-relaxed mb-3">
                {error}
              </p>
              <p className="text-[11px] text-zinc-400">
                If this persists, check that the GhostRegime service is running and seed data is available.
              </p>
            </div>
          </div>
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
  
  // Check flip watch status
  const flipWatchStatus = data?.flip_watch_status || 'NONE';
  const hasFlipWatch = flipWatchStatus !== 'NONE';

  return (
    <div className="space-y-6">
      {/* Hero Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
          <p className="text-sm text-zinc-300 mt-1">
            Rules-based signals for adjusting portfolio exposure
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Current Regime Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-400/30 bg-amber-400/10">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Current Regime</span>
            <span className="text-lg font-semibold text-amber-300">{data.regime}</span>
          </div>
          {/* Risk Regime Chip */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Risk</span>
            <span className="text-sm font-medium text-zinc-200">{data.risk_regime}</span>
          </div>
        </div>
      </div>

      {/* Timestamp & Stale Indicator */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span>As of {formatDate(data.date)}</span>
        {isStaleOrOld && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300">
            <span>⚠️</span>
            <span>Stale data</span>
            {healthStatus?.freshness && !healthStatus.freshness.is_fresh && (
              <span className="text-[10px]">({healthStatus.freshness.age_days} days old)</span>
            )}
          </span>
        )}
        {!isStaleOrOld && healthStatus?.status === 'OK' && (
          <span className="inline-flex items-center gap-1 text-green-400">
            <span>✓</span>
            <span>Fresh</span>
          </span>
        )}
      </div>

      {/* Today's Snapshot */}
      {buildTodaySnapshotLine(data) && (
        <div className="text-sm text-zinc-300 leading-relaxed">
          {buildTodaySnapshotLine(data)}
        </div>
      )}

      {/* What Changed Since Last Update */}
      {historyChangeSummary !== null && (
        <div className="text-xs text-zinc-400 leading-relaxed">
          Since last update: {historyChangeSummary}
        </div>
      )}
      {historyChangeSummary === null && !historyLoading && historyAvailable && data && (
        <div className="text-xs text-zinc-500 italic">
          No change since the last update. Markets were boring. (Enjoy it.)
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Regime + Flip Watch */}
        <div className="space-y-6">
          {/* Regime Map */}
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-zinc-50 mb-4">Regime Map</h2>
            <div className="space-y-3">
              {/* Axis labels */}
              <div className="grid grid-cols-3 gap-1 text-[10px] text-zinc-500 mb-2">
                <div className="text-center"></div>
                <div className="text-center flex items-center justify-center gap-1">
                  <span>Risk Off</span>
                  <span>←→</span>
                  <span>Risk On</span>
                </div>
                <div className="text-center"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                {/* Left axis label */}
                <div className="flex flex-col justify-center items-center text-[10px] text-zinc-500">
                  <span>Inflation</span>
                  <span className="text-xs">↑</span>
                  <span className="mt-1">↓</span>
                  <span>Disinflation</span>
                </div>
                
                {/* Grid */}
                <div className="grid grid-cols-2 gap-2 col-span-2">
                  {REGIME_MAP.map((mapPos) => {
                    const isCurrent = mapPos.regime === data.regime;
                    return (
                      <div
                        key={mapPos.regime}
                        className={`p-3 rounded border text-center transition-all ${
                          isCurrent
                            ? 'border-amber-400/60 bg-amber-400/10 ring-2 ring-amber-400/30'
                            : 'border-zinc-700 bg-zinc-900/30'
                        }`}
                      >
                        <div className="text-xs font-semibold text-zinc-200 mb-1">
                          {mapPos.label}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {mapPos.riskAxis} / {mapPos.inflAxis}
                        </div>
                        {isCurrent && (
                          <div className="mt-2 text-[10px] text-amber-300 font-medium">
                            You are here
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-2 border-t border-zinc-800">
                <Link
                  href="/ghostregime/methodology"
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
                >
                  Read methodology →
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Why This Regime Today */}
          {(() => {
            const axisDesc = describeAxisFromScores(data);
            // Compute agreement for optional display
            const riskAxisDirection = data.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
            const riskAgreement = computeAxisAgreement(data.risk_receipts, riskAxisDirection);
            const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
            const inflAgreement = computeAxisAgreement(data.inflation_receipts, inflAxis);
            
            // Compute agreement series for history visualization
            const allRows = data ? [data, ...historyRows] : historyRows;
            const riskSeries = computeAgreementSeries(allRows, 'risk', 6);
            const inflSeries = computeAgreementSeries(allRows, 'inflation', 6);
            const hasTodayReceipts = (data.risk_receipts && data.risk_receipts.length > 0) || 
                                     (data.inflation_receipts && data.inflation_receipts.length > 0);
            const hasHistoryButNotToday = !hasTodayReceipts && (riskSeries.length >= 2 || inflSeries.length >= 2);
            
            return (
              <GlassCard className="p-6">
                <h2 className="text-sm font-semibold text-zinc-50 mb-4">{WHY_REGIME_TITLE}</h2>
                <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                  <p>{axisDesc.riskLine.replace(/\*\*/g, '')}</p>
                  {riskAgreement.total > 0 && (
                    <p className="text-zinc-400 text-[11px]">
                      Signal agreement: {riskAgreement.agree}/{riskAgreement.total} ({riskAgreement.pct?.toFixed(0)}%)
                    </p>
                  )}
                  {riskSeries.length >= 2 && (
                    <div className="mt-1">
                      <AgreementChipStrip items={riskSeries} label={AGREEMENT_HISTORY_LABEL} />
                    </div>
                  )}
                  <p>{axisDesc.inflationLine.replace(/\*\*/g, '')}</p>
                  {inflAgreement.total > 0 && (
                    <p className="text-zinc-400 text-[11px]">
                      Signal agreement: {inflAgreement.agree}/{inflAgreement.total} ({inflAgreement.pct?.toFixed(0)}%)
                    </p>
                  )}
                  {inflSeries.length >= 2 && (
                    <div className="mt-1">
                      <AgreementChipStrip items={inflSeries} label={AGREEMENT_HISTORY_LABEL} />
                    </div>
                  )}
                  {hasHistoryButNotToday && (
                    <p className="text-zinc-500 text-[10px] italic mt-2">
                      {AGREEMENT_HISTORY_HINT}
                    </p>
                  )}
                  <p className="text-amber-300 font-medium">{axisDesc.regimeLine.replace(/\*\*/g, '')}</p>
                  <div className="pt-2 space-y-1">
                    {axisDesc.soWhatLines.map((line, idx) => (
                      <p key={idx} className="text-zinc-400 italic">{line}</p>
                    ))}
                  </div>
                </div>
              </GlassCard>
            );
          })()}

          {/* Top Drivers Today */}
          {(() => {
            const riskDrivers = pickTopDrivers(data.risk_receipts, 2);
            const inflationDrivers = pickTopDrivers(data.inflation_receipts, 2);
            const hasReceipts = (data.risk_receipts && data.risk_receipts.length > 0) || 
                                (data.inflation_receipts && data.inflation_receipts.length > 0);
            const allVotesZero = hasReceipts && 
              (!data.risk_receipts || data.risk_receipts.every(r => r.vote === 0)) &&
              (!data.inflation_receipts || data.inflation_receipts.every(r => r.vote === 0));

            return (
              <GlassCard className="p-6">
                <h2 className="text-sm font-semibold text-zinc-50 mb-4">{TOP_DRIVERS_TITLE}</h2>
                {!hasReceipts ? (
                  <p className="text-xs text-zinc-400 mb-2">{TOP_DRIVERS_OLD_DATA_HINT}</p>
                ) : allVotesZero ? (
                  <p className="text-xs text-zinc-400 mb-2">{TOP_DRIVERS_NO_STRONG_DRIVERS}</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_RISK_HEADER}</h3>
                        {(() => {
                          // Map RISK ON/RISK OFF to Risk On/Risk Off for agreement computation
                          const riskAxisDirection = data.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
                          const riskAgreement = computeAxisAgreement(data.risk_receipts, riskAxisDirection);
                          const badge = formatAgreementBadge(riskAgreement);
                          if (riskAgreement.total === 0 && !hasReceipts) {
                            return null; // Don't show badge if no receipts available
                          }
                          return (
                            <Tooltip content={badge.tooltip}>
                              <span className="text-[10px] px-2 py-0.5 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80">
                                {badge.label}
                              </span>
                            </Tooltip>
                          );
                        })()}
                      </div>
                      {riskDrivers.length > 0 ? (
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {riskDrivers.map((driver, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-amber-300">→</span>
                              <span>{formatDriverLine(driver)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No strong risk drivers</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_INFLATION_HEADER}</h3>
                        {(() => {
                          const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
                          const inflAgreement = computeAxisAgreement(data.inflation_receipts, inflAxis);
                          const badge = formatAgreementBadge(inflAgreement);
                          if (inflAgreement.total === 0 && !hasReceipts) {
                            return null; // Don't show badge if no receipts available
                          }
                          return (
                            <Tooltip content={badge.tooltip}>
                              <span className="text-[10px] px-2 py-0.5 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80">
                                {badge.label}
                              </span>
                            </Tooltip>
                          );
                        })()}
                      </div>
                      {inflationDrivers.length > 0 ? (
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {inflationDrivers.map((driver, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-amber-300">→</span>
                              <span>{formatDriverLine(driver)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No strong inflation drivers</p>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-3 pt-3 border-t border-zinc-800">
                      {TOP_DRIVERS_FOOTNOTE}
                    </p>
                  </div>
                )}
              </GlassCard>
            );
          })()}

          {/* Regime Details */}
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-zinc-50 mb-4">Regime Classification</h2>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">
                  <Tooltip content="The model's read on the market &quot;weather&quot; (Goldilocks / Reflation / Inflation / Deflation). Not a prediction — a label for the lane we're driving in right now.">
                    Regime
                  </Tooltip>
                </p>
                <p className="text-xl font-semibold text-amber-300">{data.regime}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">
                  <Tooltip content="Risk On: we give growth assets more leash. Risk Off: we cut exposure and play defense. Seatbelt, not bubble wrap.">
                    Risk Regime
                  </Tooltip>
                </p>
                <p className="text-base font-medium text-zinc-200">{data.risk_regime}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">Inflation Axis</p>
                <p className="text-sm font-medium text-zinc-200">{data.infl_axis}</p>
              </div>
            </div>
          </GlassCard>

          {/* Flip Watch Callout */}
          {hasFlipWatch ? (() => {
            const flipWatchCopy = getFlipWatchCopy(flipWatchStatus);
            if (flipWatchCopy) {
              return (
                <GlassCard className="p-6 border-amber-400/30 bg-amber-400/10">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-300 mb-2">{flipWatchCopy.title}</h3>
                      {flipWatchCopy.lines.map((line, idx) => (
                        <p key={idx} className="text-xs text-amber-200 leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              );
            }
            return null;
          })() : (
            <GlassCard className="p-4 border-zinc-800 bg-zinc-900/30">
              <p className="text-xs text-zinc-500">{FLIPWATCH_NONE_HINT}</p>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Allocations */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-zinc-50 mb-4">
              <Tooltip content="Targets = the plan (top-down, based on regime). Actuals = what we hold after VAMS scales things to 100% / 50% / 0%. The gap usually shows up as cash.">
                Allocations
              </Tooltip>
            </h2>
            <div className="space-y-4">
              <AllocationBar
                label="Stocks"
                target={data.stocks_target}
                actual={data.stocks_actual}
                scale={data.stocks_scale}
                color="amber"
                bucketScaleLine={formatBucketUtilizationLine(data.stocks_target, data.stocks_scale)}
              />
              <AllocationBar
                label="Gold"
                target={data.gold_target}
                actual={data.gold_actual}
                scale={data.gold_scale}
                color="blue"
                bucketScaleLine={formatBucketUtilizationLine(data.gold_target, data.gold_scale)}
              />
              <AllocationBar
                label="Bitcoin"
                target={data.btc_target}
                actual={data.btc_actual}
                scale={data.btc_scale}
                color="purple"
                bucketScaleLine={formatBucketUtilizationLine(data.btc_target, data.btc_scale)}
              />
              <AllocationBar
                label="Cash (unallocated / leftover)"
                target={0}
                actual={data.cash}
                color="zinc"
                isCash={true}
              />
            </div>
            {data.cash > 0.01 && (() => {
              const cashSources = getCashSources(data);
              if (cashSources.length > 0) {
                return (
                  <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                    Cash created by throttling: {cashSources.join(', ')}.
                  </p>
                );
              }
              return null;
            })()}
            {buildMicroFlowLine(data) && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-400 font-mono">
                  {buildMicroFlowLine(data)}
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* What This Means */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">How It Works</h2>
        <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
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
            <span><strong className="text-zinc-200">Cash:</strong> What's left when exposure is reduced — the portfolio's "I don't trust this market" expression</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Reality check: This won't protect you from every 2–5% wobble. It's built to help sidestep the 20% train wrecks — and get you back in when the trend turns.</span>
          </li>
        </ul>
      </GlassCard>

      {/* Use This Signal in Portfolio - Coming Soon */}
      <GlassCard className="p-6 border-amber-400/30 bg-amber-400/5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Use This Signal in Your Portfolio</h2>
        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
          Soon you'll be able to apply GhostRegime signals to model portfolios. Pick a template, 
          map it to your 457 fund menu, and follow the target/actual exposures with simple rebalance steps.
        </p>
        <button
          disabled
          className="rounded-md bg-zinc-800 text-zinc-500 px-4 py-2 text-xs font-medium cursor-not-allowed min-h-[44px]"
          aria-label="Apply to a Model Portfolio (Coming Soon)"
        >
          Apply to a Model Portfolio (Coming Soon)
        </button>
      </GlassCard>

      {/* Advanced Details Toggle */}
      <div className="space-y-1">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px]"
          aria-label={showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
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
                  {(data.stocks_actual * 100).toFixed(1)}% ({formatBucketUtilizationLine(data.stocks_target, data.stocks_scale)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Gold</span>
                <span className="text-zinc-100">
                  {(data.gold_actual * 100).toFixed(1)}% ({formatBucketUtilizationLine(data.gold_target, data.gold_scale)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">BTC</span>
                <span className="text-zinc-100">
                  {(data.btc_actual * 100).toFixed(1)}% ({formatBucketUtilizationLine(data.btc_target, data.btc_scale)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Cash</span>
                <span className="text-zinc-100">{(data.cash * 100).toFixed(1)}% (unallocated)</span>
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
                <span className="text-zinc-100">
                  {data.stocks_vams_state} ({formatVamsState(data.stocks_vams_state)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Gold</span>
                <span className="text-zinc-100">
                  {data.gold_vams_state} ({formatVamsState(data.gold_vams_state)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">BTC</span>
                <span className="text-zinc-100">
                  {data.btc_vams_state} ({formatVamsState(data.btc_vams_state)})
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Advanced: Signal Receipts */}
          {(() => {
            const hasRiskReceipts = data.risk_receipts && data.risk_receipts.length > 0;
            const hasInflationReceipts = data.inflation_receipts && data.inflation_receipts.length > 0;
            const hasAnyReceipts = hasRiskReceipts || hasInflationReceipts;

            if (!hasAnyReceipts) {
              return null; // Hide section if no receipts available
            }

            return (
              <GlassCard className="p-4 sm:p-5 space-y-3 md:col-span-2">
                <h2 className="text-sm font-semibold text-zinc-50">Signal receipts</h2>
                <div className="space-y-4">
                  {hasRiskReceipts && (
                    <div>
                      <h3 className="text-xs font-medium text-zinc-300 mb-2">{TOP_DRIVERS_RISK_HEADER}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="text-left py-1 px-2 text-zinc-400 font-medium">Signal</th>
                              <th className="text-right py-1 px-2 text-zinc-400 font-medium">Vote</th>
                              <th className="text-left py-1 px-2 text-zinc-400 font-medium">Direction</th>
                              {data.risk_receipts?.some(r => r.note) && (
                                <th className="text-left py-1 px-2 text-zinc-400 font-medium">Note</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {data.risk_receipts?.map((receipt, idx) => (
                              <tr key={idx} className="border-b border-zinc-900/50">
                                <td className="py-1 px-2 text-zinc-300">{receipt.label}</td>
                                <td className="py-1 px-2 text-right text-zinc-200 font-mono">
                                  {formatSignedNumber(receipt.vote)}
                                </td>
                                <td className="py-1 px-2 text-zinc-300">{receipt.direction}</td>
                                {data.risk_receipts?.some(r => r.note) && (
                                  <td className="py-1 px-2 text-zinc-400 text-[10px]">{receipt.note || ''}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {hasInflationReceipts && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_INFLATION_HEADER}</h3>
                        {(() => {
                          const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
                          const inflAgreement = computeAxisAgreement(data.inflation_receipts, inflAxis);
                          if (inflAgreement.total > 0) {
                            return (
                              <span className="text-[10px] text-zinc-400">
                                Agreement: {inflAgreement.agree}/{inflAgreement.total} ({inflAgreement.pct?.toFixed(0)}%)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800">
                              <th className="text-left py-1 px-2 text-zinc-400 font-medium">Signal</th>
                              <th className="text-right py-1 px-2 text-zinc-400 font-medium">Vote</th>
                              <th className="text-left py-1 px-2 text-zinc-400 font-medium">Direction</th>
                              {data.inflation_receipts?.some(r => r.note) && (
                                <th className="text-left py-1 px-2 text-zinc-400 font-medium">Note</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {data.inflation_receipts?.map((receipt, idx) => (
                              <tr key={idx} className="border-b border-zinc-900/50">
                                <td className="py-1 px-2 text-zinc-300">{receipt.label}</td>
                                <td className="py-1 px-2 text-right text-zinc-200 font-mono">
                                  {formatSignedNumber(receipt.vote)}
                                </td>
                                <td className="py-1 px-2 text-zinc-300">{receipt.direction}</td>
                                {data.inflation_receipts?.some(r => r.note) && (
                                  <td className="py-1 px-2 text-zinc-400 text-[10px]">{receipt.note || ''}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })()}
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

