# Current Task

## Identity

- Issue: #70 — prove the Phrases compatibility deletion boundary.
- Branch: `test/issue-70-phrases-compatibility-proof`.
- Base SHA: `3d4a8dd49255da11f25fd38f92b2a8637d443517`.
- Head SHA: resolve from live branch ref before every immutable-head gate.
- PR: create as Draft after the proof contract, deletion manifest and readback are complete.

## Objective

Create an executable reachability contract and exact deletion manifest proving that the Phrases catalog/detail family inside `LexigoPremiumApp` is unreachable for both guest and authenticated canonical routes, while explicitly preserving shared phrase lesson-domain behavior. This tooling slice is the mandatory precondition for a later product cleanup PR; it does not delete runtime code itself.

## Scope

- Strengthen the Phrases route-island source contract with guest/auth reachability and render-order assertions.
- Prove that `/phrases` and `/phrases/[slug]` select `LexigoPhrasesApp` before the final `LexigoPremiumApp` fallback without requiring a session.
- Prove that the dedicated island owns guest catalog data, authenticated catalog API, independent detail API, URL/History state and Learn handoff.
- Inventory the exact Phrases catalog/detail states, effects, API loaders and presentation branches still present in `LexigoPremiumApp` as deletion candidates.
- Separate dead catalog/detail compatibility code from live shared phrase lesson support such as `LessonSource = "phrases"`, mixed lessons, cloze judgement and answer suggestions.
- Add a reusable mandatory rule for compatibility reachability proof before deletion.
- Record factual task progress and execution evidence in `.agents/current/**`.

## Non-goals

- No deletion or modification of `LexigoPremiumApp` in this tooling slice.
- No runtime, route selection, API, History, session, outbox, Service Worker, CSS, bundle-budget or visual changes.
- No removal of shared phrase learning data, lesson-source support, cloze exercises or answer-suggestion behavior.
- No broad Issue #70 cleanup, auth fallback extraction, dependency update, Figma work or workflow change.

## Allowed paths

- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-70-compatibility-reachability.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/phrases-route-island-source.test.ts`
- `frontend/docs/compatibility-cleanup.md`

## Prohibited paths

- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-phrases-app.tsx`
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

- `LexigoBootstrappedApp`: sole dynamic route-entry selector and session bootstrap owner.
- `LexigoPhrasesApp`: canonical guest/auth Phrases catalog/detail, URL/History state and Learn handoff owner.
- `LexigoPremiumApp`: guest/auth compatibility fallback; its embedded Phrases catalog/detail family is the audited deletion candidate, but shared lesson-domain phrase support remains live until separately proven otherwise.
- Backend: authoritative authenticated catalog order, direct Phrase Detail payload and lesson persistence.

## Documentation owners

- `frontend/docs/compatibility-cleanup.md`: exact reachability evidence, deletion candidate manifest, preserved shared contracts and next-slice validation requirements.
- `.agents/AGENTS.issue-70-compatibility-reachability.md`: reusable production-safe deletion rule.
- `.agents/current/**`: active slice identity and evidence only.

## Invariants

- Canonical `/phrases` and `/phrases/[slug]` always use `LexigoPhrasesApp` before fallback selection.
- Guest Phrases remains available without session and does not depend on `LexigoPremiumApp`.
- Authenticated catalog preserves server order and bounded pagination; direct detail remains independent.
- Shared lesson support for phrase items is not classified as dead merely because the Phrases route moved.
- The proof contract is semantic and tied to route predicates/owners, not full paragraph or formatting snapshots.
- This PR must not change runtime bundle output or visual baselines.

## Acceptance criteria

- Source test proves the Phrases route predicate is session-independent.
- Source test proves the Phrases render branch precedes the `LexigoPremiumApp` fallback.
- Source test proves guest catalog and authenticated/detail ownership exist in `LexigoPhrasesApp`.
- Documentation lists exact dead candidate symbols grouped by state, effect/API and presentation/navigation.
- Documentation lists exact live shared phrase contracts that must remain during deletion.
- Documentation defines the next product cleanup checks: absence source contract, type/lint/unit/build, cross-browser Phrases/auth regression, authoritative Linux visual hashes and bundle comparison.
- Full required CI passes on the final developer-authored head.
- Review comments, reviews and unresolved threads are empty or resolved.
- Expected-head squash merge and post-merge exact-SHA validation complete before another Issue #70 slice starts.

## Required checks

- Agent Harness validation through normal CI classification.
- Frontend lint, TypeScript, unit/source-contract tests and production build.
- Full backend/frontend/browser/container CI because this is frontend tooling/documentation outside pure Agent Docs scope.
- Changed-path audit against this allow-list.
- Review comment, review submission and unresolved-thread audit.
- Post-merge main CI and exact-SHA stage/public scope validation.

## Risks

- A naive marker inventory could classify live lesson-domain phrase behavior as dead.
- A source-order assertion could become brittle if it uses unrelated formatting instead of semantic branch markers.
- The proof could overstate that the entire compatibility app is removable, breaking guest authentication.
- A documentation-only claim without an executable reachability assertion would not be sufficient deletion evidence.

## Rollback

Revert the single tooling squash merge. Runtime and deployed behavior are unchanged by this slice.
