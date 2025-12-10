import type { Sleeve } from '@/lib/types';
import { formatPercent } from '@/lib/format';

interface AllocationChartProps {
  sleeves: Sleeve[];
}

export default function AllocationChart({ sleeves }: AllocationChartProps) {
  const sortedSleeves = [...sleeves]
    .filter((s) => s.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-3">
      {sortedSleeves.map((sleeve) => (
        <div key={sleeve.id} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-zinc-200">{sleeve.name}</span>
            <span className="text-zinc-400">{formatPercent(sleeve.weight)}</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all"
              style={{ width: formatPercent(sleeve.weight) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


