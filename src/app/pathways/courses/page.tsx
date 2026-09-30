import type { Metadata } from "next";

import { CoursesView } from "@/components/features/pathways/CoursesView";

export const metadata: Metadata = { title: "Fill your knowledge gaps" };

export default function CoursesPage() {
  return <CoursesView />;
}
