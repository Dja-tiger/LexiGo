import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isScenarioSlug } from "../../../lib/scenarios";

export const metadata: Metadata = {
  title: "Рабочий сценарий — LexiGo",
  description: "Практика технического английского в рабочем сценарии с объективным feedback.",
};

type ScenarioPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { slug } = await params;
  if (!isScenarioSlug(slug)) notFound();

  // The authenticated client island is owned by LexigoBootstrappedApp in the
  // root layout. This file establishes only the canonical App Router boundary.
  return null;
}
