# Current Task Progress

## Verified baseline

- Repository: `Dja-tiger/LexiGo`.
- Issue #70 remains open.
- Corrective branch base: `b4dace966bffcb482231d48b9b7926fee4e2b26f`.
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

## Current branch evidence

- Task record commit: `222a27d4ac5f65bf4ce24e8b7381476299c4b141`.
- Test correction commit: `bd5119503164ac7b06b482f68813013ad3a2dc45`.
- Changed test blob was read back and contains the native History setup plus explicit preconditions.

## Remaining

- Record execution evidence and open a Draft corrective PR.
- Run authoritative CI, with particular attention to desktop WebKit UI shard 1.
- Audit comments, reviews, threads and final diff.
- Mark Ready and expected-head squash merge only after final immutable-head CI is green.
- Require exact corrective merge main CI and stage/public validation before resuming Dictionary CSS cleanup.
