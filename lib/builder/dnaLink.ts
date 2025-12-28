/**
 * DNA Link Encoder/Decoder
 * 
 * Encodes template configuration into a shareable URL parameter and decodes it safely.
 * This allows users to share their exact template setup without screenshots.
 * 
 * Format: base64url-encoded JSON with version field
 * Only includes configuration fields (no personal info like age, yearsToGoal, etc.)
 */

import type { QuestionnaireAnswers } from '../types';

const DNA_VERSION = 1;

/**
 * Whitelist of fields that can be encoded in DNA links
 * These are the "configuration" fields that affect the plan output
 */
const DNA_WHITELIST = [
  'selectedTemplateId',
  'riskLevelOverride',
  'platform',
  'portfolioPreset',
  'schwabLineupStyle',
  'goldInstrument',
  'btcInstrument',
  'goldBtcTilt',
  'complexityPreference',
] as const;

type DnaField = (typeof DNA_WHITELIST)[number];

/**
 * Valid enum values for validation
 */
const VALID_PLATFORMS = ['voya_only', 'voya_and_schwab'] as const;
const VALID_PRESETS = ['standard', 'ghostregime_60_30_10', 'ghostregime_60_25_15'] as const;
const VALID_LINEUP_STYLES = ['standard', 'simplify'] as const;
const VALID_GOLD_INSTRUMENTS = ['gldm', 'ygld'] as const;
const VALID_BTC_INSTRUMENTS = ['fbtc', 'maxi'] as const;
const VALID_TILTS = ['none', 'gold10_btc5', 'gold15_btc5'] as const;
const VALID_COMPLEXITY = ['simple', 'moderate', 'advanced'] as const;
const VALID_RISK_LEVELS = [1, 2, 3, 4, 5] as const;

/**
 * Encode questionnaire answers into a DNA query string
 * Only includes whitelisted configuration fields
 */
export function encodeDnaToQuery(answers: Partial<QuestionnaireAnswers>): string {
  // Extract only whitelisted fields
  const dnaData: Record<string, unknown> = {
    v: DNA_VERSION,
  };

  for (const field of DNA_WHITELIST) {
    const value = answers[field];
    if (value !== undefined && value !== null) {
      dnaData[field] = value;
    }
  }

  // Convert to JSON and encode as base64url (no padding)
  const json = JSON.stringify(dnaData);
  const base64 = Buffer.from(json, 'utf-8').toString('base64');
  // Convert to base64url: replace + with -, / with _, remove padding
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return base64url;
}

/**
 * Decode DNA query string into partial questionnaire answers
 * Returns sanitized, validated partial answers
 */
export function decodeDnaFromQuery(
  dna: string
): { ok: true; answers: Partial<QuestionnaireAnswers> } | { ok: false; error: string } {
  try {
    // Decode base64url: restore padding if needed, then convert back
    let base64 = dna.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed (base64 requires length to be multiple of 4)
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }

    const json = Buffer.from(base64, 'base64').toString('utf-8');
    const data = JSON.parse(json);

    // Validate version
    if (data.v !== DNA_VERSION) {
      return { ok: false, error: `Unsupported DNA version: ${data.v}` };
    }

    // Build sanitized answers object with only whitelisted, validated fields
    const answers: Partial<QuestionnaireAnswers> = {};

    // Validate and include each whitelisted field
    if (data.selectedTemplateId && typeof data.selectedTemplateId === 'string') {
      answers.selectedTemplateId = data.selectedTemplateId;
    }

    if (data.riskLevelOverride !== undefined) {
      const risk = Number(data.riskLevelOverride);
      if (VALID_RISK_LEVELS.includes(risk as any)) {
        answers.riskLevelOverride = risk as typeof answers.riskLevelOverride;
      }
    }

    if (data.platform && VALID_PLATFORMS.includes(data.platform)) {
      answers.platform = data.platform;
    }

    if (data.portfolioPreset && VALID_PRESETS.includes(data.portfolioPreset)) {
      answers.portfolioPreset = data.portfolioPreset;
    }

    if (data.schwabLineupStyle && VALID_LINEUP_STYLES.includes(data.schwabLineupStyle)) {
      answers.schwabLineupStyle = data.schwabLineupStyle;
    }

    if (data.goldInstrument && VALID_GOLD_INSTRUMENTS.includes(data.goldInstrument)) {
      answers.goldInstrument = data.goldInstrument;
    }

    if (data.btcInstrument && VALID_BTC_INSTRUMENTS.includes(data.btcInstrument)) {
      answers.btcInstrument = data.btcInstrument;
    }

    if (data.goldBtcTilt && VALID_TILTS.includes(data.goldBtcTilt)) {
      answers.goldBtcTilt = data.goldBtcTilt;
    }

    if (data.complexityPreference && VALID_COMPLEXITY.includes(data.complexityPreference)) {
      answers.complexityPreference = data.complexityPreference;
    }

    return { ok: true, answers };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to decode DNA link',
    };
  }
}

