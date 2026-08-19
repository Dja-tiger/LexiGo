# Current Task

## Identity

- Issue: #614 — consolidated reduced-motion matrix for 10 canonical routes
- Branch: `test/issue-614-reduced-motion-parity`
- Base SHA: `beee70ecdbc5d066677ee36a78d2d615902c01a2`
- Implementation validation head: `1fd8781a9a91aa0d3bd0e6ffcd3eca3f8b3c8b91`
- Final head: resolve from this final evidence-sync commit
- PR: #615 — `test(a11y): audit reduced motion across canonical routes`

## Objective

Close the next automatable #205 acceptance dimension with one deterministic executable `prefers-reduced-motion: reduce` audit across all ten canonical routes, compact/desktop and explicit Light/Dark, without changing runtime presentation.

## Scope

- `frontend/e2e/route-reduced-motion-parity.spec.ts` — 40-state consolidated route audit.
- `frontend/components/reduced-motion-collection-contract.test.ts` — fail-closed route/matrix/semantics/collection contract.
- `frontend/package.json` — explicit blocking `test:e2e:a11y` collection entry.
- `.agents/current/**` — task/evidence records only.

## Non-goals

- No OpenPencil source mutation.
- No Figma work; Figma is archival provenance only.
- No runtime CSS/React/API/backend/state/history/storage change in this audit PR.
- No browser/project exclusion to hide a product defect.
- No arbitrary timeout/sleep or tolerance widening.
- No replacement for physical-device Issue #461.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/route-reduced-motion-parity.spec.ts`
- `frontend/components/reduced-motion-collection-contract.test.ts`
- `frontend/package.json`

## Prohibited paths

- Runtime React/CSS owners, including `frontend/app/accessibility-navigation.css`.
- Backend/API/schema/deploy files.
- OpenPencil source/tokens/mapping.
- Existing visual baselines.
- GitHub workflows.

## Runtime owners

Read-only owners for acceptance:

- `frontend/app/accessibility-navigation.css` — existing Issue #65 reduced-motion implementation.
- Route islands and persistent `RouteChrome` enumerated by current architecture.
- Existing specialized `frontend/e2e/route-focus-management.spec.ts` reduced-motion journey.

## Documentation owners

- Issue #614 and parent #205.
- `.agents/current/**` for task-local execution evidence.

## Invariants

- Active design source is repository-owned OpenPencil: `design/openpencil/LexiGo Design System.op` plus `docs/figma/openpencil-screen-map.json`.
- Reduced motion is an accessibility/runtime dimension, not a new design node.
- Production motion CSS must remain observable by the audit; `installDeterministicRuntime` is prohibited because it would neutralize the behavior under test.
- Computed durations are normalized to milliseconds and must be `<= 0.01ms`; running/pending Web Animations must be zero.
- Existing #65 navigation/progress/calendar contracts remain authoritative and must not be weakened.
- If the audit exposes a product defect, split a separate runtime Issue/PR and reconstruct this audit on corrected `main`.

## Acceptance criteria

- [x] All 10 canonical routes run at 390×844 and 1440×1024 in explicit Light/Dark.
- [x] `matchMedia('(prefers-reduced-motion: reduce)').matches` is true.
- [x] Canonical route owner and expected RouteChrome topology are present.
- [x] Visible route/shell ownership has no unintended positive-duration CSS/Web Animations motion.
- [x] Reduced-motion scrolling is `auto`.
- [x] Representative keyboard-originated focus remains visibly painted without active motion.
- [x] Runtime error capture stays empty in the blocking matrix.
- [x] Blocking accessibility collection explicitly includes the new owner.
- [x] Corrected implementation head passed full CI #3865 / run `32249196644`.
- [ ] Final evidence-sync head passes one fresh full immutable-head CI.
- [ ] Final review/thread/main-drift audit is clean.
- [ ] Expected-head squash merge completes and Issue #614 closes.
- [ ] Agent Docs reconciliation/reset is merged separately.

## Validation evidence

- Diagnostic CI #3863 / `32248947266`: source typecheck exposed incorrect literal `"pending"` use for DOM Animation; no product defect.
- Corrected implementation head `1fd8781a9a91aa0d3bd0e6ffcd3eca3f8b3c8b91`.
- CI #3865 / `32249196644`: full success.
- Accessibility job `96056740598`: success with consolidated Issue #614 matrix.
- Both UI shards, Visual, Lesson, PWA, service-worker, security, dictionary, performance, backend and API/Web container builds: success.

## Required final checks

- Fresh full CI on the final evidence-sync head.
- Live `main` + `compare_commits`: no drift and only allowed paths.
- No unresolved review threads/review blocker.
- PR mergeable and marked Ready only after the exact-head green run.
- Squash merge using expected head SHA.
- No Stage redeploy claim: this PR is test/evidence only and changes no runtime tree.

## Rollback

Delete the new audit/source-contract owner and remove its package-script entry. Runtime remains untouched.
