# Current Task

## Identity

- Issue: #74
- Branch: `agent/issue-74-header-touch-targets`
- Base SHA: `c56485511c752aacd3e2f43cd0d102f229a9c25f`
- Head SHA: resolve from live branch ref
- PR: #387

## Objective

Make the live Dictionary reminder control meet minimum effective touch-target size without changing its 19px visible icon, 42px button geometry, adjacent avatar or surrounding layout.

## Scope

- Add one narrow routed stylesheet with a 44 CSS px target by default and 48 CSS px for coarse-pointer environments.
- Import it without reordering existing global style owners.
- Expand only the existing reminder SVG border box through transparent padding while preserving a 19×19 px content box.
- Preserve the visual button, avatar, spacing and existing global keyboard-focus owner.
- Add fail-closed source ownership evidence and real Chromium/iOS/Android hit-testing coverage.
- Register the focused browser suite in authoritative UI and accessibility CI.

## Non-goals

- No Home streak/avatar or Dictionary avatar remediation in this slice.
- No broad route-by-route control audit.
- No mobile navigation label change; compact navigation already has 48×52 targets and 11–12 px labels.
- No text-only action remediation.
- No manual real-device acceptance claim; it remains required before Issue #74 closure.
- No JSX/runtime, focus visual, Figma redesign, visual baseline, budget or dependency change.

## Allowed paths

- `frontend/app/header-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/header-touch-target-source.test.ts`
- `frontend/e2e/header-touch-targets.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- component JSX/TSX runtime
- existing CSS owner files and global import reordering
- visual snapshots and route budgets
- backend, API, migrations and deployment workflows
- dependencies and lockfiles
- `.agents/PROJECT_STATE.md` before product merge and stage validation

## Runtime owners

- `frontend/app/header-touch-targets.css` — routed Dictionary reminder SVG hit surface.
- `frontend/app/accessibility-focus.css` — unchanged global keyboard-focus visual owner.
- `frontend/components/lexigo-dictionary-app.tsx` — unchanged reminder button and 19×19 BellIcon renderer.

## Documentation owners

- `.agents/current/**` during the active slice.
- `.agents/PROJECT_STATE.md` only after product merge and exact-image stage validation.

## Invariants

- Bell path viewport remains exactly 19×19 CSS px.
- Reminder SVG hit surface is exactly 44×44 with a fine pointer and 48×48 with a coarse pointer.
- The 42×42 button, avatar text raster and header layout remain unchanged.
- The SVG hit surface does not overlap the adjacent avatar.
- Pointer events at all four padded perimeter points resolve inside the reminder button.
- Existing keyboard focus remains visible and no semantic role/name changes.
- No button positioning, pseudo-element, transform, background, shadow or painted output is introduced.
- No horizontal overflow at compact widths.
- Existing global stylesheet imports remain in their current relative order.

## Acceptance criteria

- Dictionary reminder exposes a 44/48 px effective hit surface around an unchanged 19px icon.
- Desktop Chromium, iOS WebKit and Android Chromium prove perimeter hit-testing.
- The expanded SVG remains separated from the adjacent avatar.
- Source contract maps CSS owner, exact BellIcon size, existing focus owner and authoritative browser registration.
- Existing visual hashes remain unchanged.
- Full immutable-head CI, expected-head merge, exact-SHA main CI and exact-image stage/public validation succeed.

## Required checks

- Frontend lint, TypeScript, Vitest source contract and production build.
- Focused desktop Chromium, iOS WebKit and Android Chromium hit-testing.
- Existing keyboard, axe, navigation, visual, performance and PWA matrices.
- Full backend/container gates required by product CI.
- Post-merge main and exact-image stage/public validation.

## Risks

- SVG padding may not participate in hit testing identically across browser engines.
- A 48px SVG border box may overlap the adjacent avatar if header spacing is insufficient.
- CSS replaced-element sizing must retain a 19px content box under `box-sizing: border-box`.

## Rollback

Revert the narrow stylesheet/import, source/browser contracts, command registration and current Agent Harness records. No data, API, JSX or visual snapshot rollback is required.
