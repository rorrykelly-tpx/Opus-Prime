// Learning pathways (spec 0001). Framework types mirror src/data/framework.json.

export type ProficiencyLevel =
  "Learner" | "Contributor" | "Skilled" | "Expert" | "Leader" | "Driver";

/** A grade a consultant can hold. Roles offer a subset, plus 12 (behaviours only) above 11. */
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

/** The framework in use: the built-in data, or a preview of uploaded spreadsheets. */
export interface ActiveFramework extends Framework {
  overridden: boolean;
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

// Subject knowledge: question bank and course catalogue (src/data/knowledge.json).

export interface SubjectQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface Topic {
  id: string;
  name: string;
  questions: SubjectQuestion[];
}

export interface Course {
  title: string;
  provider: string;
  url: string;
  cost: string;
  /** Whether the course awards a certificate. */
  cert: boolean;
}

export interface KnowledgeCatalogue {
  topics: Topic[];
  courses: { topic: string; courses: Course[] }[];
}

// The consultant's own data, kept in this browser for now.

/** Module keys are "s:", "b:" or "c:" plus the skill, behaviour or consulting module name. */
export type ModuleKey = string;

export interface QuizScores {
  know?: number;
  subj?: number;
  at?: number;
}

export interface Plan {
  intro: string;
  actions: { title: string; detail: string; area: string }[];
  at: number;
}

export interface Profile {
  role: string | null;
  grade: Grade | null;
  read: Record<ModuleKey, boolean>;
  quiz: Record<ModuleKey, QuizScores>;
  shareWith: string[];
  shareNames: Record<string, string>;
  plan: Plan | null;
  tracker: "tree" | "track";
  /** The highest progress milestone already celebrated. */
  milestone: number;
  /** Best subject quiz score per topic, from 0 to 1. */
  knowledge: Record<string, number>;
  updatedAt?: number;
}

export interface SkillTag {
  name: string;
  level: ProficiencyLevel;
  why: string;
}

export interface BehaviourTag {
  name: string;
  band: BehaviourBand;
  why: string;
}

export interface EvidenceTags {
  skills: SkillTag[];
  behaviours: BehaviourTag[];
  impacts: string[];
  /** Consulting pillar names. */
  consulting: string[];
}

export interface Evidence {
  id: string;
  title: string;
  /** ISO date. */
  date: string;
  text: string;
  summary: string;
  files: string[];
  tags: EvidenceTags;
  createdAt: number;
  source?: { file: string; sheet: string; row: number };
}

export interface Certificate {
  id: string;
  title: string;
  provider: string;
  date: string;
  topic: string;
  url: string;
  fileName?: string;
  fileType?: string;
  /** Whether a file is stored for it. */
  hasFile?: boolean;
}

// View models.

export interface RoleOption {
  slug: string;
  capability: string;
  practice: string;
  role: string;
  grades: Grade[];
}

export type ModuleKind = "skill" | "behaviour" | "consulting";

interface ModuleSummaryBase {
  key: ModuleKey;
  slug: string;
  name: string;
}

export interface SkillModuleSummary extends ModuleSummaryBase {
  kind: "skill";
  /** `null` when the framework doesn't expect this skill at the grade. */
  target: ProficiencyLevel | null;
}

export interface BehaviourModuleSummary extends ModuleSummaryBase {
  kind: "behaviour";
  target: BehaviourBand;
}

export interface ConsultingModuleSummary extends ModuleSummaryBase {
  kind: "consulting";
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
  /** Every module in the pathway, in display order. */
  modules: ModuleSummary[];
}

export interface LevelDescriptors {
  /** A proficiency level for skills, a band for behaviours. */
  level: ProficiencyLevel | BehaviourBand;
  label: string;
  descriptors: string[];
  isTarget: boolean;
}

interface ModuleDetailBase {
  key: ModuleKey;
  slug: string;
  name: string;
  definition: string;
  resources: LearningResource[];
}

export interface SkillModuleDetail extends ModuleDetailBase {
  kind: "skill";
  target: ProficiencyLevel | null;
  /** Every level the framework describes. */
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
