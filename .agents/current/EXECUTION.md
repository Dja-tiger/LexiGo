# Execution

## Pre-flight

- Repository: `Dja-tiger/LexiGo`
- Base SHA: `edcfd3dbee62a4dba253df07d984fa326350c984`
- Branch: `feat/issue-18-diagnostic-onboarding-backend`
- Phase 1 exact-SHA main CI #3151 and Stage #2994 are green.
- Issue #18 is open.
- Issue #201 is open and its body still requires missing canonical Figma node IDs before onboarding UI implementation.
- Required `.agents` governance and current task state were read before write.

## Safety decisions

- Keep onboarding state server-owned and cross-device.
- Never infer objective correctness from `known/unsure/new`.
- Never insert synthetic `review_events` for onboarding self-marks.
- Only initialize `user_words` rows that are still `new`; preserve existing learned state.
- Bound diagnostic to 12 items to remain compatible with the <=5 minute product requirement.
- Return no translation in status/start prompt; reveal translation only after current item mark is stored.
- Serialize state changes with a per-user advisory transaction lock.
- Keep UI/Figma paths prohibited in this phase.

## Validation plan

- gofmt/static analysis.
- learning package unit + race tests.
- PostgreSQL migration/integration tests.
- full scope-classified repository CI.
- immutable-head review/thread audit.
- expected-head squash merge.
- exact-SHA main CI and Stage/public validation.
