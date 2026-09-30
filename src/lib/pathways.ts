import { z } from "zod";

import type { BehaviourBand, ConsultingStage, Grade, ProficiencyLevel } from "@/types/pathways";

// Client-safe pathway helpers. Framework data itself stays on the server.

export const PROFICIENCY_LEVELS = [
  "Learner",
  "Contributor",
  "Skilled",
  "Expert",
  "Leader",
  "Driver",
] as const satisfies readonly ProficiencyLevel[];

export const GRADES = ["6", "7", "8", "9", "10", "11", "12"] as const satisfies readonly Grade[];

export const BEHAVIOUR_BANDS = [
  "6/7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const satisfies readonly BehaviourBand[];

export const CONSULTING_STAGES = [
  "literacy",
  "fluency",
  "mastery",
] as const satisfies readonly ConsultingStage[];

// Taken from the prototype. Display names are still to be confirmed (spec 0001, open question 7).
const GRADE_NAMES: Record<Grade, string> = {
  "6": "Graduate",
  "7": "Junior",
  "8": "Mid",
  "9": "Senior",
  "10": "Lead",
  "11": "Principal",
  "12": "Head of",
};

export function isGrade(value: string): value is Grade {
  return (GRADES as readonly string[]).includes(value);
}

/** e.g. "Senior (9)". */
export function gradeLabel(grade: Grade): string {
  return `${GRADE_NAMES[grade]} (${grade})`;
}

export function bandForGrade(grade: Grade): BehaviourBand {
  return grade === "6" || grade === "7" ? "6/7" : grade;
}

/** e.g. "Junior / Graduate (6/7)" or "Senior (9)". */
export function bandLabel(band: BehaviourBand): string {
  return band === "6/7" ? "Junior / Graduate (6/7)" : gradeLabel(band);
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Route params for `/pathways/[role]/[grade]`. Whether the role offers the grade is checked later. */
export const pathwayParamsSchema = z.object({
  role: z.string().min(1),
  grade: z.enum(GRADES),
});

export const moduleParamsSchema = pathwayParamsSchema.extend({
  module: z.string().min(1),
});

export function pathwayHref(roleSlug: string, grade: Grade): string {
  return `/pathways/${roleSlug}/${grade}`;
}

export function moduleHref(roleSlug: string, grade: Grade, moduleSlug: string): string {
  return `${pathwayHref(roleSlug, grade)}/modules/${moduleSlug}`;
}

export interface ProgressSummary {
  read: number;
  total: number;
  percent: number;
}

export function summariseProgress(
  moduleSlugs: readonly string[],
  readSlugs: ReadonlySet<string>,
): ProgressSummary {
  const total = moduleSlugs.length;
  const read = moduleSlugs.filter((slug) => readSlugs.has(slug)).length;
  return { read, total, percent: total === 0 ? 0 : Math.round((read / total) * 100) };
}
