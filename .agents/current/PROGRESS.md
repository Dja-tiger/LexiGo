# Current Task Progress

## Verified baseline

- Repository: `Dja-tiger/LexiGo`.
- Issue #70 remains open.
- Corrective branch base: `b4dace966bffcb482231d48b9b7926fee4e2b26f`.
- Corrective PR: #337.
- PR #336 was squash-merged from fully green head `d22d71041c2722770eacea85eaa45d77738db746`.
- Post-merge main CI run `30725885894` failed only WebKit UI shard 1; stage was correctly blocked.

## Root cause

- Failing test: `active-lesson-figma.spec.ts` — Browser Back safe-exit contract.
- Both the original attempt and retry expected `/lesson/active` but observed `/learn`.
- The Playwright trace showed `/learn` immediately after the synthetic setup and before `page.goBack()`.
- The setup used Next.js-patched `window.history.replaceState` and `window.history.pushState`; WebKit synchronized App Router state during setup, invalidating the required current-entry precondition.
- Product runtime, popstate capture, protected History restoration and safe-exit delivery were not modified by PR #336 and were not the source of this failure.

## Implemented

- Created branch `fix/issue-70-webkit-active-lesson-history-setup` from the exact failed main SHA.
- Changed only the test setup to call native `History.prototype.replaceState` and `History.prototype.pushState` with `window.history` as receiver.
- Added an explicit `/lesson/active` URL precondition and mounted Active Lesson assertion before the real `page.goBack()` traversal.
- Kept the protected-route URL, safe-exit dialog and empty review-request assertions unchanged.
- No timeout, retry, skip, runtime, CSS, API, workflow, snapshot or budget change was made.

## Validation evidence

- Pre-final corrective head: `a15c9d8b848a8d22bd650edf7cafea3e4cfc1ff2`.
- Authoritative CI #2495 / run `30726428789` passed completely.
- The previously failing `Frontend E2E (UI tests (shard 1/2))` desktop WebKit gate passed.
- UI shard 2, lesson completion, accessibility, Linux visual regression, performance budgets, CSP, service worker, iOS PWA Dictionary, Dictionary smoke, backend unit/security/integration, frontend core and both web/API container builds passed.
- No visual baseline, performance ceiling or runtime source changed.
- The diff remained restricted to the four allowed paths.

## Remaining

- This evidence-record update changes the PR head; one final immutable-head authoritative CI is required.
- Repeat the PR comment/review/thread audit after final CI.
- Mark Ready and expected-head squash merge only if the final head remains fully green.
- Require exact corrective merge main CI and stage/public validation before reconciliation or resuming Dictionary CSS cleanup.
