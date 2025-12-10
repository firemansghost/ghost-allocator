import type {
  QuestionnaireAnswers,
  VoyaImplementation,
  VoyaFundMixItem,
  RiskLevel,
} from './types';

// All fund names taken from the OKCFD Voya 457 menu.
const TARGET_DATE_FUNDS = [
  'Vanguard Target Retirement Income Fund',
  'Vanguard Target Retirement 2020 Fund',
  'Vanguard Target Retirement 2025 Fund',
  'Vanguard Target Retirement 2030 Fund',
  'Vanguard Target Retirement 2035 Fund',
  'Vanguard Target Retirement 2040 Fund',
  'Vanguard Target Retirement 2045 Fund',
  'Vanguard Target Retirement 2050 Fund',
  'Vanguard Target Retirement 2055 Fund',
  'Vanguard Target Retirement 2060 Fund',
  'Vanguard Target Retirement 2065 Fund',
  'Vanguard Target Retirement 2070 Fund',
];

/**
 * Selects a target-date fund based on years to goal and risk level
 */
function pickTargetDateFund(
  yearsToGoal: number | null | undefined,
  riskLevel: RiskLevel
): string {
  // Use coarse bands; no need to be perfect.
  const y = yearsToGoal ?? 20;

  if (y <= 5) {
    return 'Vanguard Target Retirement Income Fund';
  } else if (y <= 10) {
    return 'Vanguard Target Retirement 2025 Fund';
  } else if (y <= 15) {
    return 'Vanguard Target Retirement 2030 Fund';
  } else if (y <= 20) {
    return 'Vanguard Target Retirement 2035 Fund';
  } else if (y <= 25) {
    return 'Vanguard Target Retirement 2040 Fund';
  } else if (y <= 30) {
    return 'Vanguard Target Retirement 2045 Fund';
  } else if (y <= 35) {
    return 'Vanguard Target Retirement 2050 Fund';
  } else if (y <= 40) {
    return 'Vanguard Target Retirement 2055 Fund';
  } else if (y <= 45) {
    return 'Vanguard Target Retirement 2060 Fund';
  } else if (y <= 50) {
    return 'Vanguard Target Retirement 2065 Fund';
  } else {
    return 'Vanguard Target Retirement 2070 Fund';
  }
}

/**
 * Returns a complementary Voya mix for Voya+Schwab users
 * This mix focuses on defensive + real-asset funds (no S&P / small-mid / intl)
 * since Schwab handles the equity risk
 */
function getComplementaryMixForRisk(riskLevel: RiskLevel): VoyaFundMixItem[] {
  switch (riskLevel) {
    case 1: // very conservative / retirement
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 45,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 35,
        },
        {
          id: 'multi-sector',
          name: 'Pioneer Multi-Sector Fixed Income Fund CL R1',
          role: 'Diversified fixed income',
          allocationPct: 10,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 10,
        },
      ];

    case 2: // conservative
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 35,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 35,
        },
        {
          id: 'multi-sector',
          name: 'Pioneer Multi-Sector Fixed Income Fund CL R1',
          role: 'Diversified fixed income',
          allocationPct: 15,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 15,
        },
      ];

    case 4: // aggressive
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 20,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 30,
        },
        {
          id: 'multi-sector',
          name: 'Pioneer Multi-Sector Fixed Income Fund CL R1',
          role: 'Diversified fixed income',
          allocationPct: 20,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 30,
        },
      ];

    case 5: // very aggressive
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 15,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 25,
        },
        {
          id: 'multi-sector',
          name: 'Pioneer Multi-Sector Fixed Income Fund CL R1',
          role: 'Diversified fixed income',
          allocationPct: 20,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 40,
        },
      ];

    default: // 3 = moderate
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 25,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 35,
        },
        {
          id: 'multi-sector',
          name: 'Pioneer Multi-Sector Fixed Income Fund CL R1',
          role: 'Diversified fixed income',
          allocationPct: 15,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
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
  switch (riskLevel) {
    case 1: // very conservative / retirement
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 30,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 30,
        },
        {
          id: 'pioneer-multi-sector',
          name: 'Pioneer Multi-Sector Fixed Income Fund CL R1',
          role: 'Diversified fixed income',
          allocationPct: 10,
        },
        {
          id: 'sp500',
          name: 'Northern Trust S&P 500 Index Fund',
          role: 'US large-cap equity',
          allocationPct: 20,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 10,
        },
      ];

    case 2: // conservative
      return [
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
          role: 'Capital preservation / cash-like',
          allocationPct: 20,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 25,
        },
        {
          id: 'sp500',
          name: 'Northern Trust S&P 500 Index Fund',
          role: 'US large-cap equity',
          allocationPct: 25,
        },
        {
          id: 'smallmid-index',
          name: 'SSgA Russell Small/Mid Cap Index Fund',
          role: 'US small/mid-cap equity',
          allocationPct: 10,
        },
        {
          id: 'intl-equity',
          name: 'SSgA All Country World ex-US Index Fund',
          role: 'International equity',
          allocationPct: 10,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 10,
        },
      ];

    case 4: // aggressive
    case 5: // very aggressive
      return [
        {
          id: 'sp500',
          name: 'Northern Trust S&P 500 Index Fund',
          role: 'US large-cap equity',
          allocationPct: 40,
        },
        {
          id: 'smallmid-index',
          name: 'SSgA Russell Small/Mid Cap Index Fund',
          role: 'US small/mid-cap equity',
          allocationPct: 15,
        },
        {
          id: 'intl-equity',
          name: 'SSgA All Country World ex-US Index Fund',
          role: 'International equity',
          allocationPct: 15,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 15,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 15,
        },
      ];

    default: // 3 moderate
      return [
        {
          id: 'sp500',
          name: 'Northern Trust S&P 500 Index Fund',
          role: 'US large-cap equity',
          allocationPct: 35,
        },
        {
          id: 'smallmid-index',
          name: 'SSgA Russell Small/Mid Cap Index Fund',
          role: 'US small/mid-cap equity',
          allocationPct: 10,
        },
        {
          id: 'intl-equity',
          name: 'SSgA All Country World ex-US Index Fund',
          role: 'International equity',
          allocationPct: 10,
        },
        {
          id: 'real-assets',
          name: 'PIMCO Diversified Real Assets Fund',
          role: 'Real assets / inflation protection',
          allocationPct: 15,
        },
        {
          id: 'core-bond',
          name: 'JPMorgan Core Bond Fund',
          role: 'Core bond exposure',
          allocationPct: 20,
        },
        {
          id: 'stable-value',
          name: 'Stable Value Option Fund',
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

  // Voya + Schwab: Schwab handles most of the equity risk; Voya is the safety + inflation bucket.
  return {
    style: 'core_mix',
    description:
      'For your Voya slice, we tilt toward bonds, stable value, and real assets so Schwab handles most of the equity risk.',
    mix: getComplementaryMixForRisk(riskLevel),
  };
}

