/**
 * GhostRegime How It Works Page
 * GrayGhost-style copy explaining what GhostRegime is and how it works
 */

import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import DrawdownRealityCheck from '@/components/learn/DrawdownRealityCheck';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { GHOSTREGIME_SEO_DESCRIPTION } from '@/lib/ghostregime/productPositioning';

export const metadata: Metadata = buildMetadata({
  title: 'How GhostRegime Works - Ghost Allocator',
  description: GHOSTREGIME_SEO_DESCRIPTION,
  path: '/ghostregime/how-it-works',
});

export default function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">How GhostRegime Works</h1>
        <p className="text-sm text-zinc-300">
          KISS-style regime targets, proxy-VAMS sleeve scaling, long-only—without pretending we can predict the exact top or bottom.
        </p>
      </header>

      {/* Why a rules-based process exists */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Why a rules-based process exists</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            A rules-based process makes changes explicit and repeatable instead of relying on headlines or gut feel. GhostRegime uses published regime and sleeve-brake rules so the same inputs lead to the same model response. No crystal ball. No &quot;I feel it in my bones.&quot;
          </p>
          <DrawdownRealityCheck variant="full" />
        </div>
      </GlassCard>

      {/* What GhostRegime Is */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">What GhostRegime Is</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime is a portfolio &quot;weather report&quot; that shows how much risk the model is carrying from published rules —
            based on what markets are actually doing, not what some guy on YouTube &quot;feels in his bones.&quot;
            Targets follow a KISS-style regime map; the Brake uses our own proxy-VAMS signals (SPY, GLD, BTC-USD)—not copied daily sleeve labels from elsewhere.
          </p>
          <p>
            It's built for long-term investors who want:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>a repeatable way to vary exposure as conditions change, and</li>
            <li>clear rules for when the model scales sleeves up or down</li>
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
              <strong>Not designed to react to every 2–5% wobble.</strong> Those happen. A lot. Exposure changes only when the published regime or sleeve-brake rules change. (No, it&apos;s not magic.)
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
            <li>Sets <strong>Before the brake</strong> (what the regime would allow) based on market conditions</li>
            <li>Applies the <strong>brake</strong> if the trend weakens or volatility spikes</li>
          </ol>
          <p className="italic">
            Think: gas pedal + brake pedal. Same car. Different road conditions.
          </p>
        </div>
      </GlassCard>

      {/* Step 1 — Max targets / Before the brake */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Step 1: Max targets and Before the brake</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            <strong>Max targets</strong> are the full-risk baseline by regime (often 60/30/10 in calm regimes; INFLATION and others shift—see Methodology). First, GhostRegime classifies the market into one of four regimes:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>GOLDILOCKS</strong> (Risk On)</li>
            <li><strong>REFLATION</strong> (Risk On)</li>
            <li><strong>INFLATION</strong> (Risk Off)</li>
            <li><strong>DEFLATION</strong> (Risk Off)</li>
          </ul>
          <p>
            When the market is Risk On, we carry more exposure. When it&apos;s Risk Off, we carry less.
          </p>
          <p>
            <strong>Before the brake</strong> is what the regime would allow before any safety cuts — the starting point.
          </p>
          <div className="mt-3 p-2 rounded-md border border-amber-400/30 bg-amber-400/10">
            <p className="text-[11px] text-amber-200">
              <strong>Plain-English:</strong> Risk On = conditions support taking risk. Risk Off = conditions say &quot;maybe don&apos;t be a hero.&quot;
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Step 2 — Brake / Model mix */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Step 2: Brake (VAMS) and Model mix</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            Next, the <strong>brake</strong> (proxy-VAMS — volatility-adjusted momentum on SPY, GLD, BTC-USD) looks at each sleeve&apos;s trend signal and can cut exposure:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Bullish</strong> → 100% of the sleeve starting point</li>
            <li><strong>Neutral</strong> → 50% of the sleeve starting point</li>
            <li><strong>Bearish</strong> → 0% of the sleeve starting point (yes, cash is a position)</li>
          </ul>
          <p>
            <strong>Model mix</strong> is the model&apos;s published mix after the brake is applied.
          </p>
          <p className="italic">
            &quot;Is the trend still working… and is it getting dangerously choppy?&quot;
          </p>
          <p className="font-semibold text-amber-300 mt-3">
            One-liner: When the market starts acting like a drunk raccoon, the brake sobers the portfolio up.
          </p>
        </div>
      </GlassCard>

      {/* How to use the model mix */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">How to use the model mix</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime publishes a <strong>Model mix</strong> (the after-brake allocation) and <strong>Cash in model mix</strong> (base cash plus anything the brake kicked out).
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Compare that published mix with your own plan and constraints</li>
            <li>Account rules, taxes, time horizon, and risk tolerance still decide whether anything changes</li>
          </ul>
          <p>
            The rules scale exposure down when the published trend rules weaken and restore it when they recover.
          </p>
        </div>
      </GlassCard>

      {/* Rebalancing */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Rebalancing (There's No One Right Way)</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            Because prices move, a live portfolio can drift away from any published mix. There is no required rebalance schedule.
          </p>
          <p className="font-semibold text-amber-300 mb-2">If someone chooses to use the model, two common examples are:</p>
          <div className="space-y-3">
            <div className="p-3 rounded-md border border-amber-400/30 bg-amber-400/10">
              <h3 className="text-xs font-semibold text-amber-300 mb-1">Example A: Compare on model changes</h3>
              <p className="text-[11px] text-zinc-300">
                A model change gives you a new published mix to compare with your existing plan.
              </p>
            </div>
            <div className="p-3 rounded-md border border-amber-400/30 bg-amber-400/10">
              <h3 className="text-xs font-semibold text-amber-300 mb-1">Example B: Compare on an existing review schedule</h3>
              <p className="text-[11px] text-zinc-300">
                Some people review allocations on a regular calendar. GhostRegime itself does not require or recommend a specific schedule.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 italic mt-3">
            Taxes, account rules, time, and implementation constraints vary.
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
            <strong>GhostRegime</strong> publishes the model mix.
          </p>
          <p>
            <strong>Ghost Allocator</strong> maps the published exposures into the supported plan / ETF lineup.
          </p>
          <p>
            Together, they turn "strategy talk" into something you can actually implement without needing an MBA or a therapist.
          </p>
        </div>
      </GlassCard>

      {/* Design intent */}
      <GlassCard className="p-6 border-amber-400/30 bg-amber-400/5">
        <h2 className="text-sm font-semibold text-zinc-50 mb-3">Design intent</h2>
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            GhostRegime publishes a mix from regime rules and sleeve brakes. The design intent is simple:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>scale exposure down when the published rules turn defensive</li>
            <li>scale it back up when they improve</li>
            <li>change exposure only when those published rules change</li>
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
