# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-legacy-learn`
- Base SHA: `1f55d5f9c38fc191c1b213930e1379da360c20dc`
- Head SHA: resolve from live branch ref
- PR: #318

## Objective

Remove only the proven-unreachable legacy Learn presentation from `LexigoPremiumApp` after PR #316 established the canonical `/learn` boundary.

## Scope

- Delete `renderLearn`.
- Delete the exact `navigation.view === "learn" ? renderLearn()` dispatch branch.
- Convert the Learn source contract from candidate-presence to absence/preservation evidence.
- Update the existing Home absence contract so it no longer protects the independently retired Learn presentation while continuing to preserve shared fallback owners.
- Align the existing progressive Lesson Composer source contract with canonical Learn presentation ownership while preserving the production lesson API owner.
- Align existing navigation E2E assertions with canonical `/learn` empty-active-lesson and saved-active-lesson states after the legacy heading is retired.

## Non-goals

- No changes to `LexigoLearnApp` behavior or design.
- No deletion of `startLesson`, authentication, Library, Profile, Lesson, unknown-route fallback or Active Lesson behavior.
- No CSS, API, backend, permanent workflow, visual baseline or bundle-ceiling changes.

## Allowed paths

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/learn-route-island-source.test.ts`
- `frontend/components/home-route-island-source.test.ts`
- `frontend/app/adaptive-lesson-composer.test.ts`
- `frontend/e2e/adaptive-navigation.spec.ts`
- `frontend/e2e/app-router-routes.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Other runtime implementation files.
- CSS, snapshots, backend, migrations and permanent workflows.

## Runtime owners

- `LexigoBootstrappedApp`: canonical Learn graph selection and render precedence.
- `LexigoLearnApp`: canonical Lesson Composer owner.
- `LexigoPremiumApp`: shared authentication, recovery, Library/Profile/Lesson and lesson-domain API compatibility behavior.

## Documentation owners

- `.agents/current/**`

## Invariants

- `/learn` continues to render `LexigoLearnApp` before the compatibility fallback.
- `startLesson` and all shared auth/lesson owners remain available.
- Active Lesson handoff remains on the product graph.
- Existing Home retirement evidence remains valid without treating retired Learn presentation as shared runtime.
- Progressive composer tests distinguish canonical presentation ownership from retained lesson API ownership.
- Navigation E2E distinguishes an absent active lesson from a saved active lesson instead of depending on the retired legacy heading.
- No visual or API behavior changes.

## Acceptance criteria

- `renderLearn` is absent from `LexigoPremiumApp`.
- Its exact dispatch branch is absent.
- Learn, Home and progressive composer source contracts protect canonical route precedence, retirement evidence and shared-owner preservation without contradictory assertions.
- Existing navigation E2E validates canonical Learn state ownership without legacy presentation copy.
- Final diff contains no temporary workflow.
- Full required CI passes on the final developer-authored head.

## Required checks

- Source contracts, lint, TypeScript, unit tests and production build.
- Full browser/accessibility/performance/container CI.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- Accidentally deleting shared lesson creation or authentication behavior adjacent to the legacy presentation.
- Leaving a contradictory source contract or temporary workflow in the final diff.

## Rollback

Revert the runtime/test commits to restore the bounded legacy presentation without changing canonical Learn ownership.
