# Current Task Progress

## 2026-07-28 21:43 Europe/Moscow

### Verified

- Live base/main at slice start: `162b93b7dbfa53bcfe25e6ce055b0eb0797043d7`.
- Active branch: `refactor/issue-70-remove-phrases-compatibility`.
- Active delivery PR: #282. Closed PRs #279 and #280 are unmerged technical predecessors only.
- Canonical guest and authenticated `/phrases` ownership resolves to `LexigoPhrasesApp` before the `LexigoPremiumApp` fallback.
- Exact base source blob for `lexigo-premium-app.tsx`: `1cf19cfb8928e71d51be503cb37fd7cd3e60e5d7`.
- Cleaned developer-authored validation head `410167a9635dd971f27ed407238c688dd9623754` passed full CI #2332 / run `30387953394`.
- CI #2332 completed successfully across change classification, backend unit/security/integration, frontend lint/type/unit/build/audit, both UI shards, Content Security, Dictionary smoke, Accessibility, iOS PWA, Lesson completion, controlled Service Worker, Linux visual regression, performance budgets and container builds.
- Workflow artifacts for CI #2332 identify the same exact branch/head; no baseline or budget promotion was made.

### Finding

The dead family was exactly the route-level Phrases catalog/detail implementation inside `LexigoPremiumApp`: local state, derived catalog/detail values, URL/filter synchronization, API loaders/effects, lifecycle resets, route handlers, `renderPhrases`, route notice and route-only imports/types/helpers.

Consumer auditing also proved two initially suspicious helpers remain live outside that route family:

- `DEFAULT_PHRASE_CATALOG` enriches phrase `slug` and `cloze` fields in `toLearningItem`;
- `sortLearningItems` and `sortCatalogEntries` remain used by shared guest phrase browsing in the lesson flow.

These shared lesson-domain owners were preserved and are protected by the source contract.

### Root cause

The Phrases route was extracted to `LexigoPhrasesApp`, but the previous route-level implementation remained compiled in the broad compatibility fallback. The connector exposes complete-file replacement but no line-patch API for the 3,106-line source, so direct full-file replacement would have created unacceptable corruption risk.

### Changed files

Final intended diff contains exactly:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`

No workflow, temporary script, CSS, visual baseline, backend, API, migration, deployment or bundle-budget file remains changed.

### Implementation result

- Removed the unreachable Phrases catalog/detail compatibility route family.
- Narrowed the remaining catalog-sort control to its all-items owner.
- Replaced candidate-presence assertions with absence assertions.
- Added explicit preservation assertions for shared phrase lesson-domain behavior.
- Documented the completed runtime deletion and separate CSS stop boundary.
- `lexigo-premium-app.tsx` diff against base: 11 additions, 334 deletions, net reduction 323 lines.
- Existing route bundle ceilings remain unchanged.

### Temporary patch mechanism audit

- Initial branch-contained patcher v1 run `30385938542` failed closed before commit because a multiline anchor inherited invalid literal indentation; runtime/test files remained unchanged.
- Re-created branch-only workflow registrations did not produce a usable run; no runtime changes resulted.
- A temporary exact-branch job was added to the existing Actions-storage workflow only after its path was explicitly allow-listed.
- The first valid workflow parse still failed closed when the final marker check correctly identified `sortLearningItems` as a live shared consumer.
- The corrected exact-anchor patch job in Actions-storage run `30387731574`, job `90371422604`, succeeded and produced source-only bot commit `dfc1fc21ce33bdf1c7767aec3340bad429c5da63`.
- `.github/workflows/actions-storage-cleanup.yml` was then restored byte-for-byte to base blob `5df1e1e1e08d14b558249945949c9b5175d62b4a`.
- Temporary workflow files and `scripts/ci/issue_70_phrases_patch.py` were deleted.
- Subsequent source-contract, documentation and Agent Harness commits made the cleaned validation head developer-authored.

### Checks passed

- Mandatory Agent Harness and specialized Issue #70 rules read before writes.
- Exact live GitHub, PR, CI and deployment state verified.
- Reconciliation PR #278 completed before runtime work.
- Exact route/shared-domain consumer audit completed.
- Every branch write read back with its blob SHA.
- Final cleaned compare before CI #2332: behind `0`, exactly six allowed paths.
- Retired Phrases route markers absent from `LexigoPremiumApp`.
- Shared phrase source, mixed lesson, guest browse, cloze and suggestion markers present.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit successful.
- Backend unit/security/integration successful.
- Both UI shards and complete browser/accessibility/PWA/security matrix successful.
- Linux visual and performance-budget gates successful without baseline/budget changes.
- Container builds successful.
- Full CI #2332 / run `30387953394` successful on `410167a9635dd971f27ed407238c688dd9623754`.

### Checks failed

Only temporary patch-construction attempts failed, all before runtime commit and all fail-closed:

- run `30385938542`: non-portable multiline anchor;
- branch-only workflow re-registration: no run registration;
- first valid existing-workflow patch run: shared `sortLearningItems` marker correctly blocked over-deletion.

No product validation failed on the cleaned runtime diff.

### Current branch head

Resolve from the live branch after the final Agent Harness evidence commits.

### Next action

Run the complete authoritative CI matrix again on the new immutable developer-authored head, audit PR comments/reviews/threads, verify final compare, mark PR #282 Ready, expected-head squash merge and validate the exact merge SHA on stage/public smoke/browser before repository-memory reconciliation.
