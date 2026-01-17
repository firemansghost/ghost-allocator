import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Ghost Allocator - Build a Modern Portfolio for a Post-60/40 World',
  description: 'Pension-aware portfolio templates for your 457. Works with Voya core funds and Schwab ETFs — no options chains, no jargon.',
  path: '/',
});

export default function HomePage() {
  return (
    <div className="relative space-y-16">
      <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 flex justify-center">
        <div className="h-64 w-[28rem] rounded-full bg-amber-400/25 blur-3xl opacity-80" />
      </div>
      <section className="flex flex-col items-center text-center pt-8 sm:pt-12 pb-4">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
            Build a modern portfolio for a post-60/40 world.
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Pension-aware portfolio templates for your 457. Works with Voya core funds and Schwab ETFs — 
            no options chains, no jargon. We're trying to be roughly right, not perfectly wrong.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-400/40 hover:bg-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 min-h-[44px] flex items-center"
          >
            Build My Portfolio
          </Link>
          <Link
            href="/learn/457"
            className="text-sm font-medium text-zinc-300 hover:text-zinc-100 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px] flex items-center"
          >
            Learn 457 Basics
          </Link>
          <Link
            href="/why-60-40-dead"
            className="text-sm font-medium text-zinc-300 hover:text-zinc-100 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1 min-h-[44px] flex items-center"
          >
            Why 60/40 Might Be Dead
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">Step 1</p>
            <h3 className="mt-2 text-sm font-semibold text-zinc-50">Answer a few questions</h3>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Tell us about your situation, risk tolerance, and whether you have a pension or other income floor.
            </p>
          </GlassCard>
          <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">Step 2</p>
            <h3 className="mt-2 text-sm font-semibold text-zinc-50">Get your allocation</h3>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Ghost Allocator designs a post-60/40 Ghost sleeve allocation tailored to your risk band and regime.
            </p>
          </GlassCard>
          <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">Step 3</p>
            <h3 className="mt-2 text-sm font-semibold text-zinc-50">See example funds</h3>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Review sleeves and example funds/ETFs mapped to your plan. No options chains required.
            </p>
          </GlassCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-center text-lg font-semibold tracking-tight">
          Tools
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <h3 className="text-sm font-semibold text-zinc-50">Ghost Allocator</h3>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Build a plan-aware allocation using your 457 options. Works with Voya core funds and Schwab ETFs.
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
            >
              Build My Portfolio →
            </Link>
          </GlassCard>
          <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <h3 className="text-sm font-semibold text-zinc-50">GhostRegime</h3>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Daily regime classification and rules-based exposure overlay. Shows targets vs actuals based on market conditions.
            </p>
            <Link
              href="/ghostregime"
              className="mt-4 inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
            >
              Open GhostRegime →
            </Link>
          </GlassCard>
          <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-zinc-50">Model Portfolios</h3>
              <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                Coming Soon
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
              Curated templates that combine Ghost Allocator planning with GhostRegime signals for simple rebalance guidance.
            </p>
            <Link
              href="/models"
              className="mt-4 inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
            >
              View Models →
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Not a Crystal Ball Callout */}
      <GlassCard className="p-6 border-amber-400/30 bg-amber-400/5">
        <p className="text-sm text-zinc-200 leading-relaxed">
          <span className="font-semibold text-amber-300">Not a crystal ball.</span>{' '}
          We're not trying to nail the exact top or bottom. Also: this isn't designed to save you from every little 2–5% market faceplant. 
          It's built for the bigger stuff — the 20% corrections — and to help you catch most of the bull market with rules-based trend signals.
        </p>
      </GlassCard>
    </div>
  );
}

