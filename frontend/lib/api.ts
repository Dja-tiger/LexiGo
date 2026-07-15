/**
 * Browser requests use the same origin. In local Docker, Next.js rewrites /api/*
 * to the Go container; on stage/prod Caddy routes /api/* directly to Go.
 * This avoids baking an environment-specific hostname into the PWA image.
 */
export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl()}${normalizedPath}`;
}
