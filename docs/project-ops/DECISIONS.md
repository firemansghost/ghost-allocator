# DECISIONS

## 2026-08-26 — GhostFlow candidate production-mapping policy
Choice:
- **Long-End `seriesDefinition`:** New Board H.15 candidates for `treasuryLongEndIncomeLens` use `frb_h15_treasury_long_end_income_lens_v1`. Do not retain `fred_treasury_long_end_income_lens_v1` merely for validator continuity. The semantic series definition describes the Board H.15 **product contract**, not its transport encoding. Do not put `sdmx` into the semantic identifier.
- **Long-End Board H.15 production source contract (new candidates):**
  - Required primary: `RIFLGFCY30_N.B`, `RIFLGFCY30_XII_N.B`
  - Optional context: `RIFLGFCY02_N.B`, `RIFLGFCY05_N.B`, `RIFLGFCY10_N.B`
  - Forbidden in new Board-native candidates: `T10YIE`, `tenYearBreakevenInflationPct`, derived breakeven
  - Canonical release source URL: `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
  - The existing committed FRED production artifact remains valid during the transition until a future human-approved candidate is promoted.
  - Production validation may temporarily support **both** (1) legacy FRED production shape and (2) new Board-native production shape, but must enforce internal consistency per branch. No FRED/Board hybrid artifacts. A Board-native artifact must not contain FRED-only series metadata, `T10YIE`, or breakeven observation fields. A legacy artifact must continue validating until actually replaced through the future promotion workflow.
- **`dataQuality`:** Introduce `verified_automated` for deterministic source-adapter-produced candidates that pass the applicable production validator. Do not label automated candidates `verified_manual`. Existing values (`verified_manual`, `manual_unverified`) remain valid for existing/manual artifacts. Prefer the narrowest type/validator changes for the three candidate-enabled artifacts: `systematicFlowProxy`, `treasuryFuturesPositioningProxy`, `treasuryLongEndIncomeLens`.
- **`publishedAt`:** For those three artifacts, `publishedAt` is **optional** for automated candidate production shapes. Mapper rule: if normalized durable provenance contains a defensible `sourcePublishedAt`, map it to production `publishedAt`; if absent, omit `publishedAt`. Do **not** substitute `retrievedAt`, generation time, report date + N days, generic Friday-after-Tuesday logic, inferred holiday calendars, or guessed release dates. No mapper may fabricate `publishedAt`. Freshness behavior must fall back to artifact `asOf` or another already-defined deterministic anchor when `publishedAt` is omitted (no freshness semantic change in the decision-record PR).
- **Authorization boundary:** This decision authorizes **future** type changes, validator changes, source-contract truth changes, display-copy truth changes where required, and pure candidate mapper implementation. It does **not** authorize candidate generator implementation, filesystem candidate writer, production artifact writes, production artifact promotion, history writes, automatic PR creation, workflows, scores, MOCK values, `publicSignalCount`, reference-date changes, VIX / breadth / Gate C changes. Promotion remains separately blocked.
- **No production JSON changes** are authorized by this decision-record PR.

Why:
- [CANDIDATE_GENERATION_DESIGN.md](../ghostflow/CANDIDATE_GENERATION_DESIGN.md) blocked PR A on mapping-policy decisions (Long-End `seriesDefinition` / Board source block, `dataQuality`, `publishedAt`).
- Board H.15 transport and product contract are already decided (PR **#143–#144**); candidate mappers must emit Board-native **production semantics**, not FRED legacy identifiers, while preserving fail-closed validation of the committed FRED production artifact until promotion.
- CFTC and H.15 adapters do not currently emit defensible `sourcePublishedAt`; omitting `publishedAt` is honest and freshness can anchor on `asOf`.
- `verified_automated` distinguishes adapter-validated candidates from manual curation without mislabeling automation as `verified_manual`.

Consequences:
- Impact inventory: [CANDIDATE_MAPPING_POLICY_IMPACT.md](../ghostflow/CANDIDATE_MAPPING_POLICY_IMPACT.md).
- Next coding PR (**PR A**): narrow type/validator updates + pure mappers + tests — **ONE PR** recommended (no separate schema PR required).
- Display copy for Board-native Long-End may branch on `seriesDefinition` in PR A; legacy FRED production display remains until promotion replaces the artifact.
- Generator (PR B) and promotion (PR C) remain blocked pending separate work and DECISIONS entries.

---

## 2026-08-26 — Treasury Long-End H.15 transport → Board release-level SDMX/XML
Choice:
- Migrate `treasuryLongEndIncomeLens` **transport** from the current dual Board H.15 DDP CSV packages (preformatted Treasury Constant Maturities + custom single-series TIPS-30 package) to the Federal Reserve Board **release-level H.15 SDMX/XML ZIP**:
  - `https://www.federalreserve.gov/releases/h15/data/FRB_h15_xml.zip`
- Preserve the existing Treasury Long-End **product contract**:
  - Required: 30Y nominal (`RIFLGFCY30_N.B`) and 30Y inflation-indexed real (`RIFLGFCY30_XII_N.B`)
  - Optional context: 2Y / 5Y / 10Y nominal when present on the required common date
  - **No `T10YIE`**
  - **No derived breakeven**
  - Display-only, unscored, `human_required`
  - No production artifact writer and no workflow automation in the transport migration itself
- Source family remains Board H.15 (`frb_h15_treasury_yields`); this decision changes **transport / adapter / sourceFormat / sourceLocator**, not the underlying Board observation series or Long-End methodology.
- Implementation must use a new SDMX/XML adapter identity and parser version (do not silently reinterpret the CSV adapter as XML).
- Dual-DDP CSV remains interim until the SDMX/XML adapter is implemented, fixture-tested, registry-cut over, and human-reviewed live smoke is healthy.
- This decision does **not** authorize candidate generation, production artifact refresh, score/MOCK/`GHOSTFLOW_REFERENCE_AS_OF` changes, VIX, breadth, or Gate C work.

Why:
- [H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md](../ghostflow/H15_LIVE_SOURCE_AND_TRANSPORT_INVESTIGATION.md) verified all five GhostFlow series in the release ZIP and classified release-level SDMX/XML as the durable Path D transport.
- Board announcement (2026-07-16): Build Your Package (BYP) removal during the week of **2026-11-09**; the custom TIPS-30 DDP leg is BYP-exposed and post-removal arbitrary-package URL support is not guaranteed.
- Board directs BYP users toward FRED or release-level XML; GhostFlow stays on direct Board H.15 (not FRED) while exiting BYP dependence.
- Preformatted TCM post-November lifetime remains **NOT SPECIFIED**; a single release ZIP avoids dual-package reconciliation and BYP exposure.

Consequences:
- Next implementation PR may add the SDMX/XML adapter, update registry `adapterId` / `sourceFormat` / `sourceLocator`, and retire the dual-CSV path after cutover validation.
- Product semantics (required/optional series, no T10YIE, no breakeven, display-only / unscored / human-reviewed / unwired) stay locked unless a later DECISIONS entry changes them.
- Provenance should hash the exact downloaded ZIP bytes as the durable content digest (per investigation recommendation).
- Production artifacts, scores, MOCK inputs, `publicSignalCount`, and `GHOSTFLOW_REFERENCE_AS_OF` remain unchanged until a separate human-approved refresh path exists.

---

## 2026-08-25 — GhostFlow implemented display/Treasury adapters become operator-reportable
Choice:
- Permit a manual report-only operator runner for the explicitly approved implemented non-score-fed adapters:
  - systematicFlowProxy
  - treasuryFuturesPositioningProxy
  - treasuryLongEndIncomeLens
- The runner may fetch, parse, normalize, compare observation dates, and produce review reports.
- The runner may not write production artifacts, generate durable candidates, update history, change scores, change GHOSTFLOW_REFERENCE_AS_OF, open PRs, or run from a workflow.
- VIX remains excluded because Gate C remains atomic with marketBreadth.
- Adding another artifact to the operator allowlist requires an explicit code change and review; registry status alone must not silently widen runner scope.

Why:
- The source adapters are now fixture-tested and implemented.
- Operators need a controlled way to see whether official sources contain newer valid observations before candidate-generation automation exists.
- Keeping reporting separate from writing preserves the human approval boundary and fail-closed behavior.

Consequences:
- Source observations can be inspected through one manual command.
- Production remains unchanged until a separate candidate-generation and approval path is explicitly implemented.
- Gate C and breadth remain blocked and untouched.

---

## 2026-07-13 — Treasury Long-End Income Lens canonical source → Board H.15
Choice:
- Migrate `treasuryLongEndIncomeLens` canonical production source from FRED to the **Board of Governors H.15 Data Download Program**.
- Use direct H.15 observations for **30-year nominal** (`RIFLGFCY30_N.B`) and **30-year inflation-indexed real** (`RIFLGFCY30_XII_N.B`) yields.
- Include **2-year / 5-year / 10-year nominal** yields as optional context when present on the required common date.
- **Omit `T10YIE`** for now. Do **not** derive or substitute a breakeven-inflation value without a separate product and methodology decision.
- Adapter posture: fixture-driven, display-only, unscored, `human_required`, **unwired** from production workflows, and **incapable** of writing production artifacts.
- Do **not** promote `fredgraph.csv` or the authenticated FRED API as the production transport for this artifact.
- Research spike `scripts/ghostflow/fred-treasury-yields-spike.ts` remains research-only quarantine.

Why:
- [TREASURY_LONG_END_SOURCE_FEASIBILITY.md](../ghostflow/TREASURY_LONG_END_SOURCE_FEASIBILITY.md) found FRED graph CSV unauthorized for production automation and FRED API store/cache/archive terms in conflict with committed normalized artifacts and retained history without written clarification.
- Underlying constant-maturity yields originate on Board H.15; Board website disclaimer treats Board-published information as public domain with citation.

Consequences:
- Registry source family / adapter ID move to `frb_h15_treasury_yields` / `frb-h15-treasury-yields-csv`.
- Existing production artifact JSON may still record historical FRED provenance until a separate human-approved refresh; this decision does not refresh values, scores, MOCK inputs, or `GHOSTFLOW_REFERENCE_AS_OF`.
- Breakeven context requires a later DECISIONS entry before Path A (FRED T10YIE) or Path B (derived H.15 spread).

---

## 2026-03-24 — GhostRegime UI: axis & sleeve pressure vs regime-change Flip Watch
Choice:
- **Axis & sleeve pressure** (distance to 0 and to VAMS ±0.5 bands, direction vs **prior persisted trading row only**) is **separate** from **`flip_watch_status`** (regime-change confirmation). UI uses teal styling and copy under “Axis & sleeve pressure”; regime-change Flip Watch stays amber and unchanged.
- **Optional** `stocks_vams_score` / `gold_vams_score` / `btc_vams_score` on persisted rows; **no inference** from state alone — missing scores show **N/A** for sleeve distance.

Why:
- Avoids conflating daily “how close to a flip” with the existing Flip Watch product.

Consequences:
- Logic unchanged; `lib/ghostregime/flipWatchPressure.ts` is display-only.

---

## 2026-03-24 — GhostRegime product positioning (copy): KISS-aligned targets, independent proxy-VAMS signals
Choice:
- **User-facing stance** is standardized: **KISS-style regime targets** + **independently computed proxy-VAMS sleeve signals** (SPY / GLD / BTC-USD). Durable copy lives in `lib/ghostregime/productPositioning.ts`.
- Do **not** imply exact daily sleeve-state parity with any external model unless proven and explicitly documented.

Why:
- Audits and drift work showed symbol swaps alone do not establish external label parity; clarity beats implied “sameness.”

Consequences:
- GhostRegime / methodology / glossary / related surfaces should pull from the positioning file when updating hero or SEO copy.

---

## 2026-03-24 — GhostRegime sleeve states: surrogate VAMS, not guaranteed 42-published labels
Choice:
- **Production** sleeve states come from **surrogate VAMS** on **SPY**, **GLD**, and **BTC-USD** (see `lib/ghostregime/vams.ts`), not from ingesting 42 Macro’s published VT / GLDM / FBTC state labels.
- **Allocation** targets follow KISS 8.0-style top-down rules (after the INFLATION gold fix); **signal layer** parity with 42 is explicitly **not** claimed unless instruments and thresholds match.

Why:
- Repo evidence: parity harness documents state math is **not** reverse-engineered from 42 (`docs/ghostregime/PARITY_REFERENCE.md`); instrument mismatch (SPY vs VT, GLD vs GLDM, spot vs FBTC) **explains** divergent bullish/neutral/bearish vs deck labels.
- Prevents marketing/UX confusion: we should not imply “same sleeve states as 42” without Level 2 or 3 parity.

Consequences:
- Methodology and product copy should describe **proxy-based** VAMS honestly; optional future work: tighter symbol parity (Level 2) or published-state ingest (Level 3). See `docs/ghostregime/VAMS_KISS_SIGNAL_AUDIT.md`.
- **User-facing stance:** KISS-aligned **targets**; **proxy** VAMS on **SPY / GLD / BTC-USD**; the Level-2 CLI compare (**VT / GLDM / FBTC** vs production) is **diagnostic only**, not a claim of matching any vendor’s internal daily states.

---

## 2026-03-24 — GhostRegime KISS 8.0: INFLATION uses 15% gold target (not 30%)
Choice:
- Top-down gold sleeve target in **INFLATION** is **15%**; all other regimes keep **30%** gold (risk-on and DEFLATION).
- Production (`computeAllocations`) and parity harness (`computeKissTargets`) use the same split.

Why:
- Aligns with current 42 Macro KISS 8.0 workbook/slide rules (INFLATION is the special case for a lower gold cap).
- Fixes inflated gold actuals when VAMS is bullish or neutral under INFLATION (previously used 30% × scale).

Consequences:
- Opt-in parity backtests (`RUN_PARITY_TESTS=1`) may need reference CSV/JSON regenerated from an 8.0 workbook if rows still encode old INFLATION gold.

---

## 2026-01-21 — Removed convex equity; merged into core equity
Choice:
- Removed convex_equity sleeve from model portfolios and builder entirely.
- Reallocated 100% of convex_equity weight into core_equity across all risk models (r1–r5).
- Removed convex_equity from sleeve definitions, types, Schwab lineups, and Simplify ETFs.

Why:
- Options-overlay ETFs are too complex for normal Voya users.
- Simplifies both /models display and builder output; no display-only merging needed.

---

## 2026-01-21 — Models page is implementable templates (platform-specific)
Choice:
- /models shows implementable templates using real OKC Voya funds, not engine sleeve allocations.
- Platform-first: Voya-only and Voya+Schwab tabs with Conservative / Moderate / Aggressive per tab.

Why:
- Normal Voya users need actionable fund lists, not abstract sleeve weights.
- Reduces confusion; aligns with builder output (Voya slice + Schwab slice).

---

## 2026-01-21 — Convex Equity omitted from models display (superseded by full removal)
Choice:
- Initially: display-only merge of convex_equity into core_equity on /models.
- Superseded by: full removal of convex_equity from model portfolios and builder (see above).

---

## 2026-01-21 — GhostRegime is posture/education overlay (not builder allocation driver) for now
Choice:
- Builder remains stable; GhostRegime provides risk posture and education only.
- Any future opt-in overlay (e.g. contribution guidance) would be contributions-only, not daily allocation churn.

Why:
- Avoids drift between builder logic and GhostRegime; matches 457 behavior reality (payroll lands in Voya, manual sweeps).
- Avoids daily allocation churn and keeps user experience predictable.

---

## 2026-01-21 — Seed CSV remains committed as bootstrap artifact
Choice:
- Keep the seed CSV committed in the repo for determinism and local-first behavior.
- Document cutover semantics and what breaks if the seed is missing (see data/ghostregime/seed/README.md and RUNBOOK).

Why:
- Avoids secrets dependency for local/CLI use; keeps CLI and diagnostics reliable without Blob tokens.
- Prevents docs drift by having a single documented source of truth for seed location and behavior.

---

## 2026-01-17 — Education hub implementation: manual data, validation, fallback links
Choice:
- Masterclass data file uses manual list (no runtime parsing of archive file).
- Triffin Trap series categorized as "Dollar Plumbing" (not "Other").
- Items without substackUrl show "Find on Substack" fallback link (never disabled buttons).
- Dev-time validation guardrails for data integrity (unique IDs, valid startHereOrder, non-empty fields).

Why:
- Manual list is most reliable and maintainable; parsing adds complexity and failure modes.
- "Other" should be reserved for truly miscellaneous items, not a catch-all.
- Every item must have a working click path; fallback to series page ensures usability.
- Validation catches errors early in development without risking production crashes.

Consequences / follow-ups:
- Data file is manually maintained; updates require editing the array.
- Validation runs on import in dev mode only (gated on NODE_ENV).
- Fallback links ensure good UX even before per-article URLs are provided.

---

## 2026-01-17 — Education hub + Masterclass integration approach (guided path, Level 1 link-out)
Choice:
- Add an Education area (/learn) with a guided "Start here" path.
- Integrate Macro Mayhem Masterclass as Level 1: link out to Substack (no content migration yet).
- Add a 457(b) basics page first (generic, first-responder friendly). Add an OKC-specific stub later when plan docs are available.

Why:
- Education improves trust + onboarding and reduces user confusion before they hit the builder.
- Level 1 avoids a migration/time-sink while preserving Substack as the canonical home for MMM.
- Guided path reduces "what do I click" paralysis for normal humans.

Alternatives considered:
- Level 2 (host MMM content in-app as MD/MDX) — deferred until after Learn hub ships and structure proves useful.
- Free-form library only (no guided path) — rejected; too easy to become a link dump.

Consequences / follow-ups:
- Add /learn to top nav + add a homepage secondary CTA ("Learn 457 Basics").
- Build /learn/masterclass with "Start here" ordering, categories, and brief blurbs.
- Create a lightweight data file for MMM entries; allow "Link pending" until URLs are provided.

---

## 2025-12-01 — No options; ETF "options-like" exposure via ETFs only
Choice: Avoid options strategies; if we need convexity/managed futures/etc, use ETFs/funds.
Why: Target users won't use options; ETFs are simpler and implementable.

## 2025-12-05 — No accounts/login in V1
Choice: V1 is compute + display; persistence via localStorage only.
Why: Reduce scope; validate usefulness before Supabase.

## 2025-12-08 — Voya + Schwab design: Schwab = growth bucket, Voya = defensive + inflation bucket
Choice: For combo users, Voya implementation avoids duplicating equity funds when Schwab exists.
Why: Reduces redundancy and makes the split feel intentional.

## 2025-12-09 — OKC 457 reality must be explicit
Choice: UI copy states payroll contributions land in Voya first; Schwab requires manual sweeps.
Why: Prevents incorrect expectations and improves real-world usability.

## 2025-12-12 — Canonical OKC Voya fund list is a single source of truth
Choice: All dropdowns and mixes reference lib/voyaFunds.ts canonical IDs.
Why: Prevents drift, enables validation, supports future expansions.

## 2025-12-15 — Builder UX optimized for action, not reading
Choice: "Start here" strip + Action Plan first; details collapsed by default.
Why: Firefighters want a checklist, not a whitepaper.

## 2025-12-22 — Define V1 vs V1.1 scope
Choice: V1 is MVP Foundation; V1.1 is model portfolio validation + GhostRegime visual polish.
Why: Keeps a stable shipping milestone while allowing iterative refinement.
Alternatives: "V1 never ends" (rejected)
---
