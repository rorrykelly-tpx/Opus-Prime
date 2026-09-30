import type { Metadata } from "next";

import { ImportView } from "@/components/features/pathways/ImportView";

export const metadata: Metadata = { title: "Bring in your self assessment" };

export default function ImportPage() {
  return <ImportView />;
}
