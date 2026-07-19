import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PhraseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function validSlug(value: string): boolean {
  return value.trim().length > 0 && value.length <= 120 && !value.includes("/");
}

export async function generateMetadata({ params }: PhraseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: validSlug(slug) ? "Карточка фразы · LexiGo" : "Фраза не найдена · LexiGo",
  };
}

export default async function PhraseDetailPage({ params }: PhraseDetailPageProps) {
  const { slug } = await params;
  if (!validSlug(slug)) notFound();
  return null;
}
