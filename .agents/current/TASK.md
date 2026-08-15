# Current Task

## Identity

- Issue: #542 — [Figma][#205] Add canonical Profile parity contract
- Branch: `feat/issue-542-profile-parity`
- Base SHA: `11ad10835ad968b41f5f53b01e97d22dab08a1e9`
- Validated source SHA before handoff sync: `19ef7ab396fc53088aa464a6ab14ab6c16317077`
- PR: #543 — `test(figma): add canonical Profile parity contract`

## Objective

Add an executable four-case canonical Figma parity contract for `/profile` inside the existing authoritative Profile visual owner, preserving approved content-addressed baselines and existing interaction/reflow ownership.

## Scope

- Extend `frontend/e2e/profile-visual.spec.ts` only for executable canonical route parity.
- Cover mobile Light/Dark from canonical node `79:6` at `390×844` and desktop Light/Dark from canonical node `79:129` at `1440×1024`.
- Verify direct entry, exact route/no query, single Profile route island, semantic main, deterministic authenticated Profile hierarchy, explicit appearance/canvas, RouteChrome owner, horizontal containment and reload stability.
- Reuse `installDeterministicRuntime` and `installQualityGateAPI`; do not create a competing Profile fixture.

## Non-goals

- No Profile redesign or production React/CSS changes.
- No screenshot recapture, hash/dimension changes or snapshot update mode.
- No duplication of day-goal mutation, reminder-dialog behavior, appearance interaction, keyboard navigation, logout behavior or touch-target/200% reflow coverage already owned elsewhere.
- No backend/API contract, package/lockfile, Playwright config or workflow changes.
- No `/onboarding` work; onboarding remains design-gated.

## Allowed paths

- `frontend/e2e/profile-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS.base.md` only if a genuinely new confirmed failure category must be recorded before Ready.

## Prohibited paths

- `frontend/components/**`
- `frontend/app/**/*.css`
- existing Profile PNG baselines
- `frontend/e2e/profile.spec.ts`
- `frontend/e2e/profile-touch-targets.spec.ts`
- `backend/**`
- package/lockfiles
- Playwright config
- `.github/workflows/**`

## Runtime owners

- `LexigoProfileApp` owns `/profile`.
- Semantic main is `#lexigo-main-content[aria-label="Профиль"]` via `viewTitle("profile")`.
- Route island is `[data-route-client-island="profile"]`.
- `RouteChrome` owns primary navigation.
- `frontend/e2e/profile.spec.ts` owns Profile settings/action behavior.
- `frontend/e2e/profile-touch-targets.spec.ts` owns touch targets and 200% reflow.
- `frontend/e2e/profile-visual.spec.ts` owns approved Profile visual baselines and browser-owned Profile zoom evidence; this issue extends that same owner with route parity assertions.

## Documentation owners

- Umbrella parity Issue #205.
- Atomic Issue #542.
- Repository handoff: `frontend/docs/adaptive-knowledge-coach.md` and `.agents/PROJECT_STATE.md`.
- Figma source file `3xXmBWnf38jbvLjtziwber`, Profile page `79:2`, canonical mobile `79:6`, canonical desktop `79:129`.

## Invariants

- Preserve all four existing content-addressed Profile visual hashes/dimensions byte-for-byte.
- Preserve existing browser-owned 200% zoom evidence byte-for-byte.
- Preserve `profile.spec.ts` and `profile-touch-targets.spec.ts` as separate authoritative owners.
- Dark Profile cases are token-derived from the same approved Light geometry/semantics; do not invent separate Figma nodes.
- Live Figma MCP is quota-blocked; repository-approved exact node mapping is authoritative for this slice and no fresh cloud synchronization may be claimed.

## Acceptance criteria

- Four canonical Profile cases execute inside `frontend/e2e/profile-visual.spec.ts`.
- Direct `/profile` entry resolves with no query state and survives reload.
- Exactly one Profile route island and semantic main are visible.
- Deterministic authenticated Profile hierarchy is present, including identity/account summary, practice parameters, daily goal, reminder controls, application appearance and account/security/device controls.
- Mobile uses visible `data-route-navigation="mobile"`; desktop uses visible `data-route-navigation="rail"`.
- Light/Dark attributes and canonical canvas tokens are asserted.
- Canonical viewports have no horizontal overflow.
- Runtime error capture remains empty.
- Existing Profile baseline/hash and touch/reflow contracts remain unchanged.
- Required immutable-head CI is green on final developer-authored head; no unresolved review threads remain before merge.

## Source validation evidence

- CI #3572 exposed a stale ambiguous `Скачать мои данные` test locator; no product defect was established.
- CI #3573 exposed the same locator category for `Удалить аккаунт`; production UI remained unchanged.
- The final test contract targets the four top-level Profile account-action surfaces by exact accessible name instead of masking ambiguity with `.first()`.
- CI #3574 on source SHA `19ef7ab396fc53088aa464a6ab14ab6c16317077` proved all four new canonical Profile cases and all four pre-existing Profile content-addressed baselines unchanged.
- CI #3574 attempt 1 had one unrelated failure in `system-states-visual.spec.ts` for Dictionary empty Light (`79:93`): expected `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`, received `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`.
- Controlled same-head Visual retry job `95074585326` passed the complete visual suite without any source or baseline change; aggregate Frontend quality and both container builds then passed.
- PR #543 has no conversation comments, submitted reviews or inline review threads at the source-green checkpoint.

## Required remaining checks

- Read back final TASK/PROGRESS/EXECUTION handoff files and verify branch/main refs after writes.
- Run complete required CI again on the final developer-authored handoff head.
- Re-audit reviews/threads, mark PR #543 Ready, then squash-merge with expected-head protection.
- Verify exact-main CI after merge before starting the next atomic Figma slice.

## Risks

- The unrelated Dictionary empty-state visual hash showed runner-level nondeterminism once; do not fold that baseline into #542 or approve a new hash without independent Figma evidence.
- RouteChrome ownership must remain asserted from actual visible `data-route-navigation`, not viewport assumptions alone.
- Dark appearance must remain established through the app's explicit appearance storage contract, not only browser color-scheme emulation.

## Rollback

Revert the atomic test-contract changes plus task-memory bookkeeping without touching production runtime or existing visual baselines.
