import { GlassCard } from '@/components/GlassCard';
import { GHOSTFLOW_SCORE_BANDS } from '@/lib/ghostflow/scoring';
import {
  classifyPassiveScoreInput,
  classifyStructuralScoreInput,
  countScoreInputMixDetailed,
} from '@/lib/ghostflow/scoreInputClassification';
import type { GhostFlowDashboardData } from '@/lib/ghostflow/types';
import {
  GhostFlowTrustBadges,
  GHOSTFLOW_COVERAGE_BADGES_MIXED,
  GHOSTFLOW_COVERAGE_SUMMARY,
} from './GhostFlowTrustBadges';
import { ScoreInputBadgePill } from './ScoreInputBadge';

const PASSIVE_LABELS: { key: keyof GhostFlowDashboardData['passivePressureInputs']; label: string }[] = [
  { key: 'etfFundFlowImpulse', label: 'ETF / fund-flow impulse' },
  { key: 'systematicStrategyPressure', label: 'Systematic strategy pressure' },
  { key: 'optionsVolatilityAmplifier', label: 'Options / volatility amplifier' },
  { key: 'retirementFlowPressureProxy', label: 'Retirement-flow pressure proxy' },
  { key: 'leveredEtfRebalancePressure', label: 'Levered ETF rebalance pressure' },
];

const STRUCTURAL_LABELS: { key: keyof GhostFlowDashboardData['structuralFragilityInputs']; label: string }[] = [
  { key: 'passiveShareProxy', label: 'ICI index share proxy' },
  { key: 'activeShareOffsetProxy', label: 'Active share / offset proxy' },
  { key: 'indexConcentration', label: 'Index concentration' },
  { key: 'breadthWeakness', label: 'Breadth weakness' },
  { key: 'modelZoneProximity', label: 'Model-zone proximity' },
];

export function GhostFlowScoreCard({
  data,
  passiveShareProxySource,
}: {
  data: GhostFlowDashboardData;
  passiveShareProxySource?: 'public' | 'mock_fallback';
}) {
  const {
    score,
    passivePressureInputs,
    structuralFragilityInputs,
    publicPassiveInputKeys,
    publicStructuralInputKeys,
  } = data;
  const isMixed = data.dataMix === 'mixed';
  const { mockScoreInputCount } = countScoreInputMixDetailed(passiveShareProxySource);
  const publicPassiveCount = publicPassiveInputKeys?.length ?? 0;
  const publicStructuralCount = publicStructuralInputKeys?.length ?? 0;
  const hasDerivedModelZone = passiveShareProxySource === 'public';

  return (
    <section className="space-y-4" aria-labelledby="ghostflow-score-heading">
      <GlassCard className="p-5 sm:p-6">
        <h2 id="ghostflow-score-heading" className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
          GhostFlow Research Composite
        </h2>
        <div className="mt-2 space-y-1.5">
          {hasDerivedModelZone && (
            <p className="text-[11px] font-medium text-zinc-400 tracking-wide">{GHOSTFLOW_COVERAGE_SUMMARY}</p>
          )}
          <GhostFlowTrustBadges
            badges={hasDerivedModelZone ? GHOSTFLOW_COVERAGE_BADGES_MIXED : undefined}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="text-5xl sm:text-6xl font-semibold tabular-nums text-zinc-100">{score.score}</div>
          <div className="pb-1 space-y-1">
            <span className="inline-flex rounded-md border border-amber-500/35 bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-200">
              {score.bandLabel}
            </span>
            <p className="text-xs text-zinc-500">0–100 · higher = more flow pressure / structural fragility</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-300 leading-relaxed max-w-3xl">{score.interpretation}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Research composite = 50% Passive Pressure ({score.subScores.passivePressure}) + 50% Structural Fragility (
          {score.subScores.structuralFragility}). Not a forecast. Not financial advice.
        </p>
        {isMixed && hasDerivedModelZone && (
          <ul className="mt-3 space-y-1 text-xs text-amber-300/85 list-disc list-inside max-w-3xl">
            <li>
              <span className="text-amber-200/90">Feeds the score:</span> 6 public score artifacts + 1 derived input
              (model-zone proximity from ICI index share).
            </li>
            <li>
              <span className="text-amber-200/90">Static MOCK assumptions:</span> three Passive inputs remain static —
              systematic <strong className="font-semibold text-amber-100/95">62</strong>, retirement{' '}
              <strong className="font-semibold text-amber-100/95">58</strong>, levered ETF{' '}
              <strong className="font-semibold text-amber-100/95">55</strong> (VIX still scores options/vol at 20%).
            </li>
            <li>
              <span className="text-amber-200/90">Displayed only:</span> systematic-flow (CFTC), levered-etf-rebalance,
              retirement-asset-growth, options-activity-proxy, index-inclusion-events, cap-weight-premium,
              tail-skew-context — visible context, not composite inputs. Tail Skew (SKEW) is display-only and not a
              score input; VIX remains the score-fed vol level. Related public cards do not replace MOCK score inputs.
            </li>
          </ul>
        )}
        {isMixed && !hasDerivedModelZone && (
          <p className="mt-2 text-xs text-amber-300/85">
            {publicPassiveCount + publicStructuralCount} public sub-input
            {publicPassiveCount + publicStructuralCount === 1 ? '' : 's'} feed this composite;{' '}
            {mockScoreInputCount} static mock input{mockScoreInputCount === 1 ? '' : 's'} remain illustrative
            placeholders.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">Score bands (0–100)</p>
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 text-[11px] text-zinc-500">
            {GHOSTFLOW_SCORE_BANDS.map((b) => (
              <li key={b.label}>
                <span className="tabular-nums text-zinc-400">
                  {b.min}–{b.max}:
                </span>{' '}
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-zinc-100">Passive Pressure Score</h3>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-50">{score.subScores.passivePressure}</p>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Tracks current mechanical buying/selling pressure from flows, vol, and systematic strategies.
          </p>
          <ul className="mt-3 space-y-2 text-[11px] text-zinc-500">
            {PASSIVE_LABELS.map(({ key, label }) => {
              const meta = classifyPassiveScoreInput(key, publicPassiveInputKeys);
              const isPublic = meta.badge === 'PUBLIC';
              return (
                <li key={key} className="flex justify-between gap-2 items-start">
                  <span className="min-w-0">
                    <span className="text-zinc-400">
                      {label}
                      <ScoreInputBadgePill badge={meta.badge} />
                    </span>
                    {meta.mockFootnote && (
                      <span className="block mt-0.5 text-[10px] text-zinc-600 leading-snug">{meta.mockFootnote}</span>
                    )}
                  </span>
                  <span
                    className="tabular-nums text-zinc-400 shrink-0"
                    title={
                      isPublic
                        ? 'Public manual artifact 0–100'
                        : 'Illustrative 0–100 placeholder, not a current measured reading'
                    }
                  >
                    {passivePressureInputs[key]}
                  </span>
                </li>
              );
            })}
          </ul>
          {mockScoreInputCount > 0 && publicPassiveCount < PASSIVE_LABELS.length && (
            <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
              Static mock inputs in this pillar are not current measured readings; they are included only in the
              research composite preview.
            </p>
          )}
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-zinc-100">Structural Fragility Score</h3>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-50">
            {score.subScores.structuralFragility}
          </p>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Tracks market-structure vulnerability: concentration, breadth, ICI index share proxy, model-zone proximity.
          </p>
          <ul className="mt-3 space-y-2 text-[11px] text-zinc-500">
            {STRUCTURAL_LABELS.map(({ key, label }) => {
              const meta = classifyStructuralScoreInput(
                key,
                publicStructuralInputKeys,
                passiveShareProxySource
              );
              const isPublic = meta.badge === 'PUBLIC';
              const isDerived = meta.badge === 'DERIVED';
              return (
                <li key={key} className="flex justify-between gap-2 items-start">
                  <span className="min-w-0">
                    <span className="text-zinc-400">
                      {label}
                      <ScoreInputBadgePill badge={meta.badge} />
                    </span>
                    {meta.mockFootnote && (
                      <span className="block mt-0.5 text-[10px] text-zinc-600 leading-snug">{meta.mockFootnote}</span>
                    )}
                    {meta.derivedFootnote && (
                      <span className="block mt-0.5 text-[10px] text-zinc-600 leading-snug">{meta.derivedFootnote}</span>
                    )}
                  </span>
                  <span
                    className="tabular-nums text-zinc-400 shrink-0"
                    title={
                      isPublic
                        ? 'Public manual artifact 0–100'
                        : isDerived
                          ? 'Derived 0–100 from ICI index-share distance-to-65 mapping'
                          : 'Illustrative 0–100 placeholder, not a current measured reading'
                    }
                  >
                    {structuralFragilityInputs[key]}
                  </span>
                </li>
              );
            })}
          </ul>
          {hasDerivedModelZone ? (
            <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
              Model-zone proximity is derived from the same ICI index-share distance-to-65 mapping as the context card
              below; remaining static mock structural inputs are not current measured readings.
            </p>
          ) : (
            publicStructuralCount < STRUCTURAL_LABELS.length && (
              <p className="mt-2 text-[10px] text-zinc-600 leading-relaxed">
                Static mock structural inputs are not current measured readings; they are included only in the research
                composite preview.
              </p>
            )
          )}
        </GlassCard>
      </div>
    </section>
  );
}
