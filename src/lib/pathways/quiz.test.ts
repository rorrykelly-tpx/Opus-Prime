import { framework, resources, seededRandom } from "@tests/pathways-data";

import { getModule } from "./model";
import { frameworkQuestions, scoreAnswers } from "./quiz";

describe("framework quiz", () => {
  it("asks which level a skill statement describes, with the answer among the options", () => {
    const mod = getModule(
      framework,
      resources,
      "delivery-manager",
      "9",
      "agile-and-lean-knowledge",
    )!;
    const qs = frameworkQuestions(framework, mod, seededRandom(5));
    expect(qs).toHaveLength(5);
    const skill = framework.skills.find((s) => s.name === "Agile and lean knowledge")!;
    for (const q of qs) {
      const statement = q.q.match(/"(.*)"$/)![1]!;
      const level = q.options[q.correct] as keyof typeof skill.levels;
      expect(skill.levels[level]).toContain(statement);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.length).toBeLessThanOrEqual(4);
    }
  });

  it("has no framework quiz for a skill with fewer than two described levels", () => {
    const mod = getModule(
      framework,
      resources,
      "delivery-manager",
      "9",
      "agile-and-lean-knowledge",
    )!;
    const oneLevel = {
      ...framework,
      skills: framework.skills.map((s) =>
        s.name === "Agile and lean knowledge"
          ? { ...s, levels: { ...s.levels, Contributor: [], Skilled: [], Expert: [], Leader: [] } }
          : s,
      ),
    };
    expect(frameworkQuestions(oneLevel, mod)).toEqual([]);
  });

  it("asks consulting questions about stages and pillars", () => {
    const mod = getModule(framework, resources, "delivery-manager", "9", "navigating-conflict")!;
    const qs = frameworkQuestions(framework, mod, seededRandom(9));
    expect(qs.filter((q) => q.q.startsWith("At which stage"))).toHaveLength(2);
    expect(qs.filter((q) => q.q.startsWith("Which pillar"))).toHaveLength(3);
  });

  it("scores answers as a fraction", () => {
    const qs = [
      { q: "a", options: ["x", "y"], correct: 0, explain: "" },
      { q: "b", options: ["x", "y"], correct: 1, explain: "" },
    ];
    expect(scoreAnswers(qs, [0, 0])).toBe(0.5);
    expect(scoreAnswers(qs, [0, 1])).toBe(1);
  });
});
