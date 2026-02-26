import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Learn - Ghost Allocator',
  description: 'First responder finance basics, 457(b) education, and macro learning resources.',
  path: '/learn',
});

export default function LearnPage() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl space-y-8 pb-10">
        {/* Header */}
        <GlassCard className="p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Learn
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed">
            First responder finance basics, 457(b) retirement plan education, and macro learning resources.
            Start with the guided path below, or browse by topic.
          </p>
        </GlassCard>

        {/* Start Here section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-50">Start Here</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <GlassCard className="p-5 sm:p-6 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">1</span>
                <h3 className="text-sm font-semibold text-zinc-50">457(b) Basics</h3>
              </div>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-4">
                Understand how 457(b) retirement plans work, from contributions to withdrawals.
              </p>
              <Link
                href="/learn/457"
                className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
              >
                Learn 457 Basics →
              </Link>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">2</span>
                <h3 className="text-sm font-semibold text-zinc-50">Macro Mayhem Masterclass</h3>
              </div>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-4">
                A curated learning series breaking down the monetary system from basics to advanced topics.
              </p>
              <Link
                href="/learn/masterclass"
                className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
              >
                Start Masterclass →
              </Link>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 transition transform hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">3</span>
                <h3 className="text-sm font-semibold text-zinc-50">Build My Portfolio</h3>
              </div>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-4">
                Create a personalized post-60/40 portfolio allocation tailored to your risk level and situation.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded px-2 py-1"
              >
                Build Portfolio →
              </Link>
            </GlassCard>
          </div>
        </section>

        {/* Browse section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-50">Browse</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">457(b) Playbook</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                Everything you need to know about 457(b) retirement plans.
              </p>
              <Link
                href="/learn/457"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Read more →
              </Link>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">457 in 5 Minutes</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                The fastest, no-BS explanation of how a 457(b) works.
              </p>
              <Link
                href="/learn/457#in-5-minutes"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Read it →
              </Link>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">Finance Basics</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                Foundational finance concepts for first responders: behavior, fees, diversification, drawdowns.
              </p>
              <Link
                href="/learn/basics"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Browse basics →
              </Link>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">Glossary</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                Definitions of key terms used across GhostRegime, Builder, and Learn.
              </p>
              <Link
                href="/learn/glossary"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Browse glossary →
              </Link>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">Monitor with GhostRegime</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                Weekly portfolio &quot;weather report&quot;: targets vs actual, risk posture shifts, fewer 20% train wreck surprises.
              </p>
              <Link
                href="/ghostregime"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Open GhostRegime →
              </Link>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">Masterclass</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                Deep dives into money, banking, the Fed, and the global dollar system.
              </p>
              <Link
                href="/learn/masterclass"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Browse →
              </Link>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 transition transform hover:-translate-y-1 hover:border-amber-400/60">
              <h3 className="text-sm font-semibold text-zinc-50">Why Rules Beat Vibes</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed mb-3">
                A quick reality check on drawdowns and why systematic risk management matters. Use GhostRegime as a weekly posture check.
              </p>
              <Link
                href="/ghostregime/how-it-works"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
              >
                Learn more →
              </Link>
            </GlassCard>
          </div>
        </section>
      </div>
    </div>
  );
}
