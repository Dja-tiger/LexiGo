import { expect, test, type Route } from "@playwright/test";

import {
  QUALITY_WORDS,
  installQualityGateAPI,
} from "./support/quality-gates";

function catalogPage(items: readonly unknown[]) {
  return {
    items,
    count: items.length,
    total: items.length,
    page: 1,
    pageSize: 48,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };
}

async function fulfillJSON(route: Route, status: number, body: unknown, headers: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

test("shows persistent offline details and a dismissible restored-connection state", async ({ context, page }) => {
  await installQualityGateAPI(context);
  await page.goto("/");
  await expect(page.getByRole("main", { name: "Главная", exact: true })).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByText("Нет подключения к сети", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Подробнее", exact: true }).click();

  const panel = page.locator("#lexigo-connectivity-panel");
  await expect(panel.getByRole("heading", { name: "Работа без сети", exact: true })).toBeVisible();
  await expect(panel.getByText("Полный переход по уроку остаётся серверным.", { exact: true })).toBeVisible();
  await expect(panel.getByText("Следующая карточка откроется только после подтверждения серверной позиции.", { exact: true })).toBeVisible();
  await expect(panel.getByText("Ожидают отправки", { exact: true })).toBeVisible();
  await expect(panel.getByText("Требуют проверки", { exact: true })).toBeVisible();
  await expect(panel.getByText("Синхронизировано за сутки", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Проверить соединение", exact: true })).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText("Подключение восстановлено", { exact: true })).toBeVisible();
  await expect(page.getByText("LexiGo снова может загружать материалы и синхронизировать локальную очередь.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Готово", exact: true }).click();
  await expect(page.locator(".lx-system-connectivity")).toHaveCount(0);
});

test("keeps the Dictionary query in a truthful empty state and exposes only implemented recovery", async ({ context, page }) => {
  await installQualityGateAPI(context);
  await context.route("**/api/v1/words**", async (route) => {
    if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
    return fulfillJSON(route, 200, catalogPage([]));
  });

  await page.goto("/dictionary");
  const search = page.getByRole("searchbox", { name: "Поиск по словарю" });
  await expect(search).toBeVisible();
  await search.fill("nonexistent term");
  await search.press("Enter");

  await expect(page.getByRole("status", { name: "Слова не найдены" })).toContainText("По заданным условиям слов нет");
  await expect(search).toHaveValue("nonexistent term");
  await expect(page.getByRole("button", { name: "Сбросить фильтры", exact: true }).last()).toBeEnabled();
  await expect(page.getByRole("button", { name: "Добавить термин", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Сбросить фильтры", exact: true }).last().click();
  await expect(search).toHaveValue("");
});

test("keeps the Dictionary query through a correlated error and retries deterministically", async ({ context, page }) => {
  await installQualityGateAPI(context);
  let fail = true;
  await context.route("**/api/v1/words**", async (route) => {
    if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
    if (fail) {
      return fulfillJSON(
        route,
        503,
        { error: { code: "catalog_temporarily_unavailable", message: "retry" } },
        { "x-correlation-id": "dictionary-system-state-503" },
      );
    }
    return fulfillJSON(route, 200, catalogPage([QUALITY_WORDS[2]]));
  });

  await page.goto("/dictionary");
  const search = page.getByRole("searchbox", { name: "Поиск по словарю" });
  await search.fill("durable");
  await search.press("Enter");

  const error = page.getByRole("alert", { name: "Словарь недоступен" });
  await expect(error).toContainText("Сервис временно недоступен");
  await expect(error).toContainText("Код запроса: dictionary-system-state-503");
  await expect(search).toHaveValue("durable");

  fail = false;
  await error.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "durable" })).toBeVisible();
  await expect(search).toHaveValue("durable");
});

test("reserves Dictionary result geometry while the server response is pending", async ({ context, page }) => {
  await installQualityGateAPI(context);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });

  await context.route("**/api/v1/words**", async (route) => {
    if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
    await gate;
    return fulfillJSON(route, 200, catalogPage(QUALITY_WORDS));
  });

  await page.goto("/dictionary");
  const skeleton = page.getByRole("status", { name: "Загружаем слова" });
  await expect(skeleton).toBeVisible();
  await expect(skeleton).toHaveAttribute("aria-busy", "true");
  await expect(skeleton.locator("i")).toHaveCount(6);
  const initialBox = await skeleton.boundingBox();
  expect(initialBox?.height ?? 0).toBeGreaterThanOrEqual(150);

  release();
  await expect(page.getByRole("listitem").first()).toBeVisible();
  await expect(skeleton).toHaveCount(0);
});

test("removes shimmer motion without removing loading evidence", async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installQualityGateAPI(context);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });

  await context.route("**/api/v1/words**", async (route) => {
    if (new URL(route.request().url()).pathname !== "/api/v1/words") return route.fallback();
    await gate;
    return fulfillJSON(route, 200, catalogPage(QUALITY_WORDS));
  });

  await page.goto("/dictionary");
  const bar = page.getByRole("status", { name: "Загружаем слова" }).locator("b").first();
  await expect(bar).toBeVisible();
  await expect(bar).toHaveCSS("animation-name", "none");
  release();
});
