# HANDOFF

## Last Session Summary (2026-08-26, H.15 SDMX/XML transport implemented)
Starting `main`: `3f63fdf27176dc5fabb4b15c8395200d10c9c931` (PRs **#140–#143**). Implemented and cut over `treasuryLongEndIncomeLens` active transport from dual Board H.15 DDP CSV to release-level SDMX/XML ZIP (`FRB_h15_xml.zip`). New adapter `frb-h15-treasury-yields-sdmx` parser **1.0.0**; registry + operator runner updated; CSV **1.0.1** retained without automatic fallback. ZIP via narrow in-memory local-header reader + `node:zlib`; XML via deterministic SDMX compact scanner — **no new dependencies**. Live CSV/XML parity OK at `2026-08-24`. Live smokes healthy (H.15-only + full runner, exit 0). DECISIONS unchanged (PR **#143** approval already recorded). Production artifacts, scores, MOCK, reference date, and candidate generation unchanged.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation merged (PR **#141**).
- CSV blank-as-missing parser **1.0.1** merged (PR **#142**); CSV adapter retained but inactive at runtime.
- H.15 SDMX/XML transport approved (PR **#143**) and **implemented** on `feat/ghostflow-h15-sdmx`.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Human-reviewed candidate-generation design for operator-ready artifacts
2. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Candidate-generation acceptance workflow and production writer boundaries?
- Breadth licensed-source path still blocked pending authorization?

---

## Archive — H.15 SDMX/XML transport decision (2026-08-26)
Current `main` includes PR **#142** (`38333e0`): Board H.15 CSV parser **1.0.1** blank-as-missing repair is active and live smoke was healthy. Bobby approved migrating `treasuryLongEndIncomeLens` transport from dual Board H.15 DDP CSV to the release-level SDMX/XML ZIP at `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`. Decision recorded in `docs/project-ops/DECISIONS.md`. Product contract unchanged (required 30Y nom + 30Y real; optional 2/5/10Y; no T10YIE; no derived breakeven; display-only / unscored / human_required; no production writer or workflow in the migration). **SDMX/XML adapter not yet implemented** — dual CSV remains the interim active transport until cutover.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation merged (PR **#141**).
- CSV blank-as-missing parser **1.0.1** merged (PR **#142**); dual CSV still active interim transport.
- H.15 SDMX/XML transport migration is **approved** in DECISIONS; adapter implementation is the next coding task.
- Breadth / Gate C blocked; no VIX wiring.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Implement Board release-level H.15 SDMX/XML adapter + registry/operator cutover for `treasuryLongEndIncomeLens`
2. Only after healthy SDMX/XML live smoke, resume human-reviewed candidate-generation design
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- ZIP extraction strategy / whether a small dependency is required vs built-in APIs?
- CSV/XML live normalized parity expectations at cutover?
- Exact active `adapterId` / `sourceFormat` naming (`frb-h15-treasury-yields-sdmx` vs similar)?
- Retain dual CSV briefly for provenance comparison during XML cutover, or hard-cut after smoke?

---
## Archive — H.15 blank-missing parser 1.0.1 (2026-08-25)
Starting `main`: `f833e7aef8d6c489f5e489a2c90c19ef3a3af31e` (PR **#141** investigation merged). Implemented narrow Board H.15 CSV parser fix: blank / whitespace-only yield cells → missing (same path as `ND`); `parserVersion` **1.0.1**. Dual DDP CSV transport, series contract, and source identity unchanged. No XML/SDMX migration. No production/candidate/history writes. DECISIONS unchanged in that PR.

Live smoke outcomes:
- H.15-only (`2026-08-26T00:08:24.514Z`): `candidate_observation_available` (candidate `2026-08-24`); overall `ready_for_review`; `review_candidates`; exit 0; prior row-67486 failure gone
- Full runner (`2026-08-26T00:08:41.683Z`): systematic + Treasury CFTC + H.15 all `candidate_observation_available` (CFTC `2026-08-18`, H.15 `2026-08-24`); overall `ready_for_review`; `review_candidates`; exit 0; no writes

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation merged (PR **#141**); blank-as-missing parser repair implemented on that branch and later merged as PR **#142**.
- Custom TIPS-30 leg remains BYP-exposed; durable Path D XML migration still required before **2026-11-09**.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Design and approve durable Board release-level SDMX/XML transport migration for `treasuryLongEndIncomeLens`
2. Only after transport migration planning is locked, resume human-reviewed candidate-generation design
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Record XML/SDMX transport migration in DECISIONS after Bobby review?
- Retain dual CSV briefly for provenance comparison during XML cutover?

---

## Archive — H.15 live-source investigation (2026-08-25)
Starting `main`: `51236fb96b15b73c5da095aa6b8dc7b3410148e0` (PR **#140** merged). Completed docs-only **H.15 live source and transport investigation** on branch `docs/ghostflow-h15-live-source-investigation`.

**Findings:**
- Live smoke (`npm run ghostflow:refresh-report`, `2026-08-25T22:22:19.375Z`): H.15 fails at TCM CSV row **67486** — blank value on `H15/H15/RIFLGFCY02_N.B` / `1962-01-02`
- Classification: **B — parser omission** (blank cells = missing; not schema drift)
- Custom TIPS-30 DDP package is **BYP-exposed** (custom-package mechanism; removal week of **2026-11-09**); continued arbitrary-package URL support after BYP removal not guaranteed; preformatted TCM **NOT SPECIFIED** post-November
- Release SDMX/XML ZIP verified: all five contract series present at `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
- Memo: [H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md](../ghostflow/H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md)
- **Recommended:** durable Path D (release XML); smallest next PR = parser **1.0.1** blank-as-missing CSV fix
- **No** adapter, registry, transport, or production changes in this investigation

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner merged (PR **#140**).
- H.15 investigation complete; live parse still blocked until approved implementation.
- CFTC adapters healthy in prior smoke; H.15 transport durability concern confirmed (BYP + blank CSV).
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. Bobby review investigation memo; approve parser 1.0.1 fix and/or SDMX migration path
2. Implement approved H.15 fix(es) before **2026-11-09** BYP removal
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- Approve interim CSV 1.0.1 fix only, or proceed directly to SDMX adapter?
- Record transport migration in DECISIONS after review?
- Any requirement to retain dual CSV for provenance comparison during XML cutover?

---

## Archive — Report-only operator runner (2026-08-25)
Starting `main`: `0cf02b922baf0f5a6ade38f700dee886f307e4d7` (PR **#139** Board H.15 adapter merged). PR **#140** implements manual **report-only operator runner** (`npm run ghostflow:refresh-report`) for three non-score-fed adapters: systematic CFTC, Treasury CFTC, and Board H.15 long-end.

Live smoke (2026-08-25T21:54:54.950Z):
- CFTC systematic and Treasury sources returned newer candidate observation dates (2026-08-18)
- H.15 long-end live execution failed closed: `source_failed` with `h15_csv_invalid_value` at source CSV row 67486
- Overall report: `partial_with_blocks`; exit code 2
- No production, candidate, or history write occurred
- Runner behavior is correct; H.15 adapter/source investigation is the immediate next task

**Federal Reserve DDP announcement (2026-07-16):**
On [2026-07-16](https://www.federalreserve.gov/datadownload/Choose.aspx?rel=H15), the Board announced **Build Your Package (BYP)** removal planned for the week of **2026-11-09**, in preparation for eventual DDP retirement. Users are directed toward FRED or release-level XML downloads. The current H.15 adapter uses a custom DDP package for the required 30Y inflation-indexed series (`RIFLGFCY30_XII_N.B`), so source transport durability must be revisited. No replacement source is approved by this note.

Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`. VIX / Gate C excluded; breadth remains blocked.

## State of Work
- Report-only operator runner is implemented on PR **#140**.
- CFTC systematic and Treasury adapters returned newer candidate dates in live smoke.
- H.15 adapter failed live parse at row 67486; transport durability concern added by July 16 DDP/BYP announcement.
- No production/candidate/history write occurred; runner fail-closed behavior confirmed.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1. H.15 live-source / parser / transport investigation (including DDP/BYP retirement implications)
2. Candidate-generation design only after H.15 returns to a healthy deterministic live smoke
3. Breadth authorization remains separate and blocked; do not wire VIX or Gate C

## Open Questions
- What exact value/row shape triggered `h15_csv_invalid_value` at row 67486?
- Is the defect a valid historical sentinel/format case or actual schema drift?
- Can the existing CSV transport survive the November BYP removal?
- Should the canonical Board transport move to release-level SDMX/XML?

---

## Archive — Board H.15 adapter (2026-07-13)
Starting `main`: `9cf9fa4` (PR **#138** Treasury long-end source audit merged). Implemented fixture-driven **Board H.15 Treasury yields adapter** (`frb-h15-treasury-yields-csv` → `implemented` / `1.0.0`) after Bobby approved migrating `treasuryLongEndIncomeLens` off FRED. Dual DDP packages: official TCM + `RIFLGFCY30_XII_N.B`. Required 30Y nom + 30Y real; optional 2/5/10Y; **T10YIE omitted** (no derived breakeven). Unwired; no production write. DECISIONS appended. CFTC systematic/Treasury + VIX remain unwired. Breadth / Gate C blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Long-end H.15 adapter: fixture-tested, registry implemented, production-unwired.
- Source decision recorded; FRED graph CSV / API not production transports for this artifact.
- Treasury CFTC + systematic + VIX adapters remain implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Do not wire H.15 / CFTC / VIX adapters into CLI/workflows/production writers yet
2) Breadth: decide written permission vs licensed SKU (neither approved)
3) Optional: human-approved artifact refresh path using H.15 (separate from this adapter PR)

## Open Questions
- When should display adapters become operator-driven vs remain research/fixture-only?
- Later breakeven posture: omit permanently, derived H.15, or FRED under written permission?

---

## Archive — Treasury long-end source audit (2026-07-13)
Starting `main`: `12ad053` (PR **#137** CFTC Treasury adapter merged). Docs-only **Treasury long-end source feasibility / authorization audit** for `treasuryLongEndIncomeLens`: [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md). Verdict: prefer direct Board H.15; do not promote `fredgraph.csv`; FRED API permission-required for retention/history. No registry/artifact/score change in that PR.

## Archive — CFTC Treasury adapter (2026-07-13)
Starting `main`: `70b66f7` (PR **#136** shared CFTC Socrata core merged). Implemented fixture-driven **CFTC TFF Treasury Socrata adapter** (`cftc-tff-treasury-socrata` → `implemented` / `1.0.0`) reusing the shared core. Four standard Treasury contracts are required core; two Ultra contracts remain optional context (missing optional → review issue). Adapter normalizes raw observations only; no net/gross/direction/basket/score. Unwired; no production write. Systematic unchanged/unwired; FRED Treasury remains `spike_available`. Breadth / Gate C blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## Archive — Shared CFTC Socrata core (2026-07-13)
Starting `main`: `96852dc` (PR **#135** CFTC systematic adapter merged). Extracted shared **CFTC TFF Socrata source core** (transport, cell parsers, hashing, generic deterministic query builder). Systematic adapter refactored to consume the core with **no behavior change** (ID / parser `1.0.0` / query URL / errors / normalized output preserved). Systematic remains unwired. Treasury CFTC remains `spike_available` and is the recommended next implementation. Breadth / Gate C blocked; no provider approved. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Shared CFTC Socrata core extracted; systematic adapter behavior unchanged.
- CFTC systematic adapter: fixture-tested, registry implemented, production-unwired.
- VIX adapter remains implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Implement `cftc-tff-treasury-socrata` using the shared CFTC Socrata core
2) Do not wire systematic/Treasury adapters into CLI/workflows/production writers yet
3) Breadth: decide written permission vs licensed SKU (neither approved)

## Open Questions
- Any Treasury-contract selection nuances before implementing the Treasury adapter?
- When should systematic display refresh become operator-driven vs remain research-only?

---

## Archive — CFTC systematic adapter (2026-07-13)
Starting `main` for this work: `c503042` (PR **#134** breadth operator packet merged). Implemented fixture-driven **CFTC TFF systematic Socrata adapter** (`cftc-tff-systematic-socrata` → `implemented` / `1.0.0`). Adapter normalizes official ES/NQ/RTY/VIX Futures Only observations only; basket and pressure mapping stay downstream; unwired from runtime/workflows; no production artifact write; MOCK systematic **62** unchanged. Breadth / Gate C remain blocked; no provider approved. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- CFTC systematic adapter: fixture-tested, registry implemented, production-unwired.
- VIX adapter remains implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Implement Treasury CFTC adapter (reuse Socrata boundary) **or** FRED Treasury adapter (neither already claimed done)
2) Do not wire systematic adapter into CLI/workflows/production writers yet
3) Breadth: decide written permission vs licensed SKU (neither approved)

## Open Questions
- Prefer Treasury CFTC reuse next, or FRED Treasury first?
- When should systematic display refresh become operator-driven vs remain research-only?

---

## Archive — Breadth operator packet (2026-07-13)
PR **#133** is on `main` (`18ab040`). Completed docs-only **breadth operator-packet** specification and reconciled stale operator docs: [BREADTH_ARTIFACT_RUNBOOK.md](../ghostflow/BREADTH_ARTIFACT_RUNBOOK.md), [MANUAL_REFRESH_CHECKLIST.md](../ghostflow/MANUAL_REFRESH_CHECKLIST.md), [REFERENCE_DATE_AND_OPERATOR_POLICY.md](../ghostflow/REFERENCE_DATE_AND_OPERATOR_POLICY.md). Packet is intake-only; no provider approved; production breadth refresh and Gate C remain blocked. VIX adapter remains unwired. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Feasibility decision (PR #133) + operator-packet runbook are in place.
- Direct StockCharts/Barchart production transcription instructions are quarantined / non-executable.
- No registry, adapter, artifact, or score changes.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Decide whether to seek written provider permission **or** investigate an exact licensed provider SKU (neither approved)
2) Do not implement scrapers, HTML adapters, packet parsers, or Gate C runners
3) Do not bump reference through Gate C until an authorized breadth source exists

## Open Questions
- Does Bobby want written StockCharts permission, a licensed vendor SKU investigation, or to leave Gate C blocked longer?
- If a licensed path emerges, should registry later move `marketBreadth` to `operator_packet` only after both product approval and provider rights evidence?

---

## Archive — Education session (2026-01-21)
Added "457(b) in 5 Minutes" quick reference to education section:
- Created reusable component (components/learn/457InFiveMinutes.tsx) with scannable format
- Added prominent section to /learn/457 page (positioned after header, before longer content)
- Added Browse card to /learn hub linking to /learn/457#in-5-minutes anchor
- Component covers: 60-second version, governmental vs non-governmental, withdrawals (with rollover caution), catch-ups, common mistakes, and actionable checklist
- Uses existing styling patterns for consistency

## State of Work
- Core app is stable and deployable; builder/onboarding works.
- Sleeve logic is clean (no Gold double-counting; Gold and Commodities remain separate).
- GhostRegime diagnostics are in a good place and can be revisited if parity issues matter again.
- Education section is live and functional. Masterclass items use fallback links ("Find on Substack") until per-article URLs are provided.

## Priority for Next Session
1) Add per-article Substack URLs to masterclass data file as Bobby provides them
2) Develop OKC-specific 457(b) playbook content when plan documents are available
3) Consider content for Finance Basics and Glossary pages (currently stubs)

## Open Questions
- When will per-article Substack URLs be available to replace fallback links?
- What's the timeline for OKC plan documents to enable OKC-specific 457(b) playbook?
- Should Finance Basics and Glossary be prioritized, or focus on other features first?

---

## Archive
### Snapshot (2025-12-22)
Ghost Allocator V1 is in a strong place: platform-aware builder flow, Voya fund menu completeness, delta "one-time rebalance" guidance, and clearer UX hierarchy. SEO basics are added (metadata, robots/sitemap, OG). GhostRegime workflow was adjusted to avoid noisy failures by skipping safely when not configured.

## State of Work
- Core product works locally and the UI is now readable/actionable.
- Remaining work is mostly: verification, deployment, and deciding the next feature slice.

## Priority for Next Session
1) Model portfolios: define final set + sleeve weights + ETF examples (spec first)
2) Build a quick output review checklist across risk bands + platform types
3) GhostRegime UI polish plan (cards/layout/hierarchy)

## Open Questions
- Do we capture Schwab holdings next (like CurrentVoyaForm) or do PWA/perf first?
- What's the minimum "done" for V1 before we add Supabase accounts?

---

## START SESSION PROMPT (copy/paste)
Read these files first:
- docs/project-ops/STATUS.md
- docs/project-ops/DECISIONS.md
- docs/project-ops/TASK_LOG.md
- docs/project-ops/HANDOFF.md
- docs/project-ops/SKILLS.md

Before acting:
1) Summarize current state in 3-5 bullets.
2) Confirm the priority for this session.
3) Propose a plan (max 3 steps).
4) Wait for Bobby's approval before coding.

Risk posture: Conservative
Tone: Use SKILLS.md

## END SESSION PROMPT (copy/paste)
Session ending. Do this:

COMPACTION (3-5 sentences):
- What was done, what changed, what's unresolved.

UPDATE FILES:
- Update STATUS.md (state, blockers, next actions, date)
- Add a new entry to TASK_LOG.md
- Add decisions (if any) to DECISIONS.md
- Update HANDOFF.md with next-session priority + open questions
