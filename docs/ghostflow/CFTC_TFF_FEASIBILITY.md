# CFTC TFF / COT Feasibility Memo (GhostFlow v0.9c)

> **Current status:** Feasibility led to a **production display-only** CFTC artifact (`systematic-flow` card). Score input remains **MOCK 62**; **v1.0c** not approved. Body below is **historical** v0.9c research. See [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) and [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md).

**Status:** Research spike only — no scoring, merge, artifact JSON, or UI changes.  
**Target (future):** Replace static MOCK `systematicStrategyPressure` (currently **62** in `mockGhostflowSnapshot.ts`) with a **public weekly futures-positioning proxy**, not a CTA / vol-control / systematic-flow estimate.  
**Spike script:** `npm run ghostflow:cftc-tff-spike` → `scripts/ghostflow/cftc-tff-spike.ts`  
**Spike run:** 2026-05-27 (live PRE API sample succeeded)

---

## Official CFTC facts (preserve in all future copy)

| Fact | Implication for GhostFlow |
|------|---------------------------|
| COT positions generally reflect **Tuesday** close; reports release **Friday afternoon** | Weekly cadence; ~3 business-day publication lag vs “as of Tuesday” |
| [Public Reporting Environment (PRE)](https://publicreporting.cftc.gov/) supports filter, search, export, and **API** access | Manual artifact extract or scripted pull; no vendor license required for baseline |
| CFTC states API users generally succeed **without a token** if not overusing PRE | Spike uses unauthenticated SODA; rate-limit politely in any automation |
| **TFF** covers financial contracts including **stocks** and **VIX** | On-scope for equity mechanical-pressure proxy |
| TFF categories: **Dealer/Intermediary**, **Asset Manager/Institutional**, **Leveraged Funds**, **Other Reportables** | Default spike focuses on **Leveraged Funds**; not interchangeable with CTA labels |
| TFF is **long-format only** | One row per contract per report date; all trader classes as columns (not short “commercial/noncommercial” layout) |

Sources: [CFTC Commitments of Traders](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm), [PRE User’s Guide](https://publicreporting.cftc.gov/stories/s/User-s-Guide/p2fg-u73y/), [TFF Futures Only dataset](https://publicreporting.cftc.gov/Commitments-of-Traders/TFF-Futures-Only/gpe5-46if/about_data).

---

## 1. Candidate purpose

**Question:** Could CFTC TFF data support a public weekly futures-positioning proxy for `systematicStrategyPressure`?

**Answer:** **Yes, as a positioning proxy with heavy caveats** — not as measured systematic/CTA/vol-control *flow*.

- **Fit:** TFF reports **open interest and trader-class positions** on listed US equity-index and VIX futures weekly, with **changes** and **percent-of-OI** fields. That aligns with GhostFlow’s need for a **transparent, citable, non-proprietary** input that signals *crowded directional futures positioning* under a mechanical-pressure narrative.
- **Mismatch:** GhostFlow’s label today is “Systematic strategy pressure” (MOCK). CFTC **Leveraged Funds** are a **regulatory reporting bucket** (hedge funds, commodity trading advisors, etc.), not a clean map to trend-following CTAs, vol-targeting, or risk-parity. Any promotion must rename or caveat aggressively (e.g. “Leveraged-funds futures positioning proxy”).
- **Conclusion:** Suitable for a **v0.9d manual artifact** if mapping and copy are explicit; unsuitable to claim “systematic flow” without qualification.

---

## 2. Candidate contract universe

**Dataset used in spike:** **TFF — Futures Only** (`gpe5-46if`).  
**Alternate:** TFF Futures and Options Combined (`yw9f-hn96`) — not required for v0.9d if futures-only is the stated scope.

| User candidate | Available in TFF (Futures Only)? | Practical primary? | CFTC code (spike) | Notes |
|----------------|-------------------------------|--------------------|-------------------|-------|
| S&P 500 futures | Yes — `S&P 500 STOCK INDEX` | Lower liquidity vs E-mini | `138741` | Full-size; use if documenting “large contract” series |
| E-mini S&P 500 | Yes — `E-MINI S&P 500` | **Primary** | `13874A` | Highest OI among equity index; also `S&P 500 Consolidated` `13874+` |
| Nasdaq-100 | Yes — `NASDAQ-100 STOCK INDEX` | **Stale in FutOnly** | `209741` | Spike: last FutOnly row **2015-06-16**; use **NASDAQ MINI** instead |
| E-mini Nasdaq-100 | Yes — `NASDAQ MINI`, `MICRO E-MINI NASDAQ-100 INDEX` | **Primary mini** | `209742`, `209747` | Prefer **NASDAQ MINI** for liquidity; micro for granularity studies only |
| Russell 2000 | Yes — `RUSSELL 2000 STOCK INDEX` | Secondary | `239741`, `239777` | Multiple listings; avoid duplicate counting |
| E-mini Russell 2000 | Yes — `RUSSELL E-MINI`, `MICRO E-MINI RUSSELL 2000 INDX` | **Primary** | `239742`, `239747` | **RUSSELL E-MINI** `239742` used in spike |
| VIX futures | Yes — `VIX FUTURES` | **Amplifier / separate series** | `1170E1` | Volatility positioning; interpret separately from equity beta |

**Spike observation (2026-05-19 report date):** All four primary codes returned rows with `futonly_or_combined = 'FutOnly'`. Many sector/sub-index E-mini S&P slices exist (utilities, tech, etc.) — **exclude** from a core basket unless methodology explicitly widens scope.

**Design choice for v0.9d:** Start with a **3-contract equity basket** (ES + NQ mini + RTY mini) plus **optional VIX** context series, not a consolidated “S&P 500 Consolidated” row that may blend markets.

---

## 3. Candidate fields

**API:** Socrata SODA on `https://publicreporting.cftc.gov/resource/gpe5-46if.json`  
**Metadata:** `https://publicreporting.cftc.gov/api/views/gpe5-46if.json` (90 columns in spike)

| Need | Actual field name(s) in TFF Futures Only | Present? |
|------|------------------------------------------|----------|
| Report date / week | `report_date_as_yyyy_mm_dd`, `yyyy_report_week_ww` | Yes |
| Market / exchange | `market_and_exchange_names` | Yes |
| Contract name | `contract_market_name` | Yes |
| CFTC contract market code | `cftc_contract_market_code` | Yes |
| Open interest (all) | `open_interest_all` | Yes |
| Leveraged funds long | `lev_money_positions_long` | Yes |
| Leveraged funds short | `lev_money_positions_short` | Yes |
| Leveraged funds spreading | `lev_money_positions_spread` | Yes |
| Change in lev funds long | `change_in_lev_money_long` | Yes |
| Change in lev funds short | `change_in_lev_money_short` | Yes |
| Change in lev funds spread | `change_in_lev_money_spread` | Yes |
| % OI lev funds long | `pct_of_oi_lev_money_long` | Yes |
| % OI lev funds short | `pct_of_oi_lev_money_short` | Yes |
| % OI lev funds spread | `pct_of_oi_lev_money_spread` | Yes |

**Related fields (future):** Asset manager (`asset_mgr_*`), dealer (`dealer_*`), non-reportable (`nonrept_*`), total reportable changes, trader counts, concentration metrics — available but out of scope for v0.9d MVP.

**Types:** API returns numeric fields as **strings**; artifact pipeline must parse integers.

---

## 4. Candidate proxy formulas (proposals only — not implemented)

### 4.1 Per-contract leveraged funds net exposure

```
net_lev = lev_money_positions_long - lev_money_positions_short
```

**Caveats:** Spreading positions are real but not directional beta; ignoring spread overstates simplicity. Short-heavy ES is common (sample: ES net ≈ **−401k** contracts on 2026-05-19).

### 4.2 Net exposure as % of open interest

```
net_pct_oi = 100 * net_lev / open_interest_all
```

**Caveats:** Scale-free across contracts; still not comparable to “flow.” Spike sample ES **≈ −19.4%** OI (164k long − 566k short over 2.07M OI).

### 4.3 Weekly change in net exposure

```
Δnet_lev = change_in_lev_money_long - change_in_lev_money_short
```

**Caveats:** CFTC publishes **changes in long and short separately**; difference is not the same as change in (long−short) unless approximated. Good for *direction of positioning shift*, noisy for levels.

### 4.4 Optional equity-index basket pressure

Example (not chosen yet):

```
basket_net_pct = Σ w_i * net_pct_oi_i     for i ∈ {ES, NQ mini, RTY mini}, Σw = 1
```

Weights: OI-weighted or fixed (⅓ each). **Caveat:** Double-counting if consolidated + outright both included.

Map to 0–100 for `systematicStrategyPressure` via documented anchors (e.g. net_pct_oi ∈ [−25%, +25%] → clamped score). **Requires v0.9d calibration memo** — do not copy MOCK **62**.

### 4.5 Optional VIX futures amplifier / inverter

Use `1170E1` lev-funds net_pct_oi or Δnet as **vol-positioning context**:

- High lev-funds **long** VIX OI share → stress / convexity demand (may **amplify** structural fragility narrative).
- **Caveat:** VIX futures positioning ≠ VIX spot (`optionsVolatilityAmplifier` already uses CBOE VIX level). Do not merge without separate signal card or explicit sub-weight.

---

## 5. Feasibility conclusion

### Rating: **YELLOW** (promising; needs source/field/mapping decisions before artifact design)

| Criterion | Assessment |
|-----------|------------|
| API / access | **Green** — PRE SODA works without token in spike |
| Contract coverage | **Green** — ES, NQ mini, RTY mini, VIX identified with stable codes |
| Field completeness | **Green** — lev funds L/S/spread, OI, changes, %OI present |
| Semantic fit to “systematicStrategyPressure” | **Red** without relabeling — positioning ≠ flow; lev funds ≠ CTAs |
| Freshness / cadence | **Yellow** — weekly Tuesday/Friday; fits “weekly manual artifact” |
| GhostFlow guardrails | **Yellow** — needs schema, validation, freshness (≤7 days?), caveat copy, tests, badge |

**Not RED** because public data is available, fields are sufficient, and a defensible **weekly positioning proxy** is achievable with strict copy.

### Recommendation for v0.9d

**Proceed to v0.9d artifact design** with narrow scope:

1. **Manual weekly artifact** (operator extract from PRE or scripted CSV → committed JSON), not live API in `buildSnapshot` unless product explicitly approves feeds.
2. **Series:** TFF Futures Only; contracts `13874A`, `209742`, `239742`; optional parallel `1170E1` for context card only.
3. **Metric MVP:** OI-weighted **lev-funds net_pct_oi** basket + week-over-week **Δnet** as secondary display.
4. **Score label / methodology:** Replace implicit “systematic flow” with **“Leveraged-funds futures positioning proxy (CFTC TFF)”**.
5. **Freshness:** Treat `report_date_as_yyyy_mm_dd` as `asOf`; `publishedAt` = Friday release date (manual or derived).
6. **Do not** combine with `systematic-flow` PLACEHOLDER card without merging product copy.

---

## 6. Guardrails (required before any score wiring)

1. **Positioning is not flow** — open interest changes reflect positioning, not ETF issuance, retirement flows, or rebalance schedules.
2. **Leveraged Funds ≠ CTAs, vol-control, or risk-parity** — do not imply CFTC categories are strategy labels.
3. **Trader-classification buckets** — Dealer and Asset Manager categories measure different economic actors; do not blend without methodology.
4. **Public proxy only** — not a market-wide mechanical-flow ground truth.
5. **Promotion checklist** (from `DATA_ROADMAP.md`): artifact schema, `validate-artifacts`, merge in `buildSnapshot.ts`, 0–100 mapper + tests, UI PUBLIC badge + caveats, freshness rules, no scoring weight change without explicit approval.
6. **Research / education** — not a forecast or allocation signal.

---

## Spike appendix (2026-05-27)

**Endpoints tested**

| Purpose | URL |
|---------|-----|
| Row data (SODA) | `https://publicreporting.cftc.gov/resource/gpe5-46if.json` |
| Column metadata | `https://publicreporting.cftc.gov/api/views/gpe5-46if.json` |

**Primary contracts — latest report date in sample:** `2026-05-19` (Tuesday positions)

| Contract | Code | OI (all) | Lev long | Lev short | Net (L−S) | ~% OI net |
|----------|------|----------|----------|-----------|-----------|-----------|
| E-MINI S&P 500 | 13874A | 2,068,443 | 164,096 | 565,650 | −401,554 | −19.4% |
| NASDAQ MINI | 209742 | (see script) | — | — | — | — |
| RUSSELL E-MINI | 239742 | 421,242 | 63,365 | 130,794 | −67,429 | −16.0% |
| VIX FUTURES | 1170E1 | 440,161 | 76,102 | 128,006 | −51,904 | −11.8% |

Re-run `npm run ghostflow:cftc-tff-spike` for full console output including NASDAQ MINI rows and prior two report dates.

**Distinct search hits:** 37 contract name/code pairs matching S&P / Nasdaq / Russell / VIX filters (includes sector E-minis and dividend indices — filter in artifact design).

---

## Related

- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — v0.9c / v0.9d phases  
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — operator cadence (future TFF row)  
- CFTC PRE: [TFF Futures Only](https://publicreporting.cftc.gov/Commitments-of-Traders/TFF-Futures-Only/gpe5-46if/about_data)
