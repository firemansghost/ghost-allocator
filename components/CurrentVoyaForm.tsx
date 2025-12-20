'use client';

import { useState } from 'react';
import type { CurrentVoyaHolding } from '@/lib/types';
import { GlassCard } from '@/components/GlassCard';
import {
  VOYA_CORE_FUNDS,
  VOYA_TDF_FUNDS,
  getFundById,
  formatFundForDisplay,
  resolveFundId,
} from '@/lib/voyaFunds';

interface CurrentVoyaFormProps {
  value: CurrentVoyaHolding[] | undefined;
  onChange: (value: CurrentVoyaHolding[]) => void;
  isVoyaOnly?: boolean;
}

export default function CurrentVoyaForm({
  value,
  onChange,
  isVoyaOnly = false,
}: CurrentVoyaFormProps) {
  const [holdings, setHoldings] = useState<CurrentVoyaHolding[]>(
    value || [{ fundId: '', fundName: '', allocationPct: 0 }]
  );

  const updateHoldings = (newHoldings: CurrentVoyaHolding[]) => {
    setHoldings(newHoldings);
    onChange(newHoldings);
  };

  const handleFundChange = (index: number, fundId: string) => {
    if (!fundId) {
      // Empty selection
      const newHoldings = [...holdings];
      newHoldings[index] = {
        ...newHoldings[index],
        fundId: '',
        fundName: '',
      };
      updateHoldings(newHoldings);
      return;
    }

    const fund = getFundById(fundId);
    const canonicalId = resolveFundId(fundId);
    const newHoldings = [...holdings];
    newHoldings[index] = {
      ...newHoldings[index],
      fundId: canonicalId, // Store canonical ID
      fundName: fund?.name || '',
    };
    updateHoldings(newHoldings);
  };

  const handlePctChange = (index: number, pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    const newHoldings = [...holdings];
    newHoldings[index] = {
      ...newHoldings[index],
      allocationPct: clamped,
    };
    updateHoldings(newHoldings);
  };

  const handleAddFund = () => {
    updateHoldings([...holdings, { fundId: '', fundName: '', allocationPct: 0 }]);
  };

  const handleRemoveFund = (index: number) => {
    if (holdings.length > 1) {
      const newHoldings = holdings.filter((_, i) => i !== index);
      updateHoldings(newHoldings);
    }
  };

  const total = holdings.reduce((sum, h) => sum + h.allocationPct, 0);

  return (
    <GlassCard className="p-4 sm:p-5 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-50">
        Current Voya mix (optional)
      </h2>
      <p className="text-xs text-zinc-300 leading-relaxed">
        {isVoyaOnly
          ? 'Tell us roughly how your 457 is allocated today in Voya funds.'
          : 'Tell us roughly how your Voya slice is allocated today (percentages should add up to ~100% of the Voya portion).'}
      </p>
      <div className="space-y-2">
        {holdings.map((holding, index) => (
          <div key={index} className="flex gap-2 items-start">
            <select
              value={holding.fundId}
              onChange={(e) => handleFundChange(index, e.target.value)}
              className="flex-1 rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none focus:ring-0"
            >
              <option value="">Select fund...</option>
              <optgroup label="Core funds">
                {VOYA_CORE_FUNDS.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {formatFundForDisplay(fund)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Target date funds">
                {VOYA_TDF_FUNDS.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {formatFundForDisplay(fund)}
                  </option>
                ))}
              </optgroup>
            </select>
            <input
              type="number"
              min="0"
              max="100"
              value={holding.allocationPct || ''}
              onChange={(e) =>
                handlePctChange(index, parseFloat(e.target.value) || 0)
              }
              className="w-20 rounded-md border border-zinc-700 bg-black/40 px-2 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none focus:ring-0"
              placeholder="%"
            />
            {holdings.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveFund(index)}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded min-h-[44px]"
                aria-label={`Remove ${holdings[index]?.fundName || 'fund'}`}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddFund}
          className="text-xs text-amber-300 hover:text-amber-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px]"
          aria-label="Add another fund"
        >
          + Add another fund
        </button>
      </div>
      <div className="pt-2 border-t border-zinc-800">
        <p className="text-xs text-zinc-400">
          Total: {total.toFixed(1)}%{' '}
          {isVoyaOnly ? 'of 457' : 'of Voya slice'}
        </p>
      </div>
    </GlassCard>
  );
}








