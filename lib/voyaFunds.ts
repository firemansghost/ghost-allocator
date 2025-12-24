/**
 * Canonical OKC Voya 457 fund menu.
 * 
 * This is the single source of truth for all Voya fund names, IDs, and metadata.
 * All UI dropdowns and recommended mixes should reference funds by their `id` from this list.
 * 
 * @see docs/voya-menu.md for a human-readable listing
 */

export interface VoyaFund {
  id: string; // stable slug used in code (snake_case)
  name: string; // display name
  ticker: string | null; // ticker symbol if available
  vehicle: 'Mutual Fund' | 'CIT' | 'Stable Value';
  group: 'Core' | 'Target Date';
  notes?: string; // optional long-form clarifications
}

/**
 * Full OKC Voya 457 fund menu (canonical list)
 */
export const VOYA_FUNDS: VoyaFund[] = [
  // Core funds
  {
    id: 'vanguard_windsor_ii_adm',
    name: 'Vanguard Windsor II Admiral',
    ticker: 'VWNAX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'northern_trust_sp500_index',
    name: 'Northern Trust S&P 500 Index Fund',
    ticker: null,
    vehicle: 'CIT',
    group: 'Core',
  },
  {
    id: 'fidelity_contrafund_k',
    name: 'Fidelity Contrafund K',
    ticker: 'FCNKX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'american_funds_american_balanced_r6',
    name: 'American Funds American Balanced R6',
    ticker: 'RLBGX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'columbia_overseas_value_cit',
    name: 'Columbia Overseas Value CIT Class R',
    ticker: null,
    vehicle: 'CIT',
    group: 'Core',
  },
  {
    id: 'jpmorgan_core_bond',
    name: 'JPMorgan Core Bond Fund',
    ticker: null,
    vehicle: 'CIT',
    group: 'Core',
  },
  {
    id: 'loomis_sayles_smallmid_cap_growth_n',
    name: 'Loomis Sayles Small/Mid Cap Growth N',
    ticker: 'LSMNX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'pimco_diversified_real_assets',
    name: 'PIMCO Diversified Real Assets Fund',
    ticker: null,
    vehicle: 'Mutual Fund',
    group: 'Core',
    notes: 'FYI: This fund invests in commodities, real estate, infrastructure, and natural resources. It can be volatile and is designed for inflation protection over the long term. Not a core holding for conservative investors.',
  },
  {
    id: 'pioneer_multi_sector_fixed_income_r1',
    name: 'Pioneer Multi-Sector Fixed Income Portfolio Class R1',
    ticker: 'WPIMRX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'ssga_all_country_world_exus_index',
    name: 'SSgA All Country World ex-US Index',
    ticker: null,
    vehicle: 'CIT',
    group: 'Core',
    notes: 'State Street Global All Cap Equity Ex U.S. Index Securities Lending Series Fund Class II',
  },
  {
    id: 'ssga_global_equity_index',
    name: 'SSgA Global Equity Index',
    ticker: null,
    vehicle: 'CIT',
    group: 'Core',
    notes: 'State Street Global Equity Index Fund',
  },
  {
    id: 'ssga_russell_smallmid_cap_index',
    name: 'SSgA Russell Small/Mid Cap Index',
    ticker: null,
    vehicle: 'CIT',
    group: 'Core',
    notes: 'State Street Russell Small/Mid Cap® Index Non-Lending Series Fund Class C',
  },
  {
    id: 'victory_integrity_smallmid_cap_value_r6',
    name: 'Victory Integrity Small/Mid Cap Value R6',
    ticker: 'MIRSX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'william_blair_international_leaders_r6',
    name: 'William Blair International Leaders R6',
    ticker: 'WILJX',
    vehicle: 'Mutual Fund',
    group: 'Core',
  },
  {
    id: 'stable_value_option',
    name: 'Stable Value Option',
    ticker: null,
    vehicle: 'Stable Value',
    group: 'Core',
  },
  
  // Target Date funds
  {
    id: 'vanguard_target_retirement_income',
    name: 'Vanguard Target Retirement Income',
    ticker: 'VTINX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2020',
    name: 'Vanguard Target Retirement 2020',
    ticker: 'VTWNX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2025',
    name: 'Vanguard Target Retirement 2025',
    ticker: 'VTTVX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2030',
    name: 'Vanguard Target Retirement 2030',
    ticker: 'VTHRX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2035',
    name: 'Vanguard Target Retirement 2035',
    ticker: 'VTTHX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2040',
    name: 'Vanguard Target Retirement 2040',
    ticker: 'VFORX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2045',
    name: 'Vanguard Target Retirement 2045',
    ticker: 'VTIVX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2050',
    name: 'Vanguard Target Retirement 2050',
    ticker: 'VFIFX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2055',
    name: 'Vanguard Target Retirement 2055',
    ticker: 'VFFVX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2060',
    name: 'Vanguard Target Retirement 2060',
    ticker: 'VTTSX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2065',
    name: 'Vanguard Target Retirement 2065',
    ticker: 'VLXVX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
  {
    id: 'vanguard_target_retirement_2070',
    name: 'Vanguard Target Retirement 2070',
    ticker: 'VSVNX',
    vehicle: 'Mutual Fund',
    group: 'Target Date',
  },
];

/**
 * Map of fund ID → VoyaFund for O(1) lookups
 */
export const VOYA_FUNDS_BY_ID = new Map<string, VoyaFund>(
  VOYA_FUNDS.map((fund) => [fund.id, fund])
);

/**
 * Core funds only (excludes Target Date funds)
 */
export const VOYA_CORE_FUNDS = VOYA_FUNDS.filter((f) => f.group === 'Core');

/**
 * Target Date funds only
 */
export const VOYA_TDF_FUNDS = VOYA_FUNDS.filter((f) => f.group === 'Target Date');

/**
 * Check if a fund is a target-date fund by ID
 */
export function isTargetDateFund(fundId: string): boolean {
  const fund = getFundById(fundId);
  return fund?.group === 'Target Date';
}

/**
 * Canonical classifier for "recommendation blacklist"
 * Returns true if the fund looks like a target-date fund by any detection method:
 * - fund.group === "Target Date"
 * - OR isTargetDateFund(fund.id)
 * - OR isTargetDateName(fund.name)
 */
export function looksLikeTargetDateFund(fund: VoyaFund): boolean {
  // Primary: group classification
  if (fund.group === 'Target Date') {
    return true;
  }
  
  // Secondary: ID-based check
  if (isTargetDateFund(fund.id)) {
    return true;
  }
  
  // Tertiary: name-based regex detection (catches mis-grouped funds)
  if (isTargetDateName(fund.name)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a fund name indicates it's a target-date fund
 * Uses strict regex patterns to catch common TDF naming without false positives
 */
export function isTargetDateName(name: string): boolean {
  const lower = name.toLowerCase();
  
  // Pattern A: "target" near "retirement/date" (Target Retirement, Target Date)
  const targetDatePattern = /\btarget\s*(date|retirement)\b/;
  if (targetDatePattern.test(lower)) {
    return true;
  }
  
  // Pattern B: "retirement" + a plausible year (20xx)
  const retirementYearPattern = /\bretirement\b.*\b20\d{2}\b|\b20\d{2}\b.*\bretirement\b/;
  if (retirementYearPattern.test(lower)) {
    return true;
  }
  
  // Pattern C: known glidepath series tokens (LifePath) + a year
  const lifepathPattern = /\blifepath\b.*\b20\d{2}\b/;
  if (lifepathPattern.test(lower)) {
    return true;
  }
  
  return false;
}

/**
 * Legacy ID mapping for backward compatibility.
 * Maps old fund IDs used in recommended mixes to new canonical IDs.
 */
export const LEGACY_ID_MAP: Record<string, string> = {
  'stable-value': 'stable_value_option',
  'core-bond': 'jpmorgan_core_bond',
  'multi-sector': 'pioneer_multi_sector_fixed_income_r1',
  'pioneer-multi-sector': 'pioneer_multi_sector_fixed_income_r1',
  'real-assets': 'pimco_diversified_real_assets',
  'sp500': 'northern_trust_sp500_index',
  'smallmid-index': 'ssga_russell_smallmid_cap_index',
  'intl-equity': 'ssga_all_country_world_exus_index',
};

/**
 * Resolves a fund ID (legacy or canonical) to the canonical ID.
 * Returns the canonical ID if found, otherwise returns the input unchanged.
 */
export function resolveFundId(id: string): string {
  return LEGACY_ID_MAP[id] || id;
}

/**
 * Gets a fund by ID (supports both legacy and canonical IDs).
 * Returns undefined if not found.
 */
export function getFundById(id: string): VoyaFund | undefined {
  const canonicalId = resolveFundId(id);
  return VOYA_FUNDS_BY_ID.get(canonicalId);
}

/**
 * Gets a fund's display name by ID (supports both legacy and canonical IDs).
 * Returns the ID if fund not found (fallback).
 */
export function getFundName(id: string): string {
  const fund = getFundById(id);
  return fund?.name || id;
}

/**
 * Formats a fund for display in dropdowns/lists.
 * Returns "Name (Ticker)" if ticker exists, otherwise just "Name".
 */
export function formatFundForDisplay(fund: VoyaFund): string {
  return fund.ticker ? `${fund.name} (${fund.ticker})` : fund.name;
}

/**
 * Validates that all fund IDs in a recommended mix exist in VOYA_FUNDS.
 * This is a dev-time sanity check to catch typos or missing funds.
 * 
 * @param mix Array of fund mix items with `id` fields
 * @returns Array of validation errors (empty if all valid)
 */
export function validateFundMix(
  mix: Array<{ id: string; name?: string }>
): string[] {
  const errors: string[] = [];
  
  for (const item of mix) {
    const canonicalId = resolveFundId(item.id);
    if (!VOYA_FUNDS_BY_ID.has(canonicalId)) {
      errors.push(
        `Invalid fund ID in mix: "${item.id}" (resolved to "${canonicalId}"). ` +
        `Fund name: "${item.name || 'unknown'}". ` +
        `This fund does not exist in VOYA_FUNDS.`
      );
    }
  }
  
  return errors;
}

