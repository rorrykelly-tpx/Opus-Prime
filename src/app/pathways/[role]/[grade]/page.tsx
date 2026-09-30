import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PathwayView } from "@/components/features/pathways/PathwayView";
import { pathwayParamsSchema } from "@/lib/pathways/framework";
import { buildPathway } from "@/lib/pathways/model";
import { frameworkSource } from "@/server/services/framework";

type PathwayPageProps = { params: Promise<{ role: string; grade: string }> };

async function findPathway(params: PathwayPageProps["params"]) {
  const parsed = pathwayParamsSchema.safeParse(await params);
  return parsed.success
    ? buildPathway(frameworkSource.framework, parsed.data.role, parsed.data.grade)
    : null;
}

export async function generateMetadata({ params }: PathwayPageProps): Promise<Metadata> {
  const pathway = await findPathway(params);
  return pathway ? { title: pathway.role.role } : {};
}

export default async function PathwayPage({ params }: PathwayPageProps) {
  const pathway = await findPathway(params);
  if (!pathway) notFound();
  return <PathwayView roleSlug={pathway.role.slug} grade={pathway.grade} />;
}
