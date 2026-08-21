# Current Task Execution

## Task

- Branch: test/issue-641-system-state-openpencil
- Base SHA: 37fe3016673ab261e4df4232274535f834578b77
- Head SHA: resolve from live branch ref after this final harness sync
- PR: #643

## Skills used

### GitHub production delivery

Purpose:
Inspect live repository state, create the atomic Issue/branch, apply explicit branch-scoped writes, read every changed path back, verify `main` after each write, and manage PR/CI/review/merge gates.

Instruction source:
`skills://plugins/github/github/skill.md` plus repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, specialized mandatory Agent docs and `docs/agent-harness.md` already read for the active repository workflow.

Version or verification date:
2026-08-21 live connector/repository state.

Inputs:
- repository `Dja-tiger/LexiGo`;
- live `main@37fe3016673ab261e4df4232274535f834578b77`;
- parent #205, active audit #641, implementation owner #202, design-source owner #203;
- child visual-evidence gap #642;
- Draft PR #643;
- existing shared system-state visual/behavior/source owners;
- First Use visual/behavior/runtime owners;
- active OpenPencil screen map and production handoff.

Files inspected:
- `AGENTS.md`;
- `.agents/AGENTS.md`;
- `.agents/AGENTS.base.md` and mandatory specialized Agent docs from the current repository governance chain;
- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/e2e/system-states-visual.spec.ts`;
- `frontend/e2e/system-states.spec.ts`;
- `frontend/components/system-states-contract.test.ts`;
- `frontend/e2e/first-use-visual.spec.ts`;
- `frontend/e2e/first-use.spec.ts`;
- `frontend/components/lexigo-onboarding-app.tsx`;
- `docs/figma/openpencil-screen-map.json`;
- `docs/figma/openpencil-production-handoff.json`.

Actions performed:
- verified protected `main`, no open PR at task start and clean reset `.agents/current/**`;
- created Issue #641 and branch `test/issue-641-system-state-openpencil` from exact main;
- declared TASK/PROGRESS/EXECUTION with explicit path allow-list;
- migrated the existing five `system-states-visual.spec.ts` baselines from active-Figma metadata to exact `screenMapKey + openPencilNode + route + viewport` metadata while preserving every primary and renderer-equivalent SHA and every runtime interaction;
- audited First Use applicability, proved the separate eight-state loading/error visual gap and created child Issue #642;
- opened Draft PR #643 with `Refs #641`, not `Closes #641`;
- classified two consecutive deterministic Frontend core failures from exact logs instead of retrying or weakening assertions;
- corrected the validation architecture so the isolated Vitest source contract does not depend on repo-level `docs/`, while the authoritative Playwright visual owner performs the real screen-map resolution in the environment that already owns OpenPencil/Linux visual evidence;
- synchronized harness state before freezing the next replacement immutable head.

CI #3949 / run `32473173511`:
- head `cbf2799aaed3b47b777a08e76673e93224f25d37`;
- lint/typecheck green; 134 other Vitest files / 821 tests green;
- new source contract failed before test execution with `ENOENT '/docs/figma/openpencil-screen-map.json'`;
- classified deterministic filesystem-path defect; no same-head retry.

CI #3952 / run `32473507422`:
- head `6edf18caf3ad2fed086bbe09dbb267721a2a6341`;
- lint/typecheck green again; 134 other Vitest files / 821 tests green;
- exact log proved `frontend-container.sh` executes Vitest from isolated `/workspace` and repo-level `docs/` is not present there;
- failure remained deterministic: `ENOENT '/workspace/docs/figma/openpencil-screen-map.json'`;
- conclusion: another relative-path tweak would be structurally invalid, because the file is intentionally outside the unit-test workspace.

Architectural correction after CI #3952:
- commit `8415c4105f10e8ad92dbd14e4cc71d22ecc2ff70` makes `frontend/components/system-state-openpencil-contract.test.ts` a pure source contract and removes direct repo-level docs I/O;
- read-back blob `f8daa01dd9952f737e87ac9351cf4acc296e9fc4`;
- source contract still fail-closes on all five exact OpenPencil keys/nodes/routes/viewports/hashes, active-source wording, and the presence/call of a real map validator inside the visual owner;
- commit `db88a546103d09a1fe401c3819d7c43030d15b5c` adds the actual OpenPencil screen-map loader/validator to `frontend/e2e/system-states-visual.spec.ts`;
- read-back blob `58d636c6077063e41b54c2b917a91888064a3395`;
- loader uses the same repository-resolution candidates already proven in `first-use-visual.spec.ts`: `GITHUB_WORKSPACE`, `/repository`, parent cwd and cwd;
- it parses `screens` + `activeScreens` and fails closed if the mapping is unavailable/empty;
- before every approved system-state capture it verifies exact screen-map key, OpenPencil node, archival Figma node, route, width and height;
- no SHA, renderer-equivalent allow-list, screenshot, runtime fixture or interaction step changed;
- protected `main` remained `37fe3016…` after each write.

Commands or procedures:
GitHub connector reads/searches, explicit `create_issue`, `create_branch`, `fetch_file`, `create_file`, `update_file`, `compare_commits`, issue comment creation, Draft PR creation, PR review/thread reads, commit workflow-run/job/log inspection, and protected-main verification. No direct default-branch write, force ref update, snapshot update or workflow mutation.

Artifacts produced:
- Issue #641;
- child Issue #642;
- Draft PR #643;
- branch `test/issue-641-system-state-openpencil`;
- initial provenance/source-contract commits and harness evidence;
- CI #3949 and #3952 deterministic failure evidence;
- source-contract architecture correction `8415c4105f10e8ad92dbd14e4cc71d22ecc2ff70`;
- visual-owner map validation correction `db88a546103d09a1fe401c3819d7c43030d15b5c`;
- refreshed PROGRESS commit `6a42f802d188cb071043e5d3ae0ff52dabe02a02`.

Result:
The five shared system-state baselines retain their exact reviewed visual fingerprints and browser flows while the authoritative visual suite now fail-closes against active OpenPencil repository mapping. Unit tests no longer assume repo-level artifacts are copied into the frontend core workspace. A fresh full CI on the next frozen developer-authored head is required before Ready/merge.

Process failure during setup:
Two tool calls intended to create Issue #641 were mistakenly sent to `create_pull_request` with `main` as both head and base. GitHub rejected both with HTTP 422 `No commits between main and main`; no PR or repository mutation was created.

Root cause:
Tool-selection error: a similarly scoped GitHub write action was invoked without first loading and matching the exact `create_issue` schema.

Fallback:
Writes stopped after rejection, protected main was re-read, the exact issue schema was loaded, then `create_issue` was used successfully. The rejected PR call was not repeated after schema correction.

Limitations:
The local container does not provide a reliable GitHub checkout path because DNS/network access to GitHub has failed; repository truth and validation use the connected GitHub API and GitHub Actions. No local test pass is claimed.

Reusable lessons:
- Before every repository write, match intent to the exact discovered function/schema; after a rejected mutation revalidate repository state before further writes.
- A design-state node in OpenPencil is not proof that an approved runtime visual exists; verify the actual baseline set and split missing evidence into a child Issue.
- A parent audit PR must use `Refs`, not `Closes`, when a blocking child remains open.
- Do not make unit tests depend on repo-level artifacts that are intentionally excluded from an isolated frontend workspace. Keep source-level ownership assertions in Vitest and execute repository/design-artifact validation in the authoritative visual environment that already has a proven repo-root resolution contract.
