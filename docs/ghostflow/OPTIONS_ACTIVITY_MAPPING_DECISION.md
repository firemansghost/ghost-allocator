# Options Activity Mapping Decision (GhostFlow v1.4e)

**Status:** Decision record only — **no implementation** in v1.4e (no score wiring, no runtime changes, no artifact, UI, or code edits).  
**Effective:** 2026-06-03  
**Related:** [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md) · [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) · [DATA_ROADMAP.md](./DATA_ROADMAP.md)

This memo formalizes the **v1.4e mapping/product decision** for the OCC-based **Index Options Intensity Proxy** (`options-activity-proxy`). A optional historical calibration study (**v1.4e-calibration**, research-only) may follow later for display context only; it is **not required** for this decision and does **not** solve VIX overlap or 0DTE/GEX semantics.

---

## 1. Status

| Item | v1.4e posture |
|------|----------------|
| Document type | **Mapping / product decision only** |
| Code changes | **None** |
| Artifact JSON changes | **None** |
| UI / `buildSnapshot` changes | **None** |
| Score changes | **None** |
| Selected mapper | **None** — Option **A** (display-only) |
| `mappingStatus` | Remains **`not_final`** |
| **v1.4f** score wiring | **Not approved**; **discouraged** by default |

---

## 2. Background

| Phase | Outcome |
|-------|---------|
| **v1.4a** | Feasibility — [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) (**YELLOW** leaning RED for true 0DTE/GEX; **YELLOW** for aggregate display-only proxy) |
| **v1.4b** | Source spike — `npm run ghostflow:options-data-spike`; Outcome A **FAIL** (no public 0DTE column lock); Outcome B **PASS** (OCC aggregate fields); Cboe SPX ADV supplementary only |
| **v1.4c** | Artifact design — [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md); example JSON + validator; no production artifact |
| **v1.4d** | Production [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json) + display-only card; **official OCC CSV preflight** (`marketdata.theocc.com/daily-volume-statistics`, sessions **2026-05-22** / **2026-05-21**); `publicSignalCount` **10**; `odte-options` placeholder suppressed when artifact validates |

The Research Composite still uses **VIX** for the only score-fed options/vol slot (`optionsVolatilityAmplifier`). The OCC activity artifact does **not** feed `lib/ghostflow/scoring.ts`.

---

## 3. Current artifact and display card

### Production artifact

**File:** [`data/ghostflow/artifacts/optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json)

| Field | Value |
|-------|--------|
| `signalId` | `options-activity-proxy` |
| `asOf` / `publishedAt` | **2026-05-22** |
| `dataQuality` | **manual_unverified** |
| `indexOptionsContracts` | **5,741,700** (OCC **Index/Others** column) |
| `totalOptionsContracts` | **76,337,620** (OCC Total) |
| `equityOptionsContracts` | **70,421,595** |
| `indexShareOfTotalPct` | **7.52%** |
| `priorSessionIndexOptionsContracts` | **6,047,810** (prior session **2026-05-21**) |
| `indexOptionsDailyChangePct` | **-5.06%** |
| `mappingStatus` | **`not_final`** |
| `putCallRatio` / ETF split | **Not present** in official daily-volume-statistics CSV |

No `designOnly`, no `mappedPressureScore`, no `candidatePressureScore`.

### Display card (v1.4d)

| Item | Value |
|------|--------|
| Signal id | `options-activity-proxy` |
| Title | **Index Options Intensity Proxy** |
| Display value | **Index 5.7M contracts · 7.5% of total** |
| Badge | **DISPLAY ONLY** |
| `dataStatus` | `public_proxy` |
| `updateFrequencyTarget` | Daily (manual artifact) |
| Research Composite | **Not included** |
| `publicSignalCount` | **10** |
| Placeholder cards | **0** when artifact validates (`odte-options` suppressed) |

Display wiring: `applyOptionsActivityDisplayArtifact` in `buildSnapshot.ts` (v1.4d). No `publicPassiveInputKey` for options activity.

---

## 4. Current score context (unchanged in v1.4e)

| Input / output | Value |
|----------------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |
| **`optionsVolatilityAmplifier`** | **PUBLIC** — CBOE VIX close via `volatilityRegime` artifact → 0–100 mapper; **20%** of Passive Pressure |
| **`options-activity-proxy`** | **Display only** — no passive sub-input key |
| MOCK passive inputs (unchanged) | `systematicStrategyPressure` **62**, `retirementFlowPressureProxy` **58**, `leveredEtfRebalancePressure` **55** |

Passive weights in `lib/ghostflow/scoring.ts` (unchanged): 25% ETF flow, 20% systematic, **20% options/vol (VIX)**, 20% retirement, 15% levered — **five** slots totaling 100%. There is **no** sixth passive weight and **no** natural replacement target for options activity without editing `scoring.ts`. The former `odte-options` signal was a **placeholder card only**; it was never a composite sub-input.

**v1.4e score impact:** **Zero.**

---

## 5. Decision (v1.4e)

| Item | Decision |
|------|----------|
| **Selected option** | **A — Stay display-only** |
| **Final 0–100 mapper** | **None selected** |
| **`mappingStatus`** | Remains **`not_final`** |
| **Composite input** | **No** — do not wire OCC activity into Passive Pressure |
| **`optionsVolatilityAmplifier`** | **Unchanged** — remains VIX-based |
| **v1.4f score wiring** | **Blocked / discouraged** without explicit product approval |

---

## 6. Mapping options considered (not adopted)

| ID | Idea | Assessment |
|----|------|------------|
| **A** | **Display-only** — card shows contracts, share %, session change in explanation; no score mapper | **Selected** |
| **B** | Historical percentile of `indexShareOfTotalPct` (current **7.52%**) | Deferred — needs daily OCC history; measures activity **share**, not pressure; does not fix VIX overlap |
| **C** | Historical percentile of raw `indexOptionsContracts` | **Reject** for score — secular growth in options volume; Index/Others definition not stable as “pressure” |
| **D** | Historical percentile of `indexOptionsDailyChangePct` (current **-5.06%**) | **Reject** for score — noisy session-to-session; poor structural signal |
| **E** | Blended mapper (share + daily change → 0–100) | **Reject** — arbitrary blend; high fake-precision risk |
| **F** | **VIX-adjacent overlay** — display card only; VIX remains sole scored options/vol input | **Supported** (equivalent to A) |
| **G** | Replace or split **`optionsVolatilityAmplifier`** weight with OCC-based mapper | **Not recommended** — drops verified vol **level** for activity volume; major product + methodology change |

---

## 7. VIX overlap / double-counting

| Dimension | VIX (`optionsVolatilityAmplifier` / `vol-regime`) | OCC (`options-activity-proxy`) |
|-----------|--------------------------------------------------|--------------------------------|
| Quantity | Implied volatility **level** (CBOE VIX close) | Cleared **contract activity** (Index/Others share of OCC total) |
| Passive weight | **20%** (score-fed) | **0%** (display-only) |
| User narrative | “Options / volatility stress” | “Options market activity / index intensity” |

Both signals sit in the broad **“options”** narrative bucket. Scoring **both** without reweighting would:

1. **Confuse users** — two “options” inputs in one passive pillar with different meanings.  
2. **Risk double-counting** — narratively treating vol level and contract activity as independent stress gauges.  
3. **Mis-rank precision** — the OCC series does not measure implied vol, gamma, or hedging pressure.

**Replacing VIX (Option G)** would remove a cleaner, already-scored volatility signal in favor of an activity proxy — **not recommended**.

---

## 8. Semantic concerns

The OCC-based card is useful **context** but must not be promoted to composite telemetry:

| Concern | Clarification |
|---------|----------------|
| **Not 0DTE** | Index/Others cleared volume ≠ same-day expiry share; true 0DTE/GEX requires paid/vendor provenance |
| **Not gamma / GEX** | No dealer positioning or hedging-pressure field in public OCC daily statistics |
| **Not intraday** | Daily OCC release; manual artifact refresh |
| **Not directional pressure** | High volume can reflect liquidity, rolls, hedging, or benign participation |
| **Not vol level** | Distinct from VIX-based `optionsVolatilityAmplifier` |
| **Label discipline** | Keep **Index Options Intensity Proxy** — do not relabel as “0DTE / Options Pressure” or “Gamma Pressure” |

---

## 9. Calibration (optional future work)

| Question | Answer |
|----------|--------|
| OCC history repeatable? | **Yes** — same `daily-volume-statistics?reportDate=YYYYMMDD&format=csv` endpoint used in v1.4d; spike parses session rows from monthly CSV |
| Worth doing for v1.4e? | **No** — decision does not require percentiles |
| Would percentiles fix semantics? | **No** — historical rank of share or contracts does not make activity = vol level or gamma |
| Future **v1.4e-calibration** | Optional research-only script + study memo (e.g. Index/Others share percentiles for **display** context on card or docs) |
| Guardrail | Any history script must be **research-only**, excluded from `ghostflow:check`, and must **not** write `mappedPressureScore` or merge into `buildSnapshot` |

---

## 10. Score-impact preview (conceptual — if wiring were ever reconsidered)

Passive formula (unchanged):  
`Passive = clamp(0.25·E + 0.20·S + 0.20·O + 0.20·R + 0.15·L)`  
`Composite = clamp(0.5·Passive + 0.5·Structural)`

With current snapshot peers fixed, **O** ≈ VIX-mapped (~**34** at reference VIX 16.7). Illustrative **replacement** of O only (Option G — **not approved**):

| Hypothetical mapper on 7.52% share | O | ΔPassive (approx) | ΔComposite (approx) |
|-----------------------------------|---|-------------------|---------------------|
| Linear ×10 → 75 | 75 | +8 | +4 |
| Linear ×5 → 38 | 38 | +1 | +0.5 |
| **v1.4e actual** | VIX ~34 | **0** | **0** |

Adding a **sixth** passive input would require rebalancing all weights in `scoring.ts` — out of scope and not recommended.

---

## 11. Future v1.4f gate (discouraged by default)

**v1.4f** must not proceed unless **all** of the following are satisfied:

1. **Explicit product approval** — written decision to change composite semantics.  
2. **Historical calibration study** — distribution of Index/Others share and/or contracts; score-impact tables.  
3. **Replacement vs reweight vs add** — decision on VIX slot (20% passive) vs new weight vs display-only forever.  
4. **Semantic rename review** — artifact/signal naming must not imply 0DTE, GEX, or “pressure” without provenance.  
5. **User-facing caveats** — methodology, score card badges, trust copy.  
6. **Tests and methodology updates** — `scoring.ts`, `buildSnapshot`, `ghostflowCurrentState`, UI.  

**Default recommendation:** **Do not proceed** with v1.4f — VIX overlap and semantic mismatch outweigh marginal composite benefit.

Until then: keep **`publicPassiveInputKey`** off options activity; do not set production `mappingStatus` to `final`; do not add `mappedPressureScore` to the artifact.

---

## 12. No-score-change confirmation (v1.4e)

The following were **not** modified in v1.4e:

| Area | Status |
|------|--------|
| `lib/ghostflow/scoring.ts` | Unchanged |
| `lib/ghostflow/buildSnapshot.ts` | Unchanged |
| `components/ghostflow/*` | Unchanged |
| `data/ghostflow/artifacts/optionsActivityProxy.v1.json` | Unchanged |
| `data/ghostflow/mockGhostflowSnapshot.ts` | Unchanged |
| `scripts/ghostflow/validate-artifacts.ts` | Unchanged |
| `package.json` / tests | Unchanged |
| GhostRegime / GhostYield / Models / builder | Unchanged |

| Metric | Value (unchanged) |
|--------|-------------------|
| Composite / Passive / Structural | **62 / 58 / 66** |
| `publicSignalCount` | **10** |
| Placeholder cards (valid artifact) | **0** |
| Display-only public artifacts | **4** (CFTC, levered ETF, retirement, options activity) |

---

## 13. References

- Artifact: [`optionsActivityProxy.v1.json`](../data/ghostflow/artifacts/optionsActivityProxy.v1.json)  
- Validator / display helpers: [`lib/ghostflow/artifacts/optionsActivityProxy.ts`](../lib/ghostflow/artifacts/optionsActivityProxy.ts)  
- Preflight: `npm run ghostflow:options-data-spike -- --occ-daily tmp/options-spike/occ-volume-download-2026-05-22.csv --occ-daily tmp/options-spike/occ-volume-download-2026-05-21.csv`  
- Design: [OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md](./OPTIONS_ACTIVITY_ARTIFACT_DESIGN.md)  
- Feasibility: [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md)
