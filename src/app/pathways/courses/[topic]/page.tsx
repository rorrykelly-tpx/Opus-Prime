import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoursesView } from "@/components/features/pathways/CoursesView";
import { frameworkSource } from "@/server/services/framework";

export const metadata: Metadata = { title: "Fill your knowledge gaps" };

type CoursesTopicPageProps = { params: Promise<{ topic: string }> };

export default async function CoursesTopicPage({ params }: CoursesTopicPageProps) {
  const { topic } = await params;
  if (!frameworkSource.knowledge.topics.some((t) => t.id === topic)) notFound();
  return <CoursesView topic={topic} />;
}
