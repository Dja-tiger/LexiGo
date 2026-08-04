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

Only UI shard 2 failed. Playwright report artifact `frontend-playwright-report-ui-2` (`8901594340`) shows that the new test waited for `.lx-header-tools .lx-streak` to be visible on compact devices. Runtime evidence and screenshots show that this streak button is intentionally hidden in compact presentation; the actual visible adjacent control is `.lx-route-reminder-entry > summary`, the fixed dark calendar reminder entry. The application, profile button and route remained healthy.

Classification: stale test/live-neighbor ownership error, not production rendering failure and not browser flake. The production CSS remains supported by green source, build, accessibility and visual gates. The browser proof must measure separation from the actual visible reminder summary.

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
- CI #2745 frontend lint, TypeScript, Vitest, production build and dependency audit.
- CI #2745 all non-UI-shard-2 product/browser/backend gates, including visual regression without baseline updates.
- Failed-job logs, screenshot, accessibility snapshot and trace artifact review.

### Checks failed

- CI #2745 UI shard 2: new test used hidden `.lx-streak` as compact neighbor. This is a deterministic stale locator, not an accepted retry.
- Local clone validation remains unavailable because the isolated execution environment cannot resolve `github.com`; connector and authoritative CI evidence are used.

### Current branch head

`da680c73ecb2c1a69119d3a4fbb17b73ec2a86ce` after correcting the TASK ownership record. A new immutable head will be created by the test/source correction.

### Next action

Replace the stale neighbor assertion with the visible `.lx-route-reminder-entry > summary`, protect that owner in the source contract, update PR metadata, and run a new full authoritative CI on the corrected immutable head. CI #2745 will not be used as merge evidence.
