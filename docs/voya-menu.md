# OKC Voya 457 Fund Menu

This document lists all funds available in the OKC Voya 457 plan menu.

**Canonical source:** `lib/voyaFunds.ts`

All fund IDs, names, and metadata are defined in `lib/voyaFunds.ts`. UI dropdowns and recommended mixes reference funds by their canonical `id` from this list.

## Core Funds

| Fund Name | Ticker | Vehicle | ID (canonical) |
|-----------|--------|---------|----------------|
| Vanguard Windsor II Admiral | VWNAX | Mutual Fund | `vanguard_windsor_ii_adm` |
| Northern Trust S&P 500 Index Fund | — | CIT | `northern_trust_sp500_index` |
| Fidelity Contrafund K | FCNKX | Mutual Fund | `fidelity_contrafund_k` |
| American Funds American Balanced R6 | RLBGX | Mutual Fund | `american_funds_american_balanced_r6` |
| Columbia Overseas Value CIT Class R | — | CIT | `columbia_overseas_value_cit` |
| JPMorgan Core Bond Fund | — | CIT | `jpmorgan_core_bond` |
| Loomis Sayles Small/Mid Cap Growth N | LSMNX | Mutual Fund | `loomis_sayles_smallmid_cap_growth_n` |
| PIMCO Diversified Real Assets Fund | — | Mutual Fund | `pimco_diversified_real_assets` |
| Pioneer Multi-Sector Fixed Income Portfolio Class R1 | WPIMRX | Mutual Fund | `pioneer_multi_sector_fixed_income_r1` |
| SSgA All Country World ex-US Index | — | CIT | `ssga_all_country_world_exus_index` |
| SSgA Global Equity Index | — | CIT | `ssga_global_equity_index` |
| SSgA Russell Small/Mid Cap Index | — | CIT | `ssga_russell_smallmid_cap_index` |
| Victory Integrity Small/Mid Cap Value R6 | MIRSX | Mutual Fund | `victory_integrity_smallmid_cap_value_r6` |
| William Blair International Leaders R6 | WILJX | Mutual Fund | `william_blair_international_leaders_r6` |
| Stable Value Option | — | Stable Value | `stable_value_option` |

### Notes

**PIMCO Diversified Real Assets Fund:**
FYI: This fund invests in commodities, real estate, infrastructure, and natural resources. It can be volatile and is designed for inflation protection over the long term. Not a core holding for conservative investors.

**SSgA All Country World ex-US Index:**
Full name: State Street Global All Cap Equity Ex U.S. Index Securities Lending Series Fund Class II

**SSgA Global Equity Index:**
Full name: State Street Global Equity Index Fund

**SSgA Russell Small/Mid Cap Index:**
Full name: State Street Russell Small/Mid Cap® Index Non-Lending Series Fund Class C

## Target Date Funds

| Fund Name | Ticker | Vehicle | ID (canonical) |
|-----------|--------|---------|----------------|
| Vanguard Target Retirement Income | VTINX | Mutual Fund | `vanguard_target_retirement_income` |
| Vanguard Target Retirement 2020 | VTWNX | Mutual Fund | `vanguard_target_retirement_2020` |
| Vanguard Target Retirement 2025 | VTTVX | Mutual Fund | `vanguard_target_retirement_2025` |
| Vanguard Target Retirement 2030 | VTHRX | Mutual Fund | `vanguard_target_retirement_2030` |
| Vanguard Target Retirement 2035 | VTTHX | Mutual Fund | `vanguard_target_retirement_2035` |
| Vanguard Target Retirement 2040 | VFORX | Mutual Fund | `vanguard_target_retirement_2040` |
| Vanguard Target Retirement 2045 | VTIVX | Mutual Fund | `vanguard_target_retirement_2045` |
| Vanguard Target Retirement 2050 | VFIFX | Mutual Fund | `vanguard_target_retirement_2050` |
| Vanguard Target Retirement 2055 | VFFVX | Mutual Fund | `vanguard_target_retirement_2055` |
| Vanguard Target Retirement 2060 | VTTSX | Mutual Fund | `vanguard_target_retirement_2060` |
| Vanguard Target Retirement 2065 | VLXVX | Mutual Fund | `vanguard_target_retirement_2065` |
| Vanguard Target Retirement 2070 | VSVNX | Mutual Fund | `vanguard_target_retirement_2070` |

## Using Fund IDs in Code

All recommended mixes in `lib/voya.ts` use canonical fund IDs. The `CurrentVoyaForm` component (`components/CurrentVoyaForm.tsx`) displays all funds grouped by Core vs Target Date.

### Helper Functions

- `getFundById(id: string)` - Get a fund by ID (supports legacy IDs via `LEGACY_ID_MAP`)
- `getFundName(id: string)` - Get a fund's display name by ID
- `resolveFundId(id: string)` - Resolve legacy ID to canonical ID
- `formatFundForDisplay(fund: VoyaFund)` - Format fund name with ticker for UI
- `validateFundMix(mix)` - Dev-time validation that all fund IDs exist

### Legacy ID Mapping

For backward compatibility, the following legacy IDs are automatically resolved to canonical IDs:

- `stable-value` → `stable_value_option`
- `core-bond` → `jpmorgan_core_bond`
- `multi-sector` / `pioneer-multi-sector` → `pioneer_multi_sector_fixed_income_r1`
- `real-assets` → `pimco_diversified_real_assets`
- `sp500` → `northern_trust_sp500_index`
- `smallmid-index` → `ssga_russell_smallmid_cap_index`
- `intl-equity` → `ssga_all_country_world_exus_index`

## See Also

- [Ghost sleeve overview](ghost-sleeve-overview.md) - How Ghost sleeves map to Voya funds
- [Flows documentation](flows.md) - How Voya fund mixes are computed and displayed



