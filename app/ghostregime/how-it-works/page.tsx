/**
 * GhostRegime How It Works Page
 * GrayGhost-style copy explaining what GhostRegime is and how it works
 */

import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'How GhostRegime Works - Ghost Allocator',
  description: 'A rules-based, long-only system that adjusts exposure when conditions change — without pretending we can predict the exact top or bottom.',
  path: '/ghostregime/how-it-works',
});

export default function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">How GhostRegime Works</h1>
        <p className="text-sm text-zinc-300">
          A rules-based, long-only system that adjusts exposure when conditions change — without pretending we can predict the exact top or bottom.
        </p>
      </header>

      {/* What GhostRegime Is */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What GhostRegime Is</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime is a portfolio "weather report" that helps you decide how much risk to carry right now — 
            based on what markets are actually doing, not what some guy on YouTube "feels in his bones."
          </p>
          <p>
            It's built for long-term investors who want:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>fewer faceplants during bear markets, and</li>
            <li>solid participation during bull markets</li>
          </ul>
          <p>
            …without day-trading their retirement like it's a side quest.
          </p>
          <p className="font-semibold text-amber-300 mt-3">
            Key idea: We're trying to be roughly right, not perfectly wrong.
          </p>
        </div>
      </GlassCard>

      {/* What It Is NOT */}
      <GlassCard className="p-6 border-red-400/30 bg-red-400/5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What It's Not</h2>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span><strong>Not day trading.</strong> If you're looking for 37 trades a day, you want a casino.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span><strong>Not a crystal ball.</strong> We're not calling the top. We're not calling the bottom.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span><strong>Not "sell everything because vibes."</strong> It's rules. No vibes.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span>
              <strong>Not designed to save you from every 2–5% wobble.</strong> Those happen. A lot. This is built to help reduce exposure 
              during the bigger ~20% gut-punch corrections — based on how this kind of trend system has behaved in historical testing. (No, it's not magic.)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">•</span>
            <span><strong>Not financial advice.</strong> It's an educational tool. You're still the adult in the room (sorry).</span>
          </li>
        </ul>
      </GlassCard>

      {/* The Simple Version */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">The Simple Version</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime does two jobs:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Sets the "target" risk level based on market conditions</li>
            <li>Applies a safety brake if the trend weakens or volatility spikes</li>
          </ol>
          <p className="italic">
            Think: gas pedal + brake pedal. Same car. Different road conditions.
          </p>
        </div>
      </GlassCard>

      {/* Step 1 — Top-Down Overlay */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Step 1: Top-Down Risk Overlay (Targets)</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            First, GhostRegime classifies the market into one of four regimes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>GOLDILOCKS</strong> (Risk On)</li>
            <li><strong>REFLATION</strong> (Risk On)</li>
            <li><strong>INFLATION</strong> (Risk Off)</li>
            <li><strong>DEFLATION</strong> (Risk Off)</li>
          </ul>
          <p>
            When the market is Risk On, we carry more exposure.
          </p>
          <p>
            When the market is Risk Off, we carry less exposure.
          </p>
          <div className="mt-3 p-2 rounded-md border border-amber-400/30 bg-amber-400/10">
            <p className="text-[11px] text-amber-200">
              <strong>Plain-English:</strong> Risk On = conditions support taking risk. Risk Off = conditions say "maybe don't be a hero."
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Step 2 — Bottom-Up Overlay */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Step 2: Bottom-Up Overlay (Actuals)</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            Next, GhostRegime looks at each asset's trend signal and adjusts your exposure:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Bullish</strong> → hold 100% of the target</li>
            <li><strong>Neutral</strong> → hold 50% of the target</li>
            <li><strong>Bearish</strong> → hold 0% of the target (yes, cash is a position)</li>
          </ul>
          <p>
            We call this the VAMS signal (volatility-adjusted momentum). Translation:
          </p>
          <p className="italic">
            "Is the trend still working… and is it getting dangerously choppy?"
          </p>
          <p className="font-semibold text-amber-300 mt-3">
            One-liner: When the market starts acting like a drunk raccoon, VAMS sobers the portfolio up.
          </p>
        </div>
      </GlassCard>

      {/* What You Actually Do With It */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What You Do With the Signal</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime publishes "targets vs actuals." Your job is simple:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>If exposures increase, you DCA in (calmly, like an adult)</li>
            <li>If exposures decrease, you cut risk quickly (because drawdowns don't care about your feelings)</li>
          </ul>
          <p>
            This is how you sell near the top and buy near the bottom — not perfectly, but well enough to matter.
          </p>
        </div>
      </GlassCard>

      {/* Rebalancing */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Rebalancing (There's No One Right Way)</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            Because prices move, your portfolio will drift. Rebalancing keeps you close to the published exposures.
          </p>
          <p className="font-semibold text-amber-300 mb-2">Pick one of these approaches:</p>
          <div className="space-y-3">
            <div className="p-3 rounded-md border border-amber-400/30 bg-amber-400/10">
              <h3 className="text-xs font-semibold text-amber-300 mb-1">Option A: Rebalance on signal changes (recommended)</h3>
              <p className="text-[11px] text-zinc-300">
                When GhostRegime changes exposure, you rebalance to match.
              </p>
            </div>
            <div className="p-3 rounded-md border border-amber-400/30 bg-amber-400/10">
              <h3 className="text-xs font-semibold text-amber-300 mb-1">Option B: Rebalance on a calendar</h3>
              <p className="text-[11px] text-zinc-300">
                Weekly, monthly, or quarterly. Boring, consistent, effective.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 italic mt-3">
            Taxes, time, and patience vary by person. Choose what you can actually stick to.
          </p>
          <p className="text-[11px] text-amber-300 mt-3">
            <strong>Adulting tip:</strong> Set a monthly calendar reminder to check your allocations. The market doesn't care that you were busy.
          </p>
        </div>
      </GlassCard>

      {/* Where Ghost Allocator Fits */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">How Ghost Allocator Fits In</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            Ghost Allocator helps you map these exposures to your actual 457 plan menu (Voya core funds + optional Schwab ETFs).
          </p>
          <p>
            <strong>GhostRegime</strong> tells you how much to hold.
          </p>
          <p>
            <strong>Ghost Allocator</strong> helps you decide what to hold inside the plan.
          </p>
          <p>
            Together, they turn "strategy talk" into something you can actually implement without needing an MBA or a therapist.
          </p>
        </div>
      </GlassCard>

      {/* The Promise */}
      <GlassCard className="p-6 border-amber-400/30 bg-amber-400/5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">The Promise</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime isn't trying to win every day. It's trying to win the war:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>avoid the worst of bear markets</li>
            <li>participate in most of bull markets</li>
            <li>keep turnover low enough that you don't hate your life</li>
          </ul>
          <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
            <strong className="text-zinc-300">GhostRegime is for educational purposes only and does not provide personalized investment advice.</strong> Example funds/ETFs are illustrations, not recommendations.
          </p>
          <p className="text-xs text-amber-300 italic mt-4">
            If you want perfection, buy a crystal ball. If you want a process you can actually follow, welcome aboard.
          </p>
        </div>
      </GlassCard>

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/ghostregime"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          ← Back to GhostRegime
        </Link>
      </div>
    </div>
  );
}
