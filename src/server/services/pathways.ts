import "server-only";

import {
  bandForGrade,
  bandLabel,
  BEHAVIOUR_BANDS,
  PROFICIENCY_LEVELS,
  slugify,
} from "@/lib/pathways";
import { frameworkSource, type FrameworkSource } from "@/server/services/framework";
import type {
  BehaviourModuleSummary,
  ConsultingModuleSummary,
  Grade,
  LearningResource,
  LevelDescriptors,
  ModuleDetail,
  Pathway,
  Role,
  RoleOption,
  SkillModuleSummary,
} from "@/types/pathways";

function toRoleOption(role: Role): RoleOption {
  return {
    slug: slugify(role.role),
    capability: role.capability,
    practice: role.practice,
    role: role.role,
    grades: role.grades,
  };
}

function findFrameworkRole(roleSlug: string, source: FrameworkSource): Role | null {
  return source.framework.roles.find((r) => slugify(r.role) === roleSlug) ?? null;
}

function findRoleAtGrade(roleSlug: string, grade: Grade, source: FrameworkSource): Role | null {
  const role = findFrameworkRole(roleSlug, source);
  return role && role.grades.includes(grade) ? role : null;
}

function resourcesFor(name: string, source: FrameworkSource): LearningResource[] {
  return source.resources.filter((r) => r.frameworkTags.includes(name));
}

function consultingSummaries(source: FrameworkSource): ConsultingModuleSummary[] {
  return source.framework.consultingPillars.flatMap((p) =>
    p.modules.map((m) => ({
      kind: "consulting" as const,
      slug: slugify(m.name),
      name: m.name,
      pillar: p.pillar,
      stage: m.stage,
      foundation: m.foundation,
    })),
  );
}

/**
 * The target level plus the neighbouring levels for context. Neighbours without descriptors are
 * left out; the target is always kept so a missing description can be flagged. With no target,
 * every described level is returned.
 */
function levelsAround<L extends LevelDescriptors["level"]>(
  order: readonly L[],
  target: L | null,
  descriptorsFor: (level: L) => string[],
  labelFor: (level: L) => string,
): LevelDescriptors[] {
  const targetIndex = target === null ? -1 : order.indexOf(target);
  return order
    .filter((level, i) => {
      const described = descriptorsFor(level).length > 0;
      if (targetIndex === -1) return described;
      return i === targetIndex || (Math.abs(i - targetIndex) === 1 && described);
    })
    .map((level) => ({
      level,
      label: labelFor(level),
      descriptors: descriptorsFor(level),
      isTarget: level === target,
    }));
}

/** Every role, in framework order, for the role picker. */
export function listRoles(source: FrameworkSource = frameworkSource): RoleOption[] {
  return source.framework.roles.map(toRoleOption);
}

export function findRole(
  roleSlug: string,
  source: FrameworkSource = frameworkSource,
): RoleOption | null {
  const role = findFrameworkRole(roleSlug, source);
  return role ? toRoleOption(role) : null;
}

/** Builds the pathway for a role and grade, or `null` if the role doesn't offer that grade. */
export function buildPathway(
  roleSlug: string,
  grade: Grade,
  source: FrameworkSource = frameworkSource,
): Pathway | null {
  const role = findRoleAtGrade(roleSlug, grade, source);
  if (!role) return null;

  const craftSkills: SkillModuleSummary[] = role.skills.map((s) => ({
    kind: "skill",
    slug: slugify(s.name),
    name: s.name,
    target: s.expected[grade] ?? null,
  }));

  const band = bandForGrade(grade);
  const behaviours: BehaviourModuleSummary[] = source.framework.behaviours.map((b) => ({
    kind: "behaviour",
    slug: slugify(b.name),
    name: b.name,
    target: band,
  }));

  const consultingModules = consultingSummaries(source);
  const consulting = source.framework.consultingPillars.map((p) => ({
    pillar: p.pillar,
    summary: p.summary,
    modules: consultingModules.filter((m) => m.pillar === p.pillar),
  }));

  return {
    role: toRoleOption(role),
    grade,
    craftSkills,
    behaviours,
    consulting,
    moduleSlugs: [...craftSkills, ...behaviours, ...consultingModules].map((m) => m.slug),
  };
}

/**
 * A module in the context of a role and grade, or `null` if the role doesn't offer the grade or
 * the module isn't part of that role's pathway.
 */
export function getModule(
  roleSlug: string,
  grade: Grade,
  moduleSlug: string,
  source: FrameworkSource = frameworkSource,
): ModuleDetail | null {
  const role = findRoleAtGrade(roleSlug, grade, source);
  if (!role) return null;
  const { framework } = source;

  const roleSkill = role.skills.find((s) => slugify(s.name) === moduleSlug);
  const skill = roleSkill && framework.skills.find((s) => s.name === roleSkill.name);
  if (roleSkill && skill) {
    const target = roleSkill.expected[grade] ?? null;
    return {
      kind: "skill",
      slug: moduleSlug,
      name: skill.name,
      definition: skill.definition,
      target,
      levels: levelsAround(
        PROFICIENCY_LEVELS,
        target,
        (l) => skill.levels[l],
        (l) => l,
      ),
      targetUndescribed: target !== null && skill.levels[target].length === 0,
      resources: resourcesFor(skill.name, source),
    };
  }

  const behaviour = framework.behaviours.find((b) => slugify(b.name) === moduleSlug);
  if (behaviour) {
    const target = bandForGrade(grade);
    return {
      kind: "behaviour",
      slug: moduleSlug,
      name: behaviour.name,
      definition: behaviour.definition,
      target,
      levels: levelsAround(BEHAVIOUR_BANDS, target, (b) => behaviour.bands[b], bandLabel),
      targetUndescribed: behaviour.bands[target].length === 0,
      resources: resourcesFor(behaviour.name, source),
    };
  }

  const consulting = consultingSummaries(source).find((m) => m.slug === moduleSlug);
  const pillar =
    consulting && framework.consultingPillars.find((p) => p.pillar === consulting.pillar);
  if (consulting && pillar) {
    return {
      ...consulting,
      definition: pillar.summary,
      links: { ...pillar.links, behaviourSlug: slugify(pillar.links.behaviour) },
      pillarModules: consultingSummaries(source).filter((m) => m.pillar === pillar.pillar),
      resources: resourcesFor(consulting.name, source),
    };
  }

  return null;
}
