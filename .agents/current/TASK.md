# Current Task

## Identity

- Issue: #647
- Branch: fix/issue-647-first-use-desktop-state-hierarchy
- Base SHA: 564bc24ab2b7f47e9f8d6e82989cbfd1df51adce
- Head SHA: resolve from live branch ref
- PR: #648

## Objective

Restore the repository-owned OpenPencil desktop hierarchy for First Use loading and generic recoverable-error states before Issue #642 can approve new Linux visual fingerprints.

## Scope

- restore the canonical 1440×900 desktop intro hierarchy above loading/error panels;
- align desktop loading panel spacing/content intent with OpenPencil nodes n442 / n614;
- align desktop generic recoverable-error panel structure/copy intent with n456 / n628;
- preserve mobile presentation and existing onboarding behavior/state ownership;
- add focused source-level regression protection;
- reconcile existing downstream system-state source ownership assertions that became stale after the intended runtime class composition changed.

## Non-goals

- no backend/API/session/state-machine changes;
- no OpenPencil `.op`, tokens or screen-map mutation;
- no visual baseline/hash approval in this repair PR;
- no workflow/dependency changes;
- no First Use redesign outside loading/error desktop hierarchy;
- no correction of PR #645's deterministic error fixture in this runtime PR.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`
- `frontend/components/system-state-openpencil-contract.test.ts`

## Prohibited paths

- `backend/**`
- `api/**`
- `design/**`
- `docs/figma/openpencil-screen-map.json`
- `.github/workflows/**`
- dependency manifests/lockfiles
- deploy/runtime infrastructure files
- visual baseline binaries or fingerprint allow-lists

## Runtime owners

- `frontend/components/lexigo-onboarding-app.tsx` — First Use loading/error state presentation and retry semantics.
- `frontend/app/first-use.css` — First Use responsive/appearance presentation.

## Documentation owners

- Issue #647 and `.agents/current/**` for task-local evidence.

## Invariants

- `aria-busy=true` remains on initial loading main and loading reveals no answer content;
- recoverable error remains `role=alert`, retains `Повторить` and `Вернуться назад`, and does not change mutation/retry sequencing;
- 390×844 mobile loading/error behavior and layout remain owned by their current presentation;
- existing role/diagnostic/completed/skipped flows are untouched;
- exact OpenPencil source identity remains `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.

## Acceptance criteria

- desktop Light/Dark loading at 1440×900 restores the header → intro → 720×540 panel hierarchy of n442 / n614;
- desktop Light/Dark generic recoverable error restores the hierarchy of n456 / n628;
- loading remains deterministic, answer-free and aria-busy;
- error retains alert/retry/back semantics and preserved-state desktop copy;
- compact mobile states do not regress;
- existing First Use behavioral/visual owners remain green;
- full immutable-head CI is green before merge;
- runtime delivery is validated on exact-main and Stage before #645 is reconstructed.

## Required checks

- focused First Use and system-state source contracts;
- frontend lint/typecheck/unit/build;
- existing First Use browser behavior in Chromium/WebKit/Android/iOS;
- accessibility/reduced-motion gates applicable to First Use;
- Linux visual evidence reviewed against n442/n456/n614/n628;
- full immutable-head CI and clean review audit.

## Risks

- CSS changes could leak into mobile or normal diagnostic states;
- duplicated responsive copy could create duplicate accessible headings if visibility ownership is incorrect;
- centering rules on `.lx-first-use-message` could retain stale desktop geometry even after adding the intro block;
- older source contracts may incorrectly bind runtime ownership to a literal static class string instead of semantic error ownership.

## Rollback

Revert this atomic branch/PR; no data/API/design migration is involved. Issue #642 remains fail-closed until a corrected runtime is delivered.
