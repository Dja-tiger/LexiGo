# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-progress-boundary`
- Base SHA: `5251485f9d780efabd3bd2379f887852fd8fd71b`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Prove, with an executable source contract, that canonical `/progress` guest and authenticated entry is always owned by `LexigoProgressApp` before the final `LexigoPremiumApp` fallback, while precisely separating the still-present compatibility Progress presentation from shared progress data consumed by Home, Profile and lesson flows.

## Scope

- Strengthen `progress-route-island-source.test.ts` with route-selection ordering.
- Prove guest and authenticated Progress entry are independent of session presence.
- Inventory the exact compatibility Progress presentation markers that remain for the next deletion slice.
- Protect shared progress state, loading and lesson-domain consumers from accidental deletion.
- Record factual execution evidence in `.agents/current/**`.

## Non-goals

- No runtime deletion in this proof-only slice.
- No change to `LexigoPremiumApp`, `LexigoProgressApp` or `LexigoBootstrappedApp` runtime behavior.
- No CSS, visual baseline, API, backend, migration, deployment or bundle-budget change.
- No broad compatibility fallback removal.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/progress-route-island-source.test.ts`

## Prohibited paths

- all runtime TS/TSX files other than the source test
- `.github/workflows/**`
- `scripts/ci/**`
- CSS and visual snapshots
- backend, API, migrations, deployment and bundle budgets

## Runtime owners

- `LexigoBootstrappedApp` owns route selection and chooses `LexigoProgressApp` before the compatibility fallback.
- `LexigoProgressApp` owns canonical `/progress` presentation and API/evidence behavior.
- `LexigoPremiumApp` still contains shared progress state/data consumers and a separate compatibility Progress presentation family.

## Documentation owners

- `.agents/current/**` records this proof slice and its evidence.
- `frontend/docs/compatibility-cleanup.md` remains the durable delivery plan and is not changed in this proof-only PR.

## Invariants

- `/progress` selects the dedicated island for both guest and authenticated sessions.
- The dedicated island remains before `LexigoPremiumApp` in the render chain.
- Persistent session, outbox and service-worker owners are not duplicated.
- Compatibility presentation markers remain present until a later independently validated deletion PR.
- Shared progress consumers in Home, Profile and lesson-result flows remain protected.

## Acceptance criteria

- Source contract proves exact route detection, unconditional island selection and render ordering.
- Source contract proves the dedicated island does not own persistent runtime concerns.
- Source contract inventories the compatibility presentation boundary separately from shared progress consumers.
- Final compare is behind `0` and contains only the four allowed paths.
- Required CI passes on one immutable developer-authored head.

## Required checks

- Agent Harness and change-scope classification.
- Frontend lint, TypeScript, unit/source tests, production build and dependency audit.
- Complete required CI according to repository classification.
- Review/comments/threads audit and exact compare.

## Risks

- An over-broad marker could classify a shared progress consumer as route-only and authorize unsafe deletion.
- A weak ordering assertion could miss session-gated fallback behavior.

## Rollback

Revert the proof-only test and current-task documentation. No runtime or data rollback is required.
