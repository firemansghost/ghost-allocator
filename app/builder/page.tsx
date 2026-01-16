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
  computePlatformSplit,
  buildVoyaImplementation,
  computeVoyaDeltaPlan,
  getVoyaDeltaSummary,
} from '@/lib/portfolioEngine';
import { getHouseModel, getHouseModelWithWrappers, isHousePreset } from '@/lib/houseModels';
import { getStandardSchwabLineup, willShowGoldBtc } from '@/lib/schwabLineups';
import { computeScaledHouseLineup, type GhostRegimeScaleData } from '@/lib/houseScaling';
import { DEFAULT_REBALANCE_THRESHOLD_PCT } from '@/lib/ghostregime/education';
import { getModelTemplate } from '@/lib/modelTemplates';
import AllocationChart from '@/components/AllocationChart';
import SleeveBreakdown from '@/components/SleeveBreakdown';
import { GlassCard } from '@/components/GlassCard';
import CurrentVoyaForm from '@/components/CurrentVoyaForm';
import GhostRegimeHouseEducation from '@/components/ghostregime/GhostRegimeHouseEducation';
import ActionPlanTemplateDna from '@/components/builder/ActionPlanTemplateDna';
import { formatPercent } from '@/lib/format';
import type { CurrentVoyaHolding } from '@/lib/types';
import { buildActionPlanDnaString } from '@/lib/builder/actionPlanCopy';
import { encodeDnaToQuery } from '@/lib/builder/dnaLink';
import { useClipboardCopy } from '@/lib/builder/useClipboardCopy';
import type { PortfolioPreset, SchwabLineupStyle, GoldInstrument, BtcInstrument, GoldBtcTilt, RiskLevel } from '@/lib/types';

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

/**
 * Template DNA Banner Component (inline in Builder)
 * Shows template info with Copy DNA and Share link actions
 */
function TemplateDnaBanner({
  selectedTemplateId,
  platform,
  riskLevelOverride,
  portfolioPreset,
  schwabLineupStyle,
  goldBtcTilt,
  goldInstrument,
  btcInstrument,
  complexityPreference,
}: {
  selectedTemplateId: string;
  platform: 'voya_only' | 'voya_and_schwab';
  riskLevelOverride?: RiskLevel;
  portfolioPreset?: PortfolioPreset;
  schwabLineupStyle?: SchwabLineupStyle;
  goldBtcTilt?: GoldBtcTilt;
  goldInstrument?: GoldInstrument;
  btcInstrument?: BtcInstrument;
  complexityPreference?: 'simple' | 'moderate' | 'advanced';
}) {
  const [dnaCopied, copyDna] = useClipboardCopy();
  const [linkCopied, copyLink] = useClipboardCopy();
  
  const template = getModelTemplate(selectedTemplateId);
  if (!template) return null;

  // Build DNA string
  const dnaString = buildActionPlanDnaString({
    templateId: selectedTemplateId,
    templateName: template.title,
    platform,
    riskLevelOverride,
    portfolioPreset,
    schwabLineupStyle,
    goldBtcTilt,
    goldInstrument,
    btcInstrument,
  });

  const handleCopyDna = async () => {
    await copyDna(dnaString);
  };

  const handleShareLink = async () => {
    const answers = {
      selectedTemplateId,
      platform,
      riskLevelOverride,
      portfolioPreset,
      schwabLineupStyle,
      goldBtcTilt,
      goldInstrument,
      btcInstrument,
      complexityPreference,
    };

    const encoded = encodeDnaToQuery(answers);
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/onboarding?dna=${encoded}`
      : `/onboarding?dna=${encoded}`;

    await copyLink(url);
  };

  return (
    <GlassCard className="p-4 mb-6 border-amber-400/30 bg-amber-400/5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-200">Template DNA:</span>
            <span className="text-xs text-amber-300">{template.title}</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {riskLevelOverride !== undefined
              ? `Risk is pinned to ${riskLevelOverride}`
              : 'Risk is computed'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDna}
            aria-label="Copy Template DNA to clipboard"
            className="text-[10px] px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 whitespace-nowrap"
          >
            {dnaCopied ? 'Copied' : 'Copy DNA'}
          </button>
          <button
            onClick={handleShareLink}
            aria-label="Copy shareable DNA link to clipboard"
            className="text-[10px] px-2 py-1 rounded border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 whitespace-nowrap"
          >
            {linkCopied ? 'Copied' : 'Share link'}
          </button>
          <Link
            href="/models"
            className="text-[11px] text-amber-300 hover:text-amber-200 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1 whitespace-nowrap"
          >
            Change templates
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Builder() {
  const [result, setResult] = useState<QuestionnaireResult | null>(null);
  const [portfolio, setPortfolio] = useState<ModelPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVoyaHoldings, setCurrentVoyaHoldings] = useState<
    CurrentVoyaHolding[] | undefined
  >(undefined);
  const [ghostRegimeData, setGhostRegimeData] = useState<GhostRegimeScaleData | null>(null);
  const [ghostRegimeError, setGhostRegimeError] = useState<boolean>(false);
  const [ghostRegimeFull, setGhostRegimeFull] = useState<{
    regime: string;
    risk_regime: string;
    date?: string;
    stale?: boolean;
  } | null>(null);
  const [ghostRegimeHistory, setGhostRegimeHistory] = useState<Array<{
    date: string;
    regime: string;
    risk_regime: string;
    stocks_scale: number;
    gold_scale: number;
    btc_scale: number;
  }> | null>(null);
  const [ghostRegimeHistoryError, setGhostRegimeHistoryError] = useState<boolean>(false);

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

  const { answers: initialAnswers, riskLevel } = result;
  const [answers, setAnswers] = useState(initialAnswers);
  const platformSplit = computePlatformSplit(answers);
  const voyaImplementation = buildVoyaImplementation(answers, riskLevel);
  const preset = answers.portfolioPreset ?? 'standard';
  const isHouseModel = isHousePreset(preset);
  const tilt = answers.goldBtcTilt ?? 'none';
  const lineupStyle = answers.schwabLineupStyle ?? 'standard';
  const goldInstrument = answers.goldInstrument ?? 'gldm';
  const btcInstrument = answers.btcInstrument ?? 'fbtc';

  // Get Standard preset Schwab lineup (with tilt and lineup style applied)
  const standardSchwabLineup =
    platformSplit.platform === 'voya_and_schwab' && !isHouseModel
      ? getStandardSchwabLineup(
          portfolio.sleeves,
          riskLevel,
          lineupStyle,
          goldInstrument,
          btcInstrument,
          tilt
        )
      : null;

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

  const handleTiltChange = (newTilt: GoldBtcTilt) => {
    const updatedAnswers = { ...answers, goldBtcTilt: newTilt };
    setAnswers(updatedAnswers);
    const updatedResult = { ...result, answers: updatedAnswers };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResult));
    setResult(updatedResult);
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

      {/* Template DNA Banner */}
      {answers.selectedTemplateId && (
        <TemplateDnaBanner
          selectedTemplateId={answers.selectedTemplateId}
          platform={platformSplit.platform}
          riskLevelOverride={answers.riskLevelOverride}
          portfolioPreset={preset}
          schwabLineupStyle={lineupStyle}
          goldBtcTilt={tilt}
          goldInstrument={goldInstrument}
          btcInstrument={btcInstrument}
          complexityPreference={answers.complexityPreference}
        />
      )}

      {/* Start here strip */}
      <GlassCard className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Start here</h2>
        <ol className="space-y-2 text-xs text-zinc-300 leading-relaxed list-decimal list-inside">
          <li>
            Your path:{' '}
            {platformSplit.platform === 'voya_only'
              ? 'Voya-only (OKC Voya core menu).'
              : 'Voya + Schwab (balance split + manual sweep).'}
            {' '}
            <Link
              href="/onboarding"
              className="text-xs text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1"
            >
              Change answers
            </Link>
          </li>
          <li>
            If you know your current mix, add it below (optional) for exact &quot;move money from X to Y&quot; steps.
          </li>
          <li>
            Set your future contributions to match the target mix{' '}
            {platformSplit.platform === 'voya_only'
              ? '— then let contributions do most of the work.'
              : '— then sweep to Schwab monthly/quarterly when you rebalance (payroll can&apos;t send it there).'}
          </li>
        </ol>
        <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-3 text-xs">
          <Link
            href="#current-voya-mix"
            className="text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1"
          >
            Jump to Current Voya mix
          </Link>
          <Link
            href="#target-mix"
            className="text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1"
          >
            Jump to Target mix
          </Link>
          {voyaDeltaPlan.hasData && (
            <Link
              href="#move-steps"
              className="text-zinc-400 hover:text-zinc-200 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1"
            >
              Jump to one-time rebalance
            </Link>
          )}
        </div>
      </GlassCard>

      {/* Action Plan */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-50">Action plan</h2>
        {answers.selectedTemplateId && (
          <ActionPlanTemplateDna
            selectedTemplateId={answers.selectedTemplateId}
            platform={platformSplit.platform}
            riskLevelOverride={answers.riskLevelOverride}
            portfolioPreset={preset}
            schwabLineupStyle={lineupStyle}
            goldBtcTilt={tilt}
            goldInstrument={goldInstrument}
            btcInstrument={btcInstrument}
            complexityPreference={answers.complexityPreference}
          />
        )}
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
                Use the &quot;Current Voya mix&quot; and &quot;One-time rebalance (optional)&quot; cards below to move money out of what&apos;s overweight and into
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
                &quot;One-time rebalance (optional)&quot; cards below to see how to shift.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300 mb-1">
                Step 3 – Inside Schwab
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {isHouseModel
                  ? `Buy the House Model lineup below (S&P + Gold + Bitcoin). See the "Schwab house model lineup" card.`
                  : `Use the Ghost ETF lineup for your risk band (see the "Schwab ETF sleeve lineup" card below). Schwab holds most of the equity risk.`}
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

      {/* Target Voya mix - Voya-only (appears right after Action plan) */}
      {platformSplit.platform === 'voya_only' && (
        <div id="target-mix">
          <GlassCard className="p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-50">
              Target Voya mix (set this in Voya)
            </h2>
            <>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Set your Voya contribution allocation to match this target mix. This implements your Ghost sleeves using the OKC Voya core menu.
              </p>
              <p className="text-[11px] text-zinc-400 mt-2 italic">
                Note: Target-date funds are allowed as current holdings, but Ghost Allocator doesn&apos;t recommend them as the target mix.
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                In Voya, &quot;Stable Value Option&quot; is your cash-like holding.
              </p>
              {voyaImplementation.note && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-200">
                  {voyaImplementation.note}
                </div>
              )}
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
                      {platformSplit.platform === 'voya_only'
                        ? `${item.allocationPct}% of your 457`
                        : `${item.allocationPct}% of Voya portion`}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[11px] text-zinc-500">
                This mix represents ~100% of your 457 balance. Percentages are matched on role (growth vs defensive), not exact sleeve labels.
              </p>
            </>
          </GlassCard>
        </div>
      )}

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
          <div id="current-voya-mix">
            <CurrentVoyaForm
              value={currentVoyaHoldings}
              onChange={handleVoyaHoldingsChange}
              isVoyaOnly={platformSplit.platform === 'voya_only'}
            />
            {platformSplit.platform === 'voya_only' && (
              <p className="text-[11px] text-zinc-400 mt-2">
                In Voya, &quot;Stable Value Option&quot; is your cash-like holding.
              </p>
            )}
          </div>

          {/* One-time rebalance (optional) */}
          {voyaDeltaPlan.hasData ? (
            <div id="move-steps">
              <GlassCard className="p-4 sm:p-5 space-y-3">
                <h2 className="text-sm font-semibold text-zinc-50">
                  One-time rebalance (optional)
                </h2>
                {voyaImplementation.style === 'core_mix' && voyaImplementation.mix && (
                  <>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Based on what you told us about your current Voya holdings, here&apos;s how to
                      get closer to the target mix.
                      {platformSplit.platform === 'voya_and_schwab' && (
                        <> Numbers are percentages of the Voya slice of your 457, not the whole account.</>
                      )}
                    </p>
                    {voyaDeltaPlan.overweight.length > 0 || voyaDeltaPlan.underweight.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-zinc-400 font-medium">
                          Net changes to reach the target mix:
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 text-xs">
                          {voyaDeltaPlan.overweight.length > 0 && (
                            <div>
                              <span className="text-zinc-400 font-medium">Reduce: </span>
                              <span className="text-zinc-200">
                                {voyaDeltaPlan.overweight.map((f, idx) => (
                                  <span key={f.id}>
                                    {f.name} -{Math.round(Math.abs(f.deltaPct))}%
                                    {idx < voyaDeltaPlan.overweight.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                          {voyaDeltaPlan.underweight.length > 0 && (
                            <div>
                              <span className="text-zinc-400 font-medium">Add: </span>
                              <span className="text-zinc-200">
                                {voyaDeltaPlan.underweight.map((f, idx) => (
                                  <span key={f.id}>
                                    {f.name} +{Math.round(f.deltaPct)}%
                                    {idx < voyaDeltaPlan.underweight.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
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
                              <span className="font-medium">
                                {f.name}
                                {f.id === 'stable_value_option' ? ' (cash-like)' : ''}
                              </span>{' '}
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
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="p-4 sm:p-5 space-y-3 opacity-75">
              <h2 className="text-sm font-semibold text-zinc-50">
                One-time rebalance (optional)
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Enter your current Voya holdings in the &quot;Current Voya mix&quot; section above to
                get exact &quot;move money from X to Y&quot; instructions. Once you add your current
                mix (percentages should add up to ~100% of your 457), we&apos;ll show you exactly how
                to shift your holdings to match the recommended mix.
              </p>
            </GlassCard>
          )}
        </div>

        {/* Right column - Voya implementation cards */}
        <div className="space-y-4">
          {/* Voya core funds for Voya + Schwab */}
          {platformSplit.platform === 'voya_and_schwab' && (
            <div id="target-mix">
              <GlassCard className="p-4 sm:p-5 space-y-3">
                <h2 className="text-sm font-semibold text-zinc-50">
                  Voya core funds ({platformSplit.targetVoyaPct}% of 457)
                </h2>
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
                  {voyaImplementation.note && (
                    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-200">
                      {voyaImplementation.note}
                    </div>
                  )}
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
            </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Schwab ETF lineup for Voya + Schwab */}
      {platformSplit.platform === 'voya_and_schwab' && (
        <>
          {isHouseModel ? (
            /* House Model lineup */
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-50">
                Schwab house model lineup ({platformSplit.targetSchwabPct}% of 457)
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This is a house preset. Percentages are of your Schwab slice. This is for
                illustration only, not a recommendation.
              </p>

              <GhostRegimeHouseEducation
                houseModel={getHouseModel(preset)}
                ghostRegimeData={ghostRegimeData}
                ghostRegimeFull={ghostRegimeFull}
                ghostRegimeHistory={ghostRegimeHistory}
                ghostRegimeHistoryError={ghostRegimeHistoryError}
                scaledLineup={computeScaledHouseLineup(
                  getHouseModel(preset),
                  ghostRegimeData,
                  goldInstrument,
                  btcInstrument
                )}
                rebalanceThresholdPct={DEFAULT_REBALANCE_THRESHOLD_PCT}
                goldInstrument={goldInstrument}
                btcInstrument={btcInstrument}
                ghostRegimeError={ghostRegimeError}
              />
              
              {(goldInstrument === 'ygld' || btcInstrument === 'maxi') && (
                <p className="text-[11px] text-amber-300 mt-2">
                  Using income wrappers: {goldInstrument === 'ygld' ? 'YGLD' : ''}
                  {goldInstrument === 'ygld' && btcInstrument === 'maxi' ? ' / ' : ''}
                  {btcInstrument === 'maxi' ? 'MAXI' : ''}
                </p>
              )}
              <p className="text-[11px] text-zinc-400 mt-3">
                Want the sleeve-based version instead? Change preset back to Standard in onboarding.
              </p>
            </GlassCard>
          ) : (
            /* Standard Schwab ETF lineup */
            <GlassCard className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-zinc-50">
                  Schwab ETF sleeve lineup ({platformSplit.targetSchwabPct}% of 457)
                </h2>
                {lineupStyle === 'simplify' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Simplify mode
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                These example ETFs would apply to the Schwab portion of your account. This is for
                illustration only, not a recommendation.
              </p>
              
              {/* Customize: Optional Tilts (Schwab only) */}
              {platformSplit.platform === 'voya_and_schwab' &&
                !isHouseModel &&
                platformSplit.targetSchwabPct > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-2">Customize</h3>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-300">
                        Optional tilts (Schwab only)
                      </label>
                      <div className="space-y-1.5 text-sm text-zinc-200">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="goldBtcTilt"
                            value="none"
                            checked={tilt === 'none'}
                            onChange={() => handleTiltChange('none')}
                            className="h-3.5 w-3.5 accent-amber-400"
                          />
                          <span>None</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="goldBtcTilt"
                            value="gold10_btc5"
                            checked={tilt === 'gold10_btc5'}
                            onChange={() => handleTiltChange('gold10_btc5')}
                            className="h-3.5 w-3.5 accent-amber-400"
                          />
                          <span>10% Gold / 5% Bitcoin</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="goldBtcTilt"
                            value="gold15_btc5"
                            checked={tilt === 'gold15_btc5'}
                            onChange={() => handleTiltChange('gold15_btc5')}
                            className="h-3.5 w-3.5 accent-amber-400"
                          />
                          <span>15% Gold / 5% Bitcoin</span>
                        </label>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        This adjusts the Schwab lineup only (percent of your Schwab slice).
                      </p>
                    </div>
                  </div>
                )}
              
              {tilt !== 'none' && (
                <p className="text-[11px] text-amber-300 mt-1">
                  Includes Gold + Bitcoin tilt.
                </p>
              )}
              {(goldInstrument === 'ygld' || btcInstrument === 'maxi') && (
                <p className="text-[11px] text-amber-300 mt-1">
                  Using income wrappers:{' '}
                  {goldInstrument === 'ygld' ? 'YGLD' : ''}
                  {goldInstrument === 'ygld' && btcInstrument === 'maxi' ? ' / ' : ''}
                  {btcInstrument === 'maxi' ? 'MAXI' : ''}
                </p>
              )}
              <p className="text-[11px] text-zinc-400 mt-1">
                Pro tip: Most folks rebalance into Schwab monthly or quarterly, not every paycheck.
                Pick a cadence you&apos;ll actually stick with.
              </p>
              <div className="mt-2 space-y-1 text-xs text-zinc-300 leading-relaxed">
                {standardSchwabLineup?.map((item) => {
                  if (item.type === 'tilt') {
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4"
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <span className="font-mono text-sm font-semibold">
                              {item.ticker}
                            </span>
                            <span className="text-xs text-zinc-400 ml-2">{item.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-amber-300">
                            {item.weight.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    // Render sleeve item
                    if (!item.etfs || item.etfs.length === 0) return null;
                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-zinc-800 bg-black/40 p-4"
                      >
                        <h3 className="text-sm font-semibold mb-3">
                          {item.label} ({item.weight.toFixed(1)}%)
                        </h3>
                        <div className="space-y-3">
                          {item.etfs.map((etf, idx) => (
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
                  }
                })}
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Details section */}
      <details className="pt-4 group">
        <summary className="cursor-pointer list-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 inline-flex items-center gap-2 hover:text-zinc-300 transition-colors">
            <span className="text-xs text-zinc-500 group-open:rotate-90 transition-transform">
              ▶
            </span>
            Details behind the plan (optional)
          </h2>
        </summary>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 mt-4">
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

        {/* Optional ETF lineup for Voya-only (nested under Details) */}
        {platformSplit.platform === 'voya_only' && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-zinc-50 mb-3">
              Optional ETF lineup (if you ever add Schwab or an IRA later)
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              These are example ETFs you could use in a full brokerage account (like Schwab or an
              IRA) if you ever decide to open one. They&apos;re not available directly in the Voya
              core menu, but they follow the same Ghost sleeves shown above.
            </p>
            <div className="space-y-1 text-xs text-zinc-300 leading-relaxed">
              {portfolio.sleeves
                .filter((s) => s.weight > 0)
                .map((sleeve) => (
                  <div
                    key={sleeve.id}
                    className="rounded-lg border border-zinc-800 bg-black/40 p-4"
                  >
                    <h4 className="text-sm font-semibold mb-2">
                      {sleeve.name} ({formatPercent(sleeve.weight)})
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {sleeve.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </details>
    </div>
  );
}

