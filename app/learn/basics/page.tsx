import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Finance Basics - Ghost Allocator',
  description: 'Foundational finance concepts for first responders: behavior, fees, diversification, drawdowns, and implementation.',
  path: '/learn/basics',
});

export default function LearnBasicsPage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        <Link
          href="/learn"
          className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1 -mt-2"
        >
          ← Back to Learn
        </Link>
        {/* Hero intro */}
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Finance Basics</h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            First responder finance fundamentals in plain language. No jargon, no advice — just the concepts that
            actually matter when you're building a retirement plan.
          </p>
        </GlassCard>

        {/* TOC + modules: 2-col on desktop (sticky TOC), stack on mobile */}
        <div className="md:flex md:gap-8 md:items-start">
          <aside className="md:sticky md:top-24 md:w-52 md:shrink-0 mb-8 md:mb-0">
            <GlassCard className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3">Jump to</h2>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                <li>
                  <a href="#behavior" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                    Behavior &gt; brilliance
                  </a>
                </li>
                <li>
                  <a href="#fees" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                    Fees matter
                  </a>
                </li>
                <li>
                  <a href="#diversification" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                    Diversification + rebalancing
                  </a>
                </li>
                <li>
                  <a href="#drawdowns" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                    Drawdowns + sequence risk
                  </a>
                </li>
                <li>
                  <a href="#implementation" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                    Implementation rules
                  </a>
                </li>
              </ul>
            </GlassCard>
          </aside>

          <div className="flex-1 min-w-0 space-y-8">
        {/* Module 1: Behavior > brilliance */}
        <GlassCard id="behavior" className="p-5 sm:p-6 scroll-mt-24">
          <h2 className="text-lg font-semibold text-zinc-50">Behavior &gt; brilliance</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Consistency beats heroics. The biggest mistake most people make isn't picking the wrong fund — it's
            panic-selling when markets drop or chasing returns when they're hot.
          </p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            <strong className="text-zinc-200">Why it matters:</strong> A mediocre plan you stick with beats a
            brilliant plan you abandon.
          </p>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Do this next</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Automate contributions so you don't have to decide every paycheck.</li>
              <li>Set rules (e.g., rebalance 1–2x/year) and follow them.</li>
              <li>Limit news-driven actions — headlines are not a strategy.</li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Common mistakes</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Checking your balance daily and tweaking when you get nervous.</li>
              <li>Selling after a crash and waiting for "the right time" to get back in.</li>
            </ul>
          </div>
        </GlassCard>

        {/* Module 2: Fees matter */}
        <GlassCard id="fees" className="p-5 sm:p-6 scroll-mt-24">
          <h2 className="text-lg font-semibold text-zinc-50">Fees matter (more than people think)</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            The <Link href="/learn/glossary#expense-ratio" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">expense ratio</Link> is
            what you pay each year to own a fund. It sounds small, but over decades it adds up. Compare{' '}
            <Link href="/learn/glossary#stable-value" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">stable value</Link> and
            bond fund costs — sometimes the "safe" option is the expensive one.
          </p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            <strong className="text-zinc-200">Why it matters:</strong> Fees are guaranteed; returns are not.
          </p>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Do this next</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Know your fund fees — check your plan's fee disclosure.</li>
              <li>Avoid the highest-fee default option if you have a choice.</li>
              <li>Keep it simple: low-cost index funds usually win over fancy active ones.</li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Common mistakes</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Ignoring fees because "it's only 1%."</li>
              <li>Picking the plan's default without comparing options.</li>
            </ul>
          </div>
        </GlassCard>

        {/* Module 3: Diversification + rebalancing */}
        <GlassCard id="diversification" className="p-5 sm:p-6 scroll-mt-24">
          <h2 className="text-lg font-semibold text-zinc-50">Diversification + rebalancing</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            <Link href="/learn/glossary#diversification" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">Diversification</Link> means
            spreading your money so one bad bet doesn't sink you. It reduces single-point failure — not magic, just
            math. <Link href="/learn/glossary#rebalance" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">Rebalancing</Link> is
            selling what's up and buying what's down to bring your mix back to target. Do it on a schedule
            (1–2x/year), not when vibes change.
          </p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            <strong className="text-zinc-200">Why it matters:</strong> Keeps your risk profile from drifting into
            something you didn't sign up for.
          </p>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Do this next</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Pick a mix (stocks, bonds, etc.) that matches your horizon and stomach.</li>
              <li>Rebalance on a schedule — e.g., once or twice a year.</li>
              <li>Use the <Link href="/onboarding" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">Builder</Link> to get a baseline allocation.</li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Common mistakes</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Putting everything in one fund or one sector.</li>
              <li>Never rebalancing and letting winners run until you're 90% stocks.</li>
            </ul>
          </div>
        </GlassCard>

        {/* Module 4: Drawdowns + sequence risk */}
        <GlassCard id="drawdowns" className="p-5 sm:p-6 scroll-mt-24">
          <h2 className="text-lg font-semibold text-zinc-50">Drawdowns + sequence risk</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            The big risk isn't average return — it's large losses at the wrong time. A{' '}
            <Link href="/learn/glossary#drawdown" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">drawdown</Link> is how far your
            portfolio falls from peak. <Link href="/learn/glossary#sequence-of-returns-risk" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">Sequence of returns risk</Link> means
            that the order of gains and losses matters — a crash right when you start withdrawing can wreck a
            retirement that would have been fine with the same average return in a different order.
          </p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            <strong className="text-zinc-200">Why it matters:</strong> You can't control when markets crash, but
            you can control whether you're forced to sell.
          </p>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Do this next</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Keep an income floor (cash, short duration) so you're not forced to sell stocks in a crash.</li>
              <li>Avoid forced selling — don't over-leverage or over-spend in early retirement.</li>
              <li>Keep risk posture discipline — if you panic-sold last time, dial back equity exposure.</li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Common mistakes</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Assuming "average return" means smooth sailing every year.</li>
              <li>Retiring with no cash buffer and selling into a bear market to pay bills.</li>
            </ul>
          </div>
        </GlassCard>

        {/* Module 5: Implementation rules */}
        <GlassCard id="implementation" className="p-5 sm:p-6 scroll-mt-24">
          <h2 className="text-lg font-semibold text-zinc-50">Implementation rules (how to not overcomplicate)</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Keep a plan you can actually follow: your split (stocks/bonds/etc.), fund selection, and rebalance
            schedule. Don't add complexity until the basics are on autopilot.
          </p>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            <strong className="text-zinc-200">Why it matters:</strong> A simple plan you execute beats a perfect
            plan you never implement.
          </p>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Do this next</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>
                Read <Link href="/learn/457#in-5-minutes" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">457 in 5 minutes</Link> for
                the retirement-plan basics.
              </li>
              <li>
                Use the <Link href="/onboarding" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">Builder</Link> to get a personalized
                allocation.
              </li>
              <li>
                Check <Link href="/models" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">Models</Link> for reference templates.
              </li>
              <li>
                Check <Link href="/ghostregime" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">GhostRegime</Link> weekly to monitor risk posture (targets vs actual). Adjust new contributions first before doing big rebalances.
              </li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-200">Common mistakes</h3>
            <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed ml-4 list-disc">
              <li>Chasing the latest "best" strategy instead of sticking with one.</li>
              <li>Adding tilts, factor bets, and complexity before nailing the core.</li>
            </ul>
          </div>
        </GlassCard>

        {/* Next step CTA */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Next step</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed mb-4">
            You've got the basics. Now pick a plan you can actually follow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
            >
              Build your plan →
            </Link>
            <Link
              href="/models"
              className="inline-flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
            >
              View templates →
            </Link>
          </div>
          <p className="mt-3">
            <Link
              href="/learn/457#in-5-minutes"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              457 in 5 minutes →
            </Link>
          </p>
        </GlassCard>

          </div>
        </div>

        {/* Closing */}
        <p className="text-[10px] text-zinc-500 italic text-center">
          Education, not advice. You're still the adult in the room.
        </p>
      </div>
    </div>
  );
}
