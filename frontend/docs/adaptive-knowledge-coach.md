# Adaptive Knowledge Coach — OpenPencil production handoff

This document records the active production design/handoff contract for LexiGo.

## Active source of truth

OpenPencil is the only active design and handoff source.

- editable source: `design/openpencil/LexiGo Design System.op`;
- detailed imported/native screen inventory: `docs/figma/openpencil-screen-map.json`;
- canonical production route/state selection: `docs/figma/openpencil-production-handoff.json`;
- human-readable handoff: this document.

The repository still preserves historical Figma file metadata, `.fig` snapshots and legacy node IDs. They are archival provenance for already-delivered work only. They are not a live dependency, are not required for future implementation or acceptance, and must not block development because of Figma plan, quota, MCP or cloud availability.

`docs/figma/openpencil-production-handoff.json` is the machine-readable route/state contract. It must be updated in the same atomic slice whenever a production source is promoted or superseded. `docs/figma/openpencil-screen-map.json` remains the broader detailed inventory and retains legacy Figma IDs where useful for provenance.

Concept, exploration, prototype and historical variants are reference-only unless explicitly promoted into the production handoff manifest. Historical artifacts are preserved until their references and useful state coverage have been reviewed; preserving them does not grant production ownership.

## Canonical production route map

A route/state has one canonical mobile source and one canonical desktop source. Explicit theme/state variants may exist, but they do not create a second production owner. A token-derived appearance uses the same hierarchy and geometry with semantic variables.

| Route / state | Canonical mobile OpenPencil source | Canonical desktop OpenPencil source | Appearance/state rule | Delivery |
| --- | --- | --- | --- | --- |
| `/` authenticated Home | `home.mobile.dark` → `fig_2287` | `home.desktop.light` → `fig_2338` | opposite appearance is semantic-token derived | #522 / PR #523 merged |
| `/` Guest Home | `firstuse.guest.mobile.light` → `n2` | `firstuse.guest.desktop.light` → `n321` | explicit Light/Dark First Use matrix | #201 / PR #556 merged |
| `/onboarding` First Use | `firstuse.onboarding.mobile.light` → `fig_4282` | `firstuse.onboarding.desktop.light` → `n299` | diagnostics, resume, skip, complete, loading, error and recovery use reviewed `firstuse.*` active screens | #201 / PR #556 merged |
| `/learn` Lesson Composer | `learn.mobile.recommended` → `fig_6826` | `learn.desktop.full` → `fig_6621` | manual mobile composer remains `learn.mobile.manual`; Light/Dark share ownership | #525 / PR #526 merged |
| `/lesson/active` Active Lesson | `lesson.mobile.recall.default` → `fig_3247` | `lesson.desktop.study.light` → `fig_3132` | Recall/Choice/Offline variants remain in the same active matrix | #528 / PR #529 merged |
| `/progress` | `progress.mobile.light` → `fig_3730` | `progress.desktop.light` → `fig_3564` | mobile Dark explicit; desktop Dark token-derived | #515 / PR #517 merged |
| `/dictionary` | `dictionary.mobile.light` → `fig_4008` | `dictionary.desktop.light` → `fig_3833` | Dark token-derived; empty state remains separate shared-state evidence | #531 / PR #532 merged |
| `/words/[id]` | `word.mobile.dark` → `fig_3982` | `word.desktop.dark` → `fig_3780` | Light token-derived | #533 / PR #535 merged |
| `/phrases` | `phrases.mobile.catalog.light` → `fig_7281` | `phrases.desktop.catalog.light` → `fig_7099` | explicit Light/Dark catalog/search/empty variants retain one route owner | #536 / PR #538 merged |
| `/phrases/[slug]` | `phrase.mobile.detail.dark.daily` → `fig_7255` | `phrase.desktop.detail.dark.technical` → `fig_7046` | Light/Dark and content-topic variants retain one route owner | #540 / PR #541 merged |
| `/profile` authenticated | `profile.mobile.light` → `fig_4305` | `profile.desktop.light` → `fig_4157` | Dark token-derived | #542 / PR #543 merged |
| `/scenarios` catalog | `fig_3465` — Mobile / Scenario Catalog / Light | `fig_3297` — Desktop / Scenario Catalog / Light | mobile Dark is explicit in the active `.op` | #24 slice / PR #228 merged |
| `/scenarios/[slug]` | `fig_3656` — Mobile / Scenario / Light | `fig_3524` — Desktop / Scenario / Dark | mobile Light/Dark explicit; desktop approved Dark composition | #196 / PR #221 merged |

The Scenario rows are verified directly against the active repository-owned `.op`; they predate the compact detailed `screens` inventory and therefore use direct `fig_*` references in the production manifest.

## Canonical Lesson Result state matrix

Lesson Result is a state of `/lesson/active`, not a second route owner. Its old design-gap status is resolved: Issue #194 was delivered by PR #209 and the active OpenPencil document contains all ten production frames.

| State | Mobile OpenPencil source | Desktop OpenPencil source | Historical Figma provenance |
| --- | --- | --- | --- |
| Complete | `fig_3072` — Mobile / Result / Complete | `fig_2910` — Desktop / Result / Complete | `217:5`, `217:10` |
| Daily Goal | `fig_3042` — Mobile / Result / Daily Goal | `fig_2869` — Desktop / Result / Daily Goal | `217:6`, `217:11` |
| Next Block | `fig_3011` — Mobile / Result / Next Block | `fig_2828` — Desktop / Result / Next Block | `217:7`, `217:12` |
| Due Review | `fig_2981` — Mobile / Result / Due Review | `fig_2787` — Desktop / Result / Due Review | `217:8`, `217:13` |
| Sync Pending / Dark | `fig_2951` — Mobile / Result / Sync Pending / Dark | `fig_2746` — Desktop / Result / Sync Pending / Dark | `217:9`, `217:14` |

OpenPencil matrix owner: `fig_2745` — `Lesson Result / Production Matrix` on `14 — Active Lesson Screens`.

The result keeps objective recall, supported recognition and activity as separate evidence concepts, exposes one primary action per state, creates a distinct next block rather than reopening the completed block, and treats due review as the primary fallback when no new block is available. Sync-pending state confirms local persistence without permitting duplicate submission.

## Shared system states

The detailed OpenPencil inventory preserves the canonical shared representatives:

- Home loading Dark: `state.home.loading.dark` → `fig_4258`;
- Dictionary empty Light: `state.dictionary.empty.light` → `fig_4234`;
- shared error Dark: `state.error.dark` → `fig_4222`;
- desktop offline Dark: `state.offline.desktop.dark` → `fig_4104`;
- Active Lesson offline: `lesson.mobile.recall.offline` → `fig_3193`.

These states supplement route ownership; they do not create alternate route graphs.

## Resolved former design gaps

The three historically tracked handoff gaps are no longer design blockers:

- Lesson Result — Issue #194 / PR #209; ten OpenPencil frames are explicitly mapped above;
- Phrases — catalog #536/#538 and detail #540/#541 are delivered and mapped to explicit OpenPencil nodes;
- Guest Home / First Use — Issue #201 / PR #556 delivered the reviewed OpenPencil-native `firstuse.*` mobile/desktop Light/Dark matrix.

Future work may still change these surfaces through a new explicit product/design Issue. It must not reopen the old gap merely because historical Figma identifiers remain in provenance fields.

## Route-selection rules

- `docs/figma/openpencil-production-handoff.json` is authoritative for which route/state sources are production selections.
- `docs/figma/openpencil-screen-map.json` is authoritative for the detailed imported/native screen inventory and stable OpenPencil IDs that it contains.
- Direct `opNode` entries in the production manifest must resolve to actual frame nodes in `design/openpencil/LexiGo Design System.op` with matching name and geometry.
- `activeScreens` keys are reviewed OpenPencil-native First Use sources; they are not fallback placeholders.
- Concept/exploration/prototype variants are reference-only until the production manifest explicitly promotes them.
- A token-derived appearance is the same production composition rendered through semantic variables; it is not permission to select another layout.
- Historical Figma file keys, page IDs and node IDs are provenance only.
- Archive review may remove obsolete variants only after links/state coverage are checked; archive cleanup must not mutate the selected production contract accidentally.

## Production ownership

The design handoff must not introduce a second product graph.

- `RouteChrome` remains the only owner of primary route navigation outside focused First Use and Active Lesson surfaces.
- `LexigoBootstrappedApp` remains the sole session restoration, account runtime and dynamic route-entry owner.
- `LexigoGuestHomeApp` owns unauthenticated `/` and does not load account progress, scheduler state or fake authenticated status.
- `LexigoHomeApp` owns authenticated Home progress/active-lesson reads, next-best-action presentation and creation of a lesson through the existing API.
- `LexigoOnboardingApp` owns authenticated First Use state and the server onboarding contract; `frontend/app/onboarding/page.tsx` is the canonical App Router page owner.
- `LexigoLearnApp` owns `/learn`; `LexigoActiveLessonApp` owns `/lesson/active`, including result continuation and recovery.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`.
- `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `LexigoProgressApp` owns `/progress`; authenticated `LexigoProfileApp` owns `/profile` summary/preferences.
- `LexigoScenarioCatalogApp` and `LexigoScenarioApp` own `/scenarios` and `/scenarios/[slug]` respectively.
- `LexigoPremiumApp` remains only a narrow compatibility fallback for remaining guest/auth legacy states and is not a canonical owner of the extracted routes above.
- `ReviewOutboxRuntime`, Service Worker and appearance bootstrap remain persistent shared owners.
- The backend remains authoritative for lesson position, completion, review persistence and onboarding mutation state.

## Application Shell contract

Desktop from 1024 CSS pixels uses a persistent navigation rail. Compact mobile uses an edge-to-edge bottom navigation bar with safe-area padding. Focus order, route-focus restoration, browser history, scroll restoration and minimum interaction-target contracts remain blocking.

Light and Dark appearances use the same information hierarchy. Optional transitions are disabled under `prefers-reduced-motion: reduce`.

First Use is an intentional focused-route exception: Guest Home and onboarding remove ordinary route chrome from layout and the accessibility tree while their dedicated route island is active; the global navigation owner itself is not duplicated or refactored.

## Home contract

Authenticated Home owns one next-best action and a compact evidence surface. It does not duplicate Learn, Dictionary and Progress as secondary feature cards.

The next action resolves in this order:

1. resume the active lesson;
2. review due material;
3. start recommended new study;
4. open manual lesson configuration.

The desktop and mobile production sources preserve this order and keep the primary action above mobile bottom navigation.

Unauthenticated `/` is a separate truthful Guest Home surface: it explains the product and routes into authentication/onboarding or the existing guest-compatible demo path without synthesizing progress or account scheduler data.

## Delivery status

The repository-side design delivery represented by this handoff is complete for the currently canonical surfaces:

- Home parity: Issue #522 / PR #523 — merged;
- Learn Composer parity: #525 / #526 — merged;
- Active Lesson parity: #528 / #529 — merged;
- Lesson Result: #194 / #209 — merged;
- Progress parity: #515 / #517 — merged;
- Dictionary parity: #531 / #532 — merged;
- Word Detail parity: #533 / #535 — merged;
- Phrases catalog parity: #536 / #538 — merged;
- Phrase Detail parity: #540 / #541 — merged;
- Profile parity: #542 / #543 — merged;
- First Use / Guest Home design gate: #201 / #556 — merged;
- Scenario catalog slice: #24 / #228 — merged slice; parent product Issue #24 can remain open for broader reconciliation;
- Scenario Lesson UI: #196 / #221 — merged;
- shared Dictionary Empty visual owner: #545 / #546 — merged.

Issue #203 owns this source-of-truth reconciliation. Once its manifest, documentation and executable contract are merged and green, historical live-Figma synchronization is no longer an acceptance gate because Figma is explicitly archival provenance under the 2026-08-19 migration.

Issue #205 remains the umbrella final visual-parity audit; it does not change source ownership defined here.

## Executable handoff contract

`scripts/ci/agent_docs_scope_test.py` validates the design handoff from the complete repository checkout. The contract must fail closed when:

- the active design tool/document no longer identify OpenPencil;
- a required canonical route/state key disappears or is duplicated;
- a manifest entry references a missing `screens`/`activeScreens` key;
- a direct OpenPencil node is missing from the active `.op` or its frame name/geometry drifts;
- Lesson Result loses any of its ten canonical OpenPencil frames;
- either maintained human handoff again declares Figma to be the active production design source.

The contract is structural, not paragraph-format dependent. It validates semantic keys, nodes, names, geometry and source ownership.

## Verification gates

A runtime implementation that changes one of these surfaces is not complete until all applicable gates pass:

- source contracts, lint, typecheck, unit tests and production build;
- desktop and mobile browser geometry;
- Light/Dark computed appearance;
- 120–200% text reflow without horizontal overflow;
- keyboard navigation and blocking accessibility audit;
- reduced-motion computed styles;
- route bundle and low-end mobile performance budgets;
- deterministic Linux visual baselines after manual review;
- deployed Stage review for runtime-changing delivery.

This Issue #203 maintenance slice changes no runtime, CSS, API, `.op` content or visual baselines. Its own blocking evidence is the executable OpenPencil handoff contract plus full immutable-head CI.
