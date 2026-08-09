# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-learning-section-switch-touch-targets`
- Base SHA: `d202c193928e28366606990683067403802ec55b`
- Head SHA: resolve from live branch ref
- PR: #454

## Objective

Close the next evidenced Issue #74 touch-target gap for the canonical Learning subsection switch shared by `/learn` and `/scenarios`.

## Scope

- Preserve the existing painted `44px` Learning subsection links.
- Expand only the effective block-axis hit surface to `48px` for coarse pointers.
- Prove both canonical runtime owners (`RouteChrome` on `/learn` and `LexigoScenarioCatalogApp` on `/scenarios`).
- Add fail-closed source ownership coverage and cross-browser real-hit geometry coverage.
- Register the browser proof in blocking UI and accessibility collections.

## Non-goals

- No redesign of the Learning subsection switch.
- No changes to scenario/lesson data contracts, navigation semantics, API fixtures, or authentication.
- No global `.lx-button` or shared navigation sizing changes.
- No visual snapshot updates.
- No changes to unrelated Issue #74 controls.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/learning-section-switch-touch-targets.css`
- `frontend/components/learning-section-switch-touch-target-source.test.ts`
- `frontend/e2e/learning-section-switch-touch-targets.spec.ts`
- `frontend/package.json`

## Prohibited paths

- All paths not listed above.
- `frontend/app/scenario-catalog.css` remains the painted presentation owner.
- `frontend/app/learning-section-switch.css` remains the `/learn` placement owner.
- Runtime component sources are evidence only and must not be modified in this slice.

## Runtime owners

- `frontend/components/route-primary-navigation.tsx` — canonical `/learn` `LearningSectionSwitch` in `RouteChrome`.
- `frontend/components/lexigo-scenario-catalog-app.tsx` — canonical authenticated `/scenarios` switch.
- `frontend/app/scenario-catalog.css` — painted `44px` geometry and `minmax(120px, 1fr)` width owner.
- `frontend/app/learning-section-switch-touch-targets.css` — interaction-only effective target owner introduced by this slice.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Fine-pointer painted geometry remains `44px` high.
- Fine-pointer effective target is at least `44px`.
- Coarse-pointer effective target is at least `48px`.
- The two sibling link targets remain independently hittable and do not intersect.
- Hit expansion is paint-inert: transparent background, zero border, no shadow.
- Inline hit ownership is unchanged because each link is already at least `120px` wide.
- Existing focus-visible ownership remains authoritative.
- No horizontal overflow is introduced.

## Acceptance criteria

- `/learn` and `/scenarios` each expose exactly two links under the `Разделы обучения` navigation.
- Both links retain a painted height of approximately `44px`.
- Effective target geometry meets `44px` fine / `48px` coarse minimums.
- All effective perimeter points resolve to the owning link.
- Effective sibling target rectangles do not intersect.
- Active `aria-current="page"` semantics remain correct on both routes.
- Focus-visible remains at least a `3px` visible outline.
- Browser proof runs in desktop Chromium, Android Chromium, and iOS WebKit through blocking UI/a11y scripts.

## Required checks

- Source contract: `frontend/components/learning-section-switch-touch-target-source.test.ts`.
- Browser contract: `frontend/e2e/learning-section-switch-touch-targets.spec.ts`.
- Repository lint/type/unit gates through CI.
- Blocking browser UI and accessibility collections through CI.
- Immutable-head / branch policy gates through CI.

## Risks

- A pseudo-element can accidentally overlap a sibling target if expanded on the inline axis; this slice explicitly keeps `inset-inline: 0`.
- Browser geometry can report pseudo-element insets differently; the proof measures effective rectangles and real perimeter hit ownership in all required browser projects.
- Changing the painted `min-height` would cause visual drift; the presentation owner is intentionally untouched.

## Rollback

Revert this atomic PR. The previous `44px` painted switch remains intact because the fix is an isolated interaction layer plus tests/import registration.