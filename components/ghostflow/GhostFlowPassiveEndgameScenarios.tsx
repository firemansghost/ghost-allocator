import { GlassCard } from '@/components/GlassCard';
import {
  ENDGAME_BAND_LADDER,
  PASSIVE_ADOPTION_IMPACT_NOTE,
  PASSIVE_ENDGAME_SCENARIOS,
  SCENARIO_GLOBAL_CAVEAT,
  TEASER_INTRO,
  type EndgameBandId,
  type RelatedIndicatorRef,
} from './passiveEndgameScenarioContent';

const TEASER_BADGES = ['Educational', 'Not scored', 'Not financial advice'] as const;

const BAND_CHIP_CLASS: Record<EndgameBandId, string> = {
  normal: 'border-zinc-600/60 bg-zinc-800/40 text-zinc-300',
  watch: 'border-amber-600/40 bg-amber-950/25 text-amber-200/90',
  stress_zone: 'border-orange-600/40 bg-orange-950/20 text-orange-200/90',
  fragility_zone: 'border-red-900/50 bg-red-950/25 text-red-200/90',
  intervention_reset: 'border-violet-700/40 bg-violet-950/25 text-violet-200/90',
};

function BandLadder({ compact }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'flex flex-wrap gap-1.5'
          : 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
      }
      role="list"
      aria-label="Passive endgame band ladder"
    >
      {ENDGAME_BAND_LADDER.map((band) => (
        <div
          key={band.id}
          role="listitem"
          className={`rounded-lg border px-2.5 py-1.5 ${BAND_CHIP_CLASS[band.id]} ${
            compact ? 'text-[10px] font-medium uppercase tracking-wide' : 'text-xs'
          }`}
        >
          <span className={compact ? '' : 'font-semibold text-zinc-100 block mb-0.5'}>
            {band.label}
          </span>
          {!compact && (
            <span className="text-zinc-500 leading-snug block mt-1">{band.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function RelatedIndicatorsList({ items }: { items: RelatedIndicatorRef[] }) {
  return (
    <ul className="mt-2 space-y-1 text-xs text-zinc-500 list-disc list-inside">
      {items.map((item) => (
        <li key={`${item.kind}-${item.label}`}>
          <span className="text-zinc-400">{item.label}</span>
          {item.kind === 'unavailable' && (
            <span className="text-zinc-600"> — {item.note}</span>
          )}
          {item.kind === 'signal' && (
            <span className="text-zinc-600 font-mono text-[10px]"> ({item.signalId})</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ScenarioCard({
  scenario,
}: {
  scenario: (typeof PASSIVE_ENDGAME_SCENARIOS)[number];
}) {
  const bandLabels = scenario.bandIds
    .map((id) => ENDGAME_BAND_LADDER.find((b) => b.id === id)?.label)
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="rounded-xl border border-zinc-800/80 bg-neutral-950/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-zinc-100">{scenario.title}</h4>
        {bandLabels && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {bandLabels}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{scenario.summary}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-zinc-400 leading-relaxed list-disc list-inside">
        {scenario.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Related GhostFlow indicators
      </p>
      <RelatedIndicatorsList items={scenario.relatedIndicators} />
      <p className="mt-3 text-xs text-zinc-600 border-l-2 border-zinc-700 pl-3 leading-relaxed">
        {scenario.caveat}
      </p>
    </article>
  );
}

export function GhostFlowPassiveEndgameScenarios({
  variant,
}: {
  variant: 'teaser' | 'full';
}) {
  if (variant === 'teaser') {
    return (
      <GlassCard className="p-4 sm:p-5 border-zinc-700/50 bg-neutral-950/40">
        <div className="flex flex-wrap gap-2 mb-3">
          {TEASER_BADGES.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-md border border-zinc-600/50 bg-zinc-900/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
            >
              {badge}
            </span>
          ))}
        </div>
        <h2 className="text-sm font-semibold text-zinc-100">Passive endgame scenarios</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Possible pathways, not predictions</p>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-4xl">{TEASER_INTRO}</p>
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Band ladder (illustrative)
          </p>
          <BandLadder compact />
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          <a
            href="#ghostflow-endgame-scenarios"
            className="text-amber-400/90 hover:text-amber-300 underline underline-offset-2"
          >
            Read all six scenarios in methodology
          </a>
          {' '}
          — educational only; not part of the Research Composite.
        </p>
      </GlassCard>
    );
  }

  return (
    <section
      id="ghostflow-endgame-scenarios"
      className="scroll-mt-8 space-y-4"
      aria-labelledby="ghostflow-endgame-scenarios-heading"
    >
      <div>
        <h3
          id="ghostflow-endgame-scenarios-heading"
          className="text-base font-semibold text-zinc-100"
        >
          Passive endgame scenarios (educational)
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Possible pathways, not predictions · v1.6b</p>
      </div>

      <GlassCard className="p-4 sm:p-6 border-zinc-800/80">
        <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
          <p>
            These six scenarios help interpret how passive-share pressure might evolve as the ICI
            index-share proxy moves toward <strong className="text-zinc-300">model-stress zones</strong>{' '}
            (often discussed around <strong className="text-zinc-300">60–65%</strong>, depending on
            definition). They are <strong className="text-zinc-300">not sequential</strong>, not scored,
            and not a forecast engine.
          </p>
          <p>
            GhostFlow is a <strong className="text-zinc-300">pressure gauge</strong>, not a countdown
            clock. No investment advice. {SCENARIO_GLOBAL_CAVEAT}
          </p>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-6 border-amber-500/15">
        <h4 className="text-sm font-semibold text-zinc-200">{PASSIVE_ADOPTION_IMPACT_NOTE.title}</h4>
        <div className="mt-2 space-y-2 text-sm text-zinc-400 leading-relaxed">
          {PASSIVE_ADOPTION_IMPACT_NOTE.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </GlassCard>

      <div>
        <h4 className="text-sm font-semibold text-zinc-300 mb-2">Band ladder (illustrative)</h4>
        <p className="text-xs text-zinc-500 mb-3 max-w-3xl">
          Maps loosely to scenario narratives — not GhostFlow composite bands or score thresholds.
        </p>
        <BandLadder />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-zinc-300">Six scenarios</h4>
        {PASSIVE_ENDGAME_SCENARIOS.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>
    </section>
  );
}
