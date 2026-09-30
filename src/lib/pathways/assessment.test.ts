import { evidenceWith, framework, knowledge, profileWith, role } from "@tests/pathways-data";

import {
  assess,
  checkGrade,
  moduleProgress,
  moduleStatus,
  nextSteps,
  overallRating,
  rateAgainst,
  summariseEvidence,
} from "./assessment";
import { demoData } from "./demo";
import { PROFICIENCY_LEVELS } from "./framework";
import { buildPathway } from "./model";

const behaviourNames = framework.behaviours.map((b) => b.name);

describe("summariseEvidence", () => {
  it("keeps the highest level per skill and band per behaviour, and counts the rest", () => {
    const es = summariseEvidence([
      evidenceWith({
        skills: [{ name: "Testing (data)", level: "Contributor", why: "" }],
        behaviours: [{ name: "Owning and delivering", band: "9", why: "" }],
        impacts: ["Client delivery"],
      }),
      evidenceWith({
        skills: [{ name: "Testing (data)", level: "Learner", why: "" }],
        behaviours: [{ name: "Owning and delivering", band: "8", why: "" }],
        impacts: ["Client delivery"],
        consulting: ["Client Relationships"],
      }),
    ]);
    expect(es.skill["Testing (data)"]).toBe(1);
    expect(es.beh["Owning and delivering"]).toBe(2);
    expect(es.imp).toEqual({ "Client delivery": 2 });
    expect(es.con).toEqual({ "Client Relationships": 1 });
  });
});

describe("rateAgainst", () => {
  it("uses the progression assessment wording", () => {
    expect(rateAgainst("Expert", "Skilled", PROFICIENCY_LEVELS)).toBe("exceeded");
    expect(rateAgainst("Skilled", "Skilled", PROFICIENCY_LEVELS)).toBe("met");
    expect(rateAgainst("Contributor", "Skilled", PROFICIENCY_LEVELS)).toBe("partial");
    expect(rateAgainst("Learner", "Skilled", PROFICIENCY_LEVELS)).toBe("not");
    expect(rateAgainst(null, "Skilled", PROFICIENCY_LEVELS)).toBe("not");
    expect(rateAgainst("Skilled", null, PROFICIENCY_LEVELS)).toBeNull();
  });
});

describe("checkGrade and assess", () => {
  const engineer = role("Data Engineer");

  it("places nobody without evidence, and aims for the next grade", () => {
    const a = assess(framework, engineer, "9", []);
    expect(a.estimate).toBeNull();
    expect(a.target).toBe("10");
  });

  it("needs 70% of craft skills and 3 of 5 behaviours at a grade", () => {
    const at8 = engineer.skills.map((s) => ({ name: s.name, level: s.expected["8"]!, why: "" }));
    const three = behaviourNames.slice(0, 3).map((name) => ({ name, band: "8" as const, why: "" }));
    const two = three.slice(0, 2);
    const es = (b: typeof three) =>
      summariseEvidence([evidenceWith({ skills: at8, behaviours: b })]);
    expect(checkGrade(framework, engineer, "8", es(three)).ok).toBe(true);
    expect(checkGrade(framework, engineer, "8", es(two)).ok).toBe(false);
  });

  it("aims for the current grade when the evidence places someone below it", () => {
    const a = assess(framework, engineer, "9", demoData().evidence);
    expect(a.estimate).toBe("8");
    expect(a.target).toBe("9");
  });
});

describe("Julia, the demo consultant", () => {
  const { profile, evidence, certs } = demoData();
  const engineer = role("Data Engineer");
  const a = assess(framework, engineer, "9", evidence);

  it("is partially meeting expectations at Senior (9), as the demo says", () => {
    expect(overallRating(framework, a)).toEqual({
      key: "partially",
      label: "Partially meeting expectations",
      met: 7,
      part: 6,
      total: 13,
    });
  });

  it("is 48% of the way through her pathway", () => {
    const pathway = buildPathway(framework, "data-engineer", "9")!;
    expect(moduleProgress(pathway.modules, profile, a.es)).toEqual({ pts: 43, total: 90, pct: 48 });
  });

  it("gets next steps with behaviours first, then skills, knowledge and a consulting module", () => {
    const steps = nextSteps({ framework, knowledge, assessment: a, profile, certs, demo: true });
    expect(steps.map((s) => [s.kind, s.name])).toEqual([
      ["behaviour", "Developing your craft"],
      ["behaviour", "Communicating and collaborating"],
      ["behaviour", "Navigating scope and complexity"],
      ["skill", "Data engineering and manipulation"],
      ["skill", "Programming and build (data engineering)"],
      ["skill", "Testing (data)"],
      ["knowledge", "QA and testing"],
      ["knowledge", "Data architecture"],
      ["consulting", "Understanding client needs"],
    ]);
    expect(steps[0]!.text).toBe("Julia's evidence matches Mid (8). Aim for Senior (9).");
    expect(steps[6]!.text).toBe(
      "Her subject quiz score is 40%. Aim for 60% or more, or complete a course.",
    );
    expect(steps[3]!.href).toBe(
      "/pathways/data-engineer/9/modules/data-engineering-and-manipulation",
    );
  });

  it("gets a step for each impact with no evidence", () => {
    const steps = nextSteps({
      framework,
      knowledge,
      assessment: assess(framework, engineer, "9", []),
      profile: profileWith(),
      certs: [],
    });
    expect(steps.filter((s) => s.kind === "impact").map((s) => s.name)).toEqual([
      "People and practice",
      "Growth and social value",
      "Client delivery",
    ]);
  });
});

describe("moduleStatus", () => {
  const pathway = buildPathway(framework, "data-engineer", "9")!;
  const testing = pathway.craftSkills.find((s) => s.name === "Testing (data)")!;

  it("counts reading, an 80% quiz and evidence at the target level", () => {
    const profile = profileWith({
      read: { [testing.key]: true },
      quiz: { [testing.key]: { know: 0.8 } },
    });
    const below = summariseEvidence([
      evidenceWith({ skills: [{ name: "Testing (data)", level: "Contributor", why: "" }] }),
    ]);
    expect(moduleStatus(testing, profile, below)).toEqual({
      read: true,
      quiz: true,
      evidence: false,
      done: false,
    });
    const at = summariseEvidence([
      evidenceWith({ skills: [{ name: "Testing (data)", level: "Skilled", why: "" }] }),
    ]);
    expect(moduleStatus(testing, profile, at).done).toBe(true);
  });

  it("doesn't pass the quiz below 80%", () => {
    const profile = profileWith({ quiz: { [testing.key]: { know: 0.6, subj: 0.79 } } });
    expect(moduleStatus(testing, profile, summariseEvidence([])).quiz).toBe(false);
  });
});
