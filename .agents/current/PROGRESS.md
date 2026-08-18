# Current Task Progress

## 2026-08-18

### Verified

- Live task is Issue #583 under umbrella #205; Draft PR #599 is the active delivery vehicle.
- Branch `fix/issue-583-compact-reminder-library-geometry` was created from exact `main@0ff82f22404f94ed8f3fe568af0924fe65fc5f68`.
- Active design source is repo-owned OpenPencil mapping; `dictionary.mobile.light` (`fig_4008`), `phrases.mobile.catalog.light` (`fig_7281`) and `learn.mobile.recommended` (`fig_6826`) are 390×844 mobile anchors. No separate 430px design screen exists, so 430px is a responsive continuation.
- Root cause is proven:
  1. the compact routed Reminder remains in the <=719px header layout but its label was visually hidden only through 390px;
  2. Phrases clears the shared compact app inline inset at <=767px and substitutes route-owned 24px catalog padding, while Dictionary retains the shared safe-area-aware shell inset.
- `CatalogKindNavigation` remains one shared semantic component; no duplicate markup or product redesign was needed.
- Runtime repair is owner-scoped in `frontend/app/issue-583-compact-library.css`:
  - Phrases shell parity is restored only from 391–719px, preserving exact 390px visuals;
  - redundant Phrases catalog inline padding is removed in that range;
  - routed Reminder remains icon-only but keeps its accessible text label throughout <=719px.
- Phrase Detail is untouched and no `!important` was introduced.
- Learn mode/source controls were not recolored speculatively; blocking WebKit assertions prove selected controls resolve semantic current-design `--ak-*` tokens.
- A dedicated 430×932 iOS WebKit Light/Dark regression covers direct entry, client navigation, reload, real Back/Forward, no horizontal overflow, Dictionary/Phrases Materials geometry equality, route-independent Reminder geometry and Learn semantic tokens.
- Normal blocking `test:e2e:ui` contains the Issue #583 proof exactly once.
- Exact Linux WebKit screenshots from run `32158725407` on head `f483bb61d96e8e010cd7c11ab20cb77f050ded8f` were manually reviewed before fingerprint approval.
- Final immutable implementation CI run `32160012533` on head `3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33` completed with conclusion `success`.
- Final run includes successful Frontend core, both UI shards, Visual regression, iOS PWA dictionary, Accessibility audit, Content security, Performance budgets, Controlled service worker, Dictionary smoke, Lesson completion, Backend unit/security and Backend integration.
- Live compare after the final implementation run was `ahead_by=16`, `behind_by=0` from exact main.

### Reviewed 430px fingerprints

- Dictionary Light: 430×1200 — `sha256:f08cfb773a0b60f300ed2054f6b5605b84fee8174990c844f1eca4bb889e074f`
- Dictionary Dark: 430×1200 — `sha256:2bf51ccafbedac172ba22230c08f5e9fb2e50d21a921714c9c7aa9855038db6c`
- Phrases Light: 430×1505 — `sha256:d08d940276584f80f82ac1d3fc46fd5f707041ae8f752d0cfc6db2112f3e9334`
- Phrases Dark: 430×1505 — `sha256:ec34bfc76b33bd55e08a9e2af62eeece5c4899ee3b25358bee36bd16007404ed`
- Learn Light: 430×1575 — `sha256:84e41f0c3f35a564df1ef9a821aee3ab58b842b62b9438788cff15ef478f510a`
- Learn Dark: 430×1575 — `sha256:cfcedd118c241757efc64efdb8e3215f136cad749e99055a79b71f332846bd53`

### Additional test hardening

- Existing Profile Auto/system-Light 430×932 visual baseline was intentionally affected by the shared Reminder fix; the replacement fingerprint `sha256:ad13c7ece87da840198b90f29721295fd0f465d1017eaa1390b2d3bfa086355d` from run `32154887658`, head `e9d477b4ec0282d2ec092903b34d72e1be1ba9c1`, was manually reviewed before approval.
- Existing Phrases search-clear mobile E2E was stabilized by waiting for the route's own layout-effect focus signal before filling the controlled search input after navigation. The final full CI passes this test.
- One calendar 200% reflow assertion failed once in an earlier evidence run but passed unchanged in final run `32160012533`; no speculative code change was made for a non-reproduced failure.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/EXECUTION.md`
- `.agents/current/PROGRESS.md`
- `frontend/app/issue-583-compact-library.css`
- `frontend/app/layout.tsx`
- `frontend/components/issue-583-compact-library-source.test.ts`
- `frontend/e2e/issue-583-compact-library.spec.ts`
- `frontend/e2e/phrases-search-clear-touch-targets.spec.ts`
- `frontend/e2e/profile-auto-theme.spec.ts`
- `frontend/package.json`

### Checks passed

- Live main/PR/Issue preflight and drift comparison.
- OpenPencil mapping and compact owner inspection.
- Source/readback ownership contract.
- Frontend lint/typecheck/unit/build/dependency audit.
- Existing immutable 390×844 visual transition contract.
- 430×932 iOS WebKit Light/Dark geometry and navigation proof.
- Manual exact Linux visual review before baseline approval.
- Accessibility, PWA, security, performance, service-worker and no-X-overflow coverage.
- Full immutable implementation-head CI: run `32160012533` — success.

### Checks failed during development and resolved

- Initial 430px visual tests failed closed with `REVIEW_REQUIRED` by design until exact Linux screenshots were reviewed.
- Test-harness CSP noise was removed from the Issue #583 runtime-error assertion while production CSP remains covered by its dedicated security suite.
- Phrases search-clear hydration race was stabilized using an application-owned focus/hydration signal.
- No unresolved implementation failure remains on verified head `3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33`.

### Current delivery state

Implementation is complete and green. Documentation reconciliation commits follow the verified implementation head and do not alter runtime behavior.

### Next action

Wait for the documentation-only head CI, update PR #599 from Draft to Ready with final evidence, re-check live main/drift/review state, squash merge with the expected head, then verify exact-main CI and exact-SHA Stage/public browser matrix before resetting `.agents/current/**` in the normal delivery-reconciliation flow.
