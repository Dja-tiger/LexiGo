# Current Task

## Identity

- Issue: #74
- Branch: `agent/issue-74-header-profile-touch-target`
- Base SHA: `cda65e39ba65cd00651be3ae7e39da651cc57f1c`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Give the confirmed live header button `Открыть профиль` a minimum effective touch target of 44 CSS px for fine pointers and 48 CSS px for coarse pointers without changing its painted geometry, runtime behavior, accessible name or route ownership.

## Scope

- Add one narrow global CSS owner for the interactive `button.lx-avatar[aria-label="Открыть профиль"]` used by canonical route islands.
- Preserve the existing 44px desktop and 42px compact painted avatar boxes.
- Expand the effective target on both axes with paint-inert pseudo-element hit slop.
- Prove target dimensions, four perimeter hits, neighboring-control separation, keyboard focus and compact overflow in desktop Chromium, iOS WebKit and Android Chromium.
- Add fail-closed source ownership and authoritative command registration.
- Remove obsolete negative assertions from the completed connectivity slice that prohibited a future header-target owner.

## Non-goals

- No JSX, navigation, session, profile or API behavior change.
- No change to the decorative profile-page `.lx-avatar` span.
- No change to hidden legacy `.lx-icon-button`, streak behavior, other header/icon actions or `Все режимы`.
- No mobile-navigation label, enlarged-text, 200% zoom or physical-device completion claim.
- No visual baseline, dependency, lockfile, backend or workflow change.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/header-profile-touch-targets.css`
- `frontend/components/header-profile-touch-target-source.test.ts`
- `frontend/components/connectivity-touch-target-source.test.ts`
- `frontend/e2e/header-profile-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- Route component JSX and runtime owners.
- `frontend/app/premium-ui.css`, `mobile-pwa-fixes.css`, `profile.css`, focus styles and navigation styles.
- Visual snapshots and bundle budgets.
- Backend, API, migrations, dependencies, lockfiles and workflows.
- `main` and unrelated Dependabot branches.

## Runtime owners

- Canonical route islands expose the interactive avatar button with accessible name `Открыть профиль`.
- Existing navigation callbacks remain the only behavior owners.
- The authenticated Profile island exposes a decorative `span.lx-avatar[aria-hidden="true"]`; it is explicitly excluded by the `button` selector.

## Documentation owners

- `.agents/current/**` records the active atomic slice and factual validation.
- `.agents/PROJECT_STATE.md` remains unchanged until product merge and stage validation are complete.

## Invariants

- Painted avatar dimensions remain 44×44 desktop and 42×42 compact.
- Accessible name, role, DOM, callbacks, focus visuals, colors and layout remain unchanged.
- Effective target is at least 44×44 for fine pointer and 48×48 for coarse pointer.
- Hit slop does not intersect the neighboring streak control and causes no horizontal overflow.
- The decorative Profile avatar is not made interactive and receives no pseudo hit surface.

## Acceptance criteria

- Exact live role/name lookup resolves one visible profile button on Home.
- Fine-pointer target is 44×44 or larger; coarse-pointer target is 48×48 or larger.
- Top, right, bottom and left perimeter points resolve to the button.
- Neighboring visible header control remains outside the expanded target.
- Keyboard focus retains the global `:focus-visible` outline and halo.
- Compact viewport has no horizontal overflow.
- Source contracts protect route consumers, visible geometry, selector scope, import order and test registration.

## Required checks

- Source contract, frontend lint, TypeScript, Vitest and production build.
- Focused desktop Chromium, iOS WebKit and Android Chromium browser proof.
- Full UI, accessibility, axe, visual, performance, PWA, service-worker, backend and container gates required by product CI.
- Immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.

## Risks

- A broad `.lx-avatar` selector could affect the decorative Profile span.
- Inline hit expansion could overlap the streak control if spacing assumptions are wrong.
- Pseudo-element stacking could make perimeter points resolve to a sibling instead of the button.
- A source-only assertion could miss browser-computed logical inset behavior.

## Rollback

Remove the new stylesheet import, stylesheet, source contract and browser proof; restore the completed connectivity source contract registration assertions. No data or API rollback is required.
