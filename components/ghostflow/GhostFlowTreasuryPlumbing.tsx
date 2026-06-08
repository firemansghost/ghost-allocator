import { GlassCard } from '@/components/GlassCard';
import type {
  TreasuryPlumbingDisplayCard,
  TreasuryPlumbingDisplayData,
} from '@/lib/ghostflow/treasuryPlumbingDisplay';

function dataQualityLabel(q: string | undefined): string {
  switch (q) {
    case 'verified_manual':
      return 'Verified manual';
    case 'manual_unverified':
      return 'Manual (unverified)';
    case 'mock_fallback':
      return 'Mock fallback';
    default:
      return '—';
  }
}

function displayOnlyBadgeClass(): string {
  return 'border-amber-500/30 bg-amber-950/25 text-amber-200/90';
}

function TreasuryPlumbingCard({ card }: { card: TreasuryPlumbingDisplayCard }) {
  const unavailable = card.status === 'unavailable';

  return (
    <GlassCard
      className={`p-4 flex flex-col min-w-0 ${unavailable ? 'border-zinc-800/60 bg-neutral-950/25 opacity-95' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          className={`text-sm font-semibold leading-snug ${unavailable ? 'text-zinc-400' : 'text-zinc-100'}`}
        >
          {card.title}
        </h3>
        <span
          className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${displayOnlyBadgeClass()}`}
        >
          {card.badge}
        </span>
      </div>

      {unavailable ? (
        <>
          <p className="mt-2 text-base sm:text-lg font-medium text-zinc-500">Artifact unavailable</p>
          <p className="mt-2 text-xs text-zinc-500 leading-relaxed flex-1">
            {card.explanation}
            {card.validationErrors && card.validationErrors.length > 0 && (
              <span className="block mt-1 text-zinc-600">
                {card.validationErrors.slice(0, 2).join('; ')}
              </span>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-base sm:text-lg font-medium tabular-nums break-words leading-snug text-zinc-50">
            {card.primaryValue}
          </p>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed flex-1">{card.explanation}</p>
        </>
      )}

      <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed border-l-2 border-amber-500/30 pl-2">
        {card.caveat}
      </p>

      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
          <span>{card.statusLabel}</span>
        </div>

        {!unavailable && card.detailRows.length > 0 && (
          <dl className="grid gap-1 text-[10px] text-zinc-500">
            {card.detailRows.map((row) => (
              <div key={row.label} className="flex flex-wrap gap-x-1.5">
                <dt className="text-zinc-600">{row.label}:</dt>
                <dd className="text-zinc-400 tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {!unavailable && card.asOf && (
          <p className="text-[10px] text-zinc-500">
            As of {card.asOf}
            {card.publishedAt ? ` · Published ${card.publishedAt}` : ''}
            {card.dataQuality ? ` · ${dataQualityLabel(card.dataQuality)}` : ''}
          </p>
        )}

        {!unavailable && card.sourceName && (
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Source:{' '}
            {card.sourceUrl ? (
              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
              >
                {card.sourceName}
              </a>
            ) : (
              card.sourceName
            )}
          </p>
        )}
      </div>
    </GlassCard>
  );
}

export function GhostFlowTreasuryPlumbing({ data }: { data: TreasuryPlumbingDisplayData }) {
  return (
    <section className="space-y-4" aria-labelledby="ghostflow-treasury-plumbing-heading">
      <div>
        <h2
          id="ghostflow-treasury-plumbing-heading"
          className="text-sm font-semibold uppercase tracking-wide text-zinc-400"
        >
          {data.sectionTitle}
        </h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">{data.sectionSubtitle}</p>
        <p className="mt-2 text-xs text-zinc-500 leading-relaxed max-w-3xl">{data.sectionIntro}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.microCaveats.map((caveat) => (
            <span
              key={caveat}
              className="inline-flex items-center rounded-md border border-zinc-700/60 bg-zinc-900/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
            >
              {caveat}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {data.cards.map((card) => (
          <TreasuryPlumbingCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
