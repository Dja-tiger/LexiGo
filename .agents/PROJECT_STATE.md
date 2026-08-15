# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `c98f81a3069b2b04d7c32f59f5ae859fc899d0b8` after PR #535.
- Latest deployed runtime/Stage SHA: `c98f81a3069b2b04d7c32f59f5ae859fc899d0b8`.
- PR #535 final developer-authored head was `d22e5a78c37a5d22cdee3bc407fcaa8e19cf270d`.
- Immutable-head PR CI #3550 (`31884947783`) completed successfully on that exact final head.
- PR #535 squash merge SHA is `c98f81a3069b2b04d7c32f59f5ae859fc899d0b8` and Issue #533 is closed.
- Exact-main CI #3551 (`31885486503`) completed successfully for the exact merge SHA.
- Stage run #3400 (`31886152903`) completed successfully for the same exact SHA, including public Stage validation.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require the repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage runtime.
- A controlled same-head CI retry may prove infrastructure/render nondeterminism only after the failure is classified; it must not normalize a flaky product or baseline.
- A failed executable parity assertion is not a baseline-refresh signal: inspect authoritative browser evidence and actual runtime/CSS ownership first.

## Production ownership foundations

- Home, Learn, Active Lesson, Phrases, Dictionary/Word Detail, Progress, authenticated Profile and Scenario routes use dedicated route ownership boundaries.
- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route entry.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`; Word Detail is detail state inside that island rather than a second application island.
- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`, including direct entry, URL-backed catalog state and Learn handoff.
- `RouteChrome` remains the sole owner of primary route navigation outside Active Lesson focus mode.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; broad deletion requires route, bundle and browser evidence under Issue #70.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.

## Figma source-of-truth status

- Canonical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- Screen Map & Handoff canonical node: `82:3`.
- `frontend/docs/adaptive-knowledge-coach.md` is the repository-side canonical route → Figma node → Issue handoff delivered by PR #501.
- PR #488 preserves the audited 2026-08-13 offline source provenance in `docs/figma/`.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- The exact native `.fig` binary is still not stored in GitHub; Issue #487 remains open for binary-safe upload and SHA-256 verification.
- Live Figma inspection/editing remains blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim fresh Screen Map/canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation when Figma MCP access becomes available.
- Issue #205 remains the active umbrella for final route-by-route parity audit.

## Completed executable #205 route parity

- Home: Issue #522 / PR #523 / exact-main CI #3520 / Stage #3367.
- Learn Composer: Issue #525 / PR #526 / exact-main CI #3529 / Stage #3376.
- Active Lesson: Issue #528 / PR #529 / exact-main CI #3536 / Stage #3385.
- Progress: Issue #515 / PR #517 / Stage #3330.
- Dictionary: Issue #531 / PR #532 / exact-main CI #3544 / Stage #3393.
- Word Detail: Issue #533 / PR #535 / immutable-head CI #3550 / exact-main CI #3551 / Stage #3400.

### Word Detail parity delivered by #533

- mobile Dark source: Figma `78:99`, viewport `390x844`;
- desktop Dark source: Figma `78:274`, viewport `1440x1024`;
- Light coverage reuses the approved hierarchy/geometry through semantic Light tokens;
- implementation extended the existing authoritative `frontend/e2e/word-detail-visual.spec.ts` owner;
- direct `/words/[id]` ownership remains inside `data-route-client-island="dictionary"` with semantic main `Карточка слова`;
- existing content-addressed visual baselines, 200% reflow, forced-colors and browser-owned zoom evidence remained unchanged;
- no production React/CSS, package, Playwright config, workflow, backend or dependency change was required.

## Next executable Figma child: Issue #536 — Phrases catalog

Issue #536 is open under umbrella #205 and is the next atomic route slice for `/phrases`.

Repository-approved handoff:

- mobile Light/default: Figma `255:10` at `390x844`;
- mobile Dark/search + Travel filter: Figma `257:2` at `390x844`;
- desktop Light/default: Figma `255:81` at `1440x1024`;
- desktop Dark/empty search: Figma `257:74` at `1440x1024`;
- loading/empty/error hooks: `257:212`;
- production wrapper/page: `253:3` / `253:2`;
- Product Screen Map entry: `261:2` inside `82:3`.

Execution contract:

- test-only first;
- extend the existing authoritative `frontend/e2e/phrases-visual.spec.ts`; do not create a competing owner;
- add exact Playwright `figma` annotations and canonical mobile/desktop Light/Dark state coverage;
- preserve URL-backed `query`/`topic` state, route-island/main/catalog ownership and deterministic reload behavior;
- verify the actually visible RouteChrome owner from runtime rather than inferring it from generic breakpoint CSS;
- prove semantic appearance/canvas, horizontal containment and absence of document x-overflow;
- preserve the existing Phrases content-addressed visual hashes, browser zoom/reflow, accessibility, touch and history owners;
- do not change production React/CSS or baselines unless executable evidence proves a concrete product defect;
- `/phrases/[slug]` Phrase Detail is explicitly outside this slice.

Canonical appearance invariants remain Light `#f4f7f5` and Dark `#10211d`.

## Current state

- Word Detail #533 is fully delivered through PR #535, immutable-head CI #3550, exact-main CI #3551 and Stage #3400.
- This reconciliation resets `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` byte-for-byte to canonical templates before the next product branch.
- Issue #536 is the next executable Figma-related atomic child under #205.
- Issue #201 remains design-gated; do not invent missing First Use desktop/diagnostic/recovery states from adjacent frames.
- Issue #203 remains temporarily blocked on live Figma MCP access.
- Issue #487 remains open for exact native `.fig` binary upload through a binary-safe path.
- Issue #78 remains an independent CSP/security-hardening workstream.

## Remaining roadmap

- #205 / #536: deliver canonical `/phrases` catalog parity in the existing Phrases visual owner.
- Then continue the repository-approved route map with `/phrases/[slug]`, `/profile` and `/onboarding`, subject to exact approved node evidence and each route's existing owners/design gates.
- #203: synchronize live Figma Screen Map/archive status when MCP access is available.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #487: upload the exact native `.fig` through a binary-safe GitHub path and verify SHA-256.
- #201/#18: complete canonical First Use design states, then implement the approved flow.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete remaining CSP/security-header enforcement through authorized staged rollout.
- #65/#461: reduced-motion and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after core routes and final visual parity are ready.

## Evidence corrections retained

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
