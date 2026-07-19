import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { canonicalURLFromLegacySearch } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Главная · LexiGo",
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function searchString(values: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(values)) {
    const entries = Array.isArray(rawValue) ? rawValue : rawValue === undefined ? [] : [rawValue];
    entries.forEach((value) => params.append(key, value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolved = await searchParams;
  const search = searchString(resolved);
  const legacyTarget = canonicalURLFromLegacySearch(search);
  if (legacyTarget) redirect(legacyTarget);

  const resetToken = typeof resolved.reset_token === "string" ? resolved.reset_token.trim() : "";
  if (resetToken) redirect(`/profile?reset_token=${encodeURIComponent(resetToken)}`);

  return null;
}
