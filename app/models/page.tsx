/**
 * Model Portfolios Page
 * Displays model portfolio templates that users can select
 */

import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { MODEL_TEMPLATES } from '@/lib/modelTemplates';
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

      {/* Templates Info */}
      <GlassCard className="p-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Templates</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Start with the GhostRegime 60/30/10 house template today. More templates (and full auto-mapping) are coming.
          </p>
        </div>
      </GlassCard>

      {/* Portfolio Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODEL_TEMPLATES.map((model) => (
          <GlassCard
            key={model.id}
            className={`p-5 space-y-3 ${model.status === 'coming_soon' ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-zinc-50">{model.title}</h3>
              {model.badge && model.status === 'available' && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  model.badge === 'House'
                    ? 'border-amber-400/60 bg-amber-400/20 text-amber-200'
                    : 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                }`}>
                  {model.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{model.subtitle}</p>
            {model.notes && model.notes.some(note => note.includes('Requires Schwab')) && (
              <p className="text-[11px] text-zinc-400 italic">
                Requires Schwab/BrokerageLink
              </p>
            )}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Intended For</p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{model.intendedFor}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Turnover</p>
                <p className="text-[11px] text-zinc-300 mt-0.5">{model.turnover}</p>
              </div>
              {model.usesGhostRegime && (
                <p className="text-[11px] text-amber-200 italic mt-2">
                  Uses GhostRegime to adjust exposure, not predict tops/bottoms.
                </p>
              )}
            </div>
            {model.status === 'coming_soon' ? (
              <button
                disabled
                className="mt-4 w-full rounded-md px-4 py-2 text-xs font-medium transition min-h-[44px] bg-zinc-800 text-zinc-500 cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : (
              <Link
                href={`/onboarding?template=${model.id}`}
                className="mt-4 w-full rounded-md px-4 py-2 text-xs font-medium transition min-h-[44px] bg-amber-400 text-black hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 flex items-center justify-center"
              >
                Use template
              </Link>
            )}
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
