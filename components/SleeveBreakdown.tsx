import type { Sleeve } from '@/lib/types';
import { formatPercent } from '@/lib/format';

interface SleeveBreakdownProps {
  sleeves: Sleeve[];
}

export default function SleeveBreakdown({ sleeves }: SleeveBreakdownProps) {
  const sortedSleeves = [...sleeves]
    .filter((s) => s.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-4">
      {sortedSleeves.map((sleeve) => (
        <div
          key={sleeve.id}
          className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-slate-200">
              {sleeve.name}
            </h3>
            <span className="text-sm font-bold text-slate-200">
              {formatPercent(sleeve.weight)}
            </span>
          </div>
          <p className="text-xs text-slate-300">{sleeve.description}</p>
        </div>
      ))}
    </div>
  );
}


