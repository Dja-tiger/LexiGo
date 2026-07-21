from __future__ import annotations

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]


def replace_required(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    content = file_path.read_text(encoding="utf-8")
    if old not in content:
        raise RuntimeError(f"{path}: marker not found: {old!r}")
    file_path.write_text(content.replace(old, new, 1), encoding="utf-8")


def main() -> None:
    runpy.run_path(str(ROOT / "scripts/issue61_browser_fix_v2.py"), run_name="__main__")
    replace_required(
        "frontend/e2e/route-focus-management.spec.ts",
        'async function clickPrimaryNavigation(page: Page, view: "learn" | "phrases" | "progress") {',
        'async function clickPrimaryNavigation(page: Page, view: "learn" | "library" | "progress") {',
    )
    replace_required(
        "frontend/e2e/accessibility-keyboard.spec.ts",
        'import { expect, test, type BrowserContext, type Locator, type Page, type Route } from "@playwright/test";',
        'import { expect, test, type Locator, type Page, type Route } from "@playwright/test";',
    )
    print("[issue61-v3] TypeScript browser helpers aligned", flush=True)


if __name__ == "__main__":
    main()
