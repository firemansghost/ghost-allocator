import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import DrawdownRealityCheck from '@/components/learn/DrawdownRealityCheck';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'What Is Risk? - Ghost Allocator',
  description:
    'Risk is more than volatility: the gap between what you expected, what happened, and whether your plan can survive. Educational framework—not financial advice.',
  path: '/what-is-risk',
});

const TOC = [
  { id: 'not-one-thing', label: 'Not one thing' },
  { id: 'common-types', label: 'Common types' },
  { id: 'mental-model', label: 'Mental model' },
  { id: 'scares-vs-gets', label: 'Scares vs gets you' },
  { id: 'spreadsheet', label: 'Spreadsheet problem' },
  { id: 'same-market', label: 'Same market' },
  { id: 'cash-not-safe', label: 'Cash & safety' },
  { id: 'historical', label: 'Historical gut checks' },
  { id: 'how-ga-thinks', label: 'How GA thinks' },
  { id: 'use-without-abuse', label: 'Use info wisely' },
  { id: 'what-not', label: 'What GA is not' },
  { id: 'bottom-line', label: 'Bottom line' },
  { id: 'explore', label: 'Explore further' },
] as const;

export default function WhatIsRiskPage() {
  return (
    <div className="flex justify-center">
      <article className="w-full max-w-4xl space-y-8 pb-10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/learn"
            className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1 -mt-2"
          >
            ← Back to Learn
          </Link>
        </nav>

        <header>
          <GlassCard className="p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/90">Education only</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">What Is Risk?</h1>
            <p className="mt-3 text-sm sm:text-base font-medium text-zinc-200 leading-relaxed">
              The market does not wait for your emotional support spreadsheet.
            </p>
            <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
              Most people talk about risk like it&apos;s a single number on a fund fact sheet. It isn&apos;t. Risk is the
              gap between what you expected, what actually happened, and whether your plan can survive the difference.
            </p>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Every portfolio carries trade-offs. There is no risk-free option—only different flavors of &ldquo;what could
              go wrong.&rdquo;
            </p>
          </GlassCard>
        </header>

        <div className="md:flex md:gap-8 md:items-start">
          <aside className="md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto md:w-52 md:shrink-0 mb-8 md:mb-0">
            <GlassCard className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3">Jump to</h2>
              <nav aria-label="On this page">
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {TOC.map(({ id, label }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-0.5"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </GlassCard>
          </aside>

          <div className="flex-1 min-w-0 space-y-8">
            <GlassCard id="not-one-thing" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Risk is not one thing</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Volatility—how much prices bounce around—is one slice of risk. Useful on a label. Incomplete as a life
                plan.
              </p>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Real risk includes whether you can stick with the plan when it hurts, whether your income floor holds
                when markets don&apos;t, and whether a &ldquo;safe&rdquo; asset quietly bleeds purchasing power while you
                sleep. Risk is multidimensional. Treating it like a single dial is how people get surprised by the thing
                they weren&apos;t measuring.
              </p>
            </GlassCard>

            <GlassCard id="common-types" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Common types of risk</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Every sleeve you add solves one problem and introduces another. That&apos;s not failure—that&apos;s
                finance.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-zinc-300 leading-relaxed ml-4 list-disc">
                <li>
                  <strong className="text-zinc-200">Stocks:</strong> drawdown risk—large peak-to-trough losses, often
                  when you least want them.
                </li>
                <li>
                  <strong className="text-zinc-200">Cash:</strong> inflation and opportunity-cost risk—your balance
                  looks stable while purchasing power erodes and you miss compounding elsewhere.
                </li>
                <li>
                  <strong className="text-zinc-200">Bonds:</strong> interest-rate risk—when rates rise, bond prices can
                  fall; the &ldquo;safe&rdquo; diversifier can stop diversifying.
                </li>
                <li>
                  <strong className="text-zinc-200">Concentration:</strong> story risk—one narrative (one sector, one
                  employer, one country) dominates your outcome.
                </li>
                <li>
                  <strong className="text-zinc-200">Behavior:</strong> often the real killer—panic-selling, performance
                  chasing, and abandoning a plan at the worst moment.
                </li>
              </ul>
            </GlassCard>

            <GlassCard id="mental-model" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">The Ghost Allocator mental model</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                When we talk about risk here, we use four lenses—not because they&apos;re fancy, but because they map to
                decisions real humans actually make.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2" role="list">
                <li className="rounded-xl border border-amber-50/10 bg-neutral-950/40 p-4 list-none">
                  <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Odds</h3>
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                    How often does this kind of outcome show up? Base rates beat vibes.
                  </p>
                </li>
                <li className="rounded-xl border border-amber-50/10 bg-neutral-950/40 p-4 list-none">
                  <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Payoff</h3>
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                    When it goes wrong, how wrong? A small annoyance and a career-ending drawdown are not the same
                    problem.
                  </p>
                </li>
                <li className="rounded-xl border border-amber-50/10 bg-neutral-950/40 p-4 list-none">
                  <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Backpack</h3>
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                    What else are you carrying—pension, job stability, debt, family obligations, liquidity needs?
                  </p>
                </li>
                <li className="rounded-xl border border-amber-50/10 bg-neutral-950/40 p-4 list-none">
                  <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Time horizon</h3>
                  <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                    When do you need the money? A 30-year horizon and a 3-year horizon should not share the same
                    definition of &ldquo;acceptable risk.&rdquo;
                  </p>
                </li>
              </ul>
            </GlassCard>

            <GlassCard id="scares-vs-gets" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">
                The risk that scares you is not always the risk that gets you
              </h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Headline risk is vivid: a crash, a bank failure, a scary chart on the news. Slow risk is boring: inflation
                nibbling cash, fees compounding against you, concentration in one employer stock, never rebalancing
                because &ldquo;it&apos;s been working.&rdquo;
              </p>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                The market often punishes the thing you weren&apos;t watching. That&apos;s not a personality flaw—it&apos;s
                a design feature of human attention. Useful tools can widen the frame, not feed the loudest fear.
              </p>
            </GlassCard>

            <GlassCard id="spreadsheet" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">The emotional support spreadsheet problem</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Plenty of plans assume the market will cooperate with your assumptions: smooth returns, predictable
                withdrawals, no job loss, no health shock, no panic at the bottom. The spreadsheet looks great. Reality
                files no such paperwork.
              </p>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                A useful plan stress-tests the gap—what happens if returns arrive in the wrong order, if inflation
                sticks around, if you need cash when stocks are down. We&apos;re trying to be roughly right, not perfectly
                wrong.
              </p>
            </GlassCard>

            <GlassCard id="same-market" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Same market, different risk</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Two people can hold similar portfolios and face completely different risk profiles. One has a pension
                floor, stable employment, and a 20-year horizon. The other is retiring next year with no backup income
                and a mortgage. Same tickers. Different backpacks.
              </p>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Ghost Allocator does not know your full picture. It offers context—sleeve trade-offs, regime posture,
                educational framing—not a personalized verdict on whether <em>you</em> can handle a given drawdown.
              </p>
            </GlassCard>

            <GlassCard id="cash-not-safe" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Why cash is not automatically safe</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Cash feels calm because the number on the screen doesn&apos;t jump. That&apos;s comfort, not safety.
                Inflation is a slow tax. Opportunity cost is the return you didn&apos;t earn while waiting for a
                certainty that never arrives.
              </p>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                In regimes where stocks and bonds move together, the classic &ldquo;hide in cash and bonds&rdquo; playbook
                can fail in ways textbooks didn&apos;t emphasize for decades.{' '}
                <Link
                  href="/why-60-40-dead"
                  className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
                >
                  Why 60/40 might be dead
                </Link>{' '}
                walks through one version of that story.
              </p>
            </GlassCard>

            <GlassCard id="historical" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Historical gut checks</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                History doesn&apos;t repeat on command, but it can remind you what large drawdowns looked like in time
                and recovery—not just on a backtest chart.
              </p>
              <div className="mt-4 rounded-xl border border-amber-50/10 bg-neutral-950/30 p-4">
                <DrawdownRealityCheck variant="compact" />
                <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                  <span className="font-medium text-zinc-400">Sources / methodology.</span> Historical examples are
                  shown for educational context only and are not forecasts. Figures are based on long-term market history
                  and may vary depending on index, data source, and calculation method.
                </p>
              </div>
            </GlassCard>

            <GlassCard id="how-ga-thinks" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">How Ghost Allocator thinks about risk</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Ghost Allocator is built around sleeves and trade-offs: equity for growth, real assets and hedges for
                inflation and crisis regimes, liquidity for optionality—not because any sleeve is &ldquo;best,&rdquo; but
                because each carries a different failure mode.
              </p>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                <Link
                  href="/ghostregime"
                  className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
                >
                  GhostRegime
                </Link>{' '}
                adds a weekly posture check—rules-based context that may help you think through risk posture in the
                current regime. It is context for judgment, not a command to buy or sell.
              </p>
            </GlassCard>

            <GlassCard id="use-without-abuse" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">
                How to use risk information without letting it use you
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed ml-4 list-disc">
                <li>Check posture on a schedule—not every tick.</li>
                <li>Separate &ldquo;interesting data&rdquo; from &ldquo;action required today.&rdquo;</li>
                <li>Write down what would make you change course <em>before</em> the market moves.</li>
                <li>Prefer small, reversible adjustments over dramatic all-in / all-out swings.</li>
                <li>When in doubt, revisit your backpack and time horizon before you revisit your tickers.</li>
              </ul>
            </GlassCard>

            <GlassCard id="what-not" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">What Ghost Allocator is not</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed ml-4 list-disc">
                <li>Not a crystal ball—we&apos;re not calling tops or bottoms.</li>
                <li>Not financial, tax, or legal advice.</li>
                <li>Not a market-timing command system.</li>
                <li>Not a promise that rules eliminate drawdowns—they may reduce self-inflicted ones.</li>
                <li>Not a substitute for reading your plan documents and knowing your own constraints.</li>
              </ul>
            </GlassCard>

            <GlassCard id="bottom-line" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Bottom line</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                Risk is the space between expectation and outcome—and whether your plan can survive that space. Ghost
                Allocator exists to give you clearer context for those trade-offs: sleeves, posture, education. You still
                make the calls.
              </p>
            </GlassCard>

            <GlassCard id="disclaimer" className="p-4 sm:p-6 border-amber-400/25 bg-amber-400/5 scroll-mt-24">
              <p className="text-sm text-zinc-300 leading-relaxed">
                <span className="font-semibold text-amber-300">Disclaimer.</span> For education and research only. Not
                financial advice. This site doesn&apos;t know your life, your taxes, or your tolerance for pain.
              </p>
            </GlassCard>

            <GlassCard id="explore" className="p-5 sm:p-6 scroll-mt-24">
              <h2 className="text-lg font-semibold text-zinc-50">Explore further</h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed mb-4">
                Optional next reads and tools—context, not commands:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/onboarding"
                  className="rounded-xl border border-amber-50/15 bg-neutral-950/40 p-4 text-sm font-medium text-amber-400 hover:text-amber-300 hover:border-amber-400/40 transition break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Build My Portfolio →
                </Link>
                <Link
                  href="/ghostregime"
                  className="rounded-xl border border-amber-50/15 bg-neutral-950/40 p-4 text-sm font-medium text-amber-400 hover:text-amber-300 hover:border-amber-400/40 transition break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Open GhostRegime →
                </Link>
                <Link
                  href="/learn/basics"
                  className="rounded-xl border border-amber-50/15 bg-neutral-950/40 p-4 text-sm font-medium text-amber-400 hover:text-amber-300 hover:border-amber-400/40 transition break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Finance Basics →
                </Link>
                <Link
                  href="/why-60-40-dead"
                  className="rounded-xl border border-amber-50/15 bg-neutral-950/40 p-4 text-sm font-medium text-amber-400 hover:text-amber-300 hover:border-amber-400/40 transition break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Why 60/40 Might Be Dead →
                </Link>
                <Link
                  href="/learn"
                  className="rounded-xl border border-amber-50/15 bg-neutral-950/40 p-4 text-sm font-medium text-amber-400 hover:text-amber-300 hover:border-amber-400/40 transition sm:col-span-2 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Back to Learn hub →
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </article>
    </div>
  );
}
