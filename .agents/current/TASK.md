# Current Task

## Identity

- Issue: #652
- Branch: fix/issue-652-first-use-loading-note-cascade
- Base SHA: 3f60ebf36bee55843936fcf76acd5be1bc3d5a5f
- Head SHA: resolve from live branch ref
- PR: create after atomic commit

## Objective

Repair the First Use desktop loading cascade so the compact-only loading note cannot be re-enabled by the later generic note owner, then deliver the runtime repair before Issue #642 / PR #645 is reconstructed again.

## Scope

- hide `.lx-first-use-loading-note--mobile` for desktop widths after the generic `.lx-first-use-note` declaration can affect the cascade;
- preserve compact `<=719px` display of that note;
- preserve the canonical desktop note, five desktop skeleton rows and the loading/error hierarchy delivered by #647/#648;
- strengthen the focused source contract to protect source-order/effective display ownership.

## Non-goals

- no backend/API/session/state-machine changes;
- no OpenPencil or screen-map mutation;
- no loading/error fingerprint approval;
- no workflow/dependency/deploy-infrastructure changes;
- no unrelated typography/header redesign.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`

## Prohibited paths

- `frontend/e2e/first-use-visual.spec.ts`
- `frontend/components/lexigo-onboarding-app.tsx`
- `backend/**`
- `api/**`
- `design/**`
- `docs/figma/openpencil-screen-map.json`
- `.github/workflows/**`
- dependency manifests/lockfiles
- deploy/runtime infrastructure files
- visual baseline binaries or hash allow-lists

## Runtime owners

- `frontend/app/first-use.css` — responsive First Use presentation and loading note display ownership.

## Documentation owners

- Issue #652 and `.agents/current/**`.

## Invariants

- desktop loading displays only the canonical lower desktop note;
- compact loading continues to display the compact note and hides the desktop note;
- loading remains `aria-busy=true`, answer-free and keeps five desktop skeleton rows;
- existing approved visual baselines remain unchanged;
- Issue #642 stays fail-closed until this repair is merged, validated on exact-main and deployed to Stage.

## Acceptance criteria

- desktop min-width boundary explicitly hides the mobile note after the generic note declaration;
- compact boundary still explicitly shows the mobile note;
- source contract verifies both the source-order relationship and desktop/compact selectors;
- full immutable-head CI passes;
- protected squash merge, exact-main CI and exact-SHA Stage/public validation succeed before reconstructing #645.

## Required checks

- focused First Use source contract;
- frontend lint/typecheck/unit/build;
- browser/accessibility/security/performance matrices;
- authoritative Linux Visual regression with existing baselines unchanged;
- clean diff/review/main-drift audit.

## Risks

- a stronger desktop selector could accidentally suppress the mobile note if the compact override does not win;
- moving generic note ownership could affect unrelated First Use states, so the fix is intentionally media-scoped;
- evidence hashes from #645 must not be reused after this runtime change.

## Rollback

Revert this atomic CSS/test slice; no data or API migration is involved.