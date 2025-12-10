import type {
  CurrentVoyaHolding,
  VoyaImplementation,
  VoyaDeltaPlan,
  VoyaFundDelta,
} from './types';

const DELTA_EPS = 1; // 1 percentage point tolerance

export function computeVoyaDeltaPlan(
  implementation: VoyaImplementation,
  currentHoldings?: CurrentVoyaHolding[] | null
): VoyaDeltaPlan {
  if (!currentHoldings || currentHoldings.length === 0) {
    return {
      hasData: false,
      totalCurrentPct: 0,
      deltas: [],
      overweight: [],
      underweight: [],
    };
  }

  // Only do detailed math for core-mix style.
  if (implementation.style !== 'core_mix' || !implementation.mix) {
    const totalCurrentPct = currentHoldings.reduce(
      (sum, h) => sum + (h.allocationPct || 0),
      0
    );
    return {
      hasData: true,
      totalCurrentPct,
      deltas: [],
      overweight: [],
      underweight: [],
    };
  }

  const mix = implementation.mix;

  // Map target mix by id for quick lookups
  const targetById = new Map<
    string,
    { name: string; role?: string; allocationPct: number }
  >();
  mix.forEach((item) => {
    targetById.set(item.id, {
      name: item.name,
      role: item.role,
      allocationPct: item.allocationPct,
    });
  });

  // Map current holdings by id
  const currentById = new Map<string, { name: string; allocationPct: number }>();
  currentHoldings.forEach((holding) => {
    if (holding.fundId && holding.fundId !== 'other') {
      currentById.set(holding.fundId, {
        name: holding.fundName,
        allocationPct: holding.allocationPct ?? 0,
      });
    }
  });

  // Union of ids
  const allIds = new Set<string>([
    ...Array.from(targetById.keys()),
    ...Array.from(currentById.keys()),
  ]);

  const deltas: VoyaFundDelta[] = [];
  let totalCurrentPct = 0;

  allIds.forEach((id) => {
    const target = targetById.get(id);
    const current = currentById.get(id);

    const targetPct = target?.allocationPct ?? 0;
    const currentPct = current?.allocationPct ?? 0;
    const deltaPct = targetPct - currentPct;

    totalCurrentPct += currentPct;

    deltas.push({
      id,
      name: (current?.name ?? target?.name) ?? id,
      role: target?.role,
      currentPct,
      targetPct,
      deltaPct,
    });
  });

  const overweight = deltas.filter((d) => d.deltaPct < -DELTA_EPS);
  const underweight = deltas.filter((d) => d.deltaPct > DELTA_EPS);

  return {
    hasData: true,
    totalCurrentPct,
    deltas,
    overweight,
    underweight,
  };
}

/**
 * Generates a firefighter-friendly summary sentence from a VoyaDeltaPlan
 */
export function getVoyaDeltaSummary(plan: VoyaDeltaPlan): string | null {
  if (!plan.hasData || !plan.overweight.length || !plan.underweight.length) {
    return null;
  }

  const over = plan.overweight;
  const under = plan.underweight;

  // Simple firefighter-friendly case: one overweight, up to 3 underweights
  if (over.length === 1 && under.length <= 3) {
    const src = over[0];
    const movePct = Math.round(Math.abs(src.deltaPct));
    const parts: string[] = under.map((dst, idx) => {
      const pct = Math.round(dst.deltaPct);
      const label = `${pct}% to ${dst.name}`;
      if (idx === under.length - 1 && idx > 0) {
        return `and ${label}`;
      }
      return label;
    });

    return `Move about ${movePct}% out of ${src.name}, and split it into ${parts.join(', ')}.`;
  }

  // Fallback: multiple overweights / many underweights
  const totalMove = Math.round(
    over.reduce((sum, f) => sum + Math.abs(f.deltaPct), 0)
  );
  const overNames = over
    .slice(0, 3)
    .map((f) => f.name)
    .join(', ');
  const underNames = under
    .slice(0, 4)
    .map((f) => f.name)
    .join(', ');

  return `Move money out of the funds on the left and into the funds on the right — roughly ${totalMove}% out of ${overNames} and spread it across ${underNames} using the percentages shown.`;
}

