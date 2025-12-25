import type {
  QuestionnaireAnswers,
  VoyaImplementation,
  VoyaFundMixItem,
  RiskLevel,
} from './types';
import { isHousePreset } from './houseModels';
import {
  getFundById,
  getFundName,
  validateFundMix,
  getTargetDateReasons,
} from './voyaFunds';

/**
 * Check if a recommended Voya mix contains target-date funds
 * Uses redundant detection (group + ID + name patterns) to catch any TDFs
 * Returns structured result for handling in dev vs production
 */
function assertNoTargetDateFundsInMix(
  mix: VoyaFundMixItem[],
  contextLabel: string
): { ok: boolean; offenders: Array<{ id: string; name: string; reason: string }> } {
  const offenders: Array<{ id: string; name: string; reason: string }> = [];
  
  for (const item of mix) {
    const fund = getFundById(item.id);
    if (!fund) {
      continue; // Skip invalid funds (will be caught by validateFundMix)
    }
    
    const reasons = getTargetDateReasons(fund);
    if (reasons.length > 0) {
      offenders.push({
        id: fund.id,
        name: fund.name,
        reason: reasons.join(', '),
      });
    }
  }
  
  if (offenders.length > 0) {
    const offenderList = offenders
      .map((o) => `  - ${o.name} (${o.id}): detected by ${o.reason}`)
      .join('\n');
    const message = `[voya.ts] ERROR: ${contextLabel} contains target-date fund(s):\n${offenderList}\n\nTarget-date funds are not allowed in recommended mixes.`;
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.error(message);
      throw new Error(message);
    } else {
      // Production: log error but don't throw
      console.error(message);
    }
  }
  
  return { ok: offenders.length === 0, offenders };
}

/**
 * Sanitize a recommended Voya mix to ensure no target-date funds
 * If TDFs are detected, replaces with a safe fallback mix
 * Note: assertNoTargetDateFundsInMix() already logs errors, so we only log a brief fallback message here
 */
function ensureRecommendedMixNoTdf(
  mix: VoyaFundMixItem[],
  riskLevel: RiskLevel,
  contextLabel: string
): { mix: VoyaFundMixItem[]; note: string | null } {
  const check = assertNoTargetDateFundsInMix(mix, contextLabel);
  
  if (check.ok) {
    return { mix, note: null };
  }
  
  // TDFs detected: use safe fallback (core mix is guaranteed non-TDF)
  const fallbackMix = _getCoreMixForRiskInternal(riskLevel);
  
  // Brief fallback message (detailed error already logged by assertNoTargetDateFundsInMix)
  if (process.env.NODE_ENV === 'production') {
    console.warn(`[voya.ts] Using fallback core mix for ${contextLabel} due to TDF detection`);
  }
  
  return {
    mix: fallbackMix,
    note: 'We detected a target-date fund in the plan menu and substituted a core mix recommendation.',
  };
}

/**
 * Returns a defensive-only Voya mix for house preset users (Voya+Schwab)
 * No real assets fund here because Gold is already doing that job on the Schwab side
 * This avoids "real assets in both places" confusion
 */
function getDefensiveOnlyMixForRisk(riskLevel: RiskLevel): VoyaFundMixItem[] {
  // Dev-time validation: ensure all fund IDs are valid
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const mix = _getDefensiveOnlyMixForRiskInternal(riskLevel);
    const errors = validateFundMix(mix);
    if (errors.length > 0) {
      console.error('[voya.ts] Invalid fund IDs in defensive-only mix:', errors);
    }
    const check = assertNoTargetDateFundsInMix(mix, 'defensive-only mix');
    if (!check.ok) {
      throw new Error('Defensive-only mix must not contain target-date funds');
    }
    return mix;
  }
  const mix = _getDefensiveOnlyMixForRiskInternal(riskLevel);
  const check = assertNoTargetDateFundsInMix(mix, 'defensive-only mix');
  if (!check.ok) {
    console.error('[voya.ts] Defensive-only mix contains TDFs (unexpected)');
  }
  return mix;
}

function _getDefensiveOnlyMixForRiskInternal(riskLevel: RiskLevel): VoyaFundMixItem[] {
  switch (riskLevel) {
    case 1: // very conservative / retirement
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 50,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 40,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 10,
        },
      ];

    case 2: // conservative
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 40,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 40,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 20,
        },
      ];

    case 4: // aggressive
    case 5: // very aggressive
      return [
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 50,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 30,
        },
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 20,
        },
      ];

    default: // 3 moderate
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 35,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 40,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 25,
        },
      ];
  }
}

/**
 * Returns a complementary Voya mix for Voya+Schwab users
 * This mix focuses on defensive + real-asset funds (no S&P / small-mid / intl)
 * since Schwab handles the equity risk
 */
function getComplementaryMixForRisk(riskLevel: RiskLevel): VoyaFundMixItem[] {
  // Dev-time validation: ensure all fund IDs are valid
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const mix = _getComplementaryMixForRiskInternal(riskLevel);
    const errors = validateFundMix(mix);
    if (errors.length > 0) {
      console.error('[voya.ts] Invalid fund IDs in complementary mix:', errors);
    }
    const check = assertNoTargetDateFundsInMix(mix, 'complementary mix');
    if (!check.ok) {
      throw new Error('Complementary mix must not contain target-date funds');
    }
    return mix;
  }
  const mix = _getComplementaryMixForRiskInternal(riskLevel);
  const check = assertNoTargetDateFundsInMix(mix, 'complementary mix');
  if (!check.ok) {
    console.error('[voya.ts] Complementary mix contains TDFs (unexpected)');
  }
  return mix;
}

function _getComplementaryMixForRiskInternal(riskLevel: RiskLevel): VoyaFundMixItem[] {
  switch (riskLevel) {
    case 1: // very conservative / retirement
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 45,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 35,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 10,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 10,
        },
      ];

    case 2: // conservative
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 35,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 35,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 15,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 15,
        },
      ];

    case 4: // aggressive
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 20,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 30,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 20,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 30,
        },
      ];

    case 5: // very aggressive
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 15,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 25,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 20,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 40,
        },
      ];

    default: // 3 = moderate
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 25,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 35,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 15,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 25,
        },
      ];
  }
}

/**
 * Returns a core-fund mix for a given risk level (for Voya-only users)
 * riskLevel mapping: 1=very conservative, 2=conservative, 3=moderate, 4=aggressive, 5=very aggressive
 * 
 * IMPORTANT: This function must NEVER return target-date funds in the recommended mix.
 * Target-date funds are only allowed as current holdings (user-entered).
 */
function getCoreMixForRisk(riskLevel: RiskLevel): VoyaFundMixItem[] {
  // Dev-time validation: ensure all fund IDs are valid and no target-date funds
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const mix = _getCoreMixForRiskInternal(riskLevel);
    const errors = validateFundMix(mix);
    if (errors.length > 0) {
      console.error('[voya.ts] Invalid fund IDs in core mix:', errors);
    }
    assertNoTargetDateFundsInMix(mix, 'core mix');
    return mix;
  }
  const mix = _getCoreMixForRiskInternal(riskLevel);
  assertNoTargetDateFundsInMix(mix, 'core mix');
  return mix;
}

function _getCoreMixForRiskInternal(riskLevel: RiskLevel): VoyaFundMixItem[] {
  switch (riskLevel) {
    case 1: // very conservative / retirement
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 30,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 30,
        },
        {
          id: 'pioneer_multi_sector_fixed_income_r1',
          name: getFundName('pioneer_multi_sector_fixed_income_r1'),
          role: 'Diversified fixed income',
          allocationPct: 10,
        },
        {
          id: 'northern_trust_sp500_index',
          name: getFundName('northern_trust_sp500_index'),
          role: 'US large-cap equity',
          allocationPct: 20,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 10,
        },
      ];

    case 2: // conservative
      return [
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 20,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 25,
        },
        {
          id: 'northern_trust_sp500_index',
          name: getFundName('northern_trust_sp500_index'),
          role: 'US large-cap equity',
          allocationPct: 25,
        },
        {
          id: 'ssga_russell_smallmid_cap_index',
          name: getFundName('ssga_russell_smallmid_cap_index'),
          role: 'US small/mid-cap equity',
          allocationPct: 10,
        },
        {
          id: 'ssga_all_country_world_exus_index',
          name: getFundName('ssga_all_country_world_exus_index'),
          role: 'International equity',
          allocationPct: 10,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 10,
        },
      ];

    case 4: // aggressive
    case 5: // very aggressive
      return [
        {
          id: 'northern_trust_sp500_index',
          name: getFundName('northern_trust_sp500_index'),
          role: 'US large-cap equity',
          allocationPct: 40,
        },
        {
          id: 'ssga_russell_smallmid_cap_index',
          name: getFundName('ssga_russell_smallmid_cap_index'),
          role: 'US small/mid-cap equity',
          allocationPct: 15,
        },
        {
          id: 'ssga_all_country_world_exus_index',
          name: getFundName('ssga_all_country_world_exus_index'),
          role: 'International equity',
          allocationPct: 15,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 15,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 15,
        },
      ];

    default: // 3 moderate
      return [
        {
          id: 'northern_trust_sp500_index',
          name: getFundName('northern_trust_sp500_index'),
          role: 'US large-cap equity',
          allocationPct: 35,
        },
        {
          id: 'ssga_russell_smallmid_cap_index',
          name: getFundName('ssga_russell_smallmid_cap_index'),
          role: 'US small/mid-cap equity',
          allocationPct: 10,
        },
        {
          id: 'ssga_all_country_world_exus_index',
          name: getFundName('ssga_all_country_world_exus_index'),
          role: 'International equity',
          allocationPct: 10,
        },
        {
          id: 'pimco_diversified_real_assets',
          name: getFundName('pimco_diversified_real_assets'),
          role: 'Real assets / inflation protection',
          allocationPct: 15,
        },
        {
          id: 'jpmorgan_core_bond',
          name: getFundName('jpmorgan_core_bond'),
          role: 'Core bond exposure',
          allocationPct: 20,
        },
        {
          id: 'stable_value_option',
          name: getFundName('stable_value_option'),
          role: 'Capital preservation / cash-like',
          allocationPct: 10,
        },
      ];
  }
}

/**
 * Builds a Voya implementation based on answers and risk level
 */
export function buildVoyaImplementation(
  answers: QuestionnaireAnswers,
  riskLevel: RiskLevel
): VoyaImplementation {
  const complexity = answers.complexityPreference ?? 'simple';
  const platform = answers.platform ?? 'voya_only';
  const isVoyaOnly = platform === 'voya_only';

  let rawMix: VoyaFundMixItem[];
  let description: string;

  if (isVoyaOnly) {
    // Voya-only: Voya has to play all roles.
    // NOTE: We no longer recommend target-date funds as they contradict the "post-60/40" premise.
    // Even for "simple" users, we provide a core mix of individual funds.
    // Target-date funds remain available for users to enter as current holdings.
    rawMix = getCoreMixForRisk(riskLevel);
    description =
      complexity === 'simple'
        ? 'Use a simple mix of core funds inside Voya that approximates your Ghost sleeve allocation.'
        : 'Use a small mix of core funds inside Voya that approximates your Ghost sleeve allocation.';
  } else {
    // Voya + Schwab: Check if house preset is selected
    const preset = answers.portfolioPreset ?? 'standard';
    const isHouseModel = isHousePreset(preset);

    if (isHouseModel) {
      // House preset: Voya stays defensive-only (no real assets) because Gold is already on Schwab side
      rawMix = getDefensiveOnlyMixForRisk(riskLevel);
      description =
        'Because your Schwab preset already includes Gold, the Voya portion stays defensive (stable value + bonds).';
    } else {
      // Standard preset: Schwab handles most of the equity risk; Voya is the safety + inflation bucket.
      rawMix = getComplementaryMixForRisk(riskLevel);
      description =
        'For your Voya slice, we tilt toward bonds, stable value, and real assets so Schwab handles most of the equity risk.';
    }
  }

  // Final gate: sanitize mix to ensure no TDFs (with fallback in production)
  const sanitized = ensureRecommendedMixNoTdf(
    rawMix,
    riskLevel,
    'buildVoyaImplementation output'
  );

  return {
    style: 'core_mix',
    description,
    mix: sanitized.mix,
    note: sanitized.note ?? undefined,
  };
}

