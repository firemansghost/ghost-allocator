# Index Options Intensity Proxy — Artifact Design (GhostFlow v1.4c)

**Status:** **v1.4d complete** — production JSON, `validate-artifacts`, display-only dashboard card. **Not** scored. Official OCC preflight required (see §9).

**Prior research:** [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) (v1.4a) · v1.4b column-lock spike (`npm run ghostflow:options-data-spike`)

**Example file:** [`data/ghostflow/artifacts/optionsActivityProxy.v1.example.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.example.json) (`designOnly: true`, `dataQuality: manual_unverified`)

**Production file:** [`data/ghostflow/artifacts/optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) (`dataQuality: manual_unverified`; omit `designOnly`)

**Library:** [`lib/ghostflow/artifacts/optionsActivityProxy.ts`](../lib/ghostflow/artifacts/optionsActivityProxy.ts) — `validateOptionsActivityProxyArtifact`, `loadOptionsActivityProxyArtifact`, display merge via `buildSnapshot`

---

## 1. v1.4b source outcome (locks for v1.4c)

| Outcome | Result | Implication |
|---------|--------|-------------|
| **A — Cboe public 0DTE column lock** | **FAIL** | No stable 0DTE columns in Apr/May 2026 monthly XLSX; do not use press/insights 0DTE % as artifact fields |
| **B — OCC aggregate / index options fields** | **PASS** | `indexOptionsContracts`, `totalOptionsContracts`, equity/ETF splits, put/call ratio usable for a **renamed display-only** proxy |
| **C — Public aggregate path** | **FAIL** (as 0DTE substitute) | Public aggregate exists but **does not** prove same-day expiry or dealer gamma |

---

## 2. Naming decision (not 0DTE)

| Item | Value |
|------|--------|
| `signalId` | `options-activity-proxy` |
| Preferred UI label | **Index Options Intensity Proxy** |
| Alternate label | **Options Activity Pressure Proxy** |

**Forbidden** as measured/current labels for this artifact:

- `0DTE / Options Pressure`
- `0DTE / Gamma Pressure`
- Any label implying dealer gamma, GEX, same-day expiry, or intraday hedging pressure

Those labels are reserved for true 0DTE/GEX provenance (likely paid/vendor).

The existing dashboard placeholder `odte-options` stays **PLACEHOLDER** until v1.4d replaces it with `options-activity-proxy` and the renamed card.

---

## 3. Source selection

| Role | Source | Cadence | v1.4c |
|------|--------|---------|-------|
| **Primary** | [OCC Daily Volume — Volume Download](https://www.theocc.com/market-data/market-data-reports/volume-and-open-interest/daily-volume) | Daily | Design + example only; operator must verify against official download + Record Layout PDF in v1.4d |
| **Supplementary (optional)** | Cboe monthly Select Index Products XLSX — SPX options ADV | Monthly | May appear only under `optionalObservations`; clearly labeled supplementary, **not** 0DTE |

**Not in scope:** OPRA tick reconstruction, vendor GEX, contract-date 0DTE inference from OCC files without product approval.

---

## 4. Artifact schema

### Top-level

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `artifactVersion` | `"1"` | yes | |
| `signalId` | `"options-activity-proxy"` | yes | |
| `designOnly` | `true` | example only | Required in example mode; forbidden in production mode |
| `asOf` | ISO date | yes | Session date for OCC snapshot |
| `publishedAt` | ISO date | yes | `>= asOf` |
| `source` | `{ name, url, note? }` | yes | `url` required |
| `observationType` | `"occ_daily_volume_snapshot"` | yes | |
| `seriesDefinition` | `"occ_daily_options_volume_v1"` | yes | |
| `updateFrequency` | `"daily"` | yes | |
| `dataQuality` | `verified_manual` \| `manual_unverified` | yes | Example: `manual_unverified` |
| `caveats` | `string[]` | yes | Non-empty |
| `observations` | object | yes | See below |
| `optionalObservations` | object | no | Cboe SPX ADV supplementary only |

### `observations` (required / recommended)

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `totalOptionsContracts` | yes | int ≥ 0 | OCC cleared total |
| `indexOptionsContracts` | yes | int ≥ 0 | ≤ total |
| `indexShareOfTotalPct` | yes | number | Must reconcile (see §5) |
| `mappingStatus` | yes | `"not_final"` | v1.4c lock |
| `equityOptionsContracts` | recommended | int ≥ 0 | |
| `etfOptionsContracts` | recommended | int ≥ 0 | |
| `putCallRatio` | recommended | number > 0 | |
| `priorSessionIndexOptionsContracts` | recommended | int ≥ 0 | Prior session for change % |
| `indexOptionsDailyChangePct` | recommended | number | Must reconcile when prior present |

### `optionalObservations` (supplementary)

| Field | Notes |
|-------|-------|
| `spxOptionsAdvThousands` | Cboe monthly SPX options ADV (thousands contracts) |
| `spxAdvAsOfMonth` | e.g. `2026-04` |
| `spxAdvSourceNote` | Must state monthly / supplementary / not 0DTE |

### Forbidden keys (any level with non-null value)

- `mappedPressureScore`, `candidatePressureScore`
- `zeroDteSharePct`, `gammaExposureProxy`, `sameDayExpiryVolume`
- Similarly named 0DTE/GEX keys (validator pattern guard)

---

## 5. Formulas

**Index share of total (%):**

```
indexShareOfTotalPct = (indexOptionsContracts / totalOptionsContracts) × 100
```

**Daily change in index options contracts (%):**

```
indexOptionsDailyChangePct = ((indexOptionsContracts − priorSessionIndexOptionsContracts) / priorSessionIndexOptionsContracts) × 100
```

Reconciliation tolerance: **0.05** percentage points (`PCT_RECONCILIATION_TOLERANCE` in library).

---

## 6. Validation rules (summary)

Implemented in `validateOptionsActivityProxyArtifact(raw, { mode: 'example' | 'production', referenceAsOf? })`:

- Plain object; version/signal/frequency/observation/series locks
- Example mode: `designOnly === true`; production mode rejects `designOnly`
- Valid ISO `asOf` / `publishedAt`; `publishedAt >= asOf`
- `source.name` + `source.url`; non-empty `caveats`
- `dataQuality` ∈ known manual qualities
- `observations.mappingStatus === "not_final"`
- Contract counts: finite non-negative **integers**; index ≤ total
- `putCallRatio > 0` if present
- Share and daily-change % reconcile when inputs present
- Forbid score fields and 0DTE/GEX fields

**Not registered** in `scripts/ghostflow/validate-artifacts.ts` or `ghostflow:check` in v1.4c.

---

## 7. Forbidden fields / forbidden claims

Do **not** claim or store:

- Same-day (0DTE) expiry share
- Dealer gamma, GEX, charm, or hedging pressure
- Intraday or sub-daily refresh in v1.4c
- Research Composite membership or `mappedPressureScore` / `candidatePressureScore`
- Replacement of `optionsVolatilityAmplifier` (VIX level, separate concept)

---

## 8. Caveats (product)

- Aggregate **cleared** OCC volume — not exchange-matched only, not open interest
- **Structural / activity context** — not a trade signal
- Distinct from CBOE VIX-based vol amplifier (20% passive slot)
- Example JSON uses v1.4b spike-aligned illustrative counts — **not** operator-verified production
- OCC site may block automated download; manual Volume Download in v1.4d

---

## 9. v1.4d promotion checklist (complete)

- [x] Official OCC Daily Volume Statistics CSV downloaded (`marketdata.theocc.com/daily-volume-statistics?reportDate=YYYYMMDD&format=csv`)
- [x] Preflight: `npm run ghostflow:options-data-spike -- --occ-daily tmp/options-spike/occ-volume-download-2026-05-22.csv --occ-daily tmp/options-spike/occ-volume-download-2026-05-21.csv`
- [x] Production `optionsActivityProxy.v1.json` — `indexOptionsContracts` = OCC **Index/Others** column (not illustrative v1.4b fixture)
- [x] `validate-artifacts` + `buildSnapshot` display merge; `odte-options` suppressed when card valid
- [x] `publicSignalCount` **10**; **no** `publicPassiveInputKey`

---

## 10. v1.4e — calibration / mapping

- Display-only default (mirror CFTC / levered / retirement)
- `mappingStatus` stays `not_final` until explicit mapping decision memo
- No MOCK score replacement without product approval

---

## 11. v1.4f — score gate (discouraged)

Wiring into Passive Pressure overlaps narratively with **`optionsVolatilityAmplifier`** (VIX / vol level at 20%). **Discouraged** unless product explicitly replaces or reallocates that slot.

---

## 12. Not implemented in v1.4c

| Item | Status |
|------|--------|
| Production `optionsActivityProxy.v1.json` | **No** |
| Display card / `components/ghostflow/*` | **No** |
| `buildSnapshot` merge | **No** |
| `signalPresentation` entry | **No** |
| `validate-artifacts.ts` registration | **No** |
| Example in `ghostflow:check` artifact list | **No** |
| Score wiring / `scoring.ts` | **No** |
| `publicPassiveInputKey` | **No** |
| Runtime/live dashboard fetch | **No** |
| `mockGhostflowSnapshot` changes | **No** |

---

## 13. Related docs

- [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md)
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) §E, v1.4c–f ladder
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — future OCC daily refresh (v1.4d+)
