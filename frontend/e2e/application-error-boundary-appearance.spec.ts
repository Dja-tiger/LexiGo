import { expect, test, type Page } from "@playwright/test";

type ExplicitAppearance = "light" | "dark";

async function installAppearancePreference(page: Page, appearance: ExplicitAppearance) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
}

async function mountFatalBoundaryFixture(page: Page) {
  await page.evaluate(() => {
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
    document.body.replaceChildren(fixture);
  });
}

async function semanticPresentationSnapshot(page: Page) {
  return page.getByTestId("application-error-boundary-appearance-fixture").evaluate((element) => {
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

    const mark = element.querySelector(".lx-fatal-error-mark");
    const label = element.querySelector(":scope > span");
    const heading = element.querySelector("h1");
    const body = element.querySelector("p");
    const code = element.querySelector("code");
    const surfaceStyle = getComputedStyle(element);
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
  });
}

test.describe.configure({ timeout: 45_000 });

for (const appearance of ["light", "dark"] as const) {
  test(`application error boundary uses ${appearance} semantic appearance tokens`, async ({ page }) => {
    await installAppearancePreference(page, appearance);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(
      () => page.evaluate(() => document.documentElement.dataset.lexigoAppearance),
    ).toBe(appearance);

    await mountFatalBoundaryFixture(page);
    const fixture = page.getByTestId("application-error-boundary-appearance-fixture");
    await expect(fixture).toBeVisible();

    const snapshot = await semanticPresentationSnapshot(page);

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
}
