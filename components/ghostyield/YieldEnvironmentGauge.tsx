'use client';

import type { YieldEnvironmentInputs } from '@/lib/ghostyield/types';
import { computeYieldEnvironmentScore } from '@/lib/ghostyield/scoring';
import { GlassCard } from '@/components/GlassCard';

export function YieldEnvironmentGauge({ env }: { env: YieldEnvironmentInputs }) {
  const score = computeYieldEnvironmentScore(env);
  const label =
    score >= 70
      ? 'Conditions skew hostile for leveraged yield — wider spreads, rate headwinds, or vol matter.'
      : score >= 45
        ? 'Middle path: carry can still work, but do not assume last year’s winners repeat.'
        : 'Backdrop a bit more forgiving on paper — still no free lunch in yield land.';

  return (
    <GlassCard className="p-4 sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90 mb-2">
        Yield environment (illustrative)
      </h2>
      <div className="flex flex-wrap items-end gap-4">
        <div className="text-4xl sm:text-5xl font-semibold tabular-nums text-zinc-100">{score}</div>
        <div className="text-sm text-zinc-400 max-w-xl pb-1">
          GhostYield Environment Score (0–100). Higher reads as more caution merited for yield sleeves overall
          — not a buy/sell signal.
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{label}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Inputs are static/manual for the current v0.1 snapshot (credit stress {env.creditStress}, rate pressure{' '}
        {env.ratePressure}, vol {env.volRegime}).
      </p>
    </GlassCard>
  );
}
