# Current Task Progress

## 2026-07-27 03:39 Europe/Berlin

### Verified

- `main` remains `387cc50c199218d71b49b39beb9d92859b6e299c`.
- Branch `chore/issue-243-agent-docs-ci` is based on that exact SHA and 0 commits behind.
- Issue #243 is the only active atomic slice; Draft PR #244 is open.
- Existing `CI` remains registered for every pull request and `main` push.
- Existing product commands, browser matrix and container publication contracts are preserved for non-Agent-Docs changes.

### Finding

- A workflow-level `paths-ignore` fast path is unsafe when branch protection requires checks from the skipped workflow: GitHub can leave expected checks pending because the workflow never registers.
- Automatic stage deployment currently reacts to every successful push-triggered `CI` run, so job-level heavy-test skips alone would still deploy documentation-only commits.
- The first PR head exposed an existing repository storage-policy requirement: every `actions/upload-artifact@v7` step must be non-blocking and have bounded retention.

### Root cause

- CI previously had no exact changed-path classification and no deployable-scope evidence shared with `Deploy Stage`.
- Product checks, image publication and stage eligibility were coupled to the existence of a successful `CI` run rather than to the semantic change scope.
- The new exact-scope artifact initially omitted `continue-on-error: true`, so `scripts/ci/actions_storage_policy_test.py` rejected the workflow before normal PR validation.

### Changed files

- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-stage.yml`
- `scripts/ci/agent_docs_scope.py`
- `scripts/ci/agent_docs_scope_test.py`

### Checks passed

- Exact implementation blob hashes after the storage-policy fix:
  - `ci.yml`: `f788426ad0bbd5987a8930746239582fe41c365e`;
  - `deploy-stage.yml`: `1bd2ae7c432183e4bce110b52b48ab9a7b286615`;
  - classifier: `af3e8edda201cfe9c4fc44dab2a8da3ccd08af40`;
  - routing tests: `b4c3950d38a8cec838362bb9c670338ef752b901`.
- `python3 scripts/ci/agent_docs_scope_test.py`: 8/8 tests passed against the corrected exact workflow/script blobs.
- Both workflow YAML files parsed successfully with PyYAML 6.0.3.
- Pure Agent Docs, mixed, unrelated, empty, unavailable-base, full base-to-head and artifact/head-mismatch cases are covered.
- The routing contract now asserts the repository-mandated non-blocking artifact upload.

### Checks failed

- Superseded head `3f58579878a17ab69eb28e4d4c12fb048ac66d75`: `Actions storage cleanup` run `30230143787` failed only at `Validate Actions storage policy` because the new scope upload lacked `continue-on-error: true`.
- The storage-policy defect is fixed on the current branch; superseded CI runs are not valid merge evidence.

### Current branch head

Resolve from live PR #244 after this failure-record update.

### Next action

Freeze the corrected branch head, inspect the complete PR #244 CI graph, and classify any remaining failure without retrying an unchanged deterministic head.