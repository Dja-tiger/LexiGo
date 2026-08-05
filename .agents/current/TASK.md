# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-home-progress-target`
- Base SHA: `6563e7e2dbdefe6d42f6cd3c30b747030c6acca5`
- Head SHA: resolve from the live branch ref after the final evidence commit
- PR: #405

## Objective

Guarantee fine-pointer and coarse-pointer effective target sizes for the live canonical Home action `Открыть прогресс` without changing its approved painted presentation or route behavior.

## Scope

- Confirm `Открыть прогресс` is the only exposed secondary Home CTA in the canonical route owner.
- Add one narrow interaction-only CSS owner scoped to the direct progress-panel button.
- Preserve the existing 44px production border box while guaranteeing a 48px coarse-pointer effective target.
- Prove exact accessible-name ownership, transparent perimeter hits, separation from panel content, focus-visible and compact overflow in desktop Chromium, Android Chromium and iOS WebKit.
- Keep the proof in the existing blocking Home UI specification.

## Non-goals

- No change to the primary Home CTA, which already has a 48px route-specific production minimum and uses `.large` semantics.
- No change to hidden `.lx-home-paths` actions; canonical Home explicitly removes that catalogue from the accessibility tree.
- No visual redesign, spacing, color, typography, border, snapshot or Figma change.
- No progress API, navigation, session, history, storage, PWA or route-lifecycle change.
- No whole-application 200% browser zoom or physical-device acceptance in this slice.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/home-progress-touch-targets.css`
- `frontend/components/home-progress-touch-target-source.test.ts`
- `frontend/e2e/adaptive-knowledge-coach-home.spec.ts`

## Prohibited paths

- Backend, API, migrations and deployment workflows.
- Home runtime handlers and route navigation implementation.
- Existing visual snapshots.
- Previously completed Issue #74 touch-target owners.
- Dependency manifests and Dependabot branches.

## Runtime owners

- Canonical Home runtime: `frontend/components/lexigo-home-app.tsx`.
- Home painted presentation and visibility: `frontend/app/adaptive-knowledge-coach-home.css`.
- Base button geometry: `frontend/app/premium-ui.css` and the Home route override.
- Event-surface owner: `frontend/app/home-progress-touch-targets.css`.
- Global focus-visible owner: `frontend/app/accessibility-focus.css`.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Exact accessible name remains `Открыть прогресс`.
- The callback continues to navigate to `{ view: "progress" }`.
- The production visual border box remains 44px high and full panel width.
- Approved colors, border, radius, typography, panel spacing and snapshots remain unchanged.
- Hit expansion is block-axis-only and remains inside the panel/content separation envelope.
- Hidden Home path actions remain hidden.

## Acceptance criteria

- The live Home progress CTA has an effective height of at least 44 CSS px for fine pointer and 48 CSS px for coarse pointer.
- All four effective-target perimeter points resolve to the owning button.
- The visual border box and horizontal dimensions remain unchanged.
- The effective target does not intersect preceding progress content or escape the panel.
- Keyboard focus-visible remains present.
- 320px and 390px layouts have no horizontal overflow.
- Source ownership and blocking browser proof pass without snapshot changes.

## Required checks

- Agent Harness routing validation.
- Focused Vitest source contract.
- Frontend lint, TypeScript, unit and production build.
- Targeted Playwright in desktop Chromium, Android Chromium and iOS WebKit.
- Full frontend UI/accessibility/browser, axe, visual and performance gates.
- Backend/security/integration and container gates through authoritative CI.
- Immutable-head PR CI, expected-head squash merge, exact-SHA main CI and exact-image stage/public validation.

## Risks

- A broad selector could affect hidden path-card or non-Home buttons.
- Pseudo-element expansion could intersect metrics if vertical spacing assumptions are wrong.
- A browser fixture could render an error/guest state instead of the canonical progress panel.
- Import order could let another owner override positioning or event geometry.

## Rollback

Remove the dedicated stylesheet import, stylesheet, source contract and focused browser assertions. No data or API rollback is required.
