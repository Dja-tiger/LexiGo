# Current Task

## Identity

- Issue: #70
- Incident: post-merge validation failure after PR #336
- Branch: `fix/issue-70-webkit-active-lesson-history-setup`
- Base SHA: `b4dace966bffcb482231d48b9b7926fee4e2b26f`
- Corrective PR: pending

## Objective

Repair the WebKit Active Lesson Browser Back regression gate that failed post-merge main CI because its synthetic history setup called Next.js-patched `history.replaceState` and `history.pushState`, allowing `/learn` route synchronization to race ahead of the actual Back traversal.

## Failure evidence

- PR #336 final head `d22d71041c2722770eacea85eaa45d77738db746` passed authoritative CI #2493 / run `30725579604`.
- PR #336 squash-merged as `b4dace966bffcb482231d48b9b7926fee4e2b26f`.
- Post-merge main CI run `30725885894` failed only `Frontend UI shard 1 (Chromium/WebKit/Android)`; dependent container builds were cancelled and stage was correctly blocked.
- The failing WebKit test was `active-lesson-figma.spec.ts` — `browser Back opens safe exit instead of navigating or duplicating a submit`.
- Both the original attempt and retry expected `/lesson/active` but observed `/learn`.
- Playwright trace proves the page was already at `/learn` immediately after the test setup and before `page.goBack()`, so the product popstate contract was not being exercised from its required precondition.

## Scope

- Seed the synthetic adjacent History entries through unpatched native `History.prototype` methods.
- Assert `/lesson/active` and the mounted Active Lesson before triggering Browser Back.
- Preserve the real browser traversal, product capture listener, protected History restoration, safe-exit dialog and no-review-submit assertions.
- Record the incident and validation state in `.agents/current/**`.

## Non-goals

- No runtime, navigation, safe-exit, API, backend, CSS, workflow, dependency, snapshot or performance-ceiling change.
- No timeout increase, retry increase, test skip or browser-matrix reduction.
- No continuation of the Dictionary CSS deletion slice until this corrective merge passes exact-SHA main and stage/public validation.

## Allowed paths

- `frontend/e2e/active-lesson-figma.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- The Browser Back action remains a real `page.goBack()` traversal.
- The product `popstate` listener and safe-exit implementation remain unchanged.
- The test must fail before Back if the current URL is not `/lesson/active`.
- Review requests remain empty after the intercepted traversal.

## Acceptance criteria

- The targeted WebKit Active Lesson spec passes repeatedly on the corrected setup.
- Full authoritative CI passes on the final developer-authored head.
- Final diff contains only the four allowed paths.
- Reviews, comments and unresolved threads are empty before Ready.
- Expected-head squash merge succeeds.
- Post-merge main CI passes on the exact corrective merge SHA.
- Exact-SHA stage deploy, public smoke and public browser checks pass before reconciliation.

## Rollback

Revert the corrective PR. No production runtime behavior changes in this slice.
