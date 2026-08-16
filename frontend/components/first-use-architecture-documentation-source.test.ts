import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const mountedRepositoryDirectory = "/repository";
const repositoryDirectory = existsSync(path.join(mountedRepositoryDirectory, "README.md"))
  ? mountedRepositoryDirectory
  : path.resolve(frontendDirectory, "..");

function readFrontendFile(relativePath: string): string {
  return readFileSync(path.join(frontendDirectory, relativePath), "utf8");
}

function readRepositoryFile(relativePath: string): string {
  return readFileSync(path.join(repositoryDirectory, relativePath), "utf8");
}

describe("First Use public architecture ownership", () => {
  it("keeps Guest Home and onboarding documentation synchronized with bootstrap owners", () => {
    const bootstrap = readFrontendFile("components/lexigo-bootstrapped-app.tsx");
    const readme = readRepositoryFile("README.md");
    const architecture = readRepositoryFile("docs/architecture.md");

    expect(bootstrap).toContain('import("./lexigo-guest-home-app")');
    expect(bootstrap).toContain('import("./lexigo-onboarding-app")');
    expect(bootstrap).toContain("const useGuestHomeIsland");
    expect(bootstrap).toContain("const useOnboardingIsland");

    expect(readme).toContain("`LexigoGuestHomeApp`");
    expect(readme).toContain("`LexigoOnboardingApp`");
    expect(readme).toContain("guest `/` после session bootstrap");
    expect(readme).toContain("authenticated `/onboarding`");
    expect(readme).not.toContain("- `LexigoHomeApp` владеет `/`, `LexigoLearnApp`");

    expect(architecture).toContain("| guest `/` | `LexigoGuestHomeApp` |");
    expect(architecture).toContain("| authenticated `/` | `LexigoHomeApp` |");
    expect(architecture).toContain("| authenticated `/onboarding` | `LexigoOnboardingApp` |");
    expect(architecture).toContain("`frontend/app/onboarding/page.tsx`");
    expect(architecture).not.toContain(
      "| `/` | `LexigoHomeApp` | progress/active-session reads, next-best action и создание урока |",
    );
  });
});
