# LexiGo Project State

## Verification

- Last verified: 2026-08-14 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Live repository `main`: `c4b3f0145cee93be6e53de3775f8406bf6ed3e6e` after PR #502.
- Latest deployed runtime/Stage SHA: `7081eb7b2eb28dbc605d9c5d546edf5690226525`.
- Latest Issue #25 product merge contained in that runtime: Phase 4 squash `810fa59a748477f8723a19dee03e61517282df30`.
- Figma provenance PR #488 merged as `3e8fdafb08f7789ca5a0b53e2e73a79bc7805b35`.
- Figma route handoff PR #501 passed full CI #3434 and merged as `83bfd5ddfbee3d2ee858e1d0f00e79ba47791ea9`.
- Figma Git LFS transport PR #502 passed full CI #3435 and merged as `c4b3f0145cee93be6e53de3775f8406bf6ed3e6e`.
- Deploy Stage for repository-only Figma/LFS changes was skipped by scope; no runtime deployment is claimed for #488/#501/#502.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require the repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage.
- Physical-device or production-only acceptance remains manual when required by the Issue.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile and Scenario routes use dedicated route islands.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad deletion requires route, bundle and browser evidence.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.
- Existing frontend speech playback remains the browser speech owner.

## Figma source-of-truth status

- Canonical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- PR #488 preserves the audited 2026-08-13 offline source provenance in `docs/figma/`.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- PR #501 makes `frontend/docs/adaptive-knowledge-coach.md` the repository-side canonical route → Figma node → Issue handoff.
- PR #502 adds Git LFS routing for `design/figma/*.fig`; expected destination is `design/figma/LexiGo Design System.fig`.
- The native `.fig` binary is **not yet stored in GitHub**. Issue #487 remains open until the exact binary is uploaded through a binary-safe path and its SHA-256 is verified.
- Live Figma inspection/editing is blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim Screen Map or canvas synchronization while this external limit is active.
- Issue #203 remains open for live Screen Map/archive reconciliation. Issue #205 remains the final route-by-route parity audit.

## Delivered learning/platform foundations

- Issue #19 retained-learning report and weak-area evidence are delivered.
- Issue #18 backend adaptive ranking, persisted selection reasons and diagnostic onboarding states are delivered foundations; the product flow remains open through #201.
- Issue #25 Phase 1 delivered persisted `listening` semantics without a parallel scheduler.
- Issue #25 Phase 2 delivered account-owned custom words through the existing words/SRS model.
- Issue #25 Phase 3 delivered bounded authenticated glossary export/import without exporting scheduler history.
- Issue #25 Phase 4 delivered a local ephemeral pronunciation recorder platform; product recorder UI/scoring remains separate work.
- No completed frontend custom-vocabulary/glossary workflow is claimed.

## Issue #201 design gate

- Existing Mobile / Onboarding / Light node `79:46` is known.
- Canonical Guest Home mobile/desktop, onboarding desktop, diagnostic pre/post-reveal, skip/completion/recovery and complete Light/Dark coverage remain design-gated.
- Delivered diagnostic state contract uses `not_started`, `in_progress`, `completed`, `skipped`, at most 12 items and self-marks `known` / `unsure` / `new` before reveal.
- Do not invent missing First Use UI from adjacent frames.

## Current state

- Parent #25 remains open after four delivered phases.
- `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` are clean reset templates before the next product slice.
- Issue #68 is the next verified independent product slice: align PWA manifest/theme/icon semantics.
- Real-device iOS/Android install and cold-start acceptance for #68 remains manual and must not be claimed from CI.

## Remaining roadmap

- #68: atomic PWA manifest/theme/icon parity slice.
- #487: upload the exact native `.fig` through a binary-safe GitHub path and verify SHA-256.
- #203: synchronize live Figma Screen Map/archive status when MCP access is available.
- #201/#18: complete canonical First Use design states, then implement the approved flow.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: remaining CSP enforcement promotion is manual/authorized production work.
- #65/#461: automated implementation evidence and physical-device sign-off remain separate.
- #205: final route-by-route visual parity after #201/#203.

## Evidence correction

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
