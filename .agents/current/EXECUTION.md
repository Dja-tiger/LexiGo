# Current Task Execution

## Task

- Issue: #481 delivery remediation
- Parent: #25
- PR: #483
- Branch: `fix/issue-481-stage-webkit-sw-cancellation`
- Base / deployed product SHA: `b62470b0051ca60e2bea177ab08945887107822c`
- Remediation code/test head before final reconciliation: `9b8b356cdf2d6101d89fc9c3388605e480c168f8`
- Final head: resolve from the branch after this atomic reconciliation; no further branch writes are allowed before merge.

## Delivery provenance

1. Product PR #482 passed immutable-head CI #3366 and squash-merged as `b62470b0051ca60e2bea177ab08945887107822c`.
2. Exact-main CI #3367 passed fully and published immutable images for that SHA.
3. Stage #3208 deployed those exact images and passed public frontend/API endpoint smoke.
4. Public Playwright failed only iOS WebKit stale-build recovery because the expected guard service-worker cancellation was serialized with a single slash after `https:`.
5. The Playwright retry reproduced the same single-slash diagnostic; no blind deploy rerun was accepted as remediation.

## Root-cause evidence

`frontend/e2e/public-runtime-smoke.spec.ts` registers the exact current-build service-worker URL as a temporary guard during stale-build recovery. `isExpectedWebKitGuardServiceWorkerCancellation()` already requires:

- browser name `webkit`;
- a non-null guard service-worker URL;
- exact equality between the normalized full diagnostic and `Cannot load <exact guard URL> due to access control checks.`

The only incompatibility was formatting normalization. Existing code canonicalized:

`Cannot load https: //host/...`

to:

`Cannot load https://host/...`

but Stage WebKit 1.61.1 emitted:

`Cannot load https: /host/...`

so the existing exact guard equality never matched.

## Code remediation

Changed only `frontend/lib/public-runtime-errors.ts`:

- protocol split normalization now accepts `\/{1,2}` instead of exactly `//`;
- no classifier condition, expected URL, browser guard or failure wording changed.

Changed only `frontend/lib/public-runtime-errors.test.ts` for focused coverage:

- one-slash and two-slash diagnostics both normalize to the same canonical URL;
- exact one-slash WebKit current-build cancellation is accepted;
- Chromium, null guard, wrong build, API path and other-host cases remain rejected.

## PR / scope audit

Draft PR #483 was opened against exact base `b62470b0...`.

Changed files before final reconciliation are exactly:

- `.agents/current/EXECUTION.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/TASK.md`
- `frontend/lib/public-runtime-errors.test.ts`
- `frontend/lib/public-runtime-errors.ts`

No workflow, service-worker runtime, build-version guard, deployment, listening/backend/API, CSS/UI or baseline file is changed.

## CI #3368 evidence

Run `31677368540`, head `9b8b356cdf2d6101d89fc9c3388605e480c168f8`.

- Frontend core: success; focused regression passed.
- Backend unit/security: success.
- Backend integration: success.
- UI shard 1/2: success.
- UI shard 2/2: success.
- Lesson completion: success.
- Content security: success.
- iOS PWA dictionary: success.
- Controlled service worker: success.
- Performance budgets: success.
- Accessibility audit: success.
- Dictionary smoke: success.
- Frontend quality: success.
- Container build api/web: success.

Visual Regression attempt 1 failed only unchanged `compact Dictionary empty light`. Artifact inspection tied the hash difference to the existing programmatic focus plus `:focus-visible` ring. Because the remediation touched no rendering path, the visual job was rerun alone on the exact same commit SHA. Attempt 2 passed fully with no code, baseline or tolerance changes. The overall CI run concluded `success` on attempt 2.

## Safety decisions

- Did not update any snapshot because no intended visual change exists.
- Did not change or suppress public Playwright assertions.
- Did not increase retry count/tolerance.
- Did not change service-worker behavior.
- Kept #481 open after product merge because final Stage public browser gate was not yet accepted.

## Final delivery procedure

1. Atomically commit TASK/PROGRESS/EXECUTION evidence reconciliation.
2. Read back final files, verify exact branch head and live main.
3. Freeze branch and run one fresh full immutable-head CI.
4. Verify compare scope, reviews and review threads.
5. Ready PR #483 without head mutation and squash-merge with expected-head protection.
6. Require exact-merge main CI success and immutable image publication.
7. Require exact-SHA Stage deploy, public frontend/API smoke and public Chromium+iOS WebKit acceptance.
8. Update all #481 AC/evidence and close #481 only after those gates pass.
9. Perform separate Agent Docs post-merge reconciliation/reset before any next #25 slice.

## Rollback

Revert PR #483 only. No persisted data, listening contract, service-worker runtime or deploy configuration depends on this diagnostic-normalization hotfix.
