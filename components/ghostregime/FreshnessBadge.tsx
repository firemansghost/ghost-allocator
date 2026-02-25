/**
 * Freshness Badge
 * Displays GhostRegime update freshness using health data.
 * Reassures users that data updates even when no one visits.
 */

export interface FreshnessBadgeProps {
  status: string; // OK | WARN | NOT_READY
  latestDateUtc?: string; // YYYY-MM-DD
  ageDays?: number;
  ageHours?: number;
  message?: string;
}

function getStatusPillStyles(status: string): string {
  switch (status) {
    case 'OK':
      return 'border-green-400/30 bg-green-400/10 text-green-300';
    case 'WARN':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
    case 'NOT_READY':
    default:
      return 'border-red-400/30 bg-red-400/10 text-red-300';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'OK':
      return 'Fresh';
    case 'WARN':
      return 'Stale';
    case 'NOT_READY':
      return 'Not ready';
    default:
      return status;
  }
}

export function FreshnessBadge({
  status,
  latestDateUtc,
  ageDays,
  ageHours,
  message,
}: FreshnessBadgeProps) {
  const pillStyles = getStatusPillStyles(status);
  const pillLabel = getStatusLabel(status);

  return (
    <div className="inline-flex flex-wrap items-center gap-2 text-xs">
      {latestDateUtc ? (
        <span className="text-zinc-400">
          Last updated: <span className="font-mono text-zinc-300">{latestDateUtc}</span> (UTC)
          {(ageDays !== undefined && ageDays > 0) && (
            <span className="ml-1 text-zinc-500">
              ({ageDays} {ageDays === 1 ? 'day' : 'days'} old)
            </span>
          )}
          {ageHours !== undefined && ageDays === 0 && ageHours > 0 && (
            <span className="ml-1 text-zinc-500">
              ({ageHours}h ago)
            </span>
          )}
        </span>
      ) : (
        <span className="text-zinc-500">
          Not ready
          {message && (
            <span className="ml-1 italic">— {message}</span>
          )}
          {!message && (
            <span className="ml-1 italic">— seed/persistence not available</span>
          )}
        </span>
      )}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded border ${pillStyles}`}
      >
        {pillLabel}
      </span>
    </div>
  );
}
