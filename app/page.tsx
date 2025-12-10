import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';

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
            Pension-aware portfolio templates for your 457. Works with Voya core funds and Schwab ETFs — no options chains, no jargon.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-400/40 hover:bg-amber-300 transition"
          >
            Build My Portfolio
          </Link>
          <Link
            href="/why-60-40-dead"
            className="text-sm font-medium text-zinc-300 hover:text-zinc-100 underline-offset-4 hover:underline"
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
    </div>
  );
}

