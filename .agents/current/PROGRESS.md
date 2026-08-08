# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Prior Active Lesson Issue #74 slice #435 is fully delivered through exact-SHA main CI and Stage/public validation.
- Completed-task reset #437 passed Agent Docs CI and restored canonical `.agents/current/**` templates.
- Repository-memory reconciliation #439 introduced a truncated PR #402 squash SHA; clean correction #440 restored the exact GitHub merge SHA and preserved the verified PR #428 product SHA.
- #440 merged as `100684cd0512c65fcb82585d4dfce4f7d69c2ef4`; exact-SHA main CI #3034 / run `31236793082` succeeded.
- Concurrent PR #441 then merged an empty tree-equivalent docs commit `faf466e56e05b6d365b8a0acf14d63a25140a36b`: its tree SHA is exactly the same `8e944c4bb8157938da631c426371da0fed824252` as #440, so it changes no repository file or product fact.
- Residual Phrases inventory confirms live topic-chip buttons and filter radio-row labels retain 36px painted height.
- Phrases catalog actions and shared catalog-kind buttons retain 44px minimums without a coarse-pointer 48px effective-target owner.
- Native Phrases filter select retains 44px minimum height and cannot rely on pseudo-element hit slop.
- Existing Phrases search-clear control is already independently covered by the delivered `phrases-search-clear-touch-targets.css` owner and browser acceptance.
- Compact widths below 768px intentionally hide the desktop filter sidebar; coarse radio-row evidence therefore requires a wider touch viewport rather than a false 390px/320px expectation.

### Finding

The `/phrases` catalog still contains live controls below the Issue #74 44/48px effective-target contract after the earlier search-clear-only slice.

### Root cause

The Figma-backed Phrases catalog intentionally uses compact 36px chips/radio rows and legacy 44px actions. Those painted dimensions predate the later Issue #74 pointer-modality target contract. In addition, the horizontal topic scroller clips its cross axis, so a nominal pseudo target is not valid unless the scrollport reserves enough transparent gutter.

### Changed files

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y test collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Exact final replay branch is based on live `main` `faf466e56e05b6d365b8a0acf14d63a25140a36b`; its parent tree is byte-identical to the already validated #440 tree.
- Scope review confirms no backend, dependency, lockfile, snapshot or semantic catalog changes are required.
- Target geometry preserves topic-pill document position by balancing extra scrollport top padding with a compensating negative margin.
- Coarse-only radio spacing/select geometry is limited to touch layouts where transparent pseudo hit slop cannot safely satisfy the contract alone.
- Acceptance distinguishes hidden compact filter sidebar from visible desktop/tablet controls and includes 820px coarse touch evidence.
- The new browser spec is explicitly present in both `test:e2e:ui` and `test:e2e:a11y` collections.

### Checks failed

- None yet on the final replay candidate; immutable-head PR CI has not run.

### Current branch head

- Resolve from live branch after the final replay tree is committed.

### Next action

Commit the bounded seven-file final replay candidate, verify exact branch diff/read-back and unchanged main, open Draft PR, record the PR number in current-task docs, then require complete immutable-head CI. Any deterministic browser or visual failure must be classified from retained evidence before changing production CSS or test expectations.
