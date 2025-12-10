'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  QuestionnaireResult,
  ModelPortfolio,
  ExampleETF,
  VoyaDeltaPlan,
} from '@/lib/types';
import {
  selectModelPortfolio,
  suggestExampleEtfs,
  computePlatformSplit,
  buildVoyaImplementation,
  computeVoyaDeltaPlan,
  getVoyaDeltaSummary,
} from '@/lib/portfolioEngine';
import AllocationChart from '@/components/AllocationChart';
import SleeveBreakdown from '@/components/SleeveBreakdown';
import { GlassCard } from '@/components/GlassCard';
import CurrentVoyaForm from '@/components/CurrentVoyaForm';
import { formatPercent } from '@/lib/format';
import type { CurrentVoyaHolding } from '@/lib/types';

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
  const [currentVoyaHoldings, setCurrentVoyaHoldings] = useState<
    CurrentVoyaHolding[] | undefined
  >(undefined);

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
      setCurrentVoyaHoldings(data.answers.currentVoyaHoldings);
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
        <p className="text-sm text-zinc-300">
          {error ||
            'Unable to load your portfolio. Please complete the questionnaire first.'}
        </p>
        <Link
          href="/onboarding"
          className="inline-block rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-black shadow-md shadow-amber-400/40 hover:bg-amber-300"
        >
          Start Questionnaire
        </Link>
      </div>
    );
  }

  const { answers, riskLevel } = result;
  const platformSplit = computePlatformSplit(answers);
  const voyaImplementation = buildVoyaImplementation(answers, riskLevel);
  const etfsBySleeve: Record<string, ExampleETF[]> = {};
  for (const etf of etfs) {
    if (!etfsBySleeve[etf.sleeveId]) {
      etfsBySleeve[etf.sleeveId] = [];
    }
    etfsBySleeve[etf.sleeveId].push(etf);
  }

  // Compute delta plan for current vs target Voya mix
  const activeHoldings =
    currentVoyaHoldings && currentVoyaHoldings.length > 0
      ? currentVoyaHoldings
      : answers.currentVoyaHoldings;
  const voyaDeltaPlan: VoyaDeltaPlan = computeVoyaDeltaPlan(
    voyaImplementation,
    activeHoldings
  );
  const voyaDeltaSummary =
    voyaImplementation.style === 'core_mix'
      ? getVoyaDeltaSummary(voyaDeltaPlan)
      : null;

  const handleVoyaHoldingsChange = (holdings: CurrentVoyaHolding[]) => {
    setCurrentVoyaHoldings(holdings);
    // Update localStorage
    const updatedAnswers = { ...answers, currentVoyaHoldings: holdings };
    const updatedResult = { ...result, answers: updatedAnswers };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResult));
  };

  return (
    <div className="space-y-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Ghost Allocation</h1>
          <p className="mt-1 text-sm text-zinc-300">
            {platformSplit.platform === 'voya_only'
              ? "Based on your answers and income floor, here's your Ghost sleeve blueprint and how to approximate it using the Voya 457 core menu."
              : "Based on your answers and income floor, here's a post-60/40 Ghost sleeve allocation and how to implement it across Schwab ETFs and the Voya core menu."}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
          Risk level: {riskLabels[riskLevel]}
        </span>
      </header>

      {/* Action Plan */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-50">Action plan</h2>
        {platformSplit.platform === 'voya_only' ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 1 – Use the Voya core menu only
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Keep 100% of your 457 in the Voya core funds.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 2 – Clean up your Voya mix
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Use the &quot;Current Voya mix&quot; and &quot;Step 2 – Adjust your current Voya
                mix&quot; cards below to move money out of what&apos;s overweight and into
                what&apos;s missing.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 3 – Update your paycheck split
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                In Voya, update your contribution allocation so each new paycheck goes into the same
                fund percentages as your target Voya mix.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 1 – Platform split
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Put your overall 457 balance at about {platformSplit.targetSchwabPct}% in Schwab
                BrokerageLink and {platformSplit.targetVoyaPct}% in the Voya core funds.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Ghost Allocator uses Schwab for the growth sleeves and Voya as your safety +
                inflation bucket. New contributions will still land in Voya first – you&apos;ll move
                some over to Schwab when you rebalance.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 2 – Inside Voya
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Use the Voya core-fund mix for your risk band (see the &quot;Voya core funds&quot;
                card below). Voya is your safety + inflation bucket.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                If your current Voya funds are different, use the &quot;Current Voya mix&quot; and
                &quot;Step 2 – Adjust your current Voya mix&quot; cards below to see how to shift.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 3 – Inside Schwab
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Use the Ghost ETF lineup for your risk band (see the &quot;Schwab ETF sleeve
                lineup&quot; card below). Schwab holds most of the equity risk.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 4 – Keep your {platformSplit.targetSchwabPct}/{platformSplit.targetVoyaPct}{' '}
                split over time
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                In the OKC 457, every paycheck still lands in Voya first – that&apos;s how the plan
                is set up. Here&apos;s how to keep your {platformSplit.targetSchwabPct}/
                {platformSplit.targetVoyaPct} target:
              </p>
              <ul className="text-xs text-zinc-300 leading-relaxed mt-1 space-y-1 ml-4 list-disc">
                <li>
                  In Voya, keep your contribution allocation 100% into the Voya core funds using
                  the mix above. The plan can&apos;t send money straight to Schwab from payroll –
                  you&apos;ll move it yourself when you rebalance.
                </li>
                <li>
                  Once a month or once a quarter, move some of your Voya balance over to Schwab
                  BrokerageLink and buy the Ghost ETF lineup there.
                </li>
                <li>
                  When you move money, aim so your total 457 is still roughly{' '}
                  {platformSplit.targetSchwabPct}% in Schwab and {platformSplit.targetVoyaPct}% in
                  Voya. Close enough is good enough; it doesn&apos;t have to be perfect.
                </li>
              </ul>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* You told us summary */}
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-50">You told us</h2>
            <div className="grid gap-2 text-xs">
              <div>
                <span className="text-zinc-400">Age: </span>
                <span className="font-medium text-zinc-200">{answers.age}</span>
              </div>
              <div>
                <span className="text-zinc-400">Years to goal: </span>
                <span className="font-medium text-zinc-200">
                  {answers.yearsToGoal}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Retired: </span>
                <span className="font-medium text-zinc-200">
                  {answers.isRetired ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Risk tolerance: </span>
                <span className="font-medium text-zinc-200">
                  {answers.drawdownTolerance.charAt(0).toUpperCase() +
                    answers.drawdownTolerance.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Platform: </span>
                <span className="font-medium text-zinc-200">
                  {answers.platform === 'voya_only'
                    ? 'Voya only'
                    : `Voya + Schwab${
                        answers.currentSchwabPct !== undefined
                          ? ` (~${answers.currentSchwabPct}% in Schwab)`
                          : ''
                      }${
                        answers.schwabPreference === 'use_full_75'
                          ? ', prefers up to 75%'
                          : ''
                      }`}
                </span>
              </div>
              {platformSplit.platform === 'voya_and_schwab' && (
                <div>
                  <span className="text-zinc-400">Recommended split: </span>
                  <span className="font-medium text-amber-300">
                    {platformSplit.targetSchwabPct}% Schwab / {platformSplit.targetVoyaPct}% Voya
                  </span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Pension callout */}
          {answers.hasPension && answers.pensionCoverage !== 'none' && (
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-50">Income Floor Detected</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                You told us you&apos;ll have pension and other guaranteed income
                covering{' '}
                {answers.pensionCoverage === 'most_or_all'
                  ? 'most or all'
                  : answers.pensionCoverage === 'about_half'
                  ? 'about half'
                  : 'a portion'}{' '}
                of your basic retirement expenses.
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">
                That means your investment portfolio is doing more &quot;growth and
                flexibility&quot; work and less &quot;keep the lights on&quot; work.
                Ghost Allocator takes that income floor into account when setting
                your risk level.
              </p>
            </GlassCard>
          )}

          {/* Current Voya mix form */}
          <CurrentVoyaForm
            value={currentVoyaHoldings}
            onChange={handleVoyaHoldingsChange}
            isVoyaOnly={platformSplit.platform === 'voya_only'}
          />

          {/* Step 2 – Adjust your current Voya mix */}
          {voyaDeltaPlan.hasData && (
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-50">
                Step 2 – Adjust your current Voya mix
              </h2>
              {voyaImplementation.style === 'core_mix' && voyaImplementation.mix && (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Based on what you told us about your current Voya holdings, here&apos;s how to
                    get closer to the target mix. Numbers are percentages of the Voya slice of your
                    457, not the whole account.
                  </p>
                  {voyaDeltaSummary && (
                    <p className="mt-2 text-xs font-medium text-amber-300">
                      {voyaDeltaSummary}
                    </p>
                  )}
                  {voyaDeltaPlan.totalCurrentPct > 105 ||
                  voyaDeltaPlan.totalCurrentPct < 95 ? (
                    <p className="text-[11px] text-amber-300">
                      Heads up: your current Voya percentages add up to about{' '}
                      {Math.round(voyaDeltaPlan.totalCurrentPct)}%. That&apos;s okay for a rough
                      pass, but the moves below assume they&apos;re &quot;about right&quot;.
                    </p>
                  ) : null}
                  {voyaDeltaPlan.overweight.length === 0 &&
                  voyaDeltaPlan.underweight.length === 0 ? (
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your current Voya mix is already very close to the suggested mix. You
                      don&apos;t need big changes—just keep future contributions pointed at this
                      target.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                          Reduce from
                        </h3>
                        <ul className="space-y-1.5 text-xs text-zinc-200">
                          {voyaDeltaPlan.overweight.map((f) => (
                            <li key={f.id}>
                              <span className="font-medium">{f.name}</span>{' '}
                              <span className="text-[11px] text-zinc-400">
                                from ~{Math.round(f.currentPct)}% down to ~
                                {Math.round(f.targetPct)}% (move about{' '}
                                {Math.round(Math.abs(f.deltaPct))}% out)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                          Add to
                        </h3>
                        <ul className="space-y-1.5 text-xs text-zinc-200">
                          {voyaDeltaPlan.underweight.map((f) => (
                            <li key={f.id}>
                              <span className="font-medium">{f.name}</span>{' '}
                              <span className="text-[11px] text-zinc-400">
                                from ~{Math.round(f.currentPct)}% up to ~
                                {Math.round(f.targetPct)}% (add about{' '}
                                {Math.round(f.deltaPct)}%)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              )}
              {voyaImplementation.style === 'simple_target_date' && (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    You chose the simple path using a single Vanguard Target Retirement fund. The
                    goal is to end up with about 100% of your Voya 457 in:
                  </p>
                  <p className="text-sm font-medium text-amber-300">
                    {voyaImplementation.targetDateFundName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Redirect new contributions into this fund, and over time move money from your
                    existing holdings into it until it&apos;s roughly your whole Voya balance.
                  </p>
                </>
              )}
            </GlassCard>
          )}

          {/* Voya-only implementation */}
          {platformSplit.platform === 'voya_only' && (
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-50">
                Voya-only implementation
              </h2>
              {voyaImplementation.style === 'simple_target_date' ? (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    To keep things simple in the Voya core menu, this uses a single Vanguard Target
                    Retirement fund as a stand-in for your Ghost sleeve mix. The sleeves still
                    describe the risk/return profile; this fund is the implementation.
                  </p>
                  <p className="text-sm font-medium text-amber-300">
                    {voyaImplementation.targetDateFundName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    This would represent ~100% of your 457 balance in this plan.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Here&apos;s a Voya core-fund mix that plays the same roles as your Ghost sleeves
                    using the funds available in your plan. It&apos;s matched on growth vs defensive
                    balance and risk band, not exact sleeve percentages.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-zinc-200">
                    {voyaImplementation.mix?.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[11px] text-zinc-400">{item.role}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-300">
                          {item.allocationPct}% of Voya portion
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Since you&apos;re Voya-only, this mix would represent ~100% of your 457.
                  </p>
                </>
              )}
            </GlassCard>
          )}
        </div>

        {/* Right column - Voya implementation cards */}
        <div className="space-y-4">
          {/* Voya-only implementation */}
          {platformSplit.platform === 'voya_only' && (
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-50">
                Voya-only implementation
              </h2>
              {voyaImplementation.style === 'simple_target_date' ? (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    To keep things simple in the Voya core menu, this uses a single Vanguard Target
                    Retirement fund as a stand-in for your Ghost sleeve mix. The sleeves still
                    describe the risk/return profile; this fund is the implementation.
                  </p>
                  <p className="text-sm font-medium text-amber-300">
                    {voyaImplementation.targetDateFundName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    This would represent ~100% of your 457 balance in this plan.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Here&apos;s a Voya core-fund mix that plays the same roles as your Ghost sleeves
                    using the funds available in your plan. It&apos;s matched on growth vs defensive
                    balance and risk band, not exact sleeve percentages.
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-zinc-200">
                    {voyaImplementation.mix?.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[11px] text-zinc-400">{item.role}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-300">
                          {item.allocationPct}% of Voya portion
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Since you&apos;re Voya-only, this mix would represent ~100% of your 457.
                  </p>
                </>
              )}
            </GlassCard>
          )}

          {/* Voya core funds for Voya + Schwab */}
          {platformSplit.platform === 'voya_and_schwab' && (
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-50">
                Voya core funds ({platformSplit.targetVoyaPct}% of 457)
              </h2>
              {voyaImplementation.style === 'simple_target_date' ? (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    If you prefer to keep the Voya slice simple, use a single target-date fund:
                  </p>
                  <p className="text-sm font-medium text-amber-300">
                    {voyaImplementation.targetDateFundName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    This would apply to roughly {platformSplit.targetVoyaPct}% of your 457 that
                    stays in Voya.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    For the Voya portion of your account, we lean into bonds, stable value, and
                    real assets. Schwab handles most of the equity risk; Voya acts as your safety
                    and inflation bucket.
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Percentages below are of the Voya slice only (about{' '}
                    {platformSplit.targetVoyaPct}% of your 457).
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-zinc-200">
                    {voyaImplementation.mix?.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[11px] text-zinc-400">{item.role}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-300">
                          {item.allocationPct}% of Voya portion
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </GlassCard>
          )}
        </div>
      </div>

      {/* Schwab ETF lineup for Voya + Schwab */}
      {platformSplit.platform === 'voya_and_schwab' && (
        <>
          {/* Schwab ETF lineup */}
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-50">
              Schwab ETF sleeve lineup ({platformSplit.targetSchwabPct}% of 457)
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              These example ETFs would apply to the Schwab portion of your account. This is for
              illustration only, not a recommendation.
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Pro tip: Most folks rebalance into Schwab monthly or quarterly, not every paycheck.
              Pick a cadence you&apos;ll actually stick with.
            </p>
            <div className="mt-2 space-y-1 text-xs text-zinc-300 leading-relaxed">
              {portfolio.sleeves
                .filter((s) => s.weight > 0)
                .map((sleeve) => {
                  const sleeveEtfs = etfsBySleeve[sleeve.id] || [];
                  if (sleeveEtfs.length === 0) return null;

                  return (
                    <div
                      key={sleeve.id}
                      className="rounded-lg border border-zinc-800 bg-black/40 p-4"
                    >
                      <h3 className="text-sm font-semibold mb-3">
                        {sleeve.name} ({formatPercent(sleeve.weight)})
                      </h3>
                      <div className="space-y-3">
                        {sleeveEtfs.map((etf, idx) => (
                          <div
                            key={idx}
                            className="pl-3 border-l-2 border-zinc-700"
                          >
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold">
                                {etf.ticker}
                              </span>
                              <span className="text-xs text-zinc-400">{etf.name}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {etf.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </GlassCard>
        </>
      )}

      {/* Details section */}
      <div className="pt-4">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4">
          Details behind the plan
        </h2>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {/* Allocation chart */}
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-50">
                {platformSplit.platform === 'voya_only'
                  ? 'Ghost sleeve blueprint (conceptual)'
                  : 'Allocation Breakdown'}
              </h3>
              {platformSplit.platform === 'voya_only' && (
                <p className="mt-1 text-[11px] text-zinc-400 leading-snug">
                  This shows the ideal Ghost sleeve mix for your risk band. Your Voya core-fund mix
                  below is a translation using the limited menu, so the percentages won&apos;t match
                  1:1 — they&apos;re matched on role (growth vs defensive), not labels.
                </p>
              )}
            </div>
            <div>
              <AllocationChart sleeves={portfolio.sleeves} />
            </div>
          </GlassCard>

          {/* Sleeve breakdown */}
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-50">Sleeve Details</h3>
            {platformSplit.platform === 'voya_only' && (
              <p className="mb-2 text-[11px] text-zinc-400 leading-snug">
                Think of these sleeves as the playbook: equity sleeves ≈ your S&P 500 /
                small-mid / international funds, real assets ≈ PIMCO Diversified Real Assets,
                and defensive sleeves ≈ your core bond / stable value exposure.
                The Voya mix below is built to echo this structure.
              </p>
            )}
            <div>
              <SleeveBreakdown sleeves={portfolio.sleeves} />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Optional ETF lineup for Voya-only */}
      {platformSplit.platform === 'voya_only' && (
        <GlassCard className="p-4 sm:p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">
            Optional ETF lineup (if you ever use Schwab or another brokerage)
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            These are example ETFs you could use in a full brokerage account (like Schwab or an
            IRA) if you ever decide to open one. They&apos;re not available directly in the Voya
            core menu, but they follow the same Ghost sleeves shown above.
          </p>
          <div className="mt-2 space-y-1 text-xs text-zinc-300 leading-relaxed">
            {portfolio.sleeves
              .filter((s) => s.weight > 0)
              .map((sleeve) => {
                const sleeveEtfs = etfsBySleeve[sleeve.id] || [];
                if (sleeveEtfs.length === 0) return null;

                return (
                  <div
                    key={sleeve.id}
                    className="rounded-lg border border-zinc-800 bg-black/40 p-4"
                  >
                    <h3 className="text-sm font-semibold mb-3">
                      {sleeve.name} ({formatPercent(sleeve.weight)})
                    </h3>
                    <div className="space-y-3">
                      {sleeveEtfs.map((etf, idx) => (
                        <div
                          key={idx}
                          className="pl-3 border-l-2 border-zinc-700"
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-mono text-xs font-semibold">
                              {etf.ticker}
                            </span>
                            <span className="text-xs text-zinc-400">{etf.name}</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {etf.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

