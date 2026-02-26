import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import Four57InFiveMinutes from '@/components/learn/457InFiveMinutes';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: '457(b) Basics - Ghost Allocator',
  description: 'Understanding 457(b) retirement plans: contributions, withdrawals, rollovers, and common mistakes.',
  path: '/learn/457',
});

export default function Learn457Page() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        <Link
          href="/learn"
          className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-1 -mt-2"
        >
          ← Back to Learn
        </Link>
        {/* Header */}
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">457(b) Basics</h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            A plain-language guide to 457(b) retirement plans for first responders and public sector employees.
            Understand how these plans work, from contributions to withdrawals.
          </p>
        </GlassCard>

        {/* 457(b) in 5 Minutes */}
        <Four57InFiveMinutes />

        {/* What is a 457(b) */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">What is a 457(b)?</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            A 457(b) is a tax-advantaged retirement savings plan available to employees of state and local
            governments, as well as some tax-exempt organizations. Unlike 401(k) plans, 457(b) plans allow you
            to withdraw funds without penalty once you separate from service, regardless of age.
          </p>
          <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
            <p className="text-xs text-amber-300 font-semibold mb-1">Important Note</p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              There are two types of 457(b) plans: governmental and non-governmental. Governmental plans (like
              those for firefighters, police, and other public employees) are generally more flexible and have
              better protections. Non-governmental plans have different rules and may have more restrictions.
            </p>
          </div>
        </GlassCard>

        {/* Contribution basics */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Contribution Basics</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            You can contribute a portion of your salary to your 457(b) plan on a pre-tax basis. This reduces
            your taxable income for the year, which means you pay less in taxes now. The money grows tax-deferred
            until you withdraw it.
          </p>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Contribution limits are set by the IRS and can change from year to year. Many plans also offer
            catch-up contributions if you're within a few years of retirement. Check with your plan administrator
            for current limits and catch-up provisions.
          </p>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Contributions are typically made through payroll deduction, making it easy to save automatically. You
            can usually adjust your contribution percentage or amount at any time.
          </p>
        </GlassCard>

        {/* Withdrawals / separation rules */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Withdrawals & Separation Rules</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            One of the key advantages of a 457(b) plan is that you can withdraw funds without the 10% early
            withdrawal penalty once you separate from service, regardless of your age. This is different from
            401(k) plans, which typically charge penalties for withdrawals before age 59½.
          </p>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            "Separation from service" means you've left your job with the employer sponsoring the plan. This
            could be retirement, a job change, or termination. Once separated, you can take distributions
            without penalty, though you'll still owe regular income tax on the withdrawals.
          </p>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Some plans may have specific rules about when distributions can begin after separation. Check your
            plan documents for details.
          </p>
        </GlassCard>

        {/* Rollovers */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Rollovers</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            You can roll over your 457(b) funds to another eligible retirement plan, such as an IRA or another
            457(b) plan, when you separate from service. This allows you to maintain tax-deferred growth and
            gives you more control over your investment options.
          </p>
          <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
            <p className="text-xs text-amber-300 font-semibold mb-1">Caution</p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Rollover rules can be complex, and mistakes can trigger taxes and penalties. If you're considering
              a rollover, consult with a tax professional or financial advisor who understands 457(b) plans.
              Make sure you understand the tax implications and any restrictions before moving funds.
            </p>
          </div>
        </GlassCard>

        {/* Common mistakes */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Common Mistakes to Avoid</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed">
            <li>
              <span className="font-semibold text-zinc-200">Not increasing contributions over time:</span> As
              your salary grows, increase your contribution percentage to maximize tax benefits and retirement
              savings.
            </li>
            <li>
              <span className="font-semibold text-zinc-200">Panic selling during market downturns:</span> Market
              volatility is normal. Selling during downturns locks in losses and prevents recovery. Stay the
              course with a long-term strategy.
            </li>
            <li>
              <span className="font-semibold text-zinc-200">Not understanding distribution rules:</span> Know
              when you can take distributions, what taxes apply, and what options you have. Don't wait until
              retirement to learn the rules.
            </li>
            <li>
              <span className="font-semibold text-zinc-200">Ignoring investment options:</span> Review your plan
              options regularly and ensure your allocation matches your risk tolerance and time horizon.
            </li>
            <li>
              <span className="font-semibold text-zinc-200">Not taking advantage of employer matching:</span> If
              your plan offers matching contributions, contribute at least enough to get the full match—it's free
              money.
            </li>
          </ul>
        </GlassCard>

        {/* OKC Playbook callout */}
        <GlassCard className="p-5 sm:p-6 border-amber-400/30">
          <h2 className="text-lg font-semibold text-zinc-50">OKC Playbook Coming Soon</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            We're working on an OKC-specific guide that will cover the realities of the Voya menu, Schwab sweep
            mechanics, and OKC-specific workflow tips. This will help you navigate the actual implementation
            details for Oklahoma City firefighters.
          </p>
          <div className="mt-4">
            <Link
              href="/learn/457/okc"
              className="inline-flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
            >
              Learn more about the OKC Playbook →
            </Link>
          </div>
        </GlassCard>

        {/* Next step CTA */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Next step</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed mb-4">
            Now that you know the rules of the 457, pick a plan you&apos;ll actually follow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-300 transition shadow-md shadow-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px]"
            >
              Build your plan →
            </Link>
            <Link
              href="/models"
              className="inline-flex items-center rounded-md border border-zinc-600 text-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-800 hover:border-zinc-500 transition min-h-[44px]"
            >
              View templates →
            </Link>
          </div>
          <p className="mt-3">
            <Link
              href="/learn/457#in-5-minutes"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Jump to 457 in 5 minutes →
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
