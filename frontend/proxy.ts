import { type NextRequest, NextResponse } from "next/server";

import {
  createContentSecurityPolicy,
  resolveContentSecurityPolicyMode,
} from "./lib/content-security-policy";

export function proxy(request: NextRequest) {
  const mode = resolveContentSecurityPolicyMode();
  if (mode === "disabled") return NextResponse.next();

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = createContentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");
  const requestHeaders = new Headers(request.headers);

  // Next.js reads the enforcing request header to attach this nonce to its
  // framework scripts and styles. Stage still returns only Report-Only to the
  // browser, so it can observe the exact production policy without blocking.
  requestHeaders.set("Content-Security-Policy", policy);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(
    mode === "report-only" ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
    policy,
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|icons/|manifest.webmanifest|sw.js|offline.css|offline.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
