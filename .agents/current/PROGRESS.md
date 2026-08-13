# Current Task Progress

## 2026-08-13 18:45 +03:00

### Verified

- Issue #497 / parent #25 is the active atomic slice.
- Branch `feat/issue-497-local-pronunciation-recorder` was created from exact `main` SHA `98773d95a65c864b66084eae731eb643786bc7a7` after the Issue #489 harness reset was merged.
- Repository-wide search found no existing `getUserMedia`, `MediaRecorder` or microphone-permission owner. Existing Issue #51 remains the independent production speech-playback owner.
- The supplied offline Figma source does not expose a verified canonical microphone/recording production node; this slice therefore remains intentionally non-visual.
- `frontend/lib/pronunciation-recorder.ts` is the sole new microphone/recording owner and is not imported by any production route/component in this phase.
- The blocking browser matrix uses the explicit `test:e2e:ui` list, so `frontend/package.json` was changed only to route `pronunciation-recorder-platform.spec.ts` into that existing gate.

### Finding

- Construction performs no capture request. The only capture call is inside explicit `startRecording()` and requests `{ audio: true, video: false }`.
- Recording formats are selected from an explicit feature-detected audio allowlist; configured duration is capped at 30 seconds.
- Permission denial is a stable recoverable state. Concurrent starts do not create parallel prompts, and a stream resolving after cancel/dispose is stopped before a recorder is created.
- Successful recording owns one in-memory Blob/object URL. Stop, cancel, recorder error and dispose stop every owned track; replacement/clear/dispose revoke owned object URLs.
- Source contracts forbid fetch/XHR, localStorage/sessionStorage, IndexedDB, beacon, Service Worker and Cache API side channels in the recorder owner.
- The browser platform spec executes the actual TypeScript source after deterministic transpilation inside desktop Chromium and WebKit. Media hardware is faked only at the browser boundary; no duplicate recorder implementation or production test route is introduced.
- Physical-device permission UX and audible microphone validation remain a later presentation/release gate because this phase has no visual control and no canonical microphone Figma node.

### Root cause

- Parent #25 still lacked one explicit microphone/privacy lifecycle owner even though speech playback, listening persistence, custom-word ownership and glossary portability had already been delivered in prior slices.
- A browser spec added as a standalone file would not have been blocking because CI invokes an explicit `test:e2e:ui` file list; the package script therefore needed one test-routing entry.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `docs/pronunciation-recording-privacy.md`
- `frontend/lib/pronunciation-recorder.ts`
- `frontend/lib/pronunciation-recorder.test.ts`
- `frontend/lib/pronunciation-recorder-source.test.ts`
- `frontend/e2e/pronunciation-recorder-platform.spec.ts`
- `frontend/package.json` (single blocking-test-list addition only)

### Checks passed

- Diagnostic immutable-candidate CI #3411 / run `31716024246` on head `70a4c5d6fcde9d7c022f8be6b315bda23cd06988`: complete success.
- Frontend core: lint, typecheck, Vitest, production build and dependency audit all passed.
- New blocking recorder browser contract passed inside both UI shards, exercising the actual module in desktop Chromium/WebKit.
- Accessibility audit, content-security E2E, lesson completion, controlled service worker, iOS PWA dictionary, visual regression, dictionary smoke, performance budgets and frontend aggregate all passed.
- Backend unit/security and integration regression jobs passed.
- Web and API container builds passed.
- PR/base diff was audited after test routing; `package.json` changed only by adding the recorder platform spec to the existing `test:e2e:ui` command.

### Checks failed

- No product/test failure remains on head `70a4c5d6fcde9d7c022f8be6b315bda23cd06988`.
- Earlier CI runs were superseded by intentional privacy-documentation and blocking-browser-test writes, not by unresolved runtime failures.

### Current branch head

This PROGRESS write changes the branch head. Resolve the exact SHA again after `EXECUTION.md` is finalized; that resulting head is the immutable merge candidate.

### Next action

- Finalize `EXECUTION.md` with the verified CI/browser evidence.
- Stop all feature writes.
- Run full required CI on the resulting exact head.
- Audit changed paths, PR review threads and live `main`; mark Ready and squash-merge only if the exact-head CI is fully green and the PR remains clean/mergeable.
