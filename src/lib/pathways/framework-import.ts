import type { Behaviour, Grade, Impact, ProficiencyLevel, Role, Skill } from "@/types/pathways";

import { BEHAVIOUR_BANDS, PROFICIENCY_LEVELS } from "./framework";
import type { FrameworkOverride } from "./schemas";
import { norm } from "./spreadsheet";

// Rebuilding the framework from its spreadsheets: "Progression Framework - DT billable skills"
// (tabs "Skills by role" and "Skill definitions") and "Progression Framework - behaviours and
// impact matrix" (tabs "Behaviours" and "Impact").

export const FRAMEWORK_TABS = ["Skills by role", "Skill definitions", "Behaviours", "Impact"];

export type FrameworkTabKind = "roles" | "defs" | "beh" | "imp";

export function frameworkTabKind(name: string, rows: string[][]): FrameworkTabKind | null {
  const n = norm(name);
  const h = (rows[0] ?? []).map((x) => String(x).trim().toLowerCase());
  if (n === "skills by role" || (h[2] === "job role" && h[3] === "skill")) return "roles";
  if (n === "skill definitions" || (h[0] === "skill" && h[1] === "definition")) return "defs";
  if (n === "behaviours" || n === "behaviors" || (h[0] === "behaviour" && h[1] === "definition")) {
    return "beh";
  }
  if (n === "impact" || n === "impacts" || (h[0] === "impact" && h[1] === "definition"))
    return "imp";
  return null;
}

/** Splits a cell of level descriptors into statements, one per line or bullet. */
export function splitStatements(text: string | undefined): string[] {
  const t = (text ?? "").trim();
  if (!t || /^n\/a$|^none$|currently not defined/i.test(t)) return [];
  return t
    .split(/\n+|(?:^|\s)•\s/)
    .map((p) => p.replace(/^\s*[-•–]\s*/, "").trim())
    .filter((p) => p.length > 2);
}

export function rowsToSkills(rows: string[][]): Skill[] {
  return rows
    .slice(1)
    .filter((r) => r[0]?.trim())
    .map((r) => ({
      name: r[0]!.trim(),
      definition: (r[1] ?? "").trim(),
      levels: Object.fromEntries(
        PROFICIENCY_LEVELS.map((l, i) => [l, splitStatements(r[2 + i])]),
      ) as Record<ProficiencyLevel, string[]>,
    }));
}

const ROLE_GRADES: Grade[] = ["6", "7", "8", "9", "10", "11"];

export function rowsToRoles(
  rows: string[][],
  skills: Skill[],
): { roles: Role[]; missing: Set<string> } {
  const byLowerName = new Map(skills.map((s) => [s.name.toLowerCase(), s.name]));
  const roles = new Map<string, Role>();
  const missing = new Set<string>();
  for (const r of rows.slice(1)) {
    const roleName = r[2]?.trim();
    if (!roleName) continue;
    const skill = byLowerName.get((r[3] ?? "").trim().toLowerCase());
    if (!skill) {
      missing.add(r[3] ?? "");
      continue;
    }
    let role = roles.get(roleName);
    if (!role) {
      role = {
        capability: (r[0] ?? "").trim(),
        practice: (r[1] ?? "").trim(),
        role: roleName,
        grades: [],
        skills: [],
      };
      roles.set(roleName, role);
    }
    const expected = Object.fromEntries(
      ROLE_GRADES.map((g, i) => {
        let v = (r[4 + i] ?? "").trim();
        if (v.startsWith("Driver")) v = "Driver";
        return [g, (PROFICIENCY_LEVELS as readonly string[]).includes(v) ? v : null];
      }),
    ) as Partial<Record<Grade, ProficiencyLevel | null>>;
    role.skills.push({ name: skill, expected });
  }
  for (const role of roles.values()) {
    role.grades = ROLE_GRADES.filter((g) => role.skills.some((s) => s.expected[g]));
  }
  return { roles: [...roles.values()].filter((r) => r.grades.length), missing };
}

export function rowsToBehaviours(rows: string[][]): Behaviour[] {
  return rows
    .slice(1)
    .filter((r) => r[0]?.trim())
    .map((r) => ({
      name: r[0]!.trim(),
      definition: (r[1] ?? "").trim(),
      bands: Object.fromEntries(
        BEHAVIOUR_BANDS.map((b, i) => [b, splitStatements(r[2 + i])]),
      ) as Behaviour["bands"],
    }));
}

export function rowsToImpacts(rows: string[][]): Impact[] {
  return rows
    .slice(1)
    .filter((r) => r[0]?.trim())
    .map((r) => ({ name: r[0]!.trim(), definition: (r[1] ?? "").trim() }));
}

export type FrameworkImportResult =
  | { ok: true; override: FrameworkOverride; loaded: string[]; missing: string[] }
  | { ok: false; error: string };

/** Merges the tabs found into the current override. */
export function applyFrameworkTabs(
  tabs: Partial<Record<FrameworkTabKind, string[][]>>,
  current: FrameworkOverride,
  builtinSkills: Skill[],
): FrameworkImportResult {
  if (!Object.keys(tabs).length) {
    return {
      ok: false,
      error:
        'We didn\'t find any framework tabs. The files need tabs called "Skills by role", "Skill definitions", "Behaviours" or "Impact".',
    };
  }
  const next: FrameworkOverride = { ...current };
  const loaded: string[] = [];
  const skills = tabs.defs ? rowsToSkills(tabs.defs) : (current.skills ?? builtinSkills);
  if (tabs.defs) {
    next.skills = skills;
    loaded.push(`${skills.length} skill definitions`);
  }
  let missing = new Set<string>();
  if (tabs.roles) {
    const r = rowsToRoles(tabs.roles, skills);
    missing = r.missing;
    if (!r.roles.length) {
      return { ok: false, error: '"Skills by role" has no roles with expected levels.' };
    }
    next.roles = r.roles;
    if (!tabs.defs) next.skills = skills;
    loaded.push(`${r.roles.length} roles`);
  }
  if (tabs.beh) {
    const b = rowsToBehaviours(tabs.beh);
    if (b.length) {
      next.behaviours = b;
      loaded.push(`${b.length} behaviours`);
    }
  }
  if (tabs.imp) {
    const i = rowsToImpacts(tabs.imp);
    if (i.length) {
      next.impacts = i;
      loaded.push(`${i.length} impacts`);
    }
  }
  return { ok: true, override: next, loaded, missing: [...missing] };
}
