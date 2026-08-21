# Current Task

## Identity

- Issue: #641
- Branch: test/issue-641-system-state-openpencil
- Base SHA: 37fe3016673ab261e4df4232274535f834578b77
- Head SHA: resolve from live branch ref
- PR: #643

## Objective

Reconcile the five already-approved shared loading/empty/error/offline visual baselines to the active repository-owned OpenPencil screen map without changing runtime behavior or approved Linux fingerprints, while keeping Issue #641 open for the separately proven First Use loading/error evidence gap in #642.

## Scope

- migrate `frontend/e2e/system-states-visual.spec.ts` from active-Figma provenance semantics to active OpenPencil provenance semantics;
- resolve every existing approved shared system-state baseline against `docs/figma/openpencil-screen-map.json` by stable key, OpenPencil node, route and canonical viewport;
- retain legacy Figma IDs only as explicitly archival provenance if useful for traceability;
- add a fail-closed source contract for the OpenPencil mapping and applicability boundary;
- prove that First Use loading/error states are reachable and mapped but are not part of the current approved shared or First Use baseline set, and track that gap explicitly as #642 rather than duplicating or falsely delegating it here;
- preserve all existing approved hashes, renderer-equivalent hashes, runtime fixtures and behavioral owners.

## Non-goals

- no runtime React/CSS changes;
- no backend/API/session/schema changes;
- no OpenPencil source or token mutation;
- no Figma Cloud/MCP work;
- no screenshot/hash/baseline refresh;
- no fuzzy pixel tolerance or assertion weakening;
- no reimplementation of #202 system-state behavior;
- no First Use loading/error baseline implementation inside this PR; that is #642;
- no workflow, dependency or package-manifest changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/system-states-visual.spec.ts`
- `frontend/components/system-state-openpencil-contract.test.ts`

## Prohibited paths

- `frontend/app/**`
- other `frontend/components/**` runtime files
- other `frontend/e2e/**` suites
- `frontend/e2e/**/*-snapshots/**`
- `design/**`
- `docs/figma/**`
- `backend/**`
- `api/**`
- `.github/workflows/**`
- dependency manifests and lockfiles
- deployment/runtime configuration

## Runtime owners

Read-only owners that must remain behaviorally unchanged:
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- `frontend/components/system-states-contract.test.ts`
- `frontend/e2e/first-use-visual.spec.ts`
- `frontend/e2e/first-use.spec.ts`
- `frontend/components/lexigo-onboarding-app.tsx`
- existing shared async/connectivity and Active Lesson state runtime.

## Documentation owners

- active design mapping: `docs/figma/openpencil-screen-map.json` (read-only);
- production handoff: `docs/figma/openpencil-production-handoff.json` (read-only);
- umbrella audit: Issue #205;
- active audit: Issue #641;
- child First Use evidence gap: Issue #642;
- implementation provenance: Issue #202;
- design-source handoff: Issue #203.

## Invariants

- OpenPencil is the active source of truth; Figma IDs are archival provenance only.
- Existing five approved shared system-state PNG fingerprints remain byte-for-byte unchanged.
- Existing renderer-equivalent exact allow-lists remain unchanged.
- First Use loading/error is not falsely marked covered: #642 remains explicit blocking evidence before #641/final #205 system-state reconciliation can close.
- No runtime behavior, API request sequence, route ownership or CSS cascade changes in PR #643.
- Any newly discovered product/design defect is split into a separate Issue/PR rather than hidden by an audit assertion or new hash.
- Final developer-authored head is immutable before full CI/review audit.

## Acceptance criteria

- All five existing shared system-state visual baselines resolve to exact active OpenPencil records by screen-map key, node, route and canonical viewport.
- The shared visual suite no longer presents Figma as the active source; any legacy IDs are explicitly archival only.
- Home Loading, Dictionary Empty, shared Error, desktop Offline and Active Lesson Recall Offline retain the current approved exact Linux fingerprints.
- First Use loading/error applicability is explicitly proven as a separate open visual-evidence gap and linked to #642; PR #643 does not close #641.
- Source contract fails closed on missing/drifted OpenPencil keys/nodes/routes/viewports, a regression back to active-Figma wording, or accidental duplication of First Use loading/error into the shared owner.
- Existing system-state behavior/touch/reduced-motion/source owners remain green.
- Full immutable-head CI passes; reviews/threads and main drift are clean before expected-head squash merge.
- Post-merge exact-main CI passes; no Stage redeploy is claimed for this test/evidence-only slice.
- Agent Harness reconciliation/reset happens in a separate docs-only PR after delivery.

## Required checks

- targeted source/unit contract for `system-state-openpencil-contract.test.ts`;
- authoritative `system-states-visual.spec.ts` in its existing Linux visual collection without snapshot update mode;
- existing system-state behavior/touch/reduced-motion owners through repository-selected CI;
- full immutable-head CI;
- PR reviews/threads/main-drift audit;
- post-merge exact-main CI fast path; Stage must remain on the latest runtime-bearing SHA.

## Risks

- stale GitHub code-search results can misidentify the current owner; use direct file reads for proof;
- OpenPencil screen-map arrays contain both `screens` and `activeScreens`; the contract must resolve the exact intended owner rather than broad matching;
- raw PNG hashes have scoped renderer-equivalent allow-lists that must not be reordered or widened accidentally;
- a test-only edit can unintentionally fall out of the authoritative visual collection if project/skip semantics are changed;
- First Use design nodes are not equivalent to approved runtime baselines; #642 exists specifically because this distinction was verified;
- tool-selection error occurred during task setup: two attempted `create_pull_request(main→main)` calls were rejected with HTTP 422 before any repository mutation; this is recorded in EXECUTION and must not be repeated.

## Rollback

Revert the isolated PR #643 audit/source-contract commits. No runtime, design source, data, API or visual baseline rollback is required.
