/**
 * Agreement Chip Strip
 * 
 * A compact visualization showing agreement % over recent history as small chips.
 * Each chip represents one snapshot, with opacity/fill based on agreement percentage.
 */

'use client';

interface AgreementChipItem {
  date: string;
  pct: number;
  agree: number;
  total: number;
  label: string;
}

interface AgreementChipStripProps {
  items: AgreementChipItem[];
  ariaLabel: string;
}

export function AgreementChipStrip({ items, ariaLabel }: AgreementChipStripProps) {
  // Don't render if less than 2 items (avoid visual noise)
  if (items.length < 2) {
    return null;
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={ariaLabel}>
      {items.map((item, idx) => {
        // Map pct (0-100) to opacity (0.15 to 1.0)
        const opacity = Math.max(0.15, Math.min(1.0, item.pct / 100));
        // Use amber color with opacity for visual feedback
        const bgOpacity = opacity * 0.3; // Base opacity for background
        const borderOpacity = opacity * 0.5; // Slightly higher for border

        return (
          <span
            key={`${item.date}-${idx}`}
            title={item.label}
            className="w-3 h-2 rounded-sm border transition-opacity hover:opacity-100"
            style={{
              backgroundColor: `rgba(251, 191, 36, ${bgOpacity})`, // amber-400 with opacity
              borderColor: `rgba(251, 191, 36, ${borderOpacity})`,
              opacity: 0.8, // Slight base opacity for subtlety
            }}
            aria-label={item.label}
          />
        );
      })}
    </div>
  );
}

