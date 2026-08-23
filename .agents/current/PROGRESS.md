# Current Task Progress

## 2026-08-23 — Issue #651 Stage 4 bounded manual workload

### Verified

- Base `main`: `5196a4b2824820bb3c5105d03112929d9a495da1`; branch remains `behind_by=0`.
- Draft PR: #666, `feat/issue-651-bounded-manual-workload` → `main`.
- Stage 1 (#656), Stage 2 (#662), Stage 3 (#664) and Stage 3 reconciliation (#665) are already delivered; Stage 3 exact runtime SHA `cb0c82fced8e729672e80e8a202456366ead09d4` passed main CI #4046 / run `32642124556` and Stage/public run `32642715936`.
- Stage 4 manual `/learn` choices are now exactly `15 / 30 / 50 / Все`, default `15`.
- Preview/create request vocabulary is exactly `15`, `30`, `50`, `all`; backend validation rejects legacy `60` and arbitrary values with `invalid_lesson_size`.
- `lessonSizeLimit("all")` intentionally maps to the existing no-cap composer path; a 55-item candidate regression proves `50` returns 50 while `all` returns all 55.
- Stage 3 Home automatic Study/Review/Remediation creation remains fixed at `lessonSize: "15"` and never sends `all`.
- OpenAPI contains only the two intended lesson-size enum replacements; unrelated OpenAPI drift was removed.
- Shared frontend `LessonSize` retains historical `60` only as a read-compatible value for already-created active lessons. New `/learn` manual choices do not expose 60 and backend writes reject it.
- Dedicated Active Lesson parsing now preserves new `50` and `all` values while continuing to read historical `60`; this closes the `/learn` → `/lesson/active` downstream boundary.
- Adaptive Lesson Composer E2E records exact preview and create payloads for all four manual tokens.
- Keyboard coverage now proves four-option roving radio behavior `15 → 30 → 50 → Все → 15`.
- True browser-zoom `/learn` fixture and default-size assertion were reconciled from 30 to 15 without weakening its geometry/focus owners.
- Temporary exact-anchor rewrite helpers were used only because the connected Contents API cannot safely patch large files. Both helpers were removed after their bounded replacements; current compare contains zero `.github/workflows/**` diff.

### Diagnostic CI findings and recovery

- CI #4049 / run `32646428769` failed frontend type-check because removing `60` from the shared `LessonSize` union broke existing Active Lesson / compatibility read paths.
- Recovery separated new write vocabulary from historical read compatibility: shared type retains `60`; backend preview/create still reject `60`.
- Diagnostic CI #4052 / run `32646629393` subsequently passed lint, type-check and frontend unit tests before being superseded by later branch writes.
- Acceptance audit then found a second real downstream defect: `LexigoActiveLessonApp.lessonSizeFromAPI` accepted `15`, `60`, `all` but not the newly writable `50`, silently falling back to `30`. The parser now accepts `15`, `50`, `60`, `all` and has a source regression.
- One attempted Contents API update returned HTTP 409 because an incorrect blob SHA was supplied; the file was re-read and the same bounded change succeeded with the current SHA. No repository state was changed by the failed attempt.

### Changed runtime/contract owners

- `api/openapi.yaml`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_size_test.go`
- `backend/internal/learning/lesson_composer_test.go`
- `frontend/lib/learning.ts`
- `frontend/components/lexigo-learn-app.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- focused frontend source/E2E/accessibility/browser-zoom tests
- `.agents/current/**`

### Current branch head

Resolve from live branch ref after the final `EXECUTION.md` update. That developer-authored head is the immutable candidate for full PR CI.

### Next action

Freeze the branch after Agent Harness finalization, require a complete green CI on that exact head, audit PR comments/reviews/threads and final diff, then mark ready and squash-merge with expected-head protection. After merge require exact-main CI plus exact-SHA Stage/public validation before Stage 4 reconciliation.
