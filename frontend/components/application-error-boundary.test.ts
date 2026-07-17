import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentPath = path.join(frontendDirectory, "components", "application-error-boundary.tsx");
const pagePath = path.join(frontendDirectory, "app", "page.tsx");
const layoutPath = path.join(frontendDirectory, "app", "layout.tsx");

describe("global application error recovery", () => {
  it("wraps the bootstrapped application at the route root", () => {
    const page = readFileSync(pagePath, "utf8");
    expect(page).toContain('import { ApplicationErrorBoundary } from "../components/application-error-boundary"');
    expect(page).toMatch(/<ApplicationErrorBoundary>[\s\S]*<LexigoBootstrappedApp \/>[\s\S]*<\/ApplicationErrorBoundary>/);
  });

  it("implements React error lifecycle diagnostics and two recovery actions", () => {
    const component = readFileSync(componentPath, "utf8");
    expect(component).toContain("static getDerivedStateFromError");
    expect(component).toContain("componentDidCatch");
    expect(component).toContain("UI_RENDER_FAILURE");
    expect(component).toContain('role="alert"');
    expect(component).toContain("window.location.reload()");
    expect(component).toContain('window.location.assign("/")');
    expect(component).toContain('window.localStorage.removeItem("lexigo.navigation.v1")');
  });

  it("loads the diagnostic screen styles globally", () => {
    const layout = readFileSync(layoutPath, "utf8");
    expect(layout).toContain('import "./error-boundary.css"');
  });

  it("contains no capture-phase dictionary click interception", () => {
    const premiumApp = readFileSync(
      path.join(frontendDirectory, "components", "lexigo-premium-app.tsx"),
      "utf8",
    );
    expect(premiumApp).not.toMatch(/addEventListener\(\s*["']click["'][\s\S]*?true\s*\)/);
    expect(premiumApp).not.toContain("window.location.assign(navigationURL");
  });
});
