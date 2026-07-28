# Current Task

## Identity

- Issue: #70 — remove one proven-dead legacy speech layout CSS family.
- Branch: `refactor/issue-70-remove-legacy-speech-layout-css`.
- Base SHA: `986ab18f4faa2f8a0581133e976cb104a3e4434a`.
- Head SHA: resolve from live branch ref.
- PR: not opened yet.

## Objective

Remove only the unused `.lx-detail-speech-row` and `.lx-test-prompt-row` selector family from `frontend/app/speech-player.css` after proving that no executable TS/TSX consumer remains and that canonical speech presentation has independent owners.

## Scope

- Delete the grouped legacy layout selectors, their heading rule, legacy prompt geometry, legacy speech-button geometry and compact gap override from `speech-player.css`.
- Add a fail-closed, comment-stripped source contract that scans all frontend CSS and executable component TS/TSX for both retired class contracts.
- Preserve the live `.lx-speech-player`, feedback, loading/error/unsupported, reduced-motion and compact feedback rules.
- Preserve canonical Phrase Detail, Word Detail and Active Lesson speech owners and import order.
- Update `frontend/docs/compatibility-cleanup.md` with the exact completed selector boundary and remaining CSS stop conditions.

## Non-goals

- No redesign, token change, visual baseline promotion or import reordering.
- No changes to canonical Phrase Detail, Word Detail, Active Lesson or `SpeechPlayerButton` markup.
- No deletion of `.lx-detail-card`, `.lx-phrase-*`, `.lx-word-detail-*`, `.lx-active-lesson__*` or shared system-state selectors.
- No broad `speech-player.css` consolidation.
- No runtime, backend, API, migration, deployment or permanent workflow change.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/speech-player.css`
- `frontend/app/legacy-speech-layout-style-ownership.test.ts`
- `frontend/docs/compatibility-cleanup.md`

## Prohibited paths

- all other frontend source and stylesheet files
- visual baseline files
- bundle-budget files
- backend, API, migration, deployment and workflow files

## Runtime owners

- `SpeechPlayerButton` remains the shared speech runtime owner.
- `PhraseDetailPresentation` owns `.lx-phrase-detail-title-row` and `.lx-phrase-listen`.
- `WordDetailPresentation` owns `.lx-word-detail-hero` and `.lx-word-detail-speech`.
- `ActiveLessonPresentation` owns `.lx-active-lesson__utilities` and its speech control.
- `speech-player.css` retains only shared speech player state/feedback behavior after the legacy layout family is removed.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md` records the selector proof, deletion and remaining Issue #70 boundaries.
- `.agents/PROJECT_STATE.md` is updated only in a separate post-merge reconciliation PR.

## Invariants

- Speech remains usable in canonical Phrase Detail, Word Detail and Study mode.
- Loading, error and unsupported speech states retain their styles.
- Reduced-motion disables speech loading animation.
- Compact feedback remains positioned above PWA navigation and lesson-focus feedback remains correctly positioned.
- CSS import order remains unchanged.
- Pure cleanup produces unchanged authoritative Linux visual hashes.

## Acceptance criteria

- Comment-stripped CSS search finds neither `.lx-detail-speech-row` nor `.lx-test-prompt-row` anywhere under `frontend/app`.
- Executable TS/TSX search finds neither class contract anywhere under `frontend/components`.
- The new source contract also verifies live shared speech selectors, canonical owner classes and import ordering.
- Final diff contains only the six allowed paths.
- Frontend lint, TypeScript, unit/source contracts, production build, full browser/accessibility/PWA/visual/performance/container CI all pass.
- No visual baseline or permanent budget changes.
- Review audit is empty or all actionable feedback is resolved.
- Expected-head squash merge and exact-SHA stage/public validation succeed.

## Required checks

- Agent Harness source contract.
- Frontend lint, TypeScript, unit/source tests and production build.
- Speech behavior in Phrase Detail, Word Detail and Active Lesson Study mode.
- Desktop Chromium/WebKit, Android/iOS PWA, keyboard, axe, reduced motion, forced colors and 200% reflow.
- Authoritative Linux visual regression without baseline updates.
- Existing performance budgets and API/web container builds.
- Full backend/frontend/browser/container CI.

## Risks

- A legacy class may be assembled dynamically and missed by naive search.
- Grouped selector deletion may accidentally remove declarations still needed by a live sibling selector.
- A selector may be absent from source but still influence generated markup through an external contract.
- Visual hashes may reveal an unexpected computed-cascade dependency.

## Rollback

Revert the atomic squash merge. Stop before merge if any executable consumer, generated consumer, visual delta or scope expansion is found.