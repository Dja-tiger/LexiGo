# LexiGo Project State

## Verification

- Last verified: 2026-08-10 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product `main` before this reconciliation: `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.
- Latest deployed product SHA: `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.
- Issue #18 Phase 1: PR #462, final developer-authored head `12d37443cd96aa465acd71044b096488918a6e3b`, squash product SHA `edcfd3dbee62a4dba253df07d984fa326350c984`.
- Issue #18 Phase 2: PR #463, final developer-authored head `246c8943d08151b2ff2428bee6580346da1c1e3b`, squash product SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.
- PR #463 immutable-head CI #3154 / run `31345340693`: full required product matrix `success`.
- Exact-SHA `main` CI #3155 / run `31345862698`: full required product matrix `success`, including backend unit/race/integration/security, frontend/browser/PWA/performance gates, frontend aggregate and immutable API/Web container publication.
- Deploy Stage #2998 / run `31346356268`: `success` for exact SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6` after exact CI-scope validation.
- Stage deploy, public frontend/API smoke and public browser smoke are all `success`; 12/12 public desktop Chromium and iOS WebKit tests passed.
- Deployment Issue #12 records image SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6` with deploy/public-smoke/public-browser states all `success`.
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

## Current state

- Product runtime and Stage are validated on exact image SHA `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.
- PR #463 is merged and its Phase 2 delivery receipt is recorded in Issue #18.
- Issue #18 remains open intentionally because #201 still gates the visual First Use implementation.
- Issue #74 is closed and is no longer the active product task.
- This reconciliation uses branch `docs/issue-18-diagnostic-onboarding-reconcile` and is Agent-Docs-only; its eventual merge may advance repository `main` but must not replace the latest deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset to canonical templates by this reconciliation before another product task starts.

## Remaining roadmap

- #201: supply all missing canonical Figma node IDs before any First Use/onboarding UI implementation.
- #18: after #201 is unblocked, implement and validate the approved first-use UI and close only when the remaining acceptance criteria are evidenced.
- Any product work selected while #201 is blocked must come from live GitHub state, be independently unblocked, and be decomposed into an atomic slice; do not invent design ownership or bypass source-of-truth requirements.
- Production-only/manual deployment gates remain manual where repository policy explicitly requires an authorized workflow dispatch; no synthetic trigger or repository workaround is permitted.

## Reconciliation evidence

- Phase 1 PR #462 merged to `edcfd3dbee62a4dba253df07d984fa326350c984` and established the adaptive lesson queue foundation.
- Phase 2 PR #463 immutable-head CI #3154 / run `31345340693` passed on exact developer head `246c8943d08151b2ff2428bee6580346da1c1e3b`.
- PR #463 had no submitted reviews or unresolved inline review threads at the final merge gate and was squash-merged with expected-head protection to `8b3fac45d91fa3bb0318d93635ef77896af2b6f6`.
- Exact-SHA `main` CI #3155 / run `31345862698` completed `success` and published immutable API/Web images for the same SHA.
- Deploy Stage #2998 / run `31346356268` completed `success` for the same exact SHA; Deployment Issue #12 records deploy/public-smoke/public-browser `success` and 12/12 public browser tests passed.
- This docs-only reconciliation records delivery state and resets current task state. Its merge is documentation-only and must not be treated as a newly deployed product SHA.
