/**
 * Action Plan Copy
 * 
 * If you change Action Plan wording, do it here. Components should not embed copy.
 * 
 * This module centralizes copy used in the Builder's Action Plan section.
 */

/**
 * Template DNA labels
 */
export const ACTION_PLAN_TEMPLATE_DNA_LABEL = 'Template DNA:';
export const ACTION_PLAN_RISK_PINNED_LABEL = 'Risk: pinned to';
export const ACTION_PLAN_RISK_COMPUTED_LABEL = 'Risk: computed';
export const ACTION_PLAN_PRESET_LABEL = 'Preset:';
export const ACTION_PLAN_LINEUP_STYLE_LABEL = 'Lineup:';
export const ACTION_PLAN_GOLD_WRAPPER_LABEL = 'Gold wrapper:';
export const ACTION_PLAN_BTC_WRAPPER_LABEL = 'Bitcoin wrapper:';

/**
 * Preset display names
 */
export const PRESET_DISPLAY_NAMES: Record<string, string> = {
  standard: 'Standard',
  ghostregime_60_30_10: 'GhostRegime 60/30/10',
  ghostregime_60_25_15: 'GhostRegime 60/25/15',
};

/**
 * Lineup style display names
 */
export const LINEUP_STYLE_DISPLAY_NAMES: Record<string, string> = {
  standard: 'Standard',
  simplify: 'Simplify',
};

/**
 * Platform display names
 */
export const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  voya_only: 'Voya only',
  voya_and_schwab: 'Voya+Schwab',
};

/**
 * Tilt display names
 */
export const TILT_DISPLAY_NAMES: Record<string, string> = {
  none: 'None',
  gold10_btc5: '10% Gold / 5% Bitcoin',
  gold15_btc5: '15% Gold / 5% Bitcoin',
};

/**
 * Action Plan DNA parts
 */
export interface ActionPlanDnaParts {
  templateId: string;
  templateName: string;
  platform: 'voya_only' | 'voya_and_schwab';
  riskLevelOverride?: number;
  portfolioPreset?: string;
  schwabLineupStyle?: string;
  goldBtcTilt?: string;
  goldInstrument?: string;
  btcInstrument?: string;
}

/**
 * Build a canonical DNA string from template configuration parts
 * Returns a deterministic, stable-ordered string suitable for copying/sharing
 */
export function buildActionPlanDnaString(parts: ActionPlanDnaParts): string {
  const segments: string[] = [];

  // Template (always present)
  segments.push(`Template=${parts.templateName} (${parts.templateId})`);

  // Platform (always present)
  const platformDisplay = PLATFORM_DISPLAY_NAMES[parts.platform] || parts.platform;
  segments.push(`Platform=${platformDisplay}`);

  // Risk
  if (parts.riskLevelOverride !== undefined) {
    segments.push(`Risk=pinned:${parts.riskLevelOverride}`);
  } else {
    segments.push('Risk=computed');
  }

  // Preset
  if (parts.portfolioPreset) {
    const presetDisplay = PRESET_DISPLAY_NAMES[parts.portfolioPreset] || parts.portfolioPreset;
    segments.push(`Preset=${presetDisplay}`);
  }

  // Schwab lineup (only if platform is voya_and_schwab)
  if (parts.platform === 'voya_and_schwab' && parts.schwabLineupStyle) {
    const lineupDisplay = LINEUP_STYLE_DISPLAY_NAMES[parts.schwabLineupStyle] || parts.schwabLineupStyle;
    segments.push(`SchwabLineup=${lineupDisplay}`);
  }

  // Tilt (only if not "none" or if explicitly set)
  if (parts.goldBtcTilt && parts.goldBtcTilt !== 'none') {
    const tiltDisplay = TILT_DISPLAY_NAMES[parts.goldBtcTilt] || parts.goldBtcTilt;
    segments.push(`Tilt=${tiltDisplay}`);
  } else if (parts.goldBtcTilt === 'none') {
    segments.push('Tilt=None');
  }

  // Wrappers (only if non-default)
  if (parts.goldInstrument === 'ygld') {
    segments.push('Gold=YGLD');
  }
  if (parts.btcInstrument === 'maxi') {
    segments.push('BTC=MAXI');
  }

  return segments.join(' | ');
}

