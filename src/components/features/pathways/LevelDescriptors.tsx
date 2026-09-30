import { cn } from "@/lib/utils";
import type { LevelDescriptors as LevelDescriptorsModel } from "@/types/pathways";

export function LevelDescriptors({ levels }: { levels: LevelDescriptorsModel[] }) {
  return (
    <div className="space-y-4">
      {levels.map((level) => (
        <section
          key={level.level}
          className={cn(
            "rounded-lg border p-4",
            level.isTarget ? "border-2 border-indigo-700 bg-indigo-50" : "border-slate-300",
          )}
        >
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {level.label}
            {level.isTarget && (
              <span className="rounded-full bg-indigo-700 px-2.5 py-0.5 text-sm font-medium text-white">
                Expected at your grade
              </span>
            )}
          </h3>
          {level.descriptors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {level.descriptors.map((descriptor, i) => (
                // Descriptors are static and can repeat, so position is the stable key.
                <li key={i}>{descriptor}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-700">
              The framework doesn&apos;t describe this level yet.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
