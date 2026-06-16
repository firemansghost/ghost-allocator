# Index Inclusion Event Proxy — Artifact Design (GhostFlow v1.9c.2)

**Status:** **v1.9c.2 complete** — docs-only artifact design memo. **Not** scored. No production artifact JSON, example JSON, UI card, validator, `validate-artifacts` registration, or `buildSnapshot` merge.

**Prior work:** [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) (v1.9c, **YELLOW leaning RED**) · [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) (v1.9c.1, Lane D **LOCKED (partial)**)

**Future files (v1.9c.3+):**

- Example: `data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json` (`designOnly: true`, `dataQuality: manual_unverified`)
- Production: `data/ghostflow/artifacts/indexInclusionEventProxy.v1.json`

GhostRegime, GhostYield, Models, and builder are out of scope. This track is **independent** from GhostRegime Marketstack containment (M2–M4); no Marketstack or Stooq usage in any v1.9c.x phase.

---

## Status

| Item | v1.9c.2 posture |
|------|-----------------|
| Document type | Artifact design memo only |
| Scope option | **Option A** — event artifact design using **Lane D only** |
| Score changes | **None** — Composite **62** · Passive **58** · Structural **66** unchanged |
| Example artifact JSON | **None** — deferred to **v1.9c.3** |
| Production artifact JSON | **None** — deferred to **v1.9c.4** |
| UI / components | **None** |
| Runtime / live fetching | **None** |
| `buildSnapshot` merge | **None** |
| `publicPassiveInputKey` | **None** |
| Score gates opened | **No** |
| `publicSignalCount` | **10** (equity) — unchanged |
| Treasury lane | **2** separate display-only cards — unchanged |
| **v1.9c.3** | **Future** — example JSON + validator/types/tests; product-gated |
| **v1.9c.4** | **Future** — production JSON + display card; product-gated; likely `publicSignalCount` 10 → 11 |

---

## 1. Purpose

Design a **future display-only** artifact and dashboard card that captures **public index inclusion, exclusion, rebalance, and reconstitution events** within an operator-defined window.

This artifact represents **structured event context** from public index-provider announcements — not continuous supply telemetry, not free-float modeling, and not index-fund demand estimation.

**It is not:**

- A **Float Absorption Pressure** or **Passive Supply Score** (forbidden naming)
- A tradable supply estimate, free-float proxy, or index-fund demand-dollar model
- Mechanical absorption proof, trade-impact estimate, or causal link between event and price/regime
- A 0–100 Research Composite sub-input (unless a future product gate explicitly approves otherwise — **discouraged**)
- Investment advice or allocation guidance

**v1.9c.2 does not** replace MOCK inputs, add `mappedPressureScore`, wire into scoring, or change `publicSignalCount`.

---

## 2. Scope decision (Option A — Lane D only)

| Option | Description | v1.9c.2 decision |
|--------|-------------|------------------|
| **A — Event artifact (Lane D)** | Index inclusion/rebalance/reconstitution events | **Selected** |
| **B — Event + quarterly macro (Lanes D + A/B)** | Event card plus issuance/buyback context | **Rejected** — defer macro companion to separate future artifact |
| **C — Quarterly macro only (Lanes A/B)** | Issuance/buyback context card | **Rejected** as primary |
| **D — Defer design** | Keep source spike only | **Rejected** — v1.9c.1 partial lock sufficient |

**Excluded from this artifact:**

| Lane | Reason |
|------|--------|
| **A/B** — Aggregate issuance / buyback | Lagged quarterly macro context; different cadence and construct |
| **C** — IPO / secondary / lockup | Manual watchlist path only; not continuous artifact-ready |
| **E** — Free float at scale | **RED** — not viable |
| **F** — Top-N share-count | Narrow research appendix only |

---

## 3. Relationship to live artifacts

| Signal / artifact | Side | Relationship to index inclusion event proxy |
|-------------------|------|---------------------------------------------|
| **`concentration`** | Structure | Top-10 **weight level** — not inclusion events |
| **`etf-flow`** | Demand | ICI domestic equity ETF **vehicle** net issuance — not index mechanical events |
| **`passive-share`** | Stock | Index-oriented **asset level** — not event calendar |
| **`active-index-flow`** | Demand | Active vs index **monthly fund flows** — not index add/delete announcements |
| **`cap-weight-premium-proxy`** | Return effect | SPY/RSP spread/ratio — companion narrative; not supply events |
| **`systematic-flow`** | Positioning | CFTC futures lev-funds — unrelated |
| **`retirement-asset-growth`** | Stock | Quarterly retirement **asset totals** — different cadence |
| **`options-activity-proxy`** | Options activity | OCC cleared volume — unrelated |
| **Treasury lane** | Separate product | Outside `publicSignalCount` and composite |

**Boundary locks:**

- Supply-side **event context** — not replacement for any existing artifact.
- **No merge** into Research Composite or sub-scores.
- **No `publicPassiveInputKey`**.
- **No `publicSignalCount` change** in v1.9c.2; future display card (v1.9c.4) requires separate product approval (likely 10 → 11).

---

## 4. Naming decision

| Item | Locked value |
|------|--------------|
| **User-facing card title** | **Index Inclusion Event Proxy** |
| **Artifact `signalId`** | `index-inclusion-event-proxy` |
| **Dashboard card id** | `index-inclusion-events` |
| **Production artifact file** | `data/ghostflow/artifacts/indexInclusionEventProxy.v1.json` |
| **Example artifact file** | `data/ghostflow/artifacts/indexInclusionEventProxy.v1.example.json` |
| **`observationType`** | `index_inclusion_rebalance_event_snapshot` |
| **`seriesDefinition`** | `public_index_change_events_v1` |
| **`updateFrequency`** | `event_driven` |

### Forbidden naming / framing

- **Do not** use **Float Absorption Pressure**, **Passive Supply Score**, or **Supply Pressure Score**.
- **Do not** imply actual free-float modeling or index-fund demand-dollar modeling.
- **Do not** imply composite impact, trade impact, or causal proof.
- **Do not** use **“signal”** language that implies trading advice.

### Rejected candidates

| Candidate | Reason |
|-----------|--------|
| Index Inclusion Pressure Proxy | “Pressure” implies scored input |
| Index Inclusion / Float Tension Proxy | Implies float modeling (Lane E RED) |
| Index Event Absorption Proxy | “Absorption” implies demand-vs-float |
| Passive Supply Event Proxy | Too broad for Lane D-only scope |
| Index Rebalance Supply Event Proxy | “Supply” without float proof; acceptable alternate but not selected |

**“Proxy” placement:** Include **Proxy** in the card title and repeat in `caveats` / `source.note` (per [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) honesty pattern).

---

## 5. Source policy (Lane D only)

### Primary source categories (from v1.9c.1 verification)

| Provider | Verified path | Use |
|----------|---------------|-----|
| **Nasdaq** | [Index change announcements](https://ir.nasdaq.com/news-releases/) (e.g. Nasdaq-100 annual changes) | Add/delete lists + effective dates |
| **FTSE Russell** | [Russell Reconstitution](https://www.lseg.com/en/ftse-russell/russell-reconstitution) | Preliminary/final add/delete files + schedules |
| **S&P DJI** | [Media center announcements](https://www.spglobal.com/spdji/en/media-center/news-announcements/) | S&P 500 / sector index changes (fetch may be intermittent) |

### Policy locks

| Rule | Detail |
|------|--------|
| **Operator-verified sources only** | Each event row must cite a public announcement URL |
| **Manual source capture** | Operator transcribes from official pages/files |
| **No runtime fetching** | No dashboard or build-time API calls |
| **No scraping** | Do not scrape restricted or ToS-sensitive pages; treat [Nasdaq legal/terms](https://www.nasdaq.com/legal) conservatively |
| **No committed downloaded source files** | Russell CSVs, PDFs, press releases — not in repo unless separately approved |
| **No invented universal API** | Source links are metadata only |
| **No Marketstack / Stooq** | Out of scope for this artifact |

### Required per-event source metadata

| Field | Required |
|-------|----------|
| `sourceName` | yes |
| `sourceUrl` | yes — direct announcement URL |
| `announcedDate` | yes — from announcement |
| `effectiveDate` | recommended; `null` + `notes` if unknown |
| `sourceAccessedDate` | yes — operator verification date |
| Licensing/terms caveat | yes — artifact-level `caveats` and optional per-event `notes` |

### Future operator workflow (v1.9c.4+)

1. Monitor index provider announcement pages during rebalance seasons
2. Transcribe events using §14 operator intake template
3. Populate artifact JSON fields (v1.9c.3+)
4. Validate artifact (v1.9c.3+)
5. Commit **artifact JSON only** — never vendor CSVs, PDFs, or downloaded announcement files

---

## 6. Future artifact concept

A **display-only event snapshot** listing recent and upcoming public index inclusion/rebalance/reconstitution events within an operator-defined window (`eventWindowStart` … `eventWindowEnd`).

### What the artifact represents

- A public index provider announced an add, delete, rebalance, or reconstitution
- Effective date is known or explicitly marked unknown with caveat
- Affected ticker(s), company name, and index family are recorded
- Operator verified the citation (`operatorVerified: true` for production rows)

### What it does NOT represent

- Actual free float or tradable supply (`floatEstimateAvailable: false` always in v1.9c.x)
- Index-fund demand dollars (`demandEstimateAvailable: false` always in v1.9c.x)
- Mechanical “absorption” proof or trade impact
- A 0–100 pressure score or composite input
- Causal link between event and price/regime

**Empty event windows are valid:** `eventCount: 0`, `events: []` — not a failed feed.

---

## 7. Artifact schema (future — do not create in v1.9c.2)

Field names follow peer display-only artifacts ([OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md), [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md)).

### 7.1 Top-level

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `artifactVersion` | `"1"` | yes | |
| `signalId` | `"index-inclusion-event-proxy"` | yes | |
| `designOnly` | `true` | example only | Required in v1.9c.3 example; forbidden in production |
| `asOf` | ISO date | yes | Operator snapshot date |
| `publishedAt` | ISO date | yes | Operator publish date; `>= asOf` |
| `source` | `{ name, url, note? }` | yes | Primary methodology / source index page |
| `observationType` | `"index_inclusion_rebalance_event_snapshot"` | yes | |
| `seriesDefinition` | `"public_index_change_events_v1"` | yes | |
| `updateFrequency` | `"event_driven"` | yes | |
| `dataQuality` | `verified_manual` \| `manual_unverified` | yes | Initial: **`manual_unverified`** |
| `mappingStatus` | `"not_final"` | yes | Always in v1.9c.x |
| `methodology` | string | recommended | e.g. `"manual_curation_from_public_index_announcements"` |
| `caveats` | `string[]` | yes | Non-empty |
| `observations` | object | yes | See §7.2 |

### 7.2 `observations` aggregate

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `eventWindowStart` | ISO date | yes | Inclusive window start |
| `eventWindowEnd` | ISO date | yes | Inclusive window end |
| `eventCount` | int ≥ 0 | yes | Total events in window |
| `upcomingEventCount` | int ≥ 0 | yes | Effective date > `asOf` |
| `recentEventCount` | int ≥ 0 | yes | Effective date ≤ `asOf` |
| `majorIndexEventCount` | int ≥ 0 | recommended | S&P 500, Nasdaq-100, Russell 1000/2000 tier |
| `sourceEventCount` | int ≥ 0 | yes | Must equal `events.length` |
| `mappingStatus` | `"not_final"` | yes | |
| `events` | array | yes | See §7.3; may be empty |

**Count reconciliation (v1.9c.3 validator):**

- `eventCount === events.length === sourceEventCount`
- `eventCount === upcomingEventCount + recentEventCount` (when effective dates present; events with null `effectiveDate` may be counted separately with documented rule)

### 7.3 Event object

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `eventId` | string | yes | Stable operator id (e.g. `nasdaq100-2025-annual-add-PLTR`) |
| `sourceName` | string | yes | e.g. `Nasdaq IR` |
| `sourceUrl` | string | yes | Direct announcement URL |
| `announcedDate` | ISO date | yes | |
| `effectiveDate` | ISO date \| null | recommended | Null + `notes` if unknown |
| `sourceAccessedDate` | ISO date | yes | Operator verification date |
| `indexFamily` | enum | yes | `sp_dji` \| `nasdaq` \| `ftse_russell` \| `other` |
| `indexName` | string | yes | e.g. `Nasdaq-100`, `S&P 500` |
| `ticker` | string | yes | Uppercase symbol |
| `companyName` | string | recommended | Display only |
| `action` | enum | yes | `add` \| `delete` \| `rebalance` \| `reconstitution` \| `unknown` |
| `eventType` | string | recommended | e.g. `annual_rebalance`, `special_rebalance`, `quarterly_rebalance` |
| `notes` | string | optional | Operator context; licensing caveat if relevant |
| `sourceConfidence` | enum | optional | `high` \| `medium` \| `low` — qualitative only |
| `operatorVerified` | boolean | yes | Must be `true` for production rows |
| `floatEstimateAvailable` | boolean | yes | **Always `false`** in v1.9c.x |
| `demandEstimateAvailable` | boolean | yes | **Always `false`** in v1.9c.x |
| `mappingStatus` | `"not_final"` | yes | |

**Optional qualitative only:** `eventSeverityLabel` (e.g. `major_index`, `mid_cap_index`) — no numeric score-like buckets unless based on public index tier classification.

### 7.4 Forbidden fields (validator must reject in v1.9c.3+)

At root, in `observations`, or in any event object:

- `mappedPressureScore`, `candidatePressureScore`, `basketScore`, `publicPassiveInputKey`
- `floatAbsorptionScore`
- Score-like `numericValue`
- `impliedDemandDollars`, `freeFloatPct` — unless a future verified/licensed source lane opens (not v1.9c.x)
- Any 0–100 pressure/score field

---

## 8. Future dashboard card (document only — do not implement in v1.9c.2)

### Display posture

| Element | Rule |
|---------|------|
| Badge | **DISPLAY ONLY** |
| Color band | **None** tied to composite / passive / structural scores |
| Pressure score | **None** |
| Composite impact line | **None** |
| Lane | Equity public artifacts grid — **not** Treasury lane |

### Recommended card layout

| Element | Copy |
|---------|------|
| **Headline (events exist)** | **Index events in window: {eventCount}** |
| **Headline (empty)** | **No major index events in window** |
| **Subline** | Next upcoming `effectiveDate` if any; else most recent event date |
| **Body** | 1–3 event rows: ticker · action · index name · effective date |
| **Required caveat** | *Public index-event proxy; does not estimate free float, index-fund demand, or trade impact.* |

**Empty state is acceptable and expected** — not an error state.

### Product / counting policy (v1.9c.4+)

| Question | Answer |
|----------|--------|
| Equity public artifacts lane? | **Yes** — 5th display-only equity card |
| `publicSignalCount` 10 → 11? | **Likely if v1.9c.4 ships** — requires explicit product approval |
| Product-gated? | **Yes** — v1.9c.3 scaffolding and v1.9c.4 production/display both gated |
| `buildSnapshot` score merge? | **No** |
| `publicPassiveInputKey`? | **No** |
| New MOCK score slot? | **No** — MOCK **62 / 58 / 55** unchanged |

---

## 9. Data quality and refresh cadence

| Field | Initial value |
|-------|---------------|
| `dataQuality` | `manual_unverified` |
| `updateFrequency` | `event_driven` |
| `mappingStatus` | `not_final` |

### Operator refresh discipline

| Period | Cadence |
|--------|---------|
| Major rebalance seasons (Russell reconstitution, Nasdaq-100 annual, S&P quarterly) | **Weekly review** |
| Otherwise | **Monthly review** |
| Provider announcement | **Event-driven update** within 1–2 business days |

### Staleness (event artifacts differ from time series)

- Staleness means the **event window may be outdated** — not that a daily market bar is missing
- Valid states: fresh events, empty window, or stale window with explicit `caveats` note
- Do **not** fail validation solely because `eventCount === 0`

### Promotion to `verified_manual`

Only after operator QA discipline: dual-check of source URLs, count reconciliation, and effective-date alignment with official announcements.

---

## 10. Caveats (required in artifact and card)

1. Source fragmentation across index providers (Nasdaq, FTSE Russell, S&P DJI)
2. Preliminary vs final reconstitution lists may differ — operator must note stage in `notes`
3. Public announcements may lag effective dates
4. Event completeness not guaranteed — manual curation required
5. No free-float model and no index-fund demand model
6. No trade-impact estimate
7. Not a trading signal; not investment advice
8. Not a Research Composite input
9. Index provider licensing/redistribution limits — cite URLs; do not commit raw files
10. Operator verification required for production event rows

---

## 11. Future phase ladder

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.9c** | Passive Supply / Float Absorption Feasibility | **Done** |
| **v1.9c.1** | Passive Supply Source Spike | **Done** |
| **v1.9c.2** | Index Inclusion Event Proxy — **this memo** | **Done** (docs-only) |
| **v1.9c.2a** | Operator event intake template (§14 appendix) | **Included in this memo** |
| **v1.9c.3** | Example JSON + validator/types/tests; no production JSON | **Future** — product-gated |
| **v1.9c.4** | Production artifact + display-only UI integration | **Future** — product-gated; likely `publicSignalCount` 10 → 11 |
| **v1.9c.5** | Mapping decision — likely display-only Option A | **Future** |
| **v1.9c.6** | Score gate | **Future** — **discouraged / not approved by default** |

**Deferred (not v1.9c.2):**

- **Lane A/B quarterly macro companion** → separate artifact in future phase if product wants
- **Lane C IPO watchlist** → manual memo only
- **Lane F top-N share-count** → research appendix only

**Parallel track:** **v1.9b.4** cap-weight production/display remains **independent and product-gated**.

**Marketstack M-track:** GhostRegime M2–M4 containment is complete and separate. M5+ may interrupt v1.9c.3+ implementation but does not change this design memo.

---

## 12. Not implemented in v1.9c.2

| Item | Status |
|------|--------|
| Example or production artifact JSON | **No** |
| Display card / `components/ghostflow/*` | **No** |
| `lib/ghostflow/artifacts/*` validator | **No** |
| `buildSnapshot` merge | **No** |
| `signalPresentation` entry | **No** |
| `validate-artifacts.ts` registration | **No** |
| Score wiring / `scoring.ts` | **No** |
| `publicPassiveInputKey` | **No** |
| Runtime/live dashboard fetch | **No** |
| `mockGhostflowSnapshot` changes | **No** |
| `publicSignalCount` change | **No** |

---

## 13. Guardrails (v1.9c.2)

- Artifact design memo only — no implementation
- Composite **62 / 58 / 66** unchanged
- `publicSignalCount` **10** unchanged
- Treasury **2**-card lane unchanged
- No score gates opened
- GhostRegime, GhostYield, Models, builder out of scope
- No Marketstack, Stooq, or live market API calls
- No build, test, refresh, ETL, smoke, deploy, or workflow commands in this phase
- No committed downloaded source files or generated research output

---

## 14. Operator event intake template (v1.9c.2a appendix)

Use this markdown table when curating events before v1.9c.3 example JSON. One row per event; transcribe into artifact `events[]` in v1.9c.3+.

| eventId | sourceName | sourceUrl | announcedDate | effectiveDate | sourceAccessedDate | indexFamily | indexName | ticker | companyName | action | eventType | operatorVerified | notes |
|---------|------------|-----------|---------------|---------------|--------------------|-------------|-----------|--------|-------------|--------|-----------|------------------|-------|
| *(example)* `russell-2025-prelim-add-XYZ` | FTSE Russell | *(URL)* | YYYY-MM-DD | YYYY-MM-DD | YYYY-MM-DD | `ftse_russell` | Russell 2000 | XYZ | Example Corp | `add` | `reconstitution` | true | Preliminary list; subject to change |

**Intake rules:**

- `eventId` must be stable and unique within the artifact
- `sourceUrl` must resolve to the official announcement
- Set `floatEstimateAvailable` and `demandEstimateAvailable` to **`false`** for every event in v1.9c.x
- Set `mappingStatus` to **`not_final`** for every event in v1.9c.x
- Do not commit filled intake sheets with downloaded PDFs/CSVs — metadata URLs only

---

## 15. Related documents

- [PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md](./PASSIVE_SUPPLY_FLOAT_ABSORPTION_FEASIBILITY.md) — v1.9c feasibility
- [PASSIVE_SUPPLY_SOURCE_SPIKE.md](./PASSIVE_SUPPLY_SOURCE_SPIKE.md) — v1.9c.1 source verification; Lane D lock
- [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) — v1.9a research queue
- [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md) — parallel display-only design pattern
- [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) — display-only proxy naming honesty pattern
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase ladder
- [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) — canonical inventory
