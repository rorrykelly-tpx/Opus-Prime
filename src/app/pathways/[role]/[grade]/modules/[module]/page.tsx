import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModuleView } from "@/components/features/pathways/ModuleView";
import { moduleParamsSchema } from "@/lib/pathways/framework";
import { getModule } from "@/lib/pathways/model";
import { frameworkSource } from "@/server/services/framework";

type ModulePageProps = { params: Promise<{ role: string; grade: string; module: string }> };

async function findModule(params: ModulePageProps["params"]) {
  const parsed = moduleParamsSchema.safeParse(await params);
  if (!parsed.success) return null;
  const { role, grade, module: moduleSlug } = parsed.data;
  const { framework, resources } = frameworkSource;
  const mod = getModule(framework, resources, role, grade, moduleSlug);
  return mod ? { role, grade, mod } : null;
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const found = await findModule(params);
  return found ? { title: found.mod.name } : {};
}

export default async function ModulePage({ params }: ModulePageProps) {
  const found = await findModule(params);
  if (!found) notFound();
  return <ModuleView roleSlug={found.role} grade={found.grade} moduleSlug={found.mod.slug} />;
}
