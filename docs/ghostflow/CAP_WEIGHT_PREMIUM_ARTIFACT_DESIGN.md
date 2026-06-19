# Cap-Weight Premium Proxy — Artifact Design (GhostFlow v1.9b.2)

**Status:** **v1.9b.5 complete** · **v1.9b.4 complete** — design memo + example JSON + validator/types + tests + production JSON + display card + mapping decision. **Not** scored. No `publicPassiveInputKey` or score wiring.

**Mapping decision:** [CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) (v1.9b.5) — display-only by default; `mappingStatus` **not_final**; v1.9b.6 not approved.

**Prior work:** [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) (v1.9b, **YELLOW leaning GREEN**) · [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) (v1.9b.1a, real operator run exit **0**)

**Research module:** [`capWeightPremiumHistory.ts`](../lib/ghostflow/research/capWeightPremiumHistory.ts) · **Study script:** [`cap-weight-premium-study.ts`](../scripts/ghostflow/cap-weight-premium-study.ts) — research only; not in `ghostflow:check`

**Shipped files (v1.9b.3 / v1.9b.4):**

- Example: [`capWeightPremiumProxy.v1.example.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json) (`designOnly: true`, `dataQuality: manual_unverified`)
- Production: [`capWeightPremiumProxy.v1.json`](../data/ghostflow/artifacts/capWeightPremiumProxy.v1.json) — reference-aligned **2026-05-22** v1.9b.4a study; `publishedAt` **2026-06-17**
- Library: [`capWeightPremiumProxy.ts`](../lib/ghostflow/artifacts/capWeightPremiumProxy.ts) — validator, loader, formatters, freshness, `buildSnapshot` display merge
- Tests: [`capWeightPremiumProxy.test.ts`](../lib/ghostflow/__tests__/capWeightPremiumProxy.test.ts) · [`capWeightPremiumDisplay.test.ts`](../lib/ghostflow/__tests__/capWeightPremiumDisplay.test.ts)

GhostRegime, GhostYield, Models, and builder are out of scope.

---

## Status

| Item | v1.9b.2 / v1.9b.3 posture |
|------|---------------------------|
| Document type | Artifact design memo (v1.9b.2) + example/validator scaffolding (v1.9b.3) |
| Score changes | **None** — Composite **62** · Passive **58** · Structural **66** unchanged |
| Example artifact JSON | **Shipped (v1.9b.3)** — `designOnly: true`; not in `validate-artifacts` |
| Production artifact JSON | **Shipped (v1.9b.4)** — reference-aligned **2026-05-22** study; in `validate-artifacts` |
| UI / components | **Shipped (v1.9b.4)** — display-only card `cap-weight-premium` |
| `buildSnapshot` merge | **Shipped (v1.9b.4)** — display-only; no score merge |
| `publicSignalCount` | **12** (equity) — v1.9b.4 display card added (**11 → 12**) |
| **v1.9b.4** | **Done** — production JSON + display integration; not scored |
| **v1.9b.5** | **Done** — [CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md); display-only Option A; `mappingStatus` **not_final** |
| **v1.9b.6** | **Future** — score gate discouraged / **not approved** |

---

## 1. Purpose

Design a **future display-only** artifact and dashboard card that measures whether **capitalization-weighted** S&P 500 exposure (SPY proxy) is **outperforming equal-weighted** exposure (RSP proxy) on the same broad universe.

This artifact represents the **performance effect of the weighting rule** — a return spread and ratio lens — not passive-flow causality, not a trading signal, and not an AI-bubble narrative score.

**It is not:**

- A replacement for the score-fed `concentration` card (`indexConcentration` — top-10 index weight **level**)
- A “passive-flow premium” proof
- Investment advice or allocation guidance
- A 0–100 Research Composite sub-input (unless a future product gate explicitly approves otherwise — discouraged)

**v1.9b.2 does not** replace MOCK inputs, add `mappedPressureScore`, wire into scoring, or change `publicSignalCount`.

---

## 2. Relationship to existing `concentration`

| Lens | Signal / card id | Question | Unit | Cadence | Score role |
|------|------------------|----------|------|---------|------------|
| **Existing `concentration`** | `concentration` | How concentrated is the index? | Top-10 index weight **%** | Monthly (SSGA SPY fact sheet) | **Score-fed** — Structural Fragility **20%** via `indexConcentration` |
| **Future Cap-Weight Premium** | `cap-weight-premium` (card) / `cap-weight-premium-proxy` (artifact) | Is cap-weighted exposure outperforming equal-weighted exposure? | Return **spread** + price **ratio** | Weekly/monthly manual refresh | **Display-only by default** |

**Boundary locks:**

- **Do not** reuse signal id `concentration`.
- **Do not** merge into `indexConcentration` or change [scoring.ts](../lib/ghostflow/scoring.ts) weights.
- **Companion, not replacement** — weight level and return premium answer different questions.

### Cross-artifact context (no score merge)

| Artifact | Relationship |
|----------|--------------|
| **`breadth`** | May contextualize short-horizon reversals (participation vs cap-weight leadership); context only |
| **`passive-share`** | ICI index asset share — different construct; no score merge |
| **Treasury lane** | Separate 2-card display-only section; outside `publicSignalCount` |

---

## 3. Naming decision

| Item | Locked value |
|------|--------------|
| **User-facing card title** | **Cap-Weight Premium Proxy** |
| **Artifact `signalId`** | `cap-weight-premium-proxy` |
| **Dashboard card id** | `cap-weight-premium` |
| **Production artifact file** | `data/ghostflow/artifacts/capWeightPremiumProxy.v1.json` |
| **Example artifact file** | `data/ghostflow/artifacts/capWeightPremiumProxy.v1.example.json` |
| **`observationType`** | `spy_rsp_cap_weight_premium_snapshot` |
| **`seriesDefinition`** | `spy_rsp_adj_close_cap_weight_premium_v1` |
| **`updateFrequency`** | `weekly` (design default; operator may refresh monthly) |

### Forbidden naming / framing

- **Do not** reuse `concentration` as signal id or primary title.
- **Do not** call it **“passive-flow premium”** unless caveats make clear it is a SPY/RSP proxy, not causal proof.
- **Do not** imply causality (“passive flows caused outperformance”).
- **Do not** frame as **“AI bubble”** or mega-cap hype score.
- **Do not** use **“signal”** language that implies trading advice.

### Rejected candidates

| Candidate | Reason |
|-----------|--------|
| `cap-weight-concentration-premium` | Collides semantically with `concentration` |
| `cap-weight-vs-equal-weight` | Breaks `-proxy` artifact naming convention |
| **SPY / RSP Premium** (primary title) | Too ticker-specific; use in `source.note` / methodology |
| `cap-weight-premium` as artifact `signalId` | Acceptable but less consistent than `-proxy` suffix used by peers |

**“Proxy” placement:** Include **Proxy** in the card title and repeat in `caveats` / `source.note` (per [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) honesty pattern).

---

## 4. Source / refresh policy

### Primary path

| Item | Detail |
|------|--------|
| **Input** | Operator-downloaded SPY + RSP **adjusted-close** CSVs (`Date` + `Adj Close` preferred) |
| **Study script** | `npm run ghostflow:cap-weight-premium-study` — operator CSVs only; **not** in `ghostflow:check` |
| **Optional output** | Local study JSON via `--out` — **not committed** unless separately approved |
| **Refresh cadence** | Weekly or monthly manual operator refresh — **not** daily runtime dashboard fetch |
| **Committed files** | **No** SPY/RSP CSVs; **no** generated study JSON in repo |

### Source risks and locks

| Risk | Policy |
|------|--------|
| **Yahoo v8 chart API** | Used for v1.9b.1a operator calibration only — **not** a production runtime feed |
| **Stooq direct automated fetch** | Failed (browser verification gate); manual Stooq download optional second-source cross-check |
| **Adjusted-close requirement** | Required for production-quality artifact; close-only CSVs yield study exit code **2** — do not ship production artifact without adjusted-close or explicit downgrade + warning |
| **Second-source cross-check** | Recommended before production artifact (`verified_manual` promotion) |

### Future operator workflow (v1.9b.4+)

1. Download SPY/RSP adj-close CSVs locally
2. Run `npm run ghostflow:cap-weight-premium-study` → review stdout / optional `--out` JSON
3. Transcribe or script-fill artifact fields (v1.9b.3+)
4. Validate artifact (v1.9b.3+)
5. Commit **artifact JSON only** — never vendor CSVs

---

## 5. Artifact schema (future — do not create in v1.9b.2)

Field names align with research output in [`capWeightPremiumHistory.ts`](../lib/ghostflow/research/capWeightPremiumHistory.ts) (`CapWeightPremiumStudySummary`) for v1.9b.3 handoff.

### Top-level

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `artifactVersion` | `"1"` | yes | |
| `signalId` | `"cap-weight-premium-proxy"` | yes | |
| `designOnly` | `true` | example only | Required in v1.9b.3 example; forbidden in production |
| `asOf` | ISO date | yes | Latest aligned price date |
| `publishedAt` | ISO date | yes | Operator publish date; `>= asOf` |
| `source` | object | yes | See §5.1 |
| `observationType` | `"spy_rsp_cap_weight_premium_snapshot"` | yes | |
| `seriesDefinition` | `"spy_rsp_adj_close_cap_weight_premium_v1"` | yes | |
| `updateFrequency` | `"weekly"` | yes | |
| `dataQuality` | `verified_manual` \| `manual_unverified` | yes | Initial production likely **`manual_unverified`** |
| `caveats` | `string[]` | yes | Non-empty |
| `methodology` | object | recommended | Calculation block |
| `observations` | object | yes | See §5.2 |

### 5.1 `source` block

| Field | Notes |
|-------|-------|
| `name` | e.g. `"SPY + RSP adjusted-close CSV (operator download)"` |
| `operatorSource` | Preferred when no stable public CSV endpoint (Yahoo/Stooq/manual fund page) |
| `retrievedAt` | ISO datetime of operator CSV pull |
| `method` | `"operator_csv_adj_close"` |
| `note` | Must state: display-only; not runtime feed; SPY/RSP proxy; not causal; companion to `concentration` |

**Do not** encode Yahoo v8 chart API as a production `url`.

### 5.2 `observations` block

Design reference values from v1.9b.1a calibration (2026-06-15):

| Field | Design reference | Rule |
|-------|------------------|------|
| `latestDate` | `2026-06-15` | ISO date |
| `spyAdjustedClose` | `754.83` | finite > 0 |
| `rspAdjustedClose` | `212.88` | finite > 0 |
| `spyRspRatio` | `3.5458` | `spy / rsp` |
| `ratioPercentile` | `98.8` | 0–100 historical percentile context |
| `spread1M` | `-3.64` | % total return spread, window 21d |
| `spread1MPercentile` | `1.9` | |
| `spread3M` | `+3.47` | window 63d |
| `spread3MPercentile` | `91.3` | |
| `spread6M` | `-0.08` | window 126d |
| `spread6MPercentile` | `49.0` | |
| `spread1Y` | `+5.89` | window 252d |
| `spread1YAnnualized` | `+5.88` | |
| `spread1YPercentile` | `86.4` | |
| `spread3Y` | `+28.86` | window 756d |
| `spread3YAnnualized` | `+6.81` | |
| `spread3YPercentile` | `96.5` | |
| `spread5Y` | `+39.51` | window 1260d |
| `spread5YAnnualized` | `+5.15` | |
| `spread5YPercentile` | `99.6` | |
| `spyCurrentDrawdown` | `-0.62` | % |
| `rspCurrentDrawdown` | `0` | % |
| `drawdownDivergence` | `-0.62` | SPY current DD − RSP current DD |
| `alignedObservationCount` | `5818` | int |
| `overlapStart` | `2003-05-01` | |
| `overlapEnd` | `2026-06-15` | |
| `priceColumnUsed` | `{ spy: "adjusted", rsp: "adjusted" }` | Required honesty field |
| `mappingStatus` | `"not_final"` | **Only** allowed value until separate mapping decision |

### 5.3 `methodology` block (recommended)

| Item | Rule |
|------|------|
| Input | Operator-provided SPY + RSP CSV (`Date` + `Adj Close` preferred) |
| Alignment | Inner-join on common dates; **no forward fill** |
| Spread | SPY total return − RSP total return over rolling windows (same as study script) |
| Percentiles | Versus aligned history since overlap start |
| Causality | **No** causal attribution |
| Score mapping | **No** 0–100 mapper in v1.9b.2 or by default |

### `dataQuality` posture

| Stage | Value |
|-------|-------|
| First production ship (v1.9b.4) | Likely **`manual_unverified`** |
| Promotion to `verified_manual` | Requires reproducible operator workflow + optional second-source cross-check — **separate review** |

### `mappingStatus` posture

- **`not_final`** — v1.9b.5 mapping decision complete ([memo](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md)); display-only by default persists; no final mapper selected.

---

## 6. Validation rules (future v1.9b.3 summary)

Planned validator in `lib/ghostflow/artifacts/capWeightPremiumProxy.ts` (not implemented in v1.9b.2):

| Rule | Detail |
|------|--------|
| Mode `example` | `designOnly === true` |
| Mode `production` | `designOnly === true` fails |
| Identity | `artifactVersion`, `signalId`, `updateFrequency`, `observationType`, `seriesDefinition` locked |
| Dates | Valid ISO; `publishedAt >= asOf` |
| Source | Non-empty `source.name`; `operatorSource` or honest `note` when no stable `url` |
| Caveats | Non-empty array |
| Prices / ratio | Finite, positive where required; ratio reconciles within tolerance |
| Percentiles | 0–100 if present |
| Spreads | Finite; window fields consistent with study script definitions |
| Mapping | `observations.mappingStatus === "not_final"` |
| Forbidden fields | Reject score / gate fields (§7) |

**Not registered** in `validate-artifacts.ts` or `ghostflow:check` until v1.9b.4+.

---

## 7. Forbidden fields and claims

### Forbidden JSON keys (validator must reject)

- `mappedPressureScore`, `candidatePressureScore`, `basketScore`
- `publicPassiveInputKey`
- Any composite sub-score input field
- Unlabeled `numericValue` presented as a 0–100 model score

Percentiles may appear only as **historical percentile context** (e.g. `spread5YPercentile`, `ratioPercentile`) — never styled or labeled as a Research Composite score.

### Forbidden product claims

- Passive flows **caused** cap-weight outperformance
- AI-bubble or narrative-only hype framing
- Trading signal or allocation recommendation
- Replacement for `indexConcentration` / `concentration`
- Research Composite membership without explicit score gate approval

---

## 8. Future card display design (not implemented in v1.9b.2)

### Headline

| Item | Value |
|------|-------|
| **Primary headline** | **5Y spread percentile: `99.6`** |
| **Label** | **5Y premium percentile** — explicitly **not** a score |
| **Rationale** | Directly answers “is cap-weight outperforming equal-weight?” over a meaningful horizon; ratio percentile is level-based and can drift without recent outperformance |

### Supporting values

| Field | Calibration reference (2026-06-15) |
|-------|-------------------------------------|
| SPY/RSP ratio | `3.5458` |
| Ratio percentile | `98.8` |
| 1M spread | `-3.64%` (1.9th percentile) |
| 1Y spread | `+5.89%` (86.4th percentile) |
| 3Y spread | `+28.86%` (96.5th percentile) |
| 5Y spread | `+39.51%` (99.6th percentile) |

### Required copy

| Element | Text |
|---------|------|
| Status phrase | *Long-horizon cap-weight premium elevated; short horizons regime-dependent.* |
| Caveat line | *SPY/RSP proxy; measures weighting-rule return effect, not passive-flow causality; not a trading signal.* |
| Badge | **DISPLAY ONLY** |
| Color band | **None** that implies model scoring; if percentile coloring is used later, label as “historical percentile context” only |

### Cross-link (copy only)

Reference existing `concentration` card as **companion lens, not replacement**.

---

## 9. Display policy

| Rule | v1.9b.2 lock |
|------|--------------|
| Research Composite | **No impact** — Composite **62** unchanged |
| Passive Pressure | **No impact** — **58** unchanged |
| Structural Fragility | **No impact** — **66** unchanged |
| `buildSnapshot` merge | **None** in v1.9b.2 |
| `publicPassiveInputKey` | **None** |
| Score gates | **None opened** |
| Model bands / tripwires | **None** |
| Trading advice | **Forbidden** |
| Causality claims | **Forbidden** |

### `publicSignalCount`

| Phase | Count |
|-------|-------|
| **v1.9b.2 (now)** | **10** — unchanged |
| **If later shipped** as equity public display-only card (v1.9b.4+) | Likely **10 → 11** (6 score-fed + 5 display-only) |
| **Approval** | Future count change requires **separate product approval** — document in mapping decision and [GHOSTFLOW_CURRENT_STATE.md](./GHOSTFLOW_CURRENT_STATE.md) |
| **Treasury** | **2** cards — separate lane; outside `publicSignalCount`, `buildSnapshot`, `PUBLIC_ARTIFACT_SIGNAL_IDS` |

---

## 10. Mapping / score policy

| Item | Posture |
|------|---------|
| Final 0–100 mapper | **None selected** |
| `mappingStatus` | **`not_final`** — display-only default likely persists through v1.9b.5 |
| `basketScore` | **Forbidden** |
| `numericValue` as score | **Forbidden** unless explicitly labeled as percentile context |
| `publicPassiveInputKey` | **Forbidden** |
| Score-impact preview | **Forbidden** in design memo |
| MOCK inputs | **62 / 58 / 55** unchanged |
| Future mapping decision (v1.9b.5) | Likely **display-only Option A** (mirror [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md)) |
| Score wiring (v1.9b.6) | **Discouraged by default** — only with explicit product approval after mapping decision |

---

## 11. Future implementation ladder

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **v1.9b.2** | Artifact design memo — **this document** | **Done** (docs-only) |
| **v1.9b.3** | Example JSON + `capWeightPremiumProxy.ts` validator/types + tests; **no production JSON** | **Done** |
| **v1.9b.4** | Production `capWeightPremiumProxy.v1.json` + `validate-artifacts` + `buildSnapshot` display-only merge + card id in `signalPresentation` + DISPLAY ONLY badge | **Done** |
| **v1.9b.5** | `CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md` — display-only Option A | **Done** |
| **v1.9b.6** | Score gate (if ever) — **discouraged** | **Future** — not approved |

**Do not combine v1.9b.3 and v1.9b.4** in one PR unless product explicitly approves accelerated promotion. Calibration short-horizon mixedness (1M at 1.9th percentile vs 5Y at 99.6th) warrants staged review.

**Parallel track:** **v1.9c** passive supply / float absorption feasibility can proceed independently if product prioritizes supply-side research.

---

## 12. Promotion checklist

- [x] Design memo (this document) — v1.9b.2
- [x] Example JSON `capWeightPremiumProxy.v1.example.json` — v1.9b.3
- [x] Pure module `capWeightPremiumProxy.ts` + unit tests — v1.9b.3
- [x] Production `capWeightPremiumProxy.v1.json` — v1.9b.4
- [x] `scripts/ghostflow/validate-artifacts.ts` registration — v1.9b.4
- [x] `buildSnapshot` display-only merge — v1.9b.4
- [x] `signalPresentation` card id + DISPLAY ONLY badge — v1.9b.4
- [x] Freshness helper — v1.9b.4
- [x] [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) operator row — v1.9b.4
- [x] Mapping decision memo — v1.9b.5
- [ ] Score merge / score gate — v1.9b.6 (discouraged)

---

## 13. Not implemented (post v1.9b.3)

| Item | Status |
|------|--------|
| Production `capWeightPremiumProxy.v1.json` | **Yes (v1.9b.4)** — reference-aligned **2026-05-22** study |
| Example `capWeightPremiumProxy.v1.example.json` | **Yes (v1.9b.3)** — `designOnly: true`; unit tests only |
| `loadCapWeightPremiumProxyArtifact()` | **Yes (v1.9b.4)** |
| `validate-artifacts.ts` registration | **Yes (v1.9b.4)** |
| Display card / `components/ghostflow/*` | **Yes (v1.9b.4)** — `cap-weight-premium` display-only card |
| `buildSnapshot` merge | **Display-only (v1.9b.4)** — no score contribution |
| `signalPresentation` entry | **Yes (v1.9b.4)** |
| Score wiring / `scoring.ts` | **No** — [v1.9b.5 mapping](./CAP_WEIGHT_PREMIUM_MAPPING_DECISION.md) display-only by default |
| `publicPassiveInputKey` | **No** |
| Runtime/live dashboard fetch | **No** |
| `mockGhostflowSnapshot` changes | **No** |
| `publicSignalCount` change | **Yes (v1.9b.4)** — **11 → 12** (display-only card only); current **12** per [inventory memo](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) |

> **Current-state footnote (v1.9d):** Production display card exists; mapping decision keeps cap-weight premium **display-only**. No score path. Treasury remains separate (**2** cards outside equity count).

---

## 14. Related documents

- [CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md](./CAP_WEIGHT_CONCENTRATION_PREMIUM_FEASIBILITY.md) — v1.9b feasibility (YELLOW leaning GREEN)
- [CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md](./CAP_WEIGHT_PREMIUM_CALIBRATION_STUDY.md) — v1.9b.1a real operator run (exit **0**; adj-close; 5,818 aligned days)
- [PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) — v1.9a research queue
- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase ladder
- [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) — parallel display-only design pattern
- [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) — parallel design + staged promotion pattern
- [INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md](./INDEX_CONCENTRATION_ARTIFACT_RUNBOOK.md) — existing score-fed `concentration` artifact

---

## Guardrails (v1.9b.2)

- Artifact design memo only — no implementation
- Composite **62 / 58 / 66** unchanged
- `publicSignalCount` **12** (equity) — v1.9b.4 display card; see [inventory memo](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md)
- Treasury **2**-card lane unchanged
- No score gates opened
- GhostRegime out of scope
