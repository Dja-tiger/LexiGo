#!/usr/bin/env python3
"""Consolidate the exact Phrases compatibility CSS into its canonical owner.

Temporary branch-only patcher for Issue #70. Every source assumption is fail-closed,
and the file is deleted before authoritative CI.
"""

from __future__ import annotations

from pathlib import Path


LAYOUT_PATH = Path("frontend/app/layout.tsx")
CANONICAL_PATH = Path("frontend/app/phrases.css")
COMPAT_PATH = Path("frontend/app/phrases-compat.css")

OLD_COMMENT = "/* Issue #199 compatibility overrides verified against the full browser/axe matrix. */"
NEW_COMMENT = "/* Issue #70: canonical Phrases computed-cascade ownership. */"
COMPAT_IMPORT = 'import "./phrases-compat.css";\n'

REQUIRED_COMPAT_MARKERS = (
    '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort {',
    "border-color: var(--lx-phrases-border);",
    "color: var(--ak-color-text-main);",
    "background: var(--ak-color-surface);",
    "box-shadow: var(--ak-elevation-1);",
    "backdrop-filter: none;",
    '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort strong {',
    '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort small {',
    '.lx-app[data-route-client-island="phrases"] .lx-catalog-sort select {',
    '.lx-app[data-route-client-island="phrases"] .lx-phrases-topic-chips button[aria-pressed="true"] {',
    "color: #10211d;",
    "font-weight: 700;",
    '.lx-app[data-route-client-island="phrases"] .lx-phrases-results {',
    "padding-top: 24px;",
    "@media (forced-colors: active)",
    "border: 1px solid CanvasText;",
    "color: CanvasText;",
    "background: Canvas;",
    "box-shadow: none;",
    "color: HighlightText;",
    "background: Highlight;",
)


def require_count(text: str, marker: str, expected: int, label: str) -> None:
    actual = text.count(marker)
    print(f"{label}: {actual}")
    if actual != expected:
        raise SystemExit(f"{label}: expected {expected}, found {actual}")


def main() -> None:
    layout = LAYOUT_PATH.read_text(encoding="utf-8")
    canonical = CANONICAL_PATH.read_text(encoding="utf-8")
    compat = COMPAT_PATH.read_text(encoding="utf-8")

    require_count(layout, 'import "./catalog-enhancements.css";\n', 1, "shared catalog import")
    require_count(layout, 'import "./phrases.css";\n', 1, "canonical Phrases import")
    require_count(layout, COMPAT_IMPORT, 1, "compatibility import")
    if layout.index('import "./catalog-enhancements.css";') >= layout.index('import "./phrases.css";'):
        raise SystemExit("catalog-enhancements.css must remain before phrases.css")

    require_count(canonical, NEW_COMMENT, 0, "canonical ownership marker before patch")
    require_count(compat, OLD_COMMENT, 1, "compatibility ownership marker")
    for marker in REQUIRED_COMPAT_MARKERS:
        if marker not in compat:
            raise SystemExit(f"compatibility CSS is missing required marker: {marker}")

    canonical_block = compat.replace(OLD_COMMENT, NEW_COMMENT, 1).strip()
    updated_canonical = canonical.rstrip() + "\n\n" + canonical_block + "\n"
    updated_layout = layout.replace(COMPAT_IMPORT, "", 1)

    require_count(updated_canonical, NEW_COMMENT, 1, "canonical ownership marker after patch")
    for marker in REQUIRED_COMPAT_MARKERS:
        if marker not in updated_canonical:
            raise SystemExit(f"canonical CSS is missing moved marker: {marker}")
    require_count(updated_layout, COMPAT_IMPORT, 0, "compatibility import after patch")

    CANONICAL_PATH.write_text(updated_canonical, encoding="utf-8")
    LAYOUT_PATH.write_text(updated_layout, encoding="utf-8")
    COMPAT_PATH.unlink()

    print(
        f"consolidated {len(compat.encode('utf-8'))} compatibility bytes into "
        f"{CANONICAL_PATH}; removed {COMPAT_PATH}"
    )


if __name__ == "__main__":
    main()
