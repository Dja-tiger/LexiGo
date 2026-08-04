# Current Task Progress

## 2026-08-04 13:46 Europe/Moscow

### Verified

- Live `main` before branch creation: `ec1295c5458f280998c08aaef53a9e68d3c4fc86`.
- Issue #70 remains open and its seven acceptance criteria are unchanged.
- No intersecting Issue #70 product PR is open; Dependabot PRs #304–#306 remain unrelated.
- `.agents/PROJECT_STATE.md` records zero remaining exact-selector corrections and 21 reviewed `requires-proof` items across six proof families.
- README and `docs/architecture.md` both name `frontend/components/architecture-documentation-contract.test.ts` as executable ownership evidence.
- The documented architecture contract file was absent from the live production tree before this slice.
- `scripts/ci/frontend-container.sh` copies only `frontend/` into `/workspace`; repository-root README/docs were not available to frontend Vitest before the current fix.
- `scripts/ci/frontend-container.test.sh` originally created only frontend/deploy fixture directories, so the new fail-closed README/docs host checks correctly rejected the incomplete harness checkout.

### Finding

Focused source/browser contracts prove all six semantic owner families, but no single executable registry guaranteed that all 21 reviewed manifest items were covered exactly once or that all seven Issue #70 acceptance criteria remained connected to current evidence. Public documentation additionally referenced a missing architecture contract path. Authoritative execution then exposed both sides of the isolation contract: frontend Vitest needed real repository documents, and the shell harness needed representative README/docs fixtures plus exact read-only mount assertions.

### Root cause

Issue #70 was delivered incrementally through isolated cleanup and computed-cascade slices. Each slice added local evidence, while the final cross-family registry and public-document contract had not yet been materialized as one source-controlled test. Frontend CI intentionally copies only `frontend/` into a private Docker volume, so resolving `process.cwd()/..` from `/workspace` produced `/README.md` rather than the checkout. The shell harness modeled the old minimum checkout and therefore lacked the newly required public-document sources.

### Changed files

- `frontend/components/architecture-documentation-contract.test.ts`
- `scripts/ci/frontend-container.sh`
- `scripts/ci/frontend-container.test.sh`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Branch `agent/issue-70-final-acceptance-audit` created from exact main SHA.
- New contract parses and validates manifest structure and classification values fail-closed.
- Registry count is fixed at resource stack 1, Async State 1, Learn switch 8, adaptive Lesson Composer 6, Phrases grid 4 and Account Security 1.
- Contract requires every `requires-proof` item to map to exactly one family and requires every family count to match.
- CI #2693/run `30900646997` on head `a616ea7e51b1acc4a4e44fc520d1cc07cc0341b7` passed lint, TypeScript and three of four new acceptance tests.
- The manifest totals, exhaustive 21/21 family mapping, semantic owner/source/browser links and authoritative UI command registration all passed in CI.
- The remaining 563 existing tests passed; no production or focused proof regression was reported.
- Bash syntax passed for the read-only mount implementation.
- `README.md` and `docs/` are mounted read-only at `/repository`; local execution retains the repository-parent fallback.
- The shell harness now creates representative public-document fixtures and asserts both exact `:ro` mount arguments.

### Checks failed

- An initial attempt used the existing-file `update_file` operation for a new path and was rejected before any repository write.
- CI #2693 frontend unit step failed one assertion group with `ENOENT: no such file or directory, open '/README.md'` because the repository documents were outside the isolated frontend volume.
- Deployment scripts check run `30901123947` failed its environment-forwarding harness because the fixture checkout did not contain README/docs; the production script failed closed before invoking the Docker stub.
- Both failures were deterministic evidence-contract gaps, not production, manifest, semantic mapping, lint, type or Bash syntax defects. Neither workflow was retried without a code/test change.

### Current branch head

Resolve from live branch ref; latest known functional write before this progress update: `2eba148e81ae81b1763a31204c4e5e0443d6eb2d`.

### Next action

Treat the newest immutable head CI and Deployment scripts check as authoritative. Merge only after the complete frontend/backend/browser/visual/performance/container matrix and the shell harness are green.
