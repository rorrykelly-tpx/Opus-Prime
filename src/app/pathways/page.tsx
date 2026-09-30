import type { Metadata } from "next";

import { HomeView } from "@/components/features/pathways/HomeView";

export const metadata: Metadata = { title: "Grow in your craft" };

export default function PathwaysHomePage() {
  return <HomeView />;
}
