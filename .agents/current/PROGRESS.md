# Current Task Progress

## 2026-07-25 — Issue #196 Scenario Lessons UI

### Verified pre-flight

- Mandatory harness documents and every referenced normative source were read from live `main` before product writes.
- Repository memory was reconciled before continuing the slice: PR #222 updated the stale stage SHA, passed CI #1804 and squash-merged as `96caedb58a289ce13af9862a9258ba007809a73c`.
- PR #221 was rebased onto that `main`; live base is `96caedb58a289ce13af9862a9258ba007809a73c` and the branch is not behind it.
- Issues #196/#24, merged Scenario backend PRs #216/#218, the OpenAPI contract, stage Issue #12 and Figma nodes `76:100`, `76:127`, `76:219` were re-read.
- Existing owners were reused: authenticated bootstrap/session refresh, navigation/history, `AccessibleDialog`, semantic tokens, axe, visual and bundle gates.

### Implemented product contract

- Canonical authenticated `/scenarios/[slug]` route island without modifying `LexigoPremiumApp`.
- Typed Scenario API runtime validation for catalog detail, attempts and submission responses.
- Start, resume, pause, reload, accepted-feedback and completion states.
- User/attempt/position-owned local drafts with no token or server judgement storage.
- Stable `submissionId` and byte-stable retry after ambiguous transport failure.
- Optimistic attempt versioning with 409 resynchronization that preserves unsent evidence.
- Separate fact and hypothesis inputs; no client-owned `wordId`, rating, correctness, answer reveal or scheduler state.
- Safe browser Back and explicit close flows with server pause before navigation.
- Focused route chrome, Light/Dark, reduced motion, forced colors and compact/desktop responsive presentation based on the approved Figma states.
- Reused `AccessibleDialog` with initial focus, forward/reverse Tab containment, Escape close and trigger-focus restoration.

### Confirmed defects and root-cause fixes

- React Compiler rejected `Date.now()` in render and synchronous state transitions in effects. Runtime initialization was moved into event/cancellable scheduling instead of disabling lint rules.
- A readonly fixture widened the Scenario step type. The fixture now uses the explicit `ScenarioStep` contract.
- The audited application-root allow-list did not include the new route island. The source contract now verifies the single Scenario bootstrap owner and its lifecycle/API/dialog isolation.
- Small milestone/retained/weak accent labels failed WCAG contrast. Route-local foreground aliases mix the accent with semantic text while preserving the hue.
- Dialog contrast variables were declared only under `.lx-scenario`, but `AccessibleDialog` portals outside that subtree. Variables are now declared on the portal dialog root as well.
- Next App Router invalid-slug navigation rendered the canonical 404 boundary with HTTP 200. The E2E contract now verifies semantic 404 UI and absence of the Scenario island rather than asserting transport status.
- An unscoped retry alert locator matched the global route alert. The test now scopes the assertion to the response-region owner.
- Mobile tests initially selected a hidden desktop close button. The keyboard contract now selects the actually visible desktop/mobile trigger.
- At 320 px with 200% CSS zoom, the mobile header label and fixed shared skip link expanded the document. Route-local narrow-width constraints preserve full 44 px controls, keep the label accessible, wrap the focused skip link and remove real horizontal scrolling without a global overflow mask.

### Linux visual evidence

- Compact Light active draft: `390 × 1792`, SHA-256 `85a674882de19c87bc92d4b06888d7dc91471726a9916a943d4592bbd7919aab`, source run `30169218809`, source head `79957603bdd358220d6e045bab00207633999aaf`.
- Desktop Dark objective feedback after the contrast fix: `1440 × 1054`, SHA-256 `eaad352ced6e94a639014af3ea9a01c5bd20ec335857fe21a5d2cec93af4da40`, source run `30171478706`, source head `c0c0f74e001b5ae248b5d88d1fdb8dac041ea2f0`.
- Both states use content-addressed dimensions and SHA-256 contracts; mismatches attach the Linux actual PNG for review.

### Bundle evidence

- Cold `/scenarios/incident-update` measurement: `202679` transferred JavaScript bytes and `16` initial requests.
- Enforced ceiling: `235000` JavaScript bytes and `18` requests.
- The byte ceiling leaves approximately 15.9% controlled headroom over the measured route.

### Checks passed before the immutable final head

- CI #1826, run `30171478706`, on `c0c0f74e001b5ae248b5d88d1fdb8dac041ea2f0`:
  - frontend lint, TypeScript, unit tests, production build and dependency audit;
  - backend unit/race/security and integration;
  - both UI shards, including desktop Chromium/WebKit, Android Chromium and iOS WebKit;
  - 320 px/200% zoom reflow;
  - accessibility audit, content security, service worker, iOS PWA dictionary, lesson completion and performance budget.
- The only intentional failure in #1826 was the stale Desktop Dark content hash after the proven contrast correction; the reviewed Linux value is now recorded in the visual contract.
- `EXECUTION.md` and reusable frontend/accessibility/CI lessons now contain the confirmed root causes and prevention rules.
- PR review conversation currently contains no comments or unresolved threads.

### Current branch head

Resolve from the live branch ref after this checkpoint; branch is `feat/issue-196-scenario-lessons-ui`, Draft PR #221.

### Next action

Require a complete green immutable-head CI on the final runtime, measured visual/bundle contracts and harness evidence. Then audit live base/head/diff/review threads, move PR #221 to Ready, squash merge, validate the new `main` stage deployment/public smoke/browser matrix, and only afterward reconcile repository memory.
