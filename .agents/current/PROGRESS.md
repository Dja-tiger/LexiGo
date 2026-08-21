# Current Task Progress

## 2026-08-21 13:33 +03

### Verified

- Live `main` is `37fe3016673ab261e4df4232274535f834578b77`.
- No open PR existed in `Dja-tiger/LexiGo` at task start.
- Issue #641 is open under parent #205 and defines a test/evidence-only OpenPencil system-state audit.
- Branch `test/issue-641-system-state-openpencil` was created from exact `main@37fe3016…`.
- Draft PR #643 is open from this branch to `main`; its initial head was `358bd348fefd4cc029d8fc2016a7fef9ae0ebc16` and base `37fe3016…`.
- Existing shared system-state owners are `frontend/e2e/system-states.spec.ts`, `frontend/e2e/system-states-visual.spec.ts`, `frontend/e2e/system-state-touch-targets.spec.ts` and `frontend/components/system-states-contract.test.ts`.
- Active OpenPencil mapping contains Home Loading `fig_4258`, Dictionary Empty `fig_4234`, shared Error `fig_4222`, Desktop Offline `fig_4104` and Active Lesson Recall Offline `fig_3193`.
- `frontend/components/lexigo-onboarding-app.tsx` also has independently reachable First Use loading and recoverable-error presentation branches.
- `docs/figma/openpencil-screen-map.json` contains eight First Use loading/error nodes across mobile/desktop and Light/Dark, while `frontend/e2e/first-use-visual.spec.ts` currently approves only guest/role/resume states and does not approve those eight states.
- Child Issue #642 was created to close that independent First Use visual-evidence gap; #641 has an explicit audit comment stating PR #643 uses `Refs #641`, not `Closes #641`.

### Finding

The existing five shared system-state Linux baselines were still bound only to legacy Figma node identifiers and Figma-active wording after #203 promoted repository-owned OpenPencil. Their hashes are already approved and need provenance migration only. A separate First Use system-state visual gap was discovered and split into #642 instead of being hidden by delegation.

### Root cause

The design-source migration updated repository handoff/mapping, but the older shared visual owner was not migrated to fail-closed `screenMapKey + openPencilNode + route + viewport` resolution. First Use production/runtime later gained explicit loading/error states and OpenPencil nodes, but its approved visual baseline set remained limited to eight guest/role/resume states.

### Changed files

- `.agents/current/TASK.md` — Issue #641 / PR #643 scope, allow-list, #642 blocker, invariants and delivery gates.
- `.agents/current/PROGRESS.md` — this factual task record.
- `.agents/current/EXECUTION.md` — tool-selection recovery and execution provenance.
- `frontend/components/system-state-openpencil-contract.test.ts` — fail-closed OpenPencil/source applicability contract.
- `frontend/e2e/system-states-visual.spec.ts` — active OpenPencil provenance metadata/annotation for the existing five approved baselines; runtime flows and fingerprints unchanged.

### Checks passed

- Every successful branch write was read back and protected `main` rechecked unchanged at `37fe3016…`.
- New source contract read back as blob `4dc74389b94f89427a909cf6a1b620d1a881db0b`.
- Updated visual owner read back as blob `e3d4504763d23eda3eabfa24961ce6138071c541`.
- Existing five primary SHA-256 values remain unchanged.
- Existing exact renderer-equivalent allow-lists remain unchanged.
- Visual runtime request/interactions remain unchanged; only provenance types/metadata/annotation/error wording changed.
- Pre-PR branch compare against exact base was ahead 7, behind 0; exactly five changed files, all in TASK allow-list.
- Separate visual gap filed as #642 with exact OpenPencil nodes `n117/n128/n277/n288/n442/n456/n614/n628`.
- Issue #641 now explicitly records #642 as a blocking evidence gap so PR #643 cannot auto-close the audit prematurely.

### Checks failed

- During task setup, two calls were incorrectly routed to `create_pull_request(main→main)` while intending to create Issue #641. GitHub rejected both before mutation with HTTP 422 `No commits between main and main`.
- Recovery completed: writes stopped, `main` was re-read and remained `37fe3016…`; the exact `create_issue` schema was loaded before Issue #641 was created. The failure is also recorded in EXECUTION.
- No local/container test run is claimed: repository checkout still cannot rely on GitHub DNS in the container. Authoritative validation will run in repository CI on the final PR head.

### Current branch head

- PR #643 initial head: `358bd348fefd4cc029d8fc2016a7fef9ae0ebc16`.
- TASK sync commit after PR creation: `24ef587b0134e037be7c0f0179ed4f6a15f6882e`.
- Resolve final head again after this PROGRESS and final EXECUTION sync; then freeze it for immutable-head CI.

### Next action

Read this update back and verify `main`, synchronize EXECUTION with PR #643, then freeze the resulting developer-authored head and inspect the full GitHub Actions run. Any failure must be classified from exact job/log evidence before deciding whether a source fix is justified.
