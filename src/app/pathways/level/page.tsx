import type { Metadata } from "next";

import { LevelView } from "@/components/features/pathways/LevelView";

export const metadata: Metadata = { title: "Where am I?" };

export default function LevelPage() {
  return <LevelView />;
}
