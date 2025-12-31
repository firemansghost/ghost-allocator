/**
 * GhostRegime Main Page
 * Displays today's regime classification and allocations
 */

'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { Tooltip } from '@/components/Tooltip';
import { AllocationBar } from '@/components/AllocationBar';
import { AgreementChipStrip } from '@/components/ghostregime/AgreementChipStrip';
import { AxisStatsBlock } from '@/components/ghostregime/AxisStatsBlock';
import { ActionableReadPills } from '@/components/ghostregime/ActionableReadPills';
import { ReceiptsFilterToggle } from '@/components/ghostregime/ReceiptsFilterToggle';
import { ComparePanel } from '@/components/ghostregime/ComparePanel';
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
  pickTopDrivers,
  formatDriverLine,
  formatSignedNumber,
  computeAxisAgreement,
  formatAgreementBadge,
  computeAgreementDelta,
  computeAgreementSeries,
  computeAxisStats,
  deriveVotedLabel,
  computeConviction,
  sanitizeReceiptNote,
  splitReceiptNote,
  computeRegimeConvictionIndex,
  computeRegimeConfidenceLabel,
  computePrimaryDriver,
  formatFlipWatchLabel,
  computeAxisNetVote,
  buildActionableReadLine,
  computeAxisStatDeltas,
  buildCopySnapshotText,
  parseAsOfParam,
  buildShareUrl,
  parsePrevParam,
  buildCompareUrl,
  type CompareKind,
  type CompareAxis,
} from '@/lib/ghostregime/ui';
import {
  WHY_REGIME_TITLE,
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
  AGREEMENT_HISTORY_INSUFFICIENT_HINT,
  CONFIDENCE_LABEL_PREFIX,
  CONFIDENCE_TOOLTIP,
  COVERAGE_TOOLTIP,
  REGIME_SUMMARY_TITLE,
  REGIME_CONVICTION_LABEL_PREFIX,
  REGIME_CONVICTION_TOOLTIP,
  REGIME_CONFIDENCE_LABEL_PREFIX,
  REGIME_CONFIDENCE_TOOLTIP,
  PRIMARY_DRIVER_PREFIX,
  PRIMARY_DRIVER_TOOLTIP,
  FLIPWATCH_PILL_TOOLTIP,
  ACTIONABLE_READ_PREFIX,
  CROWDED_LABEL,
  CROWDED_TOOLTIP,
  COPY_SNAPSHOT_BUTTON,
  COPY_SNAPSHOT_COPIED,
  COPY_SNAPSHOT_DISABLED_TOOLTIP,
  LEGEND_TITLE,
  LEGEND_AGREEMENT,
  LEGEND_COVERAGE,
  LEGEND_CONFIDENCE,
  LEGEND_CONVICTION,
  LEGEND_CROWDED,
  LEGEND_NET_VOTE,
  LEGEND_DELTA,
  VIEW_RECEIPTS_LINK,
  VIEWING_SNAPSHOT_LABEL,
  VIEWING_SNAPSHOT_TOOLTIP,
  ASOF_INVALID_FALLBACK_HINT,
  ASOF_NOT_FOUND_FALLBACK_HINT,
  COPY_LINK_BUTTON,
  COPY_LINK_COPIED,
  BACK_TO_LATEST_LINK,
  COMPARE_LINK_LABEL,
  COMPARE_DISABLED_TOOLTIP,
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

function GhostRegimePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [showNeutralRisk, setShowNeutralRisk] = useState<'active' | 'all'>('active');
  const [showNeutralInfl, setShowNeutralInfl] = useState<'active' | 'all'>('active');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<string | null>(null);
  const [asofError, setAsofError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [prevRow, setPrevRow] = useState<GhostRegimeRow | null>(null);
  const [prevNotFoundHint, setPrevNotFoundHint] = useState(false);
  const compareTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Parse asof and prev params on mount and when searchParams change
  useEffect(() => {
    const asofParam = searchParams.get('asof');
    const { asof, error } = parseAsOfParam(asofParam);
    
    if (error) {
      setAsofError(error);
      setViewingSnapshot(null);
    } else if (asof) {
      setAsofError(null);
      setViewingSnapshot(asof);
    } else {
      setAsofError(null);
      setViewingSnapshot(null);
    }
    
    // Parse prev param (validation only, actual loading happens in fetchData)
    const prevParam = searchParams.get('prev');
    parsePrevParam(prevParam);
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if we need to load a specific snapshot
        const asofParam = searchParams.get('asof');
        const { asof } = parseAsOfParam(asofParam);
        
        // Fetch health status
        const healthResponse = await fetch('/api/ghostregime/health');
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          setHealthStatus(health);
        }
        
        // Check for prev param
        const prevParam = searchParams.get('prev');
        const { value: prev } = parsePrevParam(prevParam);
        
        // If asof or prev is specified, fetch history with wider lookback
        if (asof || prev) {
          // Use 90 days lookback when asof or prev is present
          const targetDate = asof || prev || data?.date || new Date().toISOString().split('T')[0];
          const startDateObj = new Date(targetDate);
          startDateObj.setDate(startDateObj.getDate() - 90); // 90 days back
          const startDate = startDateObj.toISOString().split('T')[0];
          const endDateObj = new Date(targetDate);
          endDateObj.setDate(endDateObj.getDate() + 1); // Include the target date
          const endDate = endDateObj.toISOString().split('T')[0];
          
          try {
            const historyResponse = await fetch(
              `/api/ghostregime/history?startDate=${startDate}&endDate=${endDate}`,
              { cache: 'no-store' }
            );
            
            if (historyResponse.ok) {
              const history: GhostRegimeRow[] = await historyResponse.json();
              
              // If asof is specified, try to load that snapshot
              if (asof) {
                const snapshotRow = history.find(row => row.date === asof);
                
                if (snapshotRow) {
                  setData(snapshotRow);
                  setViewingSnapshot(asof);
                  setAsofError(null);
                  
                  // If prev param is also specified, find that row
                  if (prev) {
                    const prevRowFound = history.find(row => row.date === prev);
                    if (prevRowFound) {
                      setPrevRow(prevRowFound);
                      setPrevNotFoundHint(false);
                    } else {
                      // Find inferred previous (row before snapshot)
                      const snapshotIdx = history.findIndex(row => row.date === asof);
                      const inferredPrev = snapshotIdx >= 0 && snapshotIdx + 1 < history.length
                        ? history[snapshotIdx + 1]
                        : null;
                      if (inferredPrev) {
                        setPrevRow(inferredPrev);
                        setPrevNotFoundHint(true);
                      } else {
                        setPrevRow(null);
                        setPrevNotFoundHint(false);
                      }
                    }
                  } else {
                    // No prev param, find inferred previous
                    const snapshotIdx = history.findIndex(row => row.date === asof);
                    const inferredPrev = snapshotIdx >= 0 && snapshotIdx + 1 < history.length
                      ? history[snapshotIdx + 1]
                      : null;
                    setPrevRow(inferredPrev);
                    setPrevNotFoundHint(false);
                  }
                  
                  setLoading(false);
                  return;
                } else {
                  // Snapshot not found, fall back to latest
                  setAsofError(ASOF_NOT_FOUND_FALLBACK_HINT.replace('{date}', asof));
                  setViewingSnapshot(null);
                  // Continue to fetch latest below
                }
              } else if (prev) {
                // Only prev param specified (no asof), find prev row for later use
                const prevRowFound = history.find(row => row.date === prev);
                if (prevRowFound) {
                  setPrevRow(prevRowFound);
                  setPrevNotFoundHint(false);
                } else {
                  setPrevRow(null);
                  setPrevNotFoundHint(false);
                }
              }
            }
          } catch (err) {
            // History fetch failed, fall back to latest
            if (asof) {
              setAsofError(ASOF_NOT_FOUND_FALLBACK_HINT.replace('{date}', asof));
              setViewingSnapshot(null);
            }
          }
        }
        
        // Fetch latest data (either as fallback or default)
        const todayResponse = await fetch('/api/ghostregime/today');
        
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
        if (!asof) {
          setViewingSnapshot(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  // Fetch history for "what changed" summary
  useEffect(() => {
    if (!data) return;

    async function fetchHistory() {
      if (!data) return; // TypeScript guard
      setHistoryLoading(true);
      try {
        const endDate = data.date;
        // Expand lookback to 90 days if asof or prev param is present
        const asofParam = searchParams.get('asof');
        const prevParam = searchParams.get('prev');
        const hasSnapshotParams = asofParam || prevParam;
        const lookbackDays = hasSnapshotParams ? 90 : 14;
        
        // Calculate start date
        const startDateObj = new Date(endDate);
        startDateObj.setDate(startDateObj.getDate() - lookbackDays);
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
        // If viewing snapshot, find the row before the snapshot
        // If prev param is specified, use that instead of inferred
        let validRows = history
          .filter((row) => !row.stale && row.date)
          .sort((a, b) => b.date.localeCompare(a.date));
        
        const prevParamValue = searchParams.get('prev');
        const { value: prev } = parsePrevParam(prevParamValue);
        
        if (viewingSnapshot) {
          // Find the snapshot row
          const snapshotIdx = validRows.findIndex(row => row.date === viewingSnapshot);
          if (snapshotIdx >= 0) {
            // If prev param is specified, use that row
            if (prev) {
              const prevIdx = validRows.findIndex(row => row.date === prev);
              if (prevIdx >= 0) {
                validRows = [validRows[snapshotIdx], validRows[prevIdx]];
              } else {
                // Prev not found, use inferred
                if (snapshotIdx + 1 < validRows.length) {
                  validRows = [validRows[snapshotIdx], validRows[snapshotIdx + 1]];
                } else {
                  validRows = validRows.slice(0, 1);
                }
              }
            } else {
              // No prev param, use inferred
              if (snapshotIdx + 1 < validRows.length) {
                validRows = [validRows[snapshotIdx], validRows[snapshotIdx + 1]];
              } else {
                validRows = validRows.slice(0, 1);
              }
            }
          } else {
            validRows = validRows.slice(0, 2);
          }
        } else {
          validRows = validRows.slice(0, 2);
        }
        
        // Set prevRow if we have 2 rows
        if (validRows.length >= 2) {
          setPrevRow(validRows[1]);
          setPrevNotFoundHint(false);
        } else if (validRows.length === 1 && !prevRow) {
          // Only one row, no previous available
          setPrevRow(null);
        }

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
  }, [data, viewingSnapshot, searchParams]);

  // Handle Escape key to close compare panel
  useEffect(() => {
    if (!showCompare) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCompare(false);
        setPrevNotFoundHint(false);
        // Return focus to the compare trigger button
        setTimeout(() => {
          compareTriggerRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCompare]);

  // Handle compare reset
  const handleCompareReset = () => {
    setShowCompare(false);
    setPrevNotFoundHint(false);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
          <span>As of {formatDate(data.date)}</span>
          {viewingSnapshot && (
            <Tooltip content={VIEWING_SNAPSHOT_TOOLTIP}>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80">
                <span>{VIEWING_SNAPSHOT_LABEL}</span>
                <span className="font-mono">{viewingSnapshot}</span>
              </span>
            </Tooltip>
          )}
          {!viewingSnapshot && isStaleOrOld && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300">
              <span>⚠️</span>
              <span>Stale data</span>
              {healthStatus?.freshness && !healthStatus.freshness.is_fresh && (
                <span className="text-[10px]">({healthStatus.freshness.age_days} days old)</span>
              )}
            </span>
          )}
          {!viewingSnapshot && !isStaleOrOld && healthStatus?.status === 'OK' && (
            <span className="inline-flex items-center gap-1 text-green-400">
              <span>✓</span>
              <span>Fresh</span>
            </span>
          )}
          {viewingSnapshot && (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <span>Snapshot</span>
            </span>
          )}
          {asofError && (
            <span className="text-[10px] text-amber-400/80 italic">{asofError}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker */}
          <input
            type="date"
            value={viewingSnapshot || data.date}
            max={data.date}
            onChange={(e) => {
              const selectedDate = e.target.value;
              if (selectedDate) {
                router.push(`/ghostregime?asof=${selectedDate}`);
              }
            }}
            className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
          />
          {/* Back to latest link */}
          {viewingSnapshot && (
            <button
              onClick={() => router.push('/ghostregime')}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
            >
              {BACK_TO_LATEST_LINK}
            </button>
          )}
          {/* Copy link button */}
          <button
            onClick={async () => {
              const asofDate = viewingSnapshot || data.date;
              const shareUrl = buildShareUrl(asofDate);
              try {
                await navigator.clipboard.writeText(shareUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 1500);
              } catch (err) {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = shareUrl;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                  document.execCommand('copy');
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 1500);
                } catch (e) {
                  // Ignore
                }
                document.body.removeChild(textarea);
              }
            }}
            className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
            aria-label={linkCopied ? COPY_LINK_COPIED : COPY_LINK_BUTTON}
          >
            {linkCopied ? COPY_LINK_COPIED : COPY_LINK_BUTTON}
          </button>
          {/* Compare to previous link */}
          {prevRow ? (
            <button
              ref={compareTriggerRef}
              onClick={() => setShowCompare(!showCompare)}
              className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
            >
              {COMPARE_LINK_LABEL}
            </button>
          ) : (
            <Tooltip content={COMPARE_DISABLED_TOOLTIP}>
              <button
                disabled
                className="px-2 py-1 text-[10px] rounded border border-zinc-800 bg-zinc-900/30 text-zinc-600 cursor-not-allowed"
                aria-label={COMPARE_DISABLED_TOOLTIP}
              >
                {COMPARE_LINK_LABEL}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Today's Snapshot */}
      {buildTodaySnapshotLine(data) && (
        <div className="space-y-1">
          <div className="text-sm text-zinc-300 leading-relaxed">
            {buildTodaySnapshotLine(data)}
          </div>
          {(() => {
            const riskAxisDirection = data.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
            const riskStats = computeAxisStats(data.risk_receipts, riskAxisDirection);
            // Use net vote for conviction if receipts exist, otherwise fallback to axis score
            const riskNetVote = data.risk_receipts && data.risk_receipts.length > 0
              ? computeAxisNetVote(data.risk_receipts, 'risk').net
              : data.risk_score;
            const riskConviction = computeConviction(riskNetVote, riskStats.totalSignals || (data.risk_receipts?.length ?? null));
            const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
            const inflStats = computeAxisStats(data.inflation_receipts, inflAxis);
            const inflNetVote = data.inflation_receipts && data.inflation_receipts.length > 0
              ? computeAxisNetVote(data.inflation_receipts, 'inflation').net
              : data.infl_score;
            const inflConviction = computeConviction(inflNetVote, inflStats.totalSignals || (data.inflation_receipts?.length ?? null));
            const regimeConvictionIndex = computeRegimeConvictionIndex(riskConviction.index, inflConviction.index);
            const regimeConfidenceLabel = computeRegimeConfidenceLabel(riskStats.confidence.label, inflStats.confidence.label);
            const cashSources = getCashSources(data);
            
            const actionableRead = buildActionableReadLine({
              regime: data.regime,
              risk_regime: data.risk_regime,
              infl_axis: data.infl_axis,
              regimeConfidenceLabel,
              regimeConvictionIndex,
              cashPct: data.cash,
              cashSources,
              btcScale: data.btc_scale,
              flipWatch: data.flip_watch_status,
            });
            
            // Compute regime conviction label (bucket)
            const regimeConvictionLabel = regimeConvictionIndex !== null
              ? (() => {
                  if (regimeConvictionIndex >= 0 && regimeConvictionIndex <= 25) return 'weak';
                  if (regimeConvictionIndex >= 26 && regimeConvictionIndex <= 50) return 'lean';
                  if (regimeConvictionIndex >= 51 && regimeConvictionIndex <= 75) return 'strong';
                  if (regimeConvictionIndex >= 76 && regimeConvictionIndex <= 100) return 'lopsided';
                  return null;
                })()
              : null;
            
            // Check if regime is crowded (both axes need to meet criteria)
            const riskAgreement = computeAxisAgreement(data.risk_receipts, riskAxisDirection);
            const inflAgreement = computeAxisAgreement(data.inflation_receipts, inflAxis);
            const riskCrowded = riskConviction.index !== null && riskConviction.index >= 76 &&
                               riskStats.confidence.label === 'High' &&
                               riskAgreement.pct !== null && riskAgreement.pct >= 80 &&
                               (riskStats.totalSignals || 0) > 0 && (riskStats.nonNeutral / (riskStats.totalSignals || 1)) >= 0.5;
            const inflCrowded = inflConviction.index !== null && inflConviction.index >= 76 &&
                               inflStats.confidence.label === 'High' &&
                               inflAgreement.pct !== null && inflAgreement.pct >= 80 &&
                               (inflStats.totalSignals || 0) > 0 && (inflStats.nonNeutral / (inflStats.totalSignals || 1)) >= 0.5;
            const isCrowded = riskCrowded && inflCrowded;
            
            const copyText = buildCopySnapshotText(data, actionableRead);
            
            return actionableRead ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-[10px] text-zinc-500 mb-1.5">{ACTIONABLE_READ_PREFIX}</div>
                    <ActionableReadPills
                      regime={data.regime}
                      riskRegime={data.risk_regime}
                      inflAxis={data.infl_axis}
                      regimeConfidenceLabel={regimeConfidenceLabel}
                      regimeConvictionIndex={regimeConvictionIndex}
                      regimeConvictionLabel={regimeConvictionLabel}
                      isCrowded={isCrowded}
                      btcScale={data.btc_scale}
                      cashSources={cashSources}
                    />
                  </div>
                  {copyText && (
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(copyText);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        } catch (err) {
                          // Fallback for older browsers
                          const textarea = document.createElement('textarea');
                          textarea.value = copyText;
                          textarea.style.position = 'fixed';
                          textarea.style.opacity = '0';
                          document.body.appendChild(textarea);
                          textarea.select();
                          try {
                            document.execCommand('copy');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          } catch (e) {
                            // Ignore
                          }
                          document.body.removeChild(textarea);
                        }
                      }}
                      className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors self-start sm:self-center"
                      aria-label={copied ? COPY_SNAPSHOT_COPIED : COPY_SNAPSHOT_BUTTON}
                    >
                      {copied ? COPY_SNAPSHOT_COPIED : COPY_SNAPSHOT_BUTTON}
                    </button>
                  )}
                  {!copyText && (
                    <Tooltip content={COPY_SNAPSHOT_DISABLED_TOOLTIP}>
                      <button
                        disabled
                        className="px-2 py-1 text-[10px] rounded border border-zinc-800 bg-zinc-900/30 text-zinc-600 cursor-not-allowed self-start sm:self-center"
                        aria-label={COPY_SNAPSHOT_DISABLED_TOOLTIP}
                      >
                        {COPY_SNAPSHOT_BUTTON}
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Compare Panel */}
          {showCompare && prevRow && (
            <div className="mt-3">
              <ComparePanel
                currentRow={data}
                prevRow={prevRow}
                currentAsOf={data.date}
                prevAsOf={prevRow.date}
                onJump={({ kind, axis }) => {
                  if (kind === 'regime') {
                    // Scroll to regime summary
                    const element = document.getElementById('regime-summary');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  } else if (axis === 'risk' || axis === 'infl') {
                    // Expand Nerd Mode if collapsed
                    if (!showAdvanced) {
                      setShowAdvanced(true);
                      // Wait a bit for the DOM to update, then scroll
                      setTimeout(() => {
                        const element = document.getElementById(axis === 'risk' ? 'receipts-risk' : 'receipts-inflation');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    } else {
                      // Already expanded, just scroll
                      const element = document.getElementById(axis === 'risk' ? 'receipts-risk' : 'receipts-inflation');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }
                }}
                onReset={handleCompareReset}
                prevNotFoundHint={prevNotFoundHint}
              />
            </div>
          )}
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

      {/* Main Content Grid - 2x2 layout on lg screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Row 1, Col 1: Regime Map */}
        <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-zinc-50 mb-4">Regime Map</h2>
            <div className="space-y-3">
              {/* X-axis labels */}
              <div className="grid grid-cols-3 gap-1">
                <div></div>
                <div className="relative flex items-center justify-between text-[10px] text-zinc-500 pb-2">
                  {/* Left label: Risk Off ← */}
                  <Tooltip content="X-axis: Risk Off left, Risk On right">
                    <div className="flex items-center gap-1">
                      <span>Risk Off</span>
                      <span className="text-xs">←</span>
                    </div>
                  </Tooltip>
                  
                  {/* Horizontal guide line */}
                  <div className="absolute left-0 right-0 bottom-0 h-px bg-zinc-700/50" />
                  
                  {/* Right label: Risk On → */}
                  <Tooltip content="X-axis: Risk Off left, Risk On right">
                    <div className="flex items-center gap-1">
                      <span>Risk On</span>
                      <span className="text-xs">→</span>
                    </div>
                  </Tooltip>
                </div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                {/* Left axis label */}
                <div className="relative flex flex-col justify-between items-start text-[10px] text-zinc-500 pl-1 min-h-[120px]">
                  {/* Top label: Inflation ↑ */}
                  <Tooltip content="Y-axis: Inflation up, Disinflation down">
                    <div className="flex items-center gap-1">
                      <span>Inflation</span>
                      <span className="text-xs">↑</span>
                    </div>
                  </Tooltip>
                  
                  {/* Vertical guide line */}
                  <div className="absolute left-0 top-6 bottom-6 w-px bg-zinc-700/50" />
                  
                  {/* Bottom label: Disinflation ↓ */}
                  <Tooltip content="Y-axis: Inflation up, Disinflation down">
                    <div className="flex items-center gap-1">
                      <span>Disinflation</span>
                      <span className="text-xs">↓</span>
                    </div>
                  </Tooltip>
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

        {/* Row 1, Col 2: Allocations */}
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

        {/* Row 2, Col 1: Why This Regime Today */}
        {(() => {
          const axisDesc = describeAxisFromScores(data);
          const riskAxisDirection = data.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
          const riskStats = computeAxisStats(data.risk_receipts, riskAxisDirection);
          // Use net vote for conviction if receipts exist, otherwise fallback to axis score
          const riskNetVote = data.risk_receipts && data.risk_receipts.length > 0
            ? computeAxisNetVote(data.risk_receipts, 'risk').net
            : data.risk_score;
          const riskConviction = computeConviction(riskNetVote, riskStats.totalSignals || (data.risk_receipts?.length ?? null));
          const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
          const inflStats = computeAxisStats(data.inflation_receipts, inflAxis);
          const inflNetVote = data.inflation_receipts && data.inflation_receipts.length > 0
            ? computeAxisNetVote(data.inflation_receipts, 'inflation').net
            : data.infl_score;
          const inflConviction = computeConviction(inflNetVote, inflStats.totalSignals || (data.inflation_receipts?.length ?? null));
          
          // Compute agreement percentages for primary driver
          const riskAgreement = computeAxisAgreement(data.risk_receipts, riskAxisDirection);
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
              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                {(() => {
                  // Find previous row for delta computation
                  const prevRow = historyRows.length > 0 ? historyRows[0] : null;
                  const riskDelta = prevRow ? computeAxisStatDeltas(data, prevRow, 'risk') : null;
                  const inflDelta = prevRow ? computeAxisStatDeltas(data, prevRow, 'inflation') : null;
                  
                  return (
                    <>
                      <AxisStatsBlock
                        axisLine={axisDesc.riskLine.replace(/\*\*/g, '')}
                        stats={riskStats}
                        conviction={riskConviction}
                        agreementSeries={riskSeries.length >= 2 ? riskSeries : undefined}
                        deltaLine={riskDelta}
                        axisName="Risk"
                      />
                      <AxisStatsBlock
                        axisLine={axisDesc.inflationLine.replace(/\*\*/g, '')}
                        stats={inflStats}
                        conviction={inflConviction}
                        agreementSeries={inflSeries.length >= 2 ? inflSeries : undefined}
                        deltaLine={inflDelta}
                        axisName="Inflation"
                      />
                    </>
                  );
                })()}
                {/* Show agreement history hint once at bottom */}
                {hasHistoryButNotToday && (
                  <p className="text-zinc-500 text-[10px] italic mt-2">
                    {AGREEMENT_HISTORY_HINT}
                  </p>
                )}
                {hasTodayReceipts && !hasHistoryButNotToday && riskSeries.length < 2 && inflSeries.length < 2 && (
                  <p className="text-zinc-500 text-[10px] italic mt-2">
                    {AGREEMENT_HISTORY_INSUFFICIENT_HINT}
                  </p>
                )}
                <p className="text-amber-300 font-medium">{axisDesc.regimeLine.replace(/\*\*/g, '')}</p>
                <div className="pt-2 space-y-1">
                  {axisDesc.soWhatLines.map((line, idx) => (
                    <p key={idx} className="text-zinc-400 italic">{line}</p>
                  ))}
                </div>
                
                {/* Legend */}
                <details className="mt-3 pt-3 border-t border-zinc-800">
                  <summary className="text-[10px] text-zinc-500 cursor-pointer hover:text-zinc-400">
                    {LEGEND_TITLE}
                  </summary>
                  <div className="mt-2 space-y-1.5 text-[10px] text-zinc-500">
                    <div><strong className="text-zinc-400">Agreement:</strong> {LEGEND_AGREEMENT}</div>
                    <div><strong className="text-zinc-400">Coverage:</strong> {LEGEND_COVERAGE}</div>
                    <div><strong className="text-zinc-400">Confidence:</strong> {LEGEND_CONFIDENCE}</div>
                    <div><strong className="text-zinc-400">Conviction:</strong> {LEGEND_CONVICTION}</div>
                    <div><strong className="text-zinc-400">Crowded:</strong> {LEGEND_CROWDED}</div>
                    <div><strong className="text-zinc-400">Net vote:</strong> {LEGEND_NET_VOTE}</div>
                    <div><strong className="text-zinc-400">Δ since last:</strong> {LEGEND_DELTA}</div>
                  </div>
                </details>
              </div>
            </GlassCard>
          );
        })()}

        {/* Row 2, Col 2: Top Drivers Today */}
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_RISK_HEADER}</h3>
                        {(() => {
                          const riskAxisDirection = data.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
                          const riskAgreement = computeAxisAgreement(data.risk_receipts, riskAxisDirection);
                          const badge = formatAgreementBadge(riskAgreement);
                          if (riskAgreement.total === 0 && !hasReceipts) {
                            return null;
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
                      {data.risk_receipts && data.risk_receipts.length > 0 && (
                        <button
                          onClick={() => {
                            setShowAdvanced(true);
                            setTimeout(() => {
                              const element = document.getElementById('receipts-risk');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
                        >
                          {VIEW_RECEIPTS_LINK}
                        </button>
                      )}
                    </div>
                    {data.risk_receipts && data.risk_receipts.length > 0 && (() => {
                      const netVote = computeAxisNetVote(data.risk_receipts, 'risk');
                      return (
                        <p className="text-[10px] text-zinc-500 mb-2">
                          Net vote: {netVote.label}
                        </p>
                      );
                    })()}
                    {riskDrivers.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {riskDrivers.map((driver, idx) => {
                          const { rule } = splitReceiptNote(driver.note);
                          return (
                            <li key={idx} className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-300">→</span>
                                <span>{formatDriverLine(driver)}</span>
                              </div>
                              {rule && (
                                <p className="text-[10px] text-zinc-500 italic ml-5">
                                  Rule: {rule}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">No strong risk drivers</p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_INFLATION_HEADER}</h3>
                        {(() => {
                          const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
                          const inflAgreement = computeAxisAgreement(data.inflation_receipts, inflAxis);
                          const badge = formatAgreementBadge(inflAgreement);
                          if (inflAgreement.total === 0 && !hasReceipts) {
                            return null;
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
                      {data.inflation_receipts && data.inflation_receipts.length > 0 && (
                        <button
                          onClick={() => {
                            setShowAdvanced(true);
                            setTimeout(() => {
                              const element = document.getElementById('receipts-inflation');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
                        >
                          {VIEW_RECEIPTS_LINK}
                        </button>
                      )}
                    </div>
                    {data.inflation_receipts && data.inflation_receipts.length > 0 && (() => {
                      const netVote = computeAxisNetVote(data.inflation_receipts, 'inflation');
                      return (
                        <p className="text-[10px] text-zinc-500 mb-2">
                          Net vote: {netVote.label}
                        </p>
                      );
                    })()}
                    {inflationDrivers.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {inflationDrivers.map((driver, idx) => {
                          const { rule } = splitReceiptNote(driver.note);
                          return (
                            <li key={idx} className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-300">→</span>
                                <span>{formatDriverLine(driver)}</span>
                              </div>
                              {rule && (
                                <p className="text-[10px] text-zinc-500 italic ml-5">
                                  Rule: {rule}
                                </p>
                              )}
                            </li>
                          );
                        })}
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
      </div>

      {/* Regime Details and Regime Summary (below main grid) */}
      <div className="grid gap-6 lg:grid-cols-2">
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

        {/* Regime Summary */}
        {(() => {
          // Compute overall regime metrics from Risk and Inflation stats
          const riskAxisDirection = data.risk_regime === 'RISK ON' ? 'Risk On' : 'Risk Off';
          const riskStats = computeAxisStats(data.risk_receipts, riskAxisDirection);
          // Use net vote for conviction if receipts exist, otherwise fallback to axis score
          const riskNetVote = data.risk_receipts && data.risk_receipts.length > 0
            ? computeAxisNetVote(data.risk_receipts, 'risk').net
            : data.risk_score;
          const riskConviction = computeConviction(riskNetVote, riskStats.totalSignals || (data.risk_receipts?.length ?? null));
          const inflAxis = data.infl_axis === 'Inflation' ? 'Inflation' : 'Disinflation';
          const inflStats = computeAxisStats(data.inflation_receipts, inflAxis);
          const inflNetVote = data.inflation_receipts && data.inflation_receipts.length > 0
            ? computeAxisNetVote(data.inflation_receipts, 'inflation').net
            : data.infl_score;
          const inflConviction = computeConviction(inflNetVote, inflStats.totalSignals || (data.inflation_receipts?.length ?? null));
          
          const regimeConvictionIndex = computeRegimeConvictionIndex(riskConviction.index, inflConviction.index);
          const regimeConfidenceLabel = computeRegimeConfidenceLabel(riskStats.confidence.label, inflStats.confidence.label);
          
          // Compute agreement percentages for primary driver
          const riskAgreement = computeAxisAgreement(data.risk_receipts, riskAxisDirection);
          const inflAgreement = computeAxisAgreement(data.inflation_receipts, inflAxis);
          
          const primaryDriver = computePrimaryDriver(
            data.risk_score,
            data.infl_score,
            riskConviction.index,
            inflConviction.index,
            riskStats.confidence.label,
            inflStats.confidence.label,
            riskAgreement.pct,
            inflAgreement.pct
          );
          const flipWatchLabel = formatFlipWatchLabel(data.flip_watch_status);
          const hasFlipWatch = data.flip_watch_status && data.flip_watch_status !== 'NONE';
          
          return (
            <div id="regime-summary">
              <GlassCard className="p-6">
                <h2 className="text-sm font-semibold text-zinc-50 mb-4">{REGIME_SUMMARY_TITLE}</h2>
              <div className="space-y-3">
                {regimeConfidenceLabel && (
                  <div>
                    <Tooltip content={REGIME_CONFIDENCE_TOOLTIP}>
                      <span className="px-2 py-0.5 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80 text-xs">
                        {REGIME_CONFIDENCE_LABEL_PREFIX} {regimeConfidenceLabel}
                      </span>
                    </Tooltip>
                  </div>
                )}
                {regimeConvictionIndex !== null && (
                  <div>
                    <Tooltip content={REGIME_CONVICTION_TOOLTIP}>
                      <span className="px-2 py-0.5 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80 text-xs">
                        {REGIME_CONVICTION_LABEL_PREFIX} {regimeConvictionIndex}
                      </span>
                    </Tooltip>
                  </div>
                )}
                {primaryDriver.label !== 'n/a' && (
                  <div className="space-y-1">
                    <Tooltip content={PRIMARY_DRIVER_TOOLTIP}>
                      <span className="px-2 py-0.5 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80 text-xs">
                        {PRIMARY_DRIVER_PREFIX} {primaryDriver.label}
                      </span>
                    </Tooltip>
                    {primaryDriver.whyReason && (
                      <p className="text-[10px] text-zinc-500">
                        Why: {primaryDriver.whyReason}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <Tooltip content={FLIPWATCH_PILL_TOOLTIP}>
                    <span className={`px-2 py-0.5 rounded border text-xs ${
                      hasFlipWatch
                        ? 'border-amber-400/30 bg-amber-400/10 text-amber-300/80'
                        : 'border-zinc-700/50 bg-zinc-900/30 text-zinc-500'
                    }`}>
                      Flip Watch: {flipWatchLabel}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </GlassCard>
            </div>
          );
        })()}
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
                  {hasRiskReceipts && (() => {
                    const totalSignals = data.risk_receipts?.length || 0;
                    const activeSignals = data.risk_receipts?.filter(r => r.vote !== 0).length || 0;
                    const neutralSignals = totalSignals - activeSignals;
                    const filteredReceipts = (showNeutralRisk === 'all'
                      ? data.risk_receipts 
                      : data.risk_receipts?.filter(r => r.vote !== 0)) || [];
                    
                    return (
                      <div id="receipts-risk">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_RISK_HEADER}</h3>
                          <ReceiptsFilterToggle
                            mode={showNeutralRisk}
                            setMode={setShowNeutralRisk}
                            activeCount={activeSignals}
                            totalCount={totalSignals}
                            neutralCount={neutralSignals}
                          />
                        </div>
                        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                              <tr className="border-b border-zinc-800">
                                <th className="text-left py-1 px-2 text-zinc-400 font-medium">Signal</th>
                                <th className="text-right py-1 px-2 text-zinc-400 font-medium">Vote</th>
                                <th className="text-left py-1 px-2 text-zinc-400 font-medium">Voted</th>
                                {data.risk_receipts?.some(r => r.note) && (
                                  <>
                                    <th className="text-left py-1 px-2 text-zinc-400 font-medium">Rule</th>
                                    <th className="text-left py-1 px-2 text-zinc-400 font-medium">Meta</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredReceipts.map((receipt, idx) => {
                                const { rule, meta } = splitReceiptNote(receipt.note);
                                return (
                                  <tr key={idx} className={`border-b border-zinc-900/50 ${idx % 2 === 0 ? 'bg-white/0' : 'bg-white/[0.03]'}`}>
                                    <td className="py-1 px-2 text-zinc-300">{receipt.label}</td>
                                    <td className="py-1 px-2 text-right text-zinc-200 font-mono">
                                      {formatSignedNumber(receipt.vote)}
                                    </td>
                                    <td className="py-1 px-2 text-zinc-400">{deriveVotedLabel(receipt.vote, 'risk')}</td>
                                    {data.risk_receipts?.some(r => r.note) && (
                                      <>
                                        <td className="py-1 px-2 text-zinc-400 text-[10px]">{rule || ''}</td>
                                        <td className="py-1 px-2 text-zinc-400 text-[10px]">{meta || ''}</td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                  {hasInflationReceipts && (() => {
                    const totalSignals = data.inflation_receipts?.length || 0;
                    const activeSignals = data.inflation_receipts?.filter(r => r.vote !== 0).length || 0;
                    const neutralSignals = totalSignals - activeSignals;
                    const filteredReceipts = (showNeutralInfl === 'all'
                      ? data.inflation_receipts 
                      : data.inflation_receipts?.filter(r => r.vote !== 0)) || [];
                    
                    return (
                      <div id="receipts-inflation">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-medium text-zinc-300">{TOP_DRIVERS_INFLATION_HEADER}</h3>
                          <ReceiptsFilterToggle
                            mode={showNeutralInfl}
                            setMode={setShowNeutralInfl}
                            activeCount={activeSignals}
                            totalCount={totalSignals}
                            neutralCount={neutralSignals}
                          />
                        </div>
                        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm">
                              <tr className="border-b border-zinc-800">
                                <th className="text-left py-1 px-2 text-zinc-400 font-medium">Signal</th>
                                <th className="text-right py-1 px-2 text-zinc-400 font-medium">Vote</th>
                                <th className="text-left py-1 px-2 text-zinc-400 font-medium">Voted</th>
                                {data.inflation_receipts?.some(r => r.note) && (
                                  <>
                                    <th className="text-left py-1 px-2 text-zinc-400 font-medium">Rule</th>
                                    <th className="text-left py-1 px-2 text-zinc-400 font-medium">Meta</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredReceipts.map((receipt, idx) => {
                                const { rule, meta } = splitReceiptNote(receipt.note);
                                return (
                                  <tr key={idx} className={`border-b border-zinc-900/50 ${idx % 2 === 0 ? 'bg-white/0' : 'bg-white/[0.03]'}`}>
                                    <td className="py-1 px-2 text-zinc-300">{receipt.label}</td>
                                    <td className="py-1 px-2 text-right text-zinc-200 font-mono">
                                      {formatSignedNumber(receipt.vote)}
                                    </td>
                                    <td className="py-1 px-2 text-zinc-400">{deriveVotedLabel(receipt.vote, 'inflation')}</td>
                                    {data.inflation_receipts?.some(r => r.note) && (
                                      <>
                                        <td className="py-1 px-2 text-zinc-400 text-[10px]">{rule || ''}</td>
                                        <td className="py-1 px-2 text-zinc-400 text-[10px]">{meta || ''}</td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
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

export default function GhostRegimePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">GhostRegime</h1>
          <p className="text-sm text-zinc-300">Loading...</p>
        </header>
      </div>
    }>
      <GhostRegimePageContent />
    </Suspense>
  );
}

