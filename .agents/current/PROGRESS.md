# Current Task Progress

## 2026-07-26 13:28 Europe/Berlin

### Verified

- Live `main` is `72291d9351f3c565d13be7b3f9e9055258f98ac6`; stage run `30198806876` deploys that exact SHA and reports successful deploy, public smoke and 12/12 public Chromium/iOS WebKit checks.
- No product PR was open before this slice. Issue #198 is the next verified roadmap item after completed Dictionary catalog Issue #197.
- Branch `feat/issue-198-word-detail` was created from the exact live `main`; Draft PR #235 was opened before runtime writes.
- Approved Figma sources are Mobile Dark `78:99` and Desktop Dark `78:274`; Light must derive from Foundation V1 tokens and receive separate Linux evidence.
- `/words/[id]` is already a canonical App Router path. The route is selected by `LexigoBootstrappedApp` into the existing Dictionary client island.
- Authenticated `GET /api/v1/words/{wordID}` returns the user-scoped word plus authoritative `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` and optional `lastReviewedAt` fields.
- Authenticated bounded phrase search can provide related phrases while preserving server order. The repository has no personal-note mutation contract; catalog `note` is contextual learning copy, not user-authored data.
- The Lesson API accepts one to sixty exact unique `wordIds`; a one-word detail CTA can therefore create a lesson with exactly the selected word without backend changes.
- `SpeechPlayerButton` already owns browser speech loading, playing, unsupported and error feedback and leaves the text path available.

### Finding

- The previous Word Detail was rendered inline by `DictionaryCatalog`, depended on either the current catalog page or a compatibility fetch and used a topic-wide Lesson Composer action.
- Direct detail shared catalog metadata/progress/page effects and therefore did not have an independently bounded request graph.
- The frontend base learning-item validator discarded scheduler fields already returned by the backend.
- Figma contains a representative retention percentage and personal-note affordance that have no matching production contracts. They must not be reproduced as invented data or persistence.

### Root cause

- Word Detail remained inside the legacy catalog presentation owner while App Router routing and the backend detail endpoint had already become canonical.
- Issue #197 intentionally protected the old detail surface with a compatibility stylesheet rather than redesigning it, leaving route ownership and presentation ownership coupled until Issue #198.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/lib/word-detail.ts`
- `frontend/lib/word-detail.test.ts`
- `frontend/components/word-detail-route.tsx`
- `frontend/components/word-detail-presentation.tsx`
- `frontend/components/dictionary-catalog.tsx`
- `frontend/components/lexigo-dictionary-app.tsx`
- `frontend/app/word-detail.css`
- `frontend/app/dictionary-detail-compatibility.css`
- `frontend/app/layout.tsx`

### Checks passed

- Repository/harness/main/stage/Issue/PR pre-flight.
- Exact Figma design-context and variable inspection for both approved Word Detail nodes.
- Backend detail, phrase-search and lesson-create ownership inspection.
- Explicit branch-scoped write/read-back discipline for the task contract and implementation files.
- Related phrase buttons retain native button semantics inside a semantic list.
- Strict detail validator rejects malformed scheduler payloads and unsupported statuses by source inspection; automated unit execution is pending CI.

### Checks failed

- No product assertion has failed on the current checkpoint yet.
- A source review found `--ak-color-on-primary` is not a Foundation V1 token. This must be replaced by a route-local Light/Dark token before visual calibration.

### Current branch head

- `9b0ea79d577e2835e4f74d6f416dfa30afd4ead9` before this documentation update.
- CI #1927 / run `30200185474` is pending for that implementation head.

### Next action

Inspect the first CI checkpoint and correct only objective lint/type/unit/source-contract failures. Then add focused direct-entry/history/PWA/accessibility/browser ownership tests, replace the missing on-primary token, measure the cold route and collect Linux Light/Dark visual actuals for manual review before baseline promotion.
