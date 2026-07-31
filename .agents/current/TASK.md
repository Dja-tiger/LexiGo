# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-remove-legacy-learn`
- Base SHA: `1f55d5f9c38fc191c1b213930e1379da360c20dc`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Remove only the proven-unreachable legacy Learn presentation from `LexigoPremiumApp` after PR #316 established the canonical `/learn` boundary.

## Scope

- Delete `renderLearn`.
- Delete the exact `navigation.view === "learn" ? renderLearn()` dispatch branch.
- Convert the Learn source contract from candidate-presence to absence/preservation evidence.

## Non-goals

- No changes to `LexigoLearnApp` behavior or design.
- No deletion of `startLesson`, authentication, Library, Profile, Lesson, unknown-route fallback or Active Lesson behavior.
- No CSS, API, backend, workflow, visual baseline or bundle-ceiling changes.

## Allowed paths

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/learn-route-island-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Other runtime implementation files.
- CSS, snapshots, backend, migrations and permanent workflows.

## Runtime owners

- `LexigoBootstrappedApp`: canonical Learn graph selection and render precedence.
- `LexigoLearnApp`: canonical Lesson Composer owner.
- `LexigoPremiumApp`: shared authentication, recovery, Library/Profile/Lesson and lesson-domain compatibility behavior.

## Documentation owners

- `.agents/current/**`

## Invariants

- `/learn` continues to render `LexigoLearnApp` before the compatibility fallback.
- `startLesson` and all shared auth/lesson owners remain available.
- Active Lesson handoff remains on the product graph.
- No visual or API behavior changes.

## Acceptance criteria

- `renderLearn` is absent from `LexigoPremiumApp`.
- Its exact dispatch branch is absent.
- Source contract protects canonical Learn precedence and shared-owner preservation.
- Final diff contains no temporary workflow.
- Full required CI passes on the final developer-authored head.

## Required checks

- Source contract, lint, TypeScript, unit tests and production build.
- Full browser/accessibility/performance/container CI.
- Review audit, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- Accidentally deleting shared lesson creation or authentication behavior adjacent to the legacy presentation.
- Leaving a temporary workflow in the final diff.

## Rollback

Revert the runtime/test commits to restore the bounded legacy presentation without changing canonical Learn ownership.
