# LexiGo Project State

## Verification

- Last verified: 2026-08-11 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Product `main` before this Agent-Docs reconciliation: `81bae6306209437c77c783ee84364072c45a11e5`.
- Latest deployed product SHA: `81bae6306209437c77c783ee84364072c45a11e5`.
- Issue #460 / PR #465 final developer-authored head: `c6a4a661daaba7627f71182151dc9ea4c781e82f`.
- PR #465 immutable-head CI #3181 / run `31444017998`: full required product matrix `success`.
- PR #465 squash product SHA: `81bae6306209437c77c783ee84364072c45a11e5`.
- Exact-SHA `main` CI #3182 / run `31444737036`: full required product matrix `success`, including backend, frontend/browser/accessibility/PWA/performance gates and immutable API/Web container publication.
- Deploy Stage #3025 / run `31445367956`: `success` for exact image SHA `81bae6306209437c77c783ee84364072c45a11e5` after exact CI-scope validation.
- Stage deploy, public frontend/API smoke and public browser smoke are all `success`; 12/12 public desktop Chromium and iOS WebKit tests passed.
- Deployment Issue #12 records image SHA `81bae6306209437c77c783ee84364072c45a11e5` with deploy/public-smoke/public-browser states all `success`.
- Issue #468 / PR #469 delivered the independent shared route-reminder WebKit containment blocker before #465 and was squash-merged as `362fe3efe1f03dc595c123db7e73b7d862b9c12f` after full immutable-head CI #3170 success.
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

- Product runtime and Stage are validated on exact image SHA `81bae6306209437c77c783ee84364072c45a11e5`.
- PR #465 is merged and Issue #460 is delivered/closed with immutable-head, `main`, Stage, public HTTP and public browser evidence.
- Live Issue #66 remains open. Earlier PRs #157/#159 delivered centralized interface-copy/topic mapping and cross-screen terminology; its explicitly remaining acceptance is the final copy review of untouched empty/error/success states and CTA consistency.
- No open PR currently owns Issue #66.
- Issue #18 remains open intentionally because #201 still gates the visual First Use implementation.
- This reconciliation uses branch `docs/issue-460-post-merge-reconcile` and is Agent-Docs-only; its eventual merge may advance repository `main` but must not replace the latest deployed product SHA above.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` are reset to canonical templates by this reconciliation before another product task starts.

## Remaining roadmap

- #66: complete the remaining system copy review and CTA consistency audit using the existing centralized interface-copy contract; preserve course-content English separately from UI chrome.
- #201: supply all missing canonical Figma node IDs before any First Use/onboarding UI implementation.
- #18: after #201 is unblocked, implement and validate the approved first-use UI and close only when the remaining acceptance criteria are evidenced.
- Any product work selected while #201 is blocked must come from live GitHub state, be independently unblocked, and be decomposed into an atomic slice; do not invent design ownership or bypass source-of-truth requirements.
- Production-only/manual deployment gates remain manual where repository policy explicitly requires an authorized workflow dispatch; no synthetic trigger or repository workaround is permitted.

## Reconciliation evidence

- PR #465 final developer head `c6a4a661daaba7627f71182151dc9ea4c781e82f` passed immutable-head CI #3181 / run `31444017998` completely.
- PR #465 was squash-merged to `81bae6306209437c77c783ee84364072c45a11e5` after the final clean merge gate.
- Exact-SHA `main` CI #3182 / run `31444737036` completed `success` and published immutable API/Web images for the same SHA.
- Deploy Stage #3025 / run `31445367956` completed `success` for the same exact SHA; Deployment Issue #12 records deploy/public-smoke/public-browser `success` and 12/12 public browser tests passed.
- This docs-only reconciliation records the completed Issue #460 delivery state and resets stale current task memory. Its merge is documentation-only and must not be treated as a newly deployed product SHA.
