# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Security prerequisite #431 is fully delivered: merge `a2cb82b2415e0695120ec666b86690cbcd91f12d`, exact-SHA CI #3011 success, Stage #2852 success including public endpoints and browser UI.
- New product branch is based exactly on that verified `main` SHA.
- Canonical Active Lesson still had 44px-only controls with no pointer-dependent 48px effective-target owner.
- The standalone acceptance is explicitly registered in `test:e2e:lesson` so authoritative CI executes it.

### Finding

Active Lesson utility, recall text action, confidence ratings and compact header controls retained a residual Issue #74 coarse-pointer target gap.

### Root cause

The older Active Lesson presentation encoded 44px painted minimums before the later Issue #74 paint-inert effective-target pattern was introduced.

### Changed files

- `frontend/app/active-lesson-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `frontend/package.json` — lesson test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Exact-base branch creation after successful Stage delivery of #431.
- Production CSS and E2E acceptance replayed from the previously reviewed stale branch onto the current exact base.
- Security versions remain Next 16.2.11, PostCSS 8.5.23 and Sharp 0.35.3; lockfile untouched.

### Checks failed

- None yet on the new immutable candidate head; CI starts after the draft PR opens.

### Current branch head

- Resolve from live branch ref after Agent Harness records are committed.

### Next action

Open the replacement draft PR, close stale #430 as superseded, audit the diff, run full immutable-head CI, fix any real product regression, then Ready → expected-head squash merge → exact-SHA main CI → exact-image Stage/public validation. Continue residual whole-app Issue #74 inventory after delivery rather than stopping at this slice.
