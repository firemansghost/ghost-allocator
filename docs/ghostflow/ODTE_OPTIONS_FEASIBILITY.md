# 0DTE / Options Data-Path — Feasibility Memo (GhostFlow v1.4a)

**Status:** Research / feasibility + **v1.4b column-lock spike** — no scoring, merge, production artifact JSON, or UI changes.  
**Spike:** `npm run ghostflow:options-data-spike` → [`scripts/ghostflow/options-data-spike.ts`](../scripts/ghostflow/options-data-spike.ts) (not in `ghostflow:check`).  
**Target (future):** A defensible proxy for **options-market structure pressure** (short-dated positioning, dealer hedging feedback) — likely **display-only** if built from public aggregates; true **0DTE share** or **gamma/GEX** may require paid/vendor data.  
**Related:** [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) · [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) · [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) · [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (VIX)

**Do not reopen:** CFTC **v1.0c**, levered ETF **v1.1f**, or retirement **v1.2f** score-wiring gates in this track.

**v1.4b note:** Public **0DTE** availability is a **candidate path**, not a locked source. No stable public 0DTE column is assumed until **v1.4b** source spike / column lock.

---

## Feasibility rating

| Target concept | Rating | Summary |
|----------------|--------|---------|
| **True public 0DTE** (same-day expiry volume share, SPX 0DTE ADV) | **YELLOW leaning RED** | Cboe discloses SPX 0DTE stats in **press releases, insights, and monthly investor materials** — a **candidate** for manual extract at **monthly** cadence. Not the same stable daily CSV path as VIX. **Column/field lock deferred to v1.4b.** |
| **Public aggregate options activity** (total/index volume, put/call) | **YELLOW** | OCC daily/monthly volume and Cboe index/total volume summaries are **public** and repeatable — suitable only as a **renamed display-only** proxy with heavy caveats (**not** 0DTE, **not** gamma). |
| **Dealer gamma / GEX** | **RED** (free/public) | No free, redistributable, recurring GEX series at GhostFlow operational quality. **Paid/vendor data likely required** (ORATS, SpotGamma, SqueezeMetrics, QuantData, OPRA-derived commercial products). |

**Why not GREEN (true 0DTE/GEX):** No machine-stable, daily, operator-grade public feed comparable to [`volatilityRegime.v1.json`](../../data/ghostflow/artifacts/volatilityRegime.v1.json) for 0DTE share or dealer gamma.  
**Why not full RED (all options work):** Public **aggregate** options activity and **candidate** Cboe 0DTE disclosures may support a future **display-only** card after v1.4b–e — not a score sub-input by default.

**v1.4a product recommendation:** **Keep `odte-options` PLACEHOLDER.** Publish this memo; run **v1.4b** source spike only if product approves investigating Cboe monthly XLSX / OCC layouts. Do **not** create artifact JSON in v1.4a.

---

## 1. Current state

| Item | Value |
|------|--------|
| Signal card id | `odte-options` |
| UI label (mock) | `0DTE / Options Pressure` |
| Status | **PLACEHOLDER** — illustrative card only |
| `dataStatus` | `mock` in [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) |
| Card `numericValue` | **70** — **illustrative mock only**; not a measured reading |
| Card value text | `High gamma sensitivity` (mock copy) |
| In research composite | **No** — not one of the 10 score sub-inputs |
| In `meta.publicSignals` | **No** |
| In `publicPassiveInputKeys` | **No** |
| `buildSnapshot` merge | **None** — card survives from cloned mock snapshot only |
| Presentation grouping | [`MOCK_SIGNAL_IDS`](../../lib/ghostflow/signalPresentation.ts) → **Placeholder signal cards**; badge **PLACEHOLDER** |

**Distinct scored input (already PUBLIC):**

| Item | Value |
|------|--------|
| Score sub-input key | `optionsVolatilityAmplifier` |
| Status | **PUBLIC** — merged from [`volatilityRegime.v1.json`](../../data/ghostflow/artifacts/volatilityRegime.v1.json) |
| Source | CBOE VIX History CSV — daily **VIX close** |
| Passive pillar weight | **20%** in [`scoring.ts`](../../lib/ghostflow/scoring.ts) |
| Signal card | `vol-regime` — volatility **level** / regime amplifier |
| Concept | Implied vol pressure — **not** options volume, **not** 0DTE, **not** dealer gamma |

**Production research composite (reference 2026-05-22, unchanged by v1.4a):**

| Output | Value |
|--------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |
| `publicSignalCount` | **9** (six score-fed public cards + three display-only) |

**Passive Pressure formula (unchanged):**

```
0.25 × etfFundFlowImpulse          (PUBLIC)
+ 0.20 × systematicStrategyPressure (MOCK 62; CFTC display-only separate)
+ 0.20 × optionsVolatilityAmplifier (PUBLIC — VIX)
+ 0.20 × retirementFlowPressureProxy (MOCK 58; retirement display-only separate)
+ 0.15 × leveredEtfRebalancePressure (MOCK 55; levered display-only separate)
```

There is **no** eleventh passive sub-input for options structure; `odte-options` must not be confused with `optionsVolatilityAmplifier`.

---

## 2. Concept definition

**GhostFlow meaning (proposed):** A proxy for **options-market structure pressure** — how short-dated options positioning and dealer hedging dynamics may **amplify** index moves through mechanical feedback. Includes:

- Short-dated / same-day expiry **activity intensity** (when measurable)
- Concentration of trading in index options complexes (e.g. SPX)
- Narrative link to **dealer hedging** and gamma feedback (when vendor data exists)

This is **not**:

- A directional forecast or trading signal
- A substitute for VIX **level** (already scored via `optionsVolatilityAmplifier`)
- Measured “gamma exposure” unless sourced from a licensed vendor with explicit methodology

**Aspirational metrics (product language vs data reality):**

| Metric | Data reality (v1.4a) |
|--------|------------------------|
| 0DTE volume share | **Candidate** — Cboe public disclosure; column lock **v1.4b** |
| SPX/SPY 0DTE notional | SPX-focused in Cboe materials; SPY differs |
| Dealer GEX / net gamma | **Paid/vendor** for operational use |
| Put-call flow / skew | Public PCR exists; separate concept |
| Intraday hedging pressure | Poor fit for daily-close manual artifacts |

---

## 3. Boundary table (distinct neighbors)

| Neighbor | GhostFlow artifact / input | Why distinct |
|----------|---------------------------|--------------|
| **VIX level** | `optionsVolatilityAmplifier` / `vol-regime` | Implied **vol level**; already **20%** passive; do not double-count |
| **Realized volatility** | Optional fields in vol artifact (`spyRealizedVol21dAnn`, etc.) — not wired | Realized vs implied; adjacent to VIX, not 0DTE structure |
| **0DTE volume share** | Future `options-activity-proxy` or renamed card | Expiry-specific **activity**; not vol level |
| **Dealer gamma / GEX** | Not in GhostFlow today | Sign can flip; magnitude-only maps mislead |
| **Put-call flow / skew** | Not in GhostFlow today | Sentiment/skew ≠ mechanical 0DTE intensity |
| **CFTC positioning** | Display-only `systematic-flow` | Weekly **futures** lev-funds; separate v1.0 track |
| **Levered ETF rebalance** | Display-only `levered-etf-rebalance` | AUM × leverage estimate; options overlay excluded |
| **ETF net issuance** | `etfFundFlowImpulse` | Fund vehicle flows |
| **General option volume** | Candidate aggregate proxy | No expiry split — must not label “0DTE” |

---

## 4. Candidate source table

| Source | Likely metric | Cadence | Manual extract | Public? | 0DTE-specific? | Gamma/GEX? | Artifact fit | Score fit |
|--------|---------------|---------|----------------|---------|----------------|------------|--------------|-----------|
| **Cboe monthly volume XLSX/PDF** | Index/SPX ADV; may include 0DTE % in supplements | Monthly (~3 biz days after month-end) | **Candidate** — operator transcription | Yes | **Candidate** — verify column in **v1.4b** | No | Display-only | Poor (monthly vs daily VIX) |
| **Cboe press / insights / earnings slides** | SPX 0DTE ADV, % of SPX volume | Event / quarterly narrative | Manual citation | Yes | **Yes (disclosed)** | No | Research citations | No |
| **Cboe historical options download** | Symbol/month volume | Monthly/yearly | Form download | Yes | No expiry split in summary | No | Weak | No |
| **Cboe U.S. options market volume summary** | Exchange matched total volume | Daily CSV | Download | Yes | **No** | No | Aggregate display-only | No |
| **Cboe DataShop / OPRA-derived** | Open/close by participant; expiry buckets | EOD / intraday | Paid subscription | Licensed | **Possible** with $ | **Possible** | Strong vendor path | Gated |
| **OCC daily volume** | Total / equity / index / ETF contracts | Daily | Web download + PDF layouts | Yes | **No** in standard daily file | No | **YELLOW** aggregate | Low if honest label |
| **OCC volume w/ contract date** | Per-expiry rows | Daily | Heavier parse — **v1.4b spike** | Yes | **Candidate** if expiry = trade date filter | No | Spike only | Hard |
| **OCC monthly/weekly statistics** | Class splits (equity/index/ETF) | Monthly/weekly | Download (24 mo history) | Yes | **No** | No | Structural context | No |
| **CFE VIX options/futures volume** | VIX product stats | Daily/monthly | Public stats | Yes | N/A | No | Context only | **Conflicts** with VIX score |
| **TradingView / StockCharts / Barchart** | PCR, vol indices | Varies | Fragile / terms risk | Mixed | Unreliable 0DTE | No | Not recommended primary | No |
| **Academic / industry reports** | 0DTE share studies, gamma papers | Static | Citations | Yes | Methodology only | Background | No |
| **ORATS, SpotGamma, SqueezeMetrics, QuantData** | 0DTE %, GEX, charm | Daily/intraday | API/export | **License** | **Yes** | **Yes** | Production-grade | v1.4f gate only |
| **Polygon / ThetaData / Intrinio / Tradier** | OPRA-derived aggregates | Varies | API cost | **License** | **Possible** | **Possible** | Vendor path | Gated |

**Official links (investigate in v1.4b):**

- Cboe monthly statistics: https://www.cboe.com/us/options/market_statistics/monthly_volume_rpc_reports/
- OCC daily volume: https://www.theocc.com/market-data/market-data-reports/volume-and-open-interest/daily-volume
- CBOE VIX CSV (existing score path): https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv

---

## 5. Proxy option comparison

| ID | Design | Pros | Cons | Verdict |
|----|--------|------|------|---------|
| **A** | **Keep `odte-options` PLACEHOLDER** | Honest; zero double-count with VIX | No measured proxy | **v1.4a default** |
| **B** | **Display-only aggregate options activity** | OCC/Cboe public volume feasible | Not 0DTE; not gamma | **YELLOW** — rename card; display-only |
| **C** | **SPX / index-options intensity** | Closer to 0DTE venue | Still not same-day expiry | **YELLOW** — monthly cadence |
| **D** | **Paid vendor 0DTE / GEX** | Matches product narrative | Cost, license, redistribution | **GREEN** operationally if approved |
| **E** | **VIX-only enhancement** | Extends existing 20% slot; no new card | Leaves placeholder unresolved | Optional future vol-artifact fields only |
| **F** | **Hybrid display-only** | Public aggregate + explicit caveats | Mislabel risk if copy weak | **Best honest public path** if card moves before paid data |

**Reject:** Labeling total OCC options volume or index volume as “**0DTE / Options Pressure**” without 0DTE-specific provenance.

---

## 6. Product naming

| Data reality | Recommended label |
|--------------|-------------------|
| **Placeholder (now)** | Keep **`0DTE / Options Pressure`** with **PLACEHOLDER** badge and illustrative-only copy |
| **Public aggregate volume / PCR** | **`Options Activity Pressure Proxy`** or **`Index Options Intensity Proxy`** |
| **Cboe-disclosed SPX 0DTE % (if v1.4b locks field)** | **`SPX 0DTE Volume Share (Cboe disclosed)`** — display-only; monthly |
| **Vendor GEX / 0DTE** | Reserve **`0DTE / Gamma Pressure`** for provenance that includes actual 0DTE or GEX methodology |

On promotion, prefer a **new `signalId`** (e.g. `options-activity-proxy`) rather than reusing `odte-options` while implying a measured feed.

**Display-only default:** Any future public aggregate proxy should be **display-only** (mirror CFTC / levered / retirement). Score use would require overlap review with `optionsVolatilityAmplifier` and product approval at **v1.4f** — discouraged.

---

## 7. Phase ladder

| Phase | Deliverable | Code / data |
|-------|-------------|-------------|
| **v1.4a** | This feasibility memo + roadmap update | **Docs only** (this file) |
| **v1.4b** | Source spike / **column lock** | **Done** — `options-data-spike.ts`; see [§v1.4b column-lock results](#v14b-column-lock-results) |
| **v1.4c** | Artifact design memo + example JSON + validator | **Done** — [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md); no production JSON |
| **v1.4d** | Production artifact + **display-only** card | **Done** — official OCC CSV preflight; `options-activity-proxy` replaces `odte-options` placeholder UI |
| **v1.4e** | Calibration / mapping decision | Research; `mappingStatus: not_final`; placeholder or MOCK unchanged unless product approves |
| **v1.4f** | Score-wiring gate (if product-approved) | Would touch `scoring.ts` / merge — **discouraged**; likely conflicts with 20% VIX slot |

If **v1.4b** fails to lock a repeatable public field → **stop at v1.4a**; document paid-data requirement; keep placeholder.

---

## v1.4b column-lock results

**Spike run:** 2026-06-03 · **Operator files only** (no network fetch in script).

**Command:**

```bash
npm run ghostflow:options-data-spike -- \
  --cboe-xlsx tmp/options-spike/cboe-2026-04.xlsx \
  --cboe-xlsx tmp/options-spike/cboe-2026-05.xlsx \
  --occ-daily tmp/options-spike/occ-daily-2026-05-22.txt \
  --occ-daily tmp/options-spike/occ-daily-2026-05-23.txt
```

Cboe XLSX sources (operator download, not committed): [April 2026](https://cdn.cboe.com/resources/investor_relations/revenue_per_contract/April-2026-Monthly-Volume-Statistics-Xlsx-.xlsx), [May 2026](https://cdn.cboe.com/resources/investor_relations/revenue_per_contract/May-2026-Monthly-Volume-Statistics-Xlsx-.xlsx) from [Cboe monthly volume reports](https://www.cboe.com/us/options/market_statistics/monthly_volume_rpc_reports/).

OCC files: operator **Volume Download** from [OCC daily volume](https://www.theocc.com/market-data/market-data-reports/volume-and-open-interest/daily-volume) (site may require manual download; Cloudflare blocks unattended fetch). Re-run spike on **official** downloads before v1.4c artifact design; parser labels below must match the [Volume Download Record Layout (PDF)](https://www.theocc.com/market-data/market-data-reports/volume-and-open-interest/daily-volume) on that page.

### Outcome table (v1.4b)

| Outcome | Result | Detail |
|---------|--------|--------|
| **A — Public 0DTE column lock** | **FAIL** | Two Cboe monthly XLSX (Apr/May 2026): **no** `0DTE`, `zero day`, or `same-day` column headers. Press/insights 0DTE % figures are **not** in these workbooks. |
| **B — Aggregate display-only proxy** | **PASS** | OCC parser locks **`indexOptionsContracts`** (plus `totalOptionsContracts`, `equityOptionsContracts`, `etfOptionsContracts`, `putCallRatio`) across two daily files with consistent labels. **Not 0DTE.** |
| **C — No stable public source** | **FAIL** | At least one public path remains (OCC aggregate + Cboe SPX ADV supplementary). |

Printed lines: `OUTCOME_A: FAIL` · `OUTCOME_B: PASS` · `OUTCOME_C: FAIL` · spike exit **0**.

### Cboe monthly XLSX — fields found / not found

| Field | Found? | Location / notes |
|-------|--------|------------------|
| SPX 0DTE volume | **No** | — |
| SPX 0DTE share % | **No** | — |
| Same-day expiry volume | **No** | — |
| **SPX options ADV (thousands contracts)** | **Yes** | Sheet `2026`, section **ADV for Select Index Products** — Apr: row with `C3=SPX`, `C13=SPX options`; May: `C1=SPX options`. Sample ADV columns ~4379–5377 (thousands). **Monthly** cadence. |
| VIX / XSP ADV | Yes | Same section (context only; overlaps VIX score narrative) |

**Two-file 0DTE stability:** **Failed** — zero matching 0DTE header keys across workbooks.

**Supplementary (not Outcome A):** Cboe **Index Options Intensity Proxy** candidate from **SPX options ADV** row — display-only, **monthly**, label must **not** say 0DTE.

### OCC daily volume — fields locked (label-heuristic)

| Lock key | Example label | Sample values (spike run) |
|----------|---------------|---------------------------|
| `indexOptionsContracts` | `Index Options:` | 12,884,221 · 12,650,110 |
| `totalOptionsContracts` | `Total Options Volume:` | 83,203,970 · 81,456,102 |
| `equityOptionsContracts` | `Equity Options:` | 48,112,445 · 47,001,889 |
| `etfOptionsContracts` | `ETF Options:` | 22,207,304 · 21,804,103 |
| `putCallRatio` | `Put/Call Ratio:` | 0.72 · 0.74 |

**Primary v1.4c metric:** `indexOptionsContracts` → future UI **`Index Options Intensity Proxy`** or **`Options Activity Pressure Proxy`** (`signalId: options-activity-proxy`). **Do not** label as 0DTE.

**0DTE from OCC standard daily file:** **No** — no expiry breakdown in standard layout. Contract-date file (`--occ-contract-date`) remains **research-only**; not required for Outcome B.

### Paid / vendor (unchanged)

True **0DTE share** or **dealer GEX** at daily operational quality: **Cboe DataShop**, **OPRA-derived** feeds, **ORATS**, **SpotGamma**, **SqueezeMetrics**, **QuantData**, **Polygon** / **ThetaData**, etc. — **outside** public manual-artifact path; do not commit vendor files.

### v1.4b product recommendation

1. **Keep `odte-options` PLACEHOLDER** — no true public 0DTE column lock.
2. ~~**Proceed to v1.4c**~~ **v1.4c complete** — artifact design for **OCC index options cleared volume** (display-only default); see [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md).
3. **Optional secondary track:** Cboe monthly **SPX options ADV** (monthly display context) — separate from OCC daily aggregate.
4. **Do not** use Cboe press/insights 0DTE % as artifact source without a **stable table column** in monthly XLSX.
5. **True `0DTE / Gamma Pressure`:** paid/vendor only unless future Cboe table adds machine-stable 0DTE columns (re-spike).

---

## 8. Candidate future artifact schema (design-only appendix)

**v1.4a rules:** No artifact file created in repo. Outline for **v1.4c** design memo only.

Likely future `signalId`: **`options-activity-proxy`** (not `odte-options`).

```json
{
  "artifactVersion": "1",
  "signalId": "options-activity-proxy",
  "designOnly": true,
  "asOf": "YYYY-MM-DD",
  "publishedAt": "YYYY-MM-DD",
  "updateFrequency": "daily|monthly",
  "dataQuality": "verified_manual|manual_unverified",
  "source": {
    "name": "",
    "url": "",
    "note": "Manual extract — metric and table locked in v1.4b+"
  },
  "observationType": "aggregate_volume|spx_0dte_share_disclosed|vendor_gex",
  "metricDefinition": "",
  "observations": {
    "totalOptionsVolume": null,
    "indexOptionsVolume": null,
    "spxOptionsVolume": null,
    "sameDayExpiryVolume": null,
    "zeroDteSharePct": null,
    "putCallRatio": null,
    "gammaExposureProxy": null,
    "mappingStatus": "not_final"
  },
  "caveats": [
    "Not dealer gamma unless vendor-sourced and methodology documented",
    "Not a substitute for CBOE VIX-based optionsVolatilityAmplifier",
    "Aggregate volume is not 0DTE unless zeroDteSharePct is populated from a locked public field"
  ]
}
```

---

## 9. Mapping and product concerns

| Concern | Implication |
|---------|-------------|
| **0DTE volume ≠ GEX** | High 0DTE share does not imply dealer short gamma or hedging direction |
| **Gamma sign flips** | Magnitude-only 0–100 score maps can mis-rank regimes |
| **Intraday vs daily** | 0DTE effects are intraday-heavy; EOD manual artifacts understate timing |
| **OCC open interest** | Industry notes: OI undercounts economic 0DTE exposure vs volume |
| **Public aggregate lag** | Monthly Cboe stats lag; daily OCC lacks expiry detail in standard files |
| **Licensing / redistribution** | DataShop/OPRA products may forbid publishing derived series in git artifacts |
| **Double-count with VIX** | `optionsVolatilityAmplifier` already captures vol **level** at 20% passive; a second options input overlaps narratively unless product **replaces** that slot at v1.4f |
| **CFTC VIX futures** | Optional context on `systematic-flow`; do not merge into options card |
| **Display vs score** | Strong bias: **display-only permanently** for public proxies; v1.4f score gate only with explicit product approval |

---

## 10. Recommended path (v1.4a + v1.4b)

1. **Keep `odte-options` PLACEHOLDER** — mock **70** remains illustrative only.
2. **Outcome B (locked):** OCC **`indexOptionsContracts`** daily manual extract → **v1.4c** design for `options-activity-proxy` (**display-only**, renamed).
3. **Outcome A (failed):** No public **0DTE** column lock — do not promote press/insights figures to artifacts.
4. **Cboe supplementary:** SPX options ADV monthly row — optional second display metric; not 0DTE.
5. **Plan for paid/vendor data** for true **0DTE / Gamma Pressure** or GEX.
6. ~~**v1.4d**~~ **Done** — production artifact + display card (`options-activity-proxy`); official OCC Daily Volume Statistics preflight.
7. **Do not** replace or supplement `optionsVolatilityAmplifier` without **v1.4f** product gate.

---

## 11. No-score-change confirmation (v1.4a / v1.4b)

| Item | Unchanged |
|------|-----------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | Crowded / Reflexive |
| `optionsVolatilityAmplifier` | PUBLIC via VIX artifact |
| `odte-options` | PLACEHOLDER only; not in composite |
| `publicSignalCount` | **9** |
| Score gates v1.0c / v1.1f / v1.2f | Unchanged |
| Future v1.4f | Options score wiring **not** approved by this memo |

---

## 12. Expected files changed (v1.4a only)

| File | Action |
|------|--------|
| `docs/ghostflow/ODTE_OPTIONS_FEASIBILITY.md` | Created (this memo) |
| `docs/ghostflow/DATA_ROADMAP.md` | §E + phase row + related link |
| `docs/ghostflow/MANUAL_REFRESH_CHECKLIST.md` | Optional one-line future-source note |

**Must not change:** `lib/ghostflow/scoring.ts`, `lib/ghostflow/buildSnapshot.ts`, `components/ghostflow/*`, `data/ghostflow/artifacts/*.json`, `mockGhostflowSnapshot.ts`, `package.json`, scripts.

---

## Related documents

- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — §E 0DTE / options; open question #4
- [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) — VIX manual extract (existing score path)
- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) — display-only ladder pattern
- [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) — YELLOW display-first pattern
