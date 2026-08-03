# Current Task Execution

## Task

- Issue: #70
- Branch: `test/issue-70-complete-fallback-inventory`
- Reconstructed base SHA: `3a6bf7686a2563c2828b9293b9ac381397274710`
- Previous obsolete base SHA: `df3cd097cbd159a4d441aea4ce783043dabe36ec`
- Previous proof head: `9916d95b7d6584a05da91393adfaa7743d37d0f4`
- PR: #354 (Draft)

## Repository harness and concurrency recovery

Purpose:

Continue the existing proof-only PR without merging stale task state or losing the exact source-contract intent after concurrent PR #355 advanced `main`.

Instruction sources:

- repository Agent Harness documents;
- `.agents/PROJECT_STATE.md` reconciled by PR #356;
- Issue #70 compatibility reachability rules;
- live PR #354 metadata and exact branch content;
- exact main/stage evidence for PR #355.

Actions performed:

- Detected PR #354 after PR #355 delivery instead of incorrectly claiming no open PR.
- Kept PR #354 Draft and blocked merge while its base and current-task records were stale.
- Completed separate Agent Docs reconciliation PR #356.
- Verified new live `main` `3a6bf7686a2563c2828b9293b9ac381397274710`.
- Read the exact source-contract file from the old PR #354 head.
- Verified old head CI #2557 / run `30772233239` was green but marked it non-authoritative for the new base.
- Force-reset only the existing PR head branch to exact new `main`.
- Reapplied the single product test file and refreshed `.agents/current/**`.

Result:

PR #354 is reconstructed on the reconciled base without carrying stale task records. No production runtime or CSS was changed.

Failure avoided:

Merging the old head would have discarded or conflicted with PR #355 task evidence and would not have validated the combined repository state.

Fallback:

Force-reset the Draft branch again to exact `main` if the final four-path comparison is not clean. Do not modify production source to resolve documentation conflicts.

Reusable lesson:

When two proof-only branches are created concurrently, deliver and reconcile the first completed product slice, then reconstruct the remaining Draft from exact main rather than merging stale `.agents/current/**` history.

## Compatibility fallback inventory proof

Purpose:

Make the final fallback source contract cover every dedicated island and every intentionally live compatibility/shared owner before any deletion.

Files inspected:

- `frontend/components/compatibility-fallback-source.test.ts` on old PR head and new main;
- `frontend/components/lexigo-bootstrapped-app.tsx`;
- `frontend/components/lexigo-premium-app.tsx`;
- current repository memory and PR #354 metadata.

Actions performed:

- Expanded dedicated owner render-order assertions from six to nine components.
- Added exact predicates for Home, Learn, Active Lesson, Dictionary, Phrases, Progress, Profile, Scenario Catalog and Scenario Detail.
- Preserved remaining premium dispatch for Library, Profile and Lesson.
- Protected guest Profile through the authenticated-only canonical Profile predicate.
- Protected unknown/product-route fallback.
- Protected Review Outbox, email confirmation and account panels as shared bootstrap owners.
- Retained canonical Learn CSS consumer assertions.

Boundaries preserved:

- Guest authentication and recovery remain compatibility-owned.
- Library remains live for Dictionary History.
- Lesson and unknown/product-route fallback remain live.
- Shared account/session runtime remains outside route-island ownership.
- PR #355 Home hero proof remains unchanged.

## Validation plan

1. Read back all four changed paths from the reconstructed branch.
2. Compare the branch to exact base `3a6bf768…` and require only the declared paths.
3. Treat the resulting branch head as the final developer-authored candidate.
4. Require a new complete authoritative CI run on that immutable head.
5. Require frontend core, backend unit/security/integration, complete browser matrix, accessibility, CSP, PWA, visual regression, performance budgets and both container builds to pass.
6. Do not update visual snapshots or performance ceilings.
7. Audit comments, reviews and unresolved review threads.
8. Mark Ready only after complete green CI.
9. Perform expected-head squash merge.
10. Require exact merge SHA main CI and stage/public validation.
11. Reconcile repository memory in a separate Agent Docs PR.

## Rollback

Revert PR #354. No production runtime, schema, data, API or deployment rollback is required.
