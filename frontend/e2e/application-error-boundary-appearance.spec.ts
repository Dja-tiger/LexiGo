import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const GLOBAL_ERROR_CSS = readFileSync(path.join(process.cwd(), "app", "global-error.css"), "utf8");

type ExplicitAppearance = "light" | "dark";

async function installAppearancePreference(page: Page, appearance: ExplicitAppearance) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function semanticPresentationSnapshot(page: Page) {
  return page.evaluate(() => {
    const fixture = document.createElement("main");
    fixture.className = "lx-fatal-error";
    fixture.setAttribute("data-testid", "application-error-boundary-appearance-fixture");
    fixture.setAttribute("role", "alert");
    fixture.innerHTML = `
      <div class="lx-fatal-error-mark" aria-hidden="true">!</div>
      <span>ОШИБКА ИНТЕРФЕЙСА</span>
      <h1>LexiGo не смог отобразить этот экран</h1>
      <p>Приложение остановило повреждённый render, чтобы не показывать пустой экран.</p>
      <code>UI_RENDER_FAILURE</code>
      <div class="lx-fatal-error-actions">
        <button class="lx-button primary" type="button">Повторить</button>
        <button class="lx-button ghost" type="button">На главную</button>
      </div>
    `;

    // Keep fixture insertion and computed-style evidence capture inside one browser
    // task. React/Next hydration cannot interleave with this evaluation and reclaim
    // the React-owned body before the evidence is read (Issue #689).
    document.body.appendChild(fixture);

    try {
      const resolveColor = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const resolveBackground = (value: string) => {
        const probe = document.createElement("span");
        probe.style.backgroundColor = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return resolved;
      };
      const resolveBorder = (value: string) => {
        const probe = document.createElement("span");
        probe.style.border = "1px solid";
        probe.style.borderColor = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).borderColor;
        probe.remove();
        return resolved;
      };

      const mark = fixture.querySelector(".lx-fatal-error-mark");
      const label = fixture.querySelector(":scope > span");
      const heading = fixture.querySelector("h1");
      const body = fixture.querySelector("p");
      const code = fixture.querySelector("code");
      const surfaceStyle = getComputedStyle(fixture);
      const markStyle = mark ? getComputedStyle(mark) : null;
      const codeStyle = code ? getComputedStyle(code) : null;

      return {
        appearance: document.documentElement.dataset.lexigoAppearance,
        backgroundColor: surfaceStyle.backgroundColor,
        backgroundImage: surfaceStyle.backgroundImage,
        color: surfaceStyle.color,
        headingColor: heading ? getComputedStyle(heading).color : "",
        markColor: markStyle?.color ?? "",
        markBackgroundColor: markStyle?.backgroundColor ?? "",
        markBorderColor: markStyle?.borderColor ?? "",
        labelColor: label ? getComputedStyle(label).color : "",
        bodyColor: body ? getComputedStyle(body).color : "",
        codeColor: codeStyle?.color ?? "",
        codeBackgroundColor: codeStyle?.backgroundColor ?? "",
        tokenCanvas: resolveColor("var(--ak-color-canvas)"),
        tokenTextMain: resolveColor("var(--ak-color-text-main)"),
        tokenTextMuted: resolveColor("var(--ak-color-text-muted)"),
        tokenWeak: resolveColor("var(--ak-color-weak)"),
        markBackground: resolveBackground(
          "color-mix(in srgb, var(--ak-color-weak) 12%, var(--ak-color-surface))",
        ),
        markBorder: resolveBorder(
          "color-mix(in srgb, var(--ak-color-weak) 46%, var(--ak-color-text-muted))",
        ),
        codeBackground: resolveBackground(
          "color-mix(in srgb, var(--ak-color-subtle) 72%, var(--ak-color-surface))",
        ),
      };
    } finally {
      fixture.remove();
    }
  });
}

async function globalErrorPresentationSnapshot(page: Page) {
  return page.evaluate((globalErrorCSS) => {
    const style = document.createElement("style");
    style.textContent = globalErrorCSS;
    document.head.appendChild(style);

    const fixture = document.createElement("div");
    fixture.className = "lx-global-error-body";
    fixture.setAttribute("data-testid", "global-error-appearance-fixture");
    fixture.innerHTML = `
      <main class="lx-global-error" role="alert">
        <section class="lx-global-error-card">
          <div class="lx-global-error-mark" aria-hidden="true">!</div>
          <small class="lx-global-error-label">ОШИБКА ПРИЛОЖЕНИЯ</small>
          <h1 class="lx-global-error-title">LexiGo не смог открыть страницу</h1>
          <p class="lx-global-error-copy">Повторите загрузку. Сессия и уже сохранённые ответы не удалены.</p>
          <code class="lx-global-error-code">ROOT_RENDER_FAILURE</code>
          <div class="lx-global-error-actions">
            <button class="lx-global-error-action lx-global-error-action--primary" type="button">Повторить</button>
            <button class="lx-global-error-action lx-global-error-action--secondary" type="button">На главную</button>
          </div>
        </section>
      </main>
    `;

    // Install the exact root-error stylesheet, connect the synthetic owner, sample
    // final computed styles and clean up in one browser task. This preserves the
    // hydration-safe evidence contract established by Issue #689.
    document.body.appendChild(fixture);

    try {
      const resolveColor = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        fixture.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const resolveBackground = (value: string) => {
        const probe = document.createElement("span");
        probe.style.backgroundColor = value;
        fixture.appendChild(probe);
        const resolved = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return resolved;
      };
      const resolveBorder = (value: string) => {
        const probe = document.createElement("span");
        probe.style.border = "1px solid";
        probe.style.borderColor = value;
        fixture.appendChild(probe);
        const resolved = getComputedStyle(probe).borderColor;
        probe.remove();
        return resolved;
      };

      const root = fixture.querySelector<HTMLElement>(".lx-global-error");
      const card = fixture.querySelector<HTMLElement>(".lx-global-error-card");
      const mark = fixture.querySelector<HTMLElement>(".lx-global-error-mark");
      const label = fixture.querySelector<HTMLElement>(".lx-global-error-label");
      const heading = fixture.querySelector<HTMLElement>(".lx-global-error-title");
      const copy = fixture.querySelector<HTMLElement>(".lx-global-error-copy");
      const code = fixture.querySelector<HTMLElement>(".lx-global-error-code");
      const primary = fixture.querySelector<HTMLButtonElement>(".lx-global-error-action--primary");
      const secondary = fixture.querySelector<HTMLButtonElement>(".lx-global-error-action--secondary");

      if (!root || !card || !mark || !label || !heading || !copy || !code || !primary || !secondary) {
        throw new Error("global error appearance fixture is incomplete");
      }

      const bodyStyle = getComputedStyle(fixture);
      const rootStyle = getComputedStyle(root);
      const cardStyle = getComputedStyle(card);
      const primaryStyle = getComputedStyle(primary);
      const secondaryStyle = getComputedStyle(secondary);

      return {
        appearance: document.documentElement.dataset.lexigoAppearance,
        bodyBackgroundColor: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        rootBackgroundColor: rootStyle.backgroundColor,
        rootBackgroundImage: rootStyle.backgroundImage,
        rootColor: rootStyle.color,
        cardBackgroundColor: cardStyle.backgroundColor,
        cardColor: cardStyle.color,
        cardBorderColor: cardStyle.borderColor,
        markColor: getComputedStyle(mark).color,
        labelColor: getComputedStyle(label).color,
        headingColor: getComputedStyle(heading).color,
        copyColor: getComputedStyle(copy).color,
        codeColor: getComputedStyle(code).color,
        primaryColor: primaryStyle.color,
        primaryBackgroundColor: primaryStyle.backgroundColor,
        primaryBorderColor: primaryStyle.borderColor,
        secondaryColor: secondaryStyle.color,
        secondaryBackgroundColor: secondaryStyle.backgroundColor,
        secondaryBorderColor: secondaryStyle.borderColor,
        tokenCanvas: resolveBackground("var(--ak-color-canvas)"),
        tokenSurface: resolveBackground("var(--ak-color-surface)"),
        tokenTextMain: resolveColor("var(--ak-color-text-main)"),
        tokenTextMuted: resolveColor("var(--ak-color-text-muted)"),
        tokenWeak: resolveColor("var(--ak-color-weak)"),
        tokenPrimary: resolveColor("var(--ak-color-primary)"),
        tokenPrimarySoft: resolveBackground("var(--ak-color-primary-soft)"),
        transparentBackground: resolveBackground("transparent"),
        cardBorder: resolveBorder(
          "color-mix(in srgb, var(--ak-color-text-main) 18%, transparent)",
        ),
        primaryBorder: resolveBorder(
          "color-mix(in srgb, var(--ak-color-primary) 58%, var(--ak-color-text-muted))",
        ),
        secondaryBorder: resolveBorder(
          "color-mix(in srgb, var(--ak-color-text-muted) 58%, transparent)",
        ),
      };
    } finally {
      fixture.remove();
      style.remove();
    }
  }, GLOBAL_ERROR_CSS);
}

test.describe.configure({ timeout: 45_000 });

for (const appearance of ["light", "dark"] as const) {
  test(`application error boundary uses ${appearance} semantic appearance tokens`, async ({ page }) => {
    await installAppearancePreference(page, appearance);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.dataset.lexigoAppearance),
    ).toBe(appearance);

    const snapshot = await semanticPresentationSnapshot(page);

    // The fixture is intentionally ephemeral: it must not replace or persist in
    // the React-owned application body after the atomic style read completes.
    await expect(page.getByTestId("application-error-boundary-appearance-fixture")).toHaveCount(0);

    expect(snapshot.appearance).toBe(appearance);
    expect(snapshot.backgroundColor).toBe(snapshot.tokenCanvas);
    expect(snapshot.backgroundImage).toBe("none");
    expect(snapshot.color).toBe(snapshot.tokenTextMain);
    expect(snapshot.headingColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.markColor).toBe(snapshot.tokenWeak);
    expect(snapshot.markBackgroundColor).toBe(snapshot.markBackground);
    expect(snapshot.markBorderColor).toBe(snapshot.markBorder);
    expect(snapshot.labelColor).toBe(snapshot.tokenWeak);
    expect(snapshot.bodyColor).toBe(snapshot.tokenTextMuted);
    expect(snapshot.codeColor).toBe(snapshot.tokenTextMuted);
    expect(snapshot.codeBackgroundColor).toBe(snapshot.codeBackground);
  });

  test(`global root error uses ${appearance} semantic appearance tokens`, async ({ page }) => {
    await installAppearancePreference(page, appearance);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.dataset.lexigoAppearance),
    ).toBe(appearance);

    const snapshot = await globalErrorPresentationSnapshot(page);

    await expect(page.getByTestId("global-error-appearance-fixture")).toHaveCount(0);

    expect(snapshot.appearance).toBe(appearance);
    expect(snapshot.bodyBackgroundColor).toBe(snapshot.tokenCanvas);
    expect(snapshot.bodyColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.rootBackgroundColor).toBe(snapshot.tokenCanvas);
    expect(snapshot.rootBackgroundImage).toBe("none");
    expect(snapshot.rootColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.cardBackgroundColor).toBe(snapshot.tokenSurface);
    expect(snapshot.cardColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.cardBorderColor).toBe(snapshot.cardBorder);
    expect(snapshot.markColor).toBe(snapshot.tokenWeak);
    expect(snapshot.labelColor).toBe(snapshot.tokenWeak);
    expect(snapshot.headingColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.copyColor).toBe(snapshot.tokenTextMuted);
    expect(snapshot.codeColor).toBe(snapshot.tokenTextMuted);
    expect(snapshot.primaryColor).toBe(snapshot.tokenPrimary);
    expect(snapshot.primaryBackgroundColor).toBe(snapshot.tokenPrimarySoft);
    expect(snapshot.primaryBorderColor).toBe(snapshot.primaryBorder);
    expect(snapshot.secondaryColor).toBe(snapshot.tokenTextMain);
    expect(snapshot.secondaryBackgroundColor).toBe(snapshot.transparentBackground);
    expect(snapshot.secondaryBorderColor).toBe(snapshot.secondaryBorder);
  });
}
