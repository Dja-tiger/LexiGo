import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentPath = path.join(frontendDirectory, "components", "application-error-boundary.tsx");
const routedAppPath = path.join(frontendDirectory, "components", "routed-lexigo-app.tsx");
const layoutPath = path.join(frontendDirectory, "app", "layout.tsx");

describe("global application error recovery", () => {
  it("wraps the persistent bootstrapped application shell", () => {
    const routedApp = readFileSync(routedAppPath, "utf8");
    expect(routedApp).toContain('import { ApplicationErrorBoundary } from "./application-error-boundary"');
    expect(routedApp).toMatch(/<ApplicationErrorBoundary>[\s\S]*<LexigoBootstrappedApp \/>[\s\S]*<\/ApplicationErrorBoundary>/);
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
    expect(component).toContain('window.localStorage.removeItem("lexigo.navigation.v2")');
  });

  it("classifies stale chunks and offers a controlled service worker recovery", () => {
    const component = readFileSync(componentPath, "utf8");
    expect(component).toContain("isVersionMismatchError");
    expect(component).toContain("UI_VERSION_MISMATCH");
    expect(component).toContain("SERVICE_WORKER_SKIP_WAITING");
    expect(component).toContain("Обновить приложение");
    expect(component).toContain("createServiceWorkerRecoverySnapshot");
  });

  it("loads the diagnostic and update screen styles globally", () => {
    const layout = readFileSync(layoutPath, "utf8");
    expect(layout).toContain('import "./error-boundary.css"');
    expect(layout).toContain('import "./service-worker-update.css"');
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
