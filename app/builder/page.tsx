'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { QuestionnaireResult, ModelPortfolio, ExampleETF } from '@/lib/types';
import { selectModelPortfolio, suggestExampleEtfs } from '@/lib/portfolioEngine';
import AllocationChart from '@/components/AllocationChart';
import SleeveBreakdown from '@/components/SleeveBreakdown';
import { Disclaimer } from '@/components/Disclaimer';
import { formatPercent } from '@/lib/format';

const STORAGE_KEY = 'ghostAllocatorQuestionnaire';

const riskLabels: Record<number, string> = {
  1: 'Very Conservative',
  2: 'Conservative',
  3: 'Moderate',
  4: 'Aggressive',
  5: 'Very Aggressive',
};

const riskDescriptions: Record<number, string> = {
  1: 'Lower risk, higher allocation to defensive assets and cash. Suitable for those near retirement or with low risk tolerance.',
  2: 'Conservative allocation focused on capital preservation with income generation.',
  3: 'Balanced allocation across asset classes. Designed for investors with medium-term horizons and moderate risk tolerance.',
  4: 'Higher equity allocation with strategic use of convexity and real assets.',
  5: 'Maximum equity allocation for investors with longer horizons and higher risk tolerance.',
};

export default function Builder() {
  const [result, setResult] = useState<QuestionnaireResult | null>(null);
  const [portfolio, setPortfolio] = useState<ModelPortfolio | null>(null);
  const [etfs, setEtfs] = useState<ExampleETF[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setError('No questionnaire data found');
      return;
    }

    try {
      const data: QuestionnaireResult = JSON.parse(stored);
      setResult(data);
      const modelPortfolio = selectModelPortfolio(data.riskLevel);
      setPortfolio(modelPortfolio);
      const suggestedEtfs = suggestExampleEtfs(modelPortfolio);
      setEtfs(suggestedEtfs);
    } catch (err) {
      setError('Invalid questionnaire data');
    }
  }, []);

  if (error || !result || !portfolio) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Portfolio Builder
        </h1>
        <p className="text-sm text-slate-300">
          {error ||
            'Unable to load your portfolio. Please complete the questionnaire first.'}
        </p>
        <Link
          href="/onboarding"
          className="inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400"
        >
          Start Questionnaire
        </Link>
      </div>
    );
  }

  const { answers, riskLevel } = result;
  const etfsBySleeve: Record<string, ExampleETF[]> = {};
  for (const etf of etfs) {
    if (!etfsBySleeve[etf.sleeveId]) {
      etfsBySleeve[etf.sleeveId] = [];
    }
    etfsBySleeve[etf.sleeveId].push(etf);
  }

  return (
    <div className="space-y-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Ghost Allocation</h1>
          <p className="mt-1 text-sm text-slate-300">
            Based on your answers and income floor, here&apos;s a Cem-inspired ETF allocation.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Risk level: {riskLabels[riskLevel]}
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* You told us summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold">You told us</h2>
            <div className="grid gap-2 text-xs">
              <div>
                <span className="text-slate-400">Age: </span>
                <span className="font-medium text-slate-200">{answers.age}</span>
              </div>
              <div>
                <span className="text-slate-400">Years to goal: </span>
                <span className="font-medium text-slate-200">
                  {answers.yearsToGoal}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Retired: </span>
                <span className="font-medium text-slate-200">
                  {answers.isRetired ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Risk tolerance: </span>
                <span className="font-medium text-slate-200">
                  {answers.drawdownTolerance.charAt(0).toUpperCase() +
                    answers.drawdownTolerance.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Pension callout */}
          {answers.hasPension && answers.pensionCoverage !== 'none' && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Income Floor Detected</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                You told us you&apos;ll have pension and other guaranteed income
                covering{' '}
                {answers.pensionCoverage === 'most_or_all'
                  ? 'most or all'
                  : answers.pensionCoverage === 'about_half'
                  ? 'about half'
                  : 'a portion'}{' '}
                of your basic retirement expenses.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                That means your investment portfolio is doing more &quot;growth and
                flexibility&quot; work and less &quot;keep the lights on&quot; work.
                Ghost Allocator takes that income floor into account when setting
                your risk level.
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Allocation chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Allocation Breakdown</h2>
            <div>
              <AllocationChart sleeves={portfolio.sleeves} />
            </div>
          </div>

          {/* Sleeve breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Sleeve Details</h2>
            <div>
              <SleeveBreakdown sleeves={portfolio.sleeves} />
            </div>
          </div>
        </div>
      </div>

      {/* Example ETF lineup */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h2 className="text-sm font-semibold">Example ETF Lineup</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          These are example ETFs you could use in a full brokerage account. This
          is for illustration only, not a recommendation.
        </p>
        <div className="space-y-4">
          {portfolio.sleeves
            .filter((s) => s.weight > 0)
            .map((sleeve) => {
              const sleeveEtfs = etfsBySleeve[sleeve.id] || [];
              if (sleeveEtfs.length === 0) return null;

              return (
                <div
                  key={sleeve.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
                >
                  <h3 className="text-sm font-semibold mb-3">
                    {sleeve.name} ({formatPercent(sleeve.weight)})
                  </h3>
                  <div className="space-y-3">
                    {sleeveEtfs.map((etf, idx) => (
                      <div
                        key={idx}
                        className="pl-3 border-l-2 border-slate-700"
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold">
                            {etf.ticker}
                          </span>
                          <span className="text-xs text-slate-400">
                            {etf.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {etf.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-slate-800 pt-6">
        <Disclaimer />
      </div>
    </div>
  );
}

