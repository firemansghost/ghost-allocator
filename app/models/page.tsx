/**
 * Model Portfolios Page
 * Placeholder page showing coming soon model portfolios
 */

import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { MODEL_PORTFOLIOS } from '@/lib/models/modelCatalog';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Model Portfolios - Ghost Allocator',
  description: 'Curated templates that combine Ghost Allocator planning with GhostRegime signals for simple rebalance guidance.',
  path: '/models',
});

export default function ModelsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Model Portfolios</h1>
        <p className="text-sm text-zinc-300">
          Curated templates that combine Ghost Allocator planning with GhostRegime signals
        </p>
      </header>

      {/* Coming Soon Notice */}
      <GlassCard className="p-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Coming Soon</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Model portfolios are templates that automatically map GhostRegime signals to your 457 plan.
            You'll be able to pick a template, map it to your Voya core funds and optional Schwab ETFs,
            and get simple rebalance guidance based on targets vs actual exposures.
          </p>
        </div>
      </GlassCard>

      {/* Portfolio Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODEL_PORTFOLIOS.map((model) => (
          <GlassCard
            key={model.id}
            className={`p-5 space-y-3 ${model.comingSoon ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-zinc-50">{model.name}</h3>
              {model.comingSoon && (
                <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{model.description}</p>
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Intended For</p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{model.intendedUser}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Turnover</p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{model.turnoverExpectation}</p>
              </div>
              <p className="text-[11px] text-amber-200 italic mt-2">{model.oneLiner}</p>
            </div>
            <button
              disabled={model.comingSoon}
              className={`mt-4 w-full rounded-md px-4 py-2 text-xs font-medium transition min-h-[44px] ${
                model.comingSoon
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-amber-400 text-black hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
              }`}
            >
              {model.comingSoon ? 'Coming Soon' : 'Select Template'}
            </button>
          </GlassCard>
        ))}
      </div>

      {/* What You'll Be Able To Do */}
      <GlassCard className="p-6">
        <h2 className="text-sm font-semibold text-zinc-50 mb-4">What You'll Be Able To Do Soon</h2>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Pick a template that matches your risk tolerance and goals</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Map it to your Voya core funds and optional Schwab ETFs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Get "targets vs actuals" driven by GhostRegime signals</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Receive simple rebalance guidance when exposures change</span>
          </li>
        </ul>
      </GlassCard>

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

