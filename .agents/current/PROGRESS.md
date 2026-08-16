# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified runtime delivery

- Runtime defect Issue #565 is closed completed.
- PR #566 squash-merged to `main` as `263fe7457d741d184885810a779ee7d3b79593ab`.
- PR-head CI #3692 passed on final developer head `dc542fce338eb4643607b494c5394e66f7ed7391`.
- Exact-main CI #3693 / run `31976365610` passed completely on merge SHA `263fe745…`, including both UI shards, Lesson completion, Visual regression, accessibility, iOS PWA, CSP/service worker, performance, backend and container builds.
- Deploy Stage #3545 / run `31976845035` passed completely on the same exact SHA: deploy, public endpoints and public browser UI all succeeded.
- Issue #12 reports Stage success and image SHA `263fe7457d741d184885810a779ee7d3b79593ab`.

### #564 reconstruction on corrected runtime

- Draft PR #564 remained test/provenance-only but became non-mergeable after #566 changed the same visual evidence file.
- #564 had no reviews or review threads and its old head was unchanged at `fafec6e19f9195b73b79eb0d75a69ffd09d74b30` before reconstruction.
- Force-moved only feature branch `feat/issue-563-first-use-parity` to exact new `main` `263fe745…` after recording the old head and confirming no review-layer work would be lost.
- Reapplied the canonical First Use OpenPencil provenance contract to `frontend/e2e/first-use-visual.spec.ts`.
- Preserved active OpenPencil node/route/geometry validation and canonical desktop viewport 1440×900.
- Preserved the corrected Resume fixture that selects local `Не уверен` before capture.
- Compare after reconstruction proved `ahead_by=4`, `behind_by=0`, exact merge-base `263fe745…`, with only four allowed evidence/harness files in the diff.
- No runtime/backend/API/design/workflow/deploy file is part of #564.

### Canonical Linux evidence review

- Reconstructed immutable-head CI #3694 / run `31976982547` reached Visual regression on head `972d1a9b13956a004469e56e146aa4278f438282`.
- Frontend core passed lint, typecheck, unit, production build and dependency audit before browser/visual execution.
- Visual regression failed closed only on the four intentionally migrated canonical 1440×900 First Use desktop fingerprints; 77 executed visual checks passed and 132 were skipped by project targeting. No unrelated visual baseline failed.
- Exact Linux artifact: ID `9271382750`, digest `sha256:0ffef81c3306dc08a2c11fe7b1e042d8f5b6a8b241039a5094514b088a40f3cc`.
- Manually reviewed each exact 1440×900 Linux PNG against the active OpenPencil reference for its node before approval:
  - Guest Home Light — `n321` → `1675a56bf2a31716b6ce7c8dc52bffed9f42190e9743ae88a7c411b59046da79`
  - Guest Home Dark — `n493` → `a60bd586f61bf9ecc71bc9f28e8e549593361d2ae3badb8b60faa73c37050063`
  - Diagnostic Resume Light — `n378` → `4da3f3589f396a164a05677dfe545167c1647521afde6b206048d7cd4142eae2`
  - Diagnostic Resume Dark — `n550` → `abe2f9c7c180accf73bb6e7771845a85610a89cdee42e170d12787acc4c62e80`
- The four hashes were updated explicitly after manual review; no snapshot/update mode was used.

### Manual review findings

- Guest Light/Dark preserve the approved two-column route/state ownership, content hierarchy, CTA/link ownership, preview card and canonical 1440×900 geometry with no horizontal overflow or clipping.
- Guest runtime typography/button sizing is not pixel-identical to the design reference, but no new functional/layout ownership defect was found. Accessibility-safe runtime tokens remain intentionally unchanged in this evidence-only PR.
- Resume Light/Dark now structurally match the approved state family after #566: separate intro, one diagnostic surface, locally selected `Не уверен`, saved-progress note, primary save action and skip action; the prior nested-card/progress-track defect is absent.
- Intentional runtime-truth divergences remain documented rather than masked in tests: authenticated runtime does not render guest `Войти`; server-owned `topic` is shown instead of a design-demo sentence because `DiagnosticPrompt` has no sentence field; typography/tone may differ without changing route/action ownership.

### Current branch state

- Reviewed canonical hashes committed in `frontend/e2e/first-use-visual.spec.ts`.
- Current head must be resolved after the final execution-record write; no further repository-file writes are allowed once the final immutable-head CI starts.

### Next action

Update the execution record with the same artifact/review evidence, freeze the resulting branch head, run full immutable-head CI, and require all selected gates including Visual regression to pass. Then audit reviews/threads/comments, mark PR #564 Ready, verify head/base/mergeability and merge with expected-head protection. After merge, require exact-main CI success. Stage redeploy is not required for #564 because it is test/evidence-only.
