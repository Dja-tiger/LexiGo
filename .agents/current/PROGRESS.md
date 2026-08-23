# Current Task Progress

## 2026-08-23 — Issue #651 Stage 4 bounded manual workload

### Verified

- Base `main`: `5196a4b2824820bb3c5105d03112929d9a495da1`; live recheck before reconciliation confirmed PR #666 remained based on this exact SHA and required no rebase.
- Draft PR: #666, `feat/issue-651-bounded-manual-workload` → `main`.
- Stage 1 (#656), Stage 2 (#662), Stage 3 (#664) and Stage 3 reconciliation (#665) are already delivered; Stage 3 exact runtime SHA `cb0c82fced8e729672e80e8a202456366ead09d4` passed main CI #4046 / run `32642124556` and Stage/public run `32642715936`.
- Stage 4 manual `/learn` choices are now exactly `15 / 30 / 50 / Все`, default `15`.
- Preview/create request vocabulary is exactly `15`, `30`, `50`, `all`; backend validation rejects legacy `60` and arbitrary values with `invalid_lesson_size`.
- `lessonSizeLimit("all")` intentionally maps to the existing no-cap composer path; a 55-item candidate regression proves `50` returns 50 while `all` returns all 55.
- Stage 3 Home automatic Study/Review/Remediation creation remains fixed at `lessonSize: "15"` and never sends `all`.
- OpenAPI contains only the intended lesson-size vocabulary changes; unrelated OpenAPI drift was removed.
- Shared frontend `LessonSize` retains historical `60` only as a read-compatible value for already-created active lessons. New `/learn` manual choices do not expose 60 and backend writes reject it.
- Dedicated Active Lesson parsing preserves new `50` and `all` values while continuing to read historical `60`; this closes the `/learn` → `/lesson/active` downstream boundary.
- Adaptive Lesson Composer E2E records exact preview and create payloads for all four manual tokens.
- Keyboard coverage proves four-option roving radio behavior `15 → 30 → 50 → Все → 15`.
- True browser-zoom `/learn` fixture and default-size assertion were reconciled from 30 to 15 without weakening geometry/focus owners.
- The two `.lx-size-control` responsive declarations use four equal columns, eliminating the deterministic orphan `Все` row from the initial four-option implementation.
- Current PR inventory after deleting the temporary reconciliation workflow contains zero `.github/workflows/**` paths.

### Diagnostic CI findings and recovery

- CI #4049 / run `32646428769` failed frontend type-check because removing `60` from the shared `LessonSize` union broke existing Active Lesson / compatibility read paths.
- Recovery separated new write vocabulary from historical read compatibility: shared type retains `60`; backend preview/create still reject `60`.
- Diagnostic CI #4052 / run `32646629393` subsequently passed lint, type-check and frontend unit tests before being superseded by later branch writes.
- Acceptance audit found `LexigoActiveLessonApp.lessonSizeFromAPI` accepted `15`, `60`, `all` but not newly writable `50`, silently falling back to `30`. The parser now accepts `15`, `50`, `60`, `all` and has a source regression.
- CI #4064 / run `32647075755` exposed a real product-layout regression after adding the fourth manual choice: `15 / 30 / 50` rendered on row one and `Все` alone on row two, adding 56 px at tablet/desktop sizes. Baseline refresh was rejected until runtime CSS was repaired.
- After both size-control grids were changed to four columns, exact Linux CI #4069 / run `32648333357` on head `c4d52f51f944ba0d29c52e0707425ed2473e0267` proved the reviewed `/learn` dimensions returned to the pre-regression geometry.
- Visual Regression #4069 supplied 15 intentional `/learn` fingerprints across route-tablet, route-transition, visual-regression, Issue #603 browser-zoom and route-browser-zoom owners. Only those hashes/provenance were refreshed.
- UI shard 2 artifact `frontend-playwright-report-ui-2` from the same run proved the remaining failures were two Issue #583 `/learn` fingerprints at unchanged `430×1575`: light `b735c5e48f5aaa4a364d7a7b16b48ef168088b4f4ebc904298dba3aa0b5ba2cf` and dark `737339c0b6395780f25516be3320c3dd478ef9c49718a87010725f071e838825`.
- Source inspection proved the previously suspected second 3→4 assertion in Issue #603 did not exist; Issue #603 already expected `96px 96px 96px 96px`. The only stale column-count assertion was `frontend/e2e/learn-browser-zoom.spec.ts`, updated from 3 to 4.
- `.agents/current/TASK.md` was amended before mutation to authorize exactly the 17 reviewed hash/provenance updates plus the single 3→4 assertion.
- Temporary helper run `32669295151` succeeded fail-closed and produced test-only commit `a4cc0a8d102e22ff4e2ec3f26b197dd7c3240ab8`; its exact changed-path guard allowed only seven authorized E2E owners.
- The helper was immediately deleted by commit `202c4d01e5cb0d11bc29dac7873d8622073e6cf3`. CI #4074 was triggered on the helper-containing intermediate head and is diagnostic only, never merge evidence.

### Changed runtime/contract owners

- `api/openapi.yaml`
- `backend/internal/learning/lesson_http.go`
- `backend/internal/learning/lesson_composer.go`
- `backend/internal/learning/lesson_size_test.go`
- `backend/internal/learning/lesson_composer_test.go`
- `frontend/lib/learning.ts`
- `frontend/components/lexigo-learn-app.tsx`
- `frontend/components/lexigo-active-lesson-app.tsx`
- `frontend/app/adaptive-lesson-composer.css`
- focused frontend source/E2E/accessibility/browser-zoom/visual tests
- `.agents/current/**`

### Current branch head

Resolve from live branch ref after the final `EXECUTION.md` write. That developer-authored head is the immutable candidate for full PR CI.

### Next action

Freeze the branch after the final Agent Harness write, require a complete green CI on that exact head, audit PR comments/reviews/threads and final diff, then mark ready and squash-merge with expected-head protection. After merge require exact-main CI plus exact-SHA Stage/public validation before Stage 4 reconciliation.
