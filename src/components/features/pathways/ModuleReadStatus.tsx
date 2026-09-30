"use client";

import { useReadModules } from "@/lib/read-progress";
import { cn } from "@/lib/utils";

export function ModuleReadStatus({ slug }: { slug: string }) {
  const read = useReadModules().has(slug);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium",
        read ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700",
      )}
    >
      {read ? "Read" : "Not started"}
    </span>
  );
}
