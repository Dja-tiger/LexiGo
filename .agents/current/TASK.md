# Current Task

## Identity

- Issue: #617 — direct-entry / reload / Back-Forward matrix for 10 canonical routes
- Branch: `test/issue-617-route-history-parity`
- Base SHA: `d305300c0d22cbb8ed2744e568a5eab7583c3923`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Close the next automatable #205 navigation acceptance dimension with one executable browser-history audit across all ten canonical routes.

## Scope

- Add `frontend/e2e/route-history-parity.spec.ts`.
- Cover desktop Chromium `1440×1024` and iOS WebKit `390×844`.
- Run explicit Light/Dark.
- For every route prove direct entry, reload, real browser Back restoration and Forward restoration.
- Use deterministic valid Active Lesson and Onboarding states.
- Add `frontend/components/route-history-collection-contract.test.ts`.
- Add the owner to blocking `test:e2e:navigation`.
- Record task evidence in `.agents/current/**`.

## Non-goals

- No OpenPencil source mutation.
- No Figma work; Figma is archival provenance only.
- No router/history/runtime React changes inside this audit PR.
- No synthetic popstate/history event shortcuts.
- No arbitrary sleeps.
- No weakening of existing route-specific URL/filter/scroll history tests.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `frontend/package.json`

## Prohibited paths

- Runtime router/React/CSS owners.
- Backend/API/schema/deploy files.
- OpenPencil source/tokens/mapping.
- Existing route-specific tests.
- GitHub workflows.

## Runtime owners

Read-only owners:

- Next.js App Router routes and route islands.
- Existing `frontend/e2e/app-router-routes.spec.ts` and route-island history tests.
- Existing detail URL/filter/scroll ownership tests.

## Documentation owners

- Issue #617 and parent #205.
- `.agents/current/**`.

## Invariants

- Active design source is repository-owned OpenPencil: `design/openpencil/LexiGo Design System.op` plus `docs/figma/openpencil-screen-map.json`.
- Figma Cloud/MCP is not a prerequisite or blocker.
- Real `page.reload()`, `page.goBack()` and `page.goForward()` own the acceptance; no synthetic popstate replacement.
- Route identity must be verified by pathname plus canonical route owner.
- Existing specialized Dictionary/Phrases/Home/Learn history contracts remain unchanged.
- If a real runtime history defect appears, split it into a separate runtime Issue/PR rather than weakening this audit.

## Acceptance criteria

- 10 canonical routes × desktop Chromium/iOS WebKit × Light/Dark survive direct entry and reload.
- Back restores exact canonical route identity and owner.
- Forward restores the real second history entry and owner.
- Active Lesson and Onboarding use deterministic valid states.
- Detail routes retain exact word/phrase identity.
- Runtime error capture is clean.
- Blocking navigation collection explicitly contains the owner.
- Full immutable-head CI succeeds before merge.

## Required checks

- Frontend lint/typecheck/unit/build.
- Blocking navigation E2E collection.
- Existing full browser/visual/performance/backend CI.
- Final review/thread/main-drift audit.

## Risks

- Browser BFCache may restore already-expanded Active Lesson while a cold reload returns the saved-lesson disclosure; stabilization must accept both valid states without bypassing the real URL/history behavior.
- Page-level API overrides must remain narrower than the shared quality-gate fixture.

## Rollback

Delete the new audit/source contract and remove its package-script collection entry. Runtime remains untouched.
