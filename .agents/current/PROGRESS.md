# Current Task Progress

## 2026-08-04 19:41 Europe/Moscow

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `cda65e39ba65cd00651be3ae7e39da651cc57f1c`.
- Latest deployed product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Issue #74 remains open after the completed connectivity-action slice.
- Open PRs #304, #305 and #306 are Dependabot-only and do not overlap this product scope.
- Branch `agent/issue-74-header-profile-touch-target` was created from the exact live `main` SHA.
- Mandatory Agent Harness documents and Issue comments were read before writes.
- Draft PR #389 was opened on head `3ea5a50ebacf50e7b7043396b1707d2cb0a0681e`.

### Finding

The live interactive header button with accessible name `Открыть профиль` is present across canonical route islands. Its base painted box is 44×44 px on desktop, while `mobile-pwa-fixes.css` reduces it to 42×42 px on compact viewports. The compact live control therefore fails both the 44px fine-pointer and 48px coarse-pointer target contract.

The Profile route also uses `.lx-avatar` for a decorative `span[aria-hidden="true"]`; the implementation uses an exact interactive button selector and does not affect this decorative owner.

### Implemented

- Added exact button-scoped paint-inert hit slop with a 44px fine-pointer and 48px coarse-pointer variable.
- Registered the CSS owner after presentation owners.
- Added fail-closed source ownership covering route consumers, decorative exclusion, painted geometry, focus ownership and command registration.
- Added desktop Chromium, iOS WebKit and Android Chromium geometry/perimeter/focus/overflow evidence.

### CI #2745 diagnosis

Authoritative PR run `30931603617` on head `3ea5a50ebacf50e7b7043396b1707d2cb0a0681e` passed classifier, frontend core, backend unit/security, backend integration, UI shard 1, lesson completion, content security, controlled service worker, accessibility audit, visual regression, Dictionary smoke, performance budgets and iOS PWA.

Only UI shard 2 failed. Playwright report artifact `frontend-playwright-report-ui-2` (`8901594340`) showed that the new test waited for `.lx-header-tools .lx-streak` to be visible on compact devices. Runtime evidence and screenshots showed that this streak button is intentionally hidden in compact presentation; the actual visible adjacent control is `.lx-route-reminder-entry > summary`, the fixed dark calendar reminder entry.

Classification: stale test/live-neighbor ownership error, not production rendering failure and not browser flake. CI #2745 is superseded and is not merge evidence.

### CI #2750 diagnosis

The corrected authoritative run `30932839239` on head `e70fd21032dd036f966f125fde1890cd79254862` again passed frontend core, backend, accessibility, visual, performance, PWA, service-worker and all non-UI-shard-2 gates. UI shard 2 reached the actual target geometry proof and failed deterministically in Android Chromium and iOS WebKit, including retries.

Playwright report artifact `frontend-playwright-report-ui-2` (`8902076913`) confirmed:

- painted compact box: 42×42 px;
- computed coarse pseudo target: 48×48 px;
- right, bottom and left perimeter points resolve to the profile button;
- only the top perimeter point resolves outside the button in both mobile engines;
- the live reminder summary is visible and the application remains healthy.

The compact header places the avatar at the viewport/header top boundary. Symmetric block-axis hit slop reaches that boundary, where mobile hit testing does not expose the upper pseudo perimeter as part of the button. This is a real runtime target-shape defect, not a stale locator and not a retryable browser flake.

Correction: keep inline expansion symmetric, but anchor block-start at the button padding edge and direct the additional block-axis area downward. This preserves the painted 42/44px geometry, keeps the target at or above 44/48px, avoids the viewport edge, and remains inside the compact header footprint.

CI #2750 is superseded and is not merge evidence.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/header-profile-touch-targets.css`
- `frontend/components/header-profile-touch-target-source.test.ts`
- `frontend/e2e/header-profile-touch-targets.spec.ts`
- `frontend/package.json`

### Checks passed

- Live main, open PR and deployment-state verification.
- Exact route-source and CSS-owner inspection.
- Branch creation and all changed-file read-backs.
- CI #2745 and CI #2750 frontend lint, TypeScript, Vitest, production build and dependency audit.
- CI #2745 and CI #2750 all non-UI-shard-2 product/browser/backend gates, including visual regression without baseline updates.
- Both failed-job logs, screenshots, accessibility snapshots, Playwright reports and traces reviewed.

### Checks failed

- CI #2745 UI shard 2: stale hidden-streak neighbor locator.
- CI #2750 UI shard 2: symmetric top expansion is not hit-testable at the compact viewport/header boundary in Android Chromium and iOS WebKit.
- Local clone validation remains unavailable because the isolated execution environment cannot resolve `github.com`; connector and authoritative CI evidence are used.

### Current branch head

`e70fd21032dd036f966f125fde1890cd79254862` is the failed immutable head for CI #2750. The block-axis correction will create a new head.

### Next action

Apply the one-owner block-axis correction, update source evidence and PR diagnosis, compare the exact diff against live `main`, then run a new full authoritative CI. Neither CI #2745 nor CI #2750 will be used as merge evidence.
