# Current Task

## Identity

- Issue: #563
- Branch: feat/issue-563-first-use-parity
- Base SHA: 263fe7457d741d184885810a779ee7d3b79593ab
- Head SHA: resolve from live branch ref
- PR: #564

## Objective

Close the remaining First Use `/` guest + `/onboarding` route-specific parity evidence gap under #205 using the active OpenPencil source, exact node provenance, canonical design viewports and review-first Linux visual evidence.

## Scope

- Keep the already-delivered runtime repair from #565 / PR #566 in the base branch.
- Bind all eight First Use visual baselines to exact active OpenPencil screen-map keys, node IDs, routes and canonical viewports.
- Keep compact evidence at 390×844 and canonical desktop parity at 1440×900.
- Preserve the corrected desktop Resume fixture that locally selects `Не уверен` before capture.
- Preserve content-addressed, fail-closed screenshot approval semantics.
- Manually inspect exact Linux PNGs before approving any canonical 1440×900 hash changes.

## Non-goals

- No runtime UI changes in this PR.
- No backend/API/schema changes.
- No design/token/screen-map changes unless a separate proven source defect is discovered.
- No live/native Figma synchronization; native Figma remains archival/reference.
- No deployment-topology or workflow changes.
- Do not close umbrella #205 unless its broader consolidated acceptance is independently satisfied.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/first-use-visual.spec.ts`

## Prohibited paths

- `frontend/components/**`
- `frontend/app/first-use.css`
- `backend/**`
- `api/**`
- `design/**`
- `docs/figma/**`
- `deploy/**`
- `.github/workflows/**`
- unrelated routes/tests

## Runtime owners

- Guest runtime: `LexigoGuestHomeApp` (read-only in this slice).
- Authenticated onboarding runtime: `LexigoOnboardingApp` (read-only in this slice).
- Visual evidence owner: `frontend/e2e/first-use-visual.spec.ts`.

## Documentation owners

- Active production design source: `design/openpencil/LexiGo Design System.op`.
- Stable route/state mapping: `docs/figma/openpencil-screen-map.json`.
- Runtime repair evidence: Issue #565 / PR #566 / merge `263fe7457d741d184885810a779ee7d3b79593ab`.

## Invariants

- The #566 runtime fix is inherited from `main` and must not be reverted by this evidence PR.
- Reviewed legacy Resume hashes from #566 are the starting runtime evidence, not canonical 1440×900 approvals.
- No screenshot hash changes without exact Linux artifact review.
- Each baseline must fail closed if active OpenPencil node, route or canonical geometry drifts.
- Desktop canonical parity uses 1440×900; 1440×1024 remains a separate responsive/runtime audit viewport.
- Resume canonical evidence selects local `Не уверен` without fabricating server state or design-only sentence data.
- `main` remains unchanged by feature-branch writes.

## Acceptance criteria

- Every First Use baseline resolves to an exact active OpenPencil screen-map entry and canonical viewport.
- Compact Light/Dark evidence remains stable at 390×844.
- Desktop Guest and Resume evidence is captured at exact 1440×900.
- Resume fixture reflects the approved locally selected `Не уверен` state before save.
- Changed canonical desktop hashes, if any, are backed by manually reviewed exact Linux PNGs.
- No runtime/API/design/deployment files appear in the PR diff.
- Immutable-head CI is green after final reviewed hashes.
- Review/thread audit is clean and merge uses expected-head protection.
- Exact-main CI passes after merge; Stage redeploy is not required for this test/evidence-only PR.

## Required checks

- Branch/base/diff verification after reconstruction on `263fe745…`.
- Frontend lint, typecheck, unit/build as selected by repository CI.
- Visual regression with exact Linux artifacts.
- Repository-selected browser/accessibility/security/performance gates.
- Manual Linux review before canonical hash approval.
- Final immutable-head full CI.
- Post-merge exact-main CI.

## Risks

- Reintroducing pre-#566 Resume hashes could hide or revert the runtime repair evidence.
- Treating 1440×1024 and 1440×900 as equivalent would make a false design-parity claim.
- Blindly approving regenerated hashes would defeat the content-addressed review gate.
- Expanding this evidence slice into runtime redesign would violate #563 scope.

## Rollback

Revert the #563 parity/provenance PR. The deployed #566 runtime repair remains independently intact on `main`.
