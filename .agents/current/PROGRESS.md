# Current Task Progress

## 2026-08-26

### Verified live state

- Repository: `Dja-tiger/LexiGo`.
- Protected `main`: `259a3e3b13e8db59e3c729621542dea57362fd13`; no drift through the baseline import/restore sequence.
- Draft PR #696 `fix(calendar): semanticize reminder dialog palette` is the only open PR.
- Issue #695 is the active regression slice; parent visual-parity audit #205 remains open.
- PR branch: `fix/issue-695-calendar-dialog-semantic-palette`.
- PR hygiene before final CI: no submitted reviews, no review threads, branch `behind_by=0`.

### Runtime change

- `frontend/app/calendar-reminders.css` now consumes Foundation semantic palette/elevation owners for the globally reachable Calendar reminder card/dialog/backdrop/forms/weekdays/preview/providers/privacy/status.
- Fixed legacy forced-dark native control ownership with `color-scheme: inherit`; geometry, storage, Google/Apple integration, focus, touch and reduced-motion behavior remain outside the change.
- No presentation hex literals, `rgba(` literals or `color-scheme: dark` remain in the Calendar stylesheet.
- `frontend/components/calendar-reminder-semantic-css-ownership.test.ts` fails closed on legacy palette ownership and requires the browser proof in blocking `test:e2e:ui`.
- `frontend/e2e/calendar-dialog-appearance.spec.ts` opens the production Calendar dialog under explicit Light and Dark, samples actual computed paint, verifies semantic token ownership, no horizontal overflow, and equal dialog geometry.
- Deterministic Calendar storage seeds all seven custom weekdays; the test asserts exact selected count rather than an ambiguous `.first()` locator.

### Authoritative CI classification

- CI #4192 / run `32912866102` on head `febfe3455cedc3946749783b4aee4ffe7d0cf471`: core/backend/CSP/performance/accessibility/PWA/SW green; Visual failed only the three intended Calendar baselines; new UI proof failed because recurrence `selectOption("custom")` stalled despite a visible combobox. The appearance-only proof was changed to seed the production Calendar storage key instead of exercising unrelated recurrence interaction.
- CI #4194 / run `32919395226` on head `685e6e699ac13b207f686fcc444276b9bc9184cb`: the first locator failure was removed. New exact failure was `select.colorScheme === "normal"` while the test expected exact Light/Dark. Runtime source correctly uses inherited native scheme; acceptance was corrected to reject forced legacy `"dark"` while semantic surface/text paint is asserted independently.
- CI #4195 / run `32920176432` on head `cea47eeaa75c9a8fece711698f9758cd19f539db`: Calendar proof still failed because `installInitialAppearance()` wrote `light` in an init script on every reload, undoing the explicit Dark preference. There were unrelated transient `system-states`/`lesson-result` failures outside the PR diff.
- Test fix `95a9532215ca6f43c302f9a71e7d771f044c70e3` only initializes Light when the appearance key is absent, so explicit Dark survives reload; it also requires exactly seven selected weekdays.
- CI #4196 / run `32940418905` on immutable head `95a9532215ca6f43c302f9a71e7d771f044c70e3`: Frontend core, backend unit/security, backend integration, iOS PWA dictionary, Lesson completion, CSP, Dictionary smoke, accessibility, controlled service worker, performance budgets, UI shard 1 and UI shard 2 all passed. The earlier unrelated transient failures did not reproduce.
- CI #4196 Visual job `98090531494` failed only the three expected Calendar Linux snapshots. No other visual case failed.

### Reviewed Linux baseline provenance

Authoritative reviewed Calendar actuals were stable across repeated Linux visual artifacts, including #4196 artifact `9596559565`:

- compact: `e76d050b3d94d0936259b55a4a269cb8418957de5c4494fdce92c39565c2b0e9`
- medium: `f8fcc529b4f9888f1a9ef659b478d39fcb2aee56068799c8c3b0ded38b41383a`
- desktop: `c93fda85f12a24ead3fc4c5c895641a6c19fd006dd9d211ecd4d9162b42efda5`

Manual/decoded review established the intended delta as legacy dark Calendar paint -> Foundation semantic Light paint, with stable modal geometry, field grid, provider layout and clipping. Repeated decoded comparisons produced zero pixel drift between reviewed runs.

The repository-owned snapshot workflow was temporarily scoped to #695 only after UI1/UI2 were green. Push run `32941489467`, job `98093195331` completed successfully, including:

- visual regeneration;
- exact changed-path verification requiring only the three Calendar PNGs;
- exact SHA-256 verification against the reviewed hashes above;
- bot commit `b4da0a4fff2d383aee70bf350e116c7e2785b393`.

`4f6880c8978bb614559fcf8e49d829896f0bddb3..b4da0a4fff2d383aee70bf350e116c7e2785b393` contains exactly:

- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-compact-linux.png`
- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-medium-linux.png`
- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-desktop-linux.png`

The temporary workflow modification was then restored in commit `33a63cd3ca274c928fa4ee797fe82d414ab2e242`; its blob is again `d4cde7f83d5f8b79f2d5c8653ead7aefa6dfccae`, byte-identical to `main`. `.github/workflows/update-visual-snapshots.yml` is absent from the PR diff.

### Current PR diff before final candidate CI

Expected paths only:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/calendar-reminders.css`
- `frontend/components/calendar-reminder-semantic-css-ownership.test.ts`
- `frontend/e2e/calendar-dialog-appearance.spec.ts`
- `frontend/e2e/visual-regression.spec.ts-snapshots/calendar-dialog-visual-{compact,medium,desktop}-linux.png`
- `frontend/package.json`

### Next action

Treat the Agent Harness evidence commit as the final candidate head. Require one full immutable-head CI with normal visual comparison green. Then recheck `main` drift, reviews/threads and changed paths; mark PR #696 Ready, squash-merge using the expected head SHA, require exact-main CI and exact-runtime Stage/public browser validation. After successful runtime delivery, create a separate docs-only reconciliation PR to update `.agents/PROJECT_STATE.md` and reset `.agents/current/**`.