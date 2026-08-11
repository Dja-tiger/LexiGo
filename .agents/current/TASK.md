# Current Task

## Identity

- Issue: #66 — [Medium][UX Writing] Унифицировать язык интерфейса и объяснить учебные термины
- Branch: `feat/issue-66-system-copy-review`
- Base SHA: `c675cde343c582349b78c74cb86dc2bd07237fc0`
- Head SHA: resolve from live branch ref
- PR: #471

## Objective

Закрыть оставшийся acceptance scope Issue #66: завершить системный copy review empty/error/success states, устранить расхождения пользовательских CTA и обеспечить единые названия одного и того же lesson source во всех runtime owners без изменения course-content English.

## Scope

- Расширить `frontend/lib/interface-copy.ts` canonical contract для lesson-source labels, system-state eyebrows и повторяющихся системных CTA.
- Перевести динамический Home lesson-source copy на canonical `lessonSourceLabel` owner и защитить существующие Learn/Active Lesson/compatibility labels от повторного drift source-contract тестом.
- Перевести `AsyncStatePanel`/route boundaries на canonical state/action labels без изменения поведения.
- Согласовать 404 CTA с существующим `На главную` contract.
- Добавить unit/source/browser regression evidence, подтверждающий ownership и пользовательский copy contract.
- Синхронизировать существующие route/browser assertions, которые непосредственно потребляют намеренно изменённый 404 CTA contract.
- Обновлять только task-local Agent Harness state вместе с product slice.

## Non-goals

- Не переводить английский course content, примеры, термины внутри учебных карточек или название коллекции `Academic Technical English`, где оно является осознанным названием учебного направления и сопровождается русским описанием.
- Не менять backend/API payloads, source identifiers, query values, navigation semantics, lesson scheduling, auth или persistence.
- Не менять CSS, Figma geometry, визуальные токены или responsive layout.
- Не менять CI/workflows/dependencies.
- Не переписывать крупные Learn/Active Lesson/compatibility route owners только ради устранения уже совпадающих literal labels; их consistency фиксируется fail-closed contract тестом.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/interface-copy.ts`
- `frontend/lib/interface-copy.test.ts`
- `frontend/components/async-state.tsx`
- `frontend/components/lexigo-home-app.tsx`
- `frontend/components/lexigo-learn-app.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/app/error.tsx`
- `frontend/app/global-error.tsx`
- `frontend/app/not-found.tsx`
- `frontend/e2e/interface-copy.spec.ts`
- `frontend/e2e/app-router-routes.spec.ts`
- one focused source-contract test under `frontend/components/` if needed.

## Prohibited paths

- `backend/**`
- `api/**`
- `.github/**`
- dependency manifests/lockfiles
- CSS/design-token files
- Figma/design source files
- deployment configuration
- unrelated product screens

## Runtime owners

- `frontend/lib/interface-copy.ts`: canonical user-visible terminology and labels.
- `frontend/components/async-state.tsx`: canonical presentation shell for loading/empty/error/success resource states.
- `frontend/components/lexigo-home-app.tsx`: dynamic active-lesson source presentation consumes `lessonSourceLabel` directly.
- `frontend/components/lexigo-learn-app.tsx` and `frontend/components/lexigo-active-lesson-app.tsx`: canonical route owners whose existing source labels must remain equal to the shared contract.
- `frontend/components/lexigo-premium-app.tsx`: compatibility fallback; existing source labels remain under the same consistency guard and must not diverge from the primary routes.
- `frontend/app/{error,global-error,not-found}.tsx`: route/root boundary CTA consumers.

## Documentation owners

- `.agents/current/**` only during the task. Durable `.agents/PROJECT_STATE.md` reconciliation is post-merge Agent Docs work and is not part of this product PR.

## Invariants

- Raw lesson source identifiers remain unchanged.
- Course-content English remains content; UI chrome uses canonical labels.
- `Academic Technical English` remains an intentional learning collection title with Russian explanatory copy rather than an unexplained implementation term.
- Existing async-state semantic roles, focus, retry behavior, correlation IDs and resume intent remain unchanged.
- Existing route/navigation behavior remains unchanged; only labels are centralized/normalized.
- No broad DOM text walker or runtime translation layer is introduced.
- Browser tests normalize mocked active-lesson/progressive state before asserting lesson-composer controls; production UX is not changed to satisfy stale fixtures.

## Acceptance criteria

- Dynamic Home active-lesson source presentation resolves through the canonical `lessonSourceLabel` mapping; known Learn/Active Lesson/compatibility labels match that mapping and are guarded against drift.
- Home no longer calls the same source `Путешествия`/`Фразы` while Learn/Active Lesson use `Для путешествий`/`Технические фразы`.
- loading/empty/error/success eyebrow copy is owned by `interface-copy`, and retry/home/continue labels use one canonical action mapping where those generic actions are rendered.
- 404 and root recovery use the same `На главную` label for the same destination.
- No ambiguous standalone `Открыть` CTA is introduced; descriptive `Открыть профиль/прогресс` labels remain allowed where the destination is explicit.
- Existing interface-copy and async-state E2E behavior remains green across the blocking browser matrix.
- Source contract fails closed if Home recreates a local lesson-source label helper or if known Learn/Active/fallback labels drift back to conflicting names.

## Required checks

- frontend lint
- frontend typecheck
- frontend unit/source-contract tests
- production frontend build
- blocking UI Playwright collection including `interface-copy.spec.ts`, `async-states.spec.ts` and route not-found coverage
- accessibility/browser matrix selected by CI
- visual/performance/container gates selected by product scope classifier
- clean review/thread audit on exact final head
- exact-SHA post-merge `main` CI and Stage/public validation

## Risks

- Compatibility fallback may contain duplicate source definitions not currently reached by primary route islands; consistency guard must detect drift without changing its identifiers or behavior.
- String-based resume intent currently recognizes `Продолжить урок`; both producer and consumer must use the same canonical constant.
- Copy changes can invalidate semantic Playwright locators; tests should be updated only when the user-facing contract intentionally changes.
- A page-level active-lesson fixture used for Home can leak into the later Learn assertion unless it is explicitly removed before composer checks.

## Rollback

Revert the product PR. Raw source identifiers, API contracts and persisted data are unchanged, so rollback is code-only.
