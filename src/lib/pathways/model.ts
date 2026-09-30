import type {
  BehaviourModuleSummary,
  ConsultingModuleSummary,
  Framework,
  Grade,
  LearningResource,
  LevelDescriptors,
  ModuleDetail,
  ModuleSummary,
  Pathway,
  Role,
  RoleOption,
  SkillModuleSummary,
} from "@/types/pathways";

import {
  bandForGrade,
  bandLabel,
  BEHAVIOUR_BANDS,
  behaviourKey,
  consultingKey,
  findRoleBySlug,
  findSkill,
  gradeLadder,
  PROFICIENCY_LEVELS,
  skillKey,
  slugify,
} from "./framework";

/** The prototype shows at most five links per module. */
const MAX_RESOURCES = 5;

function toRoleOption(role: Role): RoleOption {
  return {
    slug: slugify(role.role),
    capability: role.capability,
    practice: role.practice,
    role: role.role,
    grades: gradeLadder(role),
  };
}

function findRoleAtGrade(framework: Framework, roleSlug: string, grade: Grade): Role | null {
  const role = findRoleBySlug(framework, roleSlug);
  return role && gradeLadder(role).includes(grade) ? role : null;
}

function resourcesFor(name: string, resources: LearningResource[]): LearningResource[] {
  return resources.filter((r) => r.frameworkTags.includes(name)).slice(0, MAX_RESOURCES);
}

function consultingSummaries(framework: Framework): ConsultingModuleSummary[] {
  return framework.consultingPillars.flatMap((p) =>
    p.modules.map((m) => ({
      kind: "consulting" as const,
      key: consultingKey(m.name),
      slug: slugify(m.name),
      name: m.name,
      pillar: p.pillar,
      stage: m.stage,
      foundation: m.foundation,
    })),
  );
}

/** Every level the framework describes, in order, with the target flagged. */
function describedLevels<L extends LevelDescriptors["level"]>(
  order: readonly L[],
  target: L | null,
  descriptorsFor: (level: L) => string[],
  labelFor: (level: L) => string,
): LevelDescriptors[] {
  return order
    .filter((level) => descriptorsFor(level).length > 0)
    .map((level) => ({
      level,
      label: labelFor(level),
      descriptors: descriptorsFor(level),
      isTarget: level === target,
    }));
}

/** Every role, in framework order, for the role picker. */
export function listRoles(framework: Framework): RoleOption[] {
  return framework.roles.map(toRoleOption);
}

export function findRole(framework: Framework, roleSlug: string): RoleOption | null {
  const role = findRoleBySlug(framework, roleSlug);
  return role ? toRoleOption(role) : null;
}

/** Builds the pathway for a role and grade, or `null` if the role doesn't offer that grade. */
export function buildPathway(framework: Framework, roleSlug: string, grade: Grade): Pathway | null {
  const role = findRoleAtGrade(framework, roleSlug, grade);
  if (!role) return null;

  const craftSkills: SkillModuleSummary[] = role.skills.map((s) => ({
    kind: "skill",
    key: skillKey(s.name),
    slug: slugify(s.name),
    name: s.name,
    target: s.expected[grade] ?? null,
  }));

  const band = bandForGrade(grade);
  const behaviours: BehaviourModuleSummary[] = framework.behaviours.map((b) => ({
    kind: "behaviour",
    key: behaviourKey(b.name),
    slug: slugify(b.name),
    name: b.name,
    target: band,
  }));

  const consultingModules = consultingSummaries(framework);
  const consulting = framework.consultingPillars.map((p) => ({
    pillar: p.pillar,
    summary: p.summary,
    modules: consultingModules.filter((m) => m.pillar === p.pillar),
  }));

  const modules: ModuleSummary[] = [...craftSkills, ...behaviours, ...consultingModules];
  return { role: toRoleOption(role), grade, craftSkills, behaviours, consulting, modules };
}

/**
 * A module in the context of a role and grade, or `null` if the role doesn't offer the grade or
 * the module isn't part of that role's pathway.
 */
export function getModule(
  framework: Framework,
  resources: LearningResource[],
  roleSlug: string,
  grade: Grade,
  moduleSlug: string,
): ModuleDetail | null {
  const role = findRoleAtGrade(framework, roleSlug, grade);
  if (!role) return null;

  const roleSkill = role.skills.find((s) => slugify(s.name) === moduleSlug);
  const skill = roleSkill && findSkill(framework, roleSkill.name);
  if (roleSkill && skill) {
    const target = roleSkill.expected[grade] ?? null;
    return {
      kind: "skill",
      key: skillKey(skill.name),
      slug: moduleSlug,
      name: skill.name,
      definition: skill.definition,
      target,
      levels: describedLevels(
        PROFICIENCY_LEVELS,
        target,
        (l) => skill.levels[l],
        (l) => l,
      ),
      targetUndescribed: target !== null && skill.levels[target].length === 0,
      resources: resourcesFor(skill.name, resources),
    };
  }

  const behaviour = framework.behaviours.find((b) => slugify(b.name) === moduleSlug);
  if (behaviour) {
    const target = bandForGrade(grade);
    return {
      kind: "behaviour",
      key: behaviourKey(behaviour.name),
      slug: moduleSlug,
      name: behaviour.name,
      definition: behaviour.definition,
      target,
      levels: describedLevels(BEHAVIOUR_BANDS, target, (b) => behaviour.bands[b], bandLabel),
      targetUndescribed: behaviour.bands[target].length === 0,
      resources: resourcesFor(behaviour.name, resources),
    };
  }

  const consulting = consultingSummaries(framework).find((m) => m.slug === moduleSlug);
  const pillar =
    consulting && framework.consultingPillars.find((p) => p.pillar === consulting.pillar);
  if (consulting && pillar) {
    return {
      ...consulting,
      definition: pillar.summary,
      links: { ...pillar.links, behaviourSlug: slugify(pillar.links.behaviour) },
      pillarModules: consultingSummaries(framework).filter((m) => m.pillar === pillar.pillar),
      resources: resourcesFor(consulting.name, resources),
    };
  }

  return null;
}
