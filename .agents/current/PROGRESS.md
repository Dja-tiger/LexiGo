# Current Task Progress

## 2026-08-09 Europe/Moscow

### Verified

- Live repository `main` at branch creation: `f472865cdd91fde04a9ff0c26dc34fa283f725bb`.
- Canonical guest `/progress` is owned by `LexigoProgressApp` and renders `Войти и открыть прогресс` as `.lx-button.primary` inside `.lx-empty`.
- Existing callback navigates to `/profile?session=required&return_to=%2Fprogress`.
- `premium-ui.css` owns the button at `min-height: 44px`; `.lx-empty .lx-button` changes placement only.
- Authenticated `ProgressEvidenceDashboard` controls already have explicit Issue #74 ownership from PR #428 and are outside this slice.
- `system-state-touch-targets.css` scopes only async-state actions and does not cover this direct guest CTA.
- Home path CTA candidates were rejected because canonical adaptive Home hides `.lx-home-paths`; Home rail was rejected because the later accessibility layer restores the final rail target to `48px`.

### Finding

The single canonical guest Progress login CTA satisfies the `44px` fine-pointer minimum but has no live owner for the `48px` coarse-pointer effective target.

### Root cause

The guest empty state reuses the canonical base `.lx-button` presentation. Progress target work in PR #428 was correctly scoped to the authenticated dashboard, so this separate guest branch retained only the shared `44px` button geometry and never received a coarse-pointer effective target owner.

### Changed files

- `frontend/app/progress-guest-login-touch-targets.css` — route-scoped paint-inert 44/48px effective target owner.
- `frontend/app/layout.tsx` — imports the interaction layer after Progress presentation owners.
- `frontend/components/progress-guest-login-touch-target-source.test.ts` — fail-closed runtime/paint/import/collection contract.
- `frontend/e2e/progress-guest-login-touch-targets.spec.ts` — explicit guest desktop Chromium, Android Chromium and iOS WebKit real-hit/callback proof.
- `frontend/package.json` — registers the proof in blocking UI and accessibility collections.
- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, `.agents/current/EXECUTION.md` — current atomic task harness.

### Checks passed

- Branch created from the exact verified `main` SHA.
- Product writes were read back from the explicit feature branch.
- CSS read-back confirms block-only transparent pseudo hit ownership with `44px` fine / `48px` coarse variables.
- Layout read-back confirms the interaction layer loads after `progress-evidence-layout.css` and before later unrelated route presentation.
- Package read-back confirms the browser spec is present in both blocking UI and accessibility commands.
- Browser source isolates guest state with `context.clearCookies()` plus `installQualityGateAPI(..., { authenticated: false })`.
- Source-contract assertion was hardened to stable return-to semantics rather than brittle regex-source escaping.

### Checks failed

- None observed yet.
- No local repository checkout is available in this environment, so lint/type/unit/browser execution is not claimed locally; GitHub CI is the execution source of truth.

### Current branch head

Resolve from the live `fix/issue-74-progress-guest-login-touch-target` branch ref after final harness writes.

### Next action

Read back the completed harness, re-verify live `main`, compare the branch against the exact base, confirm only the eight declared paths changed, open the atomic PR, then inspect and address all immutable-head CI results before merge.