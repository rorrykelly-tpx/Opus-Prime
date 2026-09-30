import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ModuleCard } from "@/components/features/pathways/ModuleCard";
import { PathwayProgress } from "@/components/features/pathways/PathwayProgress";
import { gradeLabel, pathwayParamsSchema } from "@/lib/pathways";
import { buildPathway } from "@/server/services/pathways";

type PathwayPageProps = { params: Promise<{ role: string; grade: string }> };

async function findPathway(params: PathwayPageProps["params"]) {
  const parsed = pathwayParamsSchema.safeParse(await params);
  return parsed.success ? buildPathway(parsed.data.role, parsed.data.grade) : null;
}

export async function generateMetadata({ params }: PathwayPageProps): Promise<Metadata> {
  const pathway = await findPathway(params);
  return pathway
    ? { title: `${pathway.role.role}, ${gradeLabel(pathway.grade)} | Learning pathways` }
    : {};
}

export default async function PathwayPage({ params }: PathwayPageProps) {
  const pathway = await findPathway(params);
  if (!pathway) notFound();
  const { role, grade } = pathway;
  const changeHref = `/pathways?${new URLSearchParams({ role: role.slug, grade })}`;
  const gridClass = "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-medium text-slate-700">{role.practice}</p>
      <h1 className="mt-1 text-4xl font-semibold tracking-tight">{role.role}</h1>
      <p className="mt-4 text-lg">
        Your grade: <strong>{gradeLabel(grade)}</strong>.{" "}
        <Link
          href={changeHref}
          className="font-medium text-indigo-800 underline underline-offset-2"
        >
          Change role or grade
        </Link>
      </p>

      <section aria-labelledby="progress-heading" className="mt-10 rounded-lg bg-slate-50 p-6">
        <h2 id="progress-heading" className="text-2xl font-semibold">
          Pathway progress
        </h2>
        <p className="mt-2 text-slate-700">
          Each module has three steps: read what good looks like, pass the quiz, and log evidence at
          the level for your grade. For now you can mark modules as read. Quizzes and evidence are
          coming soon.
        </p>
        <div className="mt-4">
          <PathwayProgress moduleSlugs={pathway.moduleSlugs} />
        </div>
      </section>

      <section aria-labelledby="craft-heading" className="mt-12">
        <h2 id="craft-heading" className="text-2xl font-semibold">
          Your craft skills
        </h2>
        <p className="mt-2 text-slate-700">
          The technical skills for {role.role} in the progression framework, with the level expected
          at your grade.
        </p>
        <ul className={gridClass}>
          {pathway.craftSkills.map((m) => (
            <ModuleCard key={m.slug} mod={m} roleSlug={role.slug} grade={grade} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="behaviours-heading" className="mt-12">
        <h2 id="behaviours-heading" className="text-2xl font-semibold">
          Behaviours
        </h2>
        <p className="mt-2 text-slate-700">How you work. These are expected of everyone.</p>
        <ul className={gridClass}>
          {pathway.behaviours.map((m) => (
            <ModuleCard key={m.slug} mod={m} roleSlug={role.slug} grade={grade} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="consulting-heading" className="mt-12">
        <h2 id="consulting-heading" className="text-2xl font-semibold">
          Consulting core
        </h2>
        <p className="mt-2 text-slate-700">
          Our consulting skills programme. Each pillar moves from literacy to fluency to mastery.
          Foundation modules are for everyone.
        </p>
        {pathway.consulting.map((pillar) => (
          <div key={pillar.pillar} className="mt-8">
            <h3 className="text-xl font-semibold">{pillar.pillar}</h3>
            <p className="mt-1 text-slate-700">{pillar.summary}</p>
            <ul className={gridClass}>
              {pillar.modules.map((m) => (
                <ModuleCard key={m.slug} mod={m} roleSlug={role.slug} grade={grade} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
