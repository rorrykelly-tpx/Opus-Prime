// Learning pathways (spec 0001). Framework types mirror src/data/framework.json.

export type ProficiencyLevel =
  "Learner" | "Contributor" | "Skilled" | "Expert" | "Leader" | "Driver";

/** A grade a consultant can hold. Roles offer a subset; see `Role.grades`. */
export type Grade = "6" | "7" | "8" | "9" | "10" | "11" | "12";

/** Behaviour bands group grades 6 and 7 together. */
export type BehaviourBand = "6/7" | "8" | "9" | "10" | "11" | "12";

export type ConsultingStage = "literacy" | "fluency" | "mastery";

export interface Skill {
  name: string;
  definition: string;
  /** "What good looks like" descriptors. An empty list means the level isn't described yet. */
  levels: Record<ProficiencyLevel, string[]>;
}

export interface RoleSkillExpectation {
  name: string;
  /** `null` or missing means the skill isn't expected at that grade. */
  expected: Partial<Record<Grade, ProficiencyLevel | null>>;
}

export interface Role {
  capability: string;
  practice: string;
  role: string;
  grades: Grade[];
  skills: RoleSkillExpectation[];
}

export interface Behaviour {
  name: string;
  definition: string;
  bands: Record<BehaviourBand, string[]>;
}

export interface Impact {
  name: string;
  definition: string;
}

export interface ConsultingModule {
  name: string;
  stage: ConsultingStage;
  foundation: boolean;
}

export interface ConsultingPillar {
  pillar: string;
  summary: string;
  links: { impact: string; behaviour: string };
  modules: ConsultingModule[];
}

export interface Framework {
  version: string;
  proficiencyLevels: ProficiencyLevel[];
  skills: Skill[];
  roles: Role[];
  behaviours: Behaviour[];
  impacts: Impact[];
  consultingPillars: ConsultingPillar[];
}

export type ResourceFormat =
  "website" | "document" | "presentation" | "book" | "course" | "article";

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  description: string;
  format: ResourceFormat;
  /** Match `Skill.name`, `Behaviour.name` or `ConsultingModule.name`. */
  frameworkTags: string[];
}

// View models returned by the pathways service.

export interface RoleOption {
  slug: string;
  capability: string;
  practice: string;
  role: string;
  grades: Grade[];
}

export type ModuleKind = "skill" | "behaviour" | "consulting";

export interface SkillModuleSummary {
  kind: "skill";
  slug: string;
  name: string;
  /** `null` when the framework doesn't expect this skill at the grade. */
  target: ProficiencyLevel | null;
}

export interface BehaviourModuleSummary {
  kind: "behaviour";
  slug: string;
  name: string;
  target: BehaviourBand;
}

export interface ConsultingModuleSummary {
  kind: "consulting";
  slug: string;
  name: string;
  pillar: string;
  stage: ConsultingStage;
  foundation: boolean;
}

export type ModuleSummary = SkillModuleSummary | BehaviourModuleSummary | ConsultingModuleSummary;

export interface PathwayPillar {
  pillar: string;
  summary: string;
  modules: ConsultingModuleSummary[];
}

export interface Pathway {
  role: RoleOption;
  grade: Grade;
  craftSkills: SkillModuleSummary[];
  behaviours: BehaviourModuleSummary[];
  consulting: PathwayPillar[];
  /** Every module slug in the pathway, used to measure progress. */
  moduleSlugs: string[];
}

export interface LevelDescriptors {
  /** A proficiency level for skills, a band for behaviours. */
  level: ProficiencyLevel | BehaviourBand;
  label: string;
  descriptors: string[];
  isTarget: boolean;
}

interface ModuleDetailBase {
  slug: string;
  name: string;
  definition: string;
  resources: LearningResource[];
}

export interface SkillModuleDetail extends ModuleDetailBase {
  kind: "skill";
  target: ProficiencyLevel | null;
  /** The target level and the described levels either side of it. */
  levels: LevelDescriptors[];
  /** True when the framework expects a level at this grade but doesn't describe it. */
  targetUndescribed: boolean;
}

export interface BehaviourModuleDetail extends ModuleDetailBase {
  kind: "behaviour";
  target: BehaviourBand;
  levels: LevelDescriptors[];
  targetUndescribed: boolean;
}

export interface ConsultingModuleDetail extends ModuleDetailBase {
  kind: "consulting";
  pillar: string;
  stage: ConsultingStage;
  foundation: boolean;
  links: { impact: string; behaviour: string; behaviourSlug: string };
  pillarModules: ConsultingModuleSummary[];
}

export type ModuleDetail = SkillModuleDetail | BehaviourModuleDetail | ConsultingModuleDetail;
