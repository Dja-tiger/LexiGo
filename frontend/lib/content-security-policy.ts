export const CSP_REPORT_PATH = "/api/v1/security/csp-report";

export type ContentSecurityPolicyMode = "disabled" | "report-only" | "enforce";

const REPORT_ONLY_FRAME_ANCESTORS_DIAGNOSTIC =
  "The Content Security Policy directive 'frame-ancestors' is ignored when delivered in a report-only policy.";

type PolicyEnvironment = {
  CONTENT_SECURITY_POLICY_MODE?: string;
  NODE_ENV?: string;
};

export function resolveContentSecurityPolicyMode(
  environment: PolicyEnvironment = process.env,
): ContentSecurityPolicyMode {
  const configured = environment.CONTENT_SECURITY_POLICY_MODE?.trim().toLowerCase();
  if (configured === "disabled" || configured === "report-only" || configured === "enforce") {
    return configured;
  }
  if (configured) {
    throw new Error(`unsupported CONTENT_SECURITY_POLICY_MODE: ${configured}`);
  }
  return environment.NODE_ENV === "production" ? "enforce" : "disabled";
}

export function isExpectedContentSecurityPolicyConsoleDiagnostic(
  message: string,
  mode: ContentSecurityPolicyMode,
): boolean {
  return mode === "report-only" && message === REPORT_ONLY_FRAME_ANCESTORS_DIAGNOSTIC;
}

export function createContentSecurityPolicy(nonce: string, development = false): string {
  if (!/^[A-Za-z0-9+/_=-]+$/.test(nonce)) {
    throw new Error("CSP nonce must be a non-empty base64 value");
  }

  const scriptSources = ["'self'", `'nonce-${nonce}'`];
  if (development) scriptSources.push("'unsafe-eval'");

  const directives = [
    ["default-src", "'self'"],
    ["script-src", ...scriptSources],
    ["script-src-attr", "'none'"],
    ["style-src", "'self'", `'nonce-${nonce}'`],
    ["style-src-elem", "'self'", `'nonce-${nonce}'`],
    ["style-src-attr", "'unsafe-inline'"],
    ["connect-src", "'self'"],
    ["img-src", "'self'", "data:", "blob:"],
    ["font-src", "'self'", "data:"],
    ["media-src", "'self'", "blob:"],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    ["frame-src", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    ["report-uri", CSP_REPORT_PATH],
  ];

  return directives.map((directive) => directive.join(" ")).join("; ");
}
