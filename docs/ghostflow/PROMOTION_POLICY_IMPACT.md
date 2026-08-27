# GhostFlow Candidate Promotion Policy — Impact Inventory

**Status:** Decision record + read-only implementation impact audit.

> **THIS MEMO DOES NOT AUTHORIZE OR PERFORM ANY PRODUCTION ARTIFACT WRITE.**

**Recorded:** 2026-08-26  
**Starting `main`:** `70d8ade488a70c1f92015a8454864314d90db1d5` (signed merge of PR **#148**; PRs **#140–#148** merged)  
**Decision gate:** Closed by [DECISIONS.md](../project-ops/DECISIONS.md) entry *2026-08-26 — GhostFlow candidate promotion policy*

Cross-references:
- [CANDIDATE_GENERATION_DESIGN.md](./CANDIDATE_GENERATION_DESIGN.md) (architecture; promotion section partially superseded for initial PR C)
- [CANDIDATE_MAPPING_POLICY_IMPACT.md](./CANDIDATE_MAPPING_POLICY_IMPACT.md) (PR A mapping gate)
- Merged PR **#148** candidate modules under `lib/ghostflow/refresh/candidates/`

---

## 1. Approved promotion policy

Bobby approved on **2026-08-26** (full text in DECISIONS). Summary:

| Area | Rule |
|------|------|
| **A. Eligible status** | Promote **only** `ready_for_review`. Never promote `revision_review_required`. |
| **B. Explicit envelope** | `--envelope <path>` required. No latest / artifact-only / scan / hash-prefix auto-select. |
| **C. Dry-run default** | Validate without write unless `--apply`. Non-interactive. |
| **D. Envelope revalidation** | Independently verify envelope integrity; do not trust typing. |
| **E. Remap under current code** | Re-run current mapper + validator; require exact reviewed promotion hash. |
| **F. No network** | No fetch/parse/normalize against live sources during promotion. |
| **G. Optimistic lock** | Current production must still match `envelope.currentProduction`; registry owns destination. |
| **H. Newer date** | Candidate `asOf` must be **>** current production `asOf`. |
| **I. Exact payload** | Write only the validated remapped production artifact; no transforms. |
| **J. Write scope** | Exactly one registry-owned `*.v1.json`. No scores/MOCK/ref/publicSignalCount. |
| **K. Atomic write** | Fail-closed temp → replace → read-back verify. |
| **L. No history yet** | No accepted-history / receipts / provenance DB. |
| **M. No Git automation** | Human inspects diff and opens production-artifact PR. |
| **N. Mechanism only** | PR C must not promote current local candidates. |
| **O. Still blocked** | Same-date promotion, history, auto-promote, VIX, breadth/Gate C, scoring changes. |

---

## 2. Authorization boundary

**Authorized by this decision (future coding PRs):**

- Promotion validation / dry-run plan
- Explicit `--apply` production writer for the three candidate-enabled artifacts
- Offline tests and CLI plumbing for promotion
- Fail-closed replacement of **one** registry-owned production path at a time

**Not authorized:**

- Promoting any currently generated local envelopes as part of the mechanism PR
- Accepted-history / provenance receipts
- Same-date / `revision_review_required` promotion
- Automatic candidate selection, PR creation, workflows, Git mutations
- `GHOSTFLOW_REFERENCE_AS_OF`, scores, MOCK, `publicSignalCount` changes
- VIX / `marketBreadth` / Gate C
- Networked source refresh during promotion

---

## 3. Eligible candidate status

| Status | Initial PR C |
|--------|--------------|
| `ready_for_review` | Eligible (subject to all other gates) |
| `revision_review_required` | **Rejected** |
| All other generator statuses | Not envelope states / not promotable |

`GhostFlowCandidateEnvelope.status` is already narrowed to `ready_for_review | revision_review_required` (PR **#148**). Promotion must still treat status as evidence and enforce the newer-date gate independently.

Older design-memo language that listed `revision_review_required` as promotable is **superseded** for initial PR C by DECISIONS.

---

## 4. Envelope validation

### Existing helper

`reconcileStoredCandidateEnvelope(...)` in `lib/ghostflow/refresh/candidates/writer.ts` already:

- checks artifactId / observationAsOf / contentSha256 / adapterId / parserVersion consistency between envelope identity and normalized observation
- production-validates `proposedArtifact`
- reconciles `promotionPayloadSha256`
- rebuilds identity and checks `identitySha256` + `identityPrefix`

### Decisive recommendation

**Reuse `reconcileStoredCandidateEnvelope` as a building block, but do not overload it as the full promotion gate.**

Add a separate pure function, e.g.:

`validateCandidateEnvelopeForPromotion(envelope): GhostFlowStageResult<ValidatedPromotionEnvelope>`

That function should:

1. Parse / structural-shape check (or accept already-parsed object)
2. Require `candidateVersion === '1'`
3. Require `artifactSchemaVersion === '1'`
4. Require `generationMode === 'operator_fetch'`
5. Require `humanReviewRequired === true`
6. Require `status === 'ready_for_review'`
7. Require `artifactId ∈ GHOSTFLOW_CANDIDATE_ARTIFACT_IDS`
8. Call `reconcileStoredCandidateEnvelope` (or extract shared integrity core if needed to avoid writer coupling)
9. Require `currentProduction` fingerprint shape (`artifactId`, `artifactPath`, `observationAsOf`, `promotionPayloadSha256`; optional `sourcePublishedAt`)
10. Require envelope `artifactId` matches `currentProduction.artifactId` and identity/normalized observation

Rationale: writer reconciliation answers “is this stored file internally consistent for idempotent rewrite?” Promotion answers “is this envelope eligible and safe to write into production under current policy?” Separate pure validator keeps promotion free of writer EEXIST semantics.

---

## 5. Mapper replay under current code

### Exact call path (no network)

```
envelope.normalizedObservation
  → GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY[artifactId].map({
       normalized,
       registryEntry: GHOSTFLOW_REFRESH_REGISTRY entry for artifactId
     })
  → validateProposedProductionArtifact(artifactId, mapped)
  → sha256HexFromCanonicalJson(validatedArtifact)
  → require hash === envelope.candidateIdentity.promotionPayloadSha256
     (and === hash of envelope.proposedArtifact after validation)
```

### Reuse confirmation

- `GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY` can be reused directly.
- Mappers are pure: they take normalized observation + registry entry; they do not fetch.
- PR A provenance guards (`reconcileCandidateMapperProvenance`) remain active — adapterId / parserVersion / sourceLocator mismatches fail closed.

### Stale mapping semantics

If any of the following change after the envelope was generated:

| Change | Expected promotion outcome |
|--------|----------------------------|
| Active adapter ID | Mapper provenance fail → fail closed |
| Parser version | Mapper provenance fail → fail closed |
| Source locator policy | Mapper provenance fail → fail closed |
| Mapper transformation code | Hash mismatch vs reviewed payload → fail closed |
| Board source / production validator contract | Validator or hash fail → fail closed |

**Operator action:** regenerate candidate under current code. **Do not** invent compatibility migrations inside promotion.

---

## 6. Current-production optimistic lock

### Recommended future contract

`validateCurrentProductionAgainstEnvelope(envelope, repoRoot)`:

1. Resolve registry entry for `envelope.artifactId`
2. Reject if `envelope.currentProduction.artifactPath !== registry.artifactPath`
3. Load registry destination file (not an envelope-supplied absolute path)
4. `validateCurrentProductionArtifact(...)`
5. Canonical fingerprint
6. Require equality with envelope fingerprint fields:
   - `artifactId`
   - `artifactPath`
   - `observationAsOf`
   - `promotionPayloadSha256`

### `sourcePublishedAt` recommendation

**A — required to match when present in the envelope.**

If `envelope.currentProduction.sourcePublishedAt` is present, require equality with the validated current production `publishedAt` / fingerprint `sourcePublishedAt`.

If absent in the envelope, do not invent or require a publishedAt match beyond what the production validator already enforces.

Rationale: when recorded, it is part of the reviewed production baseline; ignoring it would allow silent drift of publication metadata after review.

---

## 7. Stale candidate behavior

| Condition | Status / issue code | Write? |
|-----------|---------------------|--------|
| Current production fingerprint ≠ `envelope.currentProduction` | `promotion_stale_current_production` | No |
| Registry path ≠ envelope recorded path | same family / path mismatch | No |

Operator action: regenerate candidate against current production. Do not overwrite, auto-merge, or mutate the envelope.

Recommended CLI exit: **3** (see §12).

---

## 8. Newer-date gate

Independently enforce:

```
candidateAsOf > currentAsOf
```

| Relation | Outcome |
|----------|---------|
| newer | continue |
| same | fail (`promotion_date_not_newer`) |
| older | fail (`promotion_date_not_newer`) |

Even when `status === ready_for_review`. No same-date promotion in initial PR C.

---

## 9. Explicit envelope-path policy

Preferred initial path policy (aligned with PR **#148** writer guard):

- Envelope path must resolve beneath `<repo-root>/tmp/ghostflow/`
- Prefer `<repo-root>/tmp/ghostflow/candidates/` as the normal location
- Allow nested dirs under `tmp/ghostflow/` because generator `--out-dir` already permits nested dirs within that root
- Reject `..` traversal and absolute paths outside the allowed root
- Do **not** follow an envelope field as production destination

Symlink/junction hardening: **not required** for initial local operator mode (same stance as PR **#148**). Lexical containment is the boundary.

---

## 10. Dry-run contract

Dry-run and apply must share **one** validation path:

```
parse envelope
→ validateCandidateEnvelopeForPromotion
→ mapper replay + hash equality
→ validateCurrentProductionAgainstEnvelope
→ newer-date gate
→ PromotionPlan
```

Then:

- **dry-run:** return plan; write nothing
- **apply:** consume the already-validated plan → atomic replace → post-write verification

### Recommended `PromotionPlan` fields (no market values)

- `artifactId`
- `candidateIdentitySha256` / prefix
- `currentObservationAsOf`
- `candidateObservationAsOf`
- `currentPromotionPayloadSha256`
- `proposedPromotionPayloadSha256`
- `destinationPath` (registry-owned relative + resolved absolute under repo)
- `validatedProposedArtifact` (in-memory; not printed)
- `apply: boolean`

Avoid separate dry-run vs apply validation implementations.

---

## 11. CLI contract

```bash
npm run ghostflow:promote-candidate -- --envelope <path> [--apply]
```

| Rule | Detail |
|------|--------|
| `--envelope` | Required; exactly one |
| Default | Dry-run |
| `--apply` | Required for write |
| Reject | `--artifact`, `--latest`, `--all`, `--production-path`, `--force`, `--yes`, `--skip-validation`, unknown args |
| Interaction | None |

### Stdout JSON (hygiene)

Dry-run example fields:

```json
{
  "artifactId": "systematicFlowProxy",
  "status": "promotion_dry_run_ok",
  "candidateIdentitySha256": "...",
  "currentObservationAsOf": "2026-06-30",
  "candidateObservationAsOf": "2026-08-18",
  "destinationPath": "data/ghostflow/artifacts/systematicFlowProxy.v1.json",
  "apply": false,
  "exitCode": 0
}
```

Apply success adds write confirmation (`apply: true`, `status: promotion_applied` or equivalent). Include issue codes on failure. **No** market values, contract rows, yields, raw normalized fields, or secrets.

---

## 12. Exit-code recommendation

Candidate-generation exit codes (0–6) are overloaded for generator semantics. Promotion should use a **small dedicated model**:

| Exit | Meaning |
|------|---------|
| **0** | Dry-run valid **or** apply successful |
| **1** | CLI usage / unexpected internal / uncontrolled filesystem error |
| **2** | Envelope invalid or ineligible (`revision_review_required`, bad version/mode, integrity fail, path unsafe) |
| **3** | Stale current production (`promotion_stale_current_production`) |
| **4** | Mapper replay / current-policy mismatch (hash or provenance) |
| **5** | Production validator / pre-write hash mismatch (non-stale validation failure) |
| **6** | Post-write verification failure |

No exit code means “same-date revision promoted” — that action is unauthorized.

Date-not-newer failures should map to **2** (ineligible) or a dedicated issue under exit **2**; do not invent a same-date success path.

---

## 13. Registry-owned destination

| Artifact | Registry `artifactPath` |
|----------|-------------------------|
| `systematicFlowProxy` | `data/ghostflow/artifacts/systematicFlowProxy.v1.json` |
| `treasuryFuturesPositioningProxy` | `data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json` |
| `treasuryLongEndIncomeLens` | `data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json` |

Promotion must:

1. Derive destination from `GHOSTFLOW_REFRESH_REGISTRY`
2. Reject envelope `currentProduction.artifactPath` mismatch
3. Never accept `--production-path`
4. Change exactly one file on successful `--apply`

---

## 14. Serialization contract

**Canonical hash (identity / lock):** `sha256HexFromCanonicalJson` — sorted keys; not pretty-file bytes.

**Production file bytes (observed style):** existing committed artifacts use pretty JSON (`JSON.stringify(..., null, 2)` ending with `}\n` / trailing newline). Preferred write:

```ts
JSON.stringify(validatedProposedArtifact, null, 2) + '\n'
```

Do **not** hash the pretty file. After write, parse → production-validate → canonical-hash and require equality to the reviewed promotion payload hash.

Mapper output key order may differ from sorted canonical form; that is fine for file serialization as long as parsed semantic object hashes match.

---

## 15. Atomic write / Windows behavior

### Repository evidence

- Runtime probe on this operator environment: **Node v22.18.0**, Windows/PowerShell.
- `fs.renameSync(temp, existingTarget)` **overwrote** the existing destination successfully in a local probe (Node 22 on this machine).
- No existing GhostFlow production atomic-replace helper.
- Candidate writer uses `writeFile(..., { flag: 'wx' })` (create-new only) — not a replace pattern.
- GhostRegime persistence uses direct `writeFileSync` — **not** a pattern to copy for GhostFlow production.

### Recommended strategy (C2)

1. Serialize validated proposed artifact to bytes
2. Write temporary sibling under the same directory (e.g. `<artifact>.v1.json.<tmpSuffix>`)
3. Read temp back; parse; production-validate; canonical-hash must match plan
4. Replace registry target via `rename` (Node 22 Windows overwrite behavior observed)
5. Read production target; parse; validate; hash; asOf checks
6. Delete temp only after successful replace (or ensure failed temp is cleaned)

### Limitation label

**Best-effort atomicity under observed Node 22 Windows rename-overwrite semantics — not a cross-platform POSIX guarantee encoded as a dependency.**

If a future supported Node/Windows combination fails rename-overwrite, C2 must fail closed and document the alternative (controlled unlink + rename) with tests. **Do not add a dependency solely for atomic rename** unless a later decision justifies it.

No persistent backup files in the repository tree.

---

## 16. Post-write verification

Mandatory after `--apply`:

1. Read registry destination
2. Parse JSON
3. Production validator passes
4. Canonical hash equals intended `promotionPayloadSha256`
5. Artifact `asOf` equals intended candidate observation date

Failure → exit **6**, hard failure surfaced in JSON summary.

---

## 17. Failure / rollback semantics

| Phase | Failure behavior |
|-------|------------------|
| Pre-write validation | No production mutation |
| Temp write / temp verify | Leave production untouched; clean temp if practical |
| Replace / post-write verify fail | Hard failure (exit 6) |

**Do not claim guaranteed rollback.** Optional best-effort: hold original production bytes in memory before replace and attempt restoration if post-write verification fails — document as **best-effort only**, not a durability guarantee. Prefer preventing bad writes via temp-byte verification before replace.

No persistent `.bak` clutter.

---

## 18. No-network enforcement

Promotion modules must **not** import or invoke:

- `DEFAULT_GHOSTFLOW_OPERATOR_ADAPTER_MAP`
- `adapter.fetch` / `parse` / `normalize`
- network helpers / live HTTP clients

Allowed dependency direction:

```
envelope JSON
→ candidates integrity helpers (canonicalJson, identity, artifactValidation, reconcile)
→ candidateMappers registry (pure map)
→ GHOSTFLOW_REFRESH_REGISTRY (path + entry metadata)
→ production filesystem I/O
```

**Import falsifiers:** any promotion file importing `operatorRunner` for adapters, or any adapter module’s fetch path, violates this boundary.

---

## 19. History / provenance boundary

Registry entries for the three artifacts still declare `historyPolicy: 'accepted_normalized_observation'`. That is **not** authorization to write history in PR C.

**Must not write:**

- `data/ghostflow/history/`
- `data/ghostflow/research/` (operator research scripts remain separate)
- promotion receipts
- accepted normalized observation files
- source-hash history stores

**Unavailable until later decision:**

- Byte-only same-date revision baseline from accepted source hashes
- Promotion receipts / audit artifacts outside production JSON

---

## 20. Actual-refresh boundary

PR C (mechanism) **must not** modify:

- `data/ghostflow/artifacts/systematicFlowProxy.v1.json`
- `data/ghostflow/artifacts/treasuryFuturesPositioningProxy.v1.json`
- `data/ghostflow/artifacts/treasuryLongEndIncomeLens.v1.json`

Local `tmp/ghostflow/candidates/*.candidate.json` envelopes remain review artifacts and must not be committed.

After mechanism merges: separately review each candidate, dry-run, `--apply`, inspect git diff, open a human production-artifact PR (prefer one artifact per PR).

---

## 21. Test plan

Offline only. No network.

### Envelope

- `ready_for_review` accepted
- `revision_review_required` rejected
- wrong `candidateVersion` / `artifactSchemaVersion` / `generationMode` rejected
- `humanReviewRequired: false` rejected
- tampered identity / proposedArtifact / normalized provenance rejected

### Mapper replay

- current mapper reproduces reviewed payload hash
- mismatched mapped payload fails
- stale adapter/parser provenance fails

### Current production lock

- exact reviewed current production succeeds
- changed production hash → stale
- changed asOf → stale
- artifact path mismatch fails
- artifactId mismatch fails
- envelope `sourcePublishedAt` present → inequality fails

### Date

- newer accepted; same rejected; older rejected

### Dry-run (C1)

- all validation runs
- production file bytes unchanged

### Apply (C2)

- exactly registry target changes
- written bytes parse + validate
- post-write hash equals reviewed candidate
- no second artifact changes
- invalid / stale / mapper mismatch / validator fail → no write
- temp/write failure → no production corruption
- post-write failure surfaced (exit 6)

### CLI

- `--envelope` required; `--apply` optional; dry-run default
- unknown args rejected; no `--force` / `--latest`
- unsafe envelope path rejected

---

## 22. Exact expected implementation files

### Recommended layout

| File | Role |
|------|------|
| `lib/ghostflow/refresh/promotion/types.ts` | Plan / status / summary types |
| `lib/ghostflow/refresh/promotion/envelopeValidation.ts` | Promotion-specific envelope gate (+ reuse integrity helpers) |
| `lib/ghostflow/refresh/promotion/plan.ts` | Shared validate → `PromotionPlan` (dry-run + apply input) |
| `lib/ghostflow/refresh/promotion/cliArgs.ts` | Pure CLI parser |
| `lib/ghostflow/refresh/promotion/writer.ts` | **C2 only** — atomic replace + post-write verify |
| `scripts/ghostflow/promote-candidate.ts` | CLI entry |
| `lib/ghostflow/__tests__/promotion/*.test.ts` | Offline tests |
| `package.json` | Add `ghostflow:promote-candidate` (+ test chain entries) |

### Reuse without redesign

- `canonicalJson.ts`, `identity.ts`, `artifactValidation.ts`
- `reconcileStoredCandidateEnvelope` (or extracted shared integrity core)
- `GHOSTFLOW_CANDIDATE_MAPPER_REGISTRY`
- `GHOSTFLOW_REFRESH_REGISTRY`
- `GHOSTFLOW_CANDIDATE_ARTIFACT_IDS` / path resolver patterns from candidates writer

Do **not** modify candidate mappers, operator runner behavior, planner, report, or production JSON in the mechanism PRs.

---

## 23. ONE PR vs C1/C2 recommendation

### Decisive recommendation: **C1 DRY-RUN + C2 WRITER**

**Evidence:**

1. This is the **first** GhostFlow production-writer capability — blast radius is high.
2. Repository has **no** existing production atomic-replace helper to copy.
3. Windows rename-overwrite works on probed Node 22, but replace + post-write verify + failure semantics still need dedicated tests and careful review.
4. Dry-run validation (envelope gate + mapper replay + optimistic lock + date gate) is independently reviewable and operationally useful before any write lands.

| PR | Scope |
|----|-------|
| **C1** | Envelope validation, mapper replay, production lock, date gate, `PromotionPlan`, CLI dry-run, tests — **no production writes** |
| **C2** | `--apply` writer, temp sibling replace, post-write verification, apply CLI path, write-path tests |

Do **not** collapse to one PR merely for convenience.

---

## 24. Acceptance criteria

### C1 (dry-run)

- Explicit `--envelope` only; dry-run default
- Rejects `revision_review_required` and ineligible envelopes
- Replays current mapper; requires exact reviewed promotion hash
- Optimistic-locks current production; fails stale
- Enforces newer-date gate
- No network imports/calls
- No production file mutation
- Offline tests green; `ghostflow:check` / lint / build green

### C2 (apply)

- Shares C1 validation path
- Writes exactly one registry destination
- Fail-closed temp → replace → read-back verify
- Post-write failure is hard fail
- No history/Git/workflow automation
- Mechanism PR still does not promote current live candidates as its own data change

---

## 25. Remaining blocked decisions

- Same-date / `revision_review_required` promotion policy
- Accepted-history / provenance receipt timing and format
- Automatic promotion / workflow / PR automation
- Whether to emit defensible CFTC/Board `sourcePublishedAt` from adapters
- When to promote Long-End production from legacy FRED → Board-native (separate human data PR after mechanism exists)
- Breadth / Gate C / VIX authorization

---

## 26. Falsifiers

This audit is wrong / must stop if implementation would require:

- Network fetch during promotion to “refresh” observations
- Promoting without explicit envelope path
- Treating `revision_review_required` as eligible without a new DECISIONS entry
- Writing history because `historyPolicy` is present on registry rows
- Accepting envelope-supplied production destination over registry
- Same-date overwrite without a new policy decision
- Git commit/PR/workflow automation inside the promote command
- Changing scores / MOCK / reference date / `publicSignalCount` as part of promotion
- Shipping production JSON changes inside the mechanism PR itself

---

*End of impact inventory. No production artifacts were modified by this docs PR.*
