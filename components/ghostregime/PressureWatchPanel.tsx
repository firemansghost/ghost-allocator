'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/Tooltip';
import type { RegimeMovementPressureSummary } from '@/lib/ghostregime/flipWatchPressure';
import {
  PRESSURE_WATCH_TITLE,
  PRESSURE_WATCH_SUBTITLE,
  PRESSURE_WATCH_TOOLTIP,
  PRESSURE_WATCH_DISTANCE_TO_BALANCE,
  PRESSURE_WATCH_CLOSEST_LABEL,
  PRESSURE_WATCH_ALLOC_IMPACT,
  PRESSURE_WATCH_IF_STEP_TOOLTIP,
  PRESSURE_WATCH_NA,
  PRESSURE_WATCH_NO_SCORES,
  PRESSURE_WATCH_TAG_NEAR_BALANCE,
  PRESSURE_WATCH_TAG_NEAR_FLIP,
  PRESSURE_WATCH_TAG_STABLE_VS_PRIOR,
  PRESSURE_WATCH_RISK_ROW_LABEL,
  PRESSURE_WATCH_INFL_ROW_LABEL,
  PRESSURE_WATCH_DISTANCE_TO_FLIP,
} from '@/lib/ghostregime/ghostregimePageCopy';
import {
  axisMeterFill,
  axisPressureTags,
  closestSleeveTags,
  formatPressureDirectionLabel,
  sleeveMeterFill,
} from '@/lib/ghostregime/pressureDisplay';

function formatPctDelta(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${(v * 100).toFixed(1)}%`;
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-400/25 bg-amber-400/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-200/90">
      {children}
    </span>
  );
}

interface PressureWatchPanelProps {
  movementPressure: RegimeMovementPressureSummary;
}

export function PressureWatchPanel({ movementPressure }: PressureWatchPanelProps) {
  const { risk, inflation, closestSleeve } = movementPressure;

  const riskTags = axisPressureTags(risk);
  const inflTags = axisPressureTags(inflation);
  const sleeveTagList = closestSleeveTags(closestSleeve);

  return (
    <div className="rounded-lg border border-amber-400/20 bg-zinc-900/40 px-3 py-3 space-y-3">
      <div>
        <Tooltip content={PRESSURE_WATCH_TOOLTIP}>
          <h3 className="text-xs font-semibold text-zinc-100 cursor-help">{PRESSURE_WATCH_TITLE}</h3>
        </Tooltip>
        <p className="text-[10px] text-zinc-500 mt-0.5">{PRESSURE_WATCH_SUBTITLE}</p>
      </div>

      <PressureAxisRow
        label={PRESSURE_WATCH_RISK_ROW_LABEL}
        distance={risk.distanceToZero}
        directionLabel={formatPressureDirectionLabel(risk.direction)}
        meterFill={axisMeterFill(risk.distanceToZero)}
        tags={riskTags}
      />
      <PressureAxisRow
        label={PRESSURE_WATCH_INFL_ROW_LABEL}
        distance={inflation.distanceToZero}
        directionLabel={formatPressureDirectionLabel(inflation.direction)}
        meterFill={axisMeterFill(inflation.distanceToZero)}
        tags={inflTags}
      />

      <div className="border-t border-zinc-800 pt-3 space-y-2">
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
              {PRESSURE_WATCH_DISTANCE_TO_FLIP}:{' '}
              <span className="text-zinc-200 font-mono tabular-nums">
                {closestSleeve.distanceToBoundary.toFixed(2)}
              </span>
            </p>
            <Tooltip content={PRESSURE_WATCH_IF_STEP_TOOLTIP}>
              <p className="text-[11px] text-zinc-300 leading-snug cursor-help">
                <span className="text-zinc-500">{PRESSURE_WATCH_ALLOC_IMPACT}:</span> Stocks{' '}
                {formatPctDelta(closestSleeve.deltaStocksActual)}, Gold {formatPctDelta(closestSleeve.deltaGoldActual)},{' '}
                Bitcoin {formatPctDelta(closestSleeve.deltaBtcActual)}, Cash {formatPctDelta(closestSleeve.deltaCash)}
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
  distance,
  directionLabel,
  meterFill,
  tags,
}: {
  label: string;
  distance: number;
  directionLabel: string;
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
        <span>
          {PRESSURE_WATCH_DISTANCE_TO_BALANCE}:{' '}
          <span className="text-zinc-200 font-mono tabular-nums">{distance.toFixed(2)}</span>
        </span>
        <span className="text-zinc-500">·</span>
        <span>{directionLabel}</span>
      </div>
    </div>
  );
}
