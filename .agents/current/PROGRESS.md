# Current Task Progress

## 2026-08-18 01:50 Europe/Moscow

### Verified

- live `main`: `2edf865448fb47951bd80963215cb3a6a76b01a4`;
- only open PR before runtime repair: Draft #588 (`test/issue-587-min-mobile-route-parity`);
- Issue #589 created from fail-closed #587 evidence; sibling Phrase Detail defect is isolated as #590;
- branch `fix/min-mobile-learn-contrast` was created directly from exact main and was initially identical (`ahead_by=0`, `behind_by=0`);
- authoritative Visual config uses explicit Light appearance for 390px compact;
- existing Lesson Composer compact baseline is `390×1212`, SHA-256 `e0f44f118b272b898cfaf635e81c7a808c274dd6834594c4a20245ff4f34a423`.

### Finding

The 320px Light audit screenshot shows the Learn intro heading effectively invisible. The same CSS cascade applies to canonical 390px Light, so the existing compact content hash may already encode the defect and cannot be treated as immutable approval evidence.

### Root cause

`adaptive-lesson-composer.css` switches the compact `.lx-page-heading` to a transparent surface and assigns `h1` `var(--ak-color-text-main)`. Later-imported `adaptive-lesson-composer-accessibility.css` applies `color: var(--lx-composer-hero-foreground)` to the same route-specific `h1` without a viewport boundary. `--lx-composer-hero-foreground` is fixed `#f4f7f5`, correct for the dark desktop hero but wrong on the Light compact canvas.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- full mandatory Agent Harness read from live main;
- issue/PR/main/Figma-map/code-owner reconstruction;
- exact branch/base compare;
- source-level cascade inspection;
- authoritative Visual collection inspection.

### Checks failed

- CI #3756 / run `32074275805` remains intentionally red at the #588 review gate; it is diagnostic evidence, not a repair-branch failure.
- Figma MCP screenshot quota is exhausted on Starter plan; repository-owned active OpenPencil screen map is the fallback source, with canonical Learn mobile `202:6` / `fig_6826` already mapped.

### Current branch head

Resolve from live branch ref after each write; TASK write commit was `62bdae907586edb5fee43e2fd2ef54362d929876`.

### Next action

Apply a compact-only semantic heading foreground in the later accessibility stylesheet, protect it with the existing source-contract test, then open a Draft PR and use Linux Visual actual evidence to review/accept any corrected 390px hash.
