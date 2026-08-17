# Current Task

## Identity

- Issue: #577 `[High][Frontend][Design Runtime] Убрать stale legacy UI при Home → Dictionary/Learn, исправить Materials tabs и Reminder`
- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Objective

Remove transition-dependent legacy presentation ownership from compact Home → Dictionary/Learn flows, keep the 390×844 Materials segmented control stable on one line, and align the shared route Reminder with the active semantic design tokens. Prove the repair through real client navigation, intra-catalog switching, reload, Back/Forward, WebKit/iOS execution and exact Linux transition-derived visual evidence.

## Scope

- Correct the primary Library route-graph hint so `/dictionary` enters the canonical Dictionary owner.
- Verify stable Learn ownership across Home client navigation and history traversal; harden bootstrap graph canonicalization only if executable evidence still reproduces a stale `product` owner.
- Keep compact Materials buttons equal-height, single-line and overflow-safe at 390×844.
- Replace legacy dark Reminder hardcodes with current `--ak-*` semantic tokens while retaining the existing shared `CalendarReminderRouteEntry` owner and interaction geometry.
- Add client-transition regression coverage that runs in the existing Chromium/WebKit/Android/iOS project matrix.
- Add fail-closed 390×844 Light/Dark transition-derived Linux evidence for Dictionary, Phrases and Learn.

## Non-goals

- No redesign of Dictionary, Phrases or Learn.
- No backend/API/session/scheduler semantic changes.
- No Figma Cloud editing or Figma-only design source.
- No OpenPencil source mutation unless separate evidence proves a design-source gap.
- No synthetic navigation workaround, artificial remount/key, forced reflow, new timeout visual workaround, broad new `!important`, or blind visual-baseline update.

## Allowed paths

- `frontend/components/route-primary-navigation.tsx`
- `frontend/components/lexigo-bootstrapped-app.tsx` only if transition tests prove stale bootstrap graph acceptance remains after the navigation hint repair
- `frontend/app/information-architecture.css`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/e2e/dictionary-route-island.spec.ts`
- `frontend/e2e/learn-route-island.spec.ts`
- `frontend/e2e/calendar-reminder-entry.spec.ts` if shared Reminder behavior needs an additional non-visual contract
- `frontend/e2e/route-transition-runtime-visual.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend and API schema/handlers.
- `design/openpencil/**` unless a separately proven design gap requires a new atomic child slice.
- Native Figma archive/source.
- Deployment/workflow topology unless an existing CI route cannot execute the required contract.
- Existing unrelated visual snapshots or reviewed content-addressed fingerprints.

## Runtime owners

- `RoutePrimaryNavigation` owns primary client-navigation destination graph hints.
- `LexigoBootstrappedApp` owns dynamic route-entry selection and must not allow stale graph state to override canonical pathname ownership.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/*`; `LexigoLearnApp` owns `/learn`; `LexigoPhrasesApp` owns `/phrases*`.
- `CatalogKindNavigation` + `information-architecture.css` own Materials segmented-control geometry.
- `CalendarReminderRouteEntry` + `calendar-reminder-entry.css` own the single shared route Reminder presentation.

## Documentation owners

- Active task state: `.agents/current/**`.
- Durable delivery evidence after merge: `.agents/PROJECT_STATE.md` in a separate docs-only reconciliation PR.
- Design provenance: `docs/figma/openpencil-screen-map.json` (read-only for this runtime repair).

## Invariants

- Canonical pathname owner wins over stale compatibility graph state.
- `/lesson/*` remains product/Active Lesson ownership; the existing Learn → Active Lesson handoff must not regress.
- Session refresh is not restarted during client route transitions.
- Materials remains two equal compact targets with minimum 48px height and no document x-overflow.
- Reminder remains one shared semantic owner and preserves touch/focus/disclosure behavior.
- Explicit Light/Dark tokens remain `#f4f7f5` / `#10211d` canvas invariants.
- Visual hashes are approved only after manual inspection of the exact Linux artifact generated from the immutable source head.

## Acceptance criteria

- Home → Dictionary first stable render uses the Dictionary island with no compatibility fallback; Dictionary ↔ Phrases does not repair or change outer shell ownership.
- Home → Learn first stable render uses the Learn island and survives Back/Forward/reload without a `product` graph marker.
- At 390×844 both Materials labels remain one line, equal height, inside viewport and stable across Dictionary/Phrases switching.
- Reminder uses semantic surface/text/primary tokens in Light/Dark and stays the same shared owner across routes/history.
- Existing `test:e2e:ui` exercises the new transition contracts in `ios-webkit` as well as Chromium/other projects.
- Transition-derived visual evidence exists for Dictionary/Phrases/Learn in Light/Dark and fails closed as `REVIEW_REQUIRED` until exact artifact review.
- Full immutable-head CI green; clean review audit; expected-head squash merge; exact-main CI and exact-SHA Stage/public validation green because this is runtime-bearing.

## Required checks

- Frontend lint, typecheck, unit, production build and dependency audit.
- Full browser matrix selected by CI, especially UI shards and `ios-webkit` transition behavior.
- Visual regression with exact transition evidence after manual artifact review.
- Accessibility/performance/CSP/service-worker/PWA gates selected by normal full CI.
- Container builds.
- Exact-main full CI and exact-SHA Stage/public validation after merge.

## Risks

- Next.js patches native History state after custom route-graph writes; a narrow hint fix may expose additional stale bootstrap acceptance and require canonicalization in `LexigoBootstrappedApp`.
- Materials font metrics can differ across browser engines; geometry assertions must avoid hiding genuine clipping.
- Reminder token replacement can alter contrast or pointer overlap if geometry is changed accidentally; this slice changes presentation tokens but preserves existing positioning/target contracts.

## Rollback

Revert the #577 runtime merge as one atomic product slice. Do not restore stale visual fingerprints or reintroduce legacy route ownership as a workaround.