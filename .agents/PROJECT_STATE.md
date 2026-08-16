# LexiGo Project State

## Verification

- Last verified: 2026-08-16 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Current `main`: `d23f7a8267edb67f3762128987b52ae2445559f2` after PR #547.
- Latest runtime-bearing `main`: `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f` after PR #543.
- Latest deployed runtime/Stage SHA: `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f`.
- PR #546 (test-only, Issue #545): squash merge `bf0036c1`; Dictionary Empty renderer-equivalent hash scoped.
- PR #547 (asset-only, Issue #487): squash merge `d23f7a82`; native `.fig` uploaded via Git LFS.
- Neither #546 nor #547 changed production runtime; Stage redeploy was not required.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require the repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage runtime.
- A controlled same-head CI retry may help classify infrastructure/render nondeterminism, but a retry-success result must not be reported as deterministic when Playwright still records a flaky test.
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
- The exact native `.fig` binary is stored in GitHub at `design/figma/LexiGo Design System.fig` via Git LFS. Issue #487 is closed; SHA-256 verified on upload (PR #547).
- Live Figma inspection/editing remains blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim fresh Screen Map/canvas synchronization without live evidence.
- Issue #203 remains open for live Screen Map/archive reconciliation when Figma MCP access becomes available; repository-side delivery status reconciliation is in progress.
- Issue #205 remains the active umbrella for final route-by-route parity audit.
- All nine canonical route parity contracts (Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases catalog, Phrase Detail, Profile) are delivered. System state visual gate (Dictionary Empty renderer-equivalent) is resolved by PR #546.

## Completed executable #205 route parity

- Home: Issue #522 / PR #523.
- Learn Composer: Issue #525 / PR #526.
- Active Lesson: Issue #528 / PR #529.
- Progress: Issue #515 / PR #517.
- Dictionary: Issue #531 / PR #532.
- Word Detail: Issue #533 / PR #535.
- Phrases catalog: Issue #536 / PR #538.
- Phrase Detail: Issue #540 / PR #541 / merge `11ad10835ad968b41f5f53b01e97d22dab08a1e9`.
- Profile: Issue #542 / PR #543 / merge `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f` / exact-main CI #3578 / Stage `31911802944`.
- System States (Dictionary Empty renderer-equivalent): Issue #545 / PR #546 / merge `bf0036c1`.
- Native Figma binary: Issue #487 / PR #547 / merge `d23f7a82` / Git LFS verified.

### Phrase Detail parity delivered by #540

- mobile Dark/daily: Figma `255:55`, viewport `390x844`;
- mobile Light/travel: Figma `257:47`, viewport `390x844`;
- desktop Dark/technical: Figma `255:162`, viewport `1440x1024`;
- desktop Light/daily: Figma `257:159`, viewport `1440x1024`;
- implementation extends the existing authoritative `frontend/e2e/phrases-visual.spec.ts` owner;
- production React/CSS, backend contracts and existing content-addressed Phrases baselines remained unchanged.

### Profile parity delivered by #542

- mobile Light: Figma `79:6`, viewport `390x844`;
- mobile Dark: token-derived from canonical `79:6`, viewport `390x844`;
- desktop Light: Figma `79:129`, viewport `1440x1024`;
- desktop Dark: token-derived from canonical `79:129`, viewport `1440x1024`;
- executable ownership covers direct entry, route island/main hierarchy, authenticated control surfaces, explicit appearance/canvas, visible RouteChrome owner, horizontal containment and reload stability;
- production React/CSS, backend contracts and existing Profile content-addressed baselines remained unchanged.

Canonical appearance invariants remain Light `#f4f7f5` and Dark `#10211d`.

## Known Figma visual-gate follow-up

- Canonical Dictionary Empty Light remains Figma node `79:93` at `390x844` with primary approved SHA-256 `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Issue #545 / PR #546 scoped the renderer-equivalent SHA-256 `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` as an accepted alternate fingerprint for `compact-empty-light` only.
- Both fingerprints differ by exactly three RGB pixels (max 1 LSB delta) on the antialiased edge of the calendar-reminder control, not Dictionary content.
- Two consecutive captures within one test attempt must still produce identical raw SHA; any unreviewed third raster continues to fail the visual gate.
- The canonical Figma baseline, production UI and broad pixel tolerance remain unchanged.

## Current state

- All nine canonical route parity contracts are delivered and merged into `main`.
- Dictionary Empty `79:93` renderer-equivalent hash is resolved by Issue #545 / PR #546.
- Native `.fig` binary is stored in GitHub via Git LFS by Issue #487 / PR #547.
- Current `main` is `d23f7a8267edb67f3762128987b52ae2445559f2`; latest runtime-bearing SHA remains `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f`.
- Direct Figma canvas work remains blocked by the connected Starter-plan MCP quota; no missing node ID is inferred.
- Issue #201 remains design-gated: mobile onboarding node `79:46` alone is insufficient for Guest Home, desktop onboarding and diagnostic/recovery state implementation.
- Issue #203 repository-side delivery reconciliation is in progress; live Screen Map update remains blocked on Figma MCP access.

## Remaining roadmap

- #205: continue final parity only from exact approved mappings; onboarding remains blocked until missing canonical nodes/states exist.
- #203: live Figma Screen Map/archive synchronization when MCP access is available; repository-side reconciliation in progress.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #201/#18: complete canonical First Use design states, then implement the approved flow.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete remaining CSP/security-header enforcement through authorized staged rollout.
- #65/#461: reduced-motion and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after core routes and final visual parity are ready.

## Evidence corrections retained

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
