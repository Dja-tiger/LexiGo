# LexiGo Project State

## Verification

- Last verified: 2026-08-24 Europe/Berlin.
- Repository: `Dja-tiger/LexiGo`.
- Current verified `main`: `98da1853529afea9ff686f3af37ba24b6ccbadc0`.
- No open pull requests existed when this reconciliation slice started.
- Live GitHub and live source are authoritative for refs, Issues, PRs, CI, deployment and ownership. Historical delivery details remain in Git history and linked Issues/PRs.

## Latest completed runtime deliveries

### Issue #681 / PR #682 — semantic Service Worker update surface for #205

- Issue #681 is **closed / completed** by PR #682.
- The globally mounted Service Worker update/recovery surface no longer effectively uses the legacy fixed navy/purple/cyan palette. Its Light/Dark surface, text, actions and success/error states now derive from current semantic `--ak-color-*` appearance tokens while preserving registration, activation, deferral, recovery, reload and storage semantics.
- Regression protection includes a fail-closed source ownership contract plus effective `getComputedStyle` Playwright assertions for update, error and post-update success states in explicit Light and Dark.
- Existing canonical visual baselines required no changes; full visual regression remained byte-stable outside the transient update surface.
- Final developer head: `03a9f08a8f0e5420c920c5713ab5ab86e8df6f8c`.
- Full immutable-head PR CI #4141 / run `32760498785`: **success**, including frontend core, both UI shards, Controlled Service Worker, visual regression, accessibility, content security, performance, backend unit/integration and API/web container builds.
- PR #682 squash merge/current verified runtime `main`: `98da1853529afea9ff686f3af37ba24b6ccbadc0`.
- Exact-main push CI run `32761745559`: **success**.
- Exact-SHA Stage run `32762898382`: deploy **success**, public smoke **success**, public browser **success**; API and web run image tag `98da1853529afea9ff686f3af37ba24b6ccbadc0`, and the 12-test public desktop/iOS runtime matrix passed.

### Issue #678 / PR #679 — semantic tablet RouteChrome palette for #205

- Issue #678 is **closed / completed** by PR #679.
- The production-reachable 720–1023px RouteChrome ownership gap is closed: the shared tablet rail no longer effectively uses the legacy navy/purple/cyan premium palette and now derives surface, text, hover and active paint from the current semantic `--ak-color-*` appearance tokens while preserving existing rail geometry and route semantics.
- The exact Linux 768×1024 visual actuals were manually reviewed before changed SHA-256 fingerprints were approved. Focused Active Lesson / Onboarding ownership remains unchanged.
- Regression protection includes fail-closed source ownership checks plus computed-style/visual evidence. Profile Light remains correctly governed by its more-specific route-scoped compatibility owner rather than being forced to the generic rail surface contract.
- Final developer head: `86032a3a0ce3e58985e0e8e9bf52a5e46df564f2`.
- Full immutable-head PR CI #4134 / run `32755738186`: **success**.
- PR #679 squash merge: `0f58d48eb6966561a5e87a14b330392f4330f6f9`.
- Exact-main push CI run `32757028324`: **success**, including backend unit/integration, frontend core, both UI shards, visual regression, accessibility, content security, performance, iOS PWA, service worker and API/web container builds.

### Issue #651 / PR #673 — process-aware progress analytics

- Issue #651 is **closed / completed**.
- Stage 6b consumes the immutable `review_events.session_kind` / `selection_reason` attribution delivered by Stage 6a instead of reconstructing Study / Review / Remediation from `answer_mode`.
- Progress exposes process evidence for `newLearned`, `dueReviewed`, `remediationReviewed`, `reviewBacklog`, `lapses` and Review retention while preserving legacy/null-attribution compatibility boundaries.
- Explicit Study activity cannot inflate Review retention/process lapse evidence; future-scheduled non-new items do not inflate Review backlog.
- Final developer head: `b1875396fc65a6c056a277be29d0cd1d97d8a084`.
- Full immutable-head CI #4115 / run `32702815388`: **success**.
- PR #673 squash merge: `db6a6480b06526a21819a2b93abc3fa832139d08`.

### Issue #650 / PR #674 — answer input remains editable after reveal

- Issue #650 is **closed / completed**.
- Recall answer reveal no longer makes the native answer input read-only. The learner can explicitly tap/click the textbox after reveal, regain focus and enter/edit text.
- Immutability remains intentional while review persistence is in flight, after a rating is persisted and while an offline review is queued.
- Regression protection is fail-closed: the browser owner is explicitly collected by `test:e2e:lesson`, and a source contract protects both the runtime condition and CI collection wiring.
- Final developer head: `37f3ffb8491bb55b285838d2edd45a993051dd26`.
- Full immutable-head CI #4119 / run `32713808811`: **success**, including frontend core, lesson E2E, both UI shards, accessibility, security, performance, visual regression and API/web container builds.
- PR #674 squash merge/runtime main at deployment time: `8b5478abf7cb8fd434f07acd038a1f6ff05ecbd9`.

## Latest completed visual-parity evidence delivery

### Issue #641 / PR #676 — final system-state applicability matrix for #205

- Issue #641 is **closed / completed** by PR #676.
- The final executable cross-owner contract binds the five shared/system-state OpenPencil visual owners and the eight already-approved First Use loading/error baselines without changing runtime, source design or visual fingerprints.
- Active provenance remains repository-owned OpenPencil; historical Figma identifiers are archival only.
- Final developer head: `63e5d024292c1a9b66e7fe9702f6d4e47a21296a`.
- Full immutable-head CI #4123 / run `32727596944`: **success**, including frontend core, visual regression, UI shards, accessibility, content security, lesson completion, iOS PWA, service worker, performance, backend checks and container builds.
- PR #676 squash merge: `d83f3e1f4e90464f47aa2ff8b42c2185ff051a5b`.

## Stage / deployment

- Deployment status Issue #12 reports Stage **success** on exact runtime image SHA `98da1853529afea9ff686f3af37ba24b6ccbadc0`.
- Stage run `32762898382`: deploy **success**, public smoke **success**, public browser **success**.
- The capacity preflight passed with ample free bytes/inodes and preserved persistent volumes plus the rollback/deploy images.
- PostgreSQL, Redis, API and web became healthy; API and web run the exact `98da1853529afea9ff686f3af37ba24b6ccbadc0` image tag.
- Public runtime validation passed 12/12 tests across desktop Chromium and iOS WebKit for `/`, `/learn`, `/phrases`, `/dictionary`, `/progress` and stale-build recovery.

### Issue #659 — Stage PostgreSQL storage incident

- Issue #659 is **closed / completed**.
- Immutable diagnostics from PR #660 proved the historical PostgreSQL startup failure was host storage exhaustion: `postmaster.pid: No space left on device`; it was not an application-image regression or OOM.
- PR #661 added a bounded fail-closed capacity preflight/recovery path that distinguishes free bytes/inodes, preserves named persistent volumes and required deploy/rollback images, and avoids broad destructive prune/reset behavior.
- Current Stage/public evidence above proves the repaired deployment path remains operational.

## Design source of truth

- Active production design/handoff source: repository-owned OpenPencil, not Figma Cloud.
- Active document: `design/openpencil/LexiGo Design System.op`.
- Active tokens: `design/openpencil/LexiGo Design Tokens.json`.
- Route/state mapping: `docs/figma/openpencil-screen-map.json` plus `docs/figma/openpencil-production-handoff.json`.
- Historical Figma node IDs are archival provenance only unless a task explicitly proves otherwise from current repository contracts.

## Production ownership foundations

- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and route-entry selection.
- Guest `/` is owned by `LexigoGuestHomeApp`; authenticated `/` by `LexigoHomeApp`.
- `LexigoOnboardingApp` owns `/onboarding`.
- `LexigoLearnApp` owns `/learn`; `LexigoActiveLessonApp` owns `/lesson/active`.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`.
- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `LexigoProgressApp` owns `/progress`; authenticated Profile is owned by `LexigoProfileApp`.
- `LexigoScenarioCatalogApp` / `LexigoScenarioApp` own scenario routes.
- `RouteChrome` owns ordinary primary route navigation outside focused routes.
- `ReviewOutboxRuntime` owns durable review queue/connectivity behavior.
- `LexigoPremiumApp` remains a narrow compatibility fallback; extracted canonical routes must not be reassigned to it.

## Open automated work verified at reconciliation

- Issue #205 remains the High-priority visual-parity umbrella.
- The #678 tablet RouteChrome palette defect and #681 global Service Worker update-surface palette defect are delivered and must not be repeated.
- User-directed next work remains a route-by-route effective visual ownership audit under #205, focused on genuinely remaining legacy palette/appearance/cascade defects rather than raw color grep or redoing already-approved evidence.
- Any reproduced runtime/design defect found by the #205 audit must be isolated into its own atomic Issue/PR; the umbrella audit must not silently redesign runtime.
- Existing route-specific compatibility contracts, including Profile appearance ownership and Word Detail contrast ownership, must not be normalized globally without runtime evidence.
- Issue #654 remains Low-priority product-delight polish and is intentionally behind core learning/reliability/accessibility/parity work.
- Issue #12 remains the operational deployment-status tracker and is not a normal product backlog item.

## Delivery contract

- One PR contains one atomic product, tooling or reconciliation slice.
- Product changes require immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changes.
- Pure Agent Docs reconciliation uses the fail-closed lightweight classifier and must not trigger a runtime Stage deployment.
- Design work uses OpenPencil production identities and repository-owned mapping; historical Figma provenance is reference-only.
- Controlled same-head reruns may classify proven infrastructure/browser flakes; product code is not changed without a reproduced product defect.
- Evidence-only audits do not silently redesign runtime. A reproduced product defect receives its own atomic Issue/PR.

## Next selection rule

After `.agents/current/**` is reset by this reconciliation PR, re-read live GitHub before creating another branch. If an open PR appears, finish/reconcile it first unless the user explicitly directs parallel work. With no open PR, continue Issue #205 by proving one remaining effective visual/cascade defect from live runtime/source evidence and deliver it as one atomic reviewable slice.
