/**
 * Model Portfolios Page
 * Read-only receipt of reference templates from lib/modelPortfolios.ts
 */

import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { MODEL_PORTFOLIOS, sumSleeves } from '@/lib/modelPortfolios';
import { sleeveDefinitions } from '@/lib/sleeves';
import { formatPercent } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import type { ModelId } from '@/lib/modelPortfolios';

const MODEL_ORDER: ModelId[] = ['r1', 'r2', 'r3', 'r4', 'r5'];

export const metadata: Metadata = buildMetadata({
  title: 'Model Portfolios - Ghost Allocator',
  description: 'Reference templates used by the Builder. Sleeve allocations for each risk band.',
  path: '/models',
});

export default function ModelsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Model Portfolios</h1>
        <p className="text-sm text-zinc-300">
          Reference templates used by the Builder. These sleeve allocations drive your personalized plan.
        </p>
      </header>

      {/* Intro */}
      <GlassCard className="p-5 sm:p-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Reference Templates</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            These are the model portfolios the Builder uses to generate your allocation. Each risk band has a
            different sleeve mix. This page is for education and risk framing — not financial advice.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Build my portfolio
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center rounded-md border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300 hover:bg-amber-400/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Learn
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* Model cards (collapsible) */}
      <div className="space-y-4">
        {MODEL_ORDER.map((modelId, index) => {
          const spec = MODEL_PORTFOLIOS[modelId];
          if (!spec) return null;

          const total = sumSleeves(spec);
          const sleeveEntries = Object.entries(spec.sleeves)
            .filter(([, w]) => typeof w === 'number' && w > 0)
            .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

          return (
            <details
              key={spec.id}
              open={index === 0}
              className="group rounded-2xl border border-amber-50/15 bg-neutral-900/60 backdrop-blur-xl"
            >
              <summary className="cursor-pointer list-none p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-50">
                    {spec.name} (Risk {spec.riskLevel})
                  </h3>
                  <span className="text-xs text-zinc-500 group-open:rotate-90 transition-transform">▶</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{spec.description}</p>
              </summary>
              <div className="px-5 pb-5 pt-0 space-y-3">
                <p className="text-[11px] text-zinc-500">
                  Applies to both Voya-only and Voya+Schwab paths; Builder maps sleeves to your plan menu.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[280px] text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-2 pr-4 font-semibold text-zinc-200">Sleeve</th>
                        <th className="text-right py-2 font-semibold text-zinc-200">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sleeveEntries.map(([sleeveId, weight]) => (
                        <tr key={sleeveId} className="border-b border-zinc-800">
                          <td className="py-2 pr-4 text-zinc-300">
                            {sleeveDefinitions[sleeveId]?.name ?? sleeveId}
                          </td>
                          <td className="py-2 text-right text-amber-300 font-medium">
                            {formatPercent(weight ?? 0)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-zinc-700 font-semibold">
                        <td className="py-2 pr-4 text-zinc-200">Total</td>
                        <td className="py-2 text-right text-amber-300">
                          {(total * 100).toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          );
        })}
      </div>

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
