/**
 * GhostRegime Toolbar
 * 
 * Top controls cluster for the GhostRegime page: date picker, snapshot indicators,
 * copy link, compare, methodology link, etc.
 * 
 * This is a presentational component - all state and callbacks come from parent.
 */

'use client';

import { Tooltip } from '@/components/Tooltip';
import { MethodologyPillLink } from '@/components/ghostregime/MethodologyPillLink';
import {
  VIEWING_SNAPSHOT_LABEL,
  VIEWING_SNAPSHOT_TOOLTIP,
  COPY_LINK_BUTTON,
  COPY_LINK_COPIED,
  BACK_TO_LATEST_LINK,
  COMPARE_LINK_LABEL,
  COMPARE_PREV_SNAPSHOT_TOOLTIP,
  COMPARE_DISABLED_TOOLTIP,
} from '@/lib/ghostregime/ghostregimePageCopy';

export interface GhostRegimeToolbarProps {
  // Current date/snapshot state
  currentAsOf: string; // The date being viewed (latest or snapshot)
  viewingSnapshot: string | null; // The snapshot date if viewing one, null if latest
  maxDate: string; // Maximum date for date picker (usually latest date)
  
  asofError: string | null; // Error message if asof param was invalid
  
  // Copy link state
  linkCopied: boolean;
  onCopyLink: () => void;
  
  // Compare state
  compareEnabled: boolean;
  onToggleCompare: () => void;
  compareTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  
  // Date picker handlers
  onAsOfChange: (dateStr: string) => void;
  onClearAsOf: () => void;
}

export function GhostRegimeToolbar({
  currentAsOf,
  viewingSnapshot,
  maxDate,
  asofError,
  linkCopied,
  onCopyLink,
  compareEnabled,
  onToggleCompare,
  compareTriggerRef,
  onAsOfChange,
  onClearAsOf,
}: GhostRegimeToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Left side: Snapshot indicator only (freshness is in FreshnessBadge) */}
      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
        {viewingSnapshot && (
          <Tooltip content={VIEWING_SNAPSHOT_TOOLTIP}>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-400/20 bg-amber-400/5 text-amber-300/80">
              <span>{VIEWING_SNAPSHOT_LABEL}</span>
              <span className="font-mono">{viewingSnapshot}</span>
            </span>
          </Tooltip>
        )}
        {asofError && (
          <span className="text-[10px] text-amber-400/80 italic">{asofError}</span>
        )}
      </div>
      
      {/* Right side: Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Picker */}
        <input
          type="date"
          value={viewingSnapshot || currentAsOf}
          max={maxDate}
          onChange={(e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
              onAsOfChange(selectedDate);
            }
          }}
          className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
        />
        
        {/* Back to latest link */}
        {viewingSnapshot && (
          <button
            onClick={onClearAsOf}
            className="text-[10px] text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline"
          >
            {BACK_TO_LATEST_LINK}
          </button>
        )}
        
        {/* Copy link button */}
        <button
          onClick={onCopyLink}
          className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
          aria-label={linkCopied ? COPY_LINK_COPIED : COPY_LINK_BUTTON}
        >
          {linkCopied ? COPY_LINK_COPIED : COPY_LINK_BUTTON}
        </button>
        
        {/* Compare to previous link */}
        {compareEnabled ? (
          <Tooltip content={COMPARE_PREV_SNAPSHOT_TOOLTIP}>
            <button
              ref={compareTriggerRef}
              onClick={onToggleCompare}
              className="px-2 py-1 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
            >
              {COMPARE_LINK_LABEL}
            </button>
          </Tooltip>
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
        
        {/* Methodology pill */}
        <MethodologyPillLink />
      </div>
    </div>
  );
}
