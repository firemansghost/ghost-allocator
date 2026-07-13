# Treasury Long-End Source Feasibility and Authorization Audit

**Artifact:** `treasuryLongEndIncomeLens`  
**Audit date:** 2026-07-13  
**Starting `main` SHA:** `12ad05350f0aeab24d62b809f271a9c1c59bf2ee`  
**Branch:** `docs/ghostflow-treasury-long-end-source-feasibility`  
**Mode:** Read-only operational source-policy assessment  

> **This is an operational source-policy assessment, not legal advice.**  
> No source path, retention policy, breakeven methodology, registry change, or adapter is approved by this audit. After Bobby approves a path, the implementation PR must append the genuine decision to `docs/project-ops/DECISIONS.md`.

---

## How to read this memo

| Layer | Meaning |
|-------|---------|
| **Source facts** | What official pages/docs state |
| **Repository facts** | What GhostFlow contracts/registry/spike/artifacts state today |
| **Technical interpretation** | Engineering feasibility for GhostFlow’s intended use |
| **Terms-of-use interpretation** | Operational reading of provider terms — **not** a legal opinion |
| **Product recommendation** | Proposed next engineering step (requires Bobby approval) |

---

## 1. Source pages accessed

| Source | URL | Publication / update observed |
|--------|-----|-------------------------------|
| FRED Legal Terms | https://fred.stlouisfed.org/legal/ | Accessed 2026-07-13 |
| FRED API Terms of Use | https://fred.stlouisfed.org/docs/api/terms_of_use.html | Accessed 2026-07-13 |
| FRED API overview | https://fred.stlouisfed.org/docs/api/fred/ | Accessed 2026-07-13 |
| FRED API keys doc | https://fred.stlouisfed.org/docs/api/api_key.html | Accessed 2026-07-13 |
| FRED series observations | https://fred.stlouisfed.org/docs/api/fred/series_observations.html | Accessed 2026-07-13 |
| FRED Terms update note | https://news.research.stlouisfed.org/2024/06/weve-updated-our-terms-of-use-action-requested/ | Jun 2024 update announcement |
| FRED series: DGS30, DFII30, DGS2, DGS5, DGS10, T10YIE | https://fred.stlouisfed.org/series/{id} | Latest obs through ~2026-07-10 / 2026-07-13 |
| FRED copyright tag filters | Public Domain / Copyrighted citation tag series lists | Accessed 2026-07-13 |
| Board H.15 release | https://www.federalreserve.gov/releases/h15/ | Last Update: July 13, 2026; release posts Mon–Fri ~4:15pm |
| Board H.15 DDP Choose | https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15 | Last released Monday, July 13, 2026 |
| Board H.15 DDP Review (TCM package) | package hash `bf17364827e38702b42a58cf8eaa3f78` | 11 nominal TCM series listed |
| Board H.15 DDP Preview (sample) | `RIFLGFCY10_N.B`, `RIFLGFCY30_N.B` | Dates `YYYY-MM-DD`; missing = `ND` |
| Board Disclaimer | https://www.federalreserve.gov/disclaimer.htm | Last Update: August 02, 2024 |

**Not done in this audit:** browser scraping, reverse-engineering hidden calls, downloading/committing raw CSV/XML, using API keys, implementing parsers.

---

## 2. Repository facts (unchanged by this PR)

### 2.1 Registry entry (`treasuryLongEndIncomeLens`)

| Field | Current value |
|-------|---------------|
| `artifactId` | `treasuryLongEndIncomeLens` |
| `lane` | `treasury_display` |
| `sourceFamilyId` | `fred_treasury_yields` |
| `sourceName` | FRED — U.S. Treasury constant maturity, TIPS, and breakeven inflation |
| `sourceFormat` | `csv` |
| `adapterId` | `fred-treasury-yields-csv` |
| `implementationStatus` | `spike_available` |
| `automationReadiness` | `green` |
| `authentication` | `optional_env` / `FRED_API_KEY` |
| `historyPolicy` | `accepted_normalized_observation` |
| `failureSeverity` | `nonfatal_treasury` |

### 2.2 Spike behavior (`scripts/ghostflow/fred-treasury-yields-spike.ts`)

| Component | Behavior | Classification |
|-----------|----------|----------------|
| Live `fredgraph.csv?id=` first | Unauthenticated HTTPS CSV per series | **research-only acceptable**; **must be replaced** for production |
| Official `fred/series/observations` fallback | Requires `FRED_API_KEY` | **permission-dependent** |
| Local operator CSV fallback | Operator-supplied files under `--local-dir` | **research-only acceptable**; viable interim manual aid |
| Six-series common-date requirement | All six must share latest common numeric date | **production-reusable** as observation discipline (method may change) |
| `publishedAt` | Spike run / extraction day semantics | **production-reusable** pattern |
| Output retention | Research JSON under gitignored research path only | **research-only acceptable** |
| Error handling | Fail closed on empty/HTML/timeout | Pattern OK; transport must change |

### 2.3 Artifact contract (validator)

| Field | Requirement |
|-------|-------------|
| `thirtyYearNominalYieldPct` | **Required** |
| `thirtyYearTipsRealYieldPct` | **Required** |
| `twoYearYieldPct` / `fiveYearYieldPct` / `tenYearYieldPct` | **Optional** (null/absent allowed when absent) |
| `tenYearBreakevenInflationPct` | **Optional** |
| `curve2s30sPct` / `curve5s30sPct` / `curve10s30sPct` | **Downstream derived**; reconciled as 30Y nominal yield minus 2Y / 5Y / 10Y nominal yield when the corresponding shorter-maturity observation is present |
| `mappingStatus` | Must remain `not_final` |
| Lane / scoring | Display-only Treasury Plumbing; unscored; outside equity `publicSignalCount` |

Canonical curve-spread direction (existing validator contract — not a methodology change):

```text
curve2s30sPct = thirtyYearNominalYieldPct - twoYearYieldPct
curve5s30sPct = thirtyYearNominalYieldPct - fiveYearYieldPct
curve10s30sPct = thirtyYearNominalYieldPct - tenYearYieldPct
```

Existing 2026-07-01 production artifact example (not new market data): `4.97 - 4.17 = 0.80` (`curve2s30sPct`).

### 2.4 Current production provenance

`data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json` records:

- method: official FRED API (`fred_api`) via spike (2026-07-06)
- series: DGS30, DFII30, DGS2, DGS5, DGS10, T10YIE
- common `asOf`: **2026-07-01**
- **Do not modify** in this audit PR

Production reference remains `GHOSTFLOW_REFERENCE_AS_OF` **2026-07-01**; scores **60 / 53 / 67**; `publicSignalCount` **13**; MOCK **62 / 58 / 55**.

---

## 3. Task 3 — FRED graph CSV (`fredgraph.csv`)

### Source facts
- Reachable pattern used by the spike: `https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIES}`
- FRED documents programmatic access principally as the **FRED® API** under `api.stlouisfed.org`, not as `fredgraph.csv`
- FRED Legal Prohibitions include:
  - no data mining / robots / scraping / similar extraction **except as expressly allowed by FRED API terms**
  - no store / cache / archive of FRED Services or Content; no incorporating FRED Content into a database/compilation/archive/cache

### Technical interpretation
- Technically can fetch one series per URL; multi-series via repeated calls or comma ids appears to work in research use, but is **not** a documented multi-series API contract
- No API key on the graph CSV URL itself
- Timeouts observed in prior production refresh led to API fallback

### Terms-of-use interpretation
- A publicly reachable URL is **not** automatically an authorized production API
- Automated retrieval for production looks like scraping/extraction **outside** the expressly permitted API path → **RED** for production promotion
- Even if somehow treated as “download for personal use,” general store/cache/archive prohibitions still conflict with committed normalized artifacts and retained history

### Verdict — FRED graph CSV

| Dimension | Verdict |
|-----------|---------|
| Technical feasibility | **GREEN** (works as research transport) |
| Documentation status | **RED** (not documented as the authorized API) |
| Authorization status | **RED** for automated production use |
| Production suitability | **RED** — do **not** promote spike CSV fetch to a production adapter |

---

## 4. Task 4 — Authenticated FRED API

### Source facts (official)
- All web service requests **require an API key**
- Endpoint of interest: `fred/series/observations`
- Required application notice (prominent):  
  **"This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis."**
- Bandwidth / transaction limits may be imposed
- Developers should request a distinct key per application; doc text also states users of an application shall use their own key → **project-vs-end-user key model is ambiguous**
- Third-party series copyright remains the operator’s responsibility
- Legal / API terms prohibit using the API **in connection with** storing, caching, or archiving FRED Content, providing stored/cached/archived content to third parties, or incorporating FRED Content into a database/compilation/archive/cache
- Termination may require destruction of copies of the “FRED® API” materials (wording is broad)

### Explicit GhostFlow Q&A

| # | Question | Answer |
|---|----------|--------|
| 1 | Fetch six series? | **Technically yes** (small subset; API supports per-series observations) |
| 2 | Retain normalized observations? | **PERMISSION_REQUIRED / conflict** with store-cache-archive language |
| 3 | Commit artifact JSON with API-derived values? | **PERMISSION_REQUIRED / conflict** (artifact = stored/published subset of retrieved content) |
| 4 | Retain history (`accepted_normalized_observation`)? | **PERMISSION_REQUIRED / conflict** |
| 5 | Publicly display current values? | **YELLOW / NOTICE_REQUIRED** if API used and citation + non-endorsement notice appear; still gated by retention rules |
| 6 | Required notice | FRED non-endorsement notice (above) + series citations; if app used by others, link Terms of Use and bind users |
| 7 | One project key vs each end user? | **PERMISSION_REQUIRED** — docs pull both directions |
| 8 | Does `optional_env` match official requirements? | **No** — API requests require a key; optional is research convenience only |
| 9 | Does history policy conflict with API terms? | **Yes, on face reading** — treat as blocking until written clarification |
| 10 | Written clarification required before implementation? | **Yes** if FRED remains the production interface |

### Verdict — FRED API

| Dimension | Verdict |
|-----------|---------|
| Technical feasibility | **GREEN** |
| Authorization for GhostFlow’s retain/commit/history model | **YELLOW → PERMISSION_REQUIRED** (not GREEN) |
| Notice / key model | **YELLOW** (fixable only with required notice + resolved key policy) |
| Overall production readiness without clarification | **RED / blocked** |

Do **not** creatively lawyer the store/cache/archive ambiguity into GREEN.

---

## 5. Task 5 — Series rights and provenance (each series separately)

### Classification method
FRED Legal defines labels including **Public Domain: Citation Requested**, **Copyrighted: Citation Required**, and **Copyrighted: Pre-approval Required**. Tags were checked via official series pages and FRED citation/copyright tag filters. Classifications below are **per series**; do not infer one from another beyond documented labels.

| Series | Title (FRED) | Original source owner | Release | Frequency | Units | FRED copyright label | Citation | Direct from original source? | FRED adds derived methodology? |
|--------|--------------|----------------------|---------|-----------|-------|----------------------|----------|------------------------------|--------------------------------|
| **DGS30** | Market Yield on U.S. Treasury Securities at 30-Year Constant Maturity, Quoted on an Investment Basis | Board of Governors of the Federal Reserve System (US); underlying TCM from U.S. Treasury / H.15 notes | H.15 Selected Interest Rates | Daily | Percent, NSA | **Public Domain: Citation Requested** | Suggested FRED citation to Board via FRED | **Yes** — H.15 / DDP nominal TCM (`RIFLGFCY30_N.B`) | Redistribution/hosting only; not FRED-calculated |
| **DFII30** | … 30-Year … Inflation-Indexed | Board of Governors (US); TIPS TCM from U.S. Treasury | H.15 | Daily | Percent, NSA | **Public Domain: Citation Requested** | Suggested FRED citation | **Yes** — published on H.15 inflation-indexed table; DDP custom/all-H15 (preformatted TCM package is **nominal-only**) | Redistribution/hosting only |
| **DGS2** | … 2-Year Constant Maturity … | Board of Governors (US) | H.15 | Daily | Percent, NSA | **Public Domain: Citation Requested** | Suggested FRED citation | **Yes** — `RIFLGFCY02_N.B` in TCM package | Redistribution/hosting only |
| **DGS5** | … 5-Year Constant Maturity … | Board of Governors (US) | H.15 | Daily | Percent, NSA | **Public Domain: Citation Requested** | Suggested FRED citation | **Yes** — `RIFLGFCY05_N.B` | Redistribution/hosting only |
| **DGS10** | … 10-Year Constant Maturity … | Board of Governors (US) | H.15 | Daily | Percent, NSA | **Public Domain: Citation Requested** | Suggested FRED citation | **Yes** — `RIFLGFCY10_N.B` | Redistribution/hosting only |
| **T10YIE** | 10-Year Breakeven Inflation Rate | **Federal Reserve Bank of St. Louis** | Interest Rate Spreads | Daily | Percent, NSA | **Copyrighted: Citation Required** | Suggested FRED citation to St. Louis Fed | **No direct Board H.15 series** — derived from DGS10 and DFII10 (notes: Treasury inputs since 2019-06-21) | **Yes** — St. Louis Fed breakeven construction |

---

## 6. Task 6 — Direct Board of Governors H.15 delivery

### Source facts
- Official release: H.15 Selected Interest Rates (daily business days ~4:15pm ET)
- Data Download Program: Choose → custom package **or** preformatted packages **or** all-H15 SDMX/XML ZIP
- Preformatted **Treasury Constant Maturities** CSV (`series=bf17364827e38702b42a58cf8eaa3f78`): **11 nominal** series only
- Authentication: **none** observed for DDP downloads
- Disclaimer: unless otherwise indicated, Board website information is **public domain** and may be copied/distributed **without permission**; **cite the Board**; no framing; seals/logos restricted

### Stable identifiers observed (nominal TCM package)

| Need | Board DDP unique ID (documented on Review/Preview) | In preformatted TCM package? |
|------|-----------------------------------------------------|------------------------------|
| 30Y nominal | `H15/H15/RIFLGFCY30_N.B` | Yes |
| 2Y nominal | `H15/H15/RIFLGFCY02_N.B` | Yes |
| 5Y nominal | `H15/H15/RIFLGFCY05_N.B` | Yes |
| 10Y nominal | `H15/H15/RIFLGFCY10_N.B` | Yes |
| 30Y inflation-indexed real | Published on H.15 HTML table; **not** in preformatted TCM package | **Custom package or all-H15 SDMX required** — exact DDP code **not locked in this audit** |
| 10Y inflation-indexed real | Same | Same (needed only if retaining/deriving breakeven from Board inputs) |

### Format / semantics (from official DDP Preview / Review)
| Item | Finding |
|------|---------|
| Formats | CSV, Excel, XML (SDMX); all-H15 SDMX/ZIP |
| Date format | `YYYY-MM-DD` |
| Missing values | `ND` |
| Units | Percent per year |
| Update cadence | Business days; release page states Mon–Fri ~4:15pm; holidays/Board closed → no post |
| Revision behavior | H.15 publishes ongoing daily table; vintage/revision detail is Board-controlled — adapter should treat latest package as authoritative for `asOf` and record package metadata |
| Attribution | Cite Board of Governors / H.15; comply with disclaimer (no false endorsement) |

### Technical interpretation
- Direct Board source is the **original publication** for the five yield fields GhostFlow needs most
- Real yield coverage exists on the H.15 release; implementation must **lock** inflation-indexed DDP series IDs via custom package or SDMX dictionary **before** claiming adapter GREEN
- No API key → better fit for GhostFlow `none` authentication model

### Terms-of-use interpretation
- Board public-domain posting + citation request is **more aligned** with committed artifacts and retained normalized history than FRED API store/cache prohibitions
- Still not a legal blessing; product must cite correctly and avoid seal/logo misuse

---

## 7. Task 7 — Breakeven alternatives

### Path A — Retain FRED `T10YIE`
- Series is **Copyrighted: Citation Required** (St. Louis Fed)
- Inherits FRED API key, notice, and **store/cache/archive** conflicts
- Creates **mixed-source** complexity if yields move to Board H.15
- Verdict: **YELLOW / PERMISSION_REQUIRED** — not preferred for first automated path

### Path B — Derive 10Y breakeven from H.15
- Candidate formula: 10Y nominal H.15 − 10Y inflation-indexed H.15  
- T10YIE notes describe the same conceptual spread (DGS10 − DFII10), with possible rounding / input-alignment differences vs St. Louis Fed published series
- **PRODUCT DECISION REQUIRED** — this audit does **not** approve the methodology
- Would need: DECISIONS entry, tests, documentation that GhostFlow owns the derivation, display copy changes

### Path C — Omit breakeven context
- Validator: `tenYearBreakevenInflationPct` is **optional** (`required: false`)
- Card remains useful with required 30Y nominal + 30Y real, optional 2Y/5Y/10Y nominals, and derived curve spreads
- Verdict: **GREEN** as interim product posture for a Board-only source design

---

## 8. Task 8 — Architecture options

Separate verdicts (do not collapse):

| Option | Technical feasibility | Source authorization | Artifact compatibility | Automation readiness |
|--------|----------------------|----------------------|------------------------|----------------------|
| **A** FRED graph CSV adapter | GREEN | **RED** | GREEN fields / **RED** retention | **RED** |
| **B** FRED API adapter | GREEN | **YELLOW / PERMISSION_REQUIRED** (retention + key model) | GREEN if allowed | **YELLOW→RED** until clarification |
| **C** Direct Board H.15 adapter | **YELLOW→GREEN** after inflation-indexed ID lock | **GREEN-leaning** (Board public domain + citation) for H.15 fields | **GREEN** for required + optional nominals; breakeven optional omit | **YELLOW** until package/ID stability proven in fixtures |
| **D** H.15 + optional FRED context | YELLOW | **Two regimes** — FRED half remains PERMISSION_REQUIRED | Atomic date alignment harder | Operator complexity **high** |
| **E** H.15 + derived breakeven | YELLOW | Board OK; methodology gate | Needs product approval | Blocked on Path B decision |
| **F** Manual operator packet only | GREEN | Safer near-term if operator uses Board downloads / approved excerpts | Compatible | **Low automation**; burden high |

---

## 9. Task 9 — Registry accuracy review (proposals only — **not applied**)

| Current field | Supportable now? | Note |
|---------------|------------------|------|
| `sourceFamilyId: fred_treasury_yields` | **Weak** if path shifts to Board | Rename on approved migration |
| `sourceFormat: csv` | True for graph CSV / DDP CSV; **false** if API JSON | Path-dependent |
| `adapterId: fred-treasury-yields-csv` | Names a non-production path | Must not imply authorized production |
| `automationReadiness: green` | **Not supportable** given authorization findings | Should become `yellow`/`blocked` until approved path implements |
| `authentication: optional_env / FRED_API_KEY` | **Mismatch** with official “API key required” | |
| `historyPolicy: accepted_normalized_observation` | **Conflicts on face** with FRED store/cache language if FRED is the source | Compatible with Board-direct **subject to** Board disclaimer + GhostFlow retention policy |

### Proposed future registry deltas (examples only)

**If authenticated FRED API path were ever approved after written clarification:**
```text
sourceFormat: json_api
authentication: required_env / FRED_API_KEY
adapterId: fred-treasury-yields-api (new)
automationReadiness: yellow until notice + retention guardrails ship
requiredAppNotice: FRED non-endorsement string
historyPolicy: pending_provider_clarification | alternate policy
```

**If direct H.15 path (recommended direction):**
```text
sourceFamilyId: frb_h15_treasury_yields
sourceName: Board of Governors H.15 — Treasury constant maturity (nominal + inflation-indexed)
sourceLocator: https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15
sourceFormat: csv   # or sdmx_xml if chosen
adapterId: frb-h15-treasury-yields-csv
implementationStatus: spike_available → implemented (later PR)
spikeScriptPath: (new or redesigned; do not promote fredgraph)
authentication: none
automationReadiness: yellow until fixture-proven, then green
historyPolicy: accepted_normalized_observation  # Board-sourced normalized values
```

---

## 10. Task 10 — Spike component classification (summary)

See §2.2. Bottom line: **do not treat successful past FRED retrieval as production authorization.**

---

## 11. Task 11 — Decisive recommendation

### Chosen next step

**3. Implement direct Federal Reserve Board H.15 adapter**

### Why
- Five of six current series’ underlying values originate on **Board H.15**, not St. Louis Fed methodology
- Board disclaimer supports copying/distribution of Board information with citation; better alignment with **committed artifacts** and **retained normalized history** than FRED API store/cache/archive prohibitions
- `fredgraph.csv` is **RED** for production; FRED API is **PERMISSION_REQUIRED** before matching GhostFlow history policy
- Artifact can function without `T10YIE` (Path C) while a derived-breakeven methodology remains **unapproved**

### Not chosen
- **1** FRED API adapter — blocked by retention/history conflict until written clarification  
- **2** Request FRED clarification first — useful **only if** Bobby insists on remaining on FRED; not the lowest-risk source design  
- **4** H.15 + approved derived breakeven — premature; Path B needs product decision first  
- **5** Manual-only forever — acceptable interim, but not the decisive architecture once Board DDP is viable  
- **6** Leave blocked — unnecessary given Board coverage for required fields  

### Smallest safe next PR (after this audit merges)
1. Bobby approval to migrate long-end source family to Board H.15 (append **DECISIONS**)
2. Lock inflation-indexed DDP series IDs via custom package or SDMX dictionary (document package hash / series list)
3. Fixture-driven `frb-h15-treasury-yields-*` adapter: fetch → parse → normalize; **unwired**; no production write
4. Map required 30Y nominal + 30Y real; optional 2Y/5Y/10Y; leave `tenYearBreakevenInflationPct` null/absent until Path B/A decided
5. Registry update only in that implementation PR (not here)
6. Keep spike as research quarantine; do **not** promote `fredgraph.csv`

### Required Bobby approval
- Source migration away from FRED as production interface for this artifact  
- Interim omit of breakeven context (or later Path B / Path A)  
- Any future DECISIONS entries for retention display citations

### Required provider / terms evidence
- Board disclaimer citation practice recorded in adapter docs  
- Frozen DDP series ID table (especially inflation-indexed)  
- **No** FRED clarification required **if** FRED is dropped for this artifact  

### Would DECISIONS be required?
- **Yes**, before/at implementation merge: genuine decision recording H.15 as approved production source for `treasuryLongEndIncomeLens`, breakeven posture (omit vs later derived), and that FRED API/graph CSV are not production transports for this artifact

---

## 12. Task 12 — Falsifiers

Any of the following would change the recommendation:

| Falsifier | Effect |
|-----------|--------|
| Written FRED clarification permitting committed normalized artifacts + retained history + project API key + public display | May reopen Option B as competitive |
| Official FRED docs explicitly permitting limited caching/retention for this use class | Same |
| Custom H.15 / all-H15 package **lacks** durable 30Y inflation-indexed series | Fall back to manual Board transcription packet or reassess |
| Board DDP inflation-indexed identifiers **unstable** / undocumented | Delay automation; keep manual |
| Board terms/disclaimer change prohibiting intended product use | STOP / reassess |
| Product requires `T10YIE` and refuses omit/derive | Forces Path A clarification or Path B approval |
| Product **approves** derived breakeven methodology | Enables Option E as follow-on PR |
| Bobby prefers stay-on-FRED despite retention ambiguity | Pivot to recommendation **2** before any code |

---

## 13. Operational risks (cross-cutting)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Promoting `fredgraph.csv` because it “works” | High | Explicit RED; registry must not claim green automation on that path |
| Committing API-derived values under store/cache prohibitions | High | Prefer Board H.15; else written FRED permission |
| Mixed FRED+Board asOf misalignment | Medium | Avoid Option D initially |
| Assuming TCM package includes TIPS real yields | Medium | Must use custom/all-H15 for DFII30 equivalents |
| Silent derived-breakeven swap | High | PRODUCT DECISION REQUIRED |
| `optional_env` implying unauthenticated API is OK | Medium | Treat as research-only |

---

## 14. Verdict by path (summary)

| Path | Overall operational verdict |
|------|----------------------------|
| Continue FRED API as production | **Blocked pending clarification** |
| Request FRED permission | Valid **only if** FRED retained |
| Replace with Board H.15 | **Recommended** |
| Hybrid H.15 + FRED | Avoid initially |
| Manual refresh only | Acceptable **interim** until H.15 adapter |
| Leave adapter blocked | Unnecessary if H.15 proceeds |

**No source or methodology is approved by this audit.**
