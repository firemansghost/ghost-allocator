# GhostFlow Market Breadth Source Feasibility Audit

**Status:** Research / documentation only — no adapter, registry, artifact, score, or runtime change.  
**Audit date:** 2026-07-13  
**Starting `main` SHA:** `83780ac5b3aa94403602dc387e9e25fca7d9fc65` (PR #132 CBOE VIX adapter merged)  
**Series under review:** S&P 500 percentage of constituents above their 50-day moving average  
**Canonical GhostFlow field:** `sp500Above50DayMaPercent` on `marketBreadth.v1.json`

> **Disclaimer:** This memo is an operational feasibility assessment, not legal advice. Policy classifications are based on publicly published provider documentation accessed on the audit date.

---

## 1. Executive decision

| Item | Verdict |
|------|---------|
| **Overall** | **MANUAL-ONLY / automation blocked** for the currently registered StockCharts HTML path |
| **StockCharts `$SPXA50R` HTML automation** | **RED** — programmatic extraction expressly forbidden; page is JS-dependent; not a documented machine contract |
| **Recommended path** | **Preserve breadth as a manual operator packet** (option **2**); keep Gate C manual until a documented, authorized machine source exists |
| **Do not implement** | `stockcharts-spxa50r-html` adapter, Scrapers, OCR, hidden endpoints, or Gate C runner dependent on automated breadth |
| **Falsifier for revisiting GREEN** | Written StockCharts permission **or** a documented licensed API that explicitly delivers S&P 500 % above 50-day MA with clear terms |

**Smallest next PR (after this audit):** docs-only operator-packet intake design for `marketBreadth` (typed fields + evidence checklist). **Do not** change the refresh registry in that PR until Bobby explicitly approves `operator_packet` as the breadth source format.

---

## 2. Current GhostFlow contract

| Item | Current state |
|------|----------------|
| Artifact | `data/ghostflow/artifacts/marketBreadth.v1.json` |
| Observation | `asOf` **2026-07-01**, `sp500Above50DayMaPercent` **64.0**, `dataQuality` **manual_unverified** |
| Primary named source | StockCharts S&P 500 % Above 50-Day SMA (`$SPXA50R`) |
| Backup named in artifact | Barchart `$S5FI` (cross-check only; last production pass noted backup **not obtained**) |
| Registry | `artifactId: marketBreadth`, `sourceFormat: html`, `adapterId: stockcharts-spxa50r-html`, `implementationStatus: planned`, `automationReadiness: yellow` |
| Gate C | Shares `gate_c_daily_session` with `volatilityRegime`; `acceptanceUnit: candidate_group`; `referenceDateRole: gate_c_required` |
| Score role | Structural `breadthWeakness` via existing mapper (one-decimal normalize + piecewise weakness) — **owned by artifact layer, not a future source adapter** |
| Prior ops | Manual runbook [`BREADTH_ARTIFACT_RUNBOOK.md`](./BREADTH_ARTIFACT_RUNBOOK.md); Gate C bump requires VIX **and** breadth on same session ([`REFERENCE_DATE_AND_OPERATOR_POLICY.md`](./REFERENCE_DATE_AND_OPERATOR_POLICY.md)) |
| VIX status after PR #132 | Official CBOE VIX CSV adapter **implemented**, fixture-tested, **unwired** |

A future source adapter for breadth must normalize **only** raw percentage + durable provenance. Mapping, banding, scoring, and artifact validation remain downstream.

---

## 3. Current StockCharts technical findings

**Canonical page (registry):**  
https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R

### Access observations (2026-07-13, non-authenticated)

| Probe | UTC timestamp | Method | HTTP | Content-Type | Notes |
|-------|----------------|--------|------|--------------|-------|
| A | `2026-07-13T19:12:19Z` | PowerShell `Invoke-WebRequest -UseBasicParsing` | **200** | `text/html` | Raw body ~160 KB; **no** plain-text `SPXA50R` match; **14** script tags; login/membership affordances present |
| B | `2026-07-13T19:12:35Z` | Same, `%24SPXA50R` URL encoding | **200** | `text/html` | Same pattern — symbol/value not present as static HTML text |
| C | Same session | Ordinary markdown/render extract of public URL (no login, no cookies) | page reachable | HTML → readable summary | Symbol title recognized; numeric summary and intraday “Summary as of” label visible in rendered view |

### Interpretation

| Question | Finding |
|----------|---------|
| Symbol recognized? | **Yes** in human/rendered surface (“S&P 500 Percent of Stocks Above 50 Day Moving Average”) |
| Value in **static** HTML? | **No** (raw probe fails to locate symbol/value text) |
| Observation date in static HTML? | **No** reliable EOD session date in raw HTML |
| JavaScript required? | **Yes** for ordinary browser consumption of quote summary |
| Login required for summary page? | **No** for page load; membership upsells present for ChartLists/earnings features |
| Stable across two raw observations? | Raw shell probes **consistently empty of symbol/value**; not a deterministic text parser surface |
| Suitable for GhostFlow HTML adapter? | **No** — nondeterministic relative to GhostFlow’s fetch→parse→normalize contract; ChartSchool documents **EOD** update (usually by ~6:00 PM ET), while daytime summary pages may present **intraday** figures |

**Hard boundary observed:** This audit performed only ordinary public page access. No login, no cookies, no XHR reverse-engineering, no OCR, no chart-image scraping.

---

## 4. StockCharts policy and permission findings

| Document | Publisher | URL | Access date | Relevant rule (paraphrased) | Automation classification |
|----------|-----------|-----|-------------|-----------------------------|---------------------------|
| Usage Limitations — “No Automated Access” | StockCharts | https://help.stockcharts.com/learning-more/policies-and-limitations/usage-limitations | 2026-07-13 | Unless prior approval, access must be via a normal web browser in non-automated mode; scripts/macros/programmatic access forbidden and blocked | **prohibited** (without prior approval) |
| Terms of Service | StockCharts | https://help.stockcharts.com/learning-more/policies-and-limitations/terms-of-service | 2026-07-13 | License framed as internal non-commercial / personal / educational use; prohibitions include automated or non-automated “scraping” and robot/spider/programmatic collection; also restricts professional market-data analysis use of Services | **prohibited** for scraping / automated collection; **permission_required / unclear** for commercial product display even of human-viewed values |
| Reprint Permission Policies | StockCharts | https://help.stockcharts.com/learning-more/policies-and-limitations/reprint-permission-policies | 2026-07-13 | Chart republishing allowed under attribution rules; charts must be copied **manually**, not by script | **prohibited** for scripted chart capture |
| How Do I Download Data to Excel? | StockCharts | https://help.stockcharts.com/data-and-ticker-symbols/data-availability/historical-data/how-do-i-download-data-to-excel | 2026-07-13 | **Pro** members may manually download daily/weekly/monthly CSV from SharpCharts historical UI — not Basic/Extra | Documented **manual** export; **not** a public API |
| StockCharts Percent Above Moving Average (ChartSchool catalog) | StockCharts | https://chartschool.stockcharts.com/table-of-contents/index-and-market-indicator-catalog/stockcharts-percent-above-moving-average | 2026-07-13 | `$SPXA50R` is StockCharts in-house breadth; EOD; dividend-adjusted; may differ from other vendors | Definitional authority for the named series |

**Operational risk class for production HTML adapter:** **prohibited** without documented prior approval / license.

Educational/noncommercial intent does **not** override the explicit ban on automated/programmatic website access. A production GhostFlow HTML adapter therefore must not be implemented without written StockCharts permission.

---

## 5. StockCharts manual operator path

| Assessment | Finding |
|------------|---------|
| Human can view latest value + session? | **Yes** via SharpCharts / symbol summary after EOD update (per ChartSchool / runbook) |
| Delayed? | ChartSchool: EOD, usually by ~6:00 PM ET |
| Independent cross-check? | Existing runbook: Barchart `$S5FI` directional check (~1 pp tolerance) |
| Preserve artifact definition? | **Yes** — same observation field and mapper |
| Typed operator packet instead of HTML fetch? | **Yes** — aligns with other GhostFlow operator_packet / manual red/yellow sources |
| Appropriate `dataQuality` | `verified_manual` with Barchart cross-check; else `manual_unverified` (current production is manual_unverified) |
| Operator evidence to retain | Session date, primary %, backup %, screenshots or Pro CSV export timestamps, `source.note`, access time |

**Verdict:** **YELLOW** — viable operational path; already production practice. Not GREEN machine automation.

---

## 6. Barchart assessment (`$S5FI` and OnDemand)

| Path | Finding | Verdict |
|------|---------|---------|
| Website quote `$S5FI` | Named backup in artifact/runbook for **manual** cross-check only. This audit did **not** scrape Barchart. Website automation rights were not confirmed as allowing GhostFlow bots. | **RED** for scrapers; **YELLOW** for human cross-check |
| Definitional equivalence to `$SPXA50R` | Names are similar but ChartSchool warns vendor methodologies differ (components, adjustment). GhostFlow already treats disagreement as `manual_unverified`. | Not definitionally identical |
| Barchart OnDemand `getMomentum` | Documented commercial JSON/XML/CSV API with `percentAbove50dMAtoday` etc. Inputs are **country / exchanges** (sample: `US` + `NASDAQ`). Docs retrieved 2026-07-13 do **not** show an explicit S&P 500 constituent universe or `$S5FI` symbol. Auth + Order Form required; cost via sales/contact. | **UNKNOWN→YELLOW** — licensed machine API exists for *exchange* breadth-like metrics, **not confirmed** as GhostFlow’s exact series |
| Master Terms | Services governed by Order Form + Master Terms (public PDF). Automated use of **contracted** OnDemand is the licensed path — not free website scraping. | Permission via commercial agreement |

---

## 7. Licensed-provider assessment

| Provider/path | Exact S&P 500 % > 50DMA? | Documented machine interface? | Cost visibility | Auth | Verdict |
|---------------|--------------------------|-------------------------------|-----------------|------|---------|
| StockCharts Pro CSV download | Likely for `$SPXA50R` via UI | Manual UI only | Subscription (Pro) | Membership | **YELLOW** (manual) |
| StockCharts public API | Not found | No | N/A | N/A | **RED** / unavailable |
| Barchart OnDemand | Not confirmed for S&P 500 constituents | Yes (`getMomentum` and related) | Sales / contact | API key | **UNKNOWN** until SKU confirmation |
| Other vendors (Bloomberg, Refinitiv, etc.) | Possible but **not verified** here | Typically yes when licensed | Opaque without quote | Vendor credentials | **UNKNOWN** |

No licensed provider was verified in this audit as delivering the **exact** GhostFlow series under terms already held by the project.

---

## 8. Derived-calculation assessment

Computing % of S&P 500 constituents above their own 50-day MA from constituent prices would be a **new derived-source methodology**, not an HTML parser swap.

Required (non-exhaustive):

- Authoritative point-in-time S&P 500 membership (licensed index constituent data)
- Adjusted vs unadjusted price policy matching series intent
- ≥50 trading-session warm-up per name
- Corporate actions, IPO/addition, delisting, halt, and missing-quote rules
- Same-session completeness / revision policy
- Rounding to one decimal for GhostFlow storage
- Data licensing for redistribute-or-display in product

**Verdict:** **YELLOW/RED for near-term Gate C** — high complexity and license cost; requires explicit Bobby product decision and likely registry `sourceFormat` change to `derived_study`. Free Wikipedia constituents + free quotes are **not** production-grade.

---

## 9. Source comparison

| Path | Owner | Series | Machine-readable | Documented access | Automation permission | Determinism | GhostFlow fit | Verdict |
|------|-------|--------|------------------|-------------------|----------------------|-------------|---------------|---------|
| StockCharts HTML adapter | StockCharts | `$SPXA50R` | No (JS page) | Website only | **Prohibited** without approval | Low | Bad — fails policy + parse contract | **RED** |
| StockCharts manual / Pro CSV | StockCharts | `$SPXA50R` | Manual CSV (Pro) | Help Center download article | Manual browser/UI | Medium–High with runbook | Good for fail-closed ops | **YELLOW** |
| Barchart `$S5FI` scrape | Barchart | Website quote | Unknown | Website | Not confirmed; do not scrape | Unknown | Backup only | **RED** (automation) |
| Barchart OnDemand momentum | Barchart | Exchange % above MA | Yes | OnDemand docs | Via paid Order Form | High if contracted | Fit only if SKU matches S&P 500 | **UNKNOWN** |
| Derived constituents | Self + data vendor | New GF method | Yes if built | Self + licenses | Depends on inputs | Hard | New methodology | **YELLOW** (project) / not near-term GREEN |
| Unlicensed hidden endpoint | N/A | N/A | N/A | None | Disallowed by GF policy | N/A | Forbidden | **RED** |

---

## 10. Recommended path

### Decision: **2. Preserve breadth as a manual operator packet**

**Why**

1. Official StockCharts Usage Limitations forbid automated/programmatic website access without prior approval.  
2. Raw HTML is not a deterministic GhostFlow parse surface (JS-dependent; symbol/value absent in static body).  
3. No verified licensed API currently delivers the exact `$SPXA50R` / S&P 500 constituent series under project-held rights.  
4. GhostFlow already operates breadth as manual JSON with explicit `dataQuality` and Barchart cross-check rules.  
5. VIX automation (PR #132) does not unblock Gate C; breadth remains the second Gate C half.

**What this implies**

- Leave breadth automation **blocked**.  
- Keep Gate C **manual** (no Gate C adapter runner that requires auto breadth).  
- Do **not** implement `stockcharts-spxa50r-html`.  
- Prefer clarifying operator-packet intake docs before any registry format change.

**Product gate requiring Bobby’s explicit approval**

- Buying StockCharts Pro / seeking written StockCharts redistribution or automation permission  
- Purchasing Barchart OnDemand (or other vendor) **after** written confirmation of S&P 500 constituent breadth SKU  
- Approving a derived-breadth methodology project  
- Changing registry `sourceFormat` from `html` to `operator_packet` (or other)

**Smallest next PR**

Docs-only: `marketBreadth` operator intake packet template + evidence checklist (no registry edit, no adapter, no artifact write).

---

## 11. Explicit non-decisions

This PR does **not**:

- Change `docs/project-ops/DECISIONS.md`
- Change refresh registry, adapters, artifacts, scores, MOCK, `publicSignalCount`, or `GHOSTFLOW_REFERENCE_AS_OF`
- Authorize StockCharts scraping or hidden APIs
- Authorize Barchart website scraping
- Select Barchart OnDemand as canonical without SKU proof
- Approve derived breadth
- Authorize a Gate C runner
- Perform a production refresh

---

## 12. Evidence log

| # | Source | Canonical URL | Title | Publisher | Updated / published | Access date | Method | Finding | Caveat |
|---|--------|---------------|-------|-----------|---------------------|-------------|--------|---------|--------|
| 1 | StockCharts registry page | https://stockcharts.com/freecharts/symbolsummary.html?sym=$SPXA50R | Symbol Summary | StockCharts | n/a | 2026-07-13 | `Invoke-WebRequest` ×2 | HTTP 200 HTML; static body lacks symbol/value | Feasibility probe only; no value stored as production |
| 2 | Same URL | same | Symbol Summary (rendered) | StockCharts | n/a | 2026-07-13 | Ordinary public page extract | Symbol recognized; numeric summary visible when rendered | Not a machine contract; may be intraday vs EOD |
| 3 | Usage Limitations | https://help.stockcharts.com/learning-more/policies-and-limitations/usage-limitations | Usage Limitations | StockCharts | n/a (accessed live) | 2026-07-13 | Web fetch | Automated/programmatic access forbidden without prior approval | Classification: prohibited |
| 4 | Terms of Service | https://help.stockcharts.com/learning-more/policies-and-limitations/terms-of-service | Terms of Service | StockCharts | n/a | 2026-07-13 | Web fetch | Scraping / robots / programmatic collection prohibited; license framed non-commercial/personal/educational | Not legal advice |
| 5 | Reprint policies | https://help.stockcharts.com/learning-more/policies-and-limitations/reprint-permission-policies | Reprint Permission Policies | StockCharts | n/a | 2026-07-13 | Search + docs | Charts must be copied manually, not by script | Applies to chart republication |
| 6 | Excel download help | https://help.stockcharts.com/data-and-ticker-symbols/data-availability/historical-data/how-do-i-download-data-to-excel | How Do I Download Data to Excel? | StockCharts | n/a | 2026-07-13 | Web fetch | Pro-only manual CSV download | Not an API |
| 7 | ChartSchool catalog | https://chartschool.stockcharts.com/table-of-contents/index-and-market-indicator-catalog/stockcharts-percent-above-moving-average | StockCharts Percent Above Moving Average | StockCharts | n/a | 2026-07-13 | Web fetch | Defines `%` above MA family; EOD; dividend-adjusted; vendor differences | Canonical series definition for `$SPXA50R` |
| 8 | Barchart OnDemand | https://www.barchart.com/ondemand/api/getMomentum | Stock Momentum API | Barchart | n/a | 2026-07-13 | Web fetch | Documented `% above 50d MA` by country/exchange | Not proven = S&P 500 / `$S5FI` |
| 9 | Barchart coverage page | https://www.barchart.com/ondemand/data | Data Coverage for APIs | Barchart | n/a | 2026-07-13 | Search | Lists market momentum / % above MA products | Marketing coverage; SKU confirmation needed |
| 10 | Repo runbook | `docs/ghostflow/BREADTH_ARTIFACT_RUNBOOK.md` | Breadth runbook | Ghost Allocator | repo | 2026-07-13 | Local read | Manual `$SPXA50R` + `$S5FI` cross-check | Existing ops truth |
| 11 | Production artifact | `data/ghostflow/artifacts/marketBreadth.v1.json` | marketBreadth v1 | Ghost Allocator | 2026-07-01 | 2026-07-13 | Local read | Manual extract; backup not obtained that pass | Unchanged by this PR |
| 12 | Refresh registry | `lib/ghostflow/refresh/registry.ts` | marketBreadth entry | Ghost Allocator | post-#132 | 2026-07-13 | Local read | Planned HTML adapter; yellow readiness | Must not treat as validated GREEN |

---

## 13. Falsifiers / conditions to revisit

Reopen toward **GREEN machine automation** only if **all** of the following become true:

1. A **written** permission/license (StockCharts prior approval or commercial Order Form with another vendor) covering GhostFlow’s intended use; **and**
2. A **documented** machine-readable interface (CSV/API) for the **exact** series (S&P 500 constituents % above 50-day MA, or an explicitly accepted substitute after product decision); **and**
3. Deterministic date semantics compatible with Gate C (session `observationAsOf`, fail-closed on incompleteness); **and**
4. Bobby records the decision in `docs/project-ops/DECISIONS.md` (and registry update PR follows separately).

Revisit **derived methodology** only after an explicit costed constituent-data plan.

Until then: **manual operator path**, Gate C incomplete for automation purposes, no breadth HTML adapter.
