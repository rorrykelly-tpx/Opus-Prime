import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LevelDescriptors } from "@/components/features/pathways/LevelDescriptors";
import { MarkAsRead } from "@/components/features/pathways/MarkAsRead";
import { ResourceList } from "@/components/features/pathways/ResourceList";
import { bandLabel, gradeLabel, moduleHref, moduleParamsSchema, pathwayHref } from "@/lib/pathways";
import { findRole, getModule } from "@/server/services/pathways";
import type { Grade, ModuleDetail } from "@/types/pathways";

type ModulePageProps = { params: Promise<{ role: string; grade: string; module: string }> };

async function findModule(params: ModulePageProps["params"]) {
  const parsed = moduleParamsSchema.safeParse(await params);
  if (!parsed.success) return null;
  const { role: roleSlug, grade, module: moduleSlug } = parsed.data;
  const role = findRole(roleSlug);
  const mod = getModule(roleSlug, grade, moduleSlug);
  return role && mod ? { role, grade, mod } : null;
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const found = await findModule(params);
  return found ? { title: `${found.mod.name} | ${found.role.role} | Learning pathways` } : {};
}

function sectionName(mod: ModuleDetail): string {
  if (mod.kind === "skill") return "Craft skill";
  if (mod.kind === "behaviour") return "Behaviour";
  return `Consulting core: ${mod.pillar}`;
}

function TargetSummary({ mod, grade }: { mod: ModuleDetail; grade: Grade }) {
  if (mod.kind === "skill") {
    return mod.target ? (
      <p>
        Expected at your grade ({gradeLabel(grade)}): <strong>{mod.target}</strong>
      </p>
    ) : (
      <p>The framework doesn&apos;t expect this skill at your grade ({gradeLabel(grade)}).</p>
    );
  }
  if (mod.kind === "behaviour") {
    return (
      <p>
        Expected at your grade: <strong>{bandLabel(mod.target)}</strong>
      </p>
    );
  }
  return (
    <p>
      <strong className="capitalize">{mod.stage}</strong> stage
      {mod.foundation && ". A foundation module for everyone"}
    </p>
  );
}

export default async function ModulePage({ params }: ModulePageProps) {
  const found = await findModule(params);
  if (!found) notFound();
  const { role, grade, mod } = found;
  const pathwayLink = pathwayHref(role.slug, grade);

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-2 text-slate-700">
          <li>
            <Link href={pathwayLink} className="text-indigo-800 underline underline-offset-2">
              My pathway
            </Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li>{sectionName(mod)}</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{mod.name}</h1>
      {mod.definition && <p className="mt-4 max-w-3xl text-lg text-slate-700">{mod.definition}</p>}
      <div className="mt-4 text-lg">
        <TargetSummary mod={mod} grade={grade} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {mod.kind === "consulting" ? (
            <section aria-labelledby="where-heading">
              <h2 id="where-heading" className="text-2xl font-semibold">
                Where this sits
              </h2>
              <p className="mt-3">
                {mod.name} is {mod.foundation ? "a foundation module" : "a module"} at{" "}
                <strong>{mod.stage}</strong> stage in {mod.pillar}.
              </p>
              <p className="mt-2">
                It supports the{" "}
                <Link
                  href={moduleHref(role.slug, grade, mod.links.behaviourSlug)}
                  className="text-indigo-800 underline underline-offset-2"
                >
                  {mod.links.behaviour}
                </Link>{" "}
                behaviour and the {mod.links.impact} impact.
              </p>
              <div className="mt-6">
                <MarkAsRead slug={mod.slug} />
              </div>
              <h3 className="mt-10 text-xl font-semibold">Other modules in {mod.pillar}</h3>
              <ul className="mt-3 space-y-2">
                {mod.pillarModules.map((m) => {
                  const current = m.slug === mod.slug;
                  return (
                    <li key={m.slug}>
                      <Link
                        href={moduleHref(role.slug, grade, m.slug)}
                        aria-current={current ? "page" : undefined}
                        className="text-indigo-800 underline underline-offset-2 aria-[current=page]:font-semibold aria-[current=page]:no-underline"
                      >
                        {m.name}
                      </Link>{" "}
                      <span className="text-sm text-slate-700">
                        ({m.stage}
                        {m.foundation && ", foundation"}){current && ". You're here"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <section aria-labelledby="good-heading">
              <h2 id="good-heading" className="text-2xl font-semibold">
                What good looks like
              </h2>
              <p className="mt-2 text-slate-700">
                {mod.kind === "skill" && mod.target === null
                  ? "How the framework describes each level of this skill."
                  : "The level expected at your grade, with the levels either side for context."}
              </p>
              {mod.targetUndescribed && (
                <p className="mt-4 rounded-lg border-l-4 border-amber-600 bg-amber-50 p-4">
                  The framework expects this level at your grade, but doesn&apos;t describe it yet.
                  Ask your Head of Practice what good looks like.
                </p>
              )}
              <div className="mt-4">
                <LevelDescriptors levels={mod.levels} />
              </div>
              <div className="mt-6">
                <MarkAsRead slug={mod.slug} />
              </div>
            </section>
          )}
        </div>

        <section aria-labelledby="resources-heading">
          <h2 id="resources-heading" className="text-2xl font-semibold">
            Learning resources
          </h2>
          <div className="mt-4">
            <ResourceList resources={mod.resources} />
          </div>
        </section>
      </div>
    </main>
  );
}
