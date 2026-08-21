# Current Task Progress

## 2026-08-21 13:42 +03

### Verified

- Live `main` remains `37fe3016673ab261e4df4232274535f834578b77`.
- Issue #641 is open under parent #205; child #642 tracks the separately proven First Use loading/error visual-evidence gap.
- Draft PR #643 remains open from `test/issue-641-system-state-openpencil` to exact base `37fe3016…` with `Refs #641`, not `Closes #641`.
- The five shared system-state OpenPencil mappings remain Home Loading `fig_4258`, Dictionary Empty `fig_4234`, shared Error `fig_4222`, Desktop Offline `fig_4104`, Active Lesson Recall Offline `fig_3193`.
- First Use loading/error remains a separate real gap owned by #642.

### Current implementation

- `frontend/e2e/system-states-visual.spec.ts` preserves all five existing primary SHA-256 fingerprints and all exact renderer-equivalent allow-lists.
- The visual owner now records `screenMapKey`, `openPencilNode`, archival `legacyFigmaNode`, route and canonical viewport for every approved state.
- It now loads `docs/figma/openpencil-screen-map.json` in the authoritative visual environment using the same proven repo-root candidate-resolution pattern as `first-use-visual.spec.ts` (`GITHUB_WORKSPACE`, `/repository`, parent/current working directory fallbacks).
- Before each approved capture it fail-closes on exact active screen-map key/node/legacy provenance/route/width/height.
- `frontend/components/system-state-openpencil-contract.test.ts` is now a pure source contract: it verifies that the visual owner contains and executes the real map loader/contract and retains all exact provenance/hashes, without trying to read repo-level `docs/` from the isolated Vitest frontend volume.

### CI history and classifications

#### CI #3949 / run `32473173511`

- First frozen head: `cbf2799aaed3b47b777a08e76673e93224f25d37`.
- Lint/typecheck green; 134 other Vitest files and 821 tests green.
- New contract failed before test execution with `ENOENT '/docs/figma/openpencil-screen-map.json'`.
- Initial relative-path correction was made; no assertions/hashes/runtime flows were weakened.

#### CI #3952 / run `32473507422`

- Replacement head: `6edf18caf3ad2fed086bbe09dbb267721a2a6341`.
- Lint/typecheck green again; 134 other Vitest files and 821 tests green.
- New contract again failed before test execution with `ENOENT '/workspace/docs/figma/openpencil-screen-map.json'`.
- Exact environment evidence proves the frontend core unit step runs from isolated `/workspace` containing frontend files only; repo-level `docs/` is intentionally absent there.
- This is not a product defect or flake and cannot be fixed by another relative path.

### Architectural correction after CI #3952

- Commit `8415c4105f10e8ad92dbd14e4cc71d22ecc2ff70`: removed direct `docs/` filesystem dependency from the Vitest source contract while preserving the provenance/hashes/applicability assertions.
- Read-back blob: `f8daa01dd9952f737e87ac9351cf4acc296e9fc4`.
- Commit `db88a546103d09a1fe401c3819d7c43030d15b5c`: moved the actual active screen-map resolution into `system-states-visual.spec.ts`, where repo-level design artifacts are available and where exact Linux screenshots are already owned.
- Read-back blob: `58d636c6077063e41b54c2b917a91888064a3395`.
- The visual loader mirrors the already-delivered `first-use-visual.spec.ts` repository resolution pattern instead of inventing a new filesystem convention.
- Protected `main` was rechecked after both writes and remains `37fe3016…`.

### Invariants still preserved

- No runtime React/CSS/API/session/backend changes.
- No OpenPencil source/mapping mutation.
- No visual hash, renderer-equivalent allow-list or screenshot baseline changes.
- No snapshot update mode, tolerance widening or test exclusion.
- No change to the five system-state browser interaction/request flows.
- First Use loading/error is not falsely claimed complete; #642 remains blocking evidence.

### Process failure already recorded

Two setup calls were mistakenly routed to `create_pull_request(main→main)` while intending to create Issue #641; GitHub rejected both HTTP 422 before mutation. Recovery/tool-selection lesson remains in EXECUTION.

### Current branch head

- CI #3952 head: `6edf18caf3ad2fed086bbe09dbb267721a2a6341`.
- Source-contract architecture correction: `8415c4105f10e8ad92dbd14e4cc71d22ecc2ff70`.
- Visual-owner map validation correction: `db88a546103d09a1fe401c3819d7c43030d15b5c`.
- Resolve final head after this PROGRESS + EXECUTION sync and freeze it for the next full CI.

### Next action

Update EXECUTION with CI #3952 environment/root-cause evidence, read back and recheck main, freeze the resulting developer-authored head, then require fresh full CI including successful Vitest and Visual regression. No same-head retry of #3952 is valid because its failure is deterministic and already source-corrected.
