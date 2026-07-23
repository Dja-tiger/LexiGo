import { expect, test, type Page } from "@playwright/test";

const METADATA = {
  catalogVersion: "sha256:auth-e2e",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 120, words: 100, phrases: 20 },
  sources: {
    mixed: 120,
    noun: 30,
    verb: 30,
    adjective: 40,
    phrases: 20,
    dailyLife: 10,
    travel: 10,
    dataEngineering: 10,
    backend: 10, academicTechnicalEnglish: 0,
  },
  topics: [],
};

async function installGuestMocks(page: Page) {
  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById("lexigo-auth-e2e-motion")) return;
      const style = document.createElement("style");
      style.id = "lexigo-auth-e2e-motion";
      style.nonce = document.querySelector<HTMLElement>("[nonce]")?.nonce ?? "";
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });

  await page.route("**/api/v1/catalog/metadata", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(METADATA) });
  });
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(60_000);
  await installGuestMocks(page);
});

test("registration has accessible validation, password visibility and stable field errors", async ({ page }) => {
  let registerRequests = 0;
  await page.route("**/api/v1/auth/register", async (route) => {
    registerRequests += 1;
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "email_taken",
          message: "backend wording is intentionally irrelevant",
          field: "email",
        },
      }),
    });
  });

  await page.goto("/profile");
  const email = page.locator("#auth-email");
  await email.fill("existing@example.com");
  await page.getByRole("tab", { name: "Регистрация" }).click();
  await expect(email).toHaveValue("existing@example.com");

  await expect(page.locator("#auth-displayName")).toHaveAttribute("autocomplete", "name");
  await expect(email).toHaveAttribute("name", "username");
  await expect(email).toHaveAttribute("autocomplete", "username");
  await expect(page.locator("#auth-password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.locator("#auth-passwordConfirmation")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.locator("#auth-password").locator("xpath=ancestor::label")).toHaveCount(0);
  await expect(page.locator("#auth-password-requirements")).toHaveAttribute("aria-live", "polite");

  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator("#auth-displayName-error")).toHaveText("Введите имя.");
  await expect(page.locator("#auth-password-error")).toHaveText("Создайте пароль.");
  await expect(page.locator("#auth-passwordConfirmation-error")).toHaveText("Повторите пароль.");
  await expect(page.locator("#auth-displayName")).toBeFocused();
  expect(registerRequests).toBe(0);

  await page.locator("#auth-displayName").fill("Public User");
  await page.locator("#auth-password").fill("short");
  await expect(page.locator(".lx-password-requirements li").first()).not.toHaveClass(/met/);
  await expect(page.locator(".lx-password-requirements li").first()).toHaveAttribute("aria-label", "Не менее 10 символов: не выполнено");
  await page.locator("#auth-password").fill("correct horse battery staple");
  await expect(page.locator(".lx-password-requirements li").first()).toHaveClass(/met/);
  await expect(page.locator(".lx-password-requirements li").first()).toHaveAttribute("aria-label", "Не менее 10 символов: выполнено");

  const password = page.locator("#auth-password");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Показать пароль" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Скрыть пароль" })).toHaveAttribute("aria-pressed", "true");

  await page.locator("#auth-passwordConfirmation").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator("#auth-email-error")).toHaveText("Аккаунт с таким email уже существует.");
  await expect(email).toHaveValue("existing@example.com");
  await expect(page.locator("#auth-displayName")).toHaveValue("Public User");
  await expect(password).toHaveValue("correct horse battery staple");
  expect(registerRequests).toBe(1);
});

test("forgot password preserves email and always renders a generic accepted state", async ({ page }) => {
  let requestPayload: unknown;
  await page.route("**/api/v1/auth/password-reset/request", async (route) => {
    requestPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ accepted: true }),
    });
  });

  await page.goto("/profile");
  await page.locator("#auth-email").fill("recovery@example.com");
  await page.getByRole("button", { name: "Забыли пароль?" }).click();
  await expect(page.getByRole("heading", { name: "Восстановите доступ" })).toBeVisible();
  await expect(page.locator("#auth-email")).toHaveValue("recovery@example.com");
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByRole("status")).toContainText("Если аккаунт существует");
  expect(requestPayload).toEqual({ email: "recovery@example.com" });

  await page.getByRole("button", { name: "К входу" }).click();
  await expect(page.locator("#auth-email")).toHaveValue("recovery@example.com");
  await expect(page.locator("#auth-password")).toHaveAttribute("autocomplete", "current-password");
});

test("one-time reset link validates confirmation and returns to login without exposing token", async ({ page }) => {
  let resetPayload: unknown;
  await page.route("**/api/v1/auth/password-reset/confirm", async (route) => {
    resetPayload = route.request().postDataJSON();
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/profile#reset_token=one-time-token");
  await expect(page.getByRole("heading", { name: "Создайте новый пароль" })).toBeVisible();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator("#auth-password")).toHaveAttribute("name", "password");
  await expect(page.locator("#auth-password")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.locator("#auth-passwordConfirmation")).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByText("one-time-token", { exact: true })).toHaveCount(0);

  await page.locator("#auth-password").fill("new-strong-password");
  await page.locator("#auth-passwordConfirmation").fill("different-password");
  await page.getByRole("button", { name: "Сохранить новый пароль" }).click();
  await expect(page.locator("#auth-passwordConfirmation-error")).toHaveText("Пароли не совпадают.");
  expect(resetPayload).toBeUndefined();

  await page.locator("#auth-passwordConfirmation").fill("new-strong-password");
  await page.getByRole("button", { name: "Сохранить новый пароль" }).click();
  await expect(page.getByRole("status")).toContainText("Пароль изменён");
  await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
  await expect(page).not.toHaveURL(/reset_token=/);
  await expect(page).toHaveURL(/\/profile$/);
  expect(resetPayload).toEqual({ token: "one-time-token", newPassword: "new-strong-password" });
});
