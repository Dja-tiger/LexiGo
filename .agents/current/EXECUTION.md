# Current Task Execution

## Task

- Branch: `test/issue-525-learn-figma-parity`
- Base SHA: `b29344917805581cdf209730da2cd56570db41b4`
- Head SHA: resolve from live branch ref
- PR: #526 — `test(figma): add canonical Learn Composer parity contract`

## Skills used

### github

Purpose:

Repository/Issue/PR/CI inspection and guarded branch/file writes under the LexiGo Agent Harness.

Instruction source:

`skills://plugins/github/github/skill.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, task-specific `.agents/*` guidance and `docs/agent-harness.md`.

Version or verification date:

Verified for this task on 2026-08-15 Europe/Moscow.

Inputs:

Issue #525, umbrella #205, exact main SHA `b29344917805581cdf209730da2cd56570db41b4`, repository Figma handoff, existing Learn composer/zoom/accessibility tests, PR #526 and CI #3524.

Files inspected:

- Agent Harness/root guidance and specialized contracts;
- `frontend/docs/adaptive-knowledge-coach.md`;
- `frontend/components/lexigo-learn-app.tsx`;
- `frontend/components/lesson-composer-progressive-shell.tsx`;
- `frontend/components/route-primary-navigation.tsx`;
- `frontend/app/adaptive-lesson-composer.css`;
- `frontend/e2e/adaptive-lesson-composer.spec.ts`;
- `frontend/e2e/learn-browser-zoom.spec.ts`;
- `frontend/e2e/support/quality-gates.ts`;
- `frontend/e2e/learn-route-island.spec.ts`;
- `frontend/playwright.config.ts`;
- `frontend/package.json`;
- `.github/workflows/ci.yml`.

Actions performed:

- verified exact fresh `main` and no conflicting open PR/branch;
- created Issue #525 and branch `test/issue-525-learn-figma-parity`;
- added the six-case test-only Learn Composer parity contract for Figma `202:6`, `203:5`, `204:2`;
- preserved separate ownership for behavior, 200% zoom, reduced-motion and touch-target evidence;
- opened PR #526 and obtained initial full green CI #3524 on head `168cc4c411bffccdd77ae95c819117a557faed31`;
- audited the actual authoritative UI collection instead of treating a green workflow as sufficient evidence;
- found that `test:e2e:ui` explicitly enumerates spec files and omitted `e2e/learn-route-island.spec.ts`;
- rejected CI #3524 as merge evidence for the new parity contract;
- expanded task scope only for `frontend/package.json` collection registration and added the new spec to `test:e2e:ui`;
- kept `main` unchanged throughout corrective writes.

Commands or procedures:

GitHub connector-first workflow; every contents write uses the current blob SHA and explicit branch, followed by read-back and `main` SHA verification. Collection proof uses the conjunction of `frontend/package.json`, `frontend/playwright.config.ts`, `.github/workflows/ci.yml` and completed workflow job status rather than assuming a new file is auto-collected.

Artifacts produced:

Issue #525, PR #526, `frontend/e2e/learn-route-island.spec.ts`, authoritative `test:e2e:ui` registration and current Agent Harness evidence.

Result:

The first candidate is intentionally not mergeable evidence despite green CI because the new spec was absent from the executed allow-list. The branch now contains the required collection registration and must receive a fresh full CI on a new immutable head before merge.

Failures:

1. Live Figma metadata inspection is unavailable because the connected Figma MCP reached its Starter-plan tool-call limit.
2. Initial CI evidence gap: CI #3524 did not execute the new parity spec because `test:e2e:ui` is an explicit file allow-list.

Root cause:

1. External Figma plan quota, not a repository or application failure.
2. Repository UI CI collection is explicitly enumerated in `frontend/package.json`; placing a spec under the Playwright `testDir` alone is insufficient.

Fallback / correction:

- use only the already-delivered repository-side canonical mapping from #203/PR #501; do not claim fresh Figma canvas inspection or mutation;
- register `e2e/learn-route-island.spec.ts` in the existing `test:e2e:ui` script and require a new full CI on the corrected immutable head.

Limitations:

This slice cannot claim new manual screenshot-vs-Figma approval while live Figma MCP access is blocked. CI may prove executable route parity only against the approved repository-side mapping.

Reusable lesson:

For route parity, verify not only that a Playwright spec exists under `testDir`, but also that repository CI actually selects it. In this repository, authoritative UI coverage is an explicit `test:e2e:ui` allow-list, so every new parity spec must be registered there and proven on the same immutable head used for merge.
