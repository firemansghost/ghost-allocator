# Passive Supply Source Spike (GhostFlow v1.9c.1)

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md)  
**Related:** [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) · [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md)

---

## Status

| Item | v1.9c.1 posture |
|------|------------------|
| Phase type | Source spike / source inventory |
| Deliverable type | Docs-only memo |
| Artifact JSON | None |
| UI changes | None |
| Score changes | None |
| Runtime fetching | None |
| Research scripts | None |
| `publicSignalCount` | 10 (equity) unchanged |
| Composite / Passive / Structural | 62 / 58 / 66 unchanged |
| Treasury lane | Separate 2-card display-only lane unchanged |
| GhostRegime / GhostYield / Models / builder | Out of scope |

**Marketstack/API containment (explicit):**

- No Marketstack calls were made.
- No app runtime paths were used for verification.
- No build, refresh, ETL, or data jobs were run.
- Verification used source-page inspection only.

---

## Source-lock criteria

A source path is treated as **locked** only if all criteria are met:

1. Public or operator-accessible without paid terminal access.
2. Acceptable terms for manual citation / metadata use.
3. Stable fields or event structure.
4. Known cadence.
5. Manual refresh workflow is clear.
6. Structured numeric/event output (not narrative-only).
7. Maps to a clear display-only concept.
8. Does not require proprietary free-float estimates to be meaningful.

**Lock statuses used in this memo:**

- **LOCKED (partial):** usable for one narrow display-only concept (for example, event list or quarterly context).
- **NOT LOCKED:** still research-only; cannot support artifact design yet.

---

## Candidate source inventory

## A) Aggregate equity issuance

| Candidate source | Verified location | Data type | Cadence | Notes |
|---|---|---|---|---|
| SIFMA US Equity and Related Statistics | https://www.sifma.org/research/statistics/us-equity-and-related-securities-statistics/ | Web stats + quarterly PDF references | Monthly/quarterly | Public page includes total equity issuance + IPO issuance and references downloadable reports; likely manual extract path |
| Fed EFA Equity Issuance and Retirement | https://www.federalreserve.gov/releases/efa/efa-project-equity-issuance-retirement.htm | CSV links + data dictionary | Quarterly + monthly components | Strong structured public path for issuance/retirement context (nonfinancial corporate scope) |
| FRED Z.1 series (example verified) | https://fred.stlouisfed.org/series/NCBCEBQ027S | Time series | Quarterly | Real series ID verified with units/frequency/release metadata |

**Lock outcome:** **LOCKED (partial)** for quarterly macro context.

---

## B) Buyback / net issuance context

| Candidate source | Verified location | Data type | Cadence | Notes |
|---|---|---|---|---|
| S&P DJI buyback releases (public press path) | https://press.spglobal.com/2025-06-25-S-P-500-Q1-2025-Buybacks-Set-Quarterly-Record-at-293-Billion,-Up-20-6-,-Helping-EPS-Growth-Impact-and-Expenditures-Expected-to-Decline-in-Q2-2025 | Press release with quarterly values | Quarterly | Public path exists but press page retrieval can be inconsistent; still usable for citation, weaker as machine-stable table |
| S&P DJI media center root | https://www.spglobal.com/spdji/en/media-center/news-announcements/ | Announcement index | Ongoing | Official path verified through search; direct fetch timeout observed during this spike |
| Fed EFA retirement components | https://www.federalreserve.gov/releases/efa/efa-project-equity-issuance-retirement.htm | CSV + dictionary | Quarterly/monthly | Includes repurchases/retirements in same framework as issuance context |

**Lock outcome:** **LOCKED (partial)** for lagged quarterly context; **NOT LOCKED** for timely market-wide operational series.

---

## C) IPO / secondary / lockup calendar

| Candidate source | Verified location | Data type | Cadence | Notes |
|---|---|---|---|---|
| SEC EDGAR full-text filing search | https://www.sec.gov/edgar/search/ | Search UI for forms (S-1/424B etc.) | Event-driven | Public and usable manually; no runtime automation assumed |
| NYSE IPO filings page | https://www.nyse.com/ipo-center/filings | Table page | Event-driven | Public page available; "Source: S&P Global" appears on page and update cadence can be stale |
| NYSE listings directory | https://www.nyse.com/listings_directory/stock | Listings directory | Ongoing | Public listings surface exists, but not a direct IPO/secondary canonical table |
| Nasdaq legal/terms page | https://www.nasdaq.com/legal | Terms page | N/A | Terms govern site usage; licensing constraints should be treated conservatively |

**Lock outcome:** **NOT LOCKED** as continuous structured lane; **usable only as manual watchlist/memo workflow**.

---

## D) Index inclusion / rebalance events

| Candidate source | Verified location | Data type | Cadence | Notes |
|---|---|---|---|---|
| S&P DJI media/announcement path | https://www.spglobal.com/spdji/en/media-center/news-announcements/ | Announcement feed | Event-driven | Official public announcement path; page fetch timeout observed in this run but location is known |
| Nasdaq index reconstitution announcement example | https://ir.nasdaq.com/news-releases/news-release-details/annual-changes-nasdaq-100-indexr-2 | News release with add/remove lists + effective date | Quarterly/annual | Public event structure is clear and repeatable for manual extraction |
| Nasdaq methodology (announcement/effective date rules) | https://indexes.nasdaq.com/docs/Methodology_NDX.pdf | Methodology document | Rule-based | Supports cadence and effective-date discipline |
| FTSE Russell reconstitution page | https://www.lseg.com/en/ftse-russell/russell-reconstitution | Reconstitution schedules + preliminary additions/deletions files | Semi-annual + updates | Strong public event lane with dated updates and downloadable files |

**Lock outcome:** **LOCKED (partial)** for event-based display concept (adds/deletes/effective dates).  
**Not locked** for demand-vs-float modeling.

---

## E) Free float / float percentage

| Candidate source | Verified location | Data type | Cadence | Notes |
|---|---|---|---|---|
| Russell methodology/reconstitution page (float-adjusted methodology context) | https://www.lseg.com/en/ftse-russell/russell-reconstitution | Methodology + announcements | Rule docs | Useful for methodology context, not broad free-float dataset |
| SEC Form 10-K cover page requirements | https://www.sec.gov/about/forms/form10-k.pdf | Form requirements text | Annual filing | Public float disclosure is issuer-specific and stale for continuous market-wide lens |
| SEC FRM topic references | https://www.sec.gov/about/divisions-offices/division-corporation-finance/financial-reporting-manual/frm-topic-5 | Regulatory interpretation | N/A | Confirms public-float definition context; not a market-wide feed |

**Lock outcome:** **NOT LOCKED** for market-wide float series (remains RED).

---

## F) Mega-cap / top-N share-count trends

| Candidate source | Verified location | Data type | Cadence | Notes |
|---|---|---|---|---|
| SEC EDGAR filing search | https://www.sec.gov/edgar/search/ | Filing discovery | Quarterly/annual/event | Manual extraction possible for top-N issuers |
| Form 10-K requirements | https://www.sec.gov/about/forms/form10-k.pdf | Filing disclosure framework | Annual | Shares/public float fields are available but scattered and lagged |

**Lock outcome:** **LOCKED (partial)** for **narrow research appendix** only; not broad market proxy.

---

## Source lane ratings (post-verification)

| Lane | v1.9c baseline | v1.9c.1 result | Rating now |
|---|---|---|---|
| A Aggregate issuance | YELLOW | Partial lock found (SIFMA + Fed/FRED macro paths) | **YELLOW** |
| B Buyback / net issuance | YELLOW / YELLOW-RED | Partial lock for lagged context only | **YELLOW (aggregate), YELLOW leaning RED (timely)** |
| C IPO / secondary / lockup | YELLOW events / RED series | Manual watchlist path only; no stable continuous source lock | **YELLOW (events), RED (continuous)** |
| D Index inclusion/rebalance | YELLOW events / RED model | Event path lock for adds/deletes/effective dates | **YELLOW (events), RED (demand-vs-float model)** |
| E Free float at scale | RED | No public market-wide float lock | **RED** |
| F Top-N share-count trends | YELLOW narrow | Narrow manual path lock only | **YELLOW (narrow research only)** |

---

## Verification log

| Date | Target | Result | Notes |
|---|---|---|---|
| 2026-06-16 | SIFMA equity statistics | PASS | Public stats page with issuance figures and quarterly references |
| 2026-06-16 | Fed EFA issuance/retirement | PASS | Public CSV/dictionary links confirmed |
| 2026-06-16 | FRED issuance-related series | PASS | Real series ID verified (`NCBCEBQ027S`) with units/frequency |
| 2026-06-16 | SEC EDGAR filing workflow | PASS | Public search path confirmed for S-1/424B manual review |
| 2026-06-16 | NYSE IPO/listings pages | PARTIAL | Public pages exist; data source/cadence constraints noted |
| 2026-06-16 | Nasdaq index change path | PASS | Public index-change announcement + methodology path verified |
| 2026-06-16 | Russell reconstitution files | PASS | Public schedule + preliminary add/delete files verified |
| 2026-06-16 | S&P DJI media center fetch | PARTIAL | Official URL identified; direct fetch timeout during this run |
| 2026-06-16 | Free-float-at-scale source | FAIL | No public, repeatable, market-wide free-float feed verified |

---

## What counted as success

This spike counts as **successful (partial)** because:

- At least one viable event path is locked (**Lane D**).
- At least one viable macro quarterly context path is locked (**Lanes A/B partial**).
- Free-float-at-scale remains explicitly **not locked** (**Lane E RED**), which is an expected and useful negative finding.

---

## Relationship to live artifacts

| Existing artifact | What it already measures | Relationship to supply spike |
|---|---|---|
| `etf-flow` | Fund vehicle demand | Separate from corporate supply |
| `active-index-flow` | Active/index fund flows | Separate from issuance/float supply |
| `passive-share` | Index asset stock | Separate from new equity supply |
| `concentration` | Top-weight structure | Not a supply creation metric |
| `cap-weight-premium-proxy` | Return-effect spread | Companion narrative, not supply data |
| `systematic-flow` | CFTC futures positioning proxy | Different domain |
| `retirement-asset-growth` | Retirement assets stock | Different cadence/construct |

**Boundary:** v1.9c.1 is source verification only. No merge into score, no `publicPassiveInputKey`, no `publicSignalCount` change.

---

## Candidate next step

**Recommended next phase:** **v1.9c.2 Event-based display artifact design (product-gated)**, anchored to Lane D event-path viability, with optional Lane A/B quarterly context companion.

Decision options after this spike:

- **A (recommended):** v1.9c.2 event-based design (index adds/deletes/effective dates).
- **B (secondary):** v1.9c.2 quarterly macro context design (issuance/buyback context).
- **C (optional side study):** top-N share-count appendix research only.
- **D:** keep backlog only if product does not want event/context lane.

---

## Caveats

- Sources are fragmented across exchanges, index providers, SEC, and macro datasets.
- Several paths are event-driven or lagged; not continuous.
- Licensing/redistribution can constrain raw file reuse.
- Some official pages are PDF-heavy or intermittently difficult to fetch.
- Public float at scale remains largely proprietary in operational form.
- These paths provide context, not causality.
- Not a trading signal and not an AI-bubble score.
- Display-only by default if promoted later.

---

## Guardrails (v1.9c.1)

- Docs-only phase.
- No code, artifact, UI, scoring, or runtime changes.
- No build, refresh, ETL, or Marketstack/API jobs.
- No downloaded data files committed.
- No generated research output committed.
- `publicSignalCount` remains 10.
- Composite / Passive / Structural remains 62 / 58 / 66.
- Treasury remains separate 2-card display-only lane.
- GhostRegime remains out of scope.
