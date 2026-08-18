# Current Task Progress

## 2026-08-18 13:33 +03:00

### Verified

- Live base is `main@f1cfa074ffe25db6e253b60b6b3c5970ba8dda03`; no pre-existing #593 branch/PR existed.
- `appearance-preference.ts` already resolves Auto correctly and updates `data-lexigo-resolved-appearance` at bootstrap and on media-query changes.
- `appearance.css` now keeps explicit token overrides on `data-lexigo-appearance`, but applies document canvas/form presentation from `data-lexigo-resolved-appearance`.
- The existing Profile account/security compatibility palette is mirrored in the existing `appearance.css` theme owner under resolved Light, without modifying `profile.css` or account APIs.
- Profile dark-only avatar/primary-button compatibility selectors now follow resolved Dark.
- New source ownership contract verifies preference-vs-resolved separation and blocking UI routing.
- New `profile-auto-theme.spec.ts` runs only in `ios-webkit` at 430×932 and checks direct entry, reload, Home→Profile navigation, Back/Forward, live system Light↔Dark changes, computed `html/body` canvas, semantic tokens, account/security paint and horizontal overflow.
- The new Light screenshot remains intentionally fail-closed as `REVIEW_REQUIRED` until exact Linux WebKit evidence is manually reviewed.
- `test:e2e:ui` includes the new regression exactly once; no workflow edit is required.
- Current diff is exactly seven allow-listed files and was `behind_by=0` before Draft PR creation.
- Draft PR #597 is open.
- Diagnostic CI #3788 / run `32126854471` on head `12167469ab50d834cfc88139d0bef255cbbacd74` passed lint and typecheck, then failed one new source-contract assertion before browser jobs could run.
- The failing source assertion expected literal `colorScheme: "light"|"dark"` text even though the E2E intentionally routes those values through `setSystemAppearance(page, "light"|"dark")` and the helper calls `page.emulateMedia({ colorScheme, reducedMotion: "reduce" })`.
- The source contract was corrected to assert the helper invocations plus the `emulateMedia` bridge; no product CSS/runtime behavior changed for this CI repair.

### Finding

The first diagnostic red was a self-test implementation error, not a theme regression. Product ownership remains isolated to the resolved-appearance CSS repair; authoritative WebKit evidence has not yet been produced because Frontend core correctly blocked downstream jobs.

### Root cause

Product root cause: rendered presentation consumed the stored preference attribute on document/Profile compatibility owners even though Auto requires the resolved appearance attribute.

Diagnostic-test root cause: the source contract asserted an implementation literal that does not exist when system appearance is routed through a typed helper.

### Changed files

- `frontend/app/appearance.css`
- `frontend/components/profile-theme-ownership.test.ts`
- `frontend/e2e/profile-auto-theme.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live main/branch/PR preflight.
- Source ownership/read-back inspection.
- Scope compare: seven allow-listed files, no canonical Profile baseline edits, `behind_by=0` before PR.
- CI #3788: scope classifier, lint and typecheck passed.
- CI #3788: 128 existing/new unit test files passed; only the malformed helper-literal assertion failed.

### Checks failed

- CI #3788 Frontend core unit step: `profile-theme-ownership.test.ts` expected direct `colorScheme: "light"` text. Exact failure classified and repaired in source contract only.
- No WebKit screenshot evidence exists from #3788 because downstream browser jobs did not start after core failure.

### Current branch head

Resolve from live PR after the diagnostic-test repair and current-task documentation synchronization.

### Next action

Freeze the resulting head and rerun full CI. Require Frontend core to pass before classifying the blocking `ios-webkit` result. If the only later failure is the deliberate 430×932 Light `REVIEW_REQUIRED` gate, download and manually review the exact Linux WebKit artifact before approving one content-addressed fingerprint.
