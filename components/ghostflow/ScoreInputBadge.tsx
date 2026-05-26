import type { ScoreInputBadge } from '@/lib/ghostflow/scoreInputClassification';

function badgeClass(badge: ScoreInputBadge): string {
  switch (badge) {
    case 'PUBLIC':
      return 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300/95';
    case 'DERIVED':
      return 'border-amber-500/35 bg-amber-950/30 text-amber-200/95';
    case 'MOCK':
      return 'border-zinc-600/55 bg-zinc-900/50 text-zinc-400';
    case 'PLACEHOLDER':
      return 'border-zinc-600/50 bg-zinc-900/40 text-zinc-500';
  }
}

export function ScoreInputBadgePill({ badge }: { badge: ScoreInputBadge }) {
  return (
    <span
      className={`ml-1.5 inline-flex rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide border ${badgeClass(badge)}`}
    >
      {badge}
    </span>
  );
}
