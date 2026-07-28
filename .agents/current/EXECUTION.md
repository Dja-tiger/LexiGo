# Current Task Execution

## Task

- Issue: #261.
- Branch: `agent/issue-261-system-state-css-ownership`.
- Base SHA: `32d36a6cc4eaefc553e893fcd1942519441d647b`.
- Head SHA: `0dce967` (local implementation commit; final evidence commit pending).
- PR: #262 (Draft).

## Skills used

### GitHub repository operations and Figma design context

Purpose: select the next unblocked atomic Issue #70 slice and preserve exact approved system-state presentation while removing duplicate CSS owners.

Instruction source: repository Agent Harness, GitHub plugin skills, `figma-design-to-code`, Issues #70/#202/#261 and existing system-state visual/source contracts.

Version or verification date: live main `32d36a6cc4eaefc553e893fcd1942519441d647b`, verified 2026-07-28.

Inputs: live GitHub state, Figma file `3xXmBWnf38jbvLjtziwber`, nodes `79:69`/`79:117`/`79:194`, layout CSS imports, runtime markup and immutable Linux screenshot hashes.

Files inspected: mandatory harness; `layout.tsx`; `mobile-pwa-fixes.css`; `review-outbox.css`; `system-states.css`; `AsyncState`; `ReviewOutboxRuntime`; focused source/visual/E2E tests.

Actions performed: reconciled live state; confirmed Phrases blocker; created Issue/branch; enumerated duplicate selectors; determined which older higher-specificity declarations remain effective; inspected exact Figma reference contexts.

Commands or procedures: connector/public GitHub reads, local exact-ref checks, repository-wide `rg`, duplicate-selector audit and Figma `get_design_context`.

Artifacts produced: Issue #261 and the current pre-flight contract.

Result: smallest safe ownership slice was defined and its pre-flight record was pushed.

Failures: none.

Root cause: the canonical Issue #202 layer was added after older files but their higher-specificity and unique declarations were not migrated or removed.

Fallback: retain both legacy files if byte-identical visual and motion behavior cannot be reproduced from one canonical owner.

Limitations: parent Issue #70 cannot close while Phrases/dead compatibility client evidence remains blocked by #199/#115.

Reusable lesson: a later stylesheet is not a sole owner when earlier higher-specificity or unique declarations remain effective; ownership must be proven at selector and rendered-pixel levels.

## Implementation and local validation

Purpose: retire the two duplicate presentation owners without changing runtime behavior or approved pixels.

Inputs: the effective cascade declarations, shared state markup, outbox runtime modifiers, reduced-motion contract and existing immutable Linux visual hashes.

Actions performed:

- removed the async/skeleton block from `mobile-pwa-fixes.css`;
- removed the `review-outbox.css` layout import and deleted that stylesheet;
- migrated only the still-effective state-tone, resource-stack, offline-indicator, pending-pulse and reduced-motion declarations to `system-states.css`;
- added a source contract that rejects the retired import/file/selectors;
- documented the system-state ownership boundary in `docs/architecture.md`.

Validation:

- focused Vitest: 2 files, 10 tests passed;
- frontend lint: 0 errors and 3 unrelated pre-existing warnings;
- TypeScript passed;
- frontend unit: 69 files, 442 tests passed;
- production build passed;
- system-state functional Playwright: 20 tests passed across desktop Chromium/WebKit and Android/iOS;
- offline/auth-lifecycle outbox Playwright: 24 tests passed across the same projects.

Visual limitation: a local Apple Silicon Docker run failed unchanged Profile/Scenario hashes and produced differing retry hashes. It was classified as a non-authoritative architecture/font-render environment, the exact container was stopped, the temporary source copy was removed and no baseline was updated. The x86 Linux GitHub visual job remains required.

Result: source and functional behavior are green locally at implementation commit `0dce967`; immutable-head authoritative CI is pending.

## Authoritative visual correction

Run `30319926639` executed 44 applicable Linux visual cases: 43 passed and only `desktop-offline-dark` failed. The received SHA was `4603e4d35e823b5feb0ea9f687912a38d0c54fb48a874a79640567fe4d9e5791`; the approved SHA remains `8f3b6192ba542969101166997046d92df0dc041ed9c8ec0fc7f588e951931f7a`.

Root cause: the retired `.lx-review-sync span:not(.lx-review-sync__indicator)` selector had higher specificity than `.lx-review-sync__copy span`. Its effective `color: #cbd5e1`, `font-size: 13px` and `line-height: 1.45` therefore remained part of the approved baseline before consolidation.

Correction: preserve those values in the canonical copy selector and assert them in the source contract. Baselines remain unchanged.
