from __future__ import annotations

from pathlib import Path

TARGET = Path("frontend/e2e/lesson-flow.spec.ts")


def replace_exact(text: str, label: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def main() -> None:
    text = TARGET.read_text(encoding="utf-8")
    text = replace_exact(
        text,
        "shared interface copy import",
        'import { expect, test, type Page } from "@playwright/test";\n',
        'import { expect, test, type Page } from "@playwright/test";\n\nimport { learningTermCopy } from "../lib/interface-copy";\n',
    )
    text = replace_exact(
        text,
        "recall lesson mode label",
        '  const label = mode === "study" ? "Простое изучение слов" : mode === "recall" ? "Вспомнить самому" : "Выбрать вариант";',
        '  const label = mode === "study" ? "Простое изучение слов" : mode === "recall" ? learningTermCopy("recall").label : "Выбрать вариант";',
    )

    if "Вспомнить самому" in text:
        raise RuntimeError("stale recall label remains in lesson flow browser contract")
    if 'learningTermCopy("recall").label' not in text:
        raise RuntimeError("lesson flow does not use the shared recall label")

    TARGET.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
