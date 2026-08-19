# Current Task

## Identity

- Issue: #608
- Branch: `test/issue-608-route-keyboard-focus-parity`
- Base SHA: `2412dce6a0cbb71c9a781829c09416e531efc502`
- Head SHA: resolve from live branch ref
- PR: #609 (Draft)

## Objective

Close the automated keyboard/focus dimension of umbrella Issue #205 with one fail-closed consolidated route-by-route contract covering all ten canonical product routes at the two primary navigation topologies: compact `390×844` and desktop `1440×1024`, explicit Light/Dark.

## Scope

- add a dedicated consolidated Playwright owner for Issue #608;
- reuse deterministic route fixtures and canonical route-owner semantics already used by route parity/browser-zoom audits;
- drive focus with real sequential `Tab` / `Shift+Tab` input rather than programmatic focus as the proof;
- verify the representative route control is reachable, rendered, enabled, outside inert/aria-hidden ownership and exposes a painted `:focus-visible` indicator;
- verify focus geometry is inline-contained and not obscured by ordinary RouteChrome after browser auto-scroll;
- verify no positive tabindex and no hidden/inert/disabled stops are entered along the audited path;
- verify focused routes suppress ordinary RouteChrome and ordinary routes expose the expected compact/mobile or desktop/rail owner;
- capture structured JSON focus traces and runtime errors;
- register the consolidated owner in the blocking accessibility CI command;
- add a fail-closed source/collection contract so route count, viewport/theme matrix and keyboard evidence cannot silently disappear.

## Non-goals

- no runtime CSS/React redesign in the audit PR;
- no backend/API/schema/session mutation;
- no OpenPencil/Figma mutation;
- no replacement or weakening of `frontend/e2e/accessibility-keyboard.spec.ts`;
- no duplication of complete dialog-trap, Lesson Composer roving-control or Active Lesson state-machine coverage;
- no physical-device, VoiceOver, TalkBack, NVDA or JAWS sign-off; manual device evidence remains #461;
- no tolerance widening, route skipping or `.focus()`-only keyboard proof.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/route-keyboard-focus-parity.spec.ts`
- `frontend/components/keyboard-focus-collection-contract.test.ts`
- `frontend/package.json`

## Prohibited paths

- production frontend runtime/CSS/component files;
- backend/database/API files;
- deployment/workflow files;
- `design/**` and Figma/OpenPencil source files;
- existing reviewed visual baselines and snapshots.

## Runtime owners

- existing canonical route islands and shared RouteChrome remain unchanged;
- `frontend/e2e/accessibility-keyboard.spec.ts` remains the specialized keyboard interaction/axe owner;
- `frontend/e2e/route-tablet-parity.spec.ts` / `route-browser-zoom-parity.spec.ts` remain canonical route fixture/ownership precedents;
- `docs/keyboard-accessibility-checklist.md` and `docs/route-focus-accessibility-checklist.md` remain release-policy owners.

## Documentation owners

- `.agents/current/**` records only current Issue #608 execution evidence.

## Invariants

- audit is evidence/test-only first;
- any genuine product keyboard/focus defect becomes a separate atomic runtime Issue/PR before audit approval;
- no assertion may be weakened to make a failing route green;
- compact and desktop topology are explicit runtime viewports, not invented design nodes;
- reduced motion remains enabled deterministically;
- existing accessibility, route-focus, visual and browser suites remain green.

## Acceptance criteria

- all ten canonical routes execute at `390×844` and `1440×1024` in explicit Light/Dark;
- representative route control is reached by real sequential Tab input;
- Shift+Tab returns to the preceding audited stop;
- audited stops are rendered, enabled, not inert/aria-hidden and have `:focus-visible` with painted indicator;
- focus ring/target geometry remains inside viewport/container and is not obscured by RouteChrome;
- positive tabindex is absent;
- ordinary routes expose exactly one expected navigation owner; focused routes expose none;
- runtime error capture is empty;
- existing specialized keyboard/axe suites are not weakened;
- full immutable-head CI passes; reviews/threads/main drift are clean; squash merge uses expected-head protection;
- no Stage redeploy for a test/evidence-only merge.

## Required checks

- frontend lint/typecheck/unit/source-contract;
- blocking `test:e2e:a11y` including the new consolidated owner;
- full immutable-head repository CI before merge;
- final diff/allowed-path audit and review-thread audit.

## Risks

- native browser Tab policy differs by engine/platform, so deterministic consolidated traversal is intentionally owned once by desktop Chromium while existing cross-browser keyboard/axe coverage remains authoritative for engine diversity;
- routes with long content may auto-scroll, so geometry assertions must distinguish viewport visibility from route-owner containment without hiding real fixed/sticky overlap;
- onboarding installs a dedicated deterministic API and must not leak fixture ownership across tests.

## Rollback

Revert the test/evidence squash merge. No runtime data, API, deployment or design rollback is required.
