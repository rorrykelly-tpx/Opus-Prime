import type { LearningResource } from "@/types/pathways";

function hostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function ResourceList({ resources }: { resources: LearningResource[] }) {
  if (resources.length === 0) {
    return (
      <p className="text-slate-700">
        No learning resources are linked to this module yet. Your Head of Practice or the L&amp;D
        team can suggest some.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {resources.map((resource) => (
        <li key={resource.id}>
          <a
            href={resource.url}
            className="font-semibold text-indigo-800 underline underline-offset-2 hover:text-indigo-900"
          >
            {resource.title}
          </a>
          <p className="text-sm text-slate-700">
            {resource.description}
            {resource.description && " · "}
            {hostname(resource.url)}
          </p>
        </li>
      ))}
    </ul>
  );
}
