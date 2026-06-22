# Tail Skew Context Artifact Design — GhostFlow v1.9e.2

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Roadmap](./DATA_ROADMAP.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md)

**Research umbrella:** [PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md](./PROTECTION_BID_CORRELATION_DISPERSION_FEASIBILITY.md) · [PROTECTION_BID_SOURCE_SPIKE.md](./PROTECTION_BID_SOURCE_SPIKE.md)

**Related:** [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (VIX manual extract) · [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) · [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) · [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) · [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md)

**Spike script:** [`skew-source-spike.ts`](../scripts/ghostflow/skew-source-spike.ts) — operator CSV only; not in `ghostflow:check`

This memo is a **docs-only artifact design** for a future **display-only** Cboe SKEW card. It does **not** create JSON, validators, UI, score wiring, or runtime behavior.

---

## Status

| Item | v1.9e.2 posture |
|------|------------------|
| Document type | **Artifact design memo** |
| Scope | **Docs-only** |
| Production artifact JSON | **None** |
| Example artifact JSON | **None** |
| Validator / types / tests | **None** |
| UI / dashboard card | **None** |
| Score change | **None** |
| Runtime change | **None** |
| Package change | **None** |
| `publicPassiveInputKey` | **None** |
| **`publicSignalCount`** | **12** (equity) — **unchanged** |

---

## Source lock summary

[PROTECTION_BID_SOURCE_SPIKE.md](./PROTECTION_BID_SOURCE_SPIKE.md) — operator verification complete (v1.9e.1 / v1.9e.1a):

| Item | Value |
|------|--------|
| **SKEW source lock** | **PASS** |
| **Source URL** | `https://cdn.cboe.com/api/global/us_indices/daily_prices/SKEW_History.csv` |
| **CSV format** | `DATE,SKEW` |
| **Verified rows** | **9,167** |
| **First date** | **1990-01-02** |
| **Latest verified date** | **2026-06-18** |
| **Latest verified value** | **146.72** |
| **Correlation source lock** | **SKIPPED** / deferred |

---

## Artifact identity

**Design-only in v1.9e.2 — not implemented.**

| Item | Planned value |
|------|---------------|
| **Production artifact file** | `data/ghostflow/artifacts/tailSkewContext.v1.json` |
| **Example artifact file** | `data/ghostflow/artifacts/tailSkewContext.v1.example.json` |
| **Artifact `signalId`** | `tail-skew-context-proxy` |
| **Dashboard card id** | `tail-skew-context` |
| **Card title** | **Tail Skew Context** |
| **Alternate source/methodology name** | Cboe SKEW Proxy |
| **`observationType`** | `cboe_skew_daily_snapshot` |
| **`seriesDefinition`** | `cboe_skew_daily_index_level_v1` |
| **`dataStatus`** | `public_proxy` |
| **Display badge** | `DISPLAY ONLY` |
| **`mappingStatus`** | `not_final` |
| **`updateFrequency`** | `daily` |
| **`units`** | `index_level` |
| **Future display order** | After `cap-weight-premium` (#12) if production card approved in v1.9e.4 |

**Do not** use research umbrella title **Protection Bid / Correlation Dispersion** as the dashboard card title.

---

## Semantics

### What SKEW means in GhostFlow

- **Cboe SKEW index level** — daily snapshot from official CDN CSV
- **Tail-skew / outlier-return pricing context** — implied pricing shape for extreme moves vs ATM
- **Relative pricing of tail protection** versus ordinary volatility **level** (VIX)
- **Companion context beside VIX** — display-only; not a replacement

### What it is not

| Mislabel | Correct home |
|----------|--------------|
| VIX level / vol amplifier | Score-fed `vol-regime` → `optionsVolatilityAmplifier` (**20%** Passive) |
| Realized volatility | Not this index |
| OCC options volume / intensity | Display-only `options-activity-proxy` |
| Put/call ratio | Not in current OCC daily lock |
| 0DTE / GEX / dealer gamma | RED — [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) |
| Implied correlation / dispersion | Deferred — no COR source lock |
| Directional market forecast | Forbidden framing |
| Score input | No `publicPassiveInputKey`; v1.9e.6 discouraged |

### Three-way distinction (future card copy)

| Signal | Measures | Lane |
|--------|----------|------|
| **VIX** | Implied volatility **level** | Score-fed |
| **SKEW** | Tail-skew **shape / protection pricing context** | Display-only |
| **OCC activity** | Options **volume** intensity | Display-only |

---

## Proposed schema

Future **`tailSkewContext.v1`** JSON — **do not create in v1.9e.2**. Field names align with peer display-only artifacts ([OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md), [CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md](./CAP_WEIGHT_PREMIUM_ARTIFACT_DESIGN.md)).

### Top-level

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `artifactVersion` | `"1"` | yes | |
| `signalId` | `"tail-skew-context-proxy"` | yes | |
| `designOnly` | `true` | example only | Required in v1.9e.3 example; **forbidden** in production |
| `title` | `"Tail Skew Context"` | recommended | User-facing |
| `asOf` | ISO date | yes | Latest SKEW session (`DATE` → `YYYY-MM-DD`) |
| `publishedAt` | ISO date | yes | Operator publish date; `>= asOf` |
| `source` | object | yes | See § source block |
| `observationType` | `"cboe_skew_daily_snapshot"` | yes | |
| `seriesDefinition` | `"cboe_skew_daily_index_level_v1"` | yes | |
| `updateFrequency` | `"daily"` | yes | |
| `dataQuality` | `verified_manual` \| `manual_unverified` | yes | Initial production likely `manual_unverified` |
| `dataStatus` | `"public_proxy"` | recommended | Card lane |
| `mappingStatus` | `"not_final"` | yes | Only allowed value until v1.9e.5 |
| `units` | `"index_level"` | yes | SKEW is unitless index level |
| `caveats` | `string[]` | yes | Non-empty |
| `methodology` | object | recommended | Index definition; `noScoreMapping: true` |
| `observations` | object | yes | See § observations |
| `historySummary` | object | recommended | CSV lock metadata |
| `display` | object | recommended | Pre-render card copy for v1.9e.4 |
| `provenance` | object | recommended | Operator audit trail |
| `operatorNotes` | `string` | optional | Free text |

### `source` block

| Field | Notes |
|-------|-------|
| `name` | `"CBOE SKEW Index History"` |
| `url` | Locked CDN URL (see Source lock summary) |
| `sourceName` | Alias, e.g. `"Cboe Global Indices — SKEW"` |
| `sourceUrl` | Same as `url` if duplicated |
| `sourceAccessedDate` | ISO date of operator CSV download |
| `note` | Two-column `DATE,SKEW`; manual extract; display-only; not VIX/OCC/0DTE |

### `observations` block

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `currentSkew` | number | yes | Latest `SKEW` value |
| `latestObservation` | `{ date, skew }` | recommended | Mirrors VIX `vixClose` pattern |
| `priorSessionSkew` | number | recommended | Prior trading row |
| `dailyChange` | number | recommended | `currentSkew − priorSessionSkew` |
| `dailyChangePct` | number | recommended | Percent change when prior present |
| `mappingStatus` | `"not_final"` | yes | If not duplicated at top level |

**Design reference** (operator verification 2026-06-18):

- `currentSkew`: **146.72**
- `priorSessionSkew`: **142.62** (2026-06-17)
- `dailyChange`: **+4.10**
- `dailyChangePct`: **+2.87**

**Formulas (future validator v1.9e.3):**

```
dailyChange = currentSkew − priorSessionSkew
dailyChangePct = (dailyChange / priorSessionSkew) × 100
```

Reconciliation tolerance: **0.01** index points / **0.05** percentage points.

### `historySummary` block

| Field | Required in v1.9e.2 design |
|-------|----------------------------|
| `rowCount` | yes — e.g. **9167** |
| `firstDate` | yes — `1990-01-02` |
| `latestDate` | yes — matches `asOf` |
| `latestValue` | yes — matches `currentSkew` |
| `sourceLockStatus` | recommended — `"PASS"` |
| Percentile fields | **no** — deferred to optional **v1.9e.3a** |

### `display` block

| Field | Example |
|-------|---------|
| `headline` | `SKEW index level: 146.72` |
| `body` | `Cboe SKEW tracks SPX tail-skew pricing; higher readings can indicate richer outlier-risk protection pricing.` |
| `caveat` | `Display-only tail-skew context. Not VIX, not 0DTE, not dealer gamma, and not a score input.` |
| `badge` | `DISPLAY ONLY` |

### `provenance` block

| Field | Example |
|-------|---------|
| `operatorRunCommand` | `npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <local-path>` |
| `spikeScriptVersion` | `v1.9e.1a` |
| `csvFormat` | `DATE,SKEW` |
| `transcriptionMethod` | `manual_from_cboe_csv` |

---

## Forbidden fields

Future validator (v1.9e.3) must **reject** any non-null value for these keys at **any** nesting level:

**Score / pressure wiring:**

- `publicPassiveInputKey`
- `basketScore`, `mappedPressureScore`, `candidatePressureScore`
- `score`, `pressureScore`, `tailRiskScore`, `protectionBidScore`
- `numericValue` when used as score-like 0–100 output
- Score-band enum fields
- Composite contribution fields

**Misleading options constructs:**

- `gammaPressure`, `gex`, `dealerGamma`
- `zeroDte`, `zeroDteShare`, `zeroDteSharePct`
- `putCallRatio`, `putCallVolume`
- `impliedCorrelation`, `correlationDispersion`, `cor1m`

**Forbidden language** in `caveats`, `display`, or `title`:

- SKEW is 0DTE, dealer gamma, or GEX
- SKEW is correlation dispersion
- SKEW is direct put volume or protection **demand**
- SKEW predicts market direction
- Trading or allocation recommendation language

**Example-only:** `designOnly: true` required in example JSON; **forbidden** in production.

---

## Display-card plan

**No card in v1.9e.2.** Future card only if product approves **v1.9e.4**.

| Behavior | Rule |
|----------|------|
| Badge | `DISPLAY ONLY` |
| Score band | **None** |
| Pressure color | **None** |
| Composite contribution | **None** |
| `publicPassiveInputKey` | **None** |
| Source attribution | Cboe SKEW Index + CDN URL |
| Grouping | Display-only equity public artifacts block |
| `publicSignalCount` | Remains **12** until v1.9e.4; then **12 → 13** if product-approved |
| `buildSnapshot` | Display merge only — no score merge |

Future card body must distinguish VIX (level, score-fed) · SKEW (tail skew, display-only) · OCC (volume, display-only).

---

## Operator workflow

Future manual refresh (mirrors VIX runbook + locked SKEW spike):

1. Download `SKEW_History.csv` locally from Cboe CDN — **do not commit CSV**
2. Run: `npx tsx scripts/ghostflow/skew-source-spike.ts --skew-csv <local-path>`
3. Confirm `SKEW_SOURCE_LOCK: PASS`
4. Copy latest `DATE` → `asOf` (ISO `YYYY-MM-DD`)
5. Copy latest `SKEW` → `observations.currentSkew`
6. Copy prior row → `priorSessionSkew`
7. Calculate `dailyChange` and `dailyChangePct`
8. Record `source.sourceAccessedDate`, `publishedAt`, `dataQuality`, `provenance`
9. Update `historySummary` periodically from spike stdout
10. Validate future artifact when validator exists (v1.9e.3+)
11. Commit **artifact JSON only**

**Dedicated refresh helper:** Not required in v1.9e.2 or v1.9e.3. Manual transcription from locked CSV is sufficient.

---

## Calibration / mapping

| Item | v1.9e.2 decision |
|------|------------------|
| Mapping selected | **None** |
| 0–100 score mapper | **None** |
| `mappingStatus` | **`not_final`** only |
| Percentile calibration | **None** — optional **v1.9e.3a** for display context |
| Score gate v1.9e.6 | **Discouraged / not approved** — VIX overlap + [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) |

Any future calibration remains **display-only** unless product explicitly reopens score gates (not planned).

---

## Future phase ladder

| Phase | Deliverable | Score? | `publicSignalCount` |
|-------|-------------|--------|---------------------|
| **v1.9e.2** | This design memo | No | **12** |
| **v1.9e.3** | Example JSON + validator/types/tests | No | **12** |
| **v1.9e.3a** (optional) | SKEW historical percentile calibration study | No | **12** |
| **v1.9e.4** | Production JSON + display-only card | No | **12 → 13** (product-approved) |
| **v1.9e.5** | Mapping decision — expected display-only | No | 13 |
| **v1.9e.6** | Score gate | **Discouraged** | — |

Correlation dispersion remains **out of scope** until separate source lock.

---

## Relationship to existing lanes

| Lane | Relationship |
|------|--------------|
| **VIX / `vol-regime`** | Score-fed vol **level** — Tail Skew Context is **companion**, not replacement |
| **OCC / `options-activity-proxy`** | Display-only **volume** — do not duplicate under protection-bid label |
| **0DTE feasibility** | SKEW must not be labeled 0DTE/GEX |
| **v1.10e no-score-change policy** | No score wiring without explicit gate |
| **Public signal inventory** | Do **not** add 13th signal until v1.9e.4 ships |

Tail Skew Context is **companion context**, not a replacement for VIX and not another options-volume card.

---

## No-change confirmation

| Item | v1.9e.2 confirmation |
|------|---------------------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | **Unchanged** |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | **Unchanged** |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | **Unchanged** |
| Production / example artifact JSON | **Unchanged** |
| UI / tests / `package.json` | **Unchanged** |
| **Passive Pressure** | **58** — unchanged |
| **Structural Fragility** | **66** — unchanged |
| **Composite** | **62** — unchanged |
| **`publicSignalCount`** | **12** — unchanged |
| GhostRegime / Marketstack / GhostYield / Models / builder | **Untouched** |

No score changes without explicit product approval.
