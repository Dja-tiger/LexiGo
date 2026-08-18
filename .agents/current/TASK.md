# Current Task

## Identity

- Issue: #587
- Branch: `test/issue-587-min-mobile-route-parity`
- Base SHA: `f920fee4891426fce819c9cb2fb506599b3bc1fc`
- Head SHA: resolve from live branch ref
- PR: #588

## Objective

Re-run and finish the fail-closed minimum-mobile route parity audit at 320×700 after the runtime fixes from #589 and #590, then approve only manually reviewed content-addressed Linux visual fingerprints.

## Scope

- Preserve the existing 10-route × Light/Dark audit matrix in `frontend/e2e/route-tablet-parity.spec.ts`.
- Re-run all 20 minimum-mobile states against corrected `main`.
- Require structural/runtime checks before each visual-review gate.
- Manually inspect exact authoritative Linux PNG evidence before approving fingerprints.
- Preserve existing tablet and desktop visual fingerprints unchanged.

## Non-goals

- No runtime/CSS/API changes.
- No Figma/OpenPencil/design-source changes.
- No workflow or runner changes.
- No snapshot-update shortcuts, tolerance widening, or visual-baseline changes outside the 320×700 audit map.

## Allowed paths

- `frontend/e2e/route-tablet-parity.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Runtime application code and CSS.
- Backend code.
- `.github/workflows/**`.
- Canonical design-source files.
- Existing tablet/desktop baseline ownership outside the minimum-mobile map.

## Runtime owners

- Existing route runtime owners on corrected `main`; this PR is verification-only.

## Documentation owners

- `.agents/current/**` for active-task evidence.

## Invariants

- 320×700 is an audit viewport, not a new canonical design breakpoint.
- All 20 Light/Dark states must pass structural/runtime assertions before fingerprint approval.
- 768px and 1440px fingerprints remain byte-identical.
- Runtime fixes #589 and #590 remain exactly as delivered in `main`.
- No visual fingerprint is approved without manual review of its exact authoritative Linux PNG.

## Acceptance criteria

- All 20 320×700 route states have manually reviewed exact Linux evidence.
- Approved entries record width, full-page height, SHA256, source run, and source head SHA.
- The approved fingerprints reproduce on a later immutable head.
- Full immutable-head CI succeeds with no unresolved reviews and no main drift.
- Issue #587 closes through the merged audit PR.

## Required checks

- Initial diagnostic CI reaches `REVIEW_REQUIRED` only after structural/runtime checks for all 20 minimum-mobile states.
- Manual review of the authoritative Visual artifact.
- Final full immutable-head CI.
- Pre-merge diff/review/main-drift audit.
- Exact-main CI after merge; Stage must remain on the newest runtime SHA for this test/docs-only delivery.

## Risks

- Accidentally approving stale pre-fix fingerprints.
- Treating unrelated browser flakes as product regressions.
- Changing established 768/1440 evidence while editing the minimum-mobile map.

## Rollback

Revert the audit-only merge; runtime remains unaffected.