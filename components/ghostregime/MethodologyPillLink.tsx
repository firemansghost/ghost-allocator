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
        className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium border border-amber-400/30 bg-amber-400/5 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 hover:border-amber-400/50 transition-colors"
      >
        {GHOSTREGIME_METHODOLOGY_PILL_LABEL}
      </Link>
    </Tooltip>
  );
}
