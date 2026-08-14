# Current Task Progress

## 2026-08-15 Europe/Moscow

### Verified

- Issue #525 is the atomic `/learn` Lesson Composer child of umbrella #205.
- Fresh base `main` is `b29344917805581cdf209730da2cd56570db41b4` after docs-only PR #524 reconciliation.
- Branch `test/issue-525-learn-figma-parity` and PR #526 were created from that exact base.
- Repository handoff identifies mobile collapsed `202:6`, mobile manual `203:5`, desktop full composer `204:2`; Light/Dark share ownership/geometry with semantic tokens.
- `frontend/e2e/learn-route-island.spec.ts` contains six canonical cases and explicit Playwright `figma` annotations.
- Initial candidate `168cc4c411bffccdd77ae95c819117a557faed31` completed full CI #3524 successfully, including both UI shards.
- Audit of the actual `frontend/package.json` `test:e2e:ui` command proved that the new `learn-route-island.spec.ts` was not registered in the authoritative UI collection, so CI #3524 did not validate the new parity contract despite being green.
- `frontend/playwright.config.ts` uses `testDir: "./e2e"`, but repository CI does not run an unqualified Playwright collection for UI shards; `.github/workflows/ci.yml` invokes `npm run test:e2e:ui -- --shard=1/2` and `--shard=2/2`, therefore explicit script registration is required.
- Task scope was expanded only to permit this collection registration; no CI workflow, Playwright config, production React/CSS, backend or dependency changes are needed.
- `frontend/package.json` now includes `e2e/learn-route-island.spec.ts` in `test:e2e:ui`.
- `main` remained unchanged at `b29344917805581cdf209730da2cd56570db41b4` through the corrective branch writes.
- Live Figma MCP remains Starter-plan tool-call limited; no new canvas state is claimed.

### Finding

The parity test itself was correct, but the first green PR CI was insufficient evidence because the repository uses an explicit allow-list for the UI Playwright suite.

### Root cause

`test:e2e:ui` enumerates spec paths explicitly. Adding a new spec under `frontend/e2e/` does not automatically make it authoritative CI coverage.

### Changed files

- `frontend/e2e/learn-route-island.spec.ts` — six-case Learn Composer parity contract.
- `frontend/package.json` — register the new spec in the existing `test:e2e:ui` collection.
- `.agents/current/TASK.md` — Issue #525 execution contract, including collection registration scope.
- `.agents/current/PROGRESS.md` — current evidence and CI collection finding.
- `.agents/current/EXECUTION.md` — tool/procedure provenance and corrective evidence.

### Checks passed

- initial full CI #3524 green on `168cc4c411bffccdd77ae95c819117a557faed31`;
- review-thread audit clean before the corrective change;
- authoritative collection audit identified the missing registration before merge;
- package read-back confirms `e2e/learn-route-island.spec.ts` is now in `test:e2e:ui`;
- `main` SHA remained unchanged after task/package writes.

### Checks failed

- initial immutable candidate cannot be used as merge evidence because CI #3524 did not execute the newly added parity spec.

### Current branch head

Resolve from live PR after this progress write. Previous head after the collection fix: `83ec94fccf1d25e0e12803904a594535b0e31a07`.

### Next action

Update execution provenance, then treat the resulting head as a new immutable candidate and require a fresh full CI. Merge is allowed only after the new UI shards execute the registered Learn parity spec successfully and review/head guards remain clean.
