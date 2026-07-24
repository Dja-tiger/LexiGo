#!/usr/bin/env python3
"""Apply confirmed UI shard fixes for Issue #193."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UI_OWNERSHIP = ROOT / "frontend" / "e2e" / "ui-ownership.spec.ts"
EMAIL_CHANGE = ROOT / "frontend" / "e2e" / "account-email-change.spec.ts"
AGENTS = ROOT / ".agents" / "AGENTS.md"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


def patch_ui_ownership() -> None:
    source = UI_OWNERSHIP.read_text(encoding="utf-8")
    anchor = '''    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string; wordIds?: number[] };
      const selected = input.wordIds
        ? WORDS.filter((item) => input.wordIds?.includes(item.id))
        : [WORDS[0], PHRASES[0]];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000360",
          source: input.source,
          studyMode: input.studyMode,
          lessonSize: input.lessonSize,
          currentIndex: 0,
          version: 1,
          status: "active",
          items: selected.map((item, position) => ({ ...item, position })),
          createdAt: "2026-07-17T00:00:00Z",
          updatedAt: "2026-07-17T00:00:00Z",
        }),
      });
      return;
    }

'''
    review_mock = anchor + '''    if (path.endsWith("/review") && request.method() === "POST") {
      const input = request.postDataJSON() as { rating: "again" | "almost" | "known" };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wordId: WORDS[0].id,
          requestedRating: input.rating,
          effectiveRating: input.rating,
          judgementSource: "study",
          judgementReason: "study_exposure",
          reviewEventId: 1,
          suggestionAvailable: false,
          lessonId: "00000000-0000-0000-0000-000000000360",
          lessonCurrentIndex: 1,
          lessonVersion: 2,
          lastReviewedAt: "2026-07-17T00:01:00Z",
          lessonCompleted: false,
          lessonReviewedItems: 1,
          lessonSkippedItems: 0,
          lessonTotalItems: 2,
        }),
      });
      return;
    }

'''
    source = replace_once(source, anchor, review_mock, "UI ownership review API mock")
    UI_OWNERSHIP.write_text(source, encoding="utf-8")


def patch_email_change() -> None:
    source = EMAIL_CHANGE.read_text(encoding="utf-8")
    source = replace_once(
        source,
        '''  await expect(page).toHaveURL(/\/profile\?account=email-changed$/);
  await expect(page.getByRole("status")).toContainText("Email изменён");
  await expect(page.getByRole("status")).toContainText("Войдите с новым адресом");
''',
        '''  await expect(page).toHaveURL(/\/profile\?account=email-changed$/);
  const changedEmailNotice = page.getByRole("status").filter({ hasText: "Email изменён" });
  await expect(changedEmailNotice).toContainText("Email изменён");
  await expect(changedEmailNotice).toContainText("Войдите с новым адресом");
''',
        "email change status scope",
    )
    EMAIL_CHANGE.write_text(source, encoding="utf-8")


def patch_agents() -> None:
    source = AGENTS.read_text(encoding="utf-8")
    entries = '''

### 2026-07-24 — UI ownership journey не синхронизировал review API mock

- **Симптом:** все browser projects UI ownership test оставались на первой Study-карточке, показывали `Действие не выполнено`, а клик по `Дальше` завершался timeout.
- **Первопричина:** redesign сделал Study confidence реальным review submit по существующему backend contract, но локальный route mock теста поддерживал только создание lesson session и возвращал 404 для `/review`.
- **Профилактика:** каждый E2E journey, который выполняет действие пользователя, обязан мокировать не только initial GET/POST, но и все последующие mutation responses с актуальными `lessonVersion`, `lessonCurrentIndex`, completion и judgement fields; 404 `not_mocked` считать ошибкой тестового контракта, а не увеличивать timeout.
- **Обязательная проверка:** UI ownership journey проходит в desktop Chromium/WebKit, Android Chromium и iOS WebKit и после rating переходит на server-provided вторую позицию.
- **Область действия:** Playwright API mocks, Active Lesson review mutations и multi-step journeys.

### 2026-07-24 — Глобальный role locator стал неоднозначным после появления второго status

- **Симптом:** email-change journey получил strict-mode violation: `getByRole("status")` совпал одновременно с account notice и пустым progress state.
- **Первопричина:** locator полагался на глобальную уникальность ARIA role, хотя на странице корректно присутствовали несколько независимых live/status regions.
- **Профилактика:** повторяющиеся roles (`status`, `alert`, `navigation`, `group`) всегда ограничивать accessible name, ожидаемым текстом или ближайшим semantic container; не использовать `.first()` для скрытия неоднозначности.
- **Обязательная проверка:** account-email-change test выбирает status через `filter({ hasText: "Email изменён" })` и проходит в Chromium/WebKit.
- **Область действия:** accessibility-first Playwright selectors и страницы с несколькими live regions.
'''
    if "### 2026-07-24 — UI ownership journey не синхронизировал" in source:
        raise RuntimeError("UI shard prevention entries already exist")
    AGENTS.write_text(source + entries, encoding="utf-8")


def main() -> None:
    patch_ui_ownership()
    patch_email_change()
    patch_agents()


if __name__ == "__main__":
    main()
