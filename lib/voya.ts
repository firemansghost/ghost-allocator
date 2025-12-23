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
  VOYA_TDF_FUNDS,
  validateFundMix,
} from './voyaFunds';

/**
 * Selects a target-date fund based on years to goal and risk level.
 * Returns the canonical fund name from VOYA_FUNDS.
 */
function pickTargetDateFund(
  yearsToGoal: number | null | undefined,
  riskLevel: RiskLevel
): string {
  // Use coarse bands; no need to be perfect.
  const y = yearsToGoal ?? 20;

  let fundId: string;
  if (y <= 5) {
    fundId = 'vanguard_target_retirement_income';
  } else if (y <= 10) {
    fundId = 'vanguard_target_retirement_2025';
  } else if (y <= 15) {
    fundId = 'vanguard_target_retirement_2030';
  } else if (y <= 20) {
    fundId = 'vanguard_target_retirement_2035';
  } else if (y <= 25) {
    fundId = 'vanguard_target_retirement_2040';
  } else if (y <= 30) {
    fundId = 'vanguard_target_retirement_2045';
  } else if (y <= 35) {
    fundId = 'vanguard_target_retirement_2050';
  } else if (y <= 40) {
    fundId = 'vanguard_target_retirement_2055';
  } else if (y <= 45) {
    fundId = 'vanguard_target_retirement_2060';
  } else if (y <= 50) {
    fundId = 'vanguard_target_retirement_2065';
  } else {
    fundId = 'vanguard_target_retirement_2070';
  }

  // Return canonical name from VOYA_FUNDS
  return getFundName(fundId);
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
    return mix;
  }
  return _getDefensiveOnlyMixForRiskInternal(riskLevel);
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
    return mix;
  }
  return _getComplementaryMixForRiskInternal(riskLevel);
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
 */
function getCoreMixForRisk(riskLevel: RiskLevel): VoyaFundMixItem[] {
  // Dev-time validation: ensure all fund IDs are valid
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const mix = _getCoreMixForRiskInternal(riskLevel);
    const errors = validateFundMix(mix);
    if (errors.length > 0) {
      console.error('[voya.ts] Invalid fund IDs in core mix:', errors);
    }
    return mix;
  }
  return _getCoreMixForRiskInternal(riskLevel);
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

  if (isVoyaOnly) {
    // Voya-only: Voya has to play all roles.
    if (complexity === 'simple') {
      const name = pickTargetDateFund(answers.yearsToGoal, riskLevel);
      return {
        style: 'simple_target_date',
        description:
          'Keep it simple with a single Vanguard Target Retirement fund inside the Voya core menu.',
        targetDateFundName: name,
      };
    }

    // moderate / advanced → existing all-in-one core mix
    return {
      style: 'core_mix',
      description:
        'Use a small mix of core funds inside Voya that approximates your Ghost sleeve allocation.',
      mix: getCoreMixForRisk(riskLevel),
    };
  }

  // Voya + Schwab: Check if house preset is selected
  const preset = answers.portfolioPreset ?? 'standard';
  const isHouseModel = isHousePreset(preset);

  if (isHouseModel) {
    // House preset: Voya stays defensive-only (no real assets) because Gold is already on Schwab side
    return {
      style: 'core_mix',
      description:
        'Because your Schwab preset already includes Gold, the Voya portion stays defensive (stable value + bonds).',
      mix: getDefensiveOnlyMixForRisk(riskLevel),
    };
  }

  // Standard preset: Schwab handles most of the equity risk; Voya is the safety + inflation bucket.
  return {
    style: 'core_mix',
    description:
      'For your Voya slice, we tilt toward bonds, stable value, and real assets so Schwab handles most of the equity risk.',
    mix: getComplementaryMixForRisk(riskLevel),
  };
}

