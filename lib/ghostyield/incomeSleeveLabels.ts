import type { YieldSleeveCategory } from './types';

/** Human-readable income sleeve (yield source theme), for table and detail panel. */
export const INCOME_SLEEVE_LABEL: Record<YieldSleeveCategory, string> = {
  cash_tbills: 'Cash / T-Bill Yield',
  credit_income: 'Credit Income',
  preferred_income: 'Preferred Income',
  cef_credit: 'CEF Credit',
  opportunistic_credit: 'Opportunistic Credit',
  special_situations_income: 'Special Situations',
  bdc_income: 'BDC Income',
  midstream_income: 'Midstream Income',
  natural_resources_income: 'Natural Resources Income',
  option_income: 'Option Income',
  crypto_yield_coming_soon: 'Crypto Yield (soon)',
};

export function incomeSleeveLabel(cat: YieldSleeveCategory): string {
  return INCOME_SLEEVE_LABEL[cat];
}
