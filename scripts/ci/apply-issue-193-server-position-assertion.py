#!/usr/bin/env python3
"""Fix the confirmed server-position assertion mismatch in Issue #193."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / "frontend" / "e2e" / "ui-ownership.spec.ts"
AGENTS = ROOT / ".agents" / "AGENTS.md"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


def main() -> None:
    source = SPEC.read_text(encoding="utf-8")
    source = replace_once(
        source,
        '  await expect(page.getByRole("heading", { name: "build" })).toBeVisible();',
        '  await expect(page.getByRole("progressbar", { name: "Прогресс урока" }))\n'
        '    .toHaveAttribute("aria-valuetext", "2 из 2 элементов");\n'
        '  await expect(page.getByRole("heading", { name: "Zulu cache" })).toBeVisible();',
        "server-provided second item assertion",
    )
    SPEC.write_text(source, encoding="utf-8")

    agents = AGENTS.read_text(encoding="utf-8")
    agents = replace_once(
        agents,
        '- **Профилактика:** каждый E2E journey, который выполняет действие пользователя, обязан мокировать не только initial GET/POST, но и все последующие mutation responses с актуальными `lessonVersion`, `lessonCurrentIndex`, completion и judgement fields; 404 `not_mocked` считать ошибкой тестового контракта, а не увеличивать timeout.',
        '- **Профилактика:** каждый E2E journey, который выполняет действие пользователя, обязан мокировать не только initial GET/POST, но и все последующие mutation responses с актуальными `lessonVersion`, `lessonCurrentIndex`, completion и judgement fields. Assertions после mutation должны выводиться из фактического mock payload и server-provided position, а не из соседних элементов fixture; 404 `not_mocked` и ожидание другого item считать ошибкой тестового контракта, а не увеличивать timeout.',
        "API mock prevention rule",
    )
    AGENTS.write_text(agents, encoding="utf-8")


if __name__ == "__main__":
    main()
