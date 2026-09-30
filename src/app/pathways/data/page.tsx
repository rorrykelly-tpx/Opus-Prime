import type { Metadata } from "next";

import { DataView } from "@/components/features/pathways/DataView";

export const metadata: Metadata = { title: "Framework data" };

export default function DataPage() {
  return <DataView />;
}
