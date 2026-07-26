# Current Task Progress

## 2026-07-26 04:35 Europe/Berlin

### Verified

- Live `main` is `b1f92920af88c9d82b00c50e13b4d0450666989f`; post-Scenario repository memory is reconciled by merged PR #229 and current task files were reset before this slice.
- Issue #230 records the user-reported authenticated Progress, iOS PWA navigation and uninterruptible scroll-restoration defects.
- The fix branch `fix/issue-230-progress-session-navigation` is based on exact current `main`; PR #231 was opened as Draft before runtime changes.
- Stage product evidence before this fix remains PR #228 image `733b49feec5230d151ab7f0e6e78ca0a8ea0671e`, deploy/public smoke/public browser success in run `30184041786`.

### Finding

- `LexigoPremiumApp` owns a local `session` initialized from bootstrap state. A login performed after guest bootstrap calls only local `setSession(authenticated)`; `LexigoBootstrappedApp` remains `null`. Entering the dedicated `/progress` island therefore passed `initialSession=null` and rendered the guest gate without an actual server logout.
- Successful replacement-token refreshes could remain private to the active child graph unless the document bootstrap owner was notified.
- `scheduleNavigationScrollRestoration` wrote the target position on every animation frame for up to 300 frames. The route-boundary caller used `smooth` outside reduced-motion mode. There was no user-intent cancellation, so PWA touch/scroll/navigation could be repeatedly overridden.
- Existing route tests began with a refresh-authenticated fixture and did not cover guest bootstrap → in-app login → Progress island.

### Root cause

Session authority was split across a document bootstrap owner and a route-graph-local copy. The bootstrap cache was not reconciled after in-app login/logout, and successful token refreshes had no document-scoped adoption signal. Scroll restoration also conflated bounded reachability retry with decorative smooth animation and omitted a user-control cancellation invariant.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/production-app-entry.test.ts`
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/e2e/review-outbox-auth-lifecycle.spec.ts`
- `frontend/e2e/route-scroll-interruption.spec.ts`
- `frontend/lib/auth-session.ts`
- `frontend/lib/auth-session.test.ts`
- `frontend/lib/navigation-history.ts`
- `frontend/lib/navigation-history.test.ts`
- `frontend/lib/navigation-scroll-restoration.test.ts`

### Implementation

- Bootstrap reconciliation now runs on pathname changes as well as explicit retry. Matching document-cache/CSRF state remains a cache hit, so ordinary route navigation does not add a network refresh.
- Every successful coalesced `refreshSession` emits a validated document-scoped session event. `LexigoBootstrappedApp` adopts that session through the existing bootstrap cache owner, preventing later route islands from receiving a stale access token.
- `/progress` retains authenticated state after guest bootstrap → in-app login and remains escapable to Home, Learning and Dictionary through App Router navigation in mobile/standalone browser projects.
- Route/history scroll writes are always immediate (`behavior: "auto"`).
- Pending route-boundary restoration is cancelled by wheel, touchstart/touchmove, primary pointerdown and non-editable scroll-navigation keyboard intent. Listeners are passive/non-blocking and never call `preventDefault`.
- Bounded retry remains unchanged for temporarily unreachable positions; cancellation stops all subsequent writes and does not report a false restoration completion.

### Checks passed

- Repository pre-flight, exact base verification, branch-scoped write/read-back and repeated live-`main` verification.
- Frontend lint, typecheck, unit tests, production build and production dependency audit on implementation CI #1879, run `30185181996`.
- Complete repository CI #1879 succeeded on implementation head `a052aff272c53bd1683a3aaeb4299ec50761391a`, including backend unit/race/security/integration and the full frontend browser matrix.
- The refined successful-refresh notification and bootstrap-adoption code passed frontend lint, typecheck, unit tests, production build and dependency audit in CI #1882, run `30185508484`, before the final documentation head was created.
- Focused regressions cover guest bootstrap → login → authenticated Progress → Home/Learning/Dictionary, immediate route scroll behavior, bounded async-height restoration, cancellation/no-further-write and a deterministic browser wheel interruption.

### Checks failed

- No product assertion has failed on the implementation heads.
- Direct local clone/command execution was unavailable because the isolated container could not resolve GitHub; authoritative source operations and validation used the installed GitHub connector and repository CI.

### Current branch head

Resolve from the live branch ref. The final developer-authored head includes implementation plus current-task evidence and requires a new immutable-head CI run.

### Next action

Wait for complete required CI on the final developer-authored head, audit PR #231 comments/reviews/threads, mark ready, squash-merge with the expected head SHA, validate the exact squash SHA on stage/public Chromium and iOS WebKit, close Issue #230, then reconcile `.agents/PROJECT_STATE.md` and reset `.agents/current/**` in a separate documentation PR.
