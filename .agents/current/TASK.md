# Current Task

## Identity

- Issue: #577 `[High][Frontend][Design Runtime] Убрать stale legacy UI при Home → Dictionary/Learn, исправить Materials tabs и Reminder`
- Parent: #205
- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Runtime reviewed-source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`
- First evidence-approval head: `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25`
- PR: #579 Draft

## Objective

Remove transition-dependent legacy presentation ownership from compact Home → Dictionary/Learn, keep Materials stable at 390×844, and replace the shared Reminder legacy dark/blue presentation with current semantic tokens. Prove direct/client/reload/history equivalence in Chromium and WebKit/iOS and preserve fail-closed visual evidence.

## Scope

- `/dictionary` primary navigation emits canonical `dictionary` ownership.
- Dictionary ↔ Phrases and real Back/Forward retain canonical route ownership.
- Home → Learn, Back/Forward and reload retain canonical Learn ownership.
- Compact Materials uses equal minimum 48px targets, one-line labels and no document x-overflow.
- `CalendarReminderRouteEntry` remains one owner and uses semantic `--ak-*` surface/text/primary/elevation tokens.
- Transition-derived Light/Dark evidence covers Dictionary, Phrases and Learn at 390×844.
- Existing strict route/system/tablet visual contracts that include the shared Reminder may be re-fingerprinted only from exact manually reviewed Linux evidence.

## Non-goals

- No redesign, backend/API change, Figma Cloud editing or OpenPencil mutation.
- No synthetic remount, timing workaround, forced reflow, broad `!important`, or blind baseline update.
- Do not alter unrelated visual content outside the proven shared Reminder/Materials regions.

## Allowed paths

Runtime and direct regression paths:
- `frontend/components/route-primary-navigation.tsx`
- `frontend/app/information-architecture.css`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/e2e/dictionary-route-island.spec.ts`
- `frontend/e2e/learn-route-island.spec.ts`
- `frontend/e2e/route-transition-runtime-visual.spec.ts`
- `frontend/playwright.visual.config.ts`

Reviewed dependent visual evidence paths:
- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/e2e/tablet-layout-visual.spec.ts`
- `frontend/e2e/home-tablet-progress-visual.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/profile-visual.spec.ts`
- `frontend/e2e/system-states-visual.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`

Agent Harness:
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Evidence invariants

- CI #3739 / run `32046365625`, head `43e80f5b…`, artifact `9293292461` manually approved the six new transition states before hashes were committed.
- CI #3740 / run `32048818693`, head `be2bf034…`, artifact `9294131591`, digest `sha256:df25e2d160218fb355a3a5b86a0e1d4883dd3a2bdda5bf335e64cdbb876179b7`, is the source for dependent shared-Reminder evidence.
- Exact #3740 PNGs were manually inspected; retry bytes were stable.
- Differential proof against the previously approved tablet artifact `9291962719` / CI `32040684330` showed all 14 affected 768px states differ only inside `x=541..646, y=0..102`, the shared Reminder region; the rest of each page is pixel-identical.
- The three fuzzy states that actually failed (Home compact, Progress compact, Progress desktop) are migrated to exact content-addressed #3740 hashes instead of rewriting binary snapshot files; unaffected fuzzy baselines remain untouched.

## Acceptance criteria

- Full immutable developer-head CI is green after dependent evidence reconciliation.
- The known UI shard new-tab timeout may be rerun on the same immutable head only if the exact failure remains unrelated to changed code.
- PR reviews, review threads, comments and main drift are audited before Ready.
- Squash merge uses `expected_head_sha`.
- Exact-main full CI and exact-SHA Stage/public validation are green because #579 is runtime-bearing.
- Delivery is followed by a separate Agent Docs-only reconciliation PR and `.agents/current/**` reset from live templates.
