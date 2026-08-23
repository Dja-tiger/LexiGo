# Current Task

## Identity

- Issue: #651 — Stage 5 process-preserving post-block continuation
- Branch: `feat/issue-651-process-continuation`
- Base SHA: `c590aa185e9e73354d8ca9fc23f46aba3ce77ec7`
- Head SHA: resolve from live branch ref after each write
- PR: #669 (Draft)

## Objective

Preserve the explicit Study/Review/Remediation process across Active Lesson completion and the next-block action, and make the due continuation bounded to the same 15-item automatic workload contract instead of falling back to legacy mixed/30 behavior.

## Scope

- carry optional `sessionKind` from the active lesson payload into the persisted Lesson Result snapshot;
- preserve that `sessionKind` in the post-result preview request and next lesson creation;
- keep omitted `sessionKind` omitted for legacy/manual `/learn` sessions;
- change the dedicated due-review continuation to an explicit `review` session with `lessonSize: "15"`;
- present a bounded due CTA: at most 15 items in the next block while keeping the total due backlog visible;
- add source/unit/E2E regression coverage for exact request bodies and restored-result compatibility.

## Non-goals

- no scheduler formula or priority changes;
- no backend queue selector changes;
- no Home recommendation changes;
- no manual `/learn` workload changes from Stage 4;
- no database migration;
- no OpenAPI changes unless implementation proves the existing contract insufficient;
- no design-system, dependency, PWA or unrelated visual-baseline changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/lesson-result.ts`
- `frontend/lib/lesson-result.test.ts`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/components/lesson-result-presentation.tsx`
- `frontend/e2e/next-lesson-progression.spec.ts`
- `frontend/e2e/lesson-result.spec.ts`
- `frontend/e2e/support/lesson-result-fixture.ts`
- additional narrowly scoped frontend source-contract test only if required by current repository ownership
- temporary helper only: `.github/workflows/temporary-issue-651-stage5-exact-rewrite.yml`; it must be deleted before any final candidate CI and final PR diff must contain zero `.github/workflows/**` paths.

## Prohibited paths

- all `.github/workflows/**` except the exact temporary helper above during bounded rewrite lifecycle
- backend runtime/selectors/scheduler
- `api/openapi.yaml`
- migrations
- dependencies/lockfiles
- Home runtime
- Stage/deployment configuration
- unrelated visual baselines

## Runtime owners

- active process intent: backend `LessonSession.sessionKind` (already delivered) → `LexigoActiveLessonApp`;
- persisted completion state and continuation: `frontend/lib/lesson-result.ts`;
- result action execution: `frontend/components/lexigo-active-lesson-app.tsx`;
- result CTA copy: `frontend/components/lesson-result-presentation.tsx`.

## Documentation owners

- `.agents/current/**` during implementation;
- `.agents/PROJECT_STATE.md` only in the separate post-merge reconciliation PR.

## Invariants

- automatic Home-created Study/Review/Remediation sessions remain 15-item blocks;
- manual sessions with omitted `sessionKind` remain backward-compatible and do not fabricate process intent;
- historical persisted Lesson Result snapshots without `sessionKind` remain readable;
- due continuation never creates `30`, `50` or `all` automatically;
- next-block creation preserves exact explicit `sessionKind` when present;
- review queue selection remains server-owned and never pads scheduled-not-due items;
- no persistent workflow changes.

## Acceptance criteria

- an active lesson with `sessionKind="study"|"review"|"remediation"` produces a result snapshot carrying the same explicit kind;
- result preview repeats that explicit kind; legacy/manual snapshots omit it;
- pressing the normal next-block action creates the next lesson with the same explicit kind and the prior bounded lesson size;
- pressing the due-review action creates `{sessionKind:"review", lessonSize:"15"}` and never legacy 30;
- when due backlog exceeds 15, the CTA exposes both the 15-item next block and the total backlog rather than implying the user must complete all due items;
- restored historical result snapshots without `sessionKind` remain valid;
- full immutable-head PR CI passes with zero workflow drift.

## Required checks

- focused `lesson-result` unit/source contracts;
- focused Playwright `lesson-result.spec.ts` and `next-lesson-progression.spec.ts` on owned browser projects;
- frontend lint/type/unit/build;
- full immutable-head PR CI including both UI shards, visual, accessibility, performance, security and container gates before Ready/merge;
- final review/thread/diff audit and `behind_by=0`;
- exact-main CI plus exact-SHA Stage/public validation after runtime merge.

## Exact-rewrite helper contract

The connected GitHub Contents action replaces complete UTF-8 files and provides no inline patch operation. For the large Active Lesson/Result presentation owners, a one-shot helper is allowed only because whole-file manual reconstruction would be less safe.

- helper trigger: PR sync only;
- expected parent/head guard must match the exact branch SHA immediately before helper creation;
- every source anchor must occur exactly once before replacement and exactly once in its new form after replacement;
- changed-path allowlist is limited to the Stage 5 runtime/test paths named above plus the helper itself;
- helper bot commit is diagnostic/intermediate only and cannot serve as final merge evidence;
- delete helper immediately after successful rewrite;
- require zero workflow diff before final immutable-head CI.

## Risks

- changing persisted result shape can invalidate old sessionStorage snapshots if validation is made mandatory instead of optional;
- process intent can still be lost if only preview or only create is updated;
- due CTA copy may affect an existing result visual fingerprint and must be classified from Linux evidence rather than blindly refreshed;
- the existing `startLesson` helper is shared by normal-next and due-next actions, so optional process intent must be explicit at the call boundary.
- a rejected `create_file` call was accidentally sent to deliberately nonexistent branch `__invalid__` before branch creation. GitHub returned 404; `main` remained exact `c590aa185e9e73354d8ca9fc23f46aba3ce77ec7` and `__invalid__` is absent. Recovery followed `.agents/AGENTS.tool-selection.md`: writes stopped, `main`/target were rechecked, the exact `create_branch` schema was reloaded, and the real branch was created from the verified SHA.

## Rollback

Revert the Stage 5 squash merge. Backend/session data are unchanged, so rollback restores the previous client-only continuation behavior without schema migration.
