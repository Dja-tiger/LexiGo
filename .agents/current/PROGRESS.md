# Current Task Progress

## 2026-07-26 04:35 Europe/Berlin

### Verified

- Live `main` is `b1f92920af88c9d82b00c50e13b4d0450666989f`; post-Scenario repository memory is reconciled by merged PR #229 and current task files were reset before this slice.
- Issue #230 records the user-reported authenticated Progress, iOS PWA navigation and uninterruptible scroll-restoration defects.
- The fix branch `fix/issue-230-progress-session-navigation` is based on exact current `main`; no other product PR is open.
- Stage product evidence before this fix remains PR #228 image `733b49feec5230d151ab7f0e6e78ca0a8ea0671e`, deploy/public smoke/public browser success in run `30184041786`.

### Finding

- `LexigoPremiumApp` owns a local `session` initialized from bootstrap state. A login performed after guest bootstrap calls only local `setSession(authenticated)`; `LexigoBootstrappedApp` remains `null`. Entering the dedicated `/progress` island therefore passes `initialSession=null` and renders the guest gate without an actual server logout.
- Local token adoption and logout have the same ownership gap in the opposite directions unless all Premium session changes are propagated to the bootstrap owner.
- `scheduleNavigationScrollRestoration` writes the target position on every animation frame for up to 300 frames. The route-boundary caller uses `navigationScrollBehavior(window)`, which is `smooth` outside reduced-motion mode. There is no user-intent cancellation, so PWA touch/scroll/navigation can be repeatedly overridden.
- Existing route tests begin with a refresh-authenticated fixture and therefore do not cover guest bootstrap → in-app login → Progress island.

### Root cause

Session state has two owners across a lazy route boundary: the Premium graph mutates a private copy while route islands consume the bootstrap copy. Scroll restoration also treats reachability retry as an exclusive animation rather than a cancellable enhancement: it combines repeated writes, smooth behavior and no explicit-input abort path.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Completed repository pre-flight and exact main/base verification.
- Read runtime, session, route navigation, route focus/history, per-tab snapshot and scroll-restoration owners.
- Confirmed the guest login propagation gap at the exact authentication mutation and the 300-frame smooth restoration contract in source.

### Checks failed

- No implementation check has run yet; runtime changes intentionally begin only after the Issue and Draft PR exist.

### Current branch head

Resolve from the live branch after the pre-flight documentation commit.

### Next action

Create Draft PR for Issue #230, then implement the smallest session-propagation and interruptible-restoration changes with focused unit and browser regressions before running the full CI matrix.
