/**
 * GhostRegime Methodology Page
 * How GhostRegime works: Option B voting, VAMS scaling, targets, scales, and more
 */

import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { GlassCard } from '@/components/GlassCard';
import Link from 'next/link';
import {
  GHOSTREGIME_DATA_SOURCES,
  GHOSTREGIME_PRICE_RETURN_NOTE,
  GHOSTREGIME_BROKER_MISMATCH_REASONS,
  GHOSTREGIME_UPDATE_TIMING_LINES,
  GHOSTREGIME_STALE_BEHAVIOR_LINE,
  GHOSTREGIME_COMMODITIES_FALLBACK_NOTE,
} from '@/lib/ghostregime/content';

export const metadata: Metadata = buildMetadata({
  title: 'GhostRegime Methodology - Ghost Allocator',
  description: 'How GhostRegime works: Option B voting, VAMS scaling, regime classification, and allocation logic.',
  path: '/ghostregime/methodology',
});

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">GhostRegime Methodology</h1>
        <p className="text-sm text-zinc-300">
          How the regime classification and allocation system works. No finance bro language, just the facts.
        </p>
      </header>

      {/* Table of Contents */}
      <GlassCard className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide mb-3">
          Contents
        </h2>
        <nav className="space-y-1 text-sm">
          <a href="#overview" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            Overview
          </a>
          <a href="#option-b" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            Option B Voting
          </a>
          <a href="#vams" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            VAMS Scaling
          </a>
          <a href="#targets-scales" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            Targets vs Scales vs Actual vs Cash
          </a>
          <a href="#flip-watch" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            Flip Watch
          </a>
          <a href="#stale" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            Stale Data
          </a>
          <a href="#data-sources" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            Data Sources & Update Timing
          </a>
          <a href="#faq" className="block text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
            FAQ
          </a>
        </nav>
      </GlassCard>

      {/* Overview */}
      <div id="overview" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">Overview</h2>
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            GhostRegime is a rules-based system that classifies market conditions and adjusts portfolio exposure accordingly.
            It outputs a daily <strong className="text-zinc-200">Regime</strong> (macro backdrop: growth/inflation mix) and{' '}
            <strong className="text-zinc-200">Risk Regime</strong> (&quot;risk on&quot; or &quot;risk off&quot; translation).
          </p>
          <p>
            From these classifications, GhostRegime computes <strong className="text-zinc-200">scales</strong> (how much exposure to take today)
            and applies them to <strong className="text-zinc-200">targets</strong> (baseline weights like 60/30/10) to produce{' '}
            <strong className="text-zinc-200">actual</strong> allocations.
          </p>
          <p className="text-zinc-400 italic">
            This is a daily model. Humans usually rebalance on a cadence, not every time a number twitches.
          </p>
        </div>
        </GlassCard>
      </div>

      {/* Option B Voting */}
      <div id="option-b" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">Option B Voting</h2>
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            We look at several market signals and vote on risk and inflation directions. Each signal contributes a score,
            and the scores map to regime buckets (GOLDILOCKS, REFLATION, INFLATION, DEFLATION for inflation; RISK ON / RISK OFF for risk).
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-amber-400 hover:text-amber-300 font-medium">
              Signal inputs (nerd stuff)
            </summary>
            <div className="mt-3 pl-4 space-y-2 text-xs text-zinc-400">
              <div>
                <strong className="text-zinc-300">Risk axis signals:</strong>
                <ul className="mt-1 space-y-1 pl-4 list-disc">
                  <li>SPY trend (equity momentum)</li>
                  <li>Credit vs Treasuries (HYG/IEF ratio)</li>
                  <li>VIX stress (volatility regime)</li>
                  <li>EM vs US (EEM/SPY relative strength)</li>
                </ul>
              </div>
              <div>
                <strong className="text-zinc-300">Inflation axis signals:</strong>
                <ul className="mt-1 space-y-1 pl-4 list-disc">
                  <li>Commodities (PDBC trend)</li>
                  <li>Rates (TIP/IEF ratio)</li>
                  <li>Dollar (UUP trend)</li>
                  <li>Duration (TLT trend)</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
        </GlassCard>
      </div>

      {/* VAMS Scaling */}
      <div id="vams" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">VAMS Scaling</h2>
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            VAMS (Volatility-Adjusted Momentum Score) is a trend and volatility sanity check. It looks at whether an asset
            is trending favorably and whether volatility is manageable. The output is a <strong className="text-zinc-200">scale value</strong>:
            1.0 (full size), 0.5 (half size), or 0.0 (off).
          </p>
          <p>
            The scale multiplies the target to produce the actual allocation. If target is 60% stocks and scale is 0.5 → actual becomes 30%.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-amber-400 hover:text-amber-300 font-medium">
              Example
            </summary>
            <div className="mt-3 pl-4 text-xs text-zinc-400">
              <p>
                If target is 60% stocks and scale is 0.5 → actual becomes 30%. The remaining 30% sits as Schwab cash (unallocated)
                until you rebalance.
              </p>
            </div>
          </details>
        </div>
        </GlassCard>
      </div>

      {/* Targets vs Scales vs Actual vs Cash */}
      <div id="targets-scales" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">Targets vs Scales vs Actual vs Cash</h2>
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <div className="space-y-2">
            <p>
              <strong className="text-zinc-200">Target</strong> = baseline weights (like 60/30/10 for stocks/gold/Bitcoin).
              These are the &quot;normal&quot; allocations when everything is fine.
            </p>
            <p>
              <strong className="text-zinc-200">Scale</strong> = how much exposure to take today (1.0 = full, 0.5 = half, 0.0 = off).
              Comes from VAMS and regime conditions.
            </p>
            <p>
              <strong className="text-zinc-200">Actual</strong> = target × scale. This is what you&apos;d allocate today if rebalancing.
            </p>
            <p>
              <strong className="text-zinc-200">Cash</strong> = leftover after scaling. When something is scaled down, the difference
              sits as Schwab cash (unallocated) until your next rebalance.
            </p>
          </div>
          <p className="text-zinc-400 italic mt-3">
            Important: This cash is Schwab cash, not Voya Stable Value (cash-like). They&apos;re different things.
          </p>
        </div>
        </GlassCard>
      </div>

      {/* Flip Watch */}
      <div id="flip-watch" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">Flip Watch</h2>
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            Flip Watch prevents whipsaw and one-day head fakes. Sometimes the model sees a regime change signal, but it requires
            confirmation unless the signal is very strong. It&apos;s basically: &quot;cool story bro, show me tomorrow too.&quot;
          </p>
          <p>
            This means you might see a regime &quot;brewing&quot; or &quot;pending confirmation&quot; status before it flips.
            The model waits for persistence before committing to a new regime.
          </p>
        </div>
        </GlassCard>
      </div>

      {/* Stale Data */}
      <div id="stale" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">Stale Data</h2>
          <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
            <p>
              When you see a &quot;stale&quot; badge in the UI, it means the model is showing the last good snapshot instead of
              failing hard. This happens when market data is missing or incomplete (e.g., a holiday, data provider hiccup, or
              tie-breaker inputs unavailable).
            </p>
            <p>
              This is intentional. The model degrades gracefully rather than breaking. You&apos;ll see the last computed regime
              and scales, marked as stale, until fresh data is available.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Data Sources & Update Timing */}
      <div id="data-sources" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-zinc-50 mb-3">Data Sources & Update Timing</h2>
          <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
            {/* Data Sources */}
            <div>
              <h3 className="text-base font-medium text-zinc-200 mb-2">Data Sources</h3>
              <ul className="space-y-2 pl-4 list-disc">
                {GHOSTREGIME_DATA_SOURCES.map((source) => (
                  <li key={source.key}>
                    <strong className="text-zinc-200">{source.label}</strong>
                    {source.description}
                    {source.links && source.links.length > 0 && (
                      <>
                        {' '}
                        {source.links.map((link, idx) => (
                          <span key={idx}>
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
                            >
                              {link.label}
                            </a>
                            {idx < source.links!.length - 1 && ', '}
                          </span>
                        ))}
                        {source.key === 'vix' && ' data'}
                        {source.key === 'commodities' && GHOSTREGIME_COMMODITIES_FALLBACK_NOTE}
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-zinc-400 text-xs mt-3">
                <strong className="text-zinc-300">Important:</strong> {GHOSTREGIME_PRICE_RETURN_NOTE}
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-amber-400 hover:text-amber-300 font-medium text-xs">
                  Why my broker won&apos;t match perfectly
                </summary>
                <div className="mt-2 pl-4 space-y-1.5 text-xs text-zinc-400">
                  {GHOSTREGIME_BROKER_MISMATCH_REASONS.map((reason, idx) => (
                    <p key={idx}>• {reason}</p>
                  ))}
                </div>
              </details>
            </div>

            {/* Update Timing */}
            <div>
              <h3 className="text-base font-medium text-zinc-200 mb-2">Update Timing</h3>
              {GHOSTREGIME_UPDATE_TIMING_LINES.map((line, idx) => (
                <p key={idx} className={idx > 0 ? 'text-zinc-400 italic mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>

            {/* Stale Behavior */}
            <div>
              <p className="text-zinc-400 text-xs">{GHOSTREGIME_STALE_BEHAVIOR_LINE}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* FAQ */}
      <div id="faq" className="scroll-mt-6">
        <GlassCard className="p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-50 mb-3">FAQ</h2>
        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <div>
            <p className="font-medium text-zinc-200 mb-1">Do I need to rebalance daily?</p>
            <p className="text-zinc-400">
              No. This is a daily model, but humans usually rebalance on a cadence (monthly, quarterly, etc.), not every time
              a number twitches. Pick a cadence you&apos;ll actually stick with.
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-200 mb-1">Why is there cash?</p>
            <p className="text-zinc-400">
              When GhostRegime scales an asset down (e.g., stocks from 60% to 30%), the unused portion (30%) sits as Schwab cash
              (unallocated) until you rebalance. This is Schwab cash, not Voya Stable Value.
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-200 mb-1">Why do targets look like 60/30/10?</p>
            <p className="text-zinc-400">
              This is a post-60/40 allocation. 60% stocks for growth, 30% gold for inflation/monetary weirdness hedge, 10% Bitcoin
              as an asymmetric &quot;call option on chaos.&quot; It&apos;s diversified… but still admits we live in interesting times.
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-200 mb-1">What if I&apos;m Voya-only?</p>
            <p className="text-zinc-400">
              GhostRegime scaling applies to house presets (Schwab ETFs). If you&apos;re Voya-only, you&apos;ll use core funds
              to approximate the Ghost sleeves. In Voya, &quot;Stable Value Option&quot; is your cash-like holding.
            </p>
          </div>
          <div>
            <p className="font-medium text-zinc-200 mb-1">Is this financial advice?</p>
            <p className="text-zinc-400">
              No. This is a rules engine that classifies market conditions and suggests allocations. It&apos;s a tool, not advice.
              Use it as part of your own decision-making process.
            </p>
          </div>
        </div>
        </GlassCard>
      </div>

      {/* Footer links */}
      <div className="pt-4 flex gap-4 text-sm">
        <Link
          href="/ghostregime"
          className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          Open dashboard
        </Link>
        <Link
          href="/builder"
          className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          Back to Builder
        </Link>
      </div>
    </div>
  );
}
