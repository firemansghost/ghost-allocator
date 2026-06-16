/**
 * GhostFlow v1.9c.3 — Index inclusion event proxy artifact (design scaffolding only).
 * Pure validation helpers. No production loader, freshness, or buildSnapshot merge.
 */

import type {
  IndexInclusionEventAction,
  IndexInclusionEventIndexFamily,
  IndexInclusionEventProxyArtifactV1,
  IndexInclusionEventProxyValidation,
  IndexInclusionEventRecordV1,
  IndexInclusionEventSourceConfidence,
} from './types';

export const INDEX_INCLUSION_EVENT_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json';

export const INDEX_INCLUSION_EVENT_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/indexInclusionEventProxy.v1.json';

export const INDEX_INCLUSION_EVENT_PROXY_SIGNAL_ID = 'index-inclusion-event-proxy' as const;

export const INDEX_INCLUSION_EVENT_OBSERVATION_TYPE =
  'index_inclusion_rebalance_event_snapshot' as const;

export const INDEX_INCLUSION_EVENT_SERIES_DEFINITION =
  'public_index_change_events_v1' as const;

export const INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_ID = 'index-inclusion-events' as const;

export const INDEX_INCLUSION_EVENT_DISPLAY_SIGNAL_NAME =
  'Index Inclusion Event Proxy' as const;

export const INDEX_INCLUSION_EVENT_DISPLAY_CARD_CAVEAT =
  'Public index-event proxy; does not estimate free float, index-fund demand, or trade impact.';

const INDEX_FAMILIES: IndexInclusionEventIndexFamily[] = [
  'sp_dji',
  'nasdaq',
  'ftse_russell',
  'other',
];

const ACTIONS: IndexInclusionEventAction[] = [
  'add',
  'delete',
  'rebalance',
  'reconstitution',
  'unknown',
];

const SOURCE_CONFIDENCES: IndexInclusionEventSourceConfidence[] = [
  'high',
  'medium',
  'low',
];

const TICKER_PATTERN = /^[A-Z0-9.-]+$/;

const FORBIDDEN_FIELD_KEYS = [
  'mappedPressureScore',
  'candidatePressureScore',
  'basketScore',
  'publicPassiveInputKey',
  'floatAbsorptionScore',
  'numericValue',
  'impliedDemandDollars',
  'freeFloatPct',
] as const;

export type IndexInclusionEventValidationMode = 'example' | 'production';

export interface IndexInclusionEventValidateOptions {
  mode?: IndexInclusionEventValidationMode;
  referenceAsOf?: string;
}

function normalizeValidateOptions(
  options?: IndexInclusionEventValidateOptions
): { mode: IndexInclusionEventValidationMode; referenceAsOf?: string } {
  return {
    mode: options?.mode ?? 'example',
    referenceAsOf: options?.referenceAsOf,
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseIsoDate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`));
}

function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function requireNonEmptyString(name: string, v: unknown, errors: string[]): v is string {
  if (typeof v !== 'string' || !v.trim()) {
    errors.push(`${name} must be a non-empty string.`);
    return false;
  }
  return true;
}

function rejectForbiddenScoreFields(
  obj: Record<string, unknown>,
  label: string,
  errors: string[]
): void {
  for (const key of FORBIDDEN_FIELD_KEYS) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      errors.push(`${label} must not include ${key}.`);
    }
  }
}

function validateNonNegativeInteger(
  name: string,
  v: unknown,
  errors: string[]
): v is number {
  if (!isFiniteNumber(v) || v < 0 || !Number.isInteger(v)) {
    errors.push(`${name} must be a non-negative integer.`);
    return false;
  }
  return true;
}

function validateOptionalNonNegativeInteger(
  name: string,
  v: unknown,
  errors: string[]
): void {
  if (v === undefined) return;
  validateNonNegativeInteger(name, v, errors);
}

function classifyEffectiveDate(
  effectiveDate: string | null,
  asOf: string
): 'upcoming' | 'recent' | 'undated' {
  if (effectiveDate === null) return 'undated';
  if (compareIso(effectiveDate, asOf) > 0) return 'upcoming';
  return 'recent';
}

function validateEventRecord(
  event: unknown,
  index: number,
  errors: string[]
): IndexInclusionEventRecordV1 | null {
  const label = `observations.events[${index}]`;

  if (!isPlainObject(event)) {
    errors.push(`${label} must be an object.`);
    return null;
  }

  rejectForbiddenScoreFields(event, label, errors);

  requireNonEmptyString(`${label}.eventId`, event.eventId, errors);
  requireNonEmptyString(`${label}.sourceName`, event.sourceName, errors);
  requireNonEmptyString(`${label}.sourceUrl`, event.sourceUrl, errors);

  const announcedDate = event.announcedDate;
  if (typeof announcedDate !== 'string' || !parseIsoDate(announcedDate)) {
    errors.push(`${label}.announcedDate must be a valid ISO date (YYYY-MM-DD).`);
  }

  const sourceAccessedDate = event.sourceAccessedDate;
  if (typeof sourceAccessedDate !== 'string' || !parseIsoDate(sourceAccessedDate)) {
    errors.push(`${label}.sourceAccessedDate must be a valid ISO date (YYYY-MM-DD).`);
  }

  const effectiveDateRaw = event.effectiveDate;
  let effectiveDate: string | null = null;
  if (effectiveDateRaw === null) {
    effectiveDate = null;
    const notes = event.notes;
    if (typeof notes !== 'string' || !notes.trim()) {
      errors.push(
        `${label}.notes must be a non-empty string when effectiveDate is null.`
      );
    }
  } else if (typeof effectiveDateRaw === 'string' && parseIsoDate(effectiveDateRaw)) {
    effectiveDate = effectiveDateRaw;
  } else {
    errors.push(`${label}.effectiveDate must be a valid ISO date (YYYY-MM-DD) or null.`);
  }

  const indexFamily = event.indexFamily;
  if (
    typeof indexFamily !== 'string' ||
    !INDEX_FAMILIES.includes(indexFamily as IndexInclusionEventIndexFamily)
  ) {
    errors.push(`${label}.indexFamily must be one of: ${INDEX_FAMILIES.join(', ')}.`);
  }

  requireNonEmptyString(`${label}.indexName`, event.indexName, errors);

  const ticker = event.ticker;
  if (typeof ticker !== 'string' || !ticker.trim()) {
    errors.push(`${label}.ticker must be a non-empty string.`);
  } else if (ticker !== ticker.toUpperCase()) {
    errors.push(`${label}.ticker must be uppercase.`);
  } else if (!TICKER_PATTERN.test(ticker)) {
    errors.push(`${label}.ticker contains invalid characters.`);
  }

  const action = event.action;
  if (typeof action !== 'string' || !ACTIONS.includes(action as IndexInclusionEventAction)) {
    errors.push(`${label}.action must be one of: ${ACTIONS.join(', ')}.`);
  }

  const sourceConfidence = event.sourceConfidence;
  if (
    sourceConfidence !== undefined &&
    (typeof sourceConfidence !== 'string' ||
      !SOURCE_CONFIDENCES.includes(sourceConfidence as IndexInclusionEventSourceConfidence))
  ) {
    errors.push(
      `${label}.sourceConfidence must be one of: ${SOURCE_CONFIDENCES.join(', ')} when present.`
    );
  }

  if (event.operatorVerified !== true) {
    errors.push(`${label}.operatorVerified must be true.`);
  }
  if (event.floatEstimateAvailable !== false) {
    errors.push(`${label}.floatEstimateAvailable must be false.`);
  }
  if (event.demandEstimateAvailable !== false) {
    errors.push(`${label}.demandEstimateAvailable must be false.`);
  }
  if (event.mappingStatus !== 'not_final') {
    errors.push(`${label}.mappingStatus must be "not_final".`);
  }

  if (event.eventType !== undefined && typeof event.eventType !== 'string') {
    errors.push(`${label}.eventType must be a string when present.`);
  }
  if (event.notes !== undefined && typeof event.notes !== 'string') {
    errors.push(`${label}.notes must be a string when present.`);
  }
  if (event.companyName !== undefined && typeof event.companyName !== 'string') {
    errors.push(`${label}.companyName must be a string when present.`);
  }
  if (event.eventSeverityLabel !== undefined && typeof event.eventSeverityLabel !== 'string') {
    errors.push(`${label}.eventSeverityLabel must be a string when present.`);
  }

  return {
    eventId: String(event.eventId),
    sourceName: String(event.sourceName),
    sourceUrl: String(event.sourceUrl),
    announcedDate: String(announcedDate),
    effectiveDate,
    sourceAccessedDate: String(sourceAccessedDate),
    indexFamily: indexFamily as IndexInclusionEventIndexFamily,
    indexName: String(event.indexName),
    ticker: String(event.ticker),
    companyName: typeof event.companyName === 'string' ? event.companyName : undefined,
    action: action as IndexInclusionEventAction,
    eventType: typeof event.eventType === 'string' ? event.eventType : undefined,
    notes: typeof event.notes === 'string' ? event.notes : undefined,
    sourceConfidence:
      typeof sourceConfidence === 'string'
        ? (sourceConfidence as IndexInclusionEventSourceConfidence)
        : undefined,
    operatorVerified: true,
    floatEstimateAvailable: false,
    demandEstimateAvailable: false,
    mappingStatus: 'not_final',
    eventSeverityLabel:
      typeof event.eventSeverityLabel === 'string' ? event.eventSeverityLabel : undefined,
  };
}

export function validateIndexInclusionEventProxyArtifact(
  raw: unknown,
  options?: IndexInclusionEventValidateOptions
): IndexInclusionEventProxyValidation {
  const { mode, referenceAsOf } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  rejectForbiddenScoreFields(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== INDEX_INCLUSION_EVENT_PROXY_SIGNAL_ID) {
    errors.push(`signalId must be "${INDEX_INCLUSION_EVENT_PROXY_SIGNAL_ID}".`);
  }
  if (mode === 'example') {
    if (raw.designOnly !== true) {
      errors.push('designOnly must be true for example artifact (mode: example).');
    }
  } else if (raw.designOnly === true) {
    errors.push('designOnly must not be true for production artifact (mode: production).');
  }
  if (raw.updateFrequency !== 'event_driven') {
    errors.push('updateFrequency must be "event_driven".');
  }
  if (raw.observationType !== INDEX_INCLUSION_EVENT_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${INDEX_INCLUSION_EVENT_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== INDEX_INCLUSION_EVENT_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${INDEX_INCLUSION_EVENT_SERIES_DEFINITION}".`);
  }

  const asOf = raw.asOf;
  const publishedAt = raw.publishedAt;
  if (typeof asOf !== 'string' || !parseIsoDate(asOf)) {
    errors.push('asOf must be a valid ISO date (YYYY-MM-DD).');
  }
  if (typeof publishedAt !== 'string' || !parseIsoDate(publishedAt)) {
    errors.push('publishedAt must be a valid ISO date (YYYY-MM-DD).');
  }
  if (
    typeof asOf === 'string' &&
    typeof publishedAt === 'string' &&
    parseIsoDate(asOf) &&
    parseIsoDate(publishedAt) &&
    compareIso(publishedAt, asOf) < 0
  ) {
    errors.push('publishedAt cannot be before asOf.');
  }
  if (
    referenceAsOf &&
    typeof asOf === 'string' &&
    parseIsoDate(asOf) &&
    compareIso(asOf, referenceAsOf) > 0
  ) {
    errors.push(`asOf (${asOf}) cannot be after referenceAsOf (${referenceAsOf}).`);
  }

  if (raw.mappingStatus !== 'not_final') {
    errors.push('mappingStatus must be "not_final".');
  }

  const source = raw.source;
  if (!isPlainObject(source)) {
    errors.push('source must be an object with name and url.');
  } else {
    requireNonEmptyString('source.name', source.name, errors);
    requireNonEmptyString('source.url', source.url, errors);
    if (source.note !== undefined && typeof source.note !== 'string') {
      errors.push('source.note must be a string when present.');
    }
  }

  const caveats = raw.caveats;
  if (!Array.isArray(caveats) || caveats.length === 0) {
    errors.push('caveats must be a non-empty string array.');
  } else {
    for (let i = 0; i < caveats.length; i++) {
      if (typeof caveats[i] !== 'string' || !String(caveats[i]).trim()) {
        errors.push(`caveats[${i}] must be a non-empty string.`);
      }
    }
  }

  const dataQuality = raw.dataQuality;
  if (dataQuality !== 'verified_manual' && dataQuality !== 'manual_unverified') {
    errors.push('dataQuality must be verified_manual or manual_unverified.');
  }

  if (!requireNonEmptyString('methodology', raw.methodology, errors)) {
    // methodology validated above
  }

  const observations = raw.observations;
  if (!isPlainObject(observations)) {
    errors.push('observations must be an object.');
  } else {
    rejectForbiddenScoreFields(observations, 'observations', errors);

    if (observations.mappingStatus !== 'not_final') {
      errors.push('observations.mappingStatus must be "not_final".');
    }

    const eventWindowStart = observations.eventWindowStart;
    const eventWindowEnd = observations.eventWindowEnd;
    if (typeof eventWindowStart !== 'string' || !parseIsoDate(eventWindowStart)) {
      errors.push('observations.eventWindowStart must be a valid ISO date (YYYY-MM-DD).');
    }
    if (typeof eventWindowEnd !== 'string' || !parseIsoDate(eventWindowEnd)) {
      errors.push('observations.eventWindowEnd must be a valid ISO date (YYYY-MM-DD).');
    }
    if (
      typeof eventWindowStart === 'string' &&
      typeof eventWindowEnd === 'string' &&
      parseIsoDate(eventWindowStart) &&
      parseIsoDate(eventWindowEnd) &&
      compareIso(eventWindowStart, eventWindowEnd) > 0
    ) {
      errors.push('observations.eventWindowStart cannot be after eventWindowEnd.');
    }

    const eventsRaw = observations.events;
    if (!Array.isArray(eventsRaw)) {
      errors.push('observations.events must be an array.');
    }

    const eventCountValue = observations.eventCount;
    const upcomingEventCountValue = observations.upcomingEventCount;
    const recentEventCountValue = observations.recentEventCount;
    const sourceEventCountValue = observations.sourceEventCount;

    const eventCountOk = validateNonNegativeInteger(
      'observations.eventCount',
      eventCountValue,
      errors
    );
    const upcomingOk = validateNonNegativeInteger(
      'observations.upcomingEventCount',
      upcomingEventCountValue,
      errors
    );
    const recentOk = validateNonNegativeInteger(
      'observations.recentEventCount',
      recentEventCountValue,
      errors
    );
    const sourceCountOk = validateNonNegativeInteger(
      'observations.sourceEventCount',
      sourceEventCountValue,
      errors
    );
    validateOptionalNonNegativeInteger(
      'observations.majorIndexEventCount',
      observations.majorIndexEventCount,
      errors
    );

    const parsedEvents: IndexInclusionEventRecordV1[] = [];
    if (Array.isArray(eventsRaw)) {
      for (let i = 0; i < eventsRaw.length; i++) {
        const parsed = validateEventRecord(eventsRaw[i], i, errors);
        if (parsed) parsedEvents.push(parsed);
      }

      if (eventCountOk && eventsRaw.length !== eventCountValue) {
        errors.push(
          `observations.eventCount (${eventCountValue}) must equal events.length (${eventsRaw.length}).`
        );
      }
      if (sourceCountOk && eventsRaw.length !== sourceEventCountValue) {
        errors.push(
          `observations.sourceEventCount (${sourceEventCountValue}) must equal events.length (${eventsRaw.length}).`
        );
      }

      if (
        typeof asOf === 'string' &&
        parseIsoDate(asOf) &&
        upcomingOk &&
        recentOk &&
        eventCountOk
      ) {
        const hasUndated = parsedEvents.some((e) => e.effectiveDate === null);
        if (!hasUndated) {
          let upcoming = 0;
          let recent = 0;
          for (const e of parsedEvents) {
            const bucket = classifyEffectiveDate(e.effectiveDate, asOf);
            if (bucket === 'upcoming') upcoming++;
            else if (bucket === 'recent') recent++;
          }
          if (upcoming !== upcomingEventCountValue) {
            errors.push(
              `observations.upcomingEventCount (${upcomingEventCountValue}) must equal dated upcoming events (${upcoming}).`
            );
          }
          if (recent !== recentEventCountValue) {
            errors.push(
              `observations.recentEventCount (${recentEventCountValue}) must equal dated recent events (${recent}).`
            );
          }
          if (upcomingEventCountValue + recentEventCountValue !== eventCountValue) {
            errors.push(
              'observations.upcomingEventCount + recentEventCount must equal eventCount when all events are dated.'
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as IndexInclusionEventProxyArtifactV1,
  };
}
