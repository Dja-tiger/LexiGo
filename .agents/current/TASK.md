# Current Task

## Identity

- Issue: #542 — [Figma][#205] Add canonical Profile parity contract
- Branch: `feat/issue-542-profile-parity`
- Base SHA: `11ad10835ad968b41f5f53b01e97d22dab08a1e9`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Add an executable four-case canonical Figma parity contract for `/profile` inside the existing authoritative Profile visual owner, preserving approved content-addressed baselines and existing interaction/reflow ownership.

## Scope

- Extend `frontend/e2e/profile-visual.spec.ts` only for executable canonical route parity.
- Cover mobile Light/Dark from canonical node `79:6` at `390×844` and desktop Light/Dark from canonical node `79:129` at `1440×1024`.
- Verify direct entry, exact route/no query, single Profile route island, semantic main, deterministic authenticated Profile hierarchy, explicit appearance/canvas, RouteChrome owner, horizontal containment and reload stability.
- Reuse `installDeterministicRuntime` and `installQualityGateAPI`; do not create a competing Profile fixture unless CI proves the existing quality-gate data is insufficient.

## Non-goals

- No Profile redesign or production React/CSS changes unless executable browser evidence proves an independent product defect.
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

Production/runtime paths may be admitted only by a separately proven product defect and an updated pre-flight record.

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
- Preserve existing browser-owned 200% zoom evidence byte-for-byte except for imports/helpers strictly required by the new matrix.
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

## Required checks

- Readback of all changed allow-listed files and branch/main refs after each write.
- Existing Profile visual baseline/hash tests without update mode.
- Canonical compact/desktop Profile parity cases on visual projects.
- Relevant browser/UI shards and full required immutable-head CI.
- Review/review-thread audit, Ready gate, expected-head squash merge and exact-main CI.

## Risks

- Existing quality-gate fixture text/values may differ from historical `profile.spec.ts`; assertions must follow the actual deterministic fixture, not hard-code guessed account/progress values.
- Existing Profile visual setup opens/closes the reminder dialog to stabilize screenshots; canonical parity should avoid mutating state unless necessary to reach a deterministic settled route.
- RouteChrome ownership must be asserted from actual visible `data-route-navigation`, not viewport assumptions alone.
- Dark appearance must be established through the app's explicit appearance storage contract, not only browser color-scheme emulation.

## Rollback

Revert the atomic test-contract changes plus task-memory bookkeeping without touching production runtime or existing visual baselines.
