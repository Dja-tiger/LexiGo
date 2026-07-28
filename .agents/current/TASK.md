# Current Task

## Identity

- Issue: #115 — Complete route-island architecture documentation and close the epic.
- Branch: `docs/issue-115-route-island-architecture`.
- Base SHA: `279eb4dcfe461ce6c9b056146644689e488e44cc`.
- Head SHA: resolve from live branch ref before every immutable-head gate.
- PR: create as Draft after the documentation/source-contract slice is complete.

## Objective

Bring the public frontend architecture documentation into exact agreement with the shipped route-island graph, protect that agreement with an executable source contract and close Issue #115 only after full CI, expected-head squash merge and post-merge validation.

## Scope

- Update `README.md` to list every canonical dynamic route entry now loaded by `LexigoBootstrappedApp`.
- Replace stale claims that Phrases or Active Lesson are owned by `LexigoPremiumApp`.
- Document `LexigoPremiumApp` as a narrow compatibility fallback rather than a canonical route owner.
- Update `docs/architecture.md` with the completed route-island inventory, Phrases ownership and compatibility-debt boundary under Issue #70.
- Add a source-level documentation contract that fails when README or architecture regress to retired route ownership.
- Add a reusable Agent Harness lesson for keeping architecture documentation synchronized with executable ownership inventories.
- Record task progress and execution evidence in `.agents/current/**`.

## Non-goals

- No runtime, route selection, API, state, History, session, outbox, Service Worker, PWA, CSS or bundle-budget changes.
- No deletion or refactoring of `LexigoPremiumApp`; that remains Issue #70.
- No redesign, Figma changes, visual baseline changes or dependency updates.
- No changes to backend, database, migrations, OpenAPI, workflows or deployment configuration.

## Allowed paths

- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-115-architecture-docs.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `README.md`
- `docs/architecture.md`
- `frontend/components/production-app-entry.test.ts`

## Prohibited paths

- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/app/**`
- `frontend/lib/**`
- `frontend/e2e/**`
- `frontend/bundle-budgets.json`
- `backend/**`
- `api/**`
- `migrations/**`
- `.github/workflows/**`
- `deploy/**`
- Any path outside Allowed paths without first updating this task and repeating pre-flight.

## Runtime owners

- `frontend/app/layout.tsx`: global runtime, Service Worker, persistent shell and legal footer.
- `RoutedLexigoApp`: canonical route shell, skip link and persistent navigation chrome.
- `LexigoBootstrappedApp`: sole session restoration, refresh coordination, account runtime and dynamic route-entry loader.
- Dedicated route entries: Home, Learn, Active Lesson, Dictionary, Phrases, Progress, authenticated Profile, Scenario catalog and Scenario detail.
- `LexigoPremiumApp`: narrow compatibility fallback only; it is not the canonical owner of Phrases or Active Lesson.
- `ReviewOutboxRuntime`: sole connectivity and durable review-queue owner.

## Documentation owners

- `README.md`: concise public production-entry and ownership summary.
- `docs/architecture.md`: normative route and runtime-boundary description.
- `frontend/components/production-app-entry.test.ts`: executable inventory of production roots and documentation synchronization contract.
- `.agents/AGENTS.issue-115-architecture-docs.md`: reusable prevention rule for architecture-documentation drift.

## Invariants

- Documentation must describe the actual current source graph, not a historical migration stage.
- Every canonical route island remains loaded only by `LexigoBootstrappedApp`.
- Session bootstrap, refresh, account runtime, review outbox, Service Worker and appearance ownership remain centralized.
- The compatibility fallback remains documented without claiming ownership of extracted routes.
- Issue #70 remains the only owner of legacy-app deletion and CSS cleanup.
- No runtime bundle, visual or behavior change is introduced by this slice.

## Acceptance criteria

- README explicitly includes `LexigoPhrasesApp` and the canonical Active Lesson, Profile and Scenario entries.
- README no longer states that Phrases or Active Lesson remain in `LexigoPremiumApp`.
- Architecture states that all canonical product routes use dedicated client entries.
- Architecture documents Phrases direct-entry/API/URL-state ownership and the narrow compatibility fallback.
- Source contract rejects the known stale phrases and verifies the canonical island inventory in both documents.
- Issue #115 acceptance criteria are mapped to existing runtime tests/budgets and this documentation contract.
- Full required CI passes on the final developer-authored head.
- Review comments, reviews and unresolved threads are empty or resolved.
- Expected-head squash merge and post-merge validation complete before Issue #115 closes.

## Required checks

- Agent Harness validation.
- Frontend lint, TypeScript, unit/source-contract tests and production build.
- Full backend/frontend/browser/container CI because README and `docs/architecture.md` are outside the Agent Docs lightweight allow-list.
- Changed-path audit against this allow-list.
- Review comment, review submission and unresolved-thread audit.
- Post-merge `main` CI and stage-scope validation.

## Risks

- Documentation may overstate cleanup and imply that `LexigoPremiumApp` is already deleted.
- A brittle text-only test may reject harmless wording changes instead of protecting ownership semantics.
- Updating only one document could leave two public sources inconsistent.
- Closing Issue #115 before full CI or post-merge validation would violate the repository harness.

## Rollback

Revert the single documentation squash merge. Runtime behavior and deployed images are unchanged by this slice.
