# HANDOFF

## Last Session Summary (2026-07-13)
Starting `main`: `70b66f7` (PR **#136** shared CFTC Socrata core merged). Implemented fixture-driven **CFTC TFF Treasury Socrata adapter** (`cftc-tff-treasury-socrata` → `implemented` / `1.0.0`) reusing the shared core. Four standard Treasury contracts are required core; two Ultra contracts remain optional context (missing optional → review issue). Adapter normalizes raw observations only; no net/gross/direction/basket/score. Unwired; no production write. Systematic unchanged/unwired; FRED Treasury remains `spike_available`. Breadth / Gate C blocked. Reference `2026-07-01`; scores `60 / 53 / 67`; `publicSignalCount` 13; MOCK `62 / 58 / 55`.

## State of Work
- Treasury CFTC adapter: fixture-tested, registry implemented, production-unwired.
- Shared CFTC Socrata core + systematic adapter in place; systematic behavior unchanged.
- VIX adapter remains implemented and unwired.
- Breadth operator-packet + source-authorization block remain in force; Gate C blocked.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Implement FRED Treasury yields adapter **or** design report-only operator runner for implemented display adapters (neither claimed done)
2) Do not wire Treasury/systematic adapters into CLI/workflows/production writers yet
3) Breadth: decide written permission vs licensed SKU (neither approved)

## Open Questions
- Prefer FRED Treasury next, or operator runner for display adapters?
- Any Ultra-context operator presentation rules before a production refresh path?

---

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
