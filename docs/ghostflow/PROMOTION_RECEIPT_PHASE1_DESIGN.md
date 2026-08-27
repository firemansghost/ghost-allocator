# GhostFlow Phase 1 Promotion Receipt — Design

**Status:** Authorized design record — **no implementation in this PR**.  
**Decision:** [DECISIONS.md](../project-ops/DECISIONS.md) — *2026-08-27 — GhostFlow Phase 1 promotion receipt policy*  
**Starting `main` for this design:** `e4dc0e9f043bcdd3d8987ab4f135c2780a2a92d6`  
**Cross-references:** [PROMOTION_POLICY_IMPACT.md](./PROMOTION_POLICY_IMPACT.md), [CANDIDATE_GENERATION_DESIGN.md](./CANDIDATE_GENERATION_DESIGN.md)

> This memo does **not** modify the promotion writer, produce receipt files, change production artifacts, or authorize same-date promotion / automation / score wiring.

---

## 1. Problem statement

After a successful human promotion cycle:

1. `ghostflow:promote-candidate -- --apply` replaces exactly one registry-owned `data/ghostflow/artifacts/<id>.v1.json`.
2. The reviewed candidate envelope (identity, durable provenance including source `contentSha256`, prior production fingerprint, factual diff) typically lives only under gitignored `tmp/ghostflow/candidates/`.
3. Production JSON does **not** retain accepted source `contentSha256` / adapter / parser provenance for the promote transition.
4. Git history of production JSON alone is therefore **insufficient** to reconstruct a complete receipt without the original envelope or other independently sufficient evidence.

Phase 1 closes the audit gap for **future** promotions by adding a deterministic, Git-tracked **verified promotion receipt** sidecar — without broadening `--apply` write scope or encoding approval into runtime.

---

## 2. Terminology

| Term | Meaning |
|------|---------|
| **Promotion receipt** / **verified promotion receipt** | Deterministic sidecar proving a reviewed candidate is consistent with the **verified current production state** after successful local `--apply`. |
| **Not:** accepted provenance / accepted history / human approval record | Those imply organizational acceptance. Local receipt creation precedes merge. |
| **Acceptance boundary** | Human-reviewed Git PR merge of **production JSON + receipt**. |
| **Transition evidence** | What the receipt is: cryptographic/hash reconciliation of prior → promoted production bound to the reviewed envelope identity and source provenance. |

---

## 3. Why a separate post-apply command

### Hard rule: `--apply` stays single-write

Current `--apply` semantics (must be preserved):

- explicit reviewed envelope
- dry-run validation path
- optimistic production re-lock
- exactly one registry-owned production artifact replacement
- production readback validation
- `promotion_applied` success

If `--apply` also wrote the receipt:

1. Production rename can succeed.
2. Receipt write can fail afterward.
3. The command would have a **partial-success** state.
4. The reviewed envelope’s `currentProduction` fingerprint would then be **stale** relative to newly promoted production.
5. Re-running `--apply` would correctly fail closed — and would **not** be a valid receipt recovery path.

Therefore Phase 1 uses a **separate, independently retryable** receipt command after verified apply.

### Human workflow

```
candidate generation
→ human candidate inspection
→ promotion dry-run
→ explicit --apply
→ production post-write verification succeeds
→ explicit receipt command (dry-run then --write)
→ validation
→ inspect git diff
→ human-reviewed PR containing production JSON + receipt
→ merge
```

No Git automation. No PR automation.

---

## 4. Proposed CLI contract

**Proposed script name:** `ghostflow:record-promotion-receipt`  
(Align with existing `ghostflow:*` package scripts; exact filename may follow `scripts/ghostflow/record-promotion-receipt.ts`.)

```text
npm run ghostflow:record-promotion-receipt -- --envelope <exact-path>
npm run ghostflow:record-promotion-receipt -- --envelope <exact-path> --write
```

| Requirement | Rule |
|-------------|------|
| Envelope selection | Explicit `--envelope <path>` only |
| Forbidden selectors | No `latest`, directory scan, artifact-only, hash-prefix auto-pick |
| Network | None |
| Production write | **Forbidden** |
| Git operations | **Forbidden** |
| Default | Dry-run / validation-only (matches promote CLI: writes require explicit flag) |
| Write flag | Explicit `--write` |
| Interactivity | Deterministic / non-interactive |
| Retry | Safe after receipt-write failure without re-applying production |

Dry-run: perform full reconciliation; print planned receipt path + status; write nothing.

---

## 5. Receipt validation / reconciliation sequence

The receipt command must **not** trust the envelope by typing alone. Sequence:

1. Parse envelope; structural / version / `generationMode` / `humanReviewRequired` checks (reuse promotion eligibility helpers where appropriate).
2. Require `status === 'ready_for_review'`.
3. Integrity-validate candidate identity / hashes / provenance (reuse `reconcileStoredCandidateEnvelope` or shared integrity core).
4. Load current registry entry for `artifactId` (registry owns production path).
5. Load **current** production from the registry-owned path.
6. Production-validate current production.
7. Re-run the **current** candidate mapper against `envelope.normalizedObservation` + current registry.
8. Require mapped production canonical `promotionPayloadSha256` **===** `envelope.candidateIdentity.promotionPayloadSha256`.
9. Require **current** production canonical promotion hash **===** that same candidate promotion hash.
10. Require **current** production `observationAsOf` **===** envelope candidate `observationAsOf`.
11. Reconcile `sourcePublishedAt` / production `publishedAt` when present (same optional semantics as production mapping policy — no fabrication).
12. Require `envelope.currentProduction` prior fingerprint to be internally valid; **record it** on the receipt as `priorProduction`.

### Critical difference from promotion planning

| Gate | Promotion `--apply` | Receipt command |
|------|---------------------|-----------------|
| Newer-date (`candidateAsOf > currentAsOf`) | **Required** | **Must not apply** |
| Expected date relation after successful apply | candidate newer than *pre-apply* current | `candidateAsOf === currentAsOf` |
| Production write | Yes (one artifact) | Never |

---

## 6. Phase 1 receipt schema

Deterministic fields (conceptual):

```text
receiptVersion: "1"
artifactId
candidateIdentitySha256
candidateIdentityPrefix
candidateObservationAsOf
candidatePromotionPayloadSha256
sourceProvenance:
  sourceId
  sourceLocator
  contentSha256
  adapterId
  parserVersion
priorProduction:
  artifactPath
  observationAsOf
  promotionPayloadSha256
  sourcePublishedAt?   # only if present on envelope.currentProduction
promotedProduction:
  artifactPath
  observationAsOf
  promotionPayloadSha256
  sourcePublishedAt?   # only if present on verified current production
validatorId
reviewedEnvelopeBasename?  # informational only; never trust authority
```

### Explicit exclusions

- No full normalized observations in Phase 1
- No wall-clock `appliedAt` / `recordedAt` (see §7)
- No GitHub identity / approver name
- No production artifact schema changes to embed receipt provenance
- No score / MOCK / reference / `publicSignalCount` fields

Serialization must use the same canonical/pretty conventions chosen for idempotent byte comparison (implementation PR defines exact pretty vs canonical compare; semantic equality is mandatory either way).

---

## 7. Determinism — no wall-clock field

Phase 1 receipt bytes must be a pure function of:

- reviewed envelope (identity + provenance + prior fingerprint)
- verified promoted production fingerprint
- fixed schema / `validatorId`

**Do not** include `appliedAt` or `recordedAt`.

Reasons:

- Identical retry must yield identical receipt bytes for idempotent “already exists”
- Wall-clock timestamps make collision/idempotency comparisons noisy
- Git commit / PR / merge history already supplies durable temporal context

If a future phase believes a timestamp is required, that needs a **separate** decision — not silent addition here.

---

## 8. Receipt path

Preferred shape:

```text
data/ghostflow/promotion-receipts/
  <artifactId>/
    <observationAsOf>.<identityPrefix>.receipt.json
```

Example (illustrative only):

```text
data/ghostflow/promotion-receipts/systematicFlowProxy/2026-08-18.93fbdc5760b0.receipt.json
```

### Containment

- Strictly under `<repo>/data/ghostflow/promotion-receipts/`
- No traversal, sibling escapes, docs paths, external absolute paths
- Must **not** write under `data/ghostflow/artifacts/`
- Envelope path is input evidence only; destination is derived from artifactId + identity fields + path safety (same spirit as promotion destination containment)

---

## 9. Idempotency / collision

| Disk state | Behavior |
|------------|----------|
| Target missing | Write deterministic validated receipt (`wx` / exclusive create where appropriate) |
| Target exists and identical (bytes and/or semantic receipt equality) | Idempotent success / already exists |
| Target exists but differs | **Fail closed** |

Never overwrite a different receipt. Never silently version. Never auto-choose a different filename.

---

## 10. Failure / recovery semantics

| Situation | Production | Receipt |
|-----------|------------|---------|
| Promotion dry-run | unchanged | none |
| Failed `--apply` | unchanged (or fail-closed pre-rename) | none |
| Successful `--apply`, receipt not yet run | local production differs from `main` | may be generated afterward |
| Receipt command validation failure | **not reverted** | none written |
| Receipt write failure after validation | **not reverted** | fix issue; **rerun receipt command only** |
| Abandoned unmerged branch | local only | local receipt ≠ accepted repo history |

No failure-history database in Phase 1.

---

## 11. Git / human acceptance boundary

1. Operator runs `--apply` (production JSON dirty).
2. Operator runs receipt command `--write` (receipt dirty).
3. Operator inspects `git diff` (expect production + receipt; no scores).
4. Human opens / reviews / merges the data PR.

Merge makes the receipt part of **accepted repository history**. The receipt file itself never grants promote authority, score authority, or same-date authority.

---

## 12. Prospective-only history / backfill

Phase 1 is **prospective**.

Do **not** authorize automatic backfill of PRs **#152 / #154 / #156**.

Git production history alone cannot safely invent missing source `contentSha256` / adapter / parser. No fabricated historical provenance.

Any future backfill requires a separate decision/audit using original exact candidate envelopes or other independently sufficient evidence.

**Same-date dependency:** until an artifact has a durable Phase 1 receipt establishing accepted source provenance for a promote cycle, future same-date revision policy **cannot** rely on receipt history for that artifact. Phase 1 does **not** solve that for past promotions.

---

## 13. Same-date policy remains blocked

Preserve generator semantics:

| Relation | Status |
|----------|--------|
| same date + same payload | `no_change` |
| same date + changed payload | `revision_review_required` |

`revision_review_required` remains ineligible for promotion.  
Normal promotion still requires `candidateAsOf > currentAsOf`.  
Receipt implementation does **not** change those gates.

---

## 14. Explicit non-goals

- Changing `applyGhostFlowCandidatePromotion` to write receipts
- Automatic promotion / candidate PRs / workflow receipt writing / Git automation
- Same-date promotion
- Systematic v1.0c score wiring
- Breadth / Gate C / VIX score wiring
- Full accepted-normalized observation history store
- Embedding provenance inside production artifact schemas
- Automatic historical backfill
- Encoding approver identity in receipt bytes

---

## 15. Implementation decomposition (future code PRs)

### Preferred split

**PR R1 — pure core (no production write; preferably no filesystem receipt write if that keeps risk low):**

- receipt types
- pure receipt builder / reconciler
- receipt path safety
- deterministic serialization helpers
- unit tests

**PR R2 — write path:**

- explicit receipt CLI
- exclusive / idempotent receipt writer
- integration tests
- **no** changes to promotion newer-date gate, mapper replay, or `--apply` single-write semantics

If R1+R2 prove small enough for one coherent PR after sizing, a single PR is acceptable **only if** it still:

- does not modify `--apply` to write receipts
- does not unlock same-date / automation / scoring
- keeps dry-run default for the receipt CLI

Do **not** combine with same-date promotion, automation, score wiring, or backfill.

---

## 16. Acceptance criteria (future implementation)

- [ ] `--apply` still writes exactly one production artifact and never a receipt
- [ ] Receipt dry-run writes nothing
- [ ] Receipt `--write` after successful apply produces deterministic path/bytes
- [ ] Post-apply equality gates enforced; newer-date gate **not** reused incorrectly
- [ ] Idempotent identical rewrite; differing collision fail-closed
- [ ] Path containment under `data/ghostflow/promotion-receipts/`
- [ ] No network / Git / production mutation from receipt command
- [ ] Scores / reference / MOCK / `publicSignalCount` unchanged
- [ ] `revision_review_required` still ineligible for promotion

---

## 17. Stop conditions (future implementation)

Stop and escalate if a proposed change would:

- couple receipt write into `--apply`
- add wall-clock fields to Phase 1 receipt bytes without a new decision
- fabricate backfilled provenance
- unlock same-date promotion or automation
- modify production artifact schemas for provenance embedding
- touch Systematic score wiring / breadth / Gate C / VIX

---

## 18. Policy guards (unchanged)

This design changes **none** of:

- `GHOSTFLOW_REFERENCE_AS_OF`
- Composite / Passive / Structural
- `publicSignalCount`
- MOCK values
- Systematic score wiring
- Breadth / Gate C / VIX wiring
- candidate identity tuple semantics
- normal promotion newer-date / eligibility behavior
