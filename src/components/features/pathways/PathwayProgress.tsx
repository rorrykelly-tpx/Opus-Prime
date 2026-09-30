"use client";

import { summariseProgress } from "@/lib/pathways";
import { useReadModules } from "@/lib/read-progress";

export function PathwayProgress({ moduleSlugs }: { moduleSlugs: string[] }) {
  const { read, total, percent } = summariseProgress(moduleSlugs, useReadModules());
  return (
    <div className="space-y-2">
      <p className="font-medium">
        {read} of {total} modules read ({percent}%)
      </p>
      {/* Decorative: the sentence above carries the same information. */}
      <div aria-hidden="true" className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-700" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
