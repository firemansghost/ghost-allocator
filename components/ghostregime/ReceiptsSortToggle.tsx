/**
 * Receipts Sort Toggle
 * 
 * Segmented control for sorting receipts (Default vs By strength)
 */

'use client';

import {
  RECEIPTS_SORT_DEFAULT,
  RECEIPTS_SORT_BY_STRENGTH,
} from '@/lib/ghostregime/ghostregimePageCopy';

interface ReceiptsSortToggleProps {
  mode: 'default' | 'strength';
  setMode: (mode: 'default' | 'strength') => void;
}

export function ReceiptsSortToggle({
  mode,
  setMode,
}: ReceiptsSortToggleProps) {
  return (
    <div className="flex rounded border border-zinc-700 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setMode('default')}
        className={`px-2 py-0.5 text-[10px] transition-colors ${
          mode === 'default'
            ? 'bg-amber-400/10 text-amber-300 border-r border-zinc-700'
            : 'text-zinc-400 hover:text-zinc-300 border-r border-zinc-700'
        }`}
      >
        {RECEIPTS_SORT_DEFAULT}
      </button>
      <button
        onClick={() => setMode('strength')}
        className={`px-2 py-0.5 text-[10px] transition-colors ${
          mode === 'strength'
            ? 'bg-amber-400/10 text-amber-300'
            : 'text-zinc-400 hover:text-zinc-300'
        }`}
      >
        {RECEIPTS_SORT_BY_STRENGTH}
      </button>
    </div>
  );
}
