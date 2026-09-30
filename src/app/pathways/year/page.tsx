import type { Metadata } from "next";

import { YearView } from "@/components/features/pathways/YearView";

export const metadata: Metadata = { title: "My year" };

export default function YearPage() {
  return <YearView />;
}
