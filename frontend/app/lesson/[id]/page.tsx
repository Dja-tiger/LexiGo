import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Урок · LexiGo",
  robots: { index: false, follow: false },
};

type LessonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;

  // The client never accepts an arbitrary session identifier. The only public
  // lesson route resolves the authenticated user's active session through the
  // user-scoped `/api/v1/lessons/active` endpoint.
  if (id !== "active") notFound();
  return null;
}
