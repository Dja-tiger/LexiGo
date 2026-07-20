import type { NextConfig } from "next";

const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080";
const rawBuildID = process.env.APP_BUILD_ID?.trim() || process.env.GITHUB_SHA?.trim() || "local";
const appBuildID = rawBuildID.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "local";
const configuredRUMSampleRate = Number.parseFloat(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE ?? "0.1");
const rumSampleRate = Number.isFinite(configuredRUMSampleRate)
  ? String(Math.min(1, Math.max(0, configuredRUMSampleRate)))
  : "0.1";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  generateBuildId: async () => appBuildID,
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: appBuildID,
    NEXT_PUBLIC_RUM_SAMPLE_RATE: rumSampleRate,
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiInternalUrl}/api/:path*` },
      { source: "/health/:path*", destination: `${apiInternalUrl}/health/:path*` },
    ];
  },
};

export default nextConfig;
