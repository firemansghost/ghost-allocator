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
| **Overall** | **Automation blocked**; **production breadth refresh blocked** until source authorization is resolved |
| **StockCharts `$SPXA50R` HTML automation** | **RED** — programmatic extraction expressly forbidden; page is JS-dependent; not a documented machine contract |
| **Recommended path** | **Design a manual operator-packet intake mechanism**, but **keep production breadth refresh blocked** until the submitted source is authorized for GhostFlow use |
| **Do not implement** | `stockcharts-spxa50r-html` adapter, scrapers, OCR, hidden endpoints, or any Gate C production runner that depends on unauthorized breadth |
| **Falsifier for revisiting production** | Written StockCharts permission **or** an exact licensed provider source whose terms permit GhostFlow’s use, plus Bobby’s recorded product gate |

**Separation of concerns (required):**

- An **operator packet** is an intake and review architecture only.
- It does **not** authorize StockCharts, Barchart, or any other provider.
- Production use requires either **written permission** or a **licensed source** whose terms permit GhostFlow’s intended publication/use.
- Bobby’s product approval and provider data rights are **both** required where applicable; neither alone is sufficient.

**Also blocked:** HTML scrapers, hidden endpoints, OCR, chart-image extraction.

**Smallest next PR (after this audit):** docs-only operator-packet intake design + evidence checklist for `marketBreadth`. That packet must **not** be used for a production breadth refresh until source authorization is resolved. **Do not** change the refresh registry in that PR until Bobby explicitly approves.

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

Conservatively, StockCharts terms also mean that **manual transcription is not automatically approved** for GhostFlow publication or production artifact refresh. Pro CSV download documentation describes a UI feature only; it does not itself grant redistribution or public-product rights.

---

## 5. StockCharts manual operator path

Manual viewing or Pro UI CSV export is **technically** possible for private research and for designing GhostFlow intake workflows. That does **not** mean StockCharts manual transcription is an approved production source.

| Assessment | Finding |
|------------|---------|
| Human can view latest value + session? | **Technically yes** via SharpCharts / symbol summary after EOD update (per ChartSchool) |
| Delayed? | ChartSchool: EOD, usually by ~6:00 PM ET |
| Pro CSV download docs | Confirm a **manual UI** download feature for Pro members; they do **not** by themselves grant redistribution, public-product, or financial-analysis rights |
| `$SPXA50R` Pro CSV support | ChartSchool and Pro-download docs establish the series and a Pro download feature generally; this audit does **not** claim symbol-specific download support beyond what Pro historical UI generally provides |
| Typed operator packet | Valid as an **intake / review mechanism** — not as source permission |
| Production artifact refresh from StockCharts manual transcription | **Not production-approved** under this audit’s conservative reading of StockCharts terms |
| Historical committed artifact | May remain documented as a historical fact; this PR does not edit production JSON |

**Verdicts:**

| Use | Classification |
|-----|----------------|
| Private operator research and intake-workflow design | **YELLOW** |
| GhostFlow publication or production artifact refresh | **PERMISSION_REQUIRED / NOT PRODUCTION-APPROVED** |

Operator-packet design may proceed as documentation. A production breadth refresh that relies on StockCharts values must wait for written permission or another authorized source.

---

## 6. Barchart assessment (`$S5FI` and OnDemand)

| Path | Finding | Technical | Authorization / production |
|------|---------|-----------|----------------------------|
| Website quote `$S5FI` | May remain a **human research comparison** only. This audit did **not** scrape Barchart. Viewing a public page does **not** approve production transcription or redistribution. | Human-viewable | **RED** for automation; **PERMISSION_REQUIRED / UNKNOWN** for production transcription |
| Definitional equivalence to `$SPXA50R` | Names are similar but ChartSchool warns vendor methodologies differ (components, adjustment). | Not definitionally identical | Cannot treat as drop-in production substitute without an explicit product decision |
| Barchart OnDemand `getMomentum` | Documented commercial JSON/XML/CSV API with `% above 50d MA` fields. Inputs are **country / exchanges** (sample: `US` + `NASDAQ`). Docs do **not** show an explicit S&P 500 constituent universe or `$S5FI` symbol. | Machine-readable if contracted | **UNKNOWN** until exact S&P 500 breadth universe, license rights, date semantics, and permitted product use are confirmed |
| Master Terms | Services governed by Order Form + Master Terms. Contracted OnDemand is the licensed path — not free website scraping. | N/A | Permission via commercial agreement only |

---

## 7. Licensed-provider assessment

| Provider/path | Exact S&P 500 % > 50DMA? | Documented machine interface? | Cost visibility | Auth | Technical | Production authorization |
|---------------|--------------------------|-------------------------------|-----------------|------|-----------|--------------------------|
| StockCharts Pro CSV download | Not claimed as confirmed for `$SPXA50R` specifically in this audit | Manual UI only (Pro) | Subscription (Pro) | Membership | **YELLOW** research UI | **PERMISSION_REQUIRED** |
| StockCharts public API | Not found | No | N/A | N/A | Unavailable | **RED** |
| Barchart OnDemand | Not confirmed for S&P 500 constituents | Yes (`getMomentum` and related) | Sales / contact | API key | Possible if SKU matches | **UNKNOWN** until SKU + license confirmation |
| Other vendors (Bloomberg, Refinitiv, etc.) | Possible but **not verified** here | Typically yes when licensed | Opaque without quote | Vendor credentials | Possible | **UNKNOWN** |

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

**Verdict:** **YELLOW as a separate approved research project** — **not authorized by this audit**. High complexity and license cost; requires explicit Bobby product decision and likely registry `sourceFormat` change to `derived_study`. Free Wikipedia constituents + free quotes are **not** production-grade.

---

## 9. Source comparison

| Path | Technical feasibility | Source authorization | Production approval |
|------|----------------------|----------------------|---------------------|
| StockCharts HTML automation | Low — JS page, no static parse contract | Automated access **prohibited** without prior approval | **RED** — do not implement |
| StockCharts manual / Pro CSV | Medium — human/UI research possible | Manual collection / commercial-product use **permission_required**; Pro docs ≠ redistribution rights | **YELLOW** for internal operator research; **PERMISSION_REQUIRED** for production use |
| Barchart website `$S5FI` | Human-viewable; scraping not performed | Website automation not approved; human viewing ≠ production rights | **RED** for automation; **PERMISSION_REQUIRED / UNKNOWN** for production transcription |
| Barchart OnDemand | Machine API exists for country/exchange momentum | Requires Order Form; exact S&P 500 SKU unconfirmed | **UNKNOWN** pending exact SKU and license confirmation |
| Derived methodology | Hard — new methodology | Requires constituent + display licenses | **YELLOW** as separate research project; **not authorized by this audit** |
| Unlicensed hidden endpoint | Irrelevant | Forbidden by GF policy | **RED** |

---

## 10. Recommended path

### Final recommendation

1. **Do not** implement `stockcharts-spxa50r-html`.
2. **Design** a typed manual operator packet and evidence checklist (docs-only next step).
3. **Do not** use that packet for a production breadth refresh until the submitted source is approved for GhostFlow use.
4. **Keep Gate C production refresh blocked**.
5. **Revisit** when written StockCharts permission or an exact licensed provider source is obtained.

**Why**

1. Official StockCharts Usage Limitations forbid automated/programmatic website access without prior approval.
2. StockCharts terms also restrict scraping/collection and frame the license as non-commercial / personal / educational — so manual transcription is **not** automatically production-approved.
3. Raw HTML is not a deterministic GhostFlow parse surface.
4. No verified licensed API currently delivers the exact S&P 500 constituent series under project-held rights.
5. VIX automation (PR #132) does not unlock Gate C without an authorized breadth source.
6. Historical production artifacts remain historical facts; this audit does not re-approve their source rights and does not edit production JSON.

**Product gate requiring Bobby’s explicit approval before:**

- Requesting or purchasing provider access
- Changing the registry source format
- Approving a licensed replacement source
- Approving derived breadth methodology
- Authorizing a production breadth refresh from a newly approved source

Provider permission or licensing evidence is still required where applicable. **Bobby’s approval alone does not create data rights.**

**Smallest next PR**

Docs-only: `marketBreadth` operator intake packet template + evidence checklist (no registry edit, no adapter, no artifact write, no production refresh).

---

## 11. Explicit non-decisions

This PR does **not**:

- Change `docs/project-ops/DECISIONS.md`
- Change refresh registry, adapters, artifacts, scores, MOCK, `publicSignalCount`, or `GHOSTFLOW_REFERENCE_AS_OF`
- Authorize StockCharts scraping, manual production transcription, or hidden APIs
- Authorize Barchart website scraping or production transcription
- Select Barchart OnDemand as canonical without SKU proof
- Approve derived breadth
- Authorize a Gate C runner or production Gate C refresh
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
| 6 | Excel download help | https://help.stockcharts.com/data-and-ticker-symbols/data-availability/historical-data/how-do-i-download-data-to-excel | How Do I Download Data to Excel? | StockCharts | n/a | 2026-07-13 | Web fetch | Pro-only manual CSV download UI | Not an API; does not grant redistribution / product rights |
| 7 | ChartSchool catalog | https://chartschool.stockcharts.com/table-of-contents/index-and-market-indicator-catalog/stockcharts-percent-above-moving-average | StockCharts Percent Above Moving Average | StockCharts | n/a | 2026-07-13 | Web fetch | Defines `%` above MA family; EOD; dividend-adjusted; vendor differences | Canonical series definition for `$SPXA50R` |
| 8 | Barchart OnDemand | https://www.barchart.com/ondemand/api/getMomentum | Stock Momentum API | Barchart | n/a | 2026-07-13 | Web fetch | Documented `% above 50d MA` by country/exchange | Not proven = S&P 500 / `$S5FI` |
| 9 | Barchart coverage page | https://www.barchart.com/ondemand/data | Data Coverage for APIs | Barchart | n/a | 2026-07-13 | Search | Lists market momentum / % above MA products | Marketing coverage; SKU confirmation needed |
| 10 | Repo runbook | `docs/ghostflow/BREADTH_ARTIFACT_RUNBOOK.md` | Breadth runbook | Ghost Allocator | repo | 2026-07-13 | Local read | Describes historical manual `$SPXA50R` + `$S5FI` workflow | Historical practice; not a source-rights authorization |
| 11 | Production artifact | `data/ghostflow/artifacts/marketBreadth.v1.json` | marketBreadth v1 | Ghost Allocator | 2026-07-01 | 2026-07-13 | Local read | Historical committed observation; backup not obtained that pass | Unchanged by this PR; not re-approved here |
| 12 | Refresh registry | `lib/ghostflow/refresh/registry.ts` | marketBreadth entry | Ghost Allocator | post-#132 | 2026-07-13 | Local read | Planned HTML adapter; yellow readiness | Must not treat as validated GREEN or production-authorized |

---

## 13. Falsifiers / conditions to revisit

Reopen toward **production-authorized breadth refresh** (and only then GREEN machine automation, if applicable) when **all** of the following become true:

1. A **written** permission/license covering GhostFlow’s intended use (StockCharts prior approval or commercial Order Form with another vendor); **and**
2. A documented observation path for the **exact** series (S&P 500 constituents % above 50-day MA, or an explicitly accepted substitute after product decision); **and**
3. Deterministic date semantics compatible with Gate C (session `observationAsOf`, fail-closed on incompleteness); **and**
4. Bobby records the decision in `docs/project-ops/DECISIONS.md` (and any registry update PR follows separately).

Revisit **derived methodology** only after an explicit costed constituent-data plan.

Until then:

- HTML automation remains **RED / blocked**
- Operator-packet design may proceed as documentation only
- Production breadth refresh remains **blocked** pending source authorization
- Gate C remains incomplete for production refresh
- No breadth HTML adapter
