/**
 * Models page content (client component for tab state)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { buildVoyaImplementation } from '@/lib/voya';
import { selectModelPortfolio } from '@/lib/portfolioEngine';
import { getStandardSchwabLineup } from '@/lib/schwabLineups';
import type { QuestionnaireAnswers, RiskLevel } from '@/lib/types';

const MODEL_TEMPLATES: { name: string; riskLevel: RiskLevel; tagline: string }[] = [
  { name: 'Conservative', riskLevel: 2, tagline: 'More stability, less drama.' },
  { name: 'Moderate', riskLevel: 3, tagline: 'Balanced growth with some ballast.' },
  { name: 'Aggressive', riskLevel: 5, tagline: 'More upside, less cushion.' },
];

function minimalAnswers(platform: 'voya_only' | 'voya_and_schwab'): QuestionnaireAnswers {
  return {
    age: 45,
    yearsToGoal: 15,
    isRetired: false,
    drawdownTolerance: 'medium',
    behaviorInCrash: 'hold',
    incomeStability: 'high',
    complexityPreference: 'moderate',
    hasPension: false,
    pensionCoverage: 'none',
    platform,
    portfolioPreset: 'standard',
    goldBtcTilt: 'none',
  };
}

function AccordionChevron() {
  return (
    <span
      className="inline-flex shrink-0 text-amber-400/80 transition-transform duration-200 group-open:rotate-180"
      aria-hidden
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

export function ModelsPageContent() {
  const [tab, setTab] = useState<'voya_only' | 'voya_schwab'>('voya_only');

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Model Portfolios</h1>
        <p className="text-sm text-zinc-300">
          Starting templates using real OKC Voya funds. Pick a platform tab to see how the mix maps.
        </p>
      </header>

      {/* Intro */}
      <GlassCard className="p-5 sm:p-6">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-50">Implementable Templates</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Use these as starting templates — same risk bands as the Builder, but not personalized to
            you. For your actual Voya vs Schwab split and targets, go through Onboarding → Builder.
            Each view shows real Voya funds and, for Voya + Schwab, suggested Schwab ETFs. Education
            and risk framing only — not financial advice.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-md bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Personalize in Builder
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

      {/* Platform tabs */}
      <div className="flex gap-1 rounded-lg border border-amber-50/15 bg-neutral-900/40 p-1">
        <button
          type="button"
          onClick={() => setTab('voya_only')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'voya_only'
              ? 'bg-amber-400/20 text-amber-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Voya Only
        </button>
        <button
          type="button"
          onClick={() => setTab('voya_schwab')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'voya_schwab'
              ? 'bg-amber-400/20 text-amber-300'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Voya + Schwab
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Templates only — numbers here don&apos;t know your income floor or sweep cadence. Builder
        personalizes the plan; GhostRegime is the weekly check after you implement.
      </p>

      {/* Tab content */}
      {tab === 'voya_only' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            These percentages are of your Voya balance.
          </p>
          {MODEL_TEMPLATES.map(({ name, riskLevel, tagline }, index) => {
            const impl = buildVoyaImplementation(minimalAnswers('voya_only'), riskLevel);
            const mix = impl.mix ?? [];
            const total = mix.reduce((s, m) => s + m.allocationPct, 0);

            return (
              <details
                key={name}
                open={index === 0}
                className="group rounded-2xl border border-amber-50/15 bg-neutral-900/60 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.85)]"
              >
                <summary className="cursor-pointer list-none p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-50">{name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{tagline}</p>
                    </div>
                    <AccordionChevron />
                  </div>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[280px] text-xs">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-2 pr-4 font-semibold text-zinc-200">
                            Fund name
                          </th>
                          <th className="text-right py-2 pr-4 font-semibold text-zinc-200">
                            Allocation %
                          </th>
                          <th className="text-left py-2 font-semibold text-zinc-200">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mix.map((item) => (
                          <tr key={item.id} className="border-b border-zinc-800">
                            <td className="py-2 pr-4 text-zinc-300">{item.name}</td>
                            <td className="py-2 pr-4 text-right text-amber-300 font-medium">
                              {item.allocationPct}%
                            </td>
                            <td className="py-2 text-zinc-400">{item.role}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-zinc-700 font-semibold">
                          <td className="py-2 pr-4 text-zinc-200">Total</td>
                          <td className="py-2 pr-4 text-right text-amber-300">{total}%</td>
                          <td className="py-2" />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {tab === 'voya_schwab' && (
        <div className="space-y-4">
          {MODEL_TEMPLATES.map(({ name, riskLevel, tagline }, index) => {
            const impl = buildVoyaImplementation(minimalAnswers('voya_and_schwab'), riskLevel);
            const voyaMix = impl.mix ?? [];
            const voyaTotal = voyaMix.reduce((s, m) => s + m.allocationPct, 0);
            const portfolio = selectModelPortfolio(riskLevel);
            const schwabLineup = getStandardSchwabLineup(
              portfolio.sleeves,
              riskLevel,
              'standard',
              'gldm',
              'fbtc',
              'none'
            );
            const schwabTotal = schwabLineup.reduce((s, i) => s + i.weight, 0);

            return (
              <details
                key={name}
                open={index === 0}
                className="group rounded-2xl border border-amber-50/15 bg-neutral-900/60 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.85)]"
              >
                <summary className="cursor-pointer list-none p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-50">{name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{tagline}</p>
                    </div>
                    <AccordionChevron />
                  </div>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 space-y-5">
                  <p className="text-xs text-zinc-400 border-l-2 border-amber-400/30 pl-3 leading-relaxed">
                    Inside-slice: each table is percent of that platform bucket (Voya portion or
                    Schwab portion), not your whole 457. Your real Voya vs Schwab split comes from
                    the Builder.
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                      Fund mix (% of Voya portion)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[280px] text-xs">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-2 pr-4 font-semibold text-zinc-200">
                              Fund name
                            </th>
                            <th className="text-right py-2 pr-4 font-semibold text-zinc-200">
                              Allocation %
                            </th>
                            <th className="text-left py-2 font-semibold text-zinc-200">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voyaMix.map((item) => (
                            <tr key={item.id} className="border-b border-zinc-800">
                              <td className="py-2 pr-4 text-zinc-300">{item.name}</td>
                              <td className="py-2 pr-4 text-right text-amber-300 font-medium">
                                {item.allocationPct}%
                              </td>
                              <td className="py-2 text-zinc-400">{item.role}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-zinc-700 font-semibold">
                            <td className="py-2 pr-4 text-zinc-200">Total</td>
                            <td className="py-2 pr-4 text-right text-amber-300">{voyaTotal}%</td>
                            <td className="py-2" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Cash / cash-equivalent: Stable Value Option in Voya (cash-like). USFR in Schwab
                    (cash-equivalent parking).
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                      Sleeve lineup (% of Schwab portion)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[280px] text-xs">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-2 pr-4 font-semibold text-zinc-200">
                              Sleeve
                            </th>
                            <th className="text-right py-2 pr-4 font-semibold text-zinc-200">
                              Weight %
                            </th>
                            <th className="text-left py-2 font-semibold text-zinc-200">
                              Suggested ETF ticker(s)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {schwabLineup.map((item) => (
                            <tr key={item.id} className="border-b border-zinc-800">
                              <td className="py-2 pr-4 text-zinc-300">{item.label}</td>
                              <td className="py-2 pr-4 text-right text-amber-300 font-medium">
                                {item.weight.toFixed(1)}%
                              </td>
                              <td className="py-2 text-zinc-400">
                                {item.etfs?.map((e) => e.ticker).join(', ') ?? '—'}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-zinc-700 font-semibold">
                            <td className="py-2 pr-4 text-zinc-200">Total</td>
                            <td className="py-2 pr-4 text-right text-amber-300">
                              {schwabTotal.toFixed(1)}%
                            </td>
                            <td className="py-2" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* Footer links */}
      <div className="pt-4 flex flex-wrap gap-x-4 gap-y-2">
        <Link
          href="/onboarding"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline"
        >
          Open Builder →
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-200 underline-offset-4 hover:underline"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}
