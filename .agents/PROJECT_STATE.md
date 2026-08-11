# LexiGo Project State

## Verification

- Last verified: 2026-08-11 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product `main` before this Agent-Docs reconciliation: `d480128eceba90bcb43c83ad7cd20fb74bef0391`.
- Latest deployed product SHA: `d480128eceba90bcb43c83ad7cd20fb74bef0391`.
- Issue #71 / PR #473 final developer-authored head: `fb4a8a3dbe0b84e982c2b16919843d79990ec888`.
- PR #473 immutable-head CI #3219 / run `31515122288`: full required product matrix `success`.
- PR #473 squash product SHA: `d480128eceba90bcb43c83ad7cd20fb74bef0391`.
- Exact-SHA `main` CI #3220 / run `31516166935`: `success`, including backend unit/race/integration/security, frontend core, both blocking UI shards, accessibility, visual, PWA/service-worker, performance and immutable API/Web container publication.
- Deploy Stage #3063 / run `31517113649`: `success` for exact image SHA `d480128eceba90bcb43c83ad7cd20fb74bef0391` after exact CI-scope artifact validation.
- Stage deploy and public frontend/API smoke are `success`; public browser validation is `success` with 12/12 tests across desktop Chromium and iOS WebKit.
- Deployment Issue #12 records image SHA `d480128eceba90bcb43c83ad7cd20fb74bef0391`, run `31517113649`, deploy/public-smoke/public-browser states all `success`, healthy exact-SHA API/Web containers and report-only CSP smoke.
- Issue #66 / PR #471 remains delivered as squash SHA `28c1a220a3a162e64248bbf31acd561ce20ed092`; its immutable-head CI, exact-SHA `main` CI and Stage evidence remain historical acceptance evidence.
- Issue #460 / PR #465 remains delivered as squash SHA `81bae6306209437c77c783ee84364072c45a11e5`; its accessibility evidence remains historical acceptance evidence.
- Issue #468 / PR #469 delivered the independent shared route-reminder WebKit containment blocker as squash SHA `362fe3efe1f03dc595c123db7e73b7d862b9c12f`.
- Issue #18 Phase 1: PR #462, squash product SHA `edcfd3dbee62a4dba253df07d984fa326350c984`.
- Issue #18 Phase 2: PR #463, squash product SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.
- Issue #74 is completed/closed. Its detailed historical delivery evidence remains available in Git history and dedicated `.agents/AGENTS.issue-74-*` lessons.

## Delivery contract

- Product and mixed changes require backend unit/race/integration/security plus frontend lint, typecheck, unit, production build, browser matrix, accessibility, visual, performance and container gates according to changed scope.
- Product delivery requires immutable-head PR CI, clean review/thread audit, expected-head squash merge, exact-SHA `main` CI and exact-image Stage/public validation.
- A green workflow proves only tests actually selected by its effective command/configuration; uncollected source is not acceptance evidence.
- Exact deployment claims require immutable image tags, exact CI-scope validation, healthy services, public endpoint smoke and public browser evidence.
- Pure Agent Docs changes use the fail-closed lightweight classifier and must not deploy Stage.
- One PR contains one atomic slice; product work must not continue through stale Agent Harness state.
- GitHub-hosted/browser setup failures, nondeterministic browser interactions and classified deployment races are infrastructure/test-stability evidence only; a rerun counts only when the exact workflow/product SHA remains unchanged and all required validation later succeeds.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile, Scenario Catalog and Scenario Detail use dedicated canonical route-island owners.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad compatibility deletion remains prohibited without exact reachability, fallback-exclusive bundle and browser evidence.
- Issue #70 is completed/closed; application entry, compatibility reachability, shared style ownership and architecture contracts remain fail-closed.
- Issue #75 is completed/closed; authenticated PostgreSQL phrase search and URL/filter/history/scroll ownership remain fail-closed.
- Profile painted presentation remains owned by `profile.css`; Issue #460 adds an interaction-only effective-target owner plus compact account text containment without changing Profile business semantics or approved painted geometry.
- Shared route-reminder closed-state WebKit containment remains owned independently by the Issue #468 / PR #469 implementation and must not be copied into Profile-specific code.
- `frontend/lib/interface-copy.ts` is the canonical owner for shared user-facing learning terminology, lesson-source labels, generic system-state eyebrows and repeated generic recovery/navigation actions introduced or consolidated by Issue #66.
- `frontend/lib/feedback.ts` plus the root `FeedbackCenter` own shared feedback state, typed presentation policy, FIFO transient queueing and timer behavior introduced by Issue #71.
- `AccessibleDialog` remains the sole portal/focus/modal-isolation primitive; shared feedback is rendered declaratively through the active dialog feedback host rather than creating a second portal owner.

## Issue #71 delivered feedback contract

- Issue #71 is completed/closed through PR #473.
- Shared feedback has one persistent root state owner; transient `error`, `success` and `info` messages are polite, dismissible, text-duration-bounded and FIFO queued rather than overwritten.
- `blocking-error` feedback is persistent/assertive and is never removed by an auto-dismiss timer.
- Transient expiry pauses while the active feedback is hovered or keyboard-focused; dismiss/expiry advances exactly one queued item.
- When an `AccessibleDialog` is active, the shared feedback layer is rendered inside that dialog's existing accessibility boundary while queue/timer state remains owned by the root feedback center.
- No second `createPortal`, imperative DOM host, MutationObserver or delegated document-interaction owner was introduced.
- Route announcements, async content states, review-outbox connectivity, form validation, focused-lesson exit guidance and contextual operational speech state remain separate semantic owners.
- Calendar contextual status remains directly testable as `.lx-calendar-status[aria-live="off"]`; the shared feedback layer is the polite live owner for migrated calendar feedback, avoiding duplicate announcements without positional locators.
- Account/session success, non-blocking speech error feedback and calendar action feedback use the shared owner only where the event is genuinely global/user-action feedback; success copy remains bounded by what the client can actually confirm.
- Compact feedback presentation accounts for safe-area insets and persistent bottom navigation; browser acceptance covers Chromium/WebKit/Android/iOS collections without timeout inflation, browser skips or visual-baseline changes.

## Issue #66 delivered interface-copy contract

- Issue #66 is completed/closed through PR #471.
- Dynamic Home active-lesson source presentation resolves through the shared `lessonSourceLabel` contract; known Learn, Active Lesson and compatibility labels are guarded against drift.
- Generic loading/empty/error/success state labels and repeated retry/home/continue actions resolve through the shared interface-copy owner where the same user intent is rendered.
- 404 and root recovery use the same `На главную` action for the same destination; stale `Открыть главную` regression consumers were updated rather than reintroducing duplicate runtime copy.
- Course-content English remains content and was not translated by the UI-copy cleanup; intentional learning collection names such as `Academic Technical English` remain allowed when accompanied by explanatory UI copy.
- Browser acceptance explicitly normalizes active-lesson/progressive composer state before asserting controls. Desktop may expose composer controls immediately, while compact/mobile presentation may require the explicit `Настроить урок` action; tests support both without weakening selectors, increasing timeouts or changing production UX.
- Source-contract and browser coverage fail closed on recreating route-local Home lesson-source ownership, known source-label divergence and generic interface-copy regressions.

## Issue #18 delivered foundation

### Phase 1 — adaptive lesson queue

- Server-owned adaptive ranking prioritizes `recent_failure`, then ordinary due items, while preserving weak-topic/new/scheduled behavior and deterministic selection.
- Optional `reviewRatio` is persisted and enforced when inventory permits, with bounded fallback when one side is undersupplied.
- Avoidable long same-topic/same-POS streaks are prevented without discarding higher-priority work.
- `selection_reason` is persisted and rehydrated for `new`, `due`, `weak_topic`, `recent_failure` and manual selections instead of being recomputed from mutable learner state.
- Explicit manual `wordIds` preserve caller order and remain marked `manual`.

### Phase 2 — diagnostic onboarding backend

- Server-owned onboarding states: `not_started`, `in_progress`, `completed`, `skipped`.
- API contract provides onboarding status, start, sequential self-mark, complete and skip operations.
- Diagnostic selection is deterministic and bounded to at most 12 items, with phrase, technical-topic and noun/verb/adjective representation when available in user inventory.
- The prompt does not expose translation before the learner records `known`, `unsure` or `new`.
- Marks are persisted sequentially before reveal; completion is rejected until every selected item is marked.
- Completion initializes only `user_words` rows still in `new` state, preserving existing learned scheduler state and avoiding synthetic review events.
- `known` starts in bounded review state; `unsure` starts in learning; `new` remains unchanged. Skip does not mutate scheduler state.
- Per-user transaction/advisory locking protects start/mark/complete/skip concurrency.
- Unit contracts cover deterministic/bounded selection, representative coverage, mark vocabulary and initialization policy.

## Issue #18 remaining work

- Issue #18 remains open; the backend personalization/diagnostic foundation is delivered but the first-use product flow is not yet complete.
- Visual First Use/onboarding implementation is owned by Issue #201.
- Issue #201 explicitly requires canonical Figma node IDs for Guest Home mobile/desktop, onboarding desktop, diagnostic question states, skip/continue, loading/error/recovery and Light/Dark variants before implementation code begins.
- Until those IDs are present in #201 and the Screen Map, no speculative First Use UI implementation is permitted.
- After the Figma gate is cleared, the remaining acceptance must prove onboarding duration/skip behavior, pre-answer self-mark UX, resume/recovery, mobile/desktop, Light/Dark, keyboard/screen-reader and visual-regression behavior against the approved design source of truth.

## Issue #460 delivered accessibility contract

- Profile secondary buttons and goal/appearance choices expose at least 44 x 44 CSS px effective targets for fine pointers and 48 x 48 CSS px for coarse pointers while preserving painted geometry.
- Real ownership is protected with four-sided `document.elementFromPoint` evidence and non-overlap assertions across desktop Chromium, Android Chromium and iOS WebKit.
- Compact 320px / 200% reflow remains page-level fail-closed acceptance; confirmed account CTA and dynamic email-bearing copy wrap at their canonical `account-security.css` owner rather than using clipping, ellipsis or font reduction.
- The independent shared mobile-navigation and route-reminder overflow blockers were isolated into their own Issues/PRs instead of broadening the Profile PR.
- Forced-colors behavior, blocking UI/a11y collection and source ownership/import contracts are part of the permanent regression surface.

## Current state

- Product runtime and Stage are validated on exact image SHA `d480128eceba90bcb43c83ad7cd20fb74bef0391`.
- PR #473 is merged and Issue #71 is delivered/closed with immutable-head PR CI, exact-SHA `main` CI, Stage deployment, public HTTP smoke and 12/12 public browser evidence.
- Issue #18 remains open intentionally because #201 still gates the visual First Use implementation.
- This reconciliation uses branch `docs/issue-71-post-merge-reconcile` and is Agent-Docs-only; its eventual merge may advance repository `main` but must not replace the latest deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset to canonical templates by this reconciliation before another product task starts.
- No next product issue is pre-owned by the Agent Harness after this reset; selection must use current GitHub state and respect dependency/design/manual-device gates.

## Remaining roadmap

- #201: supply all missing canonical Figma node IDs before any First Use/onboarding UI implementation.
- #18: after #201 is unblocked, implement and validate the approved first-use UI and close only when the remaining acceptance criteria are evidenced.
- #78: security implementation and report-only Stage observation are delivered; the remaining acceptance is the explicitly manual/authorized production enforcement promotion and must not be synthesized by an autonomous repository workaround.
- While #201 is blocked, the next product slice must be selected from live open GitHub issues, be independently unblocked and remain atomic; do not invent design ownership or bypass source-of-truth requirements.
- Physical-device-only acceptance (including remaining real-device checks owned by issues such as #65/#461) must remain explicitly manual and must not be represented as autonomous browser evidence.
- Production-only/manual deployment gates remain manual where repository policy explicitly requires an authorized workflow dispatch; no synthetic trigger or repository workaround is permitted.

## Reconciliation evidence

- PR #473 final developer head `fb4a8a3dbe0b84e982c2b16919843d79990ec888` passed immutable-head CI #3219 / run `31515122288` completely after the feedback/modal and semantic-status locator repairs.
- PR #473 was squash-merged to product SHA `d480128eceba90bcb43c83ad7cd20fb74bef0391`; Issue #71 auto-closed as completed through `Closes #71`.
- Exact-SHA `main` CI #3220 / run `31516166935` completed `success` and published immutable API/Web images for the same SHA.
- Deploy Stage #3063 / run `31517113649` completed `success` for the same exact SHA after exact CI-scope validation.
- Deployment Issue #12 records deploy/public-smoke/public-browser `success`; Stage ran healthy exact-SHA API/Web containers and 12/12 public browser tests passed across desktop Chromium and iOS WebKit.
- Stage public smoke confirms CSP remains in the intended `report-only` mode; this does not satisfy the separate manual production-enforcement gate in Issue #78.
- This docs-only reconciliation records the completed Issue #71 delivery state and resets stale current-task memory. Its merge is documentation-only and must not be treated as a newly deployed product SHA.
