# Current Task Progress

## 2026-07-28 22:30 Europe/Berlin

### Verified

- Live `main` after PR #286 reconciliation merge: `5251485f9d780efabd3bd2379f887852fd8fd71b`.
- Issue #70 remains open.
- Canonical `/progress` route detection is `normalizedPathname(pathname) === "/progress"`.
- `useProgressIsland = isProgressRoute(pathname)` is not session-gated.
- `LexigoProgressApp` renders before the final `LexigoPremiumApp` fallback.
- `LexigoPremiumApp` still contains `renderProgress()` and route-specific Progress presentation markers.
- Shared progress state and data remain consumed by Home, Profile and lesson-result flows.

### Finding

The next safe Issue #70 boundary is not deletion yet, but executable separation of two concerns: unreachable compatibility Progress presentation versus still-live shared progress data/state. The existing source test proved dedicated entry ownership but did not prove guest/auth ordering or preserve the deletion boundary.

### Root cause

The Progress route island was extracted earlier, while `LexigoPremiumApp` retained both a route presentation and shared cross-route progress consumers. A filename-level or symbol-level cleanup could therefore remove live Home/Profile/lesson behavior together with the unreachable route branch.

### Changed files

- `frontend/components/progress-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live route-selection and fallback ordering inspection.
- Exact compatibility marker inventory for `renderProgress`, route dispatch, calendar visibility and progress resource notice.
- Shared consumer inventory for progress state, resource loading, refs, daily goal and navigation handoffs.
- Branch created from exact reconciled `main`.

### Checks failed

- Initial create-file call failed because the source test already existed; the existing file was read and updated with its exact blob SHA. No runtime file was affected.

### Current branch head

Resolve from live branch after final execution-evidence write.

### Next action

Complete execution evidence, verify exact four-path compare, open Draft PR, run required CI, fix any source-marker mismatch, then merge only after immutable-head green and review audit.
