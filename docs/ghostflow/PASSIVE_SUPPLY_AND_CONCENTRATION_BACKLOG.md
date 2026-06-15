# Passive Supply & Concentration Research Backlog (GhostFlow v1.9a)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)

**Status:** Future-research backlog memo only — **docs-only**; no score, artifact, UI, or runtime changes.  
**Effective:** v1.9a (after v1.8 cleanup complete)  
**Related:** [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) · [MOCK_SCORE_RETIREMENT_PLAN.md](./MOCK_SCORE_RETIREMENT_PLAN.md) · [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md)

This memo captures future GhostFlow research candidates inspired by recent Mike Green podcast/Substack work on passive market structure, concentration, supply, systematic flows, protection demand, and related themes. It does **not** implement data sources, score changes, artifacts, UI cards, or runtime behavior. GhostRegime, GhostYield, Models, and builder are out of scope.

---

## Status

| Item | v1.9a posture |
|------|---------------|
| Document type | Future-research backlog memo only |
| v1.9a scope | Backlog capture only |
| Score changes | **None** — Composite **62** · Passive **58** · Structural **66** unchanged |
| Artifact JSON changes | **None** |
| Example artifact changes | **None** |
| UI / component changes | **None** |
| Runtime / live fetching | **None** |
| New data sources | **None** |
| Implementation approved | **No** |
| Score gates opened | **No** (v1.0c, v1.1f, v1.2f, v1.4f, v1.7g, v1.8i remain discouraged) |
| `publicSignalCount` | **10** (equity) — unchanged |
| Treasury lane | **2** separate display-only cards — unchanged |
| All candidates | Start as **feasibility / research-only** unless separately product-approved |

---

## Why this exists

GhostFlow currently tracks:

- **Passive pressure** and **structural fragility** in the equity Research Composite
- **Six** score-fed public artifacts, **one** derived sub-input, and **three** static MOCK passive inputs
- **Four** display-only equity/public artifact cards
- **Treasury Plumbing** as a separate two-card display-only lane outside `publicSignalCount`

Recent Mike Green material adds a disciplined future research queue around themes that are adjacent to, but not yet covered by, the live dashboard:

- Cap-weight concentration premium (weighting mechanism vs concentration level)
- Passive supply and float absorption (IPO, secondaries, lockups, index inclusion)
- Systematic re-risking / de-risking (beyond static MOCK and CFTC positioning proxy)
- Protection bid and correlation dispersion (skew, implied correlation, single-stock vs index vol)
- Mega-cap autocorrelation / flow-fed momentum
- Individual-security valuation stress (likely outside composite)
- Credit catalysts / AI financing stress (likely outside GhostFlow core)

This memo **parks** those ideas so they can be evaluated later without accidental score creep, new artifact sprawl, or narrative-only “AI bubble” scoring.

---

## Current GhostFlow boundary

GhostFlow is an **equity passive-pressure / market-structure research gauge**. It is **not**:

- A full macro model
- A credit model
- A forecast engine
- An IPO trading model
- An AI bubble score
- Investment advice

Any future candidate in this backlog starts **display-only / feasibility-only** unless separately approved through product gate, mapping decision, calibration, and test discipline.

**Headline state unchanged:** Composite **62** · Passive **58** · Structural **66** · band *Crowded / Reflexive* · equity `publicSignalCount` **10** · Treasury **2** display-only cards · MOCK **62 / 58 / 55**.

---

## Priority order

| # | Candidate | Research value | GhostFlow semantic fit | Likely data availability | Double-count risk | Score-creep risk | Recommended next action | Suggested future phase |
|---|-----------|------------------|------------------------|--------------------------|-------------------|------------------|-------------------------|------------------------|
| 1 | **Cap-Weight Concentration Premium Lens** | High — tests whether weighting mechanism itself produces excess return | **High** — natural companion to existing `concentration` card | **High** — SPY/RSP and index price series are public | Low–medium vs `concentration`, `passive-share` | Medium if wired without gate | **v1.9b Done** — [feasibility memo](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md); next: **v1.9b.1** CSV study or **v1.9c** | **v1.9b Done** · **v1.9b.1 next** |
| 2 | **Passive Supply / Float Absorption Lens** | High — supply-side complement to demand/flow proxies | **High** — passive market-structure native | Medium — event data fragmented; aggregates harder | Medium vs `etf-flow`, buyback narrative | High if scored naively | Future feasibility memo; display-only default | **v1.9c** |
| 3 | **Systematic Re-Risking / De-Risking Lens** | High — addresses MOCK trust gap on `systematicStrategyPressure` | **Medium–high** — passive flow theme; semantic rename required | Medium — vol/trend public; true CTA exposure harder | Medium vs VIX, CFTC display card | **High** — direct MOCK replacement temptation | Future feasibility; long-term MOCK retirement path only | **v1.9d** |
| 4 | **Protection Bid / Correlation Dispersion Lens** | Medium–high — options-market uncertainty framing | **Medium** — vol/options adjacent; distinct from VIX amplifier | Medium — VIX/SKEW public; implied correlation harder | **High** vs score-fed VIX and OCC display proxy | High without reweight decision | Future feasibility; display-only default; avoid VIX double-count | **v1.9e** |
| 5 | **Mega-Cap Autocorrelation / Flow Momentum Lens** | Medium — “machine-powered momentum” hypothesis | **Medium–high** — related to cap-weight premium | High if folded into price-series work | Medium vs breadth, concentration | Medium | **Fold into v1.9b** if clean; else split | **v1.9f** or appendix in **v1.9b** |
| 6 | **Valuation Stress / Individual-Security CAPE Lens** | Medium — valuation context | **Low** for composite — valuation regime, not passive flow | Medium — per-stock history work heavy | Low in composite; narrative overlap risk | Low in composite; high if forced into GhostFlow | Park as **outside-core** context candidate | **v1.9g** or defer outside GhostFlow |
| 7 | **Credit Catalyst / AI Financing Stress Lane** | High for macro/credit product | **Outside core** — not equity passive-pressure gauge | Medium — spreads, filings, distressed data | N/A to composite | N/A — do not fold in | Document only; separate lane if product wants | Outside GhostFlow |

---

## Research candidate 1 — Cap-Weight Concentration Premium Lens

**Working title:** Cap-Weight Concentration Premium Lens

**Core idea:** Passive cap-weighting may itself produce a persistent return premium for the largest names. The clean test is to compare the same universe of stocks under cap-weighted versus equal-weighted construction.

**Potential scope:**

- SPY vs RSP
- S&P 500 cap-weighted versus equal-weighted spread
- QQQ versus equal-weight Nasdaq proxy if sourceable
- Top-size-bucket cap-weighted basket versus equal-weighted basket
- Rolling 1-year / 3-year / 5-year / 10-year premium
- Premium by size bucket, if data supports it
- Possible relationship to top-10 concentration and breadth

**Why it matters:**

- Existing [`concentration`](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) card measures how much index weight sits in the largest names.
- This candidate asks whether the **weighting mechanism itself** is producing excess return.
- It is the cleanest GhostFlow-native idea from the Mike Green material.
- It may be a stronger companion to top-10 concentration than another generic passive-share metric.

**Candidate public sources to investigate later:**

- SPY / RSP price history
- S&P 500 cap-weight and equal-weight index data if available
- Nasdaq 100 and equal-weight proxies if available
- Public ETF/index price series
- Public holdings data if basket construction is later considered

**Default recommendation:**

- **v1.9b feasibility complete** — [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) rates SPY/RSP **YELLOW leaning GREEN**
- Display-only by default if later implemented
- No score wiring without later product gate
- **Next:** **v1.9b.1** operator-CSV study (candidate) or **v1.9c** passive supply feasibility per product decision

**Completed phase:** **v1.9b — Cap-Weight Concentration Premium Feasibility** (docs-only)

**Suggested future phases:** **v1.9b.1** CSV study · **v1.9b.2** artifact design (if study useful)

---

## Research candidate 2 — Passive Supply / Float Absorption Lens

**Working title:** Passive Supply / Float Absorption Lens

**Core idea:** Passive demand is one side of the market; new float and equity supply are the other.

**Potential scope:**

- Major IPOs
- Secondary offerings
- Lockup releases
- Index inclusion / exclusion decisions
- Estimated index demand versus free float
- Buybacks versus issuance
- Large companies equitizing debt or funding obligations with equity
- Index rebalance calendar and known inclusion demand

**Why it matters:**

- Years of buybacks/shrinking float may have amplified passive demand.
- Large new equity supply could change the regime.
- Low-float mega-IPOs and index inclusion decisions can create large mechanical demand relative to available float.
- This is the missing **supply-side** complement to GhostFlow’s demand/flow proxies.

**Candidate public sources to investigate later:**

- IPO calendars
- S-1 / prospectus data
- Exchange listings
- SEC filings / EDGAR
- Company share-count and buyback disclosures
- S&P / Nasdaq / Russell index announcements
- Public secondary offering announcements
- SIFMA / FRED / other aggregate issuance data if available

**Default recommendation:**

- Future feasibility memo
- Event-driven / display-only by default
- No score wiring
- No `publicSignalCount` change unless later product-approved

**Suggested future phase:** **v1.9c — Passive Supply / Float Absorption Feasibility**

---

## Research candidate 3 — Systematic Re-Risking / De-Risking Lens

**Working title:** Systematic Re-Risking Proxy

**Core idea:** The static `systematicStrategyPressure` MOCK input is one of GhostFlow’s remaining trust gaps. A better future path may involve systematic exposure / re-risking proxies, not just CFTC positioning.

**Potential scope:**

- CTA trend exposure
- Vol-control allocation state
- Realized volatility versus implied volatility
- Price trend / momentum state
- Short-covering / positioning reversal proxies
- CFTC positioning as context, not proof of CTA/vol-control pressure

**Why it matters:**

- [v1.8b](./MOCK_SCORE_RETIREMENT_PLAN.md) kept `systematicStrategyPressure` as MOCK **62**.
- CFTC [`systematic-flow`](./CFTC_TFF_MAPPING_DECISION.md) is useful but **not** semantically identical to CTA / vol-control / systematic strategy pressure.
- Mike Green’s comments emphasize systematic strategies and vol-control re-risking as part of aggregate flow pressure.

**Candidate public sources to investigate later:**

- Realized volatility series
- VIX / implied volatility
- Trend/momentum proxies
- CFTC positioning
- Public CTA exposure estimates if legally accessible
- Vol-control proxy formulas from public returns/volatility, if defensible

**Default recommendation:**

- Future feasibility memo
- Possible long-term path to retire `systematicStrategyPressure` MOCK
- No score replacement without product gate, semantic review, calibration, UI/methodology updates, and tests

**Suggested future phase:** **v1.9d — Systematic Re-Risking Proxy Feasibility**

---

## Research candidate 4 — Protection Bid / Correlation Dispersion Lens

**Working title:** Protection Bid / Correlation Dispersion Lens

**Core idea:** The options market may signal uncertainty through protection demand, fixed-strike volatility, skew, implied correlation, and single-stock versus index volatility/correlation relationships.

**Potential scope:**

- VIX
- SKEW
- Put/call ratios
- Implied correlation if sourceable
- Single-stock versus index volatility relationship
- Options activity context from existing OCC proxy
- Protection bid versus realized volatility

**Why it matters:**

- GhostFlow already has VIX as a score-fed volatility amplifier (`optionsVolatilityAmplifier`).
- OCC [`options-activity-proxy`](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) is display-only and not 0DTE/GEX.
- This candidate asks a **different question**: whether protection demand is building and where it is concentrated.
- It may help explain low-correlation / high-dispersion environments.

**Candidate public sources to investigate later:**

- CBOE VIX
- CBOE SKEW
- OCC activity
- Put/call data if publicly accessible
- Implied correlation data if accessible
- ETF/index volatility proxies

**Default recommendation:**

- Future feasibility memo
- Display-only by default
- Avoid double-counting VIX
- No score wiring without replacement/reweighting decision

**Suggested future phase:** **v1.9e — Protection Bid / Correlation Dispersion Feasibility**

---

## Research candidate 5 — Mega-Cap Autocorrelation / Flow Momentum Lens

**Working title:** Mega-Cap Autocorrelation / Flow Momentum Lens

**Core idea:** Classic cross-sectional momentum may weaken while own-price continuation strengthens among mega-cap flow recipients because passive buying keeps re-energizing price movement.

**Potential scope:**

- Mega-cap return autocorrelation
- Mega-cap autocorrelation versus rest of index
- Rolling monthly autocorrelation
- Cap-weighted basket continuation versus equal-weighted basket continuation
- Relationship between autocorrelation, concentration, and passive share

**Why it matters:**

- It may capture the “machine-powered momentum” effect described in the Substack excerpt.
- It is likely related to the Cap-Weight Concentration Premium Lens.
- It may not need a separate phase if v1.9b can include it cleanly.

**Candidate public sources to investigate later:**

- Public price series
- Mega-cap basket returns
- Equal-weighted baskets
- SPY/RSP and QQQ/equal-weight proxy if available

**Default recommendation:**

- Fold into **v1.9b** if feasible
- Split into later phase only if v1.9b gets too large
- Display-only / research-only by default

**Suggested future phase:** **v1.9f — Mega-Cap Autocorrelation / Flow Momentum Feasibility** — or include as appendix in **v1.9b**.

---

## Research candidate 6 — Valuation Stress / Individual-Security CAPE Lens

**Working title:** Valuation Stress / Individual-Security CAPE Lens

**Core idea:** Aggregate valuation measures can be distorted by changing index composition. Stock-by-stock valuation versus each company’s own history may better identify valuation stress.

**Potential scope:**

- Individual-stock valuation versus history
- Index-level aggregate built from individual-stock valuation stress
- Mega-cap valuation percentile versus own history
- Ex-mega-cap valuation dispersion

**Why it matters:**

- May provide better valuation context than aggregate CAPE alone.
- Could help interpret whether passive concentration is occurring alongside extreme valuation stretch.

**Why it may not belong in GhostFlow composite:**

- This is **valuation regime**, not passive-flow pressure.
- It may belong in GhostRegime, a valuation context page, or a separate display-only lane.
- Avoid mixing valuation score with passive market-structure gauge unless later approved.

**Default recommendation:**

- Park as **outside-core / context** candidate
- No GhostFlow composite impact
- No implementation in v1.9a

**Suggested future phase:** **v1.9g — Valuation Stress Context Feasibility** — or defer outside GhostFlow.

---

## Related but likely outside GhostFlow — Credit Catalyst / AI Financing Stress

**Working title:** Credit Catalyst / AI Financing Stress Lane

**Core idea:** Credit markets have an internal catalyst: borrowers either make payments or they do not. AI financing/capital-structure stress may matter, but it is not the same as GhostFlow’s equity passive-pressure gauge.

**Potential scope:**

- AI infrastructure financing stress
- Convertible/debt maturity pressure
- Credit spreads
- Distressed debt indicators
- Capital-structure control / loan-to-own dynamics
- Vendor financing / circular revenue risk
- Data center debt / financing stress

**Why likely outside GhostFlow:**

- GhostFlow is focused on equity passive-pressure and market-structure signals.
- Credit catalyst work may belong in GhostRegime, GhostYield, or a future separate “Credit Plumbing” lane.
- Do **not** fold this into the GhostFlow composite.

**Default recommendation:**

- Document as **outside-core** candidate
- No GhostFlow score impact
- Consider separate future planning thread if product wants it

---

## Revised v1.9 roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.9a** | Passive Supply & Concentration Research Backlog — **this memo** | **Done** (docs-only) |
| **v1.9b** | Cap-Weight Concentration Premium Feasibility | **Done** — [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) |
| **v1.9b.1** | Cap-Weight Premium CSV Study | **Future** — **candidate next** |
| **v1.9b.2** | Cap-Weight Premium Artifact Design | **Future** — if v1.9b.1 useful |
| **v1.9c** | Passive Supply / Float Absorption Feasibility | **Future** — research-only |
| **v1.9d** | Systematic Re-Risking Proxy Feasibility | **Future** — research-only |
| **v1.9e** | Protection Bid / Correlation Dispersion Feasibility | **Future** — research-only |
| **v1.9f** | Mega-Cap Autocorrelation / Flow Momentum Feasibility | **Future** — optional or folded into v1.9b |
| **v1.9g** | Valuation Stress Context Feasibility | **Future** — likely outside GhostFlow core |
| **Credit Catalyst / AI Financing Stress** | Outside GhostFlow | **Future** — possible separate lane |

None of the future phases above are approved for implementation, scoring, artifacts, UI cards, or `publicSignalCount` changes.

---

## Guardrails

- All candidates start as **feasibility / research-only**.
- **No score changes** in v1.9a or by default in future phases.
- **No new cards** without separate UI approval.
- **No artifacts** or example JSON without design + validation discipline.
- **No runtime feeds** or live API routes.
- **`publicSignalCount` remains 10** (equity).
- **No score gates opened** (v1.0c, v1.1f, v1.2f, v1.4f, v1.7g, v1.8i).
- **No Treasury merge** into equity composite.
- **No GhostRegime merge** into GhostFlow.
- **No investment advice** or trading recommendation framing.
- **No narrative-only “AI bubble” score.**

---

## Recommended next step

**v1.9b** — Cap-Weight Concentration Premium Feasibility — **Done** ([memo](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md)).

**Candidate next:** **v1.9b.1** operator-CSV study or **v1.9c** passive supply feasibility per product decision.

The first empirical question for v1.9b.1:

> Can we compute rolling SPY vs RSP return spreads and ratio percentiles from operator-provided adjusted-close CSVs without live fetching?

If v1.9b.1 looks messy — data gaps, unclear semantics, or high double-count risk with existing `concentration` — **pause** rather than forcing a new artifact.
