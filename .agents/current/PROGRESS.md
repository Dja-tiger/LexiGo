# Current Task Progress

## 2026-08-21 13:36 +03

### Verified

- Live `main` is `37fe3016673ab261e4df4232274535f834578b77`.
- Issue #641 is open under parent #205; child #642 tracks the separately proven First Use loading/error visual-evidence gap.
- Branch `test/issue-641-system-state-openpencil` was created from exact `main@37fe3016…`.
- Draft PR #643 is open to `main` with `Refs #641`, not `Closes #641`.
- Active OpenPencil mapping contains Home Loading `fig_4258`, Dictionary Empty `fig_4234`, shared Error `fig_4222`, Desktop Offline `fig_4104` and Active Lesson Recall Offline `fig_3193`.
- `frontend/components/lexigo-onboarding-app.tsx` has independently reachable First Use loading and recoverable-error presentation branches.
- `docs/figma/openpencil-screen-map.json` contains eight First Use loading/error nodes across mobile/desktop and Light/Dark, while `frontend/e2e/first-use-visual.spec.ts` does not yet approve those eight states; #642 owns that missing evidence.

### Finding

The five existing shared system-state Linux baselines required provenance migration only: their approved exact hashes and runtime flows remain unchanged. First Use loading/error is a real additional evidence gap and is not falsely delegated by this PR.

### Root cause

The design-source migration updated repository handoff/mapping, but the older shared visual owner remained bound to legacy Figma-only metadata. First Use later gained explicit loading/error runtime states and OpenPencil nodes without corresponding approved exact Linux visual baselines.

### Changed files

- `.agents/current/TASK.md` — Issue #641 / PR #643 scope, allow-list, #642 blocker and delivery gates.
- `.agents/current/PROGRESS.md` — this factual task record.
- `.agents/current/EXECUTION.md` — execution/CI/tool-selection evidence.
- `frontend/components/system-state-openpencil-contract.test.ts` — fail-closed OpenPencil/source applicability contract.
- `frontend/e2e/system-states-visual.spec.ts` — active OpenPencil provenance metadata/annotation for the existing five approved baselines; runtime flows and fingerprints unchanged.

### Checks passed

- Every successful branch write was read back and protected `main` rechecked unchanged at `37fe3016…`.
- Updated visual owner read back as blob `e3d4504763d23eda3eabfa24961ce6138071c541`.
- Existing five primary SHA-256 values remain unchanged.
- Existing exact renderer-equivalent allow-lists remain unchanged.
- Visual runtime request/interactions remain unchanged; only provenance types/metadata/annotation/error wording changed.
- Branch diff before PR contained exactly five TASK-allowed paths and was 0 behind main.
- Issue #641 explicitly records #642 as a blocking evidence gap.
- PR #643 review submissions and inline threads were empty on the initial immutable head.
- CI #3949 / run `32473173511` passed classifier, lint and typecheck before the new source contract executed.

### CI failure classified and fixed

- CI #3949 Frontend core job `96744163203` failed only in `components/system-state-openpencil-contract.test.ts`; all 134 other test files passed and 821 tests were green.
- Exact error: `ENOENT: no such file or directory, open '/docs/figma/openpencil-screen-map.json'`.
- Root cause: the contract lives at `frontend/components/**`; `../../docs/...` climbed from `/workspace/components` to `/docs`, one level too far.
- Source fix commit `32fefe07f3a31548bb301ab8aaa41cfabccc3d7a` changes only that path to `../docs/figma/openpencil-screen-map.json`.
- Fixed line was read back as blob `65716a34be0873b8639f95b455e3908ef89a2426`; protected `main` remained unchanged.
- No assertion, fingerprint, runtime flow or tolerance was weakened.

### Other process failure

- During task setup, two calls were incorrectly routed to `create_pull_request(main→main)` while intending to create Issue #641. GitHub rejected both before mutation with HTTP 422. Recovery and tool-selection lesson are recorded in EXECUTION.
- No local/container test pass is claimed because repository checkout cannot reliably use GitHub DNS in this container; GitHub Actions is authoritative.

### Current branch head

- Provenance implementation: `9a8fee2a1763a27d7bb3187a7631aa3ba55752e2`.
- First frozen PR head: `cbf2799aaed3b47b777a08e76673e93224f25d37`.
- Verified CI path correction: `32fefe07f3a31548bb301ab8aaa41cfabccc3d7a`.
- Resolve final head after this PROGRESS and final EXECUTION sync; then freeze it for the replacement full CI run.

### Next action

Synchronize EXECUTION with the exact #3949 failure/fix, read it back and recheck `main`, then treat the resulting head as immutable and require a fresh full PR CI. If green, audit reviews/threads/main drift, mark PR #643 Ready and squash merge with expected-head protection. Post-merge exact-main CI is required; Stage redeploy is not applicable to this test/evidence-only PR.
