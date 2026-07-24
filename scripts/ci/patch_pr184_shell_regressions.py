#!/usr/bin/env python3
"""Correct the desktop dictionary shell boundary after the initial PR 184 patch."""

from pathlib import Path

STYLE = Path(__file__).resolve().parents[2] / "frontend/app/adaptive-knowledge-coach-home.css"


def replace_first(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        if new in source:
            return source
        raise SystemExit(f"{label} did not match expected source")
    return source.replace(old, new, 1)


def main() -> None:
    source = STYLE.read_text(encoding="utf-8")
    source = replace_first(
        source,
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) {',
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) {",
        "desktop app rail offset",
    )
    source = replace_first(
        source,
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header {',
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-header {",
        "desktop header layout",
    )
    source = replace_first(
        source,
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header-tools {',
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-header-tools {",
        "desktop header tools layout",
    )
    STYLE.write_text(source, encoding="utf-8")
    print("Restored desktop dictionary participation in the persistent rail shell")


if __name__ == "__main__":
    main()
