# Cap-Weight Concentration Premium — Feasibility Memo (GhostFlow v1.9b)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Status:** Research / feasibility only — no scoring, merge, artifact JSON, UI, runtime fetching, or script changes in v1.9b.  
**Target (future):** Evaluate whether a **display-only** Cap-Weight Concentration Premium lens can use public SPY vs RSP data as a repeatable operator proxy.  
**Related:** [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) · [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

GhostRegime, GhostYield, Models, and builder are out of scope.

---

## Status

| Item | v1.9b posture |
|------|---------------|
| Document type | Feasibility memo only |
| Score changes | **None** — Composite **62** · Passive **58** · Structural **66** unchanged |
| Artifact JSON changes | **None** |
| Example artifact changes | **None** |
| UI / component changes | **None** |
| Runtime / live fetching | **None** |
| Research script | **None** in v1.9b — deferred to **v1.9b.1** |
| Score gates opened | **No** |
| `publicSignalCount` | **10** (equity) — unchanged |
| Treasury lane | **2** separate display-only cards — unchanged |

---

## Feasibility rating: **YELLOW (leaning GREEN)**

| Criterion | Assessment |
|-----------|------------|
| Public provenance | **GREEN** — SPY and RSP daily price history widely available; operator CSV download feasible |
| Manual refresh | **GREEN** — two ETF series; weekly or monthly operator extract manageable |
| Semantic fit | **GREEN** — GhostFlow-native companion to existing `concentration` card; tests weighting-mechanism return effect |
| Mapping to 0–100 | **Unresolved / deferred** — needs v1.9b.1 empirical study and optional v1.9b.2 artifact design |
| Labeling honesty | **Achievable** with proxy caveats — not causal, not passive-flow proof, not trading signal |

**Why not RED:** SPY/RSP is the cleanest public cap-weight vs equal-weight S&P 500 ETF pair; decades of overlap since RSP launch (2003); aligns with GhostFlow manual-artifact discipline.  
**Why not full GREEN:** ETF price returns are not perfect total-return indexes without adjusted-close discipline; RSP rebalancing, fees, and tracking differ from theoretical equal-weight index; spread mixes passive-flow narrative with earnings, momentum, valuation, and sector effects.

---

## Concept

**Cap-Weight Concentration Premium** measures whether capitalization-weighted exposure is outperforming equal-weighted exposure on the same broad universe, suggesting that size-weighted market structure may be rewarding the largest index constituents more than the average stock.

### How this differs from top-10 concentration

| Lens | Question | Unit | Cadence (live / future) |
|------|----------|------|-------------------------|
| **Existing `concentration`** ([`indexConcentration.v1.json`](../data/ghostflow/artifacts/indexConcentration.v1.json)) | How concentrated is the index? | Top-10 index weight **%** | Monthly (SSGA SPY fact sheet) — **score-fed** |
| **Cap-Weight Premium (future)** | Is cap-weighted exposure outperforming equal-weighted exposure? | Return **spread** or price **ratio** | Daily prices → weekly/monthly display refresh — **display-only by default** |

Concentration measures **static weight level** in the largest names. Cap-weight premium measures **performance differential** from the weighting rule on the same broad S&P 500 universe. They are correlated in narrative but **not redundant series**.

### Primary proxy: SPY vs RSP

- **SPY** — State Street SPDR S&P 500 ETF; tracks capitalization-weighted S&P 500.
- **RSP** — Invesco S&P 500 Equal Weight ETF; holds equal-weighted S&P 500 constituents (quarterly rebalance).

SPY vs RSP is a **public, repeatable, operator-friendly** starting point for feasibility and future display context. It is **not** perfect total-return index data unless adjusted-close / total-return handling is disciplined in any later study or artifact.

---

## Current GhostFlow state

| Item | Value |
|------|--------|
| **Composite / Passive / Structural** | **62 / 58 / 66** · band *Crowded / Reflexive* |
| **Equity `publicSignalCount`** | **10** |
| **Score-fed public artifacts** | **6** — includes `concentration` → `indexConcentration` (Structural 20%) |
| **Display-only equity artifacts** | **4** |
| **MOCK passive inputs** | **62 / 58 / 55** unchanged |
| **Treasury Plumbing** | **2** display-only cards — outside composite and `publicSignalCount` |
| **Cap-weight premium on dashboard** | **None** — [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) notes “cap-weight vs equal-weight: not on dashboard” |

v1.9b does **not** change scoring weights, merge paths, or signal inventory.

---

## Candidate data paths

### Primary: SPY vs RSP (recommended MVP)

| Item | Detail |
|------|--------|
| **Source path** | Operator-downloaded daily CSV (Stooq `spy.us` / `rsp.us`, Yahoo Finance, fund pages, or equivalent) |
| **Overlap history** | RSP since **2003-04-24** (~22 years) — sufficient for 1Y / 3Y / 5Y / 10Y rolling windows |
| **Update cadence** | Daily prices available; operator refresh could be weekly or monthly if later artifact |
| **Reliability** | High for liquid ETFs; Stooq CSV pattern documented in [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) |
| **Licensing** | Operator-local CSV for research; do not commit vendor price files to repo without license review |
| **v1.9b role** | **Primary path** — good enough for research and future **display-only** proxy with caveats |
| **Display vs research** | **Display-only by default** if promoted; no score wiring in v1.9 |

**Pros:** Same S&P 500 universe; longest clean public ETF pair; simple two-series operator workflow.  
**Cons:** Raw close ≠ total return without dividends; RSP expense ratio and quarterly equal-weight rebalance add tracking noise; ETF frictions vs official index.

### Secondary candidates (document only — not v1.9b default)

| Pair | Source | Pros | Cons | Posture |
|------|--------|------|------|---------|
| **S&P 500 cap-weight index vs S&P 500 Equal Weight Index** | S&P / index vendors | Theoretically purest construct | Less operator-friendly; may need paid feed | Secondary reference |
| **QQQ vs QQEW** (Nasdaq-100 equal-weight ETF) | Public ETF prices | Tech-heavy passive narrative | Thinner liquidity/history; different universe | Optional appendix only |
| **Top-50 cap-weight vs equal-weight basket** | Custom holdings | Granular size-bucket test | Heavy manual construction | **Deferred** |

### Excluded from core proxy

| Pair | Reason |
|------|--------|
| **SPYG / SPYV** | Growth/value split — **not** cap-weight vs equal-weight |

---

## Candidate metrics

Metrics below are for **future v1.9b.1 study** and optional display context — **none are implemented or scored in v1.9b**.

| ID | Metric | Definition | Usefulness | Caveats | Include |
|----|--------|------------|------------|---------|---------|
| **A** | **Rolling return spread** | `SPY_total_return − RSP_total_return` over 1M / 3M / 6M / 1Y / 3Y / 5Y | Core premium signal | Requires adjusted close or total-return series; window choice matters | **Yes — primary** |
| **B** | **Ratio trend** | `SPY_price / RSP_price` level and slope | Intuitive long-run chart | Price ratio ≠ total-return ratio unless adjusted | **Yes — primary** |
| **C** | **Rolling percentile** | Percentile of current spread vs history since 2003 | Display context (“elevated premium”) | History starts 2003 only | **Yes — primary for future display** |
| **D** | **Drawdown divergence** | Peak-to-trough SPY vs RSP over stress windows | Regime context when cap-weight lags in breadth-led recoveries | Event selection subjective | **Yes — supplementary** |
| **E** | **Breadth confirmation** | Compare premium windows to existing [`breadth`](../data/ghostflow/artifacts/) artifact (% above 50-day MA) | Narrative cross-check | Different cadence; **do not merge into score** | **Yes — context only** |
| **F** | **Concentration confirmation** | Compare premium to existing [`concentration`](../data/ghostflow/artifacts/indexConcentration.v1.json) top-10 % | Links weight level to return effect | Correlation ≠ causation; **do not replace artifact** | **Yes — context only** |

**Deferred:** Mega-Cap Autocorrelation / Flow Momentum — related [v1.9f](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) theme; optional v1.9b.1 appendix only if empirically simple. **Not expanded in v1.9b.**

---

## Relationship to live artifacts

### Existing `concentration` artifact (score-fed)

| Property | Value |
|----------|-------|
| Signal id | `concentration` |
| Source | SSGA SPY monthly fact sheet — top-10 **index** weight % |
| Scored role | `indexConcentration` — Structural Fragility **20%** |
| Runbook | [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) |

**v1.9b boundary:** Cap-weight premium is a **companion**, not a replacement. Do **not** reuse signal id `concentration`. Do **not** merge into `indexConcentration` or change [scoring.ts](../lib/ghostflow/scoring.ts) weights.

### Future Cap-Weight Premium lens (not implemented)

| Property | Planned posture |
|----------|-----------------|
| Signal id | TBD (e.g. `cap-weight-premium`) — **never** `concentration` |
| Score role | **Display-only by default** |
| Data | SPY vs RSP spread / ratio from operator CSV |
| Question | “Is cap-weighted exposure outperforming equal-weighted exposure?” |

### Cross-artifact context (no score merge)

- **`breadth`** — participation vs cap-weight leadership; context only.
- **`passive-share`** — ICI index asset share; different construct; avoid double-count narrative in copy only.
- **Treasury lane** — separate; no merge.

---

## Caveats

1. **ETF prices ≠ total-return indexes** — raw close understates dividend effects; any v1.9b.1 study should prefer **adjusted close** or document the bias.
2. **Not pure passive-flow isolation** — spread reflects sector tilts, earnings dominance, momentum, valuation, and ETF mechanics — not only passive indexing.
3. **RSP mechanics** — quarterly equal-weight rebalance, higher turnover, ~0.20% expense vs SPY ~0.09%; tracking drift vs S&P 500 Equal Weight Index.
4. **No causality** — positive SPY–RSP spread does not prove cap-weighting or passive flows **caused** outperformance.
5. **No AI-bubble narrative** — do not frame as narrative-only “AI bubble” or mega-cap hype score.
6. **Does not replace `concentration`** — weight level and return premium answer different questions.
7. **Not a trading signal** — research / education / display context only.
8. **Display-only by default** — no score wiring without separate product gate, mapping decision, and calibration.
9. **No `publicSignalCount` change** unless product-approved card promotion — would be a new display lane decision, not automatic.

---

## Feasibility recommendation

| Question | Answer |
|----------|--------|
| Is SPY vs RSP good enough for **research**? | **Yes** — YELLOW leaning GREEN |
| Is SPY vs RSP good enough for a **future display-only proxy**? | **Yes, with caveats** — adjusted-close discipline and honest copy required |
| Should a research script be built? | **Yes, in v1.9b.1** — operator-provided CSVs only; not in v1.9b |
| Should v1.9b include implementation? | **No** — memo only |

**Overall:** Proceed to **v1.9b.1** CSV study as candidate next. Pause artifact design until study output is reviewed.

---

## Next phase recommendation

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.9b** | Cap-Weight Concentration Premium Feasibility — **this memo** | **Done** (docs-only) |
| **v1.9b.1** | Cap-Weight Premium CSV Study | **Done** — operator-CSV study script; not in `ghostflow:check` |
| **v1.9b.1a** | Cap-Weight Premium Calibration Study | **Done** — [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md); real SPY/RSP run; docs-only |
| **v1.9b.2** | Artifact design (if study useful) | **Future** — product-gated; display-only default |
| **v1.9c** | Passive Supply / Float Absorption Feasibility | **Future** — parallel or after v1.9b.1 per product decision |

### v1.9b.1 — Cap-Weight Premium CSV Study

**Status:** **Done** — research-only operator-CSV study. No downloaded SPY/RSP CSVs or generated JSON committed unless separately approved.

Follow [retirement-flow-history-study.ts](../scripts/ghostflow/retirement-flow-history-study.ts) pattern: **operator-provided CSVs only, no network fetching**.

**Shipped files:**

- [`lib/ghostflow/research/capWeightPremiumHistory.ts`](../lib/ghostflow/research/capWeightPremiumHistory.ts) — parse, align, rolling spreads, ratio, drawdown, percentiles
- [`scripts/ghostflow/cap-weight-premium-study.ts`](../scripts/ghostflow/cap-weight-premium-study.ts) — CLI
- [`lib/ghostflow/__tests__/capWeightPremiumHistory.test.ts`](../lib/ghostflow/__tests__/capWeightPremiumHistory.test.ts) — fixture tests, no network
- `npm run ghostflow:cap-weight-premium-study` — **not** in `ghostflow:check`

**Usage:**

```bash
npm run ghostflow:cap-weight-premium-study -- --spy-csv path/to/spy.csv --rsp-csv path/to/rsp.csv
npm run ghostflow:cap-weight-premium-study -- --spy-csv ... --rsp-csv ... --since 2010-01-01 --windows 21,63,252
npm run ghostflow:cap-weight-premium-study -- --spy-csv ... --rsp-csv ... --out ./capWeightPremiumStudy.v1.json
```

**CSV contract:** `Date` + `Adj Close` preferred; `Close` fallback (exit code **2** with warning). Inner-join on common dates only.

**Exit codes:** `0` adjusted-close + sufficient overlap; `1` parse/arg/overlap failure; `2` close-only or partial window quality.

**Not approved by v1.9b.1:** display card, production artifact, example JSON, score mapper, `publicSignalCount` change.

**Results memo:** [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) — **Done (v1.9b.1a)** — real operator run 2026-06-15; exit **0**; adj-close SPY/RSP; 5Y spread +39.51% (99.6th pctile); short horizons mixed; v1.9b.2 remains product-gated.

**v1.9b.1 guardrails:**

- Operator-provided CSVs only
- No network fetching
- Not included in `ghostflow:check`
- No production artifact writes
- No UI card
- No scoring

### v1.9b.2 and beyond

If v1.9b.1 percentiles and spreads are stable and interpretable → optional artifact design memo (display-only default). If messy → pause rather than forcing a new card. **v1.9c** (passive supply / float absorption) remains on the roadmap regardless.

---

## Guardrails (v1.9b)

- Feasibility memo only — no implementation
- Composite **62 / 58 / 66** unchanged
- `publicSignalCount` **10** unchanged
- Treasury **2**-card lane unchanged
- No score gates opened
- GhostRegime out of scope
