import type {
  BehaviourBand,
  BehaviourModuleSummary,
  ConsultingModuleSummary,
  Certificate,
  Course,
  Evidence,
  Framework,
  Grade,
  KnowledgeCatalogue,
  ModuleSummary,
  ProficiencyLevel,
  Profile,
  Role,
  SkillModuleSummary,
} from "@/types/pathways";

import {
  bandForGrade,
  bandLabel,
  BEHAVIOUR_BANDS,
  consultingKey,
  findSkill,
  gradeLabel,
  gradeLadder,
  moduleHref,
  nextGrade,
  PROFICIENCY_LEVELS,
} from "./framework";
import { coursesFor, knowledgeGaps, knowledgeOf, topicName } from "./knowledge";

// Where a consultant's evidence places them, ported from the prototype. The placement rule
// (70% of craft skills and 3 of 5 behaviours) is still to be confirmed (spec 0001, question 4).

const SKILL_SHARE = 0.7;
const BEHAVIOUR_SHARE = 0.6;
/** A quiz score this high passes the module's quiz step. */
export const QUIZ_PASS = 0.8;

const levelIndex = (level: ProficiencyLevel | null) =>
  level ? PROFICIENCY_LEVELS.indexOf(level) : -1;
const bandIndex = (band: BehaviourBand | null) => (band ? BEHAVIOUR_BANDS.indexOf(band) : -1);

export interface EvidenceSummary {
  /** Highest proficiency level index shown per skill. */
  skill: Record<string, number>;
  /** Highest band index shown per behaviour. */
  beh: Record<string, number>;
  /** Pieces of evidence per impact. */
  imp: Record<string, number>;
  /** Pieces of evidence per consulting pillar. */
  con: Record<string, number>;
}

export function summariseEvidence(evidence: Evidence[]): EvidenceSummary {
  const out: EvidenceSummary = { skill: {}, beh: {}, imp: {}, con: {} };
  for (const e of evidence) {
    for (const s of e.tags.skills) {
      const i = levelIndex(s.level);
      if (i > (out.skill[s.name] ?? -1)) out.skill[s.name] = i;
    }
    for (const b of e.tags.behaviours) {
      const i = bandIndex(b.band);
      if (i > (out.beh[b.name] ?? -1)) out.beh[b.name] = i;
    }
    for (const n of e.tags.impacts) out.imp[n] = (out.imp[n] ?? 0) + 1;
    for (const n of e.tags.consulting) out.con[n] = (out.con[n] ?? 0) + 1;
  }
  return out;
}

export interface GradeCheck {
  grade: Grade;
  skillsMet: number;
  skillsTotal: number;
  behavioursMet: number;
  behavioursTotal: number;
  ok: boolean;
}

export function checkGrade(
  framework: Framework,
  role: Role,
  grade: Grade,
  es: EvidenceSummary,
): GradeCheck {
  const expected = role.skills.filter((s) => s.expected[grade]);
  const skillsMet = expected.filter(
    (s) => (es.skill[s.name] ?? -1) >= levelIndex(s.expected[grade] ?? null),
  ).length;
  const band = bandIndex(bandForGrade(grade));
  const behavioursMet = framework.behaviours.filter((b) => (es.beh[b.name] ?? -1) >= band).length;
  const skillShare = expected.length ? skillsMet / expected.length : null;
  const behaviourShare = framework.behaviours.length
    ? behavioursMet / framework.behaviours.length
    : 0;
  return {
    grade,
    skillsMet,
    skillsTotal: expected.length,
    behavioursMet,
    behavioursTotal: framework.behaviours.length,
    ok: (skillShare === null || skillShare >= SKILL_SHARE) && behaviourShare >= BEHAVIOUR_SHARE,
  };
}

export interface SkillRow {
  name: string;
  have: ProficiencyLevel | null;
  now: ProficiencyLevel | null;
  next: ProficiencyLevel | null;
}

export interface BehaviourRow {
  name: string;
  have: BehaviourBand | null;
  now: BehaviourBand;
  next: BehaviourBand;
}

export interface Assessment {
  role: Role;
  grade: Grade;
  es: EvidenceSummary;
  checks: GradeCheck[];
  /** The highest grade the evidence meets, having met every grade below it. */
  estimate: Grade | null;
  /** The grade to aim for: the current grade if not yet met there, otherwise the next one. */
  target: Grade;
  skillRows: SkillRow[];
  behaviourRows: BehaviourRow[];
  impactCount: Record<string, number>;
}

export function assess(
  framework: Framework,
  role: Role,
  grade: Grade,
  evidence: Evidence[],
): Assessment {
  const es = summariseEvidence(evidence);
  const checks = gradeLadder(role).map((g) => checkGrade(framework, role, g, es));
  let estimate: Grade | null = null;
  for (const c of checks) {
    if (!c.ok) break;
    estimate = c.grade;
  }
  const target = estimate && +estimate < +grade ? grade : (nextGrade(role, grade) ?? grade);
  const skillRows = role.skills.map((s) => ({
    name: s.name,
    have: s.name in es.skill ? PROFICIENCY_LEVELS[es.skill[s.name]!]! : null,
    now: s.expected[grade] ?? null,
    next: s.expected[target] ?? null,
  }));
  const behaviourRows = framework.behaviours.map((b) => ({
    name: b.name,
    have: b.name in es.beh ? BEHAVIOUR_BANDS[es.beh[b.name]!]! : null,
    now: bandForGrade(grade),
    next: bandForGrade(target),
  }));
  const impactCount = Object.fromEntries(
    framework.impacts.map((i) => [i.name, es.imp[i.name] ?? 0]),
  );
  return { role, grade, es, checks, estimate, target, skillRows, behaviourRows, impactCount };
}

/** Progression assessment wording. */
export type Rating = "exceeded" | "met" | "partial" | "not";

export const RATING_LABEL: Record<Rating, string> = {
  exceeded: "Exceeded",
  met: "Met",
  partial: "Partially met",
  not: "Not met",
};

export function rateAgainst<L extends string>(
  have: L | null,
  want: L | null,
  scale: readonly L[],
): Rating | null {
  if (!want) return null;
  const w = scale.indexOf(want);
  const h = have ? scale.indexOf(have) : -1;
  if (h < 0) return "not";
  if (h > w) return "exceeded";
  if (h === w) return "met";
  return h === w - 1 ? "partial" : "not";
}

export type OverallKey = "exceeding" | "meeting" | "partially" | "not";

export interface OverallRating {
  key: OverallKey;
  label: string;
  met: number;
  part: number;
  total: number;
}

const OVERALL_LABEL: Record<OverallKey, string> = {
  exceeding: "Exceeding expectations",
  meeting: "Meeting expectations",
  partially: "Partially meeting expectations",
  not: "Not yet meeting expectations",
};

/** Met counts 1, partially met a half: all met is meeting, half or more is partially meeting. */
export function overallRating(framework: Framework, a: Assessment): OverallRating {
  const ratings = [
    ...a.skillRows.map((r) => rateAgainst(r.have, r.now, PROFICIENCY_LEVELS)),
    ...a.behaviourRows.map((r) => rateAgainst(r.have, r.now, BEHAVIOUR_BANDS)),
  ].filter((r) => r !== null);
  const met = ratings.filter((r) => r === "met" || r === "exceeded").length;
  const part = ratings.filter((r) => r === "partial").length;
  const score = ratings.length ? (met + part * 0.5) / ratings.length : 0;
  const next = nextGrade(a.role, a.grade);
  const nextOk = next ? checkGrade(framework, a.role, next, a.es).ok : false;
  const key: OverallKey =
    ratings.length && met === ratings.length
      ? nextOk
        ? "exceeding"
        : "meeting"
      : score >= 0.5
        ? "partially"
        : "not";
  return { key, label: OVERALL_LABEL[key], met, part, total: ratings.length };
}

/** The pastel rating chip that matches an overall rating. */
export function overallChip(key: OverallKey): Rating {
  if (key === "meeting" || key === "exceeding") return "met";
  return key === "partially" ? "partial" : "not";
}

export type NextStepKind = "skill" | "behaviour" | "knowledge" | "consulting" | "impact";

export interface NextStep {
  kind: NextStepKind;
  name: string;
  text: string;
  statements: string[];
  href: string;
  rating?: Rating | null;
  course?: Course;
}

export interface NextStepsInput {
  framework: Framework;
  knowledge: KnowledgeCatalogue;
  assessment: Assessment;
  profile: Profile;
  certs: Certificate[];
  /** In the demo, the steps talk about Julia rather than "you". */
  demo?: boolean;
}

function stageFor(grade: Grade): "literacy" | "fluency" | "mastery" {
  return +grade <= 8 ? "literacy" : +grade <= 10 ? "fluency" : "mastery";
}

/** The biggest gaps for the target grade, most important first. */
export function nextSteps({
  framework,
  knowledge,
  assessment: a,
  profile,
  certs,
  demo = false,
}: NextStepsInput): NextStep[] {
  const t = a.target;
  const roleName = a.role.role;
  const gaps: { gap: number; step: NextStep }[] = [];

  for (const r of a.skillRows) {
    if (!r.next) continue;
    const need = levelIndex(r.next);
    const have = levelIndex(r.have);
    if (have >= need) continue;
    gaps.push({
      gap: need - have,
      step: {
        kind: "skill",
        name: r.name,
        text: r.have
          ? `Your evidence shows ${r.have}. ${gradeLabel(t)} expects ${r.next}.`
          : `No evidence yet. ${gradeLabel(t)} expects ${r.next}.`,
        statements: (findSkill(framework, r.name)?.levels[r.next] ?? []).slice(0, 2),
        href: moduleHref(roleName, a.grade, r.name),
        rating: rateAgainst(r.have, r.now, PROFICIENCY_LEVELS),
      },
    });
  }
  for (const r of a.behaviourRows) {
    const need = bandIndex(r.next);
    const have = bandIndex(r.have);
    if (have >= need) continue;
    const behaviour = framework.behaviours.find((b) => b.name === r.name);
    gaps.push({
      // Behaviours carry the most weight in placing a level, so they rank slightly higher.
      gap: need - have + 0.5,
      step: {
        kind: "behaviour",
        name: r.name,
        text: r.have
          ? `Your evidence matches ${bandLabel(r.have)}. Aim for ${bandLabel(r.next)}.`
          : `No evidence yet. Aim for ${bandLabel(r.next)}.`,
        statements: (behaviour?.bands[r.next] ?? []).slice(0, 2),
        href: moduleHref(roleName, a.grade, r.name),
        rating: rateAgainst(r.have, r.now, BEHAVIOUR_BANDS),
      },
    });
  }
  gaps.sort((x, y) => y.gap - x.gap);
  const top: NextStep[] = gaps.slice(0, 6).map((g) => g.step);

  for (const topic of knowledgeGaps(a.role, profile, certs).slice(0, 2)) {
    const k = knowledgeOf(topic, profile, certs);
    top.push({
      kind: "knowledge",
      name: topicName(knowledge, topic),
      text:
        k.score === null
          ? "You haven't taken the subject quiz yet."
          : `Your subject quiz score is ${Math.round(k.score * 100)}%. Aim for 60% or more, or complete a course.`,
      statements: [],
      href: `/pathways/courses/${topic}`,
      course: coursesFor(knowledge, topic)[0],
    });
  }

  // A consulting core module at the stage for the target grade, tied to the biggest gap.
  const stage = stageFor(t);
  const gapNames = new Set(top.map((x) => x.name));
  const pillar =
    framework.consultingPillars.find((p) => gapNames.has(p.links.behaviour)) ??
    framework.consultingPillars.find((p) => !a.impactCount[p.links.impact]) ??
    framework.consultingPillars[0];
  const mod =
    pillar?.modules.find((m) => m.stage === stage && !profile.read[consultingKey(m.name)]) ??
    pillar?.modules.find((m) => m.stage === stage);
  if (pillar && mod) {
    top.push({
      kind: "consulting",
      name: mod.name,
      text: `A ${pillar.pillar} module at ${stage} stage, which fits ${gradeLabel(t)}.`,
      statements: [],
      href: moduleHref(roleName, a.grade, mod.name),
    });
  }

  if (demo) {
    for (const s of top) {
      s.text = s.text
        .replace(/^Your evidence/, "Julia's evidence")
        .replace(/^Your subject quiz score/, "Her subject quiz score")
        .replace(/^You haven't/, "Julia hasn't")
        .replace(/^No evidence yet/, "No evidence from Julia yet");
    }
  }

  for (const [name, count] of Object.entries(a.impactCount)) {
    if (count) continue;
    const impact = framework.impacts.find((i) => i.name === name);
    top.push({
      kind: "impact",
      name,
      text: "You haven't logged any evidence against this impact yet.",
      statements: impact ? [`${impact.definition.split(" - ")[0]}.`] : [],
      href: "/pathways/year",
    });
  }
  return top;
}

export interface ModuleStatus {
  read: boolean;
  quiz: boolean;
  evidence: boolean;
  done: boolean;
}

/** The parts of a module summary or detail needed to work out its status. */
export type StatusTarget =
  | Pick<SkillModuleSummary, "kind" | "key" | "name" | "target">
  | Pick<BehaviourModuleSummary, "kind" | "key" | "name" | "target">
  | Pick<ConsultingModuleSummary, "kind" | "key" | "pillar">;

export function moduleStatus(
  mod: StatusTarget,
  profile: Profile,
  es: EvidenceSummary,
): ModuleStatus {
  const scores = profile.quiz[mod.key] ?? {};
  const read = !!profile.read[mod.key];
  const quiz = Math.max(scores.know ?? 0, scores.subj ?? 0) >= QUIZ_PASS;
  let evidence: boolean;
  if (mod.kind === "skill") {
    evidence = mod.target
      ? (es.skill[mod.name] ?? -1) >= levelIndex(mod.target)
      : mod.name in es.skill;
  } else if (mod.kind === "behaviour") {
    evidence = (es.beh[mod.name] ?? -1) >= bandIndex(mod.target);
  } else {
    evidence = !!es.con[mod.pillar];
  }
  return { read, quiz, evidence, done: read && quiz && evidence };
}

export interface ModuleProgress {
  /** Steps done out of `total`: reading, passing the quiz and logging evidence, per module. */
  pts: number;
  total: number;
  pct: number;
}

export function moduleProgress(
  modules: ModuleSummary[],
  profile: Profile,
  es: EvidenceSummary,
): ModuleProgress {
  let pts = 0;
  for (const m of modules) {
    const s = moduleStatus(m, profile, es);
    pts += Number(s.read) + Number(s.quiz) + Number(s.evidence);
  }
  const total = modules.length * 3;
  return { pts, total, pct: total ? Math.round((100 * pts) / total) : 0 };
}
