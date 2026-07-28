# Current Task Execution

## Task

- Issue: #70 — prove the Phrases compatibility deletion boundary.
- Branch: `test/issue-70-phrases-compatibility-proof`.
- Base SHA: `3d4a8dd49255da11f25fd38f92b2a8637d443517`.
- Head SHA: resolve from live branch ref before every immutable-head gate.
- PR: create as Draft after final compare/readback.

## Skills used

### Repository Agent Harness

Purpose: isolate one production-safe tooling slice, prevent premature compatibility deletion and require full CI/merge/post-merge evidence before runtime cleanup.

Instruction source: `AGENTS.md`, `.agents/AGENTS.md`, every indexed mandatory rule, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**` and `docs/agent-harness.md`.

Version or verification date: 2026-07-28.

Inputs: live `main`, Issue #70 and comments, completed Issues #115/#199, canonical architecture, route island source contracts and stage status Issue #12.

Files inspected: `lexigo-bootstrapped-app.tsx`, `lexigo-phrases-app.tsx`, `lexigo-premium-app.tsx`, `phrases-route-island-source.test.ts`, `production-app-entry.test.ts`, layout CSS imports, compatibility/route documentation and mandatory Agent rules.

Actions performed:

- verified the previous reconciliation completed before selecting Issue #70;
- confirmed no parallel PR existed;
- created an exact-base branch and declared allowed/prohibited paths before writes;
- kept all runtime, CSS, E2E, workflow and backend sources read-only;
- read back every written path and retained a single bounded tooling objective.

Commands or procedures: GitHub exact-file/blob reads, repository code search as discovery only, branch-scoped writes, source-marker inventory and branch/base verification.

Artifacts produced: active task record, progress record, mandatory reachability rule, executable source proof and compatibility cleanup manifest.

Result: runtime deletion remains blocked until the proof PR completes full delivery.

Failures: none before CI.

Root cause: not applicable.

Fallback: large compatibility source was inspected through exact ranged/blob reads because local repository clone networking was previously unavailable.

Limitations: this slice proves a deletion boundary but does not measure the eventual source/bundle reduction; that evidence belongs to the runtime removal PR.

Reusable lesson: establish reachability and shared-domain boundaries in a separate immutable slice before deleting code from a large fallback component.

### Route Reachability Audit

Purpose: prove which route owner is actually rendered for Phrases across guest and authenticated states.

Instruction source: `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.issue-199-phrases.md`, architecture and Issue #70 acceptance criteria.

Version or verification date: 2026-07-28.

Inputs: `isPhrasesRoute`, `usePhrasesIsland`, the bootstrap render chain and `LexigoPhrasesAppProps`.

Files inspected: `frontend/components/lexigo-bootstrapped-app.tsx` and `frontend/components/lexigo-phrases-app.tsx`.

Actions performed:

- confirmed `/phrases` and every `/phrases/[slug]` pathname match the dedicated route predicate;
- confirmed `usePhrasesIsland` has no `initialSession !== null` condition;
- confirmed the dedicated island branch precedes the final compatibility fallback;
- confirmed the canonical island accepts `Session | null` and owns guest content;
- confirmed canonical authenticated catalog, direct detail, History and Learn handoff contracts.

Commands or procedures: exact source reads and semantic order/index assertions in `phrases-route-island-source.test.ts`.

Artifacts produced: guest/auth route reachability assertions.

Result: Phrases catalog/detail code inside the fallback is unreachable from canonical Phrases URLs.

Failures: none.

Root cause: not applicable.

Fallback: not applicable.

Limitations: the compatibility fallback remains reachable for non-Phrases guest/auth states.

Reusable lesson: a session-independent route predicate plus render precedence is required to prove both guest and authenticated replacement ownership.

### Compatibility Deletion Boundary Audit

Purpose: distinguish dead route-level Phrases duplication from live shared phrase learning behavior.

Instruction source: Issue #70, `.agents/AGENTS.issue-70-compatibility-reachability.md` and the confirmed Phrases route-island ownership.

Version or verification date: 2026-07-28.

Inputs: exact `LexigoPremiumApp` state declarations, effects, loaders, presentation functions and lesson-domain branches.

Files inspected: `frontend/components/lexigo-premium-app.tsx`, canonical Phrases sources and shared phrase libraries through their live consumers.

Actions performed:

- inventoried duplicated catalog/detail state, filters, loaders, API request, lifecycle resets and render branches;
- identified imports/types that may become unused only after route-family deletion;
- separately inventoried live `LessonSource = "phrases"`, mixed lesson, cloze judgement and answer-suggestion behavior;
- explicitly prohibited CSS deletion without selector and computed-cascade proof;
- defined the exact objective and validation matrix for the next product cleanup PR.

Commands or procedures: source-marker audit, consumer classification and exact manifest publication.

Artifacts produced: `frontend/docs/compatibility-cleanup.md` and candidate/shared marker assertions.

Result: the next runtime slice has a bounded, reviewable deletion surface and stop conditions.

Failures: none.

Root cause: not applicable.

Fallback: uncertain symbols are retained and delegated to TypeScript/consumer audit in the next slice rather than pre-classified as dead.

Limitations: no CSS selector or bundle removal is authorized by this tooling PR.

Reusable lesson: route-level state and presentation can be dead while the same domain type remains live in lessons; deletion manifests must represent both sets.
