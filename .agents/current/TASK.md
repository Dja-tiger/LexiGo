# Current Task

## Identity

- Issue: #647
- Branch: fix/issue-647-first-use-system-state-parity
- Base SHA: 564bc24ab2b7f47e9f8d6e82989cbfd1df51adce
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Restore the active OpenPencil desktop hierarchy for First Use initial loading and recoverable-error states without changing onboarding API/state-machine semantics or regressing mobile behavior.

## Scope

- repair loading/error presentation in `frontend/components/lexigo-onboarding-app.tsx`;
- reuse the existing First Use intro/panel CSS architecture in `frontend/app/first-use.css`;
- preserve mobile loading/error composition while adding canonical desktop intro hierarchy and spacing;
- preserve `aria-busy`, `role=alert`, retry/back actions and no-answer-disclosure behavior;
- add/adjust focused source/browser coverage proving desktop and mobile ownership.

## Non-goals

- no backend/API/session/state-machine changes;
- no OpenPencil/Figma source mutation;
- no visual hash approval in this PR;
- no workflow/dependency/deploy changes;
- no changes to role/diagnostic decision logic except shared presentation structure needed by loading/error.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/app/first-use.css`
- `frontend/e2e/first-use.spec.ts`
- `frontend/components/first-use-system-state-contract.test.ts`

## Prohibited paths

- other `frontend/app/**`
- other `frontend/components/**`
- other `frontend/e2e/**`
- `frontend/e2e/**/*-snapshots/**`
- `design/**`
- `docs/figma/**`
- `backend/**`
- `api/**`
- `.github/workflows/**`
- dependency manifests/lockfiles
- deploy/runtime configuration

## Runtime owners

- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/app/first-use.css`
- existing `frontend/e2e/first-use.spec.ts` behavioral contract.

## Documentation owners

Read-only active design evidence: `docs/figma/openpencil-screen-map.json`, committed `.op`; Issue #647; evidence audit #642; parent #641; umbrella #205.

## Invariants

- active OpenPencil is the source of truth;
- API request sequence, state persistence and retry behavior remain unchanged;
- mobile 390×844 loading/error remain usable and unclipped;
- no new visual fingerprint is accepted here;
- #645 remains fail-closed until this repair merges and evidence is recollected.

## Acceptance criteria

- desktop 1440×900 loading implements the intro + panel hierarchy represented by n442/n614;
- desktop 1440×900 recoverable error implements the intro + panel hierarchy represented by n456/n628;
- Light/Dark use existing tokenized styling, not one-off theme colors;
- loading remains `aria-busy=true`, with no answers disclosed;
- error remains `role=alert`, with `Повторить` and secondary back action;
- mobile loading/error retain correct compact hierarchy;
- focused browser/source tests plus full immutable-head CI pass;
- clean review/main-drift audit, expected-head squash merge, exact-main CI and exact-SHA Stage/public validation.

## Required checks

- focused unit/source contract;
- First Use browser behavior including desktop/mobile loading/error;
- full CI including visual/accessibility/security;
- post-merge exact-main CI and Stage/public validation.

## Risks

- generic error body can be server-provided; layout must remain robust for bounded copy without hard-coding test-only content;
- desktop-specific hierarchy must not duplicate headings semantically for screen readers on compact viewports.

## Rollback

Revert isolated #647 component/CSS/test commits; no data/API/design rollback is required.
