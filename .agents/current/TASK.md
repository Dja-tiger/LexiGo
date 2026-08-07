# Current Task

## Identity

- Issue: #74 — `[Medium][Accessibility] Увеличить мелкие touch targets и mobile labels`
- Branch: `feat/issue-74-phrases-browser-zoom`
- Base SHA: `0a120092d89f7fffcb63b010acb2cb71ea615740`
- Head SHA: resolve from live branch ref
- PR: create as Draft after the first complete developer-authored test slice

## Objective

Repair the authoritative Chromium visual collection boundary so the already-merged Home, Learn and Active Lesson true-browser-zoom specs are actually executed, add a bounded canonical `/phrases` 200% browser-owned zoom acceptance case, and add fail-closed regression protection against silently uncollected zoom specs.

## Scope

- add the three existing standalone browser-zoom specs to `playwright.visual.config.ts`;
- protect the authoritative collection contract with a Vitest source contract;
- add one canonical `/phrases` true 200% Chromium browser-zoom case using the existing MV3 controller and deterministic Phrases fixture;
- preserve all existing content-addressed Phrases baselines unchanged;
- record the confirmed dormant-test failure category in Agent Harness documentation before Ready.

## Non-goals

- no redesign or new Figma interpretation;
- no product runtime, CSS, API, database or dependency changes unless authoritative CI reproduces a real product defect;
- no visual baseline update;
- no workflow weakening or alternate CI path;
- no closure of Issue #74 until the remaining control audit and physical-device acceptance are separately proven.

## Allowed paths

- `frontend/playwright.visual.config.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/components/browser-zoom-collection-contract.test.ts`
- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-74-browser-zoom-collection.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/**`
- other `frontend/components/**` production source
- other `frontend/e2e/**` specs except the Phrases visual owner above
- visual PNG baselines or generated artifacts
- `frontend/package.json` and dependency lockfiles
- `.github/workflows/**`
- `backend/**`
- `deploy/**`

## Runtime owners

- authoritative visual collection: `frontend/playwright.visual.config.ts`;
- existing Home/Learn/Active browser-zoom contracts: their standalone `frontend/e2e/*-browser-zoom.spec.ts` files, unchanged in this slice;
- Phrases route: `LexigoPhrasesApp` with `PhrasesCatalog`; runtime remains read-only for this slice;
- Phrases deterministic fixture: existing `frontend/e2e/support/quality-gates.ts` contract, unchanged;
- browser-owned zoom mechanism: existing `frontend/e2e/support/browser-zoom-extension/**`, unchanged.

## Documentation owners

- repository state: `.agents/PROJECT_STATE.md` from merged PR #425;
- task evidence: `.agents/current/**`;
- reusable dormant-test prevention rule: `.agents/AGENTS.issue-74-browser-zoom-collection.md` indexed by `.agents/AGENTS.md`.

## Invariants

- a green CI run is acceptance evidence only for tests actually collected by the effective Playwright configuration;
- browser zoom must be browser-owned per-tab Chromium zoom, not `documentElement.style.fontSize`, CSS transform or viewport resizing;
- existing Phrases Linux content-addressed baseline hashes and dimensions stay byte-for-byte unchanged;
- canonical Phrases design remains the approved Figma file `3xXmBWnf38jbvLjtziwber` with catalog/detail nodes recorded in Issue #199;
- no change to authenticated Phrases API, URL/history ownership or Learn handoff;
- `main` must stay at the verified base until the branch write sequence is complete or the task is reconstructed.

## Acceptance criteria

- `home-browser-zoom.spec.ts`, `learn-browser-zoom.spec.ts` and `active-lesson-browser-zoom.spec.ts` are collected by the authoritative visual config and explicitly appear in CI evidence;
- a source contract fails if any required true-browser-zoom owner silently drops out of authoritative collection;
- canonical `/phrases` at browser zoom factor 2 proves independent CDP/DOM telemetry, responsive reflow, no horizontal overflow, no route-chrome/content overlap, usable search/filter/result/lesson actions and visible keyboard focus;
- Phrases existing Light/Dark compact/desktop content-addressed visuals pass with no baseline updates;
- full required product CI succeeds on the final developer-authored head;
- no unresolved review threads remain;
- expected-head squash merge, exact-SHA main CI and exact-image stage/public validation succeed;
- repository memory is reconciled afterward and current task context reset in the standard follow-up docs slice.

## Required checks

- frontend format/lint/typecheck/unit;
- production build;
- authoritative Playwright visual collection with explicit Home/Learn/Active/Phrases browser-zoom execution evidence;
- browser/UI/a11y/axe/responsive matrices required by the repository classifier;
- unchanged content-addressed Phrases visual hashes;
- performance/bundle and container gates selected by full product CI;
- review/thread audit;
- exact-SHA main CI;
- exact-image stage deploy, public endpoint smoke and public browser validation.

## Risks

- newly collected Home/Learn/Active specs may reveal real responsive defects that were previously hidden by the dormant collection boundary;
- Phrases true browser zoom may expose CSS overflow or route-chrome overlap not covered by root-font-size reflow;
- persistent Chromium extension startup can be runner-sensitive; failures must be classified from exact logs rather than retried blindly.

## Rollback

Revert the collection/test-contract product commit(s). Runtime behavior is unchanged unless a separately evidenced product defect later requires an explicitly scoped fix.
