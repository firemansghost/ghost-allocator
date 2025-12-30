/**
 * Receipts Filter Toggle
 * 
 * Segmented control for filtering receipts (Active vs All)
 */

'use client';

interface ReceiptsFilterToggleProps {
  mode: 'active' | 'all';
  setMode: (mode: 'active' | 'all') => void;
  activeCount: number;
  totalCount: number;
  neutralCount: number;
}

export function ReceiptsFilterToggle({
  mode,
  setMode,
  activeCount,
  totalCount,
  neutralCount,
}: ReceiptsFilterToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500">
        Active: {activeCount}/{totalCount} • Neutral: {neutralCount}
      </span>
      <div className="flex rounded border border-zinc-700 bg-zinc-900/50 overflow-hidden">
        <button
          onClick={() => setMode('active')}
          className={`px-2 py-0.5 text-[10px] transition-colors ${
            mode === 'active'
              ? 'bg-amber-400/10 text-amber-300 border-r border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-300 border-r border-zinc-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setMode('all')}
          className={`px-2 py-0.5 text-[10px] transition-colors ${
            mode === 'all'
              ? 'bg-amber-400/10 text-amber-300'
              : 'text-zinc-400 hover:text-zinc-300'
          }`}
        >
          All
        </button>
      </div>
    </div>
  );
}

