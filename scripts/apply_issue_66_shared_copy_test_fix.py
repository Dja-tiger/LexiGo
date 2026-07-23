from __future__ import annotations

from pathlib import Path

ACCESSIBILITY = Path("frontend/e2e/accessibility-keyboard.spec.ts")
MOBILE_HOME = Path("frontend/e2e/mobile-home-priority.spec.ts")
APP = Path("frontend/components/lexigo-premium-app.tsx")


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
        "pending progress geometry",
        '''    const hero = page.locator(".lx-home-next-action .lx-hero-card");
    await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
    const pendingHero = await boundingBoxOrFail(hero);

    const primaryCTA = page.getByRole("button", { name: "Повторить сейчас" });
    await expect(primaryCTA).toBeVisible();
    const readyHero = await boundingBoxOrFail(hero);
    const ctaBox = await boundingBoxOrFail(primaryCTA);''',
        '''    const hero = page.locator(".lx-home-next-action .lx-hero-card");
    const progressPanel = page.locator(".lx-home-next-action .lx-progress-panel");
    await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
    const pendingHero = await boundingBoxOrFail(hero);
    const pendingProgressPanel = await boundingBoxOrFail(progressPanel);
    const pendingDueRow = progressPanel.locator(".lx-progress-list > div").first();
    await expect(pendingDueRow).toContainText(learningTermCopy("due").label);
    await expect(pendingDueRow.getByText("—", { exact: true })).toBeVisible();

    const primaryCTA = page.getByRole("button", { name: "Повторить сейчас" });
    await expect(primaryCTA).toBeVisible();
    const readyHero = await boundingBoxOrFail(hero);
    const readyProgressPanel = await boundingBoxOrFail(progressPanel);
    const ctaBox = await boundingBoxOrFail(primaryCTA);''',
    )
    text = replace_exact(
        text,
        "stable progress panel assertions",
        '''    expect(Math.abs(readyHero.y - pendingHero.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyHero.height - pendingHero.height)).toBeLessThanOrEqual(1);
    expect(readyHero.height).toBeLessThanOrEqual(320);''',
        '''    expect(Math.abs(readyHero.y - pendingHero.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyHero.height - pendingHero.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyProgressPanel.y - pendingProgressPanel.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyProgressPanel.height - pendingProgressPanel.height)).toBeLessThanOrEqual(1);
    expect(readyHero.height).toBeLessThanOrEqual(320);''',
    )
    text = replace_exact(
        text,
        "due row label",
        '''    const progressPanel = page.locator(".lx-home-next-action .lx-progress-panel");
    await expect(progressPanel).toContainText("7 из 30");
    const dueRow = progressPanel.locator(".lx-progress-list > div").first();
    await expect(dueRow).toContainText("К повторению");''',
        '''    await expect(progressPanel).toContainText("7 из 30");
    const dueRow = progressPanel.locator(".lx-progress-list > div").first();
    await expect(dueRow).toContainText(learningTermCopy("due").label);''',
    )
    if 'toContainText("К повторению")' in text:
        raise RuntimeError("stale due label remains in mobile home browser contract")
    MOBILE_HOME.write_text(text, encoding="utf-8")


def patch_app() -> None:
    text = APP.read_text(encoding="utf-8")
    text = replace_exact(
        text,
        "progress panel busy state",
        '<aside className="lx-progress-panel" aria-label="Краткий прогресс">',
        '<aside className="lx-progress-panel" aria-label="Краткий прогресс" aria-busy={progressPending || undefined}>',
    )
    text = replace_exact(
        text,
        "stable pending progress structure",
        '''            ) : (
              <AsyncStatePanel label={!session ? "Персональный прогресс доступен после входа" : progressPending ? "Загрузка краткого прогресса" : "Краткий прогресс недоступен"} kind={!session ? "empty" : progressPending ? "loading" : "error"} title={!session ? "Войдите, чтобы видеть учебную очередь" : progressPending ? "Синхронизируем очередь" : progressStatus.problem?.title ?? "Прогресс недоступен"} message={!session ? "Материал к повторению, дневная цель и серия синхронизируются с аккаунтом." : progressStatus.problem?.message ?? "Получаем материал к повторению и дневную цель."} reference={progressStatus.problem?.correlationId} actionLabel={!session ? "Войти" : progressStatus.problem?.retryable ? "Повторить" : undefined} onAction={!session ? () => requestAuthentication("home") : progressStatus.problem?.retryable ? () => void loadProgressResource(session) : undefined} compact focusResult={false} />
            )}''',
        '''            ) : progressPending ? (
              <>
                <div className="lx-progress-ring" aria-hidden="true"><span>—</span></div>
                <div className="lx-progress-list" role="status" aria-live="polite" aria-label="Загрузка краткого прогресса"><div><span>{DUE_COPY.label}</span><strong>—</strong></div><div><span>{RETAINED_COPY.label} за неделю</span><strong>—</strong></div><div><span>Серия</span><strong>—</strong></div></div>
              </>
            ) : (
              <AsyncStatePanel label={!session ? "Персональный прогресс доступен после входа" : "Краткий прогресс недоступен"} kind={!session ? "empty" : "error"} title={!session ? "Войдите, чтобы видеть учебную очередь" : progressStatus.problem?.title ?? "Прогресс недоступен"} message={!session ? "Материал к повторению, дневная цель и серия синхронизируются с аккаунтом." : progressStatus.problem?.message ?? "Получаем материал к повторению и дневную цель."} reference={progressStatus.problem?.correlationId} actionLabel={!session ? "Войти" : progressStatus.problem?.retryable ? "Повторить" : undefined} onAction={!session ? () => requestAuthentication("home") : progressStatus.problem?.retryable ? () => void loadProgressResource(session) : undefined} compact focusResult={false} />
            )}''',
    )
    if 'progressPending ? "Загрузка краткого прогресса"' in text:
        raise RuntimeError("legacy loading panel branch remains in home progress")
    APP.write_text(text, encoding="utf-8")


def main() -> None:
    patch_accessibility()
    patch_mobile_home()
    patch_app()


if __name__ == "__main__":
    main()
