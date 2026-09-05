# Ghost Allocator Vercel Deployment Hygiene Policy

**Status:** Proposed V1 source-of-truth policy  
**Created:** 2026-09-05  
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

1. Add this policy.
2. Add `.cursor/rules/vercel-deployment-hygiene.mdc`.
3. Add `scripts/vercel-ignore-build.sh`.
4. Review in a normal PR.
5. The implementation PR itself must BUILD.
6. Merge only after independent QA.
7. Confirm the Vercel Root Directory in the dashboard.
8. Configure the Ignored Build Step.
9. Test docs-only change -> SKIP.
10. Test harmless runtime-path change -> BUILD.
11. Delete the temporary test branch.
12. Do not broaden the allowlist until live behavior is confirmed.

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
