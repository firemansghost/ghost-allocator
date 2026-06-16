# Passive Supply / Float Absorption — Feasibility Memo (GhostFlow v1.9c)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Status:** Research / feasibility only — no scoring, merge, artifact JSON, UI, runtime fetching, or script changes in v1.9c.  
**Target (future):** Evaluate whether a **display-only** Passive Supply / Float Absorption lens can use public, operator-manageable data for supply-side market-structure context.  
**Related:** [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) · [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) · [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) · [PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) · [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

GhostRegime, GhostYield, Models, and builder are out of scope.

---

## Status

| Item | v1.9c posture |
|------|---------------|
| Document type | Feasibility memo only |
| Score changes | **None** — Composite **62** · Passive **58** · Structural **66** unchanged |
| Artifact JSON | **None** — no production or example artifacts |
| UI / components | **None** |
| Runtime / live fetching | **None** |
| Research script | **None** in v1.9c — deferred to **v1.9c.1** source spike |
| Score gates opened | **No** |
| `publicSignalCount` | **10** (equity) — unchanged |
| Treasury lane | **2** separate display-only cards — unchanged |

**Source lock posture:** No specific data source is locked in v1.9c. Candidate paths (SIFMA, FRED, SEC EDGAR, exchange listings, S&P DJI, Nasdaq, Russell, IPO calendars, buyback reports) remain **unproven** until **v1.9c.1** verifies availability, cadence, licensing, and operator workflow.

---

## Feasibility rating: **YELLOW leaning RED**

| Criterion | Assessment |
|-----------|------------|
| Public provenance | **Partial** — macro issuance and index **events** are public; continuous market-wide float/supply series are fragmented or paywalled |
| Manual refresh | **Hard** at market-wide scale — event curation and quarterly macro extracts; not a two-series CSV workflow like SPY/RSP |
| Semantic fit | **High** — supply-side complement to GhostFlow demand/concentration lenses |
| Mapping to 0–100 | **Inappropriate by default** — event-driven, delayed, narrative overlap with demand proxies |
| Labeling honesty | **Achievable** only with heavy caveats — not causal proof, not trading signal, display-only default |

### Path-level ratings

| Path | Rating |
|------|--------|
| **A — Aggregate equity issuance** | **YELLOW** |
| **B — Buyback / net issuance context** | **YELLOW** (aggregate) · **YELLOW leaning RED** (timely market-wide) |
| **C — IPO / secondary / lockup calendar** | **YELLOW** (event research) · **RED** (continuous scored series) |
| **D — Index inclusion / rebalance demand** | **YELLOW** (events) · **RED** (modeled demand-vs-float) |
| **E — Free float / float percentage at scale** | **RED** |
| **F — Mega-cap / top-N share-count trends** | **YELLOW** (narrow research) — not broad market proxy |

**Why not full RED:** Public **event** sources (index adds/deletes, exchange listings, SEC filings, macro issuance reports) may support a **display-only event/context** lens with honest copy — similar to how [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) rated aggregate OCC **YELLOW**, not true 0DTE **RED**.

**Why not GREEN:** Unlike SPY/RSP (v1.9b **YELLOW leaning GREEN**), there is **no single public, operator-friendly, continuous series** for market-wide net equity supply or float absorption comparable to ICI ETF issuance or cap-weight premium history.

---

## Concept

**Passive Supply / Float Absorption** measures whether **new equity supply**, **available float**, **corporate issuance**, **buybacks**, **lockup releases**, and **index inclusion mechanics** are offsetting or amplifying passive/index demand.

Passive demand is one side of the market; **new float and equity supply** are the other. GhostFlow currently measures demand-side pressure (fund flows, index asset stock, concentration, cap-weight return effect) but **does not** measure corporate primary/secondary issuance, buyback-driven supply reduction, or float availability at market scale.

### What this lens is not

| Construct | Why distinct |
|-----------|--------------|
| **`etf-flow`** | Tracks **fund vehicle** demand (ICI domestic equity ETF net issuance) — not corporate equity supply |
| **`active-index-flow`** | Tracks **fund flows** (active vs index monthly) — not new shares issued to the market |
| **`passive-share`** | Tracks **stock** of index-oriented assets — not float or new issuance |
| **`concentration`** | Tracks **index weight level** in top names — price-driven cap growth ≠ new share supply |
| **`cap-weight-premium-proxy`** | Tracks **return effect** of cap-weighting — supply-side complement in narrative only |
| **Buyback narrative alone** | Corporate supply reduction — not measured in GhostFlow today; overlaps thematically if scored naively |

### Why it matters

- Years of **buybacks and shrinking float** may have amplified passive demand relative to available supply ([PASSIVE_ENDGAME_SCENARIOS.md](./PASSIVE_ENDGAME_SCENARIOS.md) — educational framing only).
- **Large IPOs**, **secondaries**, and **lockup releases** can add supply episodically.
- **Low-float index inclusions** can create large mechanical index demand relative to available float — a passive-structure tension distinct from weekly ETF issuance.
- This is the missing **supply-side** complement to GhostFlow’s demand/flow proxies and v1.9b cap-weight premium work.

---

## Current GhostFlow state

| Item | Value |
|------|--------|
| **Composite / Passive / Structural** | **62 / 58 / 66** · band *Crowded / Reflexive* |
| **Equity `publicSignalCount`** | **10** |
| **Score-fed public artifacts** | **6** |
| **Display-only equity artifacts** | **4** |
| **MOCK passive inputs** | **62 / 58 / 55** unchanged |
| **Treasury Plumbing** | **2** display-only cards — outside composite and `publicSignalCount` |
| **Passive supply / float lens on dashboard** | **None** |

v1.9c does **not** change scoring weights, merge paths, or signal inventory.

---

## Source path evaluation

All paths below are **candidate paths only** — not locked. v1.9c.1 must verify extract workflow, licensing, and cadence before any artifact design.

### A — Aggregate equity issuance

| Item | Assessment |
|------|------------|
| **Candidate sources** | SIFMA equity capital markets reports; exchange new-listings statistics; macro corporate issuance summaries; SEC aggregate filing trends |
| **Public availability** | **Partial** — macro reports exist; timely granularity often PDF/table-based |
| **Repeatability** | **Medium** — operator manual extract; not a single clean daily CSV |
| **Cadence** | Monthly / quarterly typical |
| **History** | Years at macro level; weak for event detail |
| **Licensing / redistribution** | Generally citable; verify SIFMA and exchange terms before repo commits |
| **Manual refresh burden** | **Medium–high** — table transcription from reports |
| **Research script potential** | **Possible** in v1.9c.1 — inventory + one manual extract proof |
| **Display card potential** | **Possible** as delayed quarterly **context** proxy |
| **Rating** | **YELLOW** |

**Note:** Do **not** assume a specific FRED series ID or clean CSV exists until v1.9c.1 verifies.

### B — Buyback / net issuance context

| Item | Assessment |
|------|------------|
| **Candidate sources** | S&P Dow Jones buyback quarterly summaries (public); company 10-Q/10-K share counts via SEC EDGAR; vendor aggregates (FactSet/Compustat — **paid**) |
| **Public availability** | **Partial** — aggregate public with lag; company-level via filings |
| **Repeatability** | **Low–medium** at market-wide level without paid feed |
| **Cadence** | Quarterly + filing lag |
| **History** | Good for macro buyback narrative; poor for real-time supply |
| **Licensing** | Public summaries citable; vendor data not GhostFlow-native |
| **Manual refresh burden** | **High** for broad coverage; **medium** for aggregate-only |
| **Research script potential** | **Limited** without paid data |
| **Display card potential** | **Possible** quarterly context with heavy lag caveats |
| **Rating** | **YELLOW** (aggregate) · **YELLOW leaning RED** (timely market-wide) |

### C — IPO / secondary / lockup calendar

| Item | Assessment |
|------|------------|
| **Candidate sources** | Exchange new listings; SEC S-1 / 424B filings; third-party IPO calendars (terms vary); issuer press releases |
| **Public availability** | **Yes** for individual events; **no** single authoritative free API |
| **Repeatability** | **Low** — manual curation; scraping discouraged for GhostFlow runtime |
| **Cadence** | **Event-driven** |
| **History** | Event archives exist; not a continuous time series |
| **Licensing** | Calendar vendors may restrict redistribution — v1.9c.1 must check |
| **Manual refresh burden** | **High** for comprehensive calendar |
| **Research script potential** | **Inventory-only** in v1.9c.1; not automated fetch |
| **Display card potential** | **Event watchlist** only — not comparable to weekly `etf-flow` |
| **Rating** | **YELLOW** (event research) · **RED** (continuous scored series) |

### D — Index inclusion / rebalance demand

| Item | Assessment |
|------|------------|
| **Candidate sources** | S&P DJI index announcements; Nasdaq index changes; Russell rebalance public files; index provider press releases |
| **Public availability** | **Yes** for add/delete **events**; **no** for standardized demand-vs-float without assumptions |
| **Repeatability** | **Medium** for event lists; **low** for float-adjusted demand estimates |
| **Cadence** | Episodic (rebalance dates, committee decisions) |
| **History** | Good for event archive; modeling requires proprietary float |
| **Licensing** | Public announcements citable; float models not |
| **Manual refresh burden** | **Medium** per rebalance cycle |
| **Research script potential** | **Possible** — parse public announcement files in v1.9c.1 spike |
| **Display card potential** | **Event-based display** — “large index add” context |
| **Rating** | **YELLOW** (events) · **RED** (continuous float-absorption score) |

### E — Free float / float percentage at scale

| Item | Assessment |
|------|------------|
| **Candidate sources** | Index providers; Bloomberg/FactSet/Refinitiv (**paid**); occasional issuer disclosures |
| **Public availability** | **Poor** at market-wide scale |
| **Repeatability** | **Not GhostFlow-native** without vendor license |
| **Cadence** | Varies; often stale in free sources |
| **History** | Vendor-dependent |
| **Licensing** | **Proprietary** for operational use |
| **Manual refresh burden** | **Prohibitive** at scale |
| **Research script potential** | **Not recommended** as core path |
| **Display card potential** | **Not viable** without paid feed or narrow manual scope |
| **Rating** | **RED** |

**Do not imply** a public free-float source is available at scale.

### F — Mega-cap / top-N share-count trends

| Item | Assessment |
|------|------------|
| **Candidate sources** | SEC EDGAR 10-Q/10-K shares outstanding; buyback authorization disclosures |
| **Public availability** | **Yes** per company |
| **Repeatability** | **Manual**, narrow (top 10–50), filing lag |
| **Cadence** | Quarterly filings |
| **History** | Good per issuer; not full market |
| **Licensing** | EDGAR public domain; operator-local extracts only |
| **Manual refresh burden** | **High** if broad; **bounded** if top-N only |
| **Research script potential** | **Possible** narrow spike — not market proxy |
| **Display card potential** | **Research appendix only** |
| **Rating** | **YELLOW** (narrow research) — **not** broad market proxy |

---

## Candidate metrics (document only — not implemented)

| ID | Metric | Usefulness | Caveats | Possible public source | Posture | Score mapping |
|----|--------|------------|---------|------------------------|---------|---------------|
| **A** | **Net equity supply proxy** (IPO + secondary − buybacks, quarterly) | High narrative fit for supply-side regime | Delayed; revised; macro only; overlaps buyback story | SIFMA / macro reports (candidate) | Display-only quarterly context | **Inappropriate** |
| **B** | **Float absorption pressure** (index demand / estimated float) | High for index-add stories | Requires float + flow assumptions; proprietary float | Index events + manual float estimates | Event-based display | **Inappropriate** |
| **C** | **New supply calendar** (IPO/secondary/lockup count or $) | Good operator watchlist | Manual; episodic; not comparable to weekly `etf-flow` | Exchange listings; SEC filings; calendars (candidate) | Display-only events | **Inappropriate** |
| **D** | **Mega-cap net share supply** (top 10/50 share count Δ) | Useful narrow signal | Filings lag; not full market | SEC EDGAR (candidate) | Research-only appendix | **Inappropriate** |
| **E** | **Buyback-to-issuance balance** | Regime context | Quarterly lag; aggregate noise | S&P buyback summaries (candidate) | Display-only | **Inappropriate** |
| **F** | **Index rebalance absorption events** (large adds vs float proxy) | High for passive-structure stories | Episodic; committee discretion; float estimates | S&P / Nasdaq / Russell announcements (candidate) | Display-only events | **Inappropriate** |

**Default posture for all:** **Display-only by default** · **no score wiring** · **no `publicPassiveInputKey`** · **no Research Composite impact**.

---

## Relationship to live artifacts

| Signal / artifact | Side | Relationship to supply lens |
|-------------------|------|----------------------------|
| **`etf-flow`** | Demand | ICI domestic equity ETF **vehicle** net issuance — not corporate primary/secondary supply |
| **`active-index-flow`** | Demand | Active vs index **monthly fund flows** — not new shares to market |
| **`passive-share`** | Stock | Index-oriented **asset level** — not float or issuance calendar |
| **`concentration`** | Structure | Top-10 **weight %** — price-driven cap growth ≠ new share supply |
| **`cap-weight-premium-proxy`** | Return effect | SPY/RSP spread/ratio — companion narrative; not supply measurement |
| **`systematic-flow`** | Positioning | CFTC futures lev-funds — unrelated to equity issuance |
| **`retirement-asset-growth`** | Stock | Quarterly retirement **asset totals** — not issuance calendar |

**Boundary locks:**

- Supply lens is **supply-side context** — not replacement for any existing artifact.
- **No merge** into Research Composite or sub-scores in v1.9c.
- **No `publicPassiveInputKey`**.
- **No `publicSignalCount` change** in v1.9c; future display card would require separate product approval (likely 10 → 11, same pattern as cap-weight v1.9b.4).
- **Double-count risk:** Medium vs `etf-flow` and buyback/passive-demand narrative if scored naively — memo must discourage score wiring without reweight analysis.

---

## Caveats

1. **Fragmented sources** — no single public series for market-wide net equity supply.
2. **Delayed reporting** — macro issuance and buyback data lag; filings lag further.
3. **Paid/vendor data risk** — timely float and net issuance often require terminals.
4. **Event-driven rather than continuous** — unlike weekly ICI ETF issuance or daily prices.
5. **Free-float estimates can be proprietary** — do not imply public float at scale.
6. **Source licensing / redistribution** — verify SIFMA, exchange, calendar vendor, and index provider terms before repo commits.
7. **Manual curation risk** — event calendars require operator judgment; error-prone at scale.
8. **No causality** — supply metrics do not prove passive flows caused price moves or regime shifts.
9. **Not a trading signal** — research / education / display context only.
10. **Not an AI-bubble score** — do not frame as narrative-only hype metric.
11. **Display-only by default** — no score input without separate product gate, mapping decision, and calibration.
12. **Not a score input** in v1.9c or by default later.

---

## Recommendation

| Question | Answer |
|----------|--------|
| Proceed to dedicated feasibility memo? | **Done (v1.9c)** — this document |
| Jump to artifact design? | **No** — source paths unproven |
| Build event watchlist now? | **No** — premature before v1.9c.1 |
| Build production artifact? | **No** |
| Score this lens? | **No** — discouraged by default |
| **Recommended next step** | **v1.9c.1 — Passive Supply Source Spike** |

### v1.9c.1 source spike targets (inventory only — not implemented in v1.9c)

- S&P DJI / Nasdaq / Russell **public index change announcements** — verify extract workflow
- **SIFMA** or other aggregate issuance reports — only if accessible and reusable
- **FRED** issuance-related series — only if verified by series ID and cadence in spike
- **SEC EDGAR** filing types for IPO/follow-on — feasibility of operator workflow, not automation
- **Public IPO calendar** sources — terms/licensing check
- **S&P buyback summaries** or other public buyback aggregate reports — only if reusable

**v1.9c.1 posture:** Source inventory + 1–2 manual operator extracts; **no runtime fetch**; optional research script only if a path locks.

---

## Next phase ladder

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.9c** | Passive Supply / Float Absorption Feasibility — **this memo** | **Done** (docs-only) |
| **v1.9c.1** | Passive Supply Source Spike | **Done** — recommended next |
| **v1.9c.2** | Event-based display artifact design | **Done** — [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) |
| **v1.9c.2a** | Operator event intake template | **Done** — appendix in design memo §14 |
| **v1.9c.3** | Example JSON + validator | **Future** — product-gated |
| **v1.9c.4** | Production / display integration | **Future** — product-gated |
| **v1.9c.5** | Mapping decision | **Future** — likely display-only Option A |
| **v1.9c.6** | Score gate | **Future** — discouraged |

**Parallel track:** **v1.9b.4** cap-weight production/display integration remains **independent and product-gated**. v1.9c does **not** block or merge into the cap-weight track.

---

## Guardrails (v1.9c)

- Feasibility memo only — no implementation
- Composite **62 / 58 / 66** unchanged
- `publicSignalCount` **10** unchanged
- Treasury **2**-card lane unchanged
- No score gates opened
- GhostRegime out of scope
- No committed downloaded data or generated research output in v1.9c

---

## Related documents

- [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) — v1.9a research queue
- [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) — v1.9c.1 source inventory and verification outcomes
- [PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md](./PASSIVE_SUPPLY_EVENT_ARTIFACT_DESIGN.md) — v1.9c.2 index inclusion event proxy artifact design
- [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) — v1.9b demand-side return-effect companion
- [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) — v1.9b.2–b.3 artifact track
- [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md) — parallel feasibility pattern
- [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) — YELLOW aggregate proxy precedent
- [RETIREMENT_FLOW_FEASIBILITY.md](./RETIREMENT_FLOW_FEASIBILITY.md) — quarterly vs weekly cadence boundary example
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase ladder
