import { describe, expect, it } from "vitest";

import {
  createContentSecurityPolicy,
  isExpectedContentSecurityPolicyConsoleDiagnostic,
  resolveContentSecurityPolicyMode,
} from "./content-security-policy";

describe("content security policy", () => {
  it("defaults to enforcement for production and remains disabled for local development", () => {
    expect(resolveContentSecurityPolicyMode({ NODE_ENV: "production" })).toBe("enforce");
    expect(resolveContentSecurityPolicyMode({ NODE_ENV: "development" })).toBe("disabled");
    expect(resolveContentSecurityPolicyMode({
      NODE_ENV: "production",
      CONTENT_SECURITY_POLICY_MODE: "report-only",
    })).toBe("report-only");
  });

  it("rejects an unknown deployment mode instead of silently disabling CSP", () => {
    expect(() => resolveContentSecurityPolicyMode({
      NODE_ENV: "production",
      CONTENT_SECURITY_POLICY_MODE: "observe",
    })).toThrow(/unsupported CONTENT_SECURITY_POLICY_MODE/);
  });

  it("builds a strict production policy with a narrow style-attribute exception", () => {
    const policy = createContentSecurityPolicy("c2VjdXJlLW5vbmNl");

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'nonce-c2VjdXJlLW5vbmNl'");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("style-src 'self' 'nonce-c2VjdXJlLW5vbmNl'");
    expect(policy).toContain("style-src-elem 'self' 'nonce-c2VjdXJlLW5vbmNl'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("img-src 'self' data: blob:");
    expect(policy).toContain("font-src 'self' data:");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("report-uri /api/v1/security/csp-report");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy.match(/'unsafe-inline'/g)).toHaveLength(1);
  });

  it("allows unsafe-eval only when a developer explicitly enables CSP in development", () => {
    expect(createContentSecurityPolicy("ZGV2LW5vbmNl", true)).toContain("'unsafe-eval'");
  });

  it("ignores only WebKit's non-actionable frame-ancestors report-only diagnostic", () => {
    const diagnostic =
      "The Content Security Policy directive 'frame-ancestors' is ignored when delivered in a report-only policy.";

    expect(isExpectedContentSecurityPolicyConsoleDiagnostic(diagnostic, "report-only")).toBe(true);
    expect(isExpectedContentSecurityPolicyConsoleDiagnostic(diagnostic, "enforce")).toBe(false);
    expect(isExpectedContentSecurityPolicyConsoleDiagnostic(
      "Refused to execute a script because it violates the Content Security Policy directive.",
      "report-only",
    )).toBe(false);
  });
});
