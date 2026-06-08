# Treasury Plumbing Feasibility Memo (GhostFlow v1.7a)

## v1.7 release checkpoint

- **Treasury Plumbing is live** as a **separate display-only dashboard lane** (v1.7e) with **two production-backed cards**: `treasury-futures-positioning-proxy` and `treasury-long-end-income-lens`.
- **Outside the equity Research Composite** — not in `buildSnapshot`, `raw.signals`, `meta.publicSignals`, or `PUBLIC_ARTIFACT_SIGNAL_IDS`.
- **No score impact** — Composite / Passive / Structural unchanged; Treasury does **not** affect `publicSignalCount` (**10** equity only; do **not** combine with Treasury **2**).
- **v1.7f mapping decision** — [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) selected **display-only** for both artifacts; `mappingStatus` **not_final**; no mapper / no status bands.
- **v1.7g score gate** — **not approved**; remains discouraged.
- **Optional future only** — v1.7f-calibration (research); v1.7f.1 display percentiles.

## Status (v1.7a — historical feasibility baseline)

*The bullets below describe the **v1.7a starting posture** before production, UI, and mapping phases. They are preserved for feasibility context.*

- **v1.7a feasibility only** — initial docs-only pass; no production wiring at that time.
- **No scoring** — Research Composite, Passive Pressure, and Structural Fragility unchanged (still true in v1.7).
- **Artifacts / UI** — deferred in v1.7a; **shipped** in v1.7b–e (design → production → display lane).
- **v1.7a.1 research spike** — `npm run ghostflow:treasury-cftc-pre-spike` (contract discovery; not in `ghostflow:check`).
- **Treasury Plumbing is a separate lane** — never merged into equity `publicSignalCount` or Passive Pressure.

---

## Executive recommendation

1. **Treasury Plumbing is worth pursuing as a separate lane** — Treasury futures positioning stress and long-end income neglect are distinct from equity passive-pressure mechanics and deserve their own display-only research section when product approves later phases.
2. **v1.7a should not ship cards or artifacts** — feasibility and architecture only; defer artifact design to v1.7b–c and UI to v1.7e.
3. **Treasury Basis Trade Stress** is feasible only as a **public proxy**, not full basis-trade measurement — CFTC Treasury futures positioning plus funding/vol/OI context can signal crowded relative-value positioning, not cash-futures basis or repo specialness directly.
4. **Bond Neglect / Long-End Income Lens** is **more source-feasible** (FRED yields, curve, breakevens) but carries **higher interpretation and advice risk** — must stay display-only with explicit “not a recommendation to buy bonds” copy.
5. **Both subcards should remain display-only by default** in future phases — labels: Public proxy, Manual, Display-only, Not scored.
6. **Do not merge Treasury Plumbing into the equity GhostFlow Research Composite** — no `publicPassiveInputKey`, no blend into Passive Pressure or Structural Fragility, no `buildSnapshot` merge.

---

## Current GhostFlow overlap audit

| Existing GhostFlow item | What it covers | Overlap with Treasury Plumbing | Boundary |
|-------------------------|----------------|--------------------------------|----------|
| **CFTC TFF equity-index positioning** | ES / NQ / RTY / VIX leveraged-funds proxy via PRE `gpe5-46if`; production artifact `systematicFlowProxy.v1.json`; weekly manual cadence | **Pattern reuse only** — same PRE API and manual-artifact discipline; **different contract universe** (UST 2Y/5Y/10Y/30Y, etc.) | Treasury CFTC requires **dedicated contract discovery** (v1.7a.1 / v1.7b); **do not relabel or extend** the equity `systematic-flow` card |
| **`systematic-flow` display-only card** | “CFTC leveraged-funds positioning proxy” for **equity index** futures | Narrative overlap (“crowded positioning”) but **wrong instrument** for Treasury basis stress | Keep equity card; future Treasury card is a **new signal id** in a **separate UI section** |
| **VIX / `optionsVolatilityAmplifier`** | CBOE VIX → scored options/vol slot (20% Passive Pressure) | Vol stress is **correlated** with risk-off and funding episodes but **not Treasury-specific** | Do not substitute VIX for Treasury basis or long-end income lenses |
| **`options-activity-proxy`** | OCC Index/Others display-only; not 0DTE/GEX | None for Treasury plumbing | Unrelated lane |
| **Passive Endgame Scenarios** | Educational six-scenario ladder; scenario 5 mentions policy/Treasury narrative | **Conceptual** link to “policy intervention / market repair” — not a data feed | Treasury Plumbing **live** as separate display-only lane (v1.7e); see [mapping decision](./TREASURY_PLUMBING_MAPPING_DECISION.md) |
| **GhostFlow Watchlist** | Forward-looking research targets | Treasury shipped v1.7e; optional calibration / v1.7g gated | Display-only; not in `publicSignalCount` |
| **GhostRegime TLT / IEF references** (if present in product) | Regime tooling outside GhostFlow composite | **Out of GhostFlow scope** for v1.7a | Do not wire GhostRegime series into GhostFlow score or artifacts in this lane |

**Clear statements:**

- Existing **CFTC PRE infrastructure** (`cftc-tff-spike.ts`, TFF feasibility memos, manual artifact pattern) provides a **reusable research pattern** for weekly public extracts.
- **Treasury futures contract discovery complete (v1.7a.1)** — equity spike codes (e.g. `13874A`) do not transfer; UST futures use separate PRE names/codes (see v1.7a.1 findings below).
- **Treasury CFTC must not relabel or extend** the existing **`systematic-flow`** equity card — that card stays equity-index-only per [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md).

---

## Treasury Basis Trade Stress feasibility

**Purpose (future):** Public proxy for leveraged Treasury **futures** positioning and financing-dependent relative-value stress — **not** measurement of the full cash-futures basis trade.

**Approved user-facing copy (future display):**

> Tracks public proxies for leveraged Treasury futures positioning. This does not measure the full basis trade, but it helps show when Treasury relative-value positioning may be crowded and dependent on cheap financing.

### Source table

| Source | Availability | Cadence | Expected fields | Basis-trade support | Manual artifact feasibility | Display suitability | Scoring suitability |
|--------|--------------|---------|-----------------|---------------------|----------------------------|---------------------|---------------------|
| **CFTC TFF / PRE — Treasury futures** | Live public (PRE API) | Weekly (Tue close → Fri release) | Contract name/code, OI, Leveraged Funds / Asset Manager positions & changes, % OI | **Proxy** — futures positioning only; not cash-futures basis | **Feasible after contract discovery** | **High** — citable, weekly | **Discouraged** — overlaps equity systematic narrative; display-only default |
| **CFTC legacy COT — Treasury futures** | Public manual / API | Weekly | Commercial / non-commercial style buckets (legacy layout) | **Proxy** — coarser categories than TFF | Feasible; prefer TFF for consistency | Medium — category confusion risk | Discouraged |
| **OFR Hedge Fund Monitor** | Public manual (reports) | Quarterly / episodic | HF gross leverage, Treasury exposure aggregates (where published) | **Proxy** — fund-level, lagged | Low–medium — PDF/table extract | Medium — narrative context | Not suitable for weekly score |
| **SOFR / repo / funding stress proxies** | Live public (FRED, NY Fed) | Daily–weekly | SOFR, EFFR spread, GC repo indicators, FRA-OIS where available | **Proxy** — financing conditions, not position-level basis | Feasible as secondary context fields | **High** for “cheap financing” narrative | **Poor** — macro overlap with vol/risk-off |
| **Treasury volatility / MOVE** | Mixed — index levels may be **paid/proprietary** (ICE BofA MOVE); some vol via futures/options | Daily | Index level, changes | **Proxy** — stress amplifier | Manual snapshot if licensed; else avoid | Medium — licensing risk | Discouraged |
| **Treasury futures open interest** | Live public (CFTC PRE, exchange stats) | Weekly / daily | OI by contract, changes | **Proxy** — positioning depth | Feasible alongside TFF extract | High as supporting field | Discouraged alone |
| **Primary dealer / financing data** | Public manual (Fed H.4.1, dealer surveys); some series delayed | Weekly / monthly | Dealer positioning, repo volumes (where published) | **Proxy** — indirect | Medium — operator burden | Medium — expert audience | Not suitable |
| **FRED stress proxies** (e.g. yield curve, credit spreads, financial conditions) | Live public | Daily–monthly | Yields, spreads, NFCI | **Proxy** — macro context only | Feasible | Medium — support lens only | Poor — duplicates other pillars |

**Conclusion — Treasury Basis Trade Stress:** **YELLOW → GREEN (CFTC path, v1.7a.1)** — TFF Futures Only (`gpe5-46if`) exposes liquid **UST** note/bond contracts with full leveraged-funds and asset-manager fields at weekly cadence. Proceed to **v1.7b** artifact design (example JSON only) with proxy copy and basket dedup rules. Still **not** full basis-trade measurement; still **not** an extension of equity `systematic-flow`.

---

## v1.7a.1 — Treasury CFTC PRE spike (research only)

**Script:** `npm run ghostflow:treasury-cftc-pre-spike` → [`scripts/ghostflow/treasury-cftc-pre-spike.ts`](../scripts/ghostflow/treasury-cftc-pre-spike.ts)

**Scope:** Research-only contract discovery for a future Treasury Basis Trade Stress display-only proxy. Console output by default; optional `--out` under `data/ghostflow/research/` (gitignored). **Not** in `ghostflow:check`. **Does not** measure the full cash-futures basis trade, repo specialness, CTD, or financing terms.

### Dataset queried

| Item | Value |
|------|--------|
| Primary | **TFF — Futures Only** `gpe5-46if` |
| Endpoint | `https://publicreporting.cftc.gov/resource/gpe5-46if.json` |
| Alternate (if gaps) | TFF Futures+Options `yw9f-hn96` — not required after v1.7a.1 run |
| Latest report date (spike run) | **2026-05-26** (week 2026 Report Week 21) |

### Field availability (metadata + rows)

| Field group | Status |
|-------------|--------|
| Report date / week | Present (`report_date_as_yyyy_mm_dd`, `yyyy_report_week_ww`) |
| Contract identity | Present (`contract_market_name`, `cftc_contract_market_code`, `commodity_name`) |
| Open interest | Present (`open_interest_all`) |
| Leveraged funds L/S/spread/changes/%OI | **All present** (12 columns) |
| Asset manager L/S/spread/changes/%OI | **All present** on UST rows (12 columns) |

**Search note:** CFTC uses short names (`UST 10Y NOTE`, `T-NOTES` commodity) — not long strings like `10-YEAR U.S. TREASURY NOTES`. Default spike search includes `UST`, `T-NOTE`, `T-NOTES`, `T-BOND`, and searches both `contract_market_name` and `commodity_name`.

### Discovered Treasury futures (FutOnly, Tier 1–eligible)

| Contract | CFTC code | Commodity | Latest report |
|----------|-----------|-----------|---------------|
| UST 2Y NOTE | `042601` | T-NOTES, 1-2 YEAR | 2026-05-26 |
| UST 5Y NOTE | `044601` | T-NOTES, 4-6 YEAR | 2026-05-26 |
| UST 10Y NOTE | `043602` | T-NOTES, 6.5-10 YEAR | 2026-05-26 |
| ULTRA UST 10Y | `043607` | T-NOTES, 6.5-10 YEAR | 2026-05-26 |
| UST BOND | `020601` | T-BONDS | 2026-05-26 |
| ULTRA UST BOND / ULTRA US T BOND | `020604` | T-BONDS | 2026-05-26 |

**Sample positioning (2026-05-26, leveraged funds net % OI):** 2Y **−35.7%** · 5Y **−30.2%** · 10Y **−32.1%** · Ultra 10Y **−8.8%** · UST Bond **−16.0%** · Ultra Bond **−34.4%** — all **net_short** vs 1.0 pp flat threshold. Asset managers net **long** on the same contracts (display context only).

### Recommended Tier 1 basket (v1.7b design — one listing per tenor)

| Tenor | Primary code | Alternate (context / do not double-count OI) |
|-------|--------------|-----------------------------------------------|
| 2Y | `042601` UST 2Y NOTE | — |
| 5Y | `044601` UST 5Y NOTE | — |
| 10Y | `043602` UST 10Y NOTE | `043607` ULTRA UST 10Y (pick one for basket OI) |
| Long bond | `020601` UST BOND | `020604` ULTRA UST BOND (pick one for basket OI) |

**Deferred:** 3Y UST note — no distinct FutOnly row in discovery search. **Excluded from basket:** DTCC Repo, ERIS swaps, MICRO 10 YEAR YIELD, Eurodollar legacy.

**Funding context (separate future lens, not default basis basket):** FED FUNDS `045601`, SOFR `134741`/`134742`, ERIS SOFR swaps — spike lists under funding-context bucket when searched.

### Feasibility verdict (v1.7a.1)

**GREEN** — ≥3 Tier-1 UST contracts with full leveraged-funds fields and report within 21 days of run.

**v1.7b gate:** ~~Proceed to artifact design~~ **Done** — [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) + example JSON + validator/tests. Production artifact → **v1.7d**; UI lane → **v1.7e**.

---

## Bond Neglect / Long-End Income Lens feasibility

**Purpose (future):** Display-only check on whether long-duration Treasury **income** is being ignored despite meaningful nominal or real yields — **not** allocation advice.

**Approved user-facing copy (future display):**

> Tracks whether long-duration Treasury income is being ignored despite historically meaningful nominal or real yields. This is not a recommendation to buy bonds. It is a plumbing check on whether narrative fear may be overpowering income math.

### Source table

| Source | Availability | Cadence | Public / manual feasibility | Display-card suitability | Interpretation risk | Caveats |
|--------|--------------|---------|----------------------------|--------------------------|---------------------|---------|
| **30-year Treasury yield** | Live public (FRED `DGS30`) | Daily | **High** — trivial manual snapshot | **High** | Medium — “high yield” is regime-relative | Nominal only; not real return |
| **30-year TIPS real yield** | Live public (FRED `DFII30`) | Daily | **High** | **High** | Medium | Liquidity/premium noise |
| **2s30s / 5s30s curve** | Live public (FRED spreads) | Daily | **High** | **High** | Medium — steepener/flattener narratives | Not neglect alone |
| **Treasury term premium** (e.g. NY Fed ACM) | Public manual / model | Monthly | Medium — model revision risk | Medium | **High** — model dependence | Not real-time |
| **Inflation breakevens** (5Y5Y, 10Y) | Live public (FRED) | Daily | **High** | Medium | Medium — inflation vs income confusion | Separate from neglect |
| **TLT / long-duration Treasury ETF flows** | Mixed — flows often **paid/proprietary**; AUM public on fund sites | Daily / monthly | Low–medium without vendor | Medium | **High** — sounds like “buy TLT” | ETF ≠ cash Treasury |
| **Long-duration Treasury ETF AUM** | Public manual (issuer factsheets) | Monthly | Medium | Medium | High | Single-fund bias |
| **ICI bond fund flows** | Public manual (ICI tables) | Weekly / monthly | Medium — table extract like equity flows | Medium | **High** — flows ≠ neglect | Different product mix than Treasuries |

**Conclusion — Bond Neglect / Long-End Income Lens:** **YELLOW–GREEN** for **display-only** feasibility using FRED yields, curve, and breakevens as primary public fields. Must be **heavily caveated** to avoid sounding like investment advice or a bond-buy signal. ETF flow/AUM series are secondary and higher risk.

---

## Proposed Treasury Plumbing architecture (future)

**Future dashboard section (not in v1.7a):** `Treasury Plumbing` — separate lane below or beside equity GhostFlow Research Composite, not inside Passive Pressure.

**Future subcards:**

| Subcard | Role | Default labels |
|---------|------|----------------|
| **Treasury Basis Trade Stress** | Leveraged UST futures positioning + financing/vol context | Public proxy · Manual · Display-only · Not scored |
| **Bond Neglect / Long-End Income Lens** | Long-end nominal/real yield vs narrative fear | Public proxy · Manual · Display-only · Not scored |

**Future status labels (display):** Quiet · Watch · Elevated · Stress

**Hard boundaries (all future phases unless explicitly product-gated):**

| Exclusion | Reason |
|-----------|--------|
| Not in `publicSignalCount` | Treasury lane is separate from the 10 equity research sub-inputs |
| Not in `PUBLIC_ARTIFACT_SIGNAL_IDS` for composite merge | No `buildSnapshot` wiring by default |
| Not in Passive Pressure or Structural Fragility | Different macro plumbing narrative |
| Not merged into `buildSnapshot` | No score sub-input keys for Treasury in v1.7a–e default |
| No composite score impact | Research Composite remains equity-framed |

---

## Phase ladder

| Phase | Scope | Score / UI |
|-------|--------|------------|
| **v1.7a** | Treasury Plumbing Feasibility — **this memo; docs-only** | None |
| **v1.7a.1** | Treasury CFTC PRE spike — `ghostflow:treasury-cftc-pre-spike`; contract discovery **GREEN** | None |
| **v1.7b** | Treasury Futures Positioning artifact design — [TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md](./TREASURY_BASIS_TRADE_ARTIFACT_DESIGN.md) + example JSON + validator/tests | None |
| **v1.7c** | Bond Neglect / Long-End Income artifact design — [BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md](./BOND_NEGLECT_INCOME_LENS_ARTIFACT_DESIGN.md) + example JSON + validator/tests; FRED IDs **candidate** until v1.7d operator lock | None |
| **v1.7d** | Production artifact — Treasury Futures Positioning JSON + loader + `validate-artifacts` (**done**) | Production only at v1.7d; display lane v1.7e |
| **v1.7d.1** | Long-End Income Lens production JSON + `validate-artifacts` + FRED spike (**done**) | Production only at v1.7d.1; display lane v1.7e |
| **v1.7e** | Display-only Treasury Plumbing section — separate UI lane (**done**) | Cards only; not scored; not in `publicSignalCount` |
| **v1.7f** | Mapping / product decision — [TREASURY_PLUMBING_MAPPING_DECISION.md](./TREASURY_PLUMBING_MAPPING_DECISION.md) (**done**) | Display-only default; no mapper / no score; `mappingStatus` **not_final** |
| **v1.7f-calibration** | Optional CFTC + FRED history studies | Research-only; future display context |
| **v1.7g** | Separate Treasury Plumbing score gate | **Product-approved only; discouraged by default** |

---

## Risks and caveats

| Risk | Mitigation |
|------|------------|
| **Semantic overreach — “basis trade”** | Approved copy states proxy only; never claim full basis measurement |
| **Bond neglect sounds like allocation advice** | Mandatory “not a recommendation to buy bonds” in UI and docs |
| **CFTC category confusion** | Do not reuse equity Leveraged Funds copy for UST; separate card and artifact ids |
| **MOVE / data licensing** | Treat MOVE as paid/proprietary unless license confirmed; prefer public CFTC + FRED |
| **Funding / repo proxy limitations** | Label as macro financing context, not trade-level repo specialness |
| **Operator burden** | Weekly CFTC + daily FRED multi-series refresh is non-trivial; see [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) Treasury section (v1.7d+) |
| **Scope creep into equity composite** | Hard boundary in roadmap and architecture; no `publicPassiveInputKey` |

---

## No-score-change confirmation (v1.7a)

After v1.7a implementation:

| Item | Value / state |
|------|----------------|
| **Research Composite** | **62** (unchanged) |
| **Passive Pressure** | **58** (unchanged) |
| **Structural Fragility** | **66** (unchanged) |
| **`publicSignalCount`** | **10** (unchanged) |
| **`publicPassiveInputKey`** | **Not added** |
| **Treasury signal cards** | **None** |
| **Treasury artifacts** | **None** |
| **Score wiring** | **None** |
| **Runtime fetching** | **None** |

**Files intentionally untouched in v1.7a:** `lib/ghostflow/scoring.ts`, `lib/ghostflow/buildSnapshot.ts`, `data/ghostflow/artifacts/*.json`, `data/ghostflow/mockGhostflowSnapshot.ts`, `scripts/ghostflow/validate-artifacts.ts`, `package.json`, GhostRegime, GhostYield, Models, builder.

---

## Related documents

- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — v1.7 checkpoint; Treasury separate display-only lane
- [PASSIVE_STRESS_ZONE_LANGUAGE.md](./PASSIVE_STRESS_ZONE_LANGUAGE.md) — v1.7a feasibility complete; Treasury separate from equity stress-zone phrasebook
- [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) — scenario 5 policy/Treasury narrative link
- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) — equity PRE pattern (not Treasury contracts)
- [CFTC_TFF_MAPPING_DECISION.md](./CFTC_TFF_MAPPING_DECISION.md) — equity `systematic-flow` display-only boundary
