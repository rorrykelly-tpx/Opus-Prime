import { z } from "zod";

import type {
  BehaviourBand,
  ConsultingStage,
  Framework,
  Grade,
  ProficiencyLevel,
  Role,
  Skill,
} from "@/types/pathways";

// Client-safe framework helpers, shared by the server pages and the browser app.

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
export const GRADE_NAMES: Record<Grade, string> = {
  "6": "Graduate",
  "7": "Junior",
  "8": "Mid",
  "9": "Senior",
  "10": "Lead",
  "11": "Principal",
  "12": "Head of",
};

/** Pastel colour for each capability's bands. */
export const CAPABILITY_COLOUR: Record<string, "mint" | "pink" | "sky"> = {
  Delivery: "mint",
  Design: "pink",
  "Tech and Data": "sky",
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

/** The grades a consultant in this role can choose. Grade 12 (behaviours only) follows 11. */
export function gradeLadder(role: Role): Grade[] {
  return role.grades.includes("11") ? [...role.grades, "12"] : [...role.grades];
}

export function nextGrade(role: Role, grade: Grade): Grade | null {
  const ladder = gradeLadder(role);
  const i = ladder.indexOf(grade);
  return i >= 0 && i < ladder.length - 1 ? ladder[i + 1]! : null;
}

export function expectedLevel(
  role: Role,
  skillName: string,
  grade: Grade,
): ProficiencyLevel | null {
  return role.skills.find((s) => s.name === skillName)?.expected[grade] ?? null;
}

export function findRoleByName(framework: Framework, name: string | null): Role | null {
  return name ? (framework.roles.find((r) => r.role === name) ?? null) : null;
}

export function findRoleBySlug(framework: Framework, slug: string): Role | null {
  return framework.roles.find((r) => slugify(r.role) === slug) ?? null;
}

export function findSkill(framework: Framework, name: string): Skill | null {
  return framework.skills.find((s) => s.name === name) ?? null;
}

// Module keys match the prototype's, so stored progress and the demo data line up.
export const skillKey = (name: string) => `s:${name}`;
export const behaviourKey = (name: string) => `b:${name}`;
export const consultingKey = (name: string) => `c:${name}`;

/** Route params for `/pathways/[role]/[grade]`. Whether the role offers the grade is checked later. */
export const pathwayParamsSchema = z.object({
  role: z.string().min(1),
  grade: z.enum(GRADES),
});

export const moduleParamsSchema = pathwayParamsSchema.extend({
  module: z.string().min(1),
});

export function pathwayHref(roleName: string, grade: Grade): string {
  return `/pathways/${slugify(roleName)}/${grade}`;
}

export function moduleHref(roleName: string, grade: Grade, moduleName: string): string {
  return `${pathwayHref(roleName, grade)}/modules/${slugify(moduleName)}`;
}

/** en-GB date, e.g. "12 Feb 2026". Falls back to the input if it isn't a date. */
export function formatDate(value: string | number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}
