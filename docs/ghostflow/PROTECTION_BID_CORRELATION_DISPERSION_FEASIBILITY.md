# Protection Bid / Correlation Dispersion Feasibility — GhostFlow v1.9e

**GhostFlow docs:** [README](./README.md) · [Current state](./GHOSTFLOW_CURRENT_STATE.md) · [Public signal inventory](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) · [Passive supply backlog](./PASSIVE_SUPPLY_AND_CONCENTRATION_BACKLOG.md) · [Roadmap](./DATA_ROADMAP.md)

**Related:** [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) · [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) · [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) · [ARTIFACT_RUNBOOK.md](./ARTIFACT_RUNBOOK.md) (VIX)

This memo is a **docs-only feasibility study** for a possible future **Protection Bid / Correlation Dispersion** research lane. It does **not** create artifacts, code, UI, score changes, source spikes, or runtime behavior.

---

## Status

| Item | v1.9e posture |
|------|----------------|
| Document type | **Feasibility memo** |
| Scope | **Docs-only** |
| Artifact | **None** |
| Code | **None** |
| UI | **None** |
| Score change | **None** |
| Runtime change | **None** |
| Source spike | **None** (deferred to v1.9e.1) |
| `publicPassiveInputKey` | **None** |
| **`publicSignalCount`** | **12** (equity) — **unchanged** |

---

## Research question

This lane is a **research umbrella**, not one proven product signal.

**Primary question:**

Can a public, manual, operator-grade options-market signal add display-only context for tail-hedging demand or correlation/dispersion stress without duplicating VIX level or OCC options activity, and without opening the Passive score model?

### Sub-dimensions

| Sub-dimension | What it would capture |
|---------------|----------------------|
| **Tail hedging / skew pressure** | OTM index put pricing vs ATM — tail-risk premium shape |
| **Crash protection / index put demand** | Put-heavy hedging narrative (needs skew or PCR, not volume alone) |
| **Implied correlation stress** | Index vs single-name co-movement in options-implied space |
| **Single-stock vs index vol gap** | Idiosyncratic vs systematic risk pricing |
| **Broad risk-off insurance premium** | Umbrella narrative — low specificity; high overlap with VIX/SKEW |

### Boundaries (already covered elsewhere)

| Concept | GhostFlow home |
|---------|----------------|
| **VIX level** | Score-fed `vol-regime` → `optionsVolatilityAmplifier` (**20%** Passive) — [`scoring.ts`](../../lib/ghostflow/scoring.ts) |
| **OCC index options intensity** | Display-only `options-activity-proxy` — [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) |
| **0DTE / dealer gamma / GEX** | **RED** public path — [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) |
| **CFTC systematic positioning** | Display-only `systematic-flow` |
| **Cap-weight premium / passive supply / index inclusion** | Separate v1.9b / v1.9c display lanes |
| **Breadth participation** | Score-fed `breadth` (structural) |
| **ETF flow impulse** | Score-fed `etf-flow` (passive) |

---

## Candidate public source table

Traffic-light ratings assume **manual operator extract** (same discipline as VIX/OCC artifacts). No live API fetch in v1.9e.

| Source | What it measures | Public? | Cadence | History | Manual burden | Artifact viable? | Overlap with VIX | Rating |
|--------|------------------|---------|---------|---------|---------------|------------------|------------------|--------|
| **Cboe SKEW Index** | Tail skew of SPX options (OTM put vs ATM vol gap) | Yes — CBOE index history (expected CSV class similar to VIX) | Daily | Long | Low–medium | **Yes** — display-only candidate | Partial — correlates in stress; different quantity (skew shape, not vol level) | **GREEN–YELLOW** |
| **VIX term structure** (VIX / VIX3M / VIX9D) | Vol term structure / fear-spike shape | Yes — CBOE index histories | Daily | Long | Medium (multi-series) | Display context only | **High** — same vol complex as scored VIX | **YELLOW** |
| **VVIX** (vol of VIX) | Uncertainty on VIX itself | Yes — CBOE | Daily | Long | Medium | Display context only | **High** | **YELLOW** |
| **Put/call ratio** (index or total) | Options flow **mix** | Mixed — OCC daily CSV **lacks PCR** in current production lock; CBOE paths vary | Daily–monthly | Varies | Medium–high until field locked | Weak unless source locked | Medium | **YELLOW–RED** |
| **OCC cleared options volume** | Contract **activity** (Index/Others share) | Yes — **already shipped** | Daily | Yes | Done | **No new card** | Low direct; narrative overlap with “options stress” | **RED** (duplicate) |
| **Cboe implied correlation** (e.g. COR1M / related) | Implied correlation / dispersion | Partial — indexes exist; **public CSV lock unverified** in repo | Daily (if available) | Unknown | High until v1.9e.1 spike | Deferred | **Yes** — distinct dimension | **YELLOW–RED** |
| **Cboe options statistics / white papers** | Narrative context, occasional aggregates | Yes | Event / monthly | Static citations | Low | Research citations only | Varies | **YELLOW** (research-only) |
| **ETF vol proxies** (e.g. VIX ETP implied vol) | Indirect vol exposure | Yes | Daily | Long | Medium | Display-only at best | **High** | **RED** for new lane |
| **Single-name vs index IV spread** | Dispersion in vol surface | Mostly **licensed** (ORATS, etc.) | Daily | Vendor | N/A public | No | Yes | **RED** (vendor) |
| **ORATS, SpotGamma, SqueezeMetrics, QuantData** | Skew, GEX, 0DTE, correlation surfaces | Licensed | Intraday / daily | Vendor | API cost | Production-grade if paid | Varies | **RED** (paid/vendor path) |

**Primary public path for a future display-only artifact:** **Cboe SKEW** (tail skew — clearest non-duplicate dimension).

**Deferred until v1.9e.1 source spike:** implied correlation indexes, index put/call if a repeatable public field is found.

---

## Measurement boundaries

| Signal family | Measures | Does **not** measure |
|---------------|----------|----------------------|
| **SKEW** | Tail skew / tail-hedge **pricing** relative to ATM | VIX **level**; contract volume; dealer gamma |
| **VIX** | Implied volatility **level** (already score-fed) | Skew shape; activity volume; correlation |
| **OCC volume** | Options **activity** intensity | Protection demand; skew; implied correlation |
| **Put/call ratio** | Flow **mix** | Hedging intent; gamma; 0DTE share |
| **Implied correlation** | Co-movement stress in options-implied space | Requires named correlation index provenance — not inferable from volume |

**Labeling discipline:** No public source in this lane should be labeled **dealer gamma**, **GEX**, or **0DTE** without source proof ([ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md)).

---

## Overlap / double-count analysis

### Score-fed inputs

| Input | Weight / role | Overlap with v1.9e lane |
|-------|---------------|-------------------------|
| `vol-regime` / `optionsVolatilityAmplifier` (VIX) | **20% Passive** | **High narrative overlap** if a second options/vol signal were score-fed; **low mathematical overlap** if signal is **SKEW** (different index) |
| `breadthWeakness` | **15% Structural** | Dispersion **context** only — participation vs options skew |
| `etfFundFlowImpulse` | **25% Passive** | Low |

### Display-only inputs

| Card | Overlap |
|------|---------|
| `options-activity-proxy` | **High** if new card is volume/PCR-based — **do not duplicate** |
| `systematic-flow` | Low direct; broad “systematic stress” narrative |
| `levered-etf-rebalance` | Low |
| `cap-weight-premium` | Low direct; concentration narrative |

### Required conclusions

1. **Score-fed SKEW** would likely **double-count VIX narrative** unless the Passive model is redesigned (v1.8i / v1.4f territory) — **not recommended**.
2. **Display-only SKEW** can add context **beside** `vol-regime` without score creep — VIX = level; SKEW = tail skew shape.
3. **OCC volume** must **not** become another card under a “protection bid” label — `options-activity-proxy` already covers Index/Others intensity.
4. **Implied correlation** may be a **distinct** dimension but the public source path is **unproven** until v1.9e.1.
5. This lane should remain **display-only by default** — aligned with [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) and [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md).

---

## Product naming recommendation

**Do not** use the umbrella title **“Protection Bid / Correlation Dispersion”** as a dashboard card title unless an artifact measures both dimensions with provenance.

| Context | Recommended name |
|---------|------------------|
| **This feasibility memo** | Protection Bid / Correlation Dispersion Feasibility |
| **Possible future SKEW card** | **Tail Skew Context** or **Cboe SKEW Proxy** |
| **Deferred correlation card** (if source proven) | **Implied Correlation Context** |

**Avoid:**

- `Protection Bid Proxy` — unless source supports actual protection-demand framing
- `Correlation Dispersion Proxy` — unless correlation/dispersion source is proven
- `0DTE`, `Gamma`, `GEX`, `Vol Pressure` — mislabeling risk

---

## Feasibility rating

| Item | v1.9e finding |
|------|---------------|
| **Overall lane rating** | **YELLOW** |
| **Recommended option** | **Option A** — viable **narrow** public display-only artifact candidate, **SKEW-first** |
| **Secondary** | **Option B** — research-only context for correlation dispersion until v1.9e.1 source spike |

**Not selected:**

- **Option C** — defer entire lane (SKEW path has merit)
- **Option D** — paid/vendor only as immediate path (document as fallback only)

**Score gate:** **v1.9e.6 discouraged / not approved** — VIX overlap and v1.10e no-score-change policy.

---

## Recommended next phase

**v1.9e.1 — Protection Bid Source Spike / Operator Source Review**

| Item | Detail |
|------|--------|
| **Purpose** | Lock repeatable Cboe SKEW source / CSV column path; optionally verify implied-correlation public availability |
| **Scope** | Research / operator-only — **no artifact**, **no score**, **no live runtime fetch** |
| **Stop rule** | If v1.9e.1 cannot lock repeatable public SKEW or implied-correlation fields → stop before artifact design; document paid/vendor or research-only status |

---

## Future phase ladder

| Phase | Deliverable | Score? | Notes |
|-------|-------------|--------|-------|
| **v1.9e** | This feasibility memo | No | **Done** (docs-only) |
| **v1.9e.1** | Source spike / operator-source review | No | SKEW CSV lock; optional COR check |
| **v1.9e.2** | Artifact design — display-only default, likely **SKEW-only** | No | Not started |
| **v1.9e.3** | Example JSON + validator | No | Not started |
| **v1.9e.4** | Production artifact + display-only card | No | Product-approved only; would raise `publicSignalCount` to **13** |
| **v1.9e.5** | Mapping decision | No | Expected: display-only; `mappingStatus` **not_final** |
| **v1.9e.6** | Score gate | **Discouraged / not approved** | VIX overlap; v1.10e policy |

A future display card is **not** part of v1.9e. **`publicSignalCount` remains 12** in v1.9e.

---

## Guardrails

| Rule | Reference |
|------|-----------|
| No score wiring | [MOCK_SCORE_NO_CHANGE_POLICY.md](./MOCK_SCORE_NO_CHANGE_POLICY.md) |
| No `publicPassiveInputKey` | [GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md](./GHOSTFLOW_PUBLIC_SIGNAL_INVENTORY.md) |
| VIX remains sole score-fed options/vol input | [OPTIONS_ACTIVITY_MAPPING_DECISION.md](./OPTIONS_ACTIVITY_MAPPING_DECISION.md) §7 |
| No 0DTE / GEX claims on public aggregates | [ODTE_OPTIONS_FEASIBILITY.md](./ODTE_OPTIONS_FEASIBILITY.md) |
| No OCC duplicate card | `options-activity-proxy` already shipped |
| v1.4f / v1.0c / v1.8i gates remain closed | [DATA_ROADMAP.md](./DATA_ROADMAP.md) |

---

## No-change confirmation

| Item | v1.9e confirmation |
|------|---------------------|
| [`scoring.ts`](../../lib/ghostflow/scoring.ts) | **Unchanged** |
| [`buildSnapshot.ts`](../../lib/ghostflow/buildSnapshot.ts) | **Unchanged** |
| [`mockGhostflowSnapshot.ts`](../../data/ghostflow/mockGhostflowSnapshot.ts) | **Unchanged** |
| Production artifact JSON | **Unchanged** |
| UI components | **Unchanged** |
| Tests | **Unchanged** |
| `package.json` | **Unchanged** |
| **Passive Pressure** | **58** — unchanged |
| **Structural Fragility** | **66** — unchanged |
| **Composite** | **62** — unchanged |
| **`publicSignalCount`** | **12** (equity) — unchanged |
| GhostRegime / Marketstack / GhostYield / Models / builder | **Out of scope — untouched** |

No score changes without explicit product approval.
