import { GlassCard } from '@/components/GlassCard';
import { GHOSTFLOW_SCORE_BANDS } from '@/lib/ghostflow/scoring';
import type {
  GhostFlowDashboardData,
  PassivePressureInputs,
  StructuralFragilityInputs,
} from '@/lib/ghostflow/types';

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

function isPublicPassiveInput(
  key: keyof PassivePressureInputs,
  publicKeys: Array<keyof PassivePressureInputs> | undefined
): boolean {
  return publicKeys?.includes(key) ?? false;
}

function isPublicStructuralInput(
  key: keyof StructuralFragilityInputs,
  publicKeys: Array<keyof StructuralFragilityInputs> | undefined
): boolean {
  return publicKeys?.includes(key) ?? false;
}

export function GhostFlowScoreCard({ data }: { data: GhostFlowDashboardData }) {
  const {
    score,
    passivePressureInputs,
    structuralFragilityInputs,
    publicPassiveInputKeys,
    publicStructuralInputKeys,
  } = data;
  const isMixed = data.dataMix === 'mixed';
  const publicCount = data.publicSignalCount ?? 0;
  const publicPassiveCount = publicPassiveInputKeys?.length ?? 0;
  const publicStructuralCount = publicStructuralInputKeys?.length ?? 0;

  return (
    <section className="space-y-4" aria-labelledby="ghostflow-score-heading">
      <GlassCard className="p-5 sm:p-6">
        <h2 id="ghostflow-score-heading" className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
          GhostFlow Score
        </h2>
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
          Composite = 50% Passive Pressure ({score.subScores.passivePressure}) + 50% Structural Fragility (
          {score.subScores.structuralFragility}). Not a forecast. Not financial advice.
        </p>
        {isMixed && publicCount >= 5 && (
          <p className="mt-2 text-xs text-amber-300/85">
            Composite includes two public Passive Pressure sub-inputs and three public Structural Fragility sub-inputs.
            Remaining inputs are static mock proxies.
          </p>
        )}
        {isMixed && publicCount === 4 && (
          <p className="mt-2 text-xs text-amber-300/85">
            Composite includes two public Passive Pressure sub-inputs and two public Structural Fragility sub-inputs.
            Remaining inputs are static mock proxies.
          </p>
        )}
        {isMixed && publicCount === 3 && (
          <p className="mt-2 text-xs text-amber-300/85">
            Composite includes two public Passive Pressure sub-inputs and one public Structural Fragility sub-input.
            Remaining inputs are static mock proxies.
          </p>
        )}
        {isMixed && publicCount === 2 && publicPassiveCount === 2 && (
          <p className="mt-2 text-xs text-amber-300/85">
            Composite includes two public Passive Pressure sub-inputs. Remaining inputs are static mock proxies.
          </p>
        )}
        {isMixed && publicCount === 1 && (
          <p className="mt-2 text-xs text-amber-300/85">
            Composite includes one public sub-input. Remaining inputs are static mock proxies.
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
          <ul className="mt-3 space-y-1.5 text-[11px] text-zinc-500">
            {PASSIVE_LABELS.map(({ key, label }) => {
              const isPublic = isPublicPassiveInput(key, publicPassiveInputKeys);
              return (
                <li key={key} className="flex justify-between gap-2">
                  <span>
                    {label}
                    {isPublic && (
                      <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-400/90">
                        public
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-zinc-400" title={isPublic ? 'Public manual artifact 0–100' : 'Mock input 0–100'}>
                    {passivePressureInputs[key]}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[10px] text-zinc-600">
            {publicPassiveCount >= 2
              ? 'Two public sub-inputs; others are mock 0–100 proxies.'
              : publicPassiveCount === 1
                ? 'One public sub-input; others are mock 0–100 proxies.'
                : 'Input values are mock 0–100 proxies.'}
          </p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-zinc-100">Structural Fragility Score</h3>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-50">
            {score.subScores.structuralFragility}
          </p>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Tracks market-structure vulnerability — concentration, breadth, ICI index share proxy, model-zone proximity.
          </p>
          <ul className="mt-3 space-y-1.5 text-[11px] text-zinc-500">
            {STRUCTURAL_LABELS.map(({ key, label }) => {
              const isPublic = isPublicStructuralInput(key, publicStructuralInputKeys);
              return (
                <li key={key} className="flex justify-between gap-2">
                  <span>
                    {label}
                    {isPublic && (
                      <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-400/90">
                        public
                      </span>
                    )}
                  </span>
                  <span
                    className="tabular-nums text-zinc-400"
                    title={isPublic ? 'Public manual artifact 0–100' : 'Mock input 0–100'}
                  >
                    {structuralFragilityInputs[key]}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[10px] text-zinc-600">
            {publicStructuralCount >= 3
              ? 'Three public sub-inputs (ICI index share, active/index flow-tilt, index concentration); others are mock 0–100 proxies.'
              : publicStructuralCount >= 2
                ? 'Two public sub-inputs (monthly active/index flow-tilt + index concentration); others are mock 0–100 proxies.'
                : publicStructuralCount >= 1
                  ? 'One public sub-input; others are mock 0–100 proxies.'
                  : 'Input values are mock 0–100 proxies.'}
          </p>
        </GlassCard>
      </div>
    </section>
  );
}
