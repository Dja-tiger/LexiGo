# Current Task

## Identity

- Issue: #641
- Branch: test/issue-641-final-system-state-matrix
- Base SHA: 9d09372297574d42a2c4b6c3a191f28e8608db20
- Head SHA: resolve from live branch ref
- PR:

## Objective

Complete the final automated system-state applicability reconciliation for parent #205 by making the executable cross-owner OpenPencil contract reflect the already-delivered shared-state provenance (#643) and First Use loading/error provenance (#642 / #645), without changing runtime, approved visual fingerprints or the active OpenPencil source.

## Scope

- Update `frontend/components/system-state-openpencil-contract.test.ts` only for product/test evidence.
- Preserve the five shared/system-state OpenPencil provenance bindings and exact approved fingerprints.
- Replace the stale assertion that First Use loading/error is an unapproved visual gap with a fail-closed delegation contract to the existing authoritative `first-use-visual.spec.ts` owner.
- Bind all eight delivered First Use loading/error baselines to their exact baseline name, screen-map key, OpenPencil node, `/onboarding` route, canonical viewport and approved SHA-256.
- Prove shared/system-state visual ownership does not duplicate the First Use keys.
- Preserve existing First Use behavior/runtime ownership checks for loading, recoverable error and retry semantics.

## Non-goals

- No runtime React/CSS changes.
- No backend/API/session/schema changes.
- No change to `frontend/e2e/system-states-visual.spec.ts` or its approved fingerprints.
- No change to `frontend/e2e/first-use-visual.spec.ts` or its approved fingerprints.
- No OpenPencil document, token or screen-map mutation.
- No Figma Cloud dependency.
- No workflow/dependency/deploy change.
- No baseline refresh, tolerance widening or screenshot approval.

## Allowed paths

- frontend/components/system-state-openpencil-contract.test.ts
- .agents/current/TASK.md
- .agents/current/PROGRESS.md
- .agents/current/EXECUTION.md

## Prohibited paths

- frontend/components runtime files other than the single source-contract test above
- frontend/e2e/system-states-visual.spec.ts
- frontend/e2e/first-use-visual.spec.ts
- frontend/app/**
- backend/**
- api/**
- design/**
- docs/figma/openpencil-screen-map.json
- .github/workflows/**
- dependencies / lockfiles

## Runtime owners

- `frontend/e2e/system-states-visual.spec.ts` owns the five approved shared/system-state exact Linux visual baselines.
- `frontend/e2e/first-use-visual.spec.ts` owns the eight approved First Use loading/error exact Linux baselines delivered by #642 / PR #645.
- `frontend/components/lexigo-onboarding-app.tsx` owns reachable First Use loading/recoverable-error runtime states.
- `frontend/e2e/first-use.spec.ts` owns First Use behavior/retry semantics.

## Documentation owners

- `.agents/current/**` records this atomic execution and is reconciled/reset separately after delivery.

## Invariants

- Active provenance is repository-owned OpenPencil; legacy Figma identifiers are archival only.
- Existing approved SHA-256 fingerprints remain byte-for-byte unchanged.
- Shared state visual owner must not duplicate First Use loading/error cases.
- First Use loading/error must no longer be represented as an unresolved gap now that #642 is completed.
- No runtime/source-design mutation is allowed in this evidence-only slice.

## Acceptance criteria

- The executable contract preserves all five shared-state OpenPencil bindings and approved hashes.
- All eight First Use loading/error baselines are explicitly proven in the authoritative First Use visual owner with exact key/node/route/viewport/hash values.
- Shared visual source remains free of First Use loading/error keys.
- First Use owner is explicitly treated as delivered delegation rather than an open visual gap.
- Loading/recoverable-error runtime and retry owners remain independently asserted without duplicating their state machines.
- Frontend unit/source contract passes, then full immutable-head CI passes.
- Final compare is `behind_by=0`; reviews/threads are clean before expected-head squash merge.
- No Stage redeploy is claimed for a test/evidence-only merge.

## Required checks

- Read-back blob verification after every write.
- Frontend unit/source contract through normal frontend core CI.
- Existing full browser/visual/accessibility matrix via immutable-head CI; no baseline changes.
- Final diff/allowed-path audit.
- Review/thread audit and expected-head squash merge.
- Post-merge exact-main CI; separate Agent Docs reconciliation/reset.

## Risks

- A loose source assertion could falsely declare #641 complete while First Use provenance drifts; enumerate every delivered state and exact immutable fingerprint.
- Duplicating First Use cases into the shared visual suite would create competing owners; assert non-duplication instead.
- Changing visual owners or hashes would broaden this audit into a new visual approval task and is prohibited.

## Rollback

Revert this test/evidence-only PR. Runtime behavior, OpenPencil sources and persisted data remain unchanged.
