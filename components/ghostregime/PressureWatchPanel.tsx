'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/Tooltip';
import type { RegimeMovementPressureSummary } from '@/lib/ghostregime/flipWatchPressure';
import {
  PRESSURE_WATCH_TITLE,
  PRESSURE_WATCH_SUBTITLE,
  PRESSURE_WATCH_TOOLTIP,
  PRESSURE_WATCH_CLOSEST_LABEL,
  PRESSURE_WATCH_IF_STEP_TOOLTIP,
  PRESSURE_WATCH_NO_SCORES,
  PRESSURE_WATCH_TAG_NEAR_BALANCE,
  PRESSURE_WATCH_TAG_NEAR_FLIP,
  PRESSURE_WATCH_TAG_STABLE_VS_PRIOR,
  PRESSURE_WATCH_RISK_ROW_LABEL,
  PRESSURE_WATCH_INFL_ROW_LABEL,
  PRESSURE_WATCH_NEXT_FLIP_IMPACT_NEGLIGIBLE,
} from '@/lib/ghostregime/ghostregimePageCopy';
import {
  axisMeterFill,
  axisPressureTags,
  closestSleeveTags,
  formatInflationAxisFlipLine,
  formatInflationDirectionVsPrior,
  formatNextFlipImpactLine,
  formatRiskAxisFlipLine,
  formatRiskDirectionVsPrior,
  formatSleeveThresholdDistanceLine,
  sleeveMeterFill,
} from '@/lib/ghostregime/pressureDisplay';

/** Stronger — e.g. sleeve “Near flip” */
function TagPrimary({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-400/35 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-200/95">
      {children}
    </span>
  );
}

/** Quieter — axis state tags */
function TagSecondary({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-zinc-800/45 bg-zinc-900/25 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-zinc-500/90">
      {children}
    </span>
  );
}

interface PressureWatchPanelProps {
  movementPressure: RegimeMovementPressureSummary;
  riskScore: number;
  inflScore: number;
  /** When true, outer card owns title/subtitle — hide header chrome and soften inner chrome */
  embedded?: boolean;
}

export function PressureWatchPanel({
  movementPressure,
  riskScore,
  inflScore,
  embedded = false,
}: PressureWatchPanelProps) {
  const { risk, inflation, closestSleeve } = movementPressure;

  const riskTags = axisPressureTags(risk);
  const inflTags = axisPressureTags(inflation);
  const sleeveTagList = closestSleeveTags(closestSleeve);

  const innerClass = embedded
    ? 'space-y-5'
    : 'rounded-lg border border-amber-400/20 bg-zinc-900/40 px-3 py-3 space-y-5';

  return (
    <div className={innerClass}>
      {!embedded && (
        <div>
          <Tooltip content={PRESSURE_WATCH_TOOLTIP}>
            <h3 className="text-xs font-semibold text-zinc-100 cursor-help">{PRESSURE_WATCH_TITLE}</h3>
          </Tooltip>
          <p className="text-[10px] text-zinc-500 mt-0.5">{PRESSURE_WATCH_SUBTITLE}</p>
        </div>
      )}

      <section className="space-y-2.5 pb-4 border-b border-zinc-800/35">
        <PressureAxisRow
          label={PRESSURE_WATCH_RISK_ROW_LABEL}
          flipLineText={formatRiskAxisFlipLine(riskScore, risk.distanceToZero)}
          directionVsPrior={formatRiskDirectionVsPrior(risk.direction)}
          meterFill={axisMeterFill(risk.distanceToZero)}
          tags={riskTags}
        />
      </section>

      <section className="space-y-2.5 pb-4 border-b border-zinc-800/35">
        <PressureAxisRow
          label={PRESSURE_WATCH_INFL_ROW_LABEL}
          flipLineText={formatInflationAxisFlipLine(inflScore, inflation.distanceToZero)}
          directionVsPrior={formatInflationDirectionVsPrior(inflation.direction)}
          meterFill={axisMeterFill(inflation.distanceToZero)}
          tags={inflTags}
        />
      </section>

      <section className="rounded-md border border-zinc-800/50 ring-1 ring-inset ring-amber-400/[0.06] bg-zinc-900/30 p-3 space-y-2.5">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{PRESSURE_WATCH_CLOSEST_LABEL}</p>
        {closestSleeve ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-100">{closestSleeve.label}</span>
              {sleeveTagList.includes('near_flip') && <TagPrimary>{PRESSURE_WATCH_TAG_NEAR_FLIP}</TagPrimary>}
            </div>
            <div className="h-1.5 w-full max-w-xs rounded-full bg-zinc-800/90 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500/45 transition-all"
                style={{ width: `${sleeveMeterFill(closestSleeve.distanceToBoundary) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              {formatSleeveThresholdDistanceLine(
                closestSleeve.state,
                closestSleeve.nextStateIfFlipped,
                closestSleeve.distanceToBoundary
              )}
            </p>
            <Tooltip content={PRESSURE_WATCH_IF_STEP_TOOLTIP}>
              <p className="text-[11px] text-zinc-300 leading-relaxed cursor-help">
                {formatNextFlipImpactLine(
                  {
                    stocks: closestSleeve.deltaStocksActual,
                    gold: closestSleeve.deltaGoldActual,
                    btc: closestSleeve.deltaBtcActual,
                    cash: closestSleeve.deltaCash,
                  },
                  PRESSURE_WATCH_NEXT_FLIP_IMPACT_NEGLIGIBLE
                )}
              </p>
            </Tooltip>
          </>
        ) : (
          <p className="text-[10px] text-zinc-500 leading-relaxed">{PRESSURE_WATCH_NO_SCORES}</p>
        )}
      </section>
    </div>
  );
}

function PressureAxisRow({
  label,
  flipLineText,
  directionVsPrior,
  meterFill,
  tags,
}: {
  label: string;
  flipLineText: string;
  directionVsPrior: string;
  meterFill: number;
  tags: ('near_balance' | 'stable_vs_prior')[];
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-0.5">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.includes('near_balance') && <TagSecondary>{PRESSURE_WATCH_TAG_NEAR_BALANCE}</TagSecondary>}
          {tags.includes('stable_vs_prior') && <TagSecondary>{PRESSURE_WATCH_TAG_STABLE_VS_PRIOR}</TagSecondary>}
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800/90 overflow-hidden mt-0.5">
        <div
          className="h-full rounded-full bg-amber-500/35 transition-all"
          style={{ width: `${meterFill * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-zinc-400 pt-1">
        <span className="text-zinc-300">{flipLineText}</span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-400">{directionVsPrior}</span>
      </div>
    </div>
  );
}
