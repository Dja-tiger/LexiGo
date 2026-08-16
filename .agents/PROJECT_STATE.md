# LexiGo Project State

## Verification

- Last verified: 2026-08-16 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Current `main`: `e7d992ad6089aa6445017ea6ffff6280787b05d8` after PR #551.
- Latest runtime-bearing `main`: `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f` after PR #543.
- Latest deployed runtime/Stage SHA: `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f`.
- PR #546 (test-only, Issue #545): squash merge `bf0036c1`; Dictionary Empty renderer-equivalent hash scoped.
- PR #547 (asset-only, Issue #487): squash merge `d23f7a82`; native `.fig` uploaded via Git LFS.
- PR #551 (design-tooling, Issue #550): merge `e7d992ad`; deterministic ZSeven OpenPencil v0.8.2 native `.fig -> .op` import gate delivered.
- #546, #547 and #551 did not change production runtime; Stage redeploy was not required.
- Live GitHub and live source are authoritative for open work, ownership, review state and CI.

## Delivery contract

- One PR contains one atomic slice.
- Product changes require the repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier and do not deploy Stage runtime.
- Design-source/tooling changes require deterministic source identities, immutable-head design acceptance, clean review audit and exact-main design validation; Stage is not required when application runtime is unchanged.
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

## AI-native design source-of-truth status

Issue #552 / PR #553 promotes ZSeven OpenPencil as the day-to-day AI-first design editor while preserving native Figma provenance.

### Active visual/editor source

- Path: `design/openpencil/LexiGo Design System.op`.
- Accepted SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`.
- Accepted size: `6,446,726` bytes.
- 23 pages / 7,341 recursive design nodes / 83 reusable nodes.
- 92 ZSeven runtime variables / 2 theme axes.
- Canonical production OpenPencil `fig_*` mapping: `docs/figma/openpencil-screen-map.json`.

### Active lossless token/provenance source

- Path: `design/openpencil/LexiGo Design Tokens.json`.
- Accepted SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Accepted size: `82,487` bytes.
- Native inventory: 6 collections / 92 variables = 43 COLOR + 48 FLOAT + 1 STRING.
- 40 Figma alias references; 0 unresolved aliases; 0 incomplete mode values.
- ZSeven v0.8.2 cannot store variable-to-variable alias values, so runtime aliases compile to resolved values while the original alias graph remains authoritative in this sidecar.

### Immutable Figma archive/provenance

- Historical cloud file: `LexiGo Design System`, file key `3xXmBWnf38jbvLjtziwber`.
- Historical Screen Map & Handoff node: `82:3`.
- Repository archive: `design/figma/LexiGo Design System.fig` via Git LFS.
- Native source identity: 1,191,055 bytes; SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`.
- `frontend/docs/adaptive-knowledge-coach.md` remains repository-side route -> historical Figma node -> Issue provenance.
- `docs/figma/openpencil-ai-workflow.md` owns the promoted OpenPencil workflow/source hierarchy.
- Live Figma inspection/editing remains blocked by the connected Figma MCP Starter-plan tool-call limit. Do not claim fresh Screen Map/canvas synchronization without live evidence.
- Figma Cloud remains historical/reference input while retained, not the day-to-day editable owner after OpenPencil promotion.

### OpenPencil acceptance contract

- Primary editor/toolchain: `ZSeven-W/openpencil` v0.8.2.
- Base deterministic import candidate: SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c`, 2,309,061 bytes.
- Native Figma variable extraction uses published `@open-pencil/core@0.13.2` read-only because ZSeven v0.8.2/v0.8.4 importer does not import Figma themes/variables.
- Acceptance run #14 / GitHub run `31923451381` rendered 20 canonical Linux screens and completed real OpenPencil edit/readback/persistence checks.
- Reviewed artifact: id `9257099175`, digest `sha256:8b3b4b60b05382327e5346a1c896f8e5d47c3f0a2081986c156abc2776187692`.
- Tokenized and original accepted renders match exactly by width/height/SHA-256 for all 20 screens.
- OpenPencil persistence normalized 186 floating-point values only; max absolute drift `2.8610229518832853e-08`, below semantic tolerance `1e-7`; no non-numeric semantic tree drift was accepted.
- Permanent workflow `.github/workflows/openpencil-visual-acceptance.yml` regenerates the source pair and requires committed `.op`/sidecar byte equality with deterministic outputs.
- ZSeven v0.8.2 does not preserve imported node->variable bindings. Existing imported nodes keep concrete visual values; recovered tokens are available for AI/new/intentionally updated elements. Do not claim full Figma binding parity.

## Figma/OpenPencil follow-up ownership

- Issue #203 remains the historical live-Figma Screen Map/archive reconciliation item if Figma MCP access becomes available; repository/OpenPencil delivery does not depend on it.
- Issue #205 remains the historical executable route-parity umbrella; all nine canonical route parity contracts are delivered.
- System state visual gate (Dictionary Empty renderer-equivalent) is resolved by PR #546.
- Issue #552 / PR #553 owns OpenPencil visual/token acceptance and active AI-native source promotion.
- Self-host OpenPencil Web + external `op`/MCP/Codex control plane is the next design-tooling follow-up after #552 completes.

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
- Deterministic ZSeven import: Issue #550 / PR #551 / merge `e7d992ad6089aa6445017ea6ffff6280787b05d8`.

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

- Canonical Dictionary Empty Light remains historical Figma node `79:93` at `390x844` with primary approved SHA-256 `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Issue #545 / PR #546 scoped the renderer-equivalent SHA-256 `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` as an accepted alternate fingerprint for `compact-empty-light` only.
- Both fingerprints differ by exactly three RGB pixels (max 1 LSB delta) on the antialiased edge of the calendar-reminder control, not Dictionary content.
- Two consecutive captures within one test attempt must still produce identical raw SHA; any unreviewed third raster continues to fail the visual gate.
- The historical canonical Figma baseline, production UI and broad pixel tolerance remain unchanged.

## Current state

- All nine canonical route parity contracts are delivered.
- Dictionary Empty renderer-equivalent hash is resolved by Issue #545 / PR #546.
- Native `.fig` archive is stored in GitHub via Git LFS.
- Deterministic ZSeven native import is merged in `main` by #550/#551.
- Issue #552 / PR #553 has completed pre-promotion visual/editability/token evidence and committed the exact accepted OpenPencil `.op` + lossless token sidecar to its branch; final immutable-head PR validation is pending before merge.
- Current `main` is `e7d992ad6089aa6445017ea6ffff6280787b05d8`; latest runtime-bearing SHA remains `8a9f1fd7df68ff7cff538067b9d5f1c2e924af0f`.
- Direct Figma canvas work remains blocked by connected Starter-plan MCP quota; OpenPencil work no longer depends on that quota.
- Issue #201 remains design-gated: mobile onboarding node `79:46` alone is insufficient for Guest Home, desktop onboarding and diagnostic/recovery state implementation.

## Remaining roadmap

- #552: finish immutable-head OpenPencil acceptance/full CI, review audit, merge and exact-main validation.
- Self-host follow-up: deploy authenticated OpenPencil Web and connect external `op`/MCP/Codex control plane with TLS, backups and single-writer/locking policy.
- #203: optional historical live-Figma Screen Map/archive synchronization when MCP access is available; repository/OpenPencil delivery does not depend on it.
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
