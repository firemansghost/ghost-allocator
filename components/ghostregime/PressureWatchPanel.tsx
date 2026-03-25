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
  PRESSURE_WATCH_NA,
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

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-400/25 bg-amber-400/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-200/90">
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
    ? 'space-y-3'
    : 'rounded-lg border border-amber-400/20 bg-zinc-900/40 px-3 py-3 space-y-3';

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

      <PressureAxisRow
        label={PRESSURE_WATCH_RISK_ROW_LABEL}
        flipLineText={formatRiskAxisFlipLine(riskScore, risk.distanceToZero)}
        directionVsPrior={formatRiskDirectionVsPrior(risk.direction)}
        meterFill={axisMeterFill(risk.distanceToZero)}
        tags={riskTags}
      />
      <PressureAxisRow
        label={PRESSURE_WATCH_INFL_ROW_LABEL}
        flipLineText={formatInflationAxisFlipLine(inflScore, inflation.distanceToZero)}
        directionVsPrior={formatInflationDirectionVsPrior(inflation.direction)}
        meterFill={axisMeterFill(inflation.distanceToZero)}
        tags={inflTags}
      />

      <div className="border-t border-zinc-800/80 pt-3 space-y-2">
        {closestSleeve ? (
          <>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
              {PRESSURE_WATCH_CLOSEST_LABEL}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-100">{closestSleeve.label}</span>
              {sleeveTagList.includes('near_flip') && <Tag>{PRESSURE_WATCH_TAG_NEAR_FLIP}</Tag>}
            </div>
            <div className="h-1.5 w-full max-w-xs rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500/50 transition-all"
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
              <p className="text-[11px] text-zinc-300 leading-snug cursor-help">
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
      </div>
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
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.includes('near_balance') && <Tag>{PRESSURE_WATCH_TAG_NEAR_BALANCE}</Tag>}
          {tags.includes('stable_vs_prior') && <Tag>{PRESSURE_WATCH_TAG_STABLE_VS_PRIOR}</Tag>}
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500/40 transition-all"
          style={{ width: `${meterFill * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
        <span className="text-zinc-300">{flipLineText}</span>
        <span className="text-zinc-500">·</span>
        <span>{directionVsPrior}</span>
      </div>
    </div>
  );
}
