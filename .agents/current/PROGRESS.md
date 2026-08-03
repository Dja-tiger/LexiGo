# Current Task Progress

## Status

- Active Issue #70 atomic slice: remove only the five proven-orphaned Home hero-decoration CSS families.
- Branch: `style/issue-70-remove-home-hero-decorations`.
- Verified base and merge base: `16b6c6967e8295767be9877a8e1b4b9d28311290`.
- Draft PR #358 is open.
- Published PR head before current-context reconciliation: `2b2a2f283d1eba71c63242e0da364deb16b380f2`.
- Latest branch commit after linking the PR in `TASK.md`: `d8e4e66e58dc04b5ce183dc944f38d4243d66969`.
- The branch is not behind `main` and contains only the bounded CSS deletion, its source contract and current-task memory.

## Completed implementation

- Removed only `lx-hero-copy`, `lx-glow`, `lx-floating-card`, `lx-book-base` and `lx-orbit` declarations from `frontend/app/premium-ui.css`.
- Production CSS diff is deletion-only: 94 lines removed and no declaration added or changed.
- Removed the complete bounded inventory of 19 selector-token occurrences.
- Converted `frontend/components/home-hero-orphan-source.test.ts` from candidate-presence evidence to fail-closed physical-absence evidence.
- Retained actual-checkout recursive proof that the five retired class names have no executable TypeScript/TSX consumers.
- Added positive protection for the canonical `.lx-hero-card`, `.lx-hero-card::before`, `.lx-hero-art` and `.lx-hero-actions` declarations.
- Preserved live Home consumers and compact/adaptive Home stylesheet owners.
- Preserved compatibility Lesson `lx-resume-strip` and guest-auth `lx-auth-card` runtime and CSS owners.
- Preserved the global stylesheet order `premium-ui.css` → `compact-home.css` → `adaptive-knowledge-coach-home.css`.
- Draft PR #358 was published with exact scope, non-goals, required validation and rollback.

## Repository safety

- A branch-creation request was rejected because the exact target branch already existed; GitHub changed no ref or file.
- The existing branch was verified to have the exact current `main` as merge base, zero commits behind and only the intended slice diff before writes resumed.
- Full branch CSS was read from its blob and confirmed to contain none of the five retired class names, including responsive media-query declarations.
- Every current-context write was read back from the explicit branch.
- `main` remained at `16b6c6967e8295767be9877a8e1b4b9d28311290` through PR publication and current-context reconciliation.

## Validation pending

- Complete authoritative CI on the final current-context head.
- Require source contract, frontend lint, typecheck, full unit suite and production build.
- Require the complete Chromium/WebKit/Android/iOS matrix, accessibility and CSP/service-worker gates.
- Require unchanged authoritative Linux visual hashes and unchanged route-performance budgets.
- Require backend and container gates selected by the fail-closed classifier.
- Verify comments, reviews and unresolved review threads before Ready.
- Perform expected-head squash merge, exact-SHA main CI and exact-SHA stage/public validation.
- Reconcile `.agents/PROJECT_STATE.md` and reset `.agents/current/**` only after product delivery completes.

## Rollback

Revert PR #358. No schema, data, API, migration, snapshot or route-budget rollback is required.
