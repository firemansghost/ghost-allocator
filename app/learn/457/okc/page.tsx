import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'OKC 457(b) Playbook - Ghost Allocator',
  description: 'A practical implementation guide for Oklahoma City first responders. Template structure with plan-doc details pending.',
  path: '/learn/457/okc',
});

export default function Learn457OKCPage() {
  const lastUpdated = '2025-01-21';

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            OKC 457(b) Playbook
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            A practical implementation guide for Oklahoma City first responders.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-400">
            <span>Status: Template (plan-doc details pending)</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
        </GlassCard>

        {/* Quick Start (TL;DR) */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Quick Start (TL;DR)</h2>
          <ol className="mt-3 space-y-2 text-sm text-zinc-300 leading-relaxed list-decimal list-inside">
            <li>
              <Link href="/models" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                Pick a template (Conservative / Moderate / Aggressive) →
              </Link>
            </li>
            <li>
              Set your Voya contribution allocation to match the target mix (what you can implement today).
            </li>
            <li>
              If using Schwab/BrokerageLink, choose a sweep cadence you&apos;ll stick with (monthly/quarterly).
            </li>
            <li>
              Rebalance on a schedule (1–2x/year), not on vibes.
            </li>
            <li>
              Check <Link href="/ghostregime" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">GhostRegime</Link> weekly as a posture check (targets vs actual).
            </li>
            <li>
              Keep it simple until the basics are automatic.
            </li>
          </ol>
        </GlassCard>

        {/* What we still need from plan docs */}
        <GlassCard className="p-5 sm:p-6 border-amber-400/30">
          <h2 className="text-lg font-semibold text-zinc-50">What we still need from the OKC plan docs</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Once we confirm these, we&apos;ll publish OKC-specific steps.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            <li>Fund lineup + fees (Voya core menu)</li>
            <li>Stable value rules (restrictions, transfers)</li>
            <li>BrokerageLink rules (sweep timing, minimums, restrictions)</li>
            <li>Distribution rules (separation, withdrawals, penalties/conditions)</li>
          </ul>
          <p className="mt-3">
            <Link
              href="/learn/457/docs-checklist"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
            >
              Use the Plan Docs Checklist to collect these →
            </Link>
          </p>
        </GlassCard>

        {/* Voya Menu Reality */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Voya Menu Reality</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Map your target roles (core equity, bonds, stable value, real assets) to the available Voya funds.
            See <Link href="/learn/glossary#inside-slice-allocation" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">inside-slice allocation</Link> in the glossary and{' '}
            <Link href="/learn/457" className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">457 basics</Link> for context.
          </p>
          <div className="mt-4 p-3 rounded-lg border border-zinc-700 bg-zinc-900/40">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Placeholder — verify in plan docs</p>
            <p className="text-sm text-zinc-400">OKC Voya fund lineup: [pending]</p>
            <p className="text-sm text-zinc-400 mt-1">Fee notes: [pending]</p>
          </div>
        </GlassCard>

        {/* Schwab Sweep Reality */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Schwab Sweep Reality</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
            Generic workflow: contributions land in Voya first; you periodically sweep to your Schwab slice and
            implement the ETF sleeve there.
          </p>
          <div className="mt-4 p-3 rounded-lg border border-zinc-700 bg-zinc-900/40">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Placeholder — verify in plan docs</p>
            <p className="text-sm text-zinc-400">Exact sweep timing/minimums: [pending plan docs]</p>
          </div>
          <p className="mt-3 text-xs text-amber-300">
            BrokerageLink rules vary by plan — verify before moving money.
          </p>
        </GlassCard>

        {/* Cadence + Discipline */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Cadence + Discipline</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            <li>Adjust new contributions first before big rebalance moves</li>
            <li>Rebalance 1–2x/year on a schedule</li>
            <li>Check GhostRegime weekly as a posture check</li>
            <li>Avoid constant tinkering</li>
          </ul>
        </GlassCard>

        {/* Common Mistakes */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Common Mistakes</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-300 leading-relaxed list-disc list-inside">
            <li>Never checking fees</li>
            <li>Defaulting into random options</li>
            <li>Overcomplicating BrokerageLink before the basics</li>
            <li>Panic selling after a drawdown</li>
            <li>Never rebalancing</li>
          </ul>
        </GlassCard>

        {/* Next step CTA */}
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-50">Next step</h2>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed mb-4">
            Until the OKC-specific details are filled in, use the templates + Builder and keep it simple.
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
              href="/learn"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-300 underline-offset-4 hover:underline"
            >
              Back to Learn →
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
