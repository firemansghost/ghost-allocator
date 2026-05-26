const TRUST_BADGE_CLASS =
  'inline-flex items-center rounded-md border border-amber-500/30 bg-amber-950/25 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/90';

export const GHOSTFLOW_COVERAGE_BADGES = [
  '6 public artifacts',
  '4 static mock inputs',
  'Research preview',
  'Not a forecast',
] as const;

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
