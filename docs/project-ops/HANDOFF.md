# HANDOFF

## Last Session Summary (2026-07-13)
PR **#132** is on `main` (`83780ac`) — CBOE VIX CSV adapter implemented but unwired. Completed a read-only **marketBreadth source feasibility audit** (docs-only). StockCharts `$SPXA50R` direct automation is **RED** (Usage Limitations prohibit programmatic access without prior approval; HTML is JS-dependent). Recommendation: **preserve breadth as a manual operator packet**; keep Gate C manual/automation-blocked. No production refresh; scores and reference unchanged.

## State of Work
- VIX: GREEN adapter exists (unwired). Breadth: no lawful deterministic machine path confirmed for the exact series.
- Feasibility memo: `docs/ghostflow/MARKET_BREADTH_SOURCE_FEASIBILITY.md`
- Production GhostFlow remains locked at reference `2026-07-01`, scores `60 / 53 / 67`, `publicSignalCount` 13, MOCK `62 / 58 / 55`.
- Gate C remains incomplete without an approved breadth input path.
- Core app remains stable; education section remains live.

## Priority for Next Session
1) Docs-only breadth operator-packet intake design (registry change only after Bobby approval)
2) Optional: commercial SKU confirmation for exact S&P 500 % above 50DMA — only if Bobby wants that track
3) Do not build Gate C runner or StockCharts HTML scraper

## Open Questions
- Does Bobby want to seek written StockCharts permission / Pro CSV workflow formalization, or pursue a licensed vendor SKU?
- Should registry later move `marketBreadth` from planned HTML to `operator_packet` after an explicit decision?

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
