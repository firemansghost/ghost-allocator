/**
 * Simple horizontal allocation bar component
 * No external chart libraries - pure CSS
 */

interface AllocationBarProps {
  label: string;
  target: number; // 0-1
  actual: number; // 0-1
  scale?: number; // 0-1, optional
  color?: 'amber' | 'blue' | 'green' | 'purple' | 'zinc';
  showValues?: boolean;
  showScale?: boolean;
}

const colorClasses = {
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  zinc: 'bg-zinc-400',
};

export function AllocationBar({
  label,
  target,
  actual,
  scale,
  color = 'amber',
  showValues = true,
  showScale = false,
}: AllocationBarProps) {
  const targetPct = Math.round(target * 100);
  const actualPct = Math.round(actual * 100);
  const scalePct = scale ? Math.round(scale * 100) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-300 font-medium">{label}</span>
        {showValues && (
          <div className="flex items-center gap-2 text-zinc-200">
            <span className="font-semibold">{actualPct}%</span>
            {showScale && scalePct !== null && (
              <span className="text-zinc-400 text-[10px]">(scale: {scalePct}%)</span>
            )}
            {targetPct !== actualPct && (
              <span className="text-zinc-500 text-[10px]">target: {targetPct}%</span>
            )}
          </div>
        )}
      </div>
      <div className="relative h-3 rounded-full bg-zinc-800/50 overflow-hidden">
        {/* Target indicator (dashed line) */}
        {targetPct !== actualPct && (
          <div
            className="absolute top-0 bottom-0 border-r-2 border-dashed border-zinc-500/50 z-10"
            style={{ left: `${targetPct}%` }}
          />
        )}
        {/* Actual bar */}
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${actualPct}%` }}
        />
      </div>
    </div>
  );
}

