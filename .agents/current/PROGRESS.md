# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Runtime defect Issue #565 is closed completed.
- PR #566 squash-merged to `main` as `263fe7457d741d184885810a779ee7d3b79593ab`.
- PR-head CI #3692 passed on final developer head `dc542fce338eb4643607b494c5394e66f7ed7391`.
- Exact-main CI #3693 / run `31976365610` passed completely on merge SHA `263fe745…`, including both UI shards, Lesson completion, Visual regression, accessibility, iOS PWA, CSP/service worker, performance, backend and container builds.
- Deploy Stage #3545 / run `31976845035` was triggered from the same exact SHA after successful main CI and is currently the runtime delivery gate being observed separately.
- Draft PR #564 remained test/provenance-only but became non-mergeable after #566 changed the same visual evidence file.
- #564 had no reviews or review threads and its old head was unchanged at `fafec6e19f9195b73b79eb0d75a69ffd09d74b30` before reconstruction.

### Reconstruction on new main

- Force-moved only feature branch `feat/issue-563-first-use-parity` to exact new `main` `263fe745…` after recording the old head and confirming no review-layer work would be lost.
- Reapplied the canonical First Use OpenPencil provenance contract to `frontend/e2e/first-use-visual.spec.ts`.
- Preserved the active OpenPencil node/route/geometry validation and canonical desktop viewport 1440×900.
- Preserved the corrected Resume fixture that selects local `Не уверен` before capture.
- Replaced the two stale pre-fix Resume starting hashes with the manually reviewed #566 runtime fingerprints:
  - Light: `320524d4c4fe03f5bd086bac871957854f31f08f3b4e7a00d05071a1a627e466`
  - Dark: `6827f78bb2f4beb3304b0b939ebaa5a19d4577c9f68fd406525ba4b67525b545`
- Compact and Guest starting hashes remain unchanged until exact canonical Linux evidence proves otherwise.
- No runtime/backend/API/design/workflow/deploy file is part of the reconstructed #564 scope.

### Why another Linux review is still required

The two Resume hashes above were manually approved for the legacy 1440×1024 runtime fixture after #566. PR #564 intentionally changes the evidence domain to canonical OpenPencil 1440×900 and selects `Не уверен` before capture. Therefore any new desktop hashes emitted by #564 still require a fresh exact Linux PNG review before approval; inheriting the #566 hashes does not pre-approve the canonical evidence.

### Current branch head

Resolve from the live feature branch ref after the final execution-record write.

### Next action

Finish the #564 harness execution record and verify the reconstructed diff/base. Then run immutable-head CI. If Visual regression fails only the expected canonical desktop hashes, download the exact Linux artifact, manually compare each changed PNG to its active OpenPencil node, approve only reviewed hashes, rerun full immutable-head CI, audit reviews/threads and merge with expected-head protection. Stage redeploy is not required for #564 because it is test/evidence-only.
