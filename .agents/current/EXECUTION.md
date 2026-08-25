# Current Task Execution

## Task

- Branch: `fix/global-error-semantic-palette`
- Base SHA: `2ceb77a682710aeaed3b27f0f62ea26c0c54af51`
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### Production-safe root-boundary reachability audit

Purpose:

Prove that `frontend/app/global-error.tsx` is a distinct production owner before changing presentation rather than treating raw legacy colors as sufficient evidence.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.issue-261-css-specificity.md`
- `.agents/PROJECT_STATE.md`

Version or verification date:

2026-08-25.

Inputs:

- live protected `main`;
- live open PR/Issue state;
- `frontend/app/global-error.tsx`;
- `frontend/app/layout.tsx`;
- Next.js 16.3.1 package/runtime semantics;
- active OpenPencil screen map and Issue #641 reconciliation.

Files inspected:

- `frontend/app/global-error.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/design-tokens.css`
- `frontend/app/appearance.css`
- `frontend/lib/appearance-preference.ts`
- `docs/figma/openpencil-screen-map.json`
- `.agents/reconciliations/issue-641.md`

Actions performed:

- confirmed `global-error` is the Next App Router root layout/template fallback and replaces the normal root layout when active;
- verified fixed inline dark-era paint and the lack of guaranteed normal-layout styling/bootstrap ownership;
- searched live Issues and confirmed no duplicate atomic Issue exists;
- separated shared OpenPencil Error provenance from the distinct root fallback runtime owner.

Commands or procedures:

GitHub live reads/search plus current official Next.js App Router global-error/CSS semantics verification.

Artifacts produced:

Issue #692 and the explicit scope/non-goals/acceptance matrix in `.agents/current/TASK.md`.

Result:

A separate production-reachable root bootstrap palette defect was proven and isolated under parent #205.

Failures:

None in repository pre-flight.

Root cause:

The emergency root fallback predates Foundation appearance ownership and retained self-contained fixed dark paint even though replacing the root layout means it cannot implicitly rely on normal layout CSS/bootstrap.

Fallback:

No product write would have been made if reachability, ownership or duplicate-Issue checks had failed.

Limitations:

The active OpenPencil shared Error state is semantic/product provenance, not evidence that the root fallback is the same component or should reuse its raster baseline.

Reusable lesson:

A Next.js `global-error` boundary is a bootstrap owner, not a normal descendant of the root layout. Audit its styling and appearance dependencies independently before claiming visual parity.

### Semantic root-error presentation ownership

Purpose:

Remove fixed legacy paint while preserving root failure/recovery behavior and existing geometry.

Instruction source:

- Issue #692
- `.agents/AGENTS.issue-261-css-specificity.md`
- existing semantic `ApplicationErrorBoundary` delivery #687/#688.

Version or verification date:

2026-08-25.

Inputs:

- Foundation `--ak-color-*` tokens;
- explicit Light/Dark overrides;
- existing `subscribeAppearanceRuntime()` lifecycle;
- existing root error markup/recovery logic.

Files inspected:

- `frontend/app/error-boundary.css`
- `frontend/app/design-tokens.css`
- `frontend/app/appearance.css`
- `frontend/lib/appearance-preference.ts`

Actions performed:

- made `global-error.tsx` explicitly import `design-tokens.css`, `appearance.css` and dedicated `global-error.css`;
- subscribed the root fallback to the existing appearance runtime in an effect with cleanup;
- replaced inline presentation with route-unique root-error classes;
- created `global-error.css` using canvas/surface/text/muted/weak/primary/primary-soft semantic ownership and `color-mix` borders/focus treatment;
- preserved `<html lang="ru">`, alert semantics, localized copy, `reset()`, version-mismatch cleanup/reload and Home navigation.

Commands or procedures:

Explicit branch file updates with immediate path/head/main read-back after every write.

Artifacts produced:

- `frontend/app/global-error.tsx`
- `frontend/app/global-error.css`

Result:

Known legacy root-error palette literals are no longer owned by the root fallback presentation.

Failures:

None observed in source implementation.

Root cause:

N/A beyond the verified product defect above.

Fallback:

Revert the atomic presentation/test slice; recovery state machines were not altered.

Limitations:

A local repository clone/test run could not be performed from the sandbox because external DNS resolution for `github.com` is unavailable. Immutable-head GitHub CI remains authoritative.

Reusable lesson:

For an emergency root replacement, import only the semantic dependencies it actually needs; do not pull the full normal application cascade into the fallback merely to reuse button classes.

### Hydration-safe computed-style evidence

Purpose:

Prove final Light/Dark semantic paint in Chromium/WebKit without repeating the #689 React/Next hydration race.

Instruction source:

- `.agents/AGENTS.base.md`
- #689/#690 recovery lesson recorded in `.agents/PROJECT_STATE.md`;
- `frontend/e2e/application-error-boundary-appearance.spec.ts` existing atomic fixture pattern.

Version or verification date:

2026-08-25.

Inputs:

- exact text of `frontend/app/global-error.css`;
- explicit Light/Dark appearance preference;
- browser-computed token and `color-mix` resolution.

Files inspected:

- `frontend/e2e/application-error-boundary-appearance.spec.ts`
- `frontend/components/application-error-boundary-semantic-css-ownership.test.ts`

Actions performed:

- extended the existing blocking UI appearance spec rather than creating a new uncollected suite;
- loads the exact `global-error.css` text in Node;
- injects that stylesheet, connects a synthetic root-error owner, samples final computed styles and removes style/fixture inside one `page.evaluate()` browser task;
- never replaces or corrupts the React-owned body;
- compares canvas/surface/text/muted/weak/primary/primary-soft and semantic mixed borders for both explicit Light and Dark;
- added a fail-closed source contract protecting dependency imports, legacy-color absence, recovery invariants, E2E collection and atomic fixture lifecycle.

Commands or procedures:

Source-contract + Playwright computed-style proof design; final execution delegated to immutable-head CI because local network/dependency checkout is unavailable.

Artifacts produced:

- `frontend/components/global-error-semantic-ownership.test.ts`
- updated `frontend/e2e/application-error-boundary-appearance.spec.ts`.

Result:

Regression protection now fails closed on semantic ownership drift and is designed to exercise the same iOS WebKit shard that exposed the earlier hydration race.

Failures:

Local `git ls-remote https://github.com/Dja-tiger/LexiGo.git ...` failed with `Could not resolve host: github.com` inside the sandbox; no repository state changed.

Root cause:

Sandbox DNS/network restriction, not repository or product code.

Fallback:

Use GitHub Actions immutable-head CI for lint/typecheck/unit/build/browser evidence and inspect exact logs/artifacts on any failure rather than blind rerun.

Limitations:

The synthetic browser proof verifies exact stylesheet computed semantics against the live token cascade; it intentionally does not force a real root-layout crash or create/update visual fingerprints.

Reusable lesson:

Synthetic SPA/root-boundary CSS evidence must connect, sample and clean up atomically. Loading the exact stylesheet text plus browser-resolved semantic tokens gives deterministic cascade evidence without mutating React-owned document structure across scheduler boundaries.
