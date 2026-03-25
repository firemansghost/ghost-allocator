/**
 * Methodology Pill Link
 * 
 * A compact pill-style link to the GhostRegime methodology page
 */

'use client';

import Link from 'next/link';
import { Tooltip } from '@/components/Tooltip';
import { GHOSTREGIME_METHODOLOGY_PILL_LABEL, GHOSTREGIME_METHODOLOGY_PILL_TOOLTIP } from '@/lib/ghostregime/ghostregimePageCopy';

export function MethodologyPillLink() {
  return (
    <Tooltip content={GHOSTREGIME_METHODOLOGY_PILL_TOOLTIP}>
      <Link
        href="/ghostregime/methodology"
        className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium border border-zinc-700/50 bg-zinc-900/35 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600/70 hover:bg-zinc-900/55 transition-colors"
      >
        {GHOSTREGIME_METHODOLOGY_PILL_LABEL}
      </Link>
    </Tooltip>
  );
}
