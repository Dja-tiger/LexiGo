import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  installActiveLessonFixture,
  openActiveLesson,
} from "./support/active-lesson-fixture";

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type AxeResult = Awaited<ReturnType<AxeBuilder["analyze"]>>;

function formatViolations(violations: AxeResult["violations"]): string {
  return violations.map((violation) => {
    const nodes = violation.nodes.map((node) => {
      const targets = node.target.join(", ");
      return `  - ${targets}: ${node.failureSummary ?? "no failure summary"}`;
    }).join("\n");
    return `${violation.id} [${violation.impact ?? "unknown"}]: ${violation.help}\n${nodes}`;
  }).join("\n\n");
}

async function expectNoBlockingAxeViolations(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  const blocking = result.violations.filter((violation) => (
    typeof violation.impact === "string" && BLOCKING_IMPACTS.has(violation.impact)
  ));
  expect(blocking, formatViolations(blocking)).toEqual([]);
}

const AUTHENTICATED_ROUTES = [
  { name: "home", url: "/", heading: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ },
  { name: "learn", url: "/learn", heading: "Соберите один сфокусированный урок" },
  { name: "phrases", url: "/phrases", heading: "Находите готовые формулировки" },
  { name: "dictionary", url: "/dictionary", heading: "Находите и изучайте материал в контексте" },
  { name: "progress", url: "/progress", heading: "Смотрите, что действительно сохранилось" },
  { name: "profile", url: "/profile", heading: "Quality Gates" },
  { name: "word detail", url: "/words/101", heading: "rollback" },
  { name: "phrase detail", url: "/phrases/phrase-root-cause", heading: "We need to identify the root cause." },
] as const;

test.describe("blocking accessibility gate", () => {
  test.describe.configure({ timeout: 90_000 });

  test.describe("authenticated application", () => {
    test.beforeEach(async ({ context, page }) => {
      await installDeterministicRuntime(page);
      await installQualityGateAPI(context);
    });

    for (const route of AUTHENTICATED_ROUTES) {
      test(`${route.name} has no critical or serious WCAG violations`, async ({ page }) => {
        const runtimeErrors = captureRuntimeErrors(page);
        await page.goto(route.url, { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: route.heading })).toBeVisible({ timeout: 15_000 });
        await expectNoBlockingAxeViolations(page);
        expect(runtimeErrors).toEqual([]);
      });
    }

    test("calendar dialog has no critical or serious WCAG violations", async ({ page }) => {
      const runtimeErrors = captureRuntimeErrors(page);
      await page.goto("/progress", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Смотрите, что действительно сохранилось" })).toBeVisible();
      await page.getByRole("button", { name: "Настроить календарь" }).click();
      await expect(page.getByRole("dialog", { name: "Напоминание об английском" })).toBeVisible();
      await expectNoBlockingAxeViolations(page);
      expect(runtimeErrors).toEqual([]);
    });
  });

  test("active Recall and safe-exit dialog have no critical or serious WCAG violations", async ({ page }) => {
    await installDeterministicRuntime(page);
    await installActiveLessonFixture(page, "recall");
    const runtimeErrors = captureRuntimeErrors(page);
    await openActiveLesson(page);
    await expect(page.locator(".lx-active-lesson")).toBeVisible();
    await expectNoBlockingAxeViolations(page);

    const closeButton = (page.viewportSize()?.width ?? 1440) < 768
      ? page.getByRole("button", { name: "Закрыть", exact: true })
      : page.getByRole("button", { name: "Закрыть урок" });
    await closeButton.click();
    await expect(page.getByRole("dialog", { name: "Закрыть урок?" })).toBeVisible();
    await expectNoBlockingAxeViolations(page);
    expect(runtimeErrors).toEqual([]);
  });

  test.describe("guest authentication", () => {
    test.beforeEach(async ({ context, page }) => {
      await installDeterministicRuntime(page);
      await installQualityGateAPI(context, { authenticated: false });
    });

    test("login and registration states have no critical or serious WCAG violations", async ({ page }) => {
      const runtimeErrors = captureRuntimeErrors(page);
      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
      await expectNoBlockingAxeViolations(page);

      await page.getByRole("tab", { name: "Регистрация" }).click();
      await expect(page.getByRole("button", { name: "Создать аккаунт" })).toBeVisible();
      await expectNoBlockingAxeViolations(page);
      expect(runtimeErrors).toEqual([]);
    });
  });
});
