/**
 * Receipts Search Input
 * 
 * Search input for filtering receipts by keyword
 */

'use client';

import { RECEIPTS_SEARCH_CLEAR } from '@/lib/ghostregime/ghostregimePageCopy';

interface ReceiptsSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function ReceiptsSearchInput({
  value,
  onChange,
  placeholder,
}: ReceiptsSearchInputProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-2 py-0.5 text-[10px] rounded border border-zinc-700 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-300 transition-colors"
          aria-label={RECEIPTS_SEARCH_CLEAR}
        >
          {RECEIPTS_SEARCH_CLEAR}
        </button>
      )}
    </div>
  );
}
