import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "..");

function repositoryFile(path: string): string {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

describe("production proxy routing", () => {
  it("routes the Apple Calendar endpoint to Next.js before the backend API catch-all", () => {
    const caddyfile = repositoryFile("deploy/Caddyfile");
    const calendarRoute = "handle /api/calendar/reminder";
    const backendCatchAll = "handle /api/*";
    const calendarRouteIndex = caddyfile.indexOf(calendarRoute);
    const backendCatchAllIndex = caddyfile.indexOf(backendCatchAll);

    expect(calendarRouteIndex).toBeGreaterThanOrEqual(0);
    expect(backendCatchAllIndex).toBeGreaterThanOrEqual(0);
    expect(calendarRouteIndex).toBeLessThan(backendCatchAllIndex);

    const calendarBlock = caddyfile.slice(calendarRouteIndex, backendCatchAllIndex);
    expect(calendarBlock).toContain("reverse_proxy web:3000");
    expect(calendarBlock).not.toContain("reverse_proxy api:8080");
  });

  it("keeps SSH routing separate from the mandatory public HTTPS origin", () => {
    const transport = repositoryFile("scripts/ci/deploy-over-ssh.sh");
    const remoteDeploy = repositoryFile("scripts/remote-deploy.sh");
    const stageWorkflow = repositoryFile(".github/workflows/deploy-stage.yml");
    const productionWorkflow = repositoryFile(".github/workflows/deploy-prod.yml");

    expect(transport).toContain('PUBLIC_URL="${PUBLIC_URL:?PUBLIC_URL is required}"');
    expect(transport).not.toContain('PUBLIC_URL="http://${DEPLOY_HOST}"');
    expect(transport).toContain("PUBLIC_URL must be one HTTPS origin");
    expect(remoteDeploy).toContain("SESSION_COOKIE_SECURE=true");
    expect(remoteDeploy).toContain('upsert_env SESSION_COOKIE_SECURE "true"');
    expect(remoteDeploy).toContain('--resolve "$SITE_HOST:443:127.0.0.1"');
    expect(stageWorkflow).toContain('PUBLIC_URL: ${{ vars.PUBLIC_URL }}');
    expect(productionWorkflow).toContain('PUBLIC_URL: ${{ vars.PUBLIC_URL }}');
  });
});
