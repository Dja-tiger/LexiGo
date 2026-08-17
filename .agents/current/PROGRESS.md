# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Reconciliation PR #578 is merged; exact base/main for #577 is `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`; exact-main lightweight CI #3737 / run `32045106793` is green.
- Issue #577 is open under umbrella #205 and uses repo-owned OpenPencil/Linux evidence rather than Figma Cloud editing.
- OpenPencil provenance: Dictionary `fig_4008`, Phrases `fig_7281`, Learn recommended `fig_6826`, canonical compact viewport 390×844.
- Dictionary root cause was proven: primary Library navigation emitted graph `product`, causing compatibility `LexigoPremiumApp` ownership after SPA navigation.
- Materials root cause was compact text geometry ownership; Reminder root cause was hardcoded legacy presentation tokens.
- CI #3739 / run `32046365625` at head `43e80f5b1b0d6c778f53147ba6a115fefc94df0b` proved the runtime/browser changes across the normal matrix, including WebKit/iOS. No additional bootstrap canonicalization was required.

### Changed files

- `frontend/components/route-primary-navigation.tsx`: Library navigation now emits `dictionary` ownership.
- `frontend/app/information-architecture.css`: compact Materials has equal 48px targets, nowrap and overflow-safe geometry.
- `frontend/app/calendar-reminder-entry.css`: Reminder uses semantic surface/text/primary/elevation tokens.
- `frontend/e2e/dictionary-route-island.spec.ts`: canonical owner, Dictionary↔Phrases and Back/Forward regression contract.
- `frontend/e2e/learn-route-island.spec.ts`: Home→Learn, history/reload ownership contract.
- `frontend/e2e/route-transition-runtime-visual.spec.ts`: six content-addressed compact transition states.
- `frontend/playwright.visual.config.ts`: includes transition visual spec.
- `.agents/current/**`: active evidence and delivery state.

### Checks passed

- Initial CI #3738 correctly exposed only a brittle source-order unit contract; commit `43e80f5b…` restored source order without changing runtime pixels.
- Exact-head CI #3739 functional/browser gates are green: frontend core, both UI shards, WebKit/iOS, backend/security/integration, CSP, service worker, Dictionary smoke, iOS PWA, accessibility, performance and other selected gates.
- Visual #3739 classified cleanly as `30 passed`, `62 skipped`, `6 failed`, with exactly six intentional `REVIEW_REQUIRED` states and no additional structural/runtime/token/geometry failure.
- Exact Visual artifact `9293292461`, digest `sha256:fedbe32158ef6199005c1f11b834a2974f5bbef4291d4738f4b7069d1e1e2483`, was downloaded.
- Log values and PNG bytes were matched exactly for all six states and were stable on retry.
- All six exact Linux PNGs were manually inspected and accepted.

### Approved fingerprints

- Dictionary Light `390×1197` — `4487459cea3e1347768e381ce393aeeecfb3f1e22b47e01554810cb6508b556d`.
- Dictionary Dark `390×1197` — `9104709d0b7f742ae22f18bacfe605a7658eb0db0b539e93b597ff8779cd855c`.
- Phrases Light `390×1616` — `91cc3fabe4cc7369e1c67992a28d4199b0a68028e354098fe17a78f5ddf93318`.
- Phrases Dark `390×1616` — `066a3ba05e676501a6025214567bdbdd901c8b820e8cb632003e5fc44a00b6b9`.
- Learn Light `390×1212` — `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`.
- Learn Dark `390×1212` — `012800cae78c9639a97908b7a1d687e8b4893f47cc2cf615ecb6d04667827dc5`.

### Manual review result

- Dictionary Light/Dark: canonical Dictionary shell after real Home client navigation; Materials one line/equal height; no horizontal overflow or stale legacy owner.
- Phrases Light/Dark: canonical Phrases shell; Materials remains one line/equal height through Dictionary→Phrases switch; no x-overflow/clipping relevant to the #577 scope.
- Learn Light/Dark: canonical Learn shell; opened Reminder uses semantic appearance-specific surface/text/primary styling; legacy fixed dark palette does not leak into Light.
- Magenta profile rectangle is the intentional Playwright mask defined by the evidence spec.

### Current branch head

- Reviewed source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`.
- Evidence-approval commit is being created atomically; resolve final branch head from live ref after write.

### Next action

Commit only the reviewed fingerprints plus Agent Harness evidence, read back/compare, then require a fully green immutable-head CI. If green, audit reviews/threads/comments and main drift, mark PR #579 Ready, squash merge with expected head, then require exact-main CI and exact-SHA Stage/public validation before reconciliation.