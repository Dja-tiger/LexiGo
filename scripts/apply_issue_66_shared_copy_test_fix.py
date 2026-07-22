from __future__ import annotations

from pathlib import Path

ACCESSIBILITY = Path("frontend/e2e/accessibility-keyboard.spec.ts")
MOBILE_HOME = Path("frontend/e2e/mobile-home-priority.spec.ts")


def replace_exact(text: str, label: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def patch_accessibility() -> None:
    text = ACCESSIBILITY.read_text(encoding="utf-8")
    text = replace_exact(
        text,
        "accessibility shared copy import",
        'import { expect, test, type Locator, type Page, type Route } from "@playwright/test";\n',
        'import { expect, test, type Locator, type Page, type Route } from "@playwright/test";\n\nimport { learningTermCopy } from "../lib/interface-copy";\n',
    )
    text = replace_exact(
        text,
        "recall radio label",
        '  const recall = modeGroup.getByRole("radio", { name: /Вспомнить самому/ });',
        '  const recall = modeGroup.getByRole("radio", { name: new RegExp(learningTermCopy("recall").label) });',
    )
    if "Вспомнить самому" in text:
        raise RuntimeError("stale recall label remains in accessibility browser contract")
    ACCESSIBILITY.write_text(text, encoding="utf-8")


def patch_mobile_home() -> None:
    text = MOBILE_HOME.read_text(encoding="utf-8")
    text = replace_exact(
        text,
        "mobile home shared copy import",
        'import { expect, test, type Page, type Route } from "@playwright/test";\n',
        'import { expect, test, type Page, type Route } from "@playwright/test";\n\nimport { learningTermCopy } from "../lib/interface-copy";\n',
    )
    text = replace_exact(
        text,
        "due row label",
        '    await expect(dueRow).toContainText("К повторению");',
        '    await expect(dueRow).toContainText(learningTermCopy("due").label);',
    )
    if 'toContainText("К повторению")' in text:
        raise RuntimeError("stale due label remains in mobile home browser contract")
    MOBILE_HOME.write_text(text, encoding="utf-8")


def main() -> None:
    patch_accessibility()
    patch_mobile_home()


if __name__ == "__main__":
    main()
