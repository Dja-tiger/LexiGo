# Issue #652 reconciliation

## Identity

- Issue: #652 `[High][OpenPencil][First Use][Runtime] Hide compact loading note on desktop`
- Runtime PR: #653 `fix(first-use): keep compact loading note off desktop`
- Runtime branch: `fix/issue-652-first-use-loading-note-cascade`
- Runtime base SHA: `3f60ebf36bee55843936fcf76acd5be1bc3d5a5f`
- Final developer-authored head: `82460d4d4cac6efe05504cde47ddf3a0ac88960b`
- Squash merge / delivered main SHA: `2ef42dcbadfb5bb3aa72a332228e5ae61d0181d3`

## Delivered runtime contract

- Desktop First Use loading explicitly hides `.lx-first-use-loading-note--mobile` inside the `min-width: 720px` owner after the generic `.lx-first-use-note` declaration can affect cascade order.
- Compact `<=719px` keeps the mobile loading note visible.
- The canonical desktop note, five desktop skeleton rows, loading `aria-busy` semantics, recoverable-error behavior and OpenPencil-owned hierarchy from #647/#648 remain unchanged.
- `first-use-route-contract.test.ts` now protects effective source-order ownership instead of merely asserting that both selectors exist.

## Root cause

The initial compact-note hide rule appeared before `.lx-first-use-note { display: grid; }`. The selectors had equal specificity, so source order re-enabled the compact note on desktop. Fail-closed visual evidence in #642/#645 correctly exposed the product mismatch before any new runtime fingerprint was approved.

## Validation evidence

### Immutable developer-head CI

- PR #653 head: `82460d4d4cac6efe05504cde47ddf3a0ac88960b`
- CI run: `32539993420` / CI #3970
- Result: success.
- Frontend core, backend unit/security, backend integration, both UI shards, lesson completion, content security, accessibility, iOS PWA, controlled service worker, performance budgets, dictionary smoke, authoritative Visual regression and container builds all passed.
- No review submissions, review threads or unresolved PR conversation comments were present before merge.

### Protected delivery

- Squash merge used expected head `82460d4d4cac6efe05504cde47ddf3a0ac88960b`.
- Delivered SHA: `2ef42dcbadfb5bb3aa72a332228e5ae61d0181d3`.
- Issue #652 closed as completed.

### Exact-main CI

- Commit SHA: `2ef42dcbadfb5bb3aa72a332228e5ae61d0181d3`.
- Main CI run: `32540675817`.
- Result: success.
- The exact-main run passed frontend core, backend unit/security, backend integration, all frontend E2E groups including Visual regression, frontend aggregate, API/Web image builds and the pinned Caddy publication check.

### Exact-SHA Stage/public validation

- Stage run: `32541309535`.
- Image SHA: `2ef42dcbadfb5bb3aa72a332228e5ae61d0181d3`.
- Deploy: success.
- Public smoke: success.
- Public browser: success.
- Public runtime browser suite: 12/12 passed across desktop Chromium and iOS WebKit.

## Design/evidence provenance

- Parent evidence: Issue #642 / Draft PR #645.
- The pre-repair #645 run #3969 / `32539008972` remains forensic evidence only; its new loading/error hashes were intentionally not approved.
- Active OpenPencil desktop loading nodes remain `n442` Light / `n614` Dark; no `.op`, screen-map or design-source mutation was made in #652/#653.
- #645 must recollect all eight loading/error runtime actuals from the delivered runtime before any new content-addressed fingerprint is approved.

## Current state reset

This reconciliation resets `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` byte-for-byte to their repository templates. `.agents/PROJECT_STATE.md` is intentionally not rewritten in this docs-only slice to avoid destructive replacement of the long-lived project ledger.

## Next prioritized work

Per the user's explicit instruction, after this reconciliation is delivered the next product task is critical Issue #651. Draft PR #645 remains open and fail-closed; the explicit #651 instruction permits starting that additional PR while #645 stays as the visual evidence owner.
