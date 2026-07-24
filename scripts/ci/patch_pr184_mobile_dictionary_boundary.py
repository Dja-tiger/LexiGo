#!/usr/bin/env python3
"""Keep the Dictionary cold-route island on its established mobile geometry."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STYLE = ROOT / "frontend/app/adaptive-knowledge-coach-home.css"
STYLE_TEST = ROOT / "frontend/app/adaptive-knowledge-coach-home.test.ts"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old in source:
        return source.replace(old, new, 1)
    if new in source:
        return source
    raise SystemExit(f"{label} did not match expected source")


def main() -> None:
    source = STYLE.read_text(encoding="utf-8")
    marker = "@media (max-width: 719px) {"
    if source.count(marker) != 1:
        raise SystemExit("mobile shell media query was not found exactly once")
    prefix, mobile = source.split(marker, 1)

    mobile = replace_once(
        mobile,
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) {',
        "mobile app boundary",
    )
    mobile = replace_once(
        mobile,
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-header {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header {',
        "mobile header boundary",
    )
    mobile = replace_once(
        mobile,
        ".lx-routed-app .lx-app:not(.lx-lesson-focus-mode) .lx-header-tools {",
        '.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header-tools {',
        "mobile header tools boundary",
    )
    mobile = replace_once(
        mobile,
        ".lx-routed-app .lx-main-content {",
        '.lx-routed-app .lx-app:not([data-route-client-island="dictionary"]) .lx-main-content {',
        "mobile main content boundary",
    )
    mobile = replace_once(
        mobile,
        ".lx-routed-app .lx-view {",
        '.lx-routed-app .lx-app:not([data-route-client-island="dictionary"]) .lx-view {',
        "mobile view boundary",
    )
    STYLE.write_text(prefix + marker + mobile, encoding="utf-8")

    test = STYLE_TEST.read_text(encoding="utf-8")
    anchor = '''    expect(styleSource).toContain(':not([data-route-client-island="dictionary"])');
'''
    replacement = '''    expect(styleSource).toContain(':not([data-route-client-island="dictionary"])');
    expect(styleSource).toContain('.lx-app:not([data-route-client-island="dictionary"]) .lx-main-content');
    expect(styleSource).toContain('.lx-app:not([data-route-client-island="dictionary"]) .lx-view');
'''
    test = replace_once(test, anchor, replacement, "mobile dictionary ownership test")
    STYLE_TEST.write_text(test, encoding="utf-8")
    print("Scoped Adaptive Knowledge Coach mobile geometry away from the Dictionary island")


if __name__ == "__main__":
    main()
