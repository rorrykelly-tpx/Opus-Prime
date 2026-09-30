import Link from "next/link";

import { bandLabel, moduleHref } from "@/lib/pathways";
import type { Grade, ModuleSummary } from "@/types/pathways";

import { ModuleReadStatus } from "./ModuleReadStatus";

function targetText(mod: ModuleSummary): string {
  switch (mod.kind) {
    case "skill":
      return mod.target ? `At your grade: ${mod.target}` : "Not expected at your grade";
    case "behaviour":
      return `At your grade: ${bandLabel(mod.target)}`;
    case "consulting": {
      const stage = `${mod.stage[0]!.toUpperCase()}${mod.stage.slice(1)} stage`;
      return mod.foundation ? `${stage} · Foundation module` : stage;
    }
  }
}

interface ModuleCardProps {
  mod: ModuleSummary;
  roleSlug: string;
  grade: Grade;
}

export function ModuleCard({ mod, roleSlug, grade }: ModuleCardProps) {
  return (
    <li>
      <Link
        href={moduleHref(roleSlug, grade, mod.slug)}
        className="flex h-full flex-col gap-2 rounded-lg border border-slate-300 p-4 hover:border-indigo-700 hover:bg-indigo-50"
      >
        <span className="font-semibold text-indigo-800">{mod.name}</span>
        <span className="text-sm text-slate-700">{targetText(mod)}</span>
        <span className="mt-auto">
          <ModuleReadStatus slug={mod.slug} />
        </span>
      </Link>
    </li>
  );
}
