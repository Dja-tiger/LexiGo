# Current Task

## Identity

- Issue: #689
- Branch: `fix/issue-689-error-boundary-hydration-race`
- Base SHA: `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90`
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Objective

Remove the WebKit hydration race from the blocking `ApplicationErrorBoundary` Light/Dark computed-style proof without changing production runtime behavior or weakening the semantic appearance assertions delivered by #687/#688.

## Scope

- `frontend/e2e/application-error-boundary-appearance.spec.ts` test-harness lifecycle only.
- Keep the synthetic `.lx-fatal-error` fixture connected to the real runtime document and complete production stylesheet cascade.
- Insert fixture, capture final computed styles and clean up fixture atomically inside one browser evaluation task so React hydration cannot interleave.
- Preserve all existing Light/Dark canvas/text/weak/muted/background/border equality assertions.
- Agent current task/progress/execution evidence for this atomic hotfix.

## Non-goals

- No production CSS, token, component or error-recovery changes.
- No browser/project skip, assertion removal, blind retry or timeout-based correctness mechanism.
- No visual fingerprint refresh.
- No Stage/release bypass.
- No unrelated cleanup.

## Allowed paths

- `.agents/current/**`
- `frontend/e2e/application-error-boundary-appearance.spec.ts`

## Prohibited paths

- Production runtime code or CSS.
- Backend/API/schema/migrations.
- Workflows, dependencies or browser matrix configuration.
- OpenPencil/design source files.
- Existing visual baselines/fingerprints.

## Runtime owners

- The production runtime remains exactly merge SHA `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90` from #688 until this test-only hotfix merges.
- `ApplicationErrorBoundary`, `error-boundary.css`, `design-tokens.css` and `appearance.css` ownership are unchanged.
- This task changes only how the Playwright proof samples the already-delivered runtime cascade.

## Documentation owners

- `.agents/current/**` for branch-local execution context.
- Issue #689 / its PR for reviewable failure and recovery evidence.
- `.agents/PROJECT_STATE.md` must be reconciled only after the final runtime SHA passes exact-main CI and Stage/public validation.

## Invariants

- Exact-main CI #4171 / run `32873693448` on `e4bf0279f01e0ec4504e99581a3d7e1dc62b4a90` remains recorded as a failed first post-merge attempt; it must never be rewritten as fully green.
- Both explicit Light and Dark proofs remain blocking and continue to run on `ios-webkit`.
- The fixture must be connected when `getComputedStyle` is read, and absent after the atomic evidence capture returns.
- React-owned application DOM must not be replaced by the synthetic fixture.
- No arbitrary sleep or rerun is accepted as the correctness fix.

## Acceptance criteria

- The fixture is appended, sampled and removed in one `page.evaluate()` task.
- The real application body is not replaced or persisted with test markup.
- Every semantic equality assertion from #688 remains present.
- Full immutable-head PR CI succeeds, including both UI shards and `ios-webkit`.
- Clean review/thread and main-drift audit precedes expected-head squash merge.
- The new merge SHA receives exact-main CI and exact-SHA Stage/public validation.
- Final Agent Harness reconciliation records #688's failed first exact-main attempt and #689's successful recovery truthfully.

## Required checks

- Frontend lint, typecheck, unit, production build and dependency audit.
- Full blocking UI Playwright matrix including `application-error-boundary-appearance.spec.ts` on `ios-webkit`.
- Existing visual/accessibility/security/performance/PWA/Service Worker gates.
- Full immutable-head PR CI plus review/thread/main-drift audit.
- Exact-main push CI and exact-SHA Stage/public validation after merge.

## Risks

- Reading styles in a detached fixture would invalidate cascade evidence; the fixture must remain connected during the atomic style read.
- Replacing the whole body would recreate the hydration race; only ephemeral append/remove is allowed.
- A targeted rerun alone could hide the race because #4170 passed the same source once; deterministic harness repair is required.

## Rollback

Revert the atomic #689 test-harness squash merge. Production CSS and application behavior are intentionally unchanged by this hotfix.
