# Current Task Progress

## 2026-08-04 19:41 Europe/Moscow

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Product base: `cda65e39ba65cd00651be3ae7e39da651cc57f1c`.
- Previously deployed product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Issue #74 remains open after the completed connectivity-action slice.
- Open PRs #304, #305 and #306 are Dependabot-only and do not overlap this scope.
- Branch `agent/issue-74-header-profile-touch-target` was created from the exact live base.
- Draft PR #389 is mergeable and contains eight allowed files.

### Finding

The live interactive header button with accessible name `Открыть профиль` is present across canonical route islands. Its painted box is 44×44 px on desktop and 42×42 px on compact viewports. The compact control therefore failed the 44px fine-pointer and 48px coarse-pointer target contract.

The Profile route also uses `.lx-avatar` for a decorative `span[aria-hidden="true"]`; the implementation uses an exact interactive button selector and excludes this decorative owner.

### Implemented

- Added exact `button.lx-avatar[aria-label="Открыть профиль"]` paint-inert hit slop.
- Exposed a 44×44 fine-pointer and 48×48 coarse-pointer effective target.
- Preserved the 44×44 desktop and 42×42 compact painted boxes.
- Kept inline expansion symmetric and directed block-axis expansion downward to avoid the compact viewport/header top boundary.
- Preserved navigation callbacks, accessible name, focus visuals, colors, layout and route ownership.
- Added fail-closed source ownership and desktop Chromium, iOS WebKit and Android Chromium geometry/perimeter/focus/overflow evidence.

### Superseded CI diagnoses

- CI #2745 / run `30931603617` on `3ea5a50ebacf50e7b7043396b1707d2cb0a0681e`: UI shard 2 used the intentionally hidden compact streak as the neighbor. Artifact review identified the actual visible adjacent control as `.lx-route-reminder-entry > summary`. Classified as a stale test/live-owner error.
- CI #2750 / run `30932839239` on `e70fd21032dd036f966f125fde1890cd79254862`: corrected evidence exposed a real mobile viewport-edge defect. The computed coarse target was 48×48, but the symmetric top perimeter was not hit-testable in Android Chromium or iOS WebKit. Right, bottom and left passed. The owner was corrected to direct block-axis hit slop downward.

Neither superseded run is merge evidence.

### Successful validation run

CI #2753 / run `30934135674` completed successfully on immutable functional head `bbddd0bfeb69dd1d997aec831a94f01521eba032` after one controlled visual-job rerun.

Passed evidence includes:

- classifier and Agent Docs routing contract;
- frontend lint, TypeScript, Vitest source contracts, production build and dependency audit;
- both UI shards;
- exact 44/48px square target, all four perimeter hits, visible reminder separation, focus-visible and compact overflow in desktop Chromium, Android Chromium and iOS WebKit;
- lesson completion, content security, controlled service worker, accessibility audit, Dictionary smoke, performance budgets and iOS PWA Dictionary;
- backend unit/security and PostgreSQL integration;
- frontend quality aggregate;
- API and web container builds.

The first visual attempt failed only the pre-existing `compact Dictionary empty light` raw-PNG hash while Home, Profile and the other 125 visual cases passed. The failure reproduced the same non-approved PNG hash on its internal retry. A controlled local Chromium reproduction using the compiled CSS produced pixel-identical symmetric and corrected pseudo-element renders with zero differing pixels. One isolated rerun of the visual job then passed all 126 cases without baseline changes. Classification: transient exact-PNG/hash nondeterminism, not a raster regression and not justification for baseline promotion.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/header-profile-touch-targets.css`
- `frontend/components/header-profile-touch-target-source.test.ts`
- `frontend/e2e/header-profile-touch-targets.spec.ts`
- `frontend/package.json`

### Current state

Production code is complete. This factual Agent Harness update creates a final documentation head; a new full immutable-head CI run is required before expected-head squash merge.

### Next action

Run final authoritative CI on the documentation-complete immutable head, verify no unresolved review threads, mark PR #389 Ready, expected-head squash merge, then perform exact-SHA main CI and exact-image stage/public validation.
