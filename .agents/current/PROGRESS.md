# Current Task Progress

## 2026-08-27 — immutable-head CI trigger boundary

### Verified

- The computed-cascade product correction was committed as `ce69bdb09dfbb54f5b129de9219a115f04123453` and read back successfully; `main` remained `f3c161af7cf4fe91dbb2f05441f848963b80e30f`, `behind_by=0`, and the PR diff remained inside the eight allow-listed paths.
- GitHub registered no Actions workflow run and no check suite for `ce69bdb09dfbb54f5b129de9219a115f04123453` after the Git Data `create_commit` + `update_ref` fast-forward, despite `ci.yml` listening to every `pull_request` event.
- Existing CI #4208 remains tied to old head `af9496299da0b188a7269746fc3c83cd3c97e9d9` and must not be retried as evidence for the corrected runtime.

### Action

This factual Agent Harness update is intentionally written through the normal GitHub Contents API on the existing PR branch so GitHub emits a standard branch update / `pull_request:synchronize` boundary. The resulting commit becomes the only acceptable immutable-head CI candidate; no workflow file, runtime behavior, test assertion or reviewed visual fingerprint is changed by this trigger commit.

## 2026-08-27 — CI #4208 computed-cascade correction

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue #698 remains open under parent #205; Draft PR #699 is the active runtime slice.
- `main` is still `f3c161af7cf4fe91dbb2f05441f848963b80e30f`; PR #699 head before this correction is `af9496299da0b188a7269746fc3c83cd3c97e9d9`.
- Immutable CI #4208 / run `33015103200` completed on that exact head.
- Visual regression is fully green on #4208, so the reviewed content-addressed compact/desktop Light/Dark evidence remains valid and no visual baseline change is justified by this correction.
- Frontend core, accessibility, content security, performance, iOS PWA, controlled Service Worker, dictionary/lesson browser gates and backend checks are green on the same head.
- Both general UI shards fail the blocking account-email appearance proof. Desktop Chromium/WebKit and Android Chromium/iOS WebKit reproduce the same semantic status mismatch.
- The exact Light success assertion expected the semantic `color-mix(in srgb, var(--ak-color-retained) 16%, var(--ak-color-surface))` result but the browser computed `#d7f5e9`, the legacy Profile Light compatibility value.
- The downloaded UI trace proves `.lx-email-confirmation` is inside the common `.lx-routed-app[data-route-path="/profile"]` shell. It is a sibling of `LexigoProfileApp`, not a sibling of the routed shell itself.
- `frontend/app/appearance.css` and `frontend/app/profile.css` both contain route-scoped Light `.lx-account-notice.success/error` compatibility rules. They are imported after `account-email.css` and their selectors out-rank the original confirmation-local status selectors.
- UI1 also contains an unrelated Lesson Result WebKit timeout. It remains observation-only unless it recurs independently after the account-email production defect is removed.

### Finding

CI #4208 exposed a real product CSS ownership defect that the previous #4204 locator failure had masked. The browser assertion is correct and must remain strict: the confirmation card/action/copy are semantic, but success/error notice paint is still effectively owned by the legacy Profile Light compatibility bridge.

### Root cause

- Original confirmation status selector: `.lx-email-confirmation-card .lx-account-notice.success/error`, class/attribute specificity `(0,3,0)`.
- Effective later Profile compatibility selectors: `html[data-lexigo-…="light"] .lx-routed-app[data-route-path="/profile"] .lx-account-notice.success/error`, specificity `(0,5,1)`.
- Because the confirmation is a descendant of the routed shell, those compatibility selectors match and win. Import order alone cannot establish confirmation ownership.

### Corrective slice

- `frontend/app/account-email.css`: scope semantic success/error declarations through `.lx-routed-app[data-route-path="/profile"] .lx-email-confirmation .lx-email-confirmation-card ...`, giving the focused owner class/attribute specificity `(0,6,0)` without `!important`, import reordering or changes to read-only compatibility files.
- `frontend/components/email-change-confirmation-semantic-css-ownership.test.ts`: protect actual routed-shell reachability and require the confirmation status selectors to out-rank both `appearance.css` and `profile.css` compatibility selectors.
- `.agents/current/TASK.md`: correct the stale ownership assumption and explicitly record the overlapping cascade boundary.
- `.agents/current/PROGRESS.md` / `EXECUTION.md`: record #4208 provenance and the product-defect classification.
- `frontend/e2e/account-email-change.spec.ts`: unchanged; its strict computed-style assertion is the regression gate that exposed the defect.

### Next action

Create one fast-forward Git Data commit from exact parent `af9496299da0b188a7269746fc3c83cd3c97e9d9`, read every changed path/ref back, confirm unchanged `main`, then require a new immutable-head CI. Do not retry #4208 or weaken the computed-style assertion.

## 2026-08-27 00:09 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue #698 remains open under parent #205; Draft PR #699 is the active and only runtime slice.
- `main` is `f3c161af7cf4fe91dbb2f05441f848963b80e30f`; PR #699 head before this correction is `62d080fdf7fd770abc7ef62cf2bba705e45f5191`, based on that exact main SHA.
- Immutable CI #4204 / run `32975715681` produced dedicated Playwright artifacts on that exact head: UI1 `9609746306`, UI2 `9609770848`, Visual `9609733739`.
- UI1 and UI2 reproduce the same account-email test defect: `page.getByRole("alert", { name: "" })` resolves both the confirmation error notice and Next.js `#__next-route-announcer__`, causing strict-mode failure in Chromium, WebKit, Android Chromium and iOS WebKit.
- UI1 also recorded one unrelated `lesson-result.spec.ts` WebKit timeout on a disabled `Сверить ответ` button. It is not used as justification for a branch change; recurrence on the next immutable head will be classified from its own artifact before any action.
- Visual evidence intentionally failed closed only because all four fingerprints were still `pending-linux-review-*`.
- Reviewed exact Linux actuals from Visual artifact `9609733739` are stable across retry copies and have expected dimensions:
  - compact-light, 390×844: `3bdd149366e5268774d6fd2d04abd85192458e0db9c1e2e0b799928802c3a79b`;
  - compact-dark, 390×844: `f6f7d17e727d97f7641e9ff7aefb8cd7a58ed33aaf8ab41c9625af70c2b2989c`;
  - desktop-light, 1440×1024: `cdf34ac9b167b2b4750baf088e0abde390c3fd3410fd882ff6d49e0a5a7843bf`;
  - desktop-dark, 1440×1024: `4d817b7d917a490c8aa3d22d4092ab8bdb509db1db139782def9019872f5db66`.
- Manual review confirms Light/Dark palette ownership changes while confirmation/profile geometry, copy, controls and responsive composition remain stable; no canonical PNG baseline replacement is required.

### Finding

The production semantic CSS change is not implicated by the failed UI shards. The blocking account-email failure is a stale/ambiguous Playwright locator introduced by the new appearance proof, while the Visual job is the designed fail-closed review gate awaiting content-addressed Linux approval.

### Root cause

- UI: an unscoped role-only `alert` locator assumed the confirmation notice was the only alert in the document, but Next.js owns a second route-announcer alert.
- Visual: four reviewed fingerprint allow-lists were intentionally initialized with pending markers until the first immutable Linux artifact could be inspected.

### Changed files

Planned correction on the next branch head:

- `frontend/e2e/account-email-change.spec.ts`: scope the Light error assertion to `.lx-email-confirmation-card .lx-account-notice.error`, matching the already-correct Dark assertion and semantic owner.
- `frontend/e2e/profile-email-confirmation-visual.spec.ts`: replace only the four `pending-linux-review-*` values with the reviewed SHA-256 fingerprints above.
- `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md`: record immutable CI/artifact provenance and failure classification.

### Checks passed

- Runtime semantic computed-style evidence reached the expected confirmation state in all failing UI projects before locator resolution failed.
- Visual actuals were downloaded from exact-head run `32975715681`, matched by SHA-256 to report attachments, inspected manually, and verified at 390×844 / 1440×1024.
- `main` remained `f3c161af7cf4fe91dbb2f05441f848963b80e30f` during diagnosis.

### Checks failed

- CI #4204: UI shard 1, UI shard 2 and Visual regression.
- UI1/UI2 account-email root cause is classified and corrected test-side; Visual failure is expected review gating.
- One unrelated UI1 Lesson Result WebKit timeout remains observation-only unless it reproduces on the corrected immutable head.

### Current branch head

- Before correction: `62d080fdf7fd770abc7ef62cf2bba705e45f5191`.
- Next head: resolve from the Git Data commit created from this exact parent.

### Next action

Create one fast-forward branch commit containing only the scoped locator correction, four reviewed Linux fingerprints and this Agent Harness evidence; read all changed paths/ref back, verify the diff against unchanged main, then require a new full immutable-head CI without blind retries.
