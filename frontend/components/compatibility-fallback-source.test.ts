import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

describe("final compatibility fallback inventory", () => {
  it("keeps every dedicated route island before the final premium fallback", () => {
    const bootstrap = readComponent("lexigo-bootstrapped-app.tsx");
    const fallbackIndex = bootstrap.indexOf("<LexigoPremiumApp");

    expect(fallbackIndex).toBeGreaterThan(-1);
    for (const owner of [
      "<LexigoScenarioCatalogApp",
      "<LexigoScenarioApp",
      "<LexigoGuestHomeApp",
      "<LexigoHomeApp",
      "<LexigoOnboardingApp",
      "<LexigoLearnApp",
      "<LexigoActiveLessonApp",
      "<LexigoDictionaryApp",
      "<LexigoPhrasesApp",
      "<LexigoProgressApp",
      "<LexigoProfileApp",
    ]) {
      const ownerIndex = bootstrap.indexOf(owner);
      expect(ownerIndex, owner).toBeGreaterThan(-1);
      expect(ownerIndex, owner).toBeLessThan(fallbackIndex);
    }
  });

  it("keeps the complete island predicate inventory fail closed", () => {
    const bootstrap = readComponent("lexigo-bootstrapped-app.tsx");

    for (const predicate of [
      'const useGuestHomeIsland = effectiveRouteGraph === "home" && isHomeRoute(pathname) && initialSession === null;',
      'const useHomeIsland = effectiveRouteGraph === "home" && isHomeRoute(pathname) && initialSession !== null;',
      "const useOnboardingIsland = isOnboardingRoute(pathname) && initialSession !== null;",
      'const useLearnIsland = effectiveRouteGraph === "learn" && isLearnRoute(pathname);',
      "const useActiveLessonIsland = (isActiveLessonRoute(pathname) || activeLessonOwnerRetained)",
      'const useDictionaryIsland = effectiveRouteGraph === "dictionary" && isDictionaryRoute(pathname);',
      'const usePhrasesIsland = effectiveRouteGraph === "product" && isPhrasesRoute(pathname);',
      "const useProgressIsland = isProgressRoute(pathname);",
      "const useProfileIsland = isProfileRoute(pathname) && initialSession !== null;",
      "const useScenarioCatalogIsland = isScenarioCatalogRoute(pathname) && initialSession !== null;",
      "const useScenarioIsland = isScenarioDetailRoute(pathname) && initialSession !== null;",
    ]) {
      expect(bootstrap, predicate).toContain(predicate);
    }
  });

  it("limits the remaining presentation dispatch to live compatibility owners", () => {
    const premium = readComponent("lexigo-premium-app.tsx");

    expect(premium).toContain('const view = navigation.view === "library" ? renderLibrary()');
    expect(premium).toContain(': navigation.view === "profile" ? renderProfile()');
    expect(premium).toContain(': renderLesson();');

    for (const retired of [
      "function renderHome()",
      "function renderLearn()",
      "function renderProgress()",
      "function renderPhrases()",
      'navigation.view === "home"',
      'navigation.view === "learn" ? renderLearn()',
      'navigation.view === "progress" ? renderProgress()',
      'navigation.view === "phrases" ? renderPhrases()',
    ]) {
      expect(premium, retired).not.toContain(retired);
    }
  });

  it("preserves guest Profile, Library, Lesson and unknown-route fallback", () => {
    const bootstrap = readComponent("lexigo-bootstrapped-app.tsx");
    const premium = readComponent("lexigo-premium-app.tsx");

    expect(premium).toContain("requestAuthentication(");
    expect(premium).toContain("function renderLibrary()");
    expect(premium).toContain("function renderProfile()");
    expect(premium).toContain("function renderLesson()");
    expect(premium).toContain("async function startLesson(");
    expect(premium).toContain("async function resumeLesson(");
    expect(bootstrap).toContain("const useProfileIsland = isProfileRoute(pathname) && initialSession !== null;");
    expect(bootstrap).toContain('return "product";');
    expect(bootstrap).toContain("<LexigoPremiumApp key={routeKey} initialSession={initialSession} />");
  });

  it("keeps First Use outside the final premium fallback", () => {
    const bootstrap = readComponent("lexigo-bootstrapped-app.tsx");
    const guest = readComponent("lexigo-guest-home-app.tsx");
    const onboarding = readComponent("lexigo-onboarding-app.tsx");

    expect(guest).toContain('data-route-client-island="guest-home"');
    expect(guest).not.toContain("/api/v1/progress");
    expect(guest).not.toContain("/api/v1/lessons/active");
    expect(onboarding).toContain('data-route-client-island="onboarding"');
    expect(onboarding).toContain('"/api/v1/onboarding"');
    expect(onboarding).toContain('"/api/v1/onboarding/start"');
    expect(onboarding).toContain('"/api/v1/onboarding/complete"');
    expect(onboarding).toContain('"/api/v1/onboarding/skip"');
    expect(bootstrap).toContain("<LexigoGuestHomeApp key=\"guest:first-use\" />");
    expect(bootstrap).toContain("<LexigoOnboardingApp");
  });

  it("keeps shared account and session runtime outside route-island selection", () => {
    const bootstrap = readComponent("lexigo-bootstrapped-app.tsx");
    const fallbackIndex = bootstrap.indexOf("<LexigoPremiumApp");

    for (const owner of [
      "<ReviewOutboxRuntime session={initialSession} />",
      "<EmailChangeConfirmation onSessionInvalidated={handleEmailChanged} />",
      "<AccountSecurityPanel",
      "<AccountEmailPanel",
      "<AccountDataPanel",
    ]) {
      expect(bootstrap, owner).toContain(owner);
    }
    expect(bootstrap.indexOf("<AccountSecurityPanel")).toBeGreaterThan(fallbackIndex);
  });

  it("does not classify canonical Learn CSS as orphaned after presentation retirement", () => {
    const learn = readComponent("lexigo-learn-app.tsx");

    for (const className of [
      "lx-composer-context",
      "lx-setup-card",
      "lx-setup-block",
      "lx-mode-selector",
      "lx-source-selector",
      "lx-setup-footer",
      "lx-lesson-preview",
      "lx-setup-submit",
    ]) {
      expect(learn, className).toContain(className);
    }
  });
});