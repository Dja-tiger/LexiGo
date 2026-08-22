# Current Task Progress

## 2026-08-22 18:47 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue: #642; Draft PR: #645.
- Base/current `main` for the reconstructed evidence slice: `0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d`.
- Reconstructed evidence head before fingerprint approval: `98282f9bb6a7cea9797cf4fddcf663ec7970d69f`.
- Delivered First Use runtime repair remains Issue #647 / PR #648, squash merge `d05c37351d05e3b76a5e0cf9d03c943cf0cbad40`.
- Active OpenPencil source SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.
- OpenPencil acceptance run `32486519368`, artifact `9448087269`, digest `sha256:6613ec5c6680ff962e2612c366aba454a7ab815212e2b1a763a9f4c085b95689`.
- Canonical nodes: loading `n117/n277/n442/n614`; error `n128/n288/n456/n628`.
- Fresh immutable CI #3983 / run `32582045336` ran on PR head `98282f9bb6a7cea9797cf4fddcf663ec7970d69f` against current base.
- All non-visual CI groups passed: backend unit/security, backend integration, frontend core, both UI shards, Lesson completion, Content security, iOS PWA, Accessibility, Controlled service worker, Performance budgets and Dictionary smoke.
- Visual regression executed 166 tests: 158 passed and exactly the 8 new First Use cases failed only at the intentional `REVIEW_REQUIRED` fingerprint assertion. Aggregate Frontend quality failed only because Visual was intentionally fail-closed.
- Fresh Visual artifact: `9478170455`, digest `sha256:0191bada13f950d617681e92880f42bd9e4c2afaa57152e359889ada3fe7b6f0`.

### Finding

The fresh current-main Linux renders are suitable for approval. Manual side-by-side review against all eight active OpenPencil nodes confirmed the intended hierarchy, copy, controls, theme and canonical viewport. The stale desktop-loading discrepancy from the previous evidence run is gone: both current desktop loading renders show only the canonical desktop loading note and no extra compact `Никакие ответы...` callout.

### Approved Linux fingerprints

- `loading-compact-light` / `n117`: `5ac755583ae348e92dd14af1e28ae97874c3072fb7f6825c36b5a9ef7df9fb8b`
- `loading-compact-dark` / `n277`: `643dcc73be33f1878765f2b6826d41e689f7ebec277ac0ce9777b9161f6d97e3`
- `loading-desktop-light` / `n442`: `448d90d81985018b383454f905371379831f475fbc24be3b1e95822bf11b814d`
- `loading-desktop-dark` / `n614`: `f9f88c3000aad5445d4bd1139cf81face075838b82d3f776d80227aa7c511a9e`
- `error-compact-light` / `n128`: `e4b0f198fff3a41acdca84f23b07b82250affae262a3c95719fed43c1c402e49`
- `error-compact-dark` / `n288`: `03983eea1fc462f0e667deba5246952bfcf247da24a3cef4c3f33eec3320a7b3`
- `error-desktop-light` / `n456`: `1175fc95ac3085e4fc3b748cc4ffd6f4f032fe4dfe29a46d209d18bd1569a3fa`
- `error-desktop-dark` / `n628`: `6cfbf773756e934a50e8b30a30a896399d3efd328fd2c101539d020b89682a06`

### Root cause of prior rejected evidence

The earlier reconstructed branch predated a later CSS specificity reassertion on `main`, so its desktop-loading screenshots were deterministic but stale relative to delivered production CSS. Reconstructing from current `main` changed only the two desktop loading hashes, exactly where the visibility fix applied. The six unaffected hashes remained stable.

### Changed files

The PR remains bounded to the same four allowed paths:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/first-use-visual.spec.ts`

The fingerprint-approval commit changes only the visual owner plus `PROGRESS.md` and `EXECUTION.md`; no runtime, backend, design source, workflow, dependency or snapshot binary is changed.

### Checks passed

- Live `main`, Issue #642, PR #645, CI #3983 and exact artifact provenance audited.
- Fresh artifact digest matches GitHub Actions metadata.
- Exact SHA-256 values were recomputed from the fresh PNG files and mapped to all eight named cases.
- All eight fresh runtime PNGs were manually reviewed side-by-side against their active OpenPencil renders.
- Existing eight previously approved First Use fingerprints remain byte-for-byte unchanged.
- No fuzzy tolerance or snapshot-update mode was used.

### Checks failed

CI #3983 is intentionally red only because the eight reviewed fingerprints were not yet committed. This is expected evidence collection, not a product failure.

### Current branch head

Resolve from the live branch after the fingerprint-approval commit. Its direct parent is `98282f9bb6a7cea9797cf4fddcf663ec7970d69f`.

### Next action

Commit the eight reviewed SHA-256 fingerprints and this evidence record, then require a new immutable-head CI where Visual regression and aggregate Frontend quality both pass. After that, audit `main` drift and all PR review/comment/thread surfaces before marking #645 Ready for Review.
