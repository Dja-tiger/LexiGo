# Visual regression quality gate

## Scope

The release gate captures deterministic full-page screenshots for the critical LexiGo surfaces:

- home;
- lesson composer;
- dictionary;
- progress;
- calendar dialog.

Each surface is rendered in three Chromium viewport contracts:

- compact: `390 × 844`;
- medium: `768 × 1024`;
- desktop: `1440 × 900`.

The resulting 15 PNG files are versioned under:

```text
frontend/e2e/visual-regression.spec.ts-snapshots/
```

The suite uses a pinned Playwright container, light color scheme, Russian locale, reduced motion, fixed API fixtures, disabled transitions and `deviceScaleFactor=1`. These constraints keep snapshots reproducible across the self-hosted runners.

## Normal CI mode

Normal pull request and `main` CI must run:

```bash
npm run test:e2e:visual
```

This command compares the current rendering with committed baselines. CI must never update snapshots automatically in normal operation.

A mismatch blocks merge and stores expected, actual and diff images in the Playwright diagnostics artifact.

## Controlled baseline update

A baseline update is valid only when the visual change is intentional and described in the pull request.

1. Build the production frontend with the same locked dependencies used by CI.
2. Run the pinned Playwright image through `scripts/ci/frontend-container.sh`.
3. Execute:

   ```bash
   npm run test:e2e:visual:update
   ```

4. Review every changed PNG. Do not approve an entire snapshot directory without inspecting compact, medium and desktop outputs separately.
5. Confirm that the change does not hide overflow, clipped controls, missing focus targets, fallback screens or loading skeletons.
6. Commit the updated PNG files in the same pull request as the intentional UI change.
7. Run `npm run test:e2e:visual` again without `--update-snapshots` before merge.

Snapshot updates caused only by an unpinned browser, host font differences, animation timing or nondeterministic test data are defects in the test environment and must not be accepted as UI changes.

## Failure diagnostics

On failure, CI extracts:

```text
playwright-report/
test-results/
e2e/visual-regression.spec.ts-snapshots/
```

Use the Playwright report to compare expected, actual and diff images. A pixel threshold is a tolerance for antialiasing noise, not permission to ignore structural differences.

## Accessibility relationship

Visual snapshots complement, but do not replace, semantic checks. The separate blocking axe suite rejects WCAG `critical` and `serious` violations for primary routes, authentication states and the calendar dialog. Keyboard and focus-management suites remain independent release gates.
