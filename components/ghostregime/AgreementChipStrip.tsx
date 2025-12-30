/**
 * Agreement Chip Strip
 * 
 * A compact visualization showing agreement % over recent history as small chips.
 * Each chip represents one snapshot, with opacity/fill based on agreement percentage.
 * Ordered left-to-right (oldest → newest).
 */

'use client';

import { Tooltip } from '@/components/Tooltip';

export interface AgreementSeriesItem {
  date: string;
  pct: number;
  agree: number;
  total: number;
  label: string;
}

interface AgreementChipStripProps {
  label?: string;
  items: AgreementSeriesItem[];
  className?: string;
  showLegend?: boolean;
  axisName?: string; // e.g., "Risk" or "Inflation" for tooltip
}

export function AgreementChipStrip({ 
  label, 
  items, 
  className = '', 
  showLegend = false,
  axisName 
}: AgreementChipStripProps) {
  // Don't render if less than 2 items (avoid visual noise)
  if (items.length < 2) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="text-[10px] text-zinc-500 mr-1">{label}</span>
      )}
      <div className="flex items-center gap-1" role="group" aria-label="Agreement history">
        {items.map((item, idx) => {
          // Map pct (0-100) to fill intensity
          // Use a minimum opacity of 0.25 so low values aren't invisible
          const fillIntensity = Math.max(0.25, Math.min(1.0, item.pct / 100));
          
          // Background: amber with intensity-based opacity
          const bgOpacity = fillIntensity * 0.4;
          // Border: slightly more visible for definition
          const borderOpacity = Math.max(0.3, fillIntensity * 0.6);

          // Build enhanced tooltip
          const tooltipParts: string[] = [];
          if (axisName) {
            tooltipParts.push(`${axisName} agreement`);
          }
          tooltipParts.push(item.date);
          tooltipParts.push(`${item.agree}/${item.total} (${item.pct.toFixed(0)}%)`);
          const tooltip = tooltipParts.join(' • ');

          return (
            <Tooltip key={`${item.date}-${idx}`} content={tooltip}>
              <span
                className="w-3.5 h-2.5 rounded-sm border transition-all hover:opacity-100 hover:scale-110 cursor-help"
                style={{
                  backgroundColor: `rgba(251, 191, 36, ${bgOpacity})`, // amber-400
                  borderColor: `rgba(251, 191, 36, ${borderOpacity})`,
                  borderWidth: '1px',
                }}
                aria-label={tooltip}
              />
            </Tooltip>
          );
        })}
      </div>
      {showLegend && (
        <span className="text-[9px] text-zinc-600 ml-1">low → high</span>
      )}
    </div>
  );
}

