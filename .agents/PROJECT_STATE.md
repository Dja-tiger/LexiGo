# LexiGo Project State

## Verification

- Last verified: 2026-08-15 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Runtime-bearing `main` before this Agent Docs reconciliation: `0c2e6f3010ad486fc2bf76441a311532e9761b4f` after PR #538.
- Latest deployed runtime/Stage SHA: `0c2e6f3010ad486fc2bf76441a311532e9761b4f`.
- PR #538 final developer-authored head was `4396040cf6680c7a2cbf1586a224216006509eaa`.
- Immutable-head PR CI #3562 (`31891029777`) completed successfully on that exact final head.
- PR #538 squash merge SHA is `0c2e6f3010ad486fc2bf76441a311532e9761b4f` and Issue #536 is closed.
- Exact-main CI #3563 (`31891585765`) completed successfully for the exact merge SHA.
- Stage run #3412 (`31892094808`) completed successfully for the same exact SHA, including public Stage validation.
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
- Phrases catalog: Issue #536 / PR #538 / immutable-head CI #3562 / exact-main CI #3563 / Stage #3412.

### Phrases catalog parity delivered by #536

- mobile Light/default: Figma `255:10`, viewport `390x844`;
- mobile Dark/search + Travel filter: Figma `257:2`, viewport `390x844`;
- desktop Light/default: Figma `255:81`, viewport `1440x1024`;
- desktop Dark/empty search: Figma `257:74`, viewport `1440x1024`;
- implementation extended the existing authoritative `frontend/e2e/phrases-visual.spec.ts` owner;
- executable browser evidence establishes `mobile` RouteChrome at 390px and persistent `rail` RouteChrome at 1440px;
- URL-backed query/topic state, route-island/main/catalog ownership, semantic Light/Dark canvas, containment and reload stability are executable contracts;
- all eight existing content-addressed Phrases visual hashes and the existing browser-owned 200% zoom/reflow owner remained unchanged;
- no production React/CSS, backend, package/lockfile, Playwright config, workflow or visual-baseline change was required.

## Next executable Figma route: `/phrases/[slug]` Phrase Detail

Repository-approved handoff in `frontend/docs/adaptive-knowledge-coach.md` already contains exact canonical Phrase Detail nodes:

- mobile Dark/daily: Figma `255:55` at `390x844`;
- mobile Light/travel: Figma `257:47` at `390x844`;
- desktop Dark/technical: Figma `255:162` at `1440x1024`;
- desktop Light/daily: Figma `257:159` at `1440x1024`;
- production wrapper/page remains `253:3` / `253:2` and Screen Map handoff `261:2` inside `82:3`.

Execution boundary for the next atomic child under #205:

- reuse the existing Phrases/Phrase Detail authoritative owners rather than creating a competing route graph or visual owner;
- preserve independent direct-entry loading/error behavior and exact `/api/v1/phrases/{slug}` fixture scoping;
- verify semantic main/route-island ownership, canonical content hierarchy, appearance/canvas, actual RouteChrome owner, horizontal containment and reload/direct-entry stability;
- preserve existing Phrases catalog parity, content-addressed visual hashes, browser zoom/reflow, accessibility, touch, focus/history and performance owners;
- change production React/CSS or visual baselines only if executable evidence proves a concrete product defect;
- use repository-approved exact node mapping while live Figma MCP remains quota-blocked and do not claim fresh cloud-canvas synchronization.

Canonical appearance invariants remain Light `#f4f7f5` and Dark `#10211d`.

## Current state

- Phrases catalog #536 is fully delivered through PR #538, immutable-head CI #3562, exact-main CI #3563 and Stage #3412.
- This reconciliation resets `.agents/current/TASK.md`, `PROGRESS.md` and `EXECUTION.md` byte-for-byte to canonical templates before the next product branch.
- `/phrases/[slug]` is the next repository-approved executable Figma route under umbrella #205 because exact canonical nodes already exist.
- Issue #201 remains design-gated; do not invent missing First Use desktop/diagnostic/recovery states from adjacent frames.
- Issue #203 remains temporarily blocked on live Figma MCP access.
- Issue #487 remains open for exact native `.fig` binary upload through a binary-safe path.
- Issue #78 remains an independent CSP/security-hardening workstream.

## Remaining roadmap

- #205: deliver canonical `/phrases/[slug]` Phrase Detail parity next, then continue with `/profile` and `/onboarding` subject to exact approved node evidence and design gates.
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
