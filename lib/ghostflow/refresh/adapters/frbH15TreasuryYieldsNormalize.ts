/**
 * Shared Board H.15 Treasury yields normalization — latest common required date.
 * Used by CSV and SDMX adapters; semantics must not drift.
 */

import { isValidCalendarDate, isValidIsoTimestamp } from '../dateValidation';
import type {
  GhostFlowNormalizeContext,
  GhostFlowNormalizedObservation,
  GhostFlowRefreshIssue,
  GhostFlowStageResult,
} from '../types';
import {
  FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS,
  FRB_H15_REQUIRED_SERIES_UNIQUE_IDS,
  type FrbH15OptionalSeriesUniqueId,
  type FrbH15RegisteredSeriesUniqueId,
} from './frbH15TreasuryYieldsMeta';

export interface FrbH15TreasuryNormalizedFields {
  thirtyYearNominalYieldPct: number;
  thirtyYearTipsRealYieldPct: number;
  twoYearYieldPct?: number;
  fiveYearYieldPct?: number;
  tenYearYieldPct?: number;
}

export interface FrbH15NormalizeObservationRow {
  seriesUniqueId: FrbH15RegisteredSeriesUniqueId;
  observationAsOf: string;
  valuePct: number;
}

const FIELD_BY_SERIES: Record<
  FrbH15RegisteredSeriesUniqueId,
  keyof FrbH15TreasuryNormalizedFields
> = {
  'H15/H15/RIFLGFCY30_N.B': 'thirtyYearNominalYieldPct',
  'H15/H15/RIFLGFCY30_XII_N.B': 'thirtyYearTipsRealYieldPct',
  'H15/H15/RIFLGFCY02_N.B': 'twoYearYieldPct',
  'H15/H15/RIFLGFCY05_N.B': 'fiveYearYieldPct',
  'H15/H15/RIFLGFCY10_N.B': 'tenYearYieldPct',
};

function blockIssue(
  stage: 'normalize',
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage, code, severity: 'block', message };
}

function fail(code: string, message: string): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue('normalize', code, message)] };
}

export function normalizeFrbH15TreasuryYields<
  TProvenance extends {
    sourceId: string;
    sourceLocator: string;
    retrievedAt: string;
    contentSha256: string;
  },
>(input: {
  parsed: readonly FrbH15NormalizeObservationRow[];
  sourceMetadata: TProvenance;
  context: GhostFlowNormalizeContext;
  artifactId: string;
  adapterId: string;
  parserVersion: string;
}): GhostFlowStageResult<
  GhostFlowNormalizedObservation<FrbH15TreasuryNormalizedFields>
> {
  const { parsed, sourceMetadata, context, artifactId, adapterId, parserVersion } = input;

  if (!isValidIsoTimestamp(context.nowIso)) {
    return fail(
      'h15_normalize_invalid_now',
      'Normalize context.nowIso must be a valid ISO timestamp'
    );
  }

  const nowDate = new Date(context.nowIso).toISOString().slice(0, 10);
  if (!isValidCalendarDate(nowDate)) {
    return fail(
      'h15_normalize_invalid_now',
      'Normalize context.nowIso must contain a valid UTC calendar date'
    );
  }

  let ceiling = nowDate;
  if (context.referenceAsOf !== undefined) {
    if (!isValidCalendarDate(context.referenceAsOf)) {
      return fail(
        'h15_normalize_invalid_reference_ceiling',
        'Normalize context.referenceAsOf must be a real YYYY-MM-DD calendar date'
      );
    }
    ceiling = context.referenceAsOf < nowDate ? context.referenceAsOf : nowDate;
  }

  for (const row of parsed) {
    if (row.observationAsOf > nowDate) {
      return fail(
        'h15_normalize_future_observation',
        `Board H.15 observation ${row.observationAsOf} is after nowIso UTC date ${nowDate}`
      );
    }
  }

  const bySeriesDate = new Map<string, number>();
  for (const row of parsed) {
    if (row.observationAsOf > ceiling) continue;
    bySeriesDate.set(`${row.seriesUniqueId}|${row.observationAsOf}`, row.valuePct);
  }

  const requiredDates: string[][] = FRB_H15_REQUIRED_SERIES_UNIQUE_IDS.map((id) => {
    const dates: string[] = [];
    for (const key of bySeriesDate.keys()) {
      if (key.startsWith(`${id}|`)) {
        dates.push(key.slice(id.length + 1));
      }
    }
    return dates;
  });

  if (requiredDates.some((d) => d.length === 0)) {
    return fail(
      'h15_normalize_no_eligible_observation',
      `No Board H.15 required-series observation on or before ceiling ${ceiling}`
    );
  }

  const common = new Set(requiredDates[0]!);
  for (let i = 1; i < requiredDates.length; i++) {
    const next = new Set(requiredDates[i]!);
    for (const d of [...common]) {
      if (!next.has(d)) common.delete(d);
    }
  }

  if (common.size === 0) {
    return fail(
      'h15_normalize_no_common_date',
      'No common Board H.15 observation date across required series'
    );
  }

  let asOf: string | null = null;
  for (const d of common) {
    if (asOf === null || d > asOf) asOf = d;
  }
  if (!asOf) {
    return fail(
      'h15_normalize_no_common_date',
      'No common Board H.15 observation date across required series'
    );
  }

  const thirtyYearNominalYieldPct = bySeriesDate.get(`H15/H15/RIFLGFCY30_N.B|${asOf}`);
  const thirtyYearTipsRealYieldPct = bySeriesDate.get(
    `H15/H15/RIFLGFCY30_XII_N.B|${asOf}`
  );
  if (
    thirtyYearNominalYieldPct === undefined ||
    thirtyYearTipsRealYieldPct === undefined
  ) {
    return fail(
      'h15_normalize_incomplete_required',
      `Required Board H.15 yields incomplete on ${asOf}`
    );
  }

  const fields: FrbH15TreasuryNormalizedFields = {
    thirtyYearNominalYieldPct,
    thirtyYearTipsRealYieldPct,
  };

  for (const id of FRB_H15_OPTIONAL_SERIES_UNIQUE_IDS) {
    const v = bySeriesDate.get(`${id}|${asOf}`);
    if (v === undefined) continue;
    const field = FIELD_BY_SERIES[id as FrbH15OptionalSeriesUniqueId];
    fields[field] = v;
  }

  if ('tenYearBreakevenInflationPct' in (fields as object)) {
    return fail(
      'h15_normalize_breakeven_forbidden',
      'Board H.15 adapter must not emit tenYearBreakevenInflationPct'
    );
  }

  return {
    ok: true,
    value: {
      artifactId,
      observationAsOf: asOf,
      fields,
      provenance: {
        sourceId: sourceMetadata.sourceId,
        sourceLocator: sourceMetadata.sourceLocator,
        retrievedAt: sourceMetadata.retrievedAt,
        observationAsOf: asOf,
        contentSha256: sourceMetadata.contentSha256,
        adapterId,
        parserVersion,
      },
    },
    issues: [],
  };
}
