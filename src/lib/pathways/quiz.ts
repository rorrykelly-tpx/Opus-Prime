import type { Framework, ModuleDetail, SubjectQuestion } from "@/types/pathways";

import {
  bandLabel,
  BEHAVIOUR_BANDS,
  CONSULTING_STAGES,
  findSkill,
  PROFICIENCY_LEVELS,
  shuffle,
} from "./framework";

export type QuizKind = "know" | "subj";

export const QUIZ_KIND_LABEL: Record<QuizKind, string> = {
  know: "Knowing the framework",
  subj: "Subject knowledge",
};

/**
 * "Knowing the framework" questions: which level, band, stage or pillar a statement belongs to.
 * Built from the framework itself, so every module has one without an approved question bank.
 */
export function frameworkQuestions(
  framework: Framework,
  mod: ModuleDetail,
  random: () => number = Math.random,
): SubjectQuestion[] {
  if (mod.kind === "skill") {
    const skill = findSkill(framework, mod.name);
    if (!skill) return [];
    const used = PROFICIENCY_LEVELS.filter((l) => skill.levels[l].length > 0);
    if (used.length < 2) return [];
    const pool = used.flatMap((level) => skill.levels[level].map((text) => ({ text, level })));
    return shuffle(pool, random)
      .slice(0, 5)
      .map(({ text, level }) => {
        const others = shuffle(
          used.filter((l) => l !== level),
          random,
        ).slice(0, 3);
        const options = PROFICIENCY_LEVELS.filter((l) => l === level || others.includes(l));
        return {
          q: `Which level of ${mod.name} does this describe? "${text}"`,
          options: [...options],
          correct: options.indexOf(level),
          explain: `This is part of ${level}.${mod.target ? ` At your grade the framework expects ${mod.target}.` : ""}`,
        };
      });
  }

  if (mod.kind === "behaviour") {
    const behaviour = framework.behaviours.find((b) => b.name === mod.name);
    if (!behaviour) return [];
    const pool = BEHAVIOUR_BANDS.flatMap((band) =>
      behaviour.bands[band].map((text) => ({ text, band })),
    );
    return shuffle(pool, random)
      .slice(0, 5)
      .map(({ text, band }) => {
        const others = shuffle(
          BEHAVIOUR_BANDS.filter((b) => b !== band),
          random,
        ).slice(0, 3);
        const options = BEHAVIOUR_BANDS.filter((b) => b === band || others.includes(b));
        return {
          q: `Which grade does this ${mod.name.toLowerCase()} statement describe? "${text}"`,
          options: options.map(bandLabel),
          correct: options.indexOf(band),
          explain: `This describes ${bandLabel(band)}. At your grade the expectation is ${bandLabel(mod.target)}.`,
        };
      });
  }

  const all = framework.consultingPillars.flatMap((p) =>
    p.modules.map((m) => ({ name: m.name, pillar: p.pillar, stage: m.stage })),
  );
  const pillars = framework.consultingPillars.map((p) => p.pillar);
  return shuffle(all, random)
    .slice(0, 5)
    .map((x, i) =>
      i % 2
        ? {
            q: `At which stage does "${x.name}" sit?`,
            options: [...CONSULTING_STAGES],
            correct: CONSULTING_STAGES.indexOf(x.stage),
            explain: `${x.name} sits at ${x.stage} stage in ${x.pillar}.`,
          }
        : {
            q: `Which pillar does "${x.name}" belong to?`,
            options: pillars,
            correct: pillars.indexOf(x.pillar),
            explain: `${x.name} is part of ${x.pillar}.`,
          },
    );
}

export function scoreAnswers(questions: SubjectQuestion[], answers: number[]): number {
  if (!questions.length) return 0;
  return answers.filter((a, i) => a === questions[i]?.correct).length / questions.length;
}
