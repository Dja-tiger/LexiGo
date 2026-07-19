import type { Metadata } from "next";
import { notFound } from "next/navigation";

type WordDetailPageProps = {
  params: Promise<{ id: string }>;
};

function validWordID(value: string): boolean {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

export async function generateMetadata({ params }: WordDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: validWordID(id) ? "Карточка слова · LexiGo" : "Слово не найдено · LexiGo",
  };
}

export default async function WordDetailPage({ params }: WordDetailPageProps) {
  const { id } = await params;
  if (!validWordID(id)) notFound();
  return null;
}
