# H.15 Live Source and Transport Investigation

**Artifact:** `treasuryLongEndIncomeLens`  
**Investigation date:** 2026-08-25  
**Starting `main` SHA:** `51236fb96b15b73c5da095aa6b8dc7b3410148e0` (PR **#140** merged)  
**Branch:** `docs/ghostflow-h15-live-source-investigation`  
**Mode:** Read-only source-integrity and transport audit  

> **This is a source-integrity and architecture assessment, not a production refresh.**  
> No adapter, registry, parser, transport, methodology, or production artifact change is approved by this memo. A genuine transport migration decision will be recorded only after Bobby reviews this investigation in `docs/project-ops/DECISIONS.md`.

---

## 1. Executive finding

Live operator smoke (`npm run ghostflow:refresh-report -- --artifact treasuryLongEndIncomeLens`) fails closed at **CSV row 67486** in the **preformatted Treasury Constant Maturities (TCM) DDP package** with `h15_csv_invalid_value`. The offending cell is an **empty string** (`""`) on series `H15/H15/RIFLGFCY02_N.B`, date `1962-01-02` — a pre-inception calendar row the Board emits with no numeric yield. The parser accepts `ND` as missing but treats blank as invalid.

**Classification: B — Parser omission.** Blank value cells are a legitimate Board DDP CSV representation for unavailable pre-inception observations (3,760 such rows on the 2Y series alone). This is not schema drift, malformed source data, or a transport construction bug.

**Transport durability:** The adapter’s **custom single-series TIPS-30 package** (`RIFLGFCY30_XII_N.B` via MD5-hashed `Output.aspx?type=package`) **relies on Build Your Package (BYP)**, scheduled for removal the week of **2026-11-09**. The **preformatted TCM package** is listed separately on the DDP choose page and is **not named** in the BYP removal announcement (**NOT SPECIFIED** for November removal; likely survives until broader DDP retirement).

**Durable recommendation:** Migrate all five GhostFlow series to the Board **release-level SDMX/XML ZIP** at `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`. It contains all required and optional series, uses explicit `OBS_STATUS` missing semantics, and is promoted on the release page as the post-BYP path.

**Smallest safe next implementation PR:** A **narrow parser 1.0.1** change treating whitespace-only / empty yield cells as missing (same behavior as `ND`) plus a fixture regression row — restores deterministic live smoke immediately. This does **not** remove the November BYP exposure on the TIPS leg; XML migration remains required before 2026-11-09.

---

## 2. Repository contract

### Adapter identity (unchanged)

| Field | Value |
|-------|-------|
| `adapterId` | `frb-h15-treasury-yields-csv` |
| `parserVersion` | `1.0.0` |
| `sourceFamilyId` | `frb_h15_treasury_yields` |
| `sourceLocator` | `https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15` |
| `artifactId` | `treasuryLongEndIncomeLens` |
| `lane` | `treasury_display` (display-only, unscored, `human_required`, production-unwired) |

### Dual-package transport

| Leg | Package | Mechanism |
|-----|---------|-----------|
| A | Treasury Constant Maturities | Preformatted DDP package; MD5 `bf17364827e38702b42a58cf8eaa3f78` |
| B | 30Y TIPS real | Custom DDP package; single series `H15/H15/RIFLGFCY30_XII_N.B`; MD5 `5a2ee5c97b9512270146d6ce9960a9ab` |

### Required / optional series (product contract)

| Role | DDP unique ID |
|------|---------------|
| Required | `H15/H15/RIFLGFCY30_N.B`, `H15/H15/RIFLGFCY30_XII_N.B` |
| Optional context | `H15/H15/RIFLGFCY02_N.B`, `H15/H15/RIFLGFCY05_N.B`, `H15/H15/RIFLGFCY10_N.B` |
| Intentionally omitted | T10YIE; no derived breakeven |

### Current parser rules (`frbH15TreasuryYields.ts`)

| Rule | Behavior |
|------|----------|
| **Series ID** | Observation rows must have column 0 starting with `H15/H15/`; else `h15_csv_invalid_series_id` |
| **Metadata rows** | Column 1 in `{Series Description:, Unit:, Multiplier:, Currency:, Series Name:}` → skip row |
| **Dates** | Column 1 must match `YYYY-MM-DD` and pass calendar validation; else `h15_csv_invalid_date` |
| **Numeric yield cells** | `parseYieldCell`: trim; must match `/^-?\d+(\.\d+)?$/`; stored as `valuePct` |
| **ND handling** | Case-insensitive `ND` → skip row (missing observation) |
| **Blank handling** | Empty / whitespace-only value → `null` → **`h15_csv_invalid_value`** (live failure) |
| **Unexpected series** | TCM package: ignore unregistered series; tips30 package: fail `h15_csv_unexpected_series` |
| **Duplicates** | Same series + date twice → `h15_csv_duplicate_observation` |
| **Required series** | After parse, both required IDs must have ≥1 numeric row across packages |
| **Common-date selection** | Normalize: latest date present on **all** required series on or before `min(nowIso date, referenceAsOf)` |
| **Optional series** | Included only when numeric value exists on the chosen `asOf` date |
| **Future dates** | Any parsed observation date > `nowIso` UTC date → `h15_normalize_future_observation` |
| **Provenance** | `contentSha256` = SHA-256 of TCM bytes ∥ `0x1e` ∥ tips30 bytes; `sourcePublishedAt` not extracted from source |

---

## 3. Live failure reproduction

| Field | Value |
|-------|-------|
| Command | `npm run ghostflow:refresh-report -- --artifact treasuryLongEndIncomeLens` |
| Timestamp | `2026-08-25T22:22:19.375Z` (also reproduced at `2026-08-25T21:54:54.950Z` on PR #140 smoke) |
| HTTP | Success for both package fetches (failure occurs after download) |
| Failed package | **TCM** (preformatted Treasury Constant Maturities) |
| Stage | **parse** |
| Issue code | `h15_csv_invalid_value` |
| Source CSV row | **67486** |
| tips30 package | Fetched successfully; not reached for merge (TCM parse fails first) |

---

## 4. Exact row-67486 evidence

Rows inspected from live official TCM package bytes (same URL the adapter uses):

| Row | Column 0 (series) | Column 1 | Column 2 (value) | Cols |
|-----|-------------------|----------|------------------|------|
| 67484 | `H15/H15/RIFLGFCY02_N.B` | `Currency:` | `NA` | 3 |
| 67485 | `H15/H15/RIFLGFCY02_N.B` | `Series Name:` | `RIFLGFCY02_N.B` | 3 |
| **67486** | **`H15/H15/RIFLGFCY02_N.B`** | **`1962-01-02`** | **`""` (empty)** | **3** |
| 67487 | `H15/H15/RIFLGFCY02_N.B` | `1962-01-03` | `""` (empty) | 3 |
| 67488 | `H15/H15/RIFLGFCY02_N.B` | `1962-01-04` | `""` (empty) | 3 |

**Row 67486 detail:**

| Field | Value |
|-------|-------|
| Source package | TCM preformatted CSV |
| Series unique ID | `H15/H15/RIFLGFCY02_N.B` |
| Raw date cell | `1962-01-02` |
| Raw value cell | empty string (UTF-8 length 0; no bytes) |
| CSV column count | 3 |
| Quoting | none |
| Whitespace / control chars | none in value cell |

**Series-level context (2Y only, not adjacent market history):** The live TCM CSV contains **3,760** observation rows for `RIFLGFCY02_N.B` with blank value cells (pre-inception through approximately 1976-05-31). The first numeric 2Y observation is **1976-06-01** (value `7.26` at CSV line 71246). The parser fails on the **first** blank encountered (row 67486), not the last.

**Missing-value category:** **blank** (empty third column). Not `ND`, `N/A`, `n.a.`, or numeric-with-footnote.

---

## 5. Failure classification

**B — Parser omission — legitimate but previously unmodeled representation**

| Evidence | Interpretation |
|----------|----------------|
| Surrounding rows 67487+ repeat blank values on consecutive 1962 dates for the same series | Pattern is systematic pre-inception padding, not a one-off corrupt row |
| Same series later uses numeric values and `ND` normally | Format is stable; not schema drift |
| Board H.15 release HTML table uses `n.a.` for unavailable; DDP CSV uses blank and `ND` in different eras | Dual missing representations across Board surfaces |
| XML SDMX for `RIFLGFCY02_N.B` starts numeric observations at `1976-06-01`; no 1962 rows | CSV blank rows are calendar placeholders without yields; semantically “missing” |
| Simulated parse treating blank like `ND` completes: 147,003 TCM + 4,130 tips rows; latest common date **2026-08-24** | Product contract achievable once blank is modeled |

Not A (parser defect against documented CSV spec — Board docs emphasize `ND` on preview samples but live full-history CSV clearly emits blanks). Not C/D/E (no evidence of format change, malformed row, or package corruption). Not F.

---

## 6. Current DDP/BYP exposure

**Board announcement (2026-07-16):** “Build Your Package (BYP)” removal planned for the week of **2026-11-09**, in preparation for eventual DDP retirement. Users directed to FRED or **release-level XML** ([DDP choose page](https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15), [H.15 release page](https://www.federalreserve.gov/releases/H15/default.htm)).

### A. Preformatted TCM package

| Assessment | **NOT SPECIFIED** (likely **CONFIRMED SURVIVES** until broader DDP retirement) |
|------------|----------------------------------------------------------------------------------|
| Evidence | DDP page separates “Build your package” from “Select a preformatted data package”; announcement names BYP only. TCM link remains on choose page as of 2026-08-25. |

### B. Custom TIPS-30 package (`RIFLGFCY30_XII_N.B`)

| Assessment | **YES** — relies on BYP/custom-package mechanism |
|------------|--------------------------------------------------|
| Evidence | Adapter builds URL via `Output.aspx?type=package&series=<md5 of custom id list>` — same mechanism as BYP custom downloads, not the preformatted TCM link. Will break when BYP is removed unless Board preserves arbitrary MD5 package URLs (not stated). |

**These facts are independent of the row-67486 failure** (TCM preformatted leg).

---

## 7. Release XML/SDMX findings

### Official locators

| Source | URL | Size (observed 2026-08-25) |
|--------|-----|----------------------------|
| Release page XML ZIP | `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` | ~4.3 MB compressed |
| DDP all-H15 SDMX/ZIP | Linked from DDP choose page (“Download all H15 data…”) | ~67.4 MB (Board label) |

Release ZIP HEAD response: HTTP **200**, `Last-Modified: Tue, 25 Aug 2026 20:15:12 GMT`, `Content-Type: application/x-zip-compressed`, `ETag: "4e877e6fce34dd1:0"`.

### Archive / format

| Property | Value |
|----------|-------|
| Container | ZIP |
| Primary data member | `H15_data.xml` (~70.7 MB uncompressed) |
| Structure / schema | `H15_struct.xml`, `H15_H15.xsd`, `H15_discontinued.xsd`, `frb_common.xsd` |
| XML profile | SDMX 1.0 compact (`xmlns:message="http://www.SDMX.org/resources/SDMXML/schemas/v1_0/message"`) |
| Encoding | UTF-8 |

### Series identifier representation

XML uses `SERIES_NAME="RIFLGFCY30_N.B"` on `<kf:Series>` elements (no `H15/H15/` prefix). GhostFlow DDP unique IDs map by suffix: `H15/H15/{SERIES_NAME}`.

### Observation representation

```xml
<frb:Obs OBS_STATUS="A" OBS_VALUE="5.23" TIME_PERIOD="2026-08-24" />
```

| Field | Semantics |
|-------|-----------|
| `TIME_PERIOD` | `YYYY-MM-DD` |
| `OBS_VALUE` | Decimal yield (% per annum) when `OBS_STATUS="A"` |
| `OBS_STATUS` | `A` = available; `ND` = not available (placeholder `OBS_VALUE="-9999"`); also `NA`, `NC` observed in file |

No observations omit `OBS_VALUE` entirely; missing uses status codes.

### Unit / frequency metadata

On series tags: `UNIT="Percent:_Per_Year"`, `FREQ="9"` (daily / business-day family), `INSTRUMENT="TCMNOM"` or `TCMII`, maturity attributes (`MATURITY="Y30"`, etc.).

### Release / update semantics

H.15 release page: posted Mon–Fri ~4:15pm; XML link on current release page; ZIP `Last-Modified` aligns with release date. Filename is fixed (`FRB_h15_xml.zip`); URL appears to resolve to **current release** snapshot (not date-stamped path).

### DDP vs release ZIP

Same SDMX family; release ZIP is the Board-promoted post-BYP download on the release page. DDP bulk ZIP is larger (full DDP corpus). For GhostFlow’s five series, release ZIP is sufficient.

---

## 8. Series coverage (verified in XML, not inferred from CSV)

| GhostFlow series | XML `SERIES_NAME` | Observations (live ZIP) | Latest `TIME_PERIOD` |
|------------------|-------------------|-------------------------|----------------------|
| 30Y nominal (required) | `RIFLGFCY30_N.B` | 12,920 (`A`: 12,376; `ND`: 544) | 2026-08-24 |
| 30Y TIPS real (required) | `RIFLGFCY30_XII_N.B` | 4,306 (`A`: 4,130; `ND`: 176) | 2026-08-24 |
| 2Y nominal (optional) | `RIFLGFCY02_N.B` | 13,105 (`A`: 12,554; `ND`: 551) | 2026-08-24 |
| 5Y nominal (optional) | `RIFLGFCY05_N.B` | 16,865 (`A`: 16,146; `ND`: 719) | 2026-08-24 |
| 10Y nominal (optional) | `RIFLGFCY10_N.B` | 16,865 (`A`: 16,146; `ND`: 719) | 2026-08-24 |

**All five GhostFlow series are present.** T10YIE and breakeven series are not required and must remain unmapped.

---

## 9. Transport comparison

### Path A — Keep dual DDP CSV unchanged

| Dimension | Rating |
|-----------|--------|
| Technical feasibility | **Blocked** — live parse fails at row 67486 |
| Source durability | **Poor** — TIPS leg breaks at BYP removal (~2026-11-09) |
| Semantic compatibility | **Good** — matches current contract when parse succeeds |
| Implementation complexity | **Low** (no work) |
| Operational risk | **High** — fail-closed now; scheduled transport loss |

### Path B — Narrow CSV parser fix, keep dual transport

| Dimension | Rating |
|-----------|--------|
| Technical feasibility | **Good** — simulated blank-as-missing completes parse; common date 2026-08-24 |
| Source durability | **Poor** — TIPS custom package still BYP-dependent |
| Semantic compatibility | **Good** — skipping blanks matches “no observation” intent |
| Implementation complexity | **Low** — one function, fixture, tests |
| Operational risk | **Medium** — unblocks smoke but November deadline remains |

### Path C — Hybrid (TCM CSV + release XML for TIPS-30)

| Dimension | Rating |
|-----------|--------|
| Technical feasibility | **Good** |
| Source durability | **Partial** — TCM survives uncertain period; XML leg durable |
| Semantic compatibility | **Good** with reconciliation |
| Implementation complexity | **Medium-high** — two formats, two hashes, atomic date reconciliation |
| Operational risk | **Medium** — temporary complexity; two failure modes |

### Path D — All five series via release-level SDMX/XML

| Dimension | Rating |
|-----------|--------|
| Technical feasibility | **Good** — single ZIP, all series verified |
| Source durability | **Strong** — Board-promoted post-BYP path; survives DDP retirement |
| Semantic compatibility | **Good** — map `SERIES_NAME` → DDP id; filter `OBS_STATUS=A`; same common-date logic |
| Implementation complexity | **Medium** — ZIP extract + SDMX parse (new adapter) |
| Operational risk | **Low-medium** — one download; new parser surface to test |

**Product semantics preserved under Path D:** Required 30Y nominal + 30Y real; optional 2Y/5Y/10Y on common date only; no T10YIE; no breakeven; no curve math in adapter; display-only lane unchanged.

---

## 10. Provenance implications

| Transport | `sourceId` | `sourceLocator` | `contentSha256` | `observationAsOf` | `retrievedAt` | `sourcePublishedAt` | `parserVersion` |
|-----------|------------|-----------------|-----------------|-------------------|---------------|----------------------|-----------------|
| Current dual CSV | `frb_h15_treasury_yields` | DDP choose page | SHA-256(TCM bytes ∥ `0x1e` ∥ tips bytes) | Latest common required date | fetch time | Not available from CSV | `1.0.0` → `1.0.1` if blank fix |
| Path B (CSV fix) | unchanged | unchanged | unchanged | unchanged | unchanged | unchanged | **`1.0.1`** |
| Path D (XML ZIP) | `frb_h15_treasury_yields` (or suffixed family) | `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` | **SHA-256 of exact downloaded ZIP bytes** | Latest common required date | fetch time | Release page date / ZIP `Last-Modified` (optional metadata) | New adapter **`1.0.0`** |

### ZIP hashing recommendation

**Hash the exact downloaded ZIP bytes** as `contentSha256`. Rationale: reproducible from what the operator fetched; single artifact; stable across identical releases. Record inner member name (`H15_data.xml`) and SDMX profile in adapter metadata, but do **not** replace ZIP hash with inner XML hash (inner file alone is not what the locator returns). Optionally store uncompressed XML SHA-256 as non-authoritative diagnostic metadata only.

---

## 11. Recommended path

**Primary durable transport: Path D** — migrate all five series to `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` via a new SDMX adapter before **2026-11-09**.

**Immediate unblock (separate small PR):** Path B narrow fix at parser **1.0.1** so the existing CSV adapter and report-only runner can reach deterministic live smoke while XML migration is reviewed and implemented.

Rationale: The live failure is a cheap CSV fix, but **CSV dual transport is not durable** because the TIPS leg requires BYP. The Board explicitly steers BYP users to release-level XML. One ZIP already contains all contract series with explicit missing semantics.

---

## 12. Smallest next PR

**PR 1 (recommended immediately):** Narrow CSV missing-value fix — **do not** change transport.

| Delta | Detail |
|-------|--------|
| File | `lib/ghostflow/refresh/adapters/frbH15TreasuryYields.ts` — `parseYieldCell` |
| Change | Treat whitespace-only / empty value cell as `'nd'` (skip), same as `ND` |
| Reject | Non-empty non-numeric strings; `parseFloat` coercion; silent row drop without missing classification |
| `parserVersion` | **`1.0.0` → `1.0.1`** |
| Fixtures | Add TCM fixture row: `H15/H15/RIFLGFCY02_N.B,1962-01-02,` (blank third column) |
| Tests | Assert parse succeeds and row skipped; live-fixture regression |
| Registry | No `adapterId` / `sourceFormat` change |

**PR 2 (durable, after Bobby approves transport in DECISIONS):** New SDMX adapter.

| Delta | Detail |
|-------|--------|
| `adapterId` | `frb-h15-treasury-yields-sdmx` (proposed) |
| `parserVersion` | `1.0.0` |
| `sourceFormat` | `sdmx` or `xml` |
| `sourceLocator` | `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip` |
| Registry | Point `treasuryLongEndIncomeLens` to new adapter; deprecate CSV adapter |
| Tests | Fixture ZIP or embedded `H15_data.xml` excerpt with all five series |
| Dependencies | ZIP inflate (Node built-in `zlib`/`node:zlib` or minimal existing dep audit) |

---

## 13. Parser-version policy

| Change type | Recommended version | Registry impact |
|-------------|---------------------|-----------------|
| Narrow same-format CSV blank-missing fix | **`1.0.1`** (patch — same transport and output shape) | None |
| Transport migration CSV → XML/SDMX | **New adapter `1.0.0`** | New `adapterId`, `sourceFormat`, `sourceLocator`; CSV adapter retained until cutover |

Repository convention: all implemented adapters start at `1.0.0`; no prior patch bump precedent, but semver semantics favor **1.0.1** for additive missing-value handling without transport change.

---

## 14. XML transport stability

| Dimension | Classification | Notes |
|-----------|----------------|-------|
| Technical stability | **GREEN** | Fixed URL on release page; HTTP 200; updated daily with release |
| Authorization | **GREEN** | Public HTTPS; no API key |
| Semantic compatibility | **YELLOW** | Series IDs lack `H15/H15/` prefix; missing via `OBS_STATUS` not blank cells; requires mapping layer and status filter — straightforward but new parser |

URL does not embed calendar date; appears to always serve **current release** snapshot. Monitor Board announcements for DDP retirement wording affecting release XML (none observed beyond BYP removal as of 2026-08-25).

---

## 15. Falsifiers

| Falsifier | Effect |
|-----------|--------|
| Board documents blank CSV cells as errors rather than missing | Reclassify toward D or E |
| Preformatted TCM package removed in November alongside BYP | Accelerate Path D; Path B interim only |
| Release XML ZIP drops `RIFLGFCY30_XII_N.B` or changes `SERIES_NAME` | Path D blocked; reassess FRED licensed path |
| Blank fix causes acceptance of malformed non-empty garbage strings | Path B unsafe; reject fix |
| MD5 custom package URLs survive BYP removal | Path C or dual CSV durability improves; re-evaluate November exposure |
| Common-date latest diverges materially between CSV and XML on same release day | Investigate calendar / status semantics before cutover |

---

## Instruction alignment

- Read-only investigation: **yes**
- Exact failing row identified: **yes** (row 67486, blank value)
- No parser fix implemented in this PR: **yes**
- No source migration implemented: **yes**
- Official Board sources only: **yes**
- BYP retirement evaluated: **yes**
- XML/SDMX evaluated: **yes**
- Product semantics preserved in recommendations: **yes**
- No T10YIE / breakeven change: **yes**
- No registry / artifact / score / reference change in this PR: **yes**
- No raw source committed: **yes**
