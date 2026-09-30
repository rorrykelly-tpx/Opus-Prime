import type { Metadata } from "next";
import { z } from "zod";

import { PathwayBuilder } from "@/components/features/pathways/PathwayBuilder";
import { isGrade } from "@/lib/pathways";
import { listRoles } from "@/server/services/pathways";

export const metadata: Metadata = {
  title: "Choose your role and grade | Learning pathways",
};

// "Change role or grade" links here with the current choice so the form starts filled in.
const prefillSchema = z.object({
  role: z.string().optional().catch(undefined),
  grade: z.string().optional().catch(undefined),
});

export default async function PathwaysHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const prefill = prefillSchema.parse(await searchParams);
  const roles = listRoles();
  const initialRole = roles.find((r) => r.slug === prefill.role);
  const initialGrade =
    initialRole &&
    prefill.grade &&
    isGrade(prefill.grade) &&
    initialRole.grades.includes(prefill.grade)
      ? prefill.grade
      : undefined;

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Grow in your craft</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-700">
        Choose your role and grade. We&apos;ll build your learning pathway from the progression
        framework: the craft skills your role needs, the behaviours expected at your grade, and our
        consulting skills programme.
      </p>
      <div className="mt-10">
        <PathwayBuilder
          roles={roles}
          initialRoleSlug={initialRole?.slug}
          initialGrade={initialGrade}
        />
      </div>
    </main>
  );
}
