/**
 * Board H.15 Treasury yields adapter — release-level SDMX/XML ZIP fetch / parse / normalize.
 * Display-only; no scoring, curve derivation, breakeven, artifact writes, or workflow wiring.
 *
 * Transport: https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip
 * Inner member: H15_data.xml (SDMX 1.0 compact)
 *
 * Historical CSV adapter (frb-h15-treasury-yields-csv) remains for manual parity only.
 */

import { createHash } from 'crypto';
import { isValidCalendarDate, isValidIsoTimestamp } from '../dateValidation';
import type {
  GhostFlowFetchContext,
  GhostFlowFetchedSource,
  GhostFlowNormalizeContext,
  GhostFlowNormalizedObservation,
  GhostFlowParseContext,
  GhostFlowParsedSource,
  GhostFlowRefreshIssue,
  GhostFlowSourceAdapter,
  GhostFlowStageResult,
} from '../types';
import {
  normalizeFrbH15TreasuryYields,
  type FrbH15NormalizeObservationRow,
  type FrbH15TreasuryNormalizedFields,
} from './frbH15TreasuryYieldsNormalize';
import { extractFrbH15ZipMember, FRB_H15_ZIP_DATA_MEMBER } from './frbH15ZipMember';
import {
  FRB_H15_SDMX_ADAPTER_ID,
  FRB_H15_SDMX_ARTIFACT_ID,
  FRB_H15_SDMX_OPTIONAL_SERIES_NAMES,
  FRB_H15_SDMX_PARSER_VERSION,
  FRB_H15_SDMX_REGISTERED_SERIES_NAMES,
  FRB_H15_SDMX_REQUIRED_SERIES_NAMES,
  FRB_H15_SDMX_SOURCE_FAMILY_ID,
  FRB_H15_SDMX_SOURCE_LOCATOR,
  FRB_H15_SDMX_SOURCE_NAME,
  frbH15SdmxSeriesNameToUniqueId,
  type FrbH15SdmxRegisteredSeriesName,
} from './frbH15TreasuryYieldsSdmxMeta';

export {
  FRB_H15_SDMX_ADAPTER_ID,
  FRB_H15_SDMX_ARTIFACT_ID,
  FRB_H15_SDMX_OPTIONAL_SERIES_NAMES,
  FRB_H15_SDMX_PARSER_VERSION,
  FRB_H15_SDMX_REGISTERED_SERIES_NAMES,
  FRB_H15_SDMX_REQUIRED_SERIES_NAMES,
  FRB_H15_SDMX_SOURCE_FAMILY_ID,
  FRB_H15_SDMX_SOURCE_LOCATOR,
  FRB_H15_SDMX_SOURCE_NAME,
} from './frbH15TreasuryYieldsSdmxMeta';

export { FRB_H15_ZIP_DATA_MEMBER } from './frbH15ZipMember';

const REQUIRED_SET = new Set<string>(FRB_H15_SDMX_REQUIRED_SERIES_NAMES);
const REGISTERED_SET = new Set<string>(FRB_H15_SDMX_REGISTERED_SERIES_NAMES);
const MISSING_OBS_STATUSES = new Set(['ND', 'NA', 'NC']);

export interface FrbH15SdmxObservationRow extends FrbH15NormalizeObservationRow {
  seriesName: FrbH15SdmxRegisteredSeriesName;
  obsStatus: 'A';
}

export interface FrbH15SdmxFetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  contentType?: string;
  bytes: Uint8Array;
}

export type FrbH15SdmxFetchClient = (url: string) => Promise<FrbH15SdmxFetchResponse>;

export interface FrbH15TreasuryYieldsSdmxAdapterOptions {
  fetchClient?: FrbH15SdmxFetchClient;
}

function blockIssue(
  stage: 'fetch' | 'parse' | 'normalize',
  code: string,
  message: string
): GhostFlowRefreshIssue {
  return { stage, code, severity: 'block', message };
}

function fail(
  stage: 'fetch' | 'parse' | 'normalize',
  code: string,
  message: string
): GhostFlowStageResult<never> {
  return { ok: false, issues: [blockIssue(stage, code, message)] };
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function defaultFrbH15SdmxFetchClient(
  url: string
): Promise<FrbH15SdmxFetchResponse> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/zip,application/octet-stream;q=0.9,*/*;q=0.1',
    },
    cache: 'no-store',
  });
  const buffer = new Uint8Array(await response.arrayBuffer());
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type') ?? undefined,
    bytes: buffer,
  };
}

function decodeUtf8(bytes: Uint8Array): GhostFlowStageResult<string> {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: text, issues: [] };
  } catch {
    return fail('parse', 'h15_xml_invalid_utf8', 'Board H.15 XML is not valid UTF-8');
  }
}

function readXmlAttribute(tag: string, attributeName: string): string | null {
  const marker = `${attributeName}="`;
  const start = tag.indexOf(marker);
  if (start < 0) return null;
  const valueStart = start + marker.length;
  const valueEnd = tag.indexOf('"', valueStart);
  if (valueEnd < 0) return null;
  return tag.slice(valueStart, valueEnd);
}

function parseObservationDate(value: string): string | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return isValidCalendarDate(trimmed) ? trimmed : null;
}

function parseStrictNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function seriesNameFromSeriesTag(tag: string): string | null {
  const name = readXmlAttribute(tag, 'SERIES_NAME');
  if (!name || !REGISTERED_SET.has(name)) return null;
  return name;
}

function parseObsTag(
  tag: string,
  seriesName: FrbH15SdmxRegisteredSeriesName
): GhostFlowStageResult<FrbH15SdmxObservationRow | 'missing'> {
  const obsStatus = readXmlAttribute(tag, 'OBS_STATUS');
  if (!obsStatus) {
    return fail(
      'parse',
      'h15_sdmx_invalid_observation',
      `Board H.15 SDMX observation for ${seriesName} is missing OBS_STATUS`
    );
  }

  if (MISSING_OBS_STATUSES.has(obsStatus)) {
    return { ok: true, value: 'missing', issues: [] };
  }
  if (obsStatus !== 'A') {
    return fail(
      'parse',
      'h15_sdmx_unknown_obs_status',
      `Board H.15 SDMX observation for ${seriesName} has unknown OBS_STATUS ${obsStatus}`
    );
  }

  const timePeriod = readXmlAttribute(tag, 'TIME_PERIOD');
  if (!timePeriod) {
    return fail(
      'parse',
      'h15_sdmx_invalid_observation',
      `Board H.15 SDMX observation for ${seriesName} is missing TIME_PERIOD`
    );
  }
  const observationAsOf = parseObservationDate(timePeriod);
  if (!observationAsOf) {
    return fail(
      'parse',
      'h15_sdmx_invalid_date',
      `Board H.15 SDMX observation for ${seriesName} has invalid TIME_PERIOD ${timePeriod}`
    );
  }

  const obsValueRaw = readXmlAttribute(tag, 'OBS_VALUE');
  if (obsValueRaw === null) {
    return fail(
      'parse',
      'h15_sdmx_invalid_observation',
      `Board H.15 SDMX observation for ${seriesName} is missing OBS_VALUE`
    );
  }

  const parsedValue = parseStrictNumeric(obsValueRaw);
  if (parsedValue === null) {
    return fail(
      'parse',
      'h15_sdmx_invalid_value',
      `Board H.15 SDMX observation for ${seriesName} on ${observationAsOf} has invalid OBS_VALUE ${obsValueRaw}`
    );
  }

  // Defensive: Board may emit -9999 with missing semantics in other transports; never emit as yield.
  if (parsedValue === -9999) {
    return { ok: true, value: 'missing', issues: [] };
  }

  const seriesUniqueId = frbH15SdmxSeriesNameToUniqueId(seriesName);
  return {
    ok: true,
    value: {
      seriesName,
      seriesUniqueId,
      observationAsOf,
      valuePct: parsedValue,
      obsStatus: 'A',
    },
    issues: [],
  };
}

export function parseFrbH15SdmxXml(
  xmlText: string
): GhostFlowStageResult<readonly FrbH15SdmxObservationRow[]> {
  if (!xmlText.trim()) {
    return fail('parse', 'h15_xml_empty', 'Board H.15 XML is empty');
  }

  if (
    !xmlText.includes('http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message') &&
    !xmlText.includes('<kf:Series') &&
    !xmlText.includes('<frb:Obs')
  ) {
    return fail(
      'parse',
      'h15_sdmx_invalid_structure',
      'Board H.15 XML does not contain expected SDMX compact markers'
    );
  }

  const rows: FrbH15SdmxObservationRow[] = [];
  const seenSeries = new Map<string, number>();
  const seenObservation = new Set<string>();

  let cursor = 0;
  while (cursor < xmlText.length) {
    const seriesStart = xmlText.indexOf('<kf:Series', cursor);
    if (seriesStart < 0) break;

    const seriesTagEnd = xmlText.indexOf('>', seriesStart);
    if (seriesTagEnd < 0) {
      return fail('parse', 'h15_sdmx_invalid_structure', 'Board H.15 XML series tag is malformed');
    }
    const seriesTag = xmlText.slice(seriesStart, seriesTagEnd + 1);
    const seriesNameRaw = seriesNameFromSeriesTag(seriesTag);
    if (!seriesNameRaw || !REGISTERED_SET.has(seriesNameRaw)) {
      cursor = seriesTagEnd + 1;
      continue;
    }

    const seriesName = seriesNameRaw as FrbH15SdmxRegisteredSeriesName;
    const blockEnd = xmlText.indexOf('</kf:Series>', seriesTagEnd);
    if (blockEnd < 0) {
      return fail(
        'parse',
        'h15_sdmx_invalid_structure',
        `Board H.15 SDMX series ${seriesName} is not closed`
      );
    }

    seenSeries.set(seriesName, (seenSeries.get(seriesName) ?? 0) + 1);
    if ((seenSeries.get(seriesName) ?? 0) > 1) {
      return fail(
        'parse',
        'h15_sdmx_duplicate_series',
        `Board H.15 SDMX XML contains duplicate target series ${seriesName}`
      );
    }

    const block = xmlText.slice(seriesTagEnd + 1, blockEnd);
    let obsCursor = 0;
    while (obsCursor < block.length) {
      const obsStart = block.indexOf('<frb:Obs', obsCursor);
      if (obsStart < 0) break;
      const obsEnd = block.indexOf('/>', obsStart);
      if (obsEnd < 0) {
        return fail(
          'parse',
          'h15_sdmx_invalid_observation',
          `Board H.15 SDMX observation for ${seriesName} is malformed`
        );
      }
      const obsTag = block.slice(obsStart, obsEnd + 2);
      const parsedObs = parseObsTag(obsTag, seriesName);
      if (!parsedObs.ok) return parsedObs;
      if (parsedObs.value !== 'missing') {
        const key = `${parsedObs.value.seriesUniqueId}|${parsedObs.value.observationAsOf}`;
        if (seenObservation.has(key)) {
          return fail(
            'parse',
            'h15_sdmx_duplicate_observation',
            `Board H.15 SDMX has duplicate observation for ${seriesName} on ${parsedObs.value.observationAsOf}`
          );
        }
        seenObservation.add(key);
        rows.push(parsedObs.value);
      }
      obsCursor = obsEnd + 2;
    }

    cursor = blockEnd + '</kf:Series>'.length;
  }

  const requiredPresent = new Set<string>();
  for (const name of seenSeries.keys()) {
    if (REQUIRED_SET.has(name)) requiredPresent.add(name);
  }
  for (const name of FRB_H15_SDMX_REQUIRED_SERIES_NAMES) {
    if (!requiredPresent.has(name)) {
      return fail(
        'parse',
        'h15_sdmx_missing_required_series',
        `Board H.15 SDMX XML is missing required series ${name}`
      );
    }
  }

  return { ok: true, value: rows, issues: [] };
}

export function createFrbH15TreasuryYieldsSdmxAdapter(
  options: FrbH15TreasuryYieldsSdmxAdapterOptions = {}
): GhostFlowSourceAdapter<
  Uint8Array,
  readonly FrbH15SdmxObservationRow[],
  FrbH15TreasuryNormalizedFields
> {
  const fetchClient = options.fetchClient ?? defaultFrbH15SdmxFetchClient;

  return {
    id: FRB_H15_SDMX_ADAPTER_ID,
    parserVersion: FRB_H15_SDMX_PARSER_VERSION,

    async fetch(
      context: GhostFlowFetchContext
    ): Promise<GhostFlowStageResult<GhostFlowFetchedSource<Uint8Array>>> {
      if (!isValidIsoTimestamp(context.nowIso)) {
        return fail(
          'fetch',
          'h15_fetch_invalid_now',
          'Fetch context.nowIso must be a valid ISO timestamp'
        );
      }

      let response: FrbH15SdmxFetchResponse;
      try {
        response = await fetchClient(FRB_H15_SDMX_SOURCE_LOCATOR);
      } catch {
        return fail(
          'fetch',
          'h15_fetch_exception',
          'Board H.15 SDMX ZIP fetch failed with an unexpected exception'
        );
      }

      if (!response.ok) {
        return fail(
          'fetch',
          'h15_fetch_http_error',
          `Board H.15 SDMX ZIP fetch returned HTTP ${response.status}`
        );
      }
      if (response.bytes.byteLength === 0) {
        return fail(
          'fetch',
          'h15_fetch_empty_body',
          'Board H.15 SDMX ZIP fetch returned an empty body'
        );
      }

      return {
        ok: true,
        value: {
          raw: response.bytes,
          sourceMetadata: {
            sourceId: FRB_H15_SDMX_SOURCE_FAMILY_ID,
            sourceLocator: FRB_H15_SDMX_SOURCE_LOCATOR,
            retrievedAt: context.nowIso,
            contentType: response.contentType,
            contentSha256: sha256Hex(response.bytes),
          },
        },
        issues: [],
      };
    },

    parse(
      source: GhostFlowFetchedSource<Uint8Array>,
      _context: GhostFlowParseContext
    ): GhostFlowStageResult<GhostFlowParsedSource<readonly FrbH15SdmxObservationRow[]>> {
      const extracted = extractFrbH15ZipMember(source.raw, FRB_H15_ZIP_DATA_MEMBER);
      if (!extracted.ok) {
        return fail('parse', extracted.code, extracted.message);
      }

      const decoded = decodeUtf8(extracted.bytes);
      if (!decoded.ok) return decoded;

      const parsed = parseFrbH15SdmxXml(decoded.value);
      if (!parsed.ok) return parsed;

      return {
        ok: true,
        value: {
          parsed: parsed.value,
          sourceMetadata: { ...source.sourceMetadata },
        },
        issues: [],
      };
    },

    normalize(
      source: GhostFlowParsedSource<readonly FrbH15SdmxObservationRow[]>,
      context: GhostFlowNormalizeContext
    ): GhostFlowStageResult<GhostFlowNormalizedObservation<FrbH15TreasuryNormalizedFields>> {
      return normalizeFrbH15TreasuryYields({
        parsed: source.parsed,
        sourceMetadata: source.sourceMetadata,
        context,
        artifactId: FRB_H15_SDMX_ARTIFACT_ID,
        adapterId: FRB_H15_SDMX_ADAPTER_ID,
        parserVersion: FRB_H15_SDMX_PARSER_VERSION,
      });
    },
  };
}

/** Default adapter instance (live fetch client; not invoked on import). */
export const FRB_H15_TREASURY_YIELDS_SDMX_ADAPTER =
  createFrbH15TreasuryYieldsSdmxAdapter();

export const FRB_H15_SDMX_ADAPTER_METADATA = {
  sourceFamilyId: FRB_H15_SDMX_SOURCE_FAMILY_ID,
  sourceName: FRB_H15_SDMX_SOURCE_NAME,
  sourceLocator: FRB_H15_SDMX_SOURCE_LOCATOR,
  adapterId: FRB_H15_SDMX_ADAPTER_ID,
  parserVersion: FRB_H15_SDMX_PARSER_VERSION,
  artifactId: FRB_H15_SDMX_ARTIFACT_ID,
  zipDataMember: FRB_H15_ZIP_DATA_MEMBER,
} as const;
