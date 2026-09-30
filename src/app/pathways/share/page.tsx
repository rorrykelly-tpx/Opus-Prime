import type { Metadata } from "next";

import { ShareView } from "@/components/features/pathways/ShareView";

export const metadata: Metadata = { title: "Who can see your progress" };

export default function SharePage() {
  return <ShareView />;
}
