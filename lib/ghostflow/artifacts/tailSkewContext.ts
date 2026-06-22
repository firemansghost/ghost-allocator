import tailSkewContextArtifactJson from '@/data/ghostflow/artifacts/tailSkewContext.v1.json';
import { evaluateDailyArtifactFreshness } from '@/lib/ghostflow/artifactFreshness';
import { GHOSTFLOW_REFERENCE_AS_OF } from '@/lib/ghostflow/reference';
import type {
  ArtifactFreshnessResult,
  TailSkewContextArtifactV1,
  TailSkewContextObservationsV1,
  TailSkewContextValidation,
} from './types';

export const TAIL_SKEW_EXAMPLE_ARTIFACT_PATH =
  'data/ghostflow/artifacts/tailSkewContext.v1.example.json';

/** Production artifact path — v1.9e.4. */
export const TAIL_SKEW_PRODUCTION_ARTIFACT_PATH =
  'data/ghostflow/artifacts/tailSkewContext.v1.json';

export const TAIL_SKEW_PROXY_SIGNAL_ID = 'tail-skew-context-proxy';
export const TAIL_SKEW_OBSERVATION_TYPE = 'cboe_skew_daily_snapshot';
export const TAIL_SKEW_SERIES_DEFINITION = 'cboe_skew_daily_index_level_v1';
export const TAIL_SKEW_CBOE_CSV_URL =
  'https://cdn.cboe.com/api/global/us_indices/daily_prices/SKEW_History.csv';
export const TAIL_SKEW_DISPLAY_SIGNAL_ID = 'tail-skew-context';
export const TAIL_SKEW_DISPLAY_SIGNAL_NAME = 'Tail Skew Context';

export const TAIL_SKEW_DISPLAY_CARD_CAVEAT =
  'Display-only tail-skew context. Not VIX, not 0DTE, not dealer gamma, and not a score input.';

export const SKEW_CHANGE_TOLERANCE = 0.01;
export const SKEW_PCT_TOLERANCE = 0.05;
export const MIN_HISTORY_ROW_COUNT = 252;

export type TailSkewValidationMode = 'example' | 'production';

export interface TailSkewValidateOptions {
  mode?: TailSkewValidationMode;
  referenceAsOf?: string;
}

const FORBIDDEN_FIELD_KEYS = [
  'publicPassiveInputKey',
  'basketScore',
  'mappedPressureScore',
  'candidatePressureScore',
  'score',
  'pressureScore',
  'tailRiskScore',
  'protectionBidScore',
  'numericValue',
  'gammaPressure',
  'gex',
  'dealerGamma',
  'zeroDte',
  'zeroDteShare',
  'zeroDteSharePct',
  'putCallRatio',
  'putCallVolume',
  'impliedCorrelation',
  'correlationDispersion',
  'cor1m',
] as const;

const FORBIDDEN_LANGUAGE_RULES: Array<{
  pattern: RegExp;
  negation?: RegExp;
  label: string;
}> = [
  { pattern: /\b0dte\b/i, negation: /\bnot[\s-]*0dte\b/i, label: '0DTE' },
  {
    pattern: /\bdealer\s+gamma\b/i,
    negation: /\bnot[\s-]*dealer\s+gamma\b/i,
    label: 'dealer gamma',
  },
  { pattern: /\bgex\b/i, negation: /\bnot[\s-]*gex\b/i, label: 'GEX' },
  {
    pattern: /\bgamma\b/i,
    negation: /\bnot[\s-]*(dealer\s+)?gamma\b/i,
    label: 'gamma',
  },
  {
    pattern: /correlation\s+dispersion/i,
    negation: /not\s+(implied\s+)?correlation\s+dispersion/i,
    label: 'correlation dispersion',
  },
  { pattern: /direct\s+put\s+volume/i, label: 'direct put volume' },
  {
    pattern: /\b(market\s+will|market\s+should|will\s+rally|will\s+fall)\b/i,
    label: 'market-direction prediction',
  },
  {
    pattern: /\btrading\s+signal\b/i,
    negation: /\bnot\s+(an?\s+)?trading\s+signal\b/i,
    label: 'trading recommendation',
  },
  {
    pattern: /\ballocation\s+recommendation\b/i,
    negation: /\bnot\s+(an?\s+)?allocation\s+recommendation\b/i,
    label: 'trading recommendation',
  },
  {
    pattern: /\bbuy\s+or\s+sell\b/i,
    label: 'trading recommendation',
  },
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
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

function normalizeValidateOptions(options?: TailSkewValidateOptions): {
  mode: TailSkewValidationMode;
  referenceAsOf?: string;
} {
  return {
    mode: options?.mode ?? 'example',
    referenceAsOf: options?.referenceAsOf,
  };
}

export function formatTailSkewCardValue(observations: TailSkewContextObservationsV1): string {
  return `SKEW index level: ${observations.currentSkew.toFixed(2)}`;
}

export function buildTailSkewDisplayExplanation(artifact: TailSkewContextArtifactV1): string {
  const { observations: o } = artifact;
  const changeSign = (o.dailyChange ?? 0) >= 0 ? '+' : '';
  const pctSign = (o.dailyChangePct ?? 0) >= 0 ? '+' : '';
  const changePart =
    isFiniteNumber(o.dailyChange) && isFiniteNumber(o.dailyChangePct)
      ? ` Session change ${changeSign}${o.dailyChange!.toFixed(2)} (${pctSign}${o.dailyChangePct!.toFixed(2)}%).`
      : '';
  const history = artifact.historySummary;
  const sourceTail =
    history?.latestSourceDate && isFiniteNumber(history.latestSourceValue)
      ? ` Source CSV extends through ${history.latestSourceDate} (${history.latestSourceValue.toFixed(2)}) — display context only.`
      : '';
  return (
    `${artifact.display?.body ?? 'Cboe SKEW tracks SPX tail-skew pricing context.'}${changePart}` +
    ` VIX remains the score-fed volatility level. mappingStatus: ${o.mappingStatus}; not included in the Research Composite.${sourceTail}`
  );
}

export function loadTailSkewContextArtifact(): TailSkewContextValidation {
  return validateTailSkewContextArtifact(tailSkewContextArtifactJson, {
    mode: 'production',
    referenceAsOf: GHOSTFLOW_REFERENCE_AS_OF,
  });
}

export function evaluateTailSkewArtifactFreshness(
  artifact: TailSkewContextArtifactV1,
  referenceAsOf: string = GHOSTFLOW_REFERENCE_AS_OF
): ArtifactFreshnessResult {
  return evaluateDailyArtifactFreshness(
    artifact.asOf,
    referenceAsOf,
    TAIL_SKEW_DISPLAY_SIGNAL_NAME
  );
}

export function computeTailSkewDailyChange(current: number, prior: number): number {
  return current - prior;
}

export function computeTailSkewDailyChangePct(change: number, prior: number): number {
  if (prior === 0) return 0;
  return (change / prior) * 100;
}

export function reconcileTailSkewDailyChange(
  currentSkew: number,
  priorSessionSkew: number,
  dailyChange: number
): boolean {
  return Math.abs(computeTailSkewDailyChange(currentSkew, priorSessionSkew) - dailyChange) <=
    SKEW_CHANGE_TOLERANCE;
}

export function reconcileTailSkewDailyChangePct(
  dailyChange: number,
  priorSessionSkew: number,
  dailyChangePct: number
): boolean {
  return (
    Math.abs(computeTailSkewDailyChangePct(dailyChange, priorSessionSkew) - dailyChangePct) <=
    SKEW_PCT_TOLERANCE
  );
}

function rejectForbiddenScoreFieldsRecursive(
  value: unknown,
  path: string,
  errors: string[]
): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      rejectForbiddenScoreFieldsRecursive(value[i], `${path}[${i}]`, errors);
    }
    return;
  }
  if (!isPlainObject(value)) return;

  for (const key of FORBIDDEN_FIELD_KEYS) {
    if (key in value && value[key] !== undefined && value[key] !== null) {
      errors.push(`${path} must not include ${key}.`);
    }
  }

  for (const [key, child] of Object.entries(value)) {
    rejectForbiddenScoreFieldsRecursive(child, `${path}.${key}`, errors);
  }
}

function checkForbiddenLanguage(text: string, fieldLabel: string, errors: string[]): void {
  for (const rule of FORBIDDEN_LANGUAGE_RULES) {
    if (!rule.pattern.test(text)) continue;
    if (rule.negation && rule.negation.test(text)) continue;
    errors.push(
      `${fieldLabel} must not make affirmative claims about ${rule.label}.`
    );
  }
}

function validateDisplayLanguage(raw: Record<string, unknown>, errors: string[]): void {
  const title = raw.title;
  if (typeof title === 'string') {
    checkForbiddenLanguage(title, 'title', errors);
  }

  const display = raw.display;
  if (isPlainObject(display)) {
    if (typeof display.headline === 'string') {
      checkForbiddenLanguage(display.headline, 'display.headline', errors);
    }
    if (typeof display.body === 'string') {
      checkForbiddenLanguage(display.body, 'display.body', errors);
    }
    if (typeof display.caveat === 'string') {
      checkForbiddenLanguage(display.caveat, 'display.caveat', errors);
    }
  }

  const caveats = raw.caveats;
  if (Array.isArray(caveats)) {
    for (let i = 0; i < caveats.length; i++) {
      const caveat = caveats[i];
      if (typeof caveat === 'string') {
        checkForbiddenLanguage(caveat, `caveats[${i}]`, errors);
      }
    }
  }
}

const EXAMPLE_ONLY_PATTERN = /example\s*\/\s*design\s*only/i;

function containsExampleOnlyText(text: string): boolean {
  return EXAMPLE_ONLY_PATTERN.test(text);
}

function rejectProductionSyntheticContent(
  raw: Record<string, unknown>,
  mode: TailSkewValidationMode,
  errors: string[]
): void {
  if (mode !== 'production') return;

  const source = raw.source;
  if (isPlainObject(source)) {
    const url = source.url;
    if (typeof url === 'string' && url.includes('example.com')) {
      errors.push('source.url must not contain example.com in production mode.');
    }
    if (typeof source.note === 'string' && containsExampleOnlyText(source.note)) {
      errors.push('source.note must not contain EXAMPLE / DESIGN ONLY in production mode.');
    }
  }

  const caveats = raw.caveats;
  if (Array.isArray(caveats)) {
    for (let i = 0; i < caveats.length; i++) {
      const caveat = caveats[i];
      if (typeof caveat === 'string' && containsExampleOnlyText(caveat)) {
        errors.push(
          `caveats[${i}] must not contain EXAMPLE / DESIGN ONLY in production mode.`
        );
      }
    }
  }
}

export function validateTailSkewContextArtifact(
  raw: unknown,
  options?: TailSkewValidateOptions
): TailSkewContextValidation {
  const { mode, referenceAsOf } = normalizeValidateOptions(options);
  const errors: string[] = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['Artifact must be a JSON object.'] };
  }

  rejectForbiddenScoreFieldsRecursive(raw, 'Artifact root', errors);

  if (raw.artifactVersion !== '1') {
    errors.push('artifactVersion must be "1".');
  }
  if (raw.signalId !== TAIL_SKEW_PROXY_SIGNAL_ID) {
    errors.push(`signalId must be "${TAIL_SKEW_PROXY_SIGNAL_ID}".`);
  }
  if (mode === 'example') {
    if (raw.designOnly !== true) {
      errors.push('designOnly must be true for example artifact (mode: example).');
    }
  } else if (raw.designOnly === true) {
    errors.push('designOnly must not be true for production artifact (mode: production).');
  }
  if (raw.updateFrequency !== 'daily') {
    errors.push('updateFrequency must be "daily".');
  }
  if (raw.observationType !== TAIL_SKEW_OBSERVATION_TYPE) {
    errors.push(`observationType must be "${TAIL_SKEW_OBSERVATION_TYPE}".`);
  }
  if (raw.seriesDefinition !== TAIL_SKEW_SERIES_DEFINITION) {
    errors.push(`seriesDefinition must be "${TAIL_SKEW_SERIES_DEFINITION}".`);
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

  const source = raw.source;
  if (!isPlainObject(source)) {
    errors.push('source must be an object with name and url.');
  } else {
    requireNonEmptyString('source.name', source.name, errors);
    if (source.url !== TAIL_SKEW_CBOE_CSV_URL) {
      errors.push(`source.url must equal locked Cboe SKEW CSV URL (${TAIL_SKEW_CBOE_CSV_URL}).`);
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

  const observations = raw.observations;
  if (!isPlainObject(observations)) {
    errors.push('observations must be an object.');
  } else {
    if (observations.mappingStatus !== 'not_final') {
      errors.push('observations.mappingStatus must be "not_final".');
    }

    const currentSkew = observations.currentSkew;
    if (!isFiniteNumber(currentSkew) || currentSkew <= 0) {
      errors.push('observations.currentSkew must be a finite number greater than zero.');
    }

    const priorSessionSkew = observations.priorSessionSkew;
    const dailyChange = observations.dailyChange;
    const dailyChangePct = observations.dailyChangePct;

    const hasPrior = isFiniteNumber(priorSessionSkew);
    const hasChange = isFiniteNumber(dailyChange);
    const hasChangePct = isFiniteNumber(dailyChangePct);

    if (hasPrior && hasChange && isFiniteNumber(currentSkew)) {
      if (!reconcileTailSkewDailyChange(currentSkew, priorSessionSkew, dailyChange)) {
        errors.push(
          'observations.dailyChange must reconcile with currentSkew - priorSessionSkew within tolerance.'
        );
      }
    }
    if (hasPrior && hasChange && hasChangePct) {
      if (!reconcileTailSkewDailyChangePct(dailyChange, priorSessionSkew, dailyChangePct)) {
        errors.push(
          'observations.dailyChangePct must reconcile with dailyChange / priorSessionSkew within tolerance.'
        );
      }
    }

    const latestObservation = observations.latestObservation;
    if (latestObservation !== undefined) {
      if (!isPlainObject(latestObservation)) {
        errors.push('observations.latestObservation must be an object when present.');
      } else {
        const obsDate = latestObservation.date;
        if (typeof obsDate !== 'string' || !parseIsoDate(obsDate)) {
          errors.push('observations.latestObservation.date must be a valid ISO date (YYYY-MM-DD).');
        } else if (
          typeof asOf === 'string' &&
          parseIsoDate(asOf) &&
          obsDate !== asOf
        ) {
          errors.push('observations.latestObservation.date must match asOf.');
        }
        const obsSkew = latestObservation.skew;
        if (!isFiniteNumber(obsSkew) || obsSkew <= 0) {
          errors.push(
            'observations.latestObservation.skew must be a finite number greater than zero.'
          );
        } else if (isFiniteNumber(currentSkew) && obsSkew !== currentSkew) {
          errors.push('observations.latestObservation.skew must match observations.currentSkew.');
        }
      }
    }
  }

  const historySummary = raw.historySummary;
  if (historySummary !== undefined) {
    if (!isPlainObject(historySummary)) {
      errors.push('historySummary must be an object when present.');
    } else {
      const rowCount = historySummary.rowCount;
      if (
        !isFiniteNumber(rowCount) ||
        !Number.isInteger(rowCount) ||
        rowCount < MIN_HISTORY_ROW_COUNT
      ) {
        errors.push(
          `historySummary.rowCount must be an integer >= ${MIN_HISTORY_ROW_COUNT}.`
        );
      }

      const latestSourceDate = historySummary.latestSourceDate;
      if (typeof latestSourceDate !== 'string' || !parseIsoDate(latestSourceDate)) {
        errors.push('historySummary.latestSourceDate must be a valid ISO date (YYYY-MM-DD).');
      } else if (
        typeof asOf === 'string' &&
        parseIsoDate(asOf) &&
        parseIsoDate(latestSourceDate) &&
        compareIso(latestSourceDate, asOf) < 0
      ) {
        errors.push('historySummary.latestSourceDate cannot be before asOf.');
      }

      const latestSourceValue = historySummary.latestSourceValue;
      if (!isPlainNumberPositive(latestSourceValue)) {
        errors.push(
          'historySummary.latestSourceValue must be a finite number greater than zero.'
        );
      }

      const firstDate = historySummary.firstDate;
      if (typeof firstDate !== 'string' || !parseIsoDate(firstDate)) {
        errors.push('historySummary.firstDate must be a valid ISO date (YYYY-MM-DD).');
      }
    }
  } else if (mode === 'production') {
    errors.push('historySummary is required for production artifact (mode: production).');
  }

  validateDisplayLanguage(raw, errors);
  rejectProductionSyntheticContent(raw, mode, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    artifact: raw as unknown as TailSkewContextArtifactV1,
  };
}

function isPlainNumberPositive(v: unknown): v is number {
  return isFiniteNumber(v) && v > 0;
}
