import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentPath = path.join(frontendDirectory, "components", "application-error-boundary.tsx");
const routedAppPath = path.join(frontendDirectory, "components", "routed-lexigo-app.tsx");
const layoutPath = path.join(frontendDirectory, "app", "layout.tsx");
const globalErrorPath = path.join(frontendDirectory, "app", "global-error.tsx");

describe("global application error recovery", () => {
  it("wraps the complete persistent root shell exactly once", () => {
    const layout = readFileSync(layoutPath, "utf8");
    const routedApp = readFileSync(routedAppPath, "utf8");
    expect(layout).toContain('import { ApplicationErrorBoundary } from "@/components/application-error-boundary"');
    expect(layout).toMatch(/<ApplicationErrorBoundary>[\s\S]*<ServiceWorkerRegistration \/>[\s\S]*<RoutedLexigoApp \/>[\s\S]*\{children\}[\s\S]*<LegalFooter \/>[\s\S]*<\/ApplicationErrorBoundary>/);
    expect(routedApp).not.toContain("ApplicationErrorBoundary");
    expect(routedApp).toContain("<LexigoBootstrappedApp />");
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

  it("clears stale service workers and caches before a fallback reload", () => {
    const component = readFileSync(componentPath, "utf8");
    expect(component).toContain("isVersionMismatchError");
    expect(component).toContain("UI_VERSION_MISMATCH");
    expect(component).toContain("SERVICE_WORKER_SKIP_WAITING");
    expect(component).toContain("clearLexigoRuntimeState");
    expect(component).toContain("getRegistrations");
    expect(component).toContain("Обновить приложение");
    expect(component).toContain("createServiceWorkerRecoverySnapshot");
  });

  it("provides a localized root-layout fallback outside the normal shell", () => {
    const globalError = readFileSync(globalErrorPath, "utf8");
    expect(globalError).toContain("export default function GlobalError");
    expect(globalError).toContain("<html lang=\"ru\">");
    expect(globalError).toContain("clearLexigoRuntimeState");
    expect(globalError).toContain("Очистить кэш и обновить");
    expect(globalError).not.toContain("This page couldn’t load");
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
