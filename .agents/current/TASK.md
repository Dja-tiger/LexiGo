# Current Task

## Identity

- Issue: #577 `[High][Frontend][Design Runtime] Убрать stale legacy UI при Home → Dictionary/Learn, исправить Materials tabs и Reminder`
- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Reviewed-source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`
- Head SHA: resolve from live branch ref after evidence-approval commit
- PR: #579 Draft

## Objective

Remove transition-dependent legacy presentation ownership from compact Home → Dictionary/Learn flows, keep Materials stable at 390×844, and align the shared Reminder with active semantic tokens. Prove the repair through client navigation, history traversal, WebKit/iOS and exact Linux Light/Dark evidence.

## Scope

- `/dictionary` primary navigation enters canonical Dictionary ownership.
- Dictionary ↔ Phrases retains canonical route ownership and compact Materials geometry.
- Home → Learn, Back/Forward and reload retain canonical Learn ownership.
- Materials labels remain one line with equal minimum 48px targets and no x-overflow.
- Shared `CalendarReminderRouteEntry` uses semantic surface/text/primary tokens.
- Transition evidence covers Dictionary, Phrases and Learn in Light/Dark at 390×844.

## Non-goals

- No redesign, backend/API change, Figma Cloud editing or OpenPencil mutation.
- No synthetic remount, timing workaround, forced reflow, broad `!important`, or blind snapshot update.
- No bootstrap canonicalization unless executable evidence proves it necessary; CI #3739 did not.

## Allowed paths

- `frontend/components/route-primary-navigation.tsx`
- `frontend/app/information-architecture.css`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/e2e/dictionary-route-island.spec.ts`
- `frontend/e2e/learn-route-island.spec.ts`
- `frontend/e2e/route-transition-runtime-visual.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Runtime owners

- `RoutePrimaryNavigation` owns primary navigation graph hints.
- `LexigoDictionaryApp`, `LexigoPhrasesApp`, and `LexigoLearnApp` own their canonical routes.
- `CatalogKindNavigation` + `information-architecture.css` own Materials geometry.
- `CalendarReminderRouteEntry` + `calendar-reminder-entry.css` own Reminder presentation.

## Invariants

- Canonical route owner survives SPA transition and Back/Forward.
- `/lesson/*` handoff remains unchanged.
- Materials has two equal, one-line compact targets with no document x-overflow.
- Reminder remains one shared disclosure owner and preserves interaction geometry.
- Visual hashes are content-addressed and approved only from manually inspected exact Linux artifact bytes.

## Reviewed visual evidence

Source is CI #3739 / run `32046365625` at immutable head `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`, artifact `9293292461` (`frontend-playwright-report-visual`), digest `sha256:fedbe32158ef6199005c1f11b834a2974f5bbef4291d4738f4b7069d1e1e2483`.

- Dictionary Light: `390×1197`, `4487459cea3e1347768e381ce393aeeecfb3f1e22b47e01554810cb6508b556d`.
- Dictionary Dark: `390×1197`, `9104709d0b7f742ae22f18bacfe605a7658eb0db0b539e93b597ff8779cd855c`.
- Phrases Light: `390×1616`, `91cc3fabe4cc7369e1c67992a28d4199b0a68028e354098fe17a78f5ddf93318`.
- Phrases Dark: `390×1616`, `066a3ba05e676501a6025214567bdbdd901c8b820e8cb632003e5fc44a00b6b9`.
- Learn Light: `390×1212`, `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`.
- Learn Dark: `390×1212`, `012800cae78c9639a97908b7a1d687e8b4893f47cc2cf615ecb6d04667827dc5`.

All six exact PNGs were manually inspected after confirming the log values match artifact bytes. Dictionary/Phrases show canonical shell and stable one-line Materials; Learn Light/Dark shows canonical Learn and semantic Reminder presentation. The magenta profile control is the intentional Playwright mask defined by the spec.

## Acceptance criteria

- Functional/browser matrix including WebKit/iOS is green.
- Final immutable developer head is fully green after reviewed fingerprints are committed.
- PR review/thread/comment audit is clean before Ready/merge.
- Squash merge uses `expected_head_sha`.
- Exact-main full CI and exact-SHA Stage/public validation are green because this is runtime-bearing.
- After delivery, durable evidence is reconciled in a separate Agent Docs-only PR and `.agents/current/**` is reset to templates.

## Rollback

Revert the #577 runtime merge as one atomic product slice. Do not restore stale route ownership or stale visual fingerprints.