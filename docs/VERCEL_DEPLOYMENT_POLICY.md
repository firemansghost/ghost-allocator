# Ghost Allocator Vercel Deployment Hygiene Policy

**Status:** ACTIVE V1
**Created:** 2026-09-05
**Activated / observed:** 2026-09-05
**Project:** `firemansghost/ghost-allocator`

## 1. Purpose

A Vercel audit found that Ghost Allocator generated approximately 63 deployments in seven days. A large share came from normal PR iteration, documentation closeouts, research records, and other repository changes that did not alter the deployed web application.

The governing principle is:

> **Deploy runtime changes. Do not deploy bookkeeping.**

This policy reduces redundant Vercel builds without weakening production safety.

The filter must always be conservative. If it cannot prove that every changed path is non-runtime, the result is **BUILD**.

---

## 2. Why Ghost Allocator needs its own rule

Ghost Allocator is not structurally identical to Gridiron Edge.

Its repository contains:

- deployed Next.js code under `app/**`, `components/**`, and runtime portions of `lib/**`
- committed runtime data under `data/**`
- static assets under `public/**`
- GhostRegime / GhostFlow / GhostYield research and operator tooling
- tracked reports
- large Markdown documentation trees
- TypeScript scripts under `scripts/**`

Some research-looking files are consumed by production.

Examples include GhostFlow artifacts, GhostYield candidate JSON, and GhostRegime replay seed data. Therefore file names such as `research`, `artifact`, `data`, or `script` are not sufficient evidence that a Vercel build can be skipped.

---

## 3. Fail-open rule

The ignored-build filter must fail open to **BUILD**.

BUILD when:

- `VERCEL_GIT_PREVIOUS_SHA` is unavailable
- either comparison SHA cannot be resolved
- `git diff` fails
- the changed-file set is empty or ambiguous
- a changed path is not explicitly allowlisted
- configuration changes
- the deployment-filter script changes
- any runtime or data dependency changes

An unnecessary build is acceptable.

Skipping a required build is not.

---

## 4. Initial V1 safe-skip allowlist

A Vercel build may be skipped only when **every changed file** falls into one of these approved categories:

- Markdown files anywhere under `docs/**`
- `README.md`
- `LICENSE`
- `reports/**`
- `.github/workflows/**`
- `.cursor/rules/**`

### Important: docs are Markdown-only

The implementation intentionally allows `docs/**/*.md`, not arbitrary `docs/**`.

This protects against future committed non-Markdown material such as CSV or JSON under a documentation tree.

Historical/local parity material under `docs/KISS/**` is not tracked on `main`, but if any non-Markdown file there is ever force-committed, it must trigger **BUILD**.

---

## 5. Paths that always BUILD in V1

The following must be treated as build-relevant:

- `app/**`
- `components/**`
- `lib/**`
- `data/**`
- `public/**`
- `scripts/**`
- `package.json`
- `package-lock.json`
- `next.config.*`
- `postcss.config.*`
- `tsconfig*.json`
- `eslint.config.*`
- environment/deployment configuration
- Vercel configuration
- the ignored-build script itself
- unknown or newly introduced paths

This list is intentionally conservative.

---

## 6. Why `scripts/**` stays BUILD in V1

The repository audit found that script-only changes do not alter the Next.js runtime bundle directly.

However, the project TypeScript configuration includes:

- `**/*.ts`
- `**/*.tsx`

That means TypeScript files under `scripts/**` are part of the project-wide type-check surface used by the Next.js build.

Therefore V1 does **not** skip `scripts/**`.

This preserves the current Vercel build/type-check safety net for operator and research scripts.

A future revision may move script validation into dedicated CI and then reconsider this rule.

---

## 7. Data and artifact rule

Entire `data/**` remains BUILD in V1.

Known production dependencies include:

- GhostFlow committed artifacts
- GhostFlow snapshot inputs
- GhostYield candidate JSON
- GhostRegime replay seed history

Do not use commit-message wording such as `research:`, `artifact:`, `chore:`, or `[skip ci]` to bypass this rule.

Changed paths are the authority.

---

## 8. Reports

`reports/**` is initially safe to skip because the audited tracked reports are research/audit outputs and no deployed app/build code imports or filesystem-reads them.

If a future runtime or build dependency is introduced, remove `reports/**` from the allowlist before relying on the new dependency.

---

## 9. GitHub workflows

`.github/workflows/**` is initially safe to skip from the Vercel web-build perspective because workflow YAML does not alter the Next.js application artifact.

This does not mean workflow changes are low-risk.

Workflow changes must still receive appropriate GitHub/operational review. Vercel is not the validator for workflow semantics.

---

## 10. Cursor / agent operating rule

For every PR touching Ghost Allocator, report one of:

- `Vercel expected: BUILD` — at least one changed path is runtime-relevant or unclassified.
- `Vercel expected: SKIP` — every changed path is in the approved safe-skip allowlist.

If unclear:

**BUILD**

This classification never replaces normal tests, review, workflow safety checks, data validation, or production writer controls.

`Vercel expected: BUILD|SKIP` is a **path classification**. It predicts what the Ignored Build Step should decide when valid comparison context is available. It is **not** a claim that production was rebuilt or that the GitHub Vercel check proves deployment.

---

## 11. Implementation pattern

Use Vercel's **Ignored Build Step** with:

```bash
bash scripts/vercel-ignore-build.sh
```

provided the live Vercel Root Directory is confirmed to be the repository root.

The script contract is:

- exit `0` -> SKIP
- exit `1` -> BUILD

The script must:

1. compare the deploying SHA against `VERCEL_GIT_PREVIOUS_SHA`
2. use `git diff --no-renames`
3. enumerate every changed path
4. skip only when every path is allowlisted
5. build on any ambiguity or error
6. print a short BUILD/SKIP reason

Do not use commit-message-only filtering.

---

## 12. Rollout sequence

1. Add this policy. **Done** (PR **#191**).
2. Add `.cursor/rules/vercel-deployment-hygiene.mdc`. **Done**.
3. Add `scripts/vercel-ignore-build.sh`. **Done**.
4. Review in a normal PR. **Done**.
5. The implementation PR itself must BUILD. **Done** (contains `scripts/**`).
6. Merge only after independent QA. **Done** — merge commit `54ec99162c11a020e14c61276d6230ec5fdd15ee`.
7. Confirm the Vercel Root Directory in the dashboard. **Done** (repository root).
8. Configure the Ignored Build Step. **Done** — command: `bash scripts/vercel-ignore-build.sh`.
9. Test docs-only Markdown change -> SKIP. **Passed** (2026-09-05 live smoke).
10. Test harmless runtime-path change (`app/**`) -> BUILD. **Passed** (2026-09-05 live smoke).
11. Delete the temporary test branch. **Done**.
12. Do not broaden the allowlist until live behavior is confirmed. **Still in force** — V1 allowlist remains intentionally conservative; `scripts/**` remains BUILD; uncertainty fails open to BUILD.

### Live activation record (2026-09-05)

| Item | Result |
|------|--------|
| Ignored Build Step | **Live** |
| Command | `bash scripts/vercel-ignore-build.sh` |
| Docs-only Markdown smoke | **SKIP** |
| Runtime `app/**` smoke | **BUILD** |
| Temporary smoke-test branch | **Deleted** |
| Allowlist / script | **Unchanged** after activation |

---

## 13. Out of scope

This policy does not authorize changes to:

- GhostRegime methodology or thresholds
- VAMS logic
- GhostFlow scoring
- GhostFlow production artifacts
- GhostYield logic/data
- Builder allocation math
- workflow schedules
- production writers
- secrets/environment variables
- deployment retention
- production branch
- Preview deployment policy
- database state

The goal is only to eliminate redundant Vercel web builds.

---

## 14. Success criteria

The repair is successful when:

- docs-only Markdown work skips Vercel after a branch has a usable previous deployment SHA
- runtime/data changes continue to build
- mixed docs + runtime changes build
- non-Markdown files under `docs/**` build
- script-only TypeScript changes build in V1
- unknown paths build
- rename/move edge cases cannot hide a runtime deletion
- the filter fails safely on missing Git/Vercel context

---

## 15. Post-merge deployment verification

Pre-merge **expected classification** and post-merge **observed deployment** are distinct facts.

### Expected classification (pre-merge)

- `Vercel expected: BUILD`
- `Vercel expected: SKIP`

Path-based. Requires a usable previous SHA to skip. Fail-open BUILD when comparison context is missing is **by design**.

### Observed outcomes (post-merge)

Use exactly one:

| Outcome | Meaning |
|---------|---------|
| **DEPLOYED** | Expected BUILD actually ran: ignored-build = BUILD; Vercel build ran; state = READY; target = production; deployment commit SHA matches the intended main/merge SHA; production alias (`ghost-allocator.vercel.app`) points to that READY deployment. For user-facing/runtime changes, also verify the affected live route or endpoint when practical. |
| **SKIPPED AS EXPECTED** | Expected SKIP actually skipped: ignored-build = SKIP; Vercel canceled/ignored the build because the command returned exit `0`; the skipped commit did **not** become the production serving artifact. Normally the production alias remains on the previous valid READY deployment. If a newer valid production deployment superseded that prior serving deployment before verification, that is also acceptable when its commit/deployment provenance is clear. No runtime artifact change was expected from the skipped merge. `main` may now be ahead of the production serving commit. That is **normal** after a docs-only skipped merge. Do **not** label that as stale production. Skip classification still requires authoritative ignored-build evidence; CANCELED alone is not enough. |
| **FAIL-OPEN BUILD AS DESIGNED** | A change classified as expected SKIP still built because the ignore script could not safely establish comparison context (known example: `VERCEL_GIT_PREVIOUS_SHA` unavailable). A first branch Preview may therefore BUILD even for docs-only changes. Do **not** weaken the script to prevent this. |
| **STOP — DEPLOYMENT MISMATCH** | Actual behavior conflicts with policy and cannot be explained by an intentional fail-open or a newer superseding deployment. Examples: expected BUILD but the latest relevant main deployment is skipped/canceled with no newer valid superseding deployment; expected SKIP but valid comparison context exists and the ignore script incorrectly chooses BUILD; production alias does not point where expected; deployment commit does not match the intended runtime merge; deployment state is failed/error; state is ambiguous and logs do not establish what happened. |

### GitHub status is not deployment proof

A green GitHub check **`Vercel: success`** means the GitHub/Vercel integration check completed successfully.

It does **not** by itself prove:

- a build ran
- a deployment reached READY
- production changed
- the production alias moved
- the merge commit is the currently serving artifact

Never use that check alone as deployment verification.

### CANCELED is not automatically a skip

Do **not** define every CANCELED deployment as a successful skip. A deployment may be canceled for other reasons.

To report **SKIPPED AS EXPECTED**, require evidence such as the build log showing:

- Ignored Build Step ran
- script classified SKIP
- Vercel canceled because the command returned exit code `0`

or equivalent authoritative evidence.

If the CANCELED reason is unknown: investigate; do not guess.

### Preview vs production

Preview deployment behavior is useful QA but is **not** proof of production state.

A first branch Preview may fail open to BUILD because `VERCEL_GIT_PREVIOUS_SHA` is unavailable.

Production verification after merge must evaluate the **main-branch deployment** and **production alias** separately.

Do not call a READY Preview a production deployment.

### Production serving commit

**Production serving commit** is the Git commit associated with the READY deployment currently holding `ghost-allocator.vercel.app`.

It may legitimately differ from current GitHub `main` after a docs-only SKIP.

Example after PR **#198**:

- GitHub `main`: `9fc69bd804c9ccb87480f271455ed04148a1c41d`
- Production serving runtime commit: `6db31a86d8f65e26fc6bab1df9bb261ec5b680dc`

This is correct because #198 changed only documentation and was skipped.

After merge, inspect: deployment state, deployment commit, target, production alias, and ignored-build logs when needed.

---

## 16. 2026-09-08 production observation record

V1 Ignored Build Step behavior is **working as designed**. The defect repaired here is **verification/reporting semantics**, not the filter.

| Event | Expected | Ignored Build Step | Deployment | Alias | Observed |
|-------|----------|--------------------|------------|-------|----------|
| **#197** runtime merge `6db31a8…` | BUILD | BUILD (runtime/build-relevant paths) | Production READY `dpl_CjB4bQi1CduEdgpSwsB9RjGAiat5`; `vercel build` ran; SHA `6db31a8…` | Alias includes `ghost-allocator.vercel.app` | **DEPLOYED** (live `/income-factory` served post-#197 GhostYield values) |
| **#198** docs merge `9fc69bd…` | SKIP | SKIP: every changed file in approved V1 non-runtime allowlist (`docs/project-ops/{DECISIONS,HANDOFF,STATUS}.md`) | Production `dpl_B77Qqy8S4377jRgMFuc9pF1vC2zd` **CANCELED** because Ignored Build Step returned exit `0` | Alias stayed on prior READY #197 deployment | **SKIPPED AS EXPECTED** (GitHub still showed `Vercel: success`) |
| **#198** first branch Preview `50ad1f8…` | SKIP path classification | BUILD: `VERCEL_GIT_PREVIOUS_SHA` is unavailable | Preview READY `dpl_Gqyfth8vvnssaLweTWwr9e4CZ5qq` (target preview / null production) | Not production | **FAIL-OPEN BUILD AS DESIGNED** |

Do not rewrite historical V1 activation evidence in §12.

A path classification of `Vercel expected: SKIP` does **not** guarantee that a first branch Preview will skip when Vercel lacks a usable previous SHA. That fail-open is intentional. Do not “fix” it.
