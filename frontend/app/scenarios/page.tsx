import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Рабочие сценарии — LexiGo",
  description: "Каталог рабочих ситуаций для практики технического английского.",
};

export default function ScenarioCatalogPage() {
  // The authenticated client island is owned by LexigoBootstrappedApp in the
  // root layout. This file establishes only the canonical App Router boundary.
  return null;
}
