# Current Task Progress

## 2026-08-04 16:26 Europe/Moscow

### Verified

- Live `main` before branch creation: `c56485511c752aacd3e2f43cd0d102f229a9c25f`.
- Latest deployed product SHA: `ac9af9a9656ad9bc9b4a6614ba7f4b01a9b7aa3c`; stage run `30917349721` passed deploy, public smoke and 12/12 public browser checks.
- Issue #75 is closed and its current Agent Harness context is reset.
- No active product PR intersects Issue #74; open PRs #304–#306 are unrelated Dependabot work.
- Compact/rail primary navigation already provides at least 48×52 px targets and 11–12 px labels.
- Shared header reminder controls use `.lx-icon-button` with a visible 42×42 px box.
- Shared avatars use a visible 44×44 px box.
- Home streak and avatar plus Dictionary reminder and avatar are live routed header controls.
- Existing browser coverage verifies navigation target size but did not verify effective shared header hit areas or coarse-pointer 48 px behavior.

### Finding

The first concrete Issue #74 defect is shared header hit-area inconsistency. Visible geometry should remain compact, but icon/avatar/streak controls need a larger semantic hit rectangle, especially under coarse pointer input.

### Root cause

`premium-ui.css` owns visible header geometry but has no shared effective touch-target contract. The 42 px reminder button therefore remains below the iOS minimum, and none of the shared header controls adapts to the 48 px Android/coarse-pointer target.

The first implementation used a transformed transparent pseudo-element and added a new painted focus shadow. Although target, accessibility, performance and PWA checks passed, deterministic visual hashes changed for lesson composer and desktop offline state. The transform introduced a composited descendant in every header target, so the owner was not visually inert.

### Changed files

- `frontend/app/header-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/header-touch-target-source.test.ts`
- `frontend/e2e/header-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Mandatory Agent Harness and live main/open PR/Issue state verified before writes.
- Issue #74 was decomposed to shared routed header targets only.
- New stylesheet uses unique routed selectors and does not reorder existing imports.
- Default effective target is 44 px; coarse-pointer target is 48 px.
- Source contract protects import placement, exact target values, live runtime owners, compact navigation invariants and authoritative command registration.
- CI #2718 / run `30919648741` on superseded head `0235786f6a6d85df44f7f87d0a035e85a42f3317` passed frontend core, backend unit/security/integration, focused accessibility target proof, performance, CSP, iOS PWA, controlled service worker and Dictionary smoke.
- Focused browser proof passed perimeter hit-testing, global focus visibility, non-overlap and horizontal overflow in desktop Chromium, iOS WebKit and Android Chromium.
- Visual artifact `8896656119` was downloaded and inspected; lesson composer and desktop offline screenshots changed consistently on initial and retry while no baseline was modified.
- The corrected owner removes transform/compositing and additional painted focus output.
- Effective expansion now uses visually inert negative inset boundaries.
- Existing `accessibility-focus.css` remains the sole keyboard-focus visual owner.
- Source/browser contracts were updated to reject transform/shadow and verify the existing global focus ring.

### Checks failed

- CI #2718 visual regression failed on superseded head `0235786f6a6d85df44f7f87d0a035e85a42f3317`:
  - lesson composer desktop expected `3be9635d…`, received `deb39b8c…`;
  - desktop offline dark expected `8f3b6192…`, received `fa3c8dfb…`.
- No baseline/hash was updated or accepted.

### Current branch head

Resolve from live branch ref; latest known corrected task-record commit: `6bb0084e378d157c48df79ca2c820a27e5b16910`.

### Next action

Read back the corrected four functional contracts, verify the eight-file diff remains in scope, and track only a new immutable-head full CI run. CI #2718 is no longer merge evidence.
