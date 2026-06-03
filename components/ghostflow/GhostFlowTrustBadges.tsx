const TRUST_BADGE_CLASS =
  'inline-flex items-center rounded-md border border-amber-500/30 bg-amber-950/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90';

/** Single-line coverage summary for the GhostFlow preview (v0.9f). */
export const GHOSTFLOW_COVERAGE_SUMMARY =
  '6 public score artifacts · 1 derived score input · 3 display-only public artifacts · 3 static mock score inputs' as const;

export const GHOSTFLOW_COVERAGE_BADGES_MIXED = [
  '6 public score artifacts',
  '1 derived score input',
  '3 display-only public artifacts',
  '3 static mock score inputs',
  'Research preview',
  'Not a forecast',
] as const;

/** @deprecated Use GHOSTFLOW_COVERAGE_BADGES_MIXED when ICI passive-share artifact is present. */
export const GHOSTFLOW_COVERAGE_BADGES = GHOSTFLOW_COVERAGE_BADGES_MIXED;

export function GhostFlowTrustBadges({ badges = GHOSTFLOW_COVERAGE_BADGES }: { badges?: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span key={badge} className={TRUST_BADGE_CLASS}>
          {badge}
        </span>
      ))}
    </div>
  );
}
