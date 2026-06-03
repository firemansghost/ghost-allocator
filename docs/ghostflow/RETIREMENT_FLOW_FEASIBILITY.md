# Retirement Flow Pressure — Feasibility Memo (GhostFlow v1.2a)

**Status:** Research / feasibility only — no scoring, merge, artifact JSON, UI, or script changes.  
**Target (future):** A defensible public proxy for **recurring retirement-account equity demand pressure** (possibly **display-only** before any score use).  
**Related:** [DATA_ROADMAP.md](./DATA_ROADMAP.md) · [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) (v1.2b) · [LEVERED_ETF_REBALANCE_FEASIBILITY.md](./LEVERED_ETF_REBALANCE_FEASIBILITY.md) · [CFTC_TFF_FEASIBILITY.md](./CFTC_TFF_FEASIBILITY.md)

**Do not reopen:** CFTC **v1.0c** or levered ETF **v1.1f** score-wiring gates in this track.

---

## Feasibility rating: **YELLOW**

| Criterion | Assessment |
|-----------|------------|
| Recurring public source | **Partial** — ICI Retirement Market and Fed Z.1 offer **quarterly retirement assets**, not retirement-labeled weekly flow |
| Direct “flow pressure” | **Weak** — no clean public series for payroll-timed 401(k) contribution **flow** at GhostFlow cadence |
| Cadence fit | **Poor for score** — quarterly (best case) vs daily VIX / weekly ETF issuance |
| Overlap control | **Risky** if reusing general ICI equity **flows** already scored elsewhere |
| Manual artifact viability | **Feasible** for quarterly **structural** extract; not comparable to weekly ETF artifact |
| Mapping honesty | **Achievable** with heavy caveats; **v1.2e** → display-only default ([mapping decision](./RETIREMENT_FLOW_MAPPING_DECISION.md)) |

**Why not GREEN:** No stable, non-overlapping, retirement-specific **flow** series at operable weekly/daily cadence for a 20% passive sub-input.  
**Why not RED:** ICI Retirement Market and Financial Accounts provide citable **structural** proxies suitable for research and a possible **display-only** card.

---

## 1. Current state

| Item | Value |
|------|--------|
| Score sub-input key | `retirementFlowPressureProxy` |
| Status | **MOCK** — static **58** in [`mockGhostflowSnapshot.ts`](../data/ghostflow/mockGhostflowSnapshot.ts) |
| Passive pillar weight | **20%** in [`scoring.ts`](../lib/ghostflow/scoring.ts) |
| Composite sensitivity | ~**10%** of sub-input delta: `0.20 × 0.50 = 0.10` (e.g. retirement +10 → passive +2, composite +1) |
| `buildSnapshot` merge | **None** — no artifact loader; value always from mock snapshot |
| `publicPassiveInputKeys` | Does **not** include `retirementFlowPressureProxy` |

**Production research composite (with public artifacts merged, reference 2026-05-22):**

| Output | Value |
|--------|--------|
| Research Composite | **62** |
| Passive Pressure | **58** |
| Structural Fragility | **66** |
| Band | **Crowded / Reflexive** |

**Passive Pressure formula (unchanged):**

```
0.25 × etfFundFlowImpulse          (PUBLIC)
+ 0.20 × systematicStrategyPressure (MOCK 62; CFTC display-only separate)
+ 0.20 × optionsVolatilityAmplifier (PUBLIC)
+ 0.20 × retirementFlowPressureProxy (MOCK 58)
+ 0.15 × leveredEtfRebalancePressure (MOCK 55; levered display-only separate)
```

**Score-input mix (typical with artifacts):** 6 **PUBLIC** score sub-inputs · 1 **DERIVED** (`modelZoneProximity` from ICI) · 3 **MOCK** passive sub-inputs (systematic **62**, retirement **58**, levered **55**).

**Display-only public artifacts (not in composite):** CFTC `systematic-flow` ([`systematicFlowProxy.v1.json`](../data/ghostflow/artifacts/systematicFlowProxy.v1.json)); levered `levered-etf-rebalance` ([`leveredEtfRebalancePressure.v1.json`](../data/ghostflow/artifacts/leveredEtfRebalancePressure.v1.json)).

**UI touchpoints (unchanged by v1.2a):**

| Location | Copy |
|----------|------|
| [`GhostFlowScoreCard.tsx`](../components/ghostflow/GhostFlowScoreCard.tsx) | “Retirement-flow pressure proxy” — **MOCK** badge |
| [`GhostFlowMethodology.tsx`](../components/ghostflow/GhostFlowMethodology.tsx) | 20% retirement-flow pressure proxy |
| [`GhostFlowScoreDrivers.tsx`](../components/ghostflow/GhostFlowScoreDrivers.tsx) | Placeholder driver bullets |
| [`GhostFlowWatchlist.tsx`](../components/ghostflow/GhostFlowWatchlist.tsx) | “Retirement-flow pressure” watch item |

---

## 2. Concept definition

**GhostFlow meaning (proposed):** A proxy for **mechanical, recurring retirement-account buying pressure** into equities — especially:

- Payroll-driven **401(k)** deferrals and employer match  
- Auto-enrollment and default target-date / index fund allocation within DC plans  
- **IRA** contributions (with seasonal concentration around tax filing / year-end)  
- Steady allocation to equity funds inside retirement wrappers  

This is **not** a forecast of market returns, not a measure of household risk appetite broadly, and not issuer-reported “retirement flow” tape.

---

## 3. Boundary table (distinct neighbors)

| Neighbor | GhostFlow artifact / input | Why distinct |
|----------|---------------------------|--------------|
| ETF net issuance | `etfFundFlowImpulse` — weekly ICI domestic equity ETF estimated net issuance | **Vehicle** creation/redemption; not plan-level retirement channel |
| Active vs index flows | `activeShareOffsetProxy` — monthly ICI domestic equity active vs index **flows** | Style tilt within fund industry; not labeled retirement |
| Passive / index share | `passiveShareProxy` — monthly ICI **index asset share** | Stock of index-oriented assets; not contribution flow |
| Buybacks / corporate issuance | (not a GhostFlow input) | Corporate balance sheet |
| Pension fund rebalancing | Z.1 pension entitlements (lagged) | DB liabilities / entitlements — different channel |
| CFTC TFF positioning | Display-only `systematic-flow` | Futures positioning; separate v1.0 track |
| Levered ETF rebalance | Display-only `levered-etf-rebalance` | Mechanical levered ETF estimate; separate v1.1 track |
| General household equity allocation | Z.1 household assets (broad) | Too wide; overlaps multiple narratives |

---

## 4. Public source feasibility

| Source | What it offers | Cadence / lag | Flow-pressure fit | Overlap risk | Assessment |
|--------|----------------|---------------|-------------------|--------------|------------|
| **A. ICI Retirement Market** | Total retirement market assets; IRA; DC plan assets; 401(k)-type splits; target-date fund assets in retirement context | **Quarterly**; ~1–2 month publication lag | **Structural asset growth**, not weekly flow | Low vs ETF issuance; medium vs passive **stock** narrative | **Best primary candidate** |
| **B. ICI MF/ETF flows** (existing) | Weekly ETF domestic equity issuance; monthly active/index **flows** | Weekly / monthly | Direct **flow** but **not retirement-labeled** | **High** — already `etfFundFlowImpulse` + `activeShareOffsetProxy` | **Reject as retirement score input** |
| **C. Fed Z.1 / Financial Accounts** | Household retirement assets; pension entitlements; mutual fund shares in retirement accounts | **Quarterly**; revisions | Levels / slow-moving allocation | Thematic overlap with household equity exposure | **YELLOW** — cross-check / secondary |
| **D. DOL Form 5500** | Plan assets, contributions (annual filings) | **Annual**; long lag | Structural context only | None operational | **RED** for near-term pressure |
| **E. Recordkeeper reports** (Vanguard, Fidelity, Alight, PSCA, Morningstar snippets) | Occasional industry flow studies | Ad hoc / annual | Sometimes insightful | Unstable URLs; not manual-artifact friendly | **RED** for recurring artifact |
| **F. Seasonal payroll / IRA calendar** | Paydays, tax-day IRA, Dec contribution season | Calendar | Indirect timing context | None | **YELLOW/RED** for score — display footnote only |

**ICI Retirement Market (investigate for v1.2b):**  
https://www.ici.org/research/stats/retirement — quarterly tables on retirement market assets (exact table names to lock in v1.2b).

---

## 5. Candidate proxy options (A–F)

| ID | Design | Pros | Cons | Verdict |
|----|--------|------|------|---------|
| **A** | **Keep MOCK 58** | Honest; zero double-count | No measured proxy | **Default now** |
| **B** | **Quarterly retirement asset growth** (ICI or Z.1 QoQ/YoY) | Public, citable, quarterly manual refresh | **Not flow**; lag; weak “pressure” at weekly composite cadence | **Best structural candidate** if developed |
| **C** | **Target-date fund asset / flow** (ICI / Morningstar) | Closer to auto-pilot equity bid | Series often annual or buried; may collapse into B | **YELLOW** — v1.2b source spike |
| **D** | **Long-term equity fund flow** (reuse ICI equity flows) | Data already in operator workflow | **Double-counts** existing scored artifacts | **Reject** |
| **E** | **Seasonal index only** (payroll / IRA calendar) | Explains timing without new data | Fake precision if scored | **Reject for score**; optional display note |
| **F** | **Hybrid structural + seasonal** (B + E) | Richer narrative | Two arbitrary layers | **YELLOW** — display-only only |

---

## 6. Recommended path (v1.2a)

1. **Keep `retirementFlowPressureProxy` MOCK 58** in the research composite for v1.2a.
2. **Do not score** overlapping ICI weekly/monthly **equity flows** as “retirement pressure.”
3. **If a proxy is developed**, prefer **quarterly ICI Retirement Market asset growth** (optional Z.1 cross-check) as a **structural** series — label **“retirement plan asset growth proxy”**, not “weekly flow.”
4. **Preferred product shape:** **v1.2d display-only** public context card before any **v1.2f** score-wiring discussion (mirror CFTC / levered ETF).
5. **v1.2f** remains a **product-approved gate only** — feasibility does **not** endorse composite promotion.

---

## 7. Candidate future artifact schema outline (design only)

**v1.2b path:** [`data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json`](../data/ghostflow/artifacts/retirementFlowPressureProxy.v1.example.json) — **created** (`designOnly: true`); see [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md).

```json
{
  "artifactVersion": "1",
  "signalId": "retirement-flow-pressure-proxy",
  "asOf": "YYYY-MM-DD",
  "publishedAt": "YYYY-MM-DD",
  "updateFrequency": "quarterly",
  "dataQuality": "manual_unverified",
  "source": {
    "name": "ICI Retirement Market (or Fed Z.1 cross-check)",
    "url": "https://www.ici.org/research/stats/retirement",
    "note": "Manual extract: quarterly retirement market assets — structural, not contribution flow"
  },
  "observationType": "quarterly_retirement_market_snapshot",
  "seriesDefinition": "ici_retirement_market_quarterly_assets_v1",
  "observations": {
    "totalRetirementMarketAssetsTrillionsUsd": null,
    "iraAssetsTrillionsUsd": null,
    "definedContributionAssetsTrillionsUsd": null,
    "targetDateFundAssetsBillionsUsd": null,
    "quarterOverQuarterAssetGrowthPct": null,
    "yearOverYearAssetGrowthPct": null,
    "mappingStatus": "not_final"
  },
  "optionalObservations": {
    "privateSectorDcPlanAssetsTrillionsUsd": null,
    "contributionSeasonFlag": null
  },
  "caveats": [
    "Structural retirement assets — not measured payroll contribution flow",
    "Quarterly cadence — not comparable to weekly ETF issuance input"
  ]
}
```

**v1.2a rules:** `mappingStatus: not_final`; **no** `mappedPressureScore` field until **v1.2e** mapping decision.

---

## 8. Mapping and product concerns

| Concern | Implication |
|---------|-------------|
| **Cadence mismatch** | Quarterly (or annual) structural input vs daily/weekly peers misstates timeliness if scored at 20% passive weight |
| **Lag** | ICI / Fed releases lag quarter-end by weeks; “pressure” label overstates timeliness |
| **Double-counting** | General ICI equity **flows** collide with `etfFundFlowImpulse` and `activeShareOffsetProxy` |
| **Revisions** | ICI and Fed revise history — require `publishedAt`, `dataQuality`, refresh discipline |
| **Structural ≠ flow** | Asset levels and growth are **not** payroll flow pressure |
| **Display vs score** | Strong bias toward **display-only** card; composite promotion needs rename + overlap review + product sign-off |
| **Composite fit** | Open whether retirement belongs in the 10-input composite at all vs watchlist-only structural context |

**Score-wiring preview (if MOCK 58 were replaced at 20% passive, mapping unknown):**

- Passive delta ≈ `0.20 × (newScore − 58)`  
- Composite delta ≈ `0.10 × (newScore − 58)`  
- Example: mapped score **70** → passive **+2.4**, composite **+1.2** (band may unchanged)

Defer numeric claims until v1.2e picks mapping and a sample quarter.

---

## 9. Proposed phase ladder (v1.2 track)

| Phase | Deliverable | Score impact |
|-------|-------------|--------------|
| **v1.2a** | This feasibility memo + roadmap | **None** — **current** |
| **v1.2b** | Artifact design memo + example JSON + validator module + tests | **Done** — [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md); none |
| **v1.2c** | Production artifact candidate + `ghostflow:validate-artifacts` | **Done** — [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) §2; not scored |
| **v1.2d** | Display-only card + score-input decision memo (**recommended**) | None |
| **v1.2e** | Calibration / mapping decision (quarterly history) | **Done** — [RETIREMENT_FLOW_CALIBRATION_STUDY.md](./RETIREMENT_FLOW_CALIBRATION_STUDY.md) + [RETIREMENT_FLOW_MAPPING_DECISION.md](./RETIREMENT_FLOW_MAPPING_DECISION.md); display-only; MOCK **58** |
| **v1.2f** | Score-wiring gate (**if product-approved**) | Gated — **discouraged** without explicit overlap review |

**Parallel (unchanged):** **v1.0c** CFTC · **v1.1f** levered ETF — separate product gates.

**If v1.2b–c are skipped:** Keep MOCK **58**; watchlist note; revisit when ICI table extract is operator-validated.

---

## 10. Open questions (for v1.2c+)

1. ~~**Exact ICI table and rows**~~ **Resolved (v1.2c):** Table 1 in `ret_25_q4_data.xls` — see [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) §2.
2. **Z.1 line codes** — which Financial Accounts series best proxy retirement-account equity exposure without duplicating household-wide equity?
3. **Target-date fund data** — is ICI target-date fund assets (or flows) extractable quarterly, or annual only?
4. **Composite membership** — should retirement ever be a **scored** sub-input, or remain **display-only / watchlist** structural context?
5. **Naming** — if displayed, use “Retirement plan asset growth proxy” or similar; avoid implying measured weekly **flow**.

---

## 11. Not implemented in v1.2a

- No changes to `lib/ghostflow/scoring.ts`, `buildSnapshot.ts`, or `components/ghostflow/*`
- No `data/ghostflow/artifacts/*.json` or `mockGhostflowSnapshot.ts` edits
- No `package.json` scripts (no `retirement-flow-spike.ts`)
- MOCK **58** and composite weights unchanged

---

## Related documents

- [DATA_ROADMAP.md](./DATA_ROADMAP.md) — phase tracking  
- [RETIREMENT_FLOW_ARTIFACT_DESIGN.md](./RETIREMENT_FLOW_ARTIFACT_DESIGN.md) — v1.2b schema, validation, promotion checklist  
- [MANUAL_REFRESH_CHECKLIST.md](./MANUAL_REFRESH_CHECKLIST.md) — future operator row when artifact exists  
- [ETF_ARTIFACT_RUNBOOK.md](./ETF_ARTIFACT_RUNBOOK.md) — weekly flow neighbor (do not double-count)  
- [ACTIVE_INDEX_ARTIFACT_RUNBOOK.md](./ACTIVE_INDEX_ARTIFACT_RUNBOOK.md) — monthly flow neighbor (do not double-count)  
- [PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md](./PASSIVE_SHARE_PROXY_ARTIFACT_RUNBOOK.md) — monthly asset-share neighbor
