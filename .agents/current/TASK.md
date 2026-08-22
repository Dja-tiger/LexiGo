# Current Task

## Identity

- Issue: #651
- Branch: `feat/issue-651-process-aware-home`
- Base SHA: `6d8c8dbc3b25f5fd428c18cb18b151402984ec72`
- Head SHA: resolve from live branch ref
- PR: Draft after the first coherent vertical implementation

## Objective

Roll out the explicit Study / Review / Remediation queue model from backend selectors through lesson preview, authenticated Home recommendation/counts and actual Home lesson creation so that UI copy, backlog counts and created sessions use the same `sessionKind` contract.

## Scope

- Make automatic process ownership mutually exclusive: Study owns new items, Review owns due non-new items, Remediation owns not-due non-new items with persisted weakness/error evidence.
- Expose optional `sessionKind` on `POST /api/v1/lessons/preview`, validate it with the same vocabulary as lesson creation and echo it on explicit previews.
- Keep omitted `sessionKind` preview behavior backward compatible for the manual `/learn` composer.
- Load Study / Review / Remediation previews on authenticated Home and derive honest process backlog counts from `composition.availableWords + composition.availablePhrases`.
- Use automatic block size 15 for all Home process actions.
- Keep one dominant Home recommendation with deterministic priority: active lesson > Review > Remediation > Study > manual configuration fallback.
- Provide explicit secondary controls for every available automatic process so Study and Remediation remain user-selectable even when Review is the recommendation.
- Create Home lessons with the exact selected `sessionKind`, matching study mode and size 15.
- Preserve existing route ownership, active-lesson resume priority, progress evidence, accessibility, responsive layout, reduced motion and manual Learn behavior.

## Non-goals

- Changing scheduler interval/easiness/repetition formulas or introducing FSRS.
- Reworking self-rating persistence or objective correctness semantics delivered by earlier #651 stages.
- Changing manual `/learn` size choices from 15/30/60 to the parent target 15/30/50; bounded manual workload is a later atomic slice.
- Adding automatic `All`, changing catalog/source filters or redesigning the Learn composer.
- Adding analytics/history dashboards or long-term recommendation scoring weights.
- Broad Home redesign, new design tokens, snapshot refresh or unrelated CSS cleanup.
- Closing parent Issue #651.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `api/openapi.yaml`
- `backend/internal/learning/lesson.go`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_session_queues.go`
- `backend/internal/learning/lesson_session_queues_test.go`
- `backend/internal/learning/openapi_session_kind_contract_test.go`
- `backend/integration/lesson_session_queues_test.go`
- `frontend/components/lexigo-home-app.tsx`
- `frontend/app/adaptive-knowledge-coach-home.css`
- `frontend/app/adaptive-knowledge-coach-home.test.ts`
- `frontend/e2e/adaptive-knowledge-coach-home.spec.ts`
- `frontend/e2e/mobile-home-priority.spec.ts` only if the existing Home-priority contract requires synchronized request/copy updates

## Prohibited paths

- migrations and scheduler mutation code outside the allowed learning selector files
- `frontend/components/lexigo-learn-app.tsx` and manual Lesson Composer behavior
- route bootstrap/session/PWA/history owners
- design tokens, OpenPencil files and visual baselines
- workflows, dependencies and deployment configuration
- unrelated tests or compatibility cleanup

## Runtime owners

- Backend process selection: `backend/internal/learning/lesson_session_queues.go`.
- Preview/create HTTP contract: `backend/internal/learning/lesson.go`, `backend/internal/learning/lesson_http.go`.
- Authenticated Home process reads/recommendation/actions: `frontend/components/lexigo-home-app.tsx`.
- Home presentation only: `frontend/app/adaptive-knowledge-coach-home.css`.
- Manual `/learn` remains the legacy custom-composition owner and is not changed in this slice.

## Documentation owners

- OpenAPI: `api/openapi.yaml`.
- Current execution evidence: `.agents/current/**`.
- Durable `PROJECT_STATE` update remains a separate post-merge Agent Docs reconciliation after exact-main and Stage validation.

## Invariants

- Review never contains future `scheduled-not-due` items and never fills to 15 from that population.
- Automatic Remediation never competes with Review for a due item; early pull is allowed only for explicit remediation and only with persisted weakness/error evidence.
- Study contains only new items.
- Omitted `sessionKind` remains backward compatible for existing manual preview/create callers.
- Home recommendation/counts and Home create body must describe the same queue and size.
- Automatic Home block size is 15; an available backlog smaller than 15 produces a smaller block rather than cross-process fill.
- Active backend-owned lesson remains higher priority than creating any new process block.
- Generic `progress.dueNow` may remain visible as progress evidence but is not the source of process-aware Home recommendation/counts.
- No duplicate session bootstrap, API ownership, PWA owner or route graph is introduced.

## Acceptance criteria

- Explicit preview accepts and returns `sessionKind` and rejects an invalid value with `invalid_session_kind`.
- Legacy preview without `sessionKind` keeps current composition semantics and response compatibility.
- A candidate that is due and weak/error-signaled is owned by Review, not automatic Remediation.
- Home obtains independent Study, Review and Remediation available counts from explicit previews.
- Home renders one dominant recommendation and explicit process controls with truthful labels such as `Повторить 15 из N`, `Изучить 15 новых` / `Изучить 15 из N`, and `Разобрать N ошибок`.
- Clicking any automatic Home process creates a lesson with the corresponding explicit `sessionKind`, compatible `studyMode` and `lessonSize: "15"`.
- When Review backlog exceeds 15, Home says `15 из N` and creates 15; it never expands automatically to 30/60.
- When Review is empty but Remediation exists, Remediation is recommended; when both are empty and Study exists, Study is recommended.
- Existing active-lesson resume, progress navigation, compact/mobile layout, 200% reflow, reduced motion and accessibility contracts remain green.

## Required checks

- Backend formatting/static/unit/race/security.
- Backend real PostgreSQL integration for explicit process preview/ownership and strict Review no-fill.
- Full OpenAPI YAML structural validation and session-kind source contract.
- Frontend lint/typecheck/unit/source contracts.
- Targeted Home Playwright in desktop Chromium, Android Chromium and iOS WebKit, including request-body assertions, no horizontal overflow, touch/focus targets and reduced motion.
- Full immutable-head CI including both UI shards, visual regression without baseline updates, accessibility, performance, CSP/service-worker and container builds.
- Clean PR comments/reviews/threads and expected-head squash merge.
- Exact-main CI plus Stage/public smoke/browser verification on the runtime merge SHA.

## Risks

- Preview mock drift could make UI counts differ from actual create semantics; fixtures must echo exact `sessionKind` request state.
- Adding secondary process actions can create compact reflow/touch-target regressions; use existing button tokens and verify 320/390 widths plus 200% text.
- Server preview and create could diverge if validation/selector paths differ; both must use the same `queryLessonCandidatesForSession` owner.
- Due+weak candidates currently qualify for both Review and Remediation; the selector ownership correction must be protected by unit and real PostgreSQL evidence.

## Rollback

Revert this atomic PR. Because `sessionKind` remains additive and omission preserves the legacy path, rollback returns Home/preview to the previous staged behavior without schema migration or scheduler data rollback.
