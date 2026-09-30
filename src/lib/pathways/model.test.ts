import { framework, resources } from "@tests/pathways-data";

import { buildPathway, findRole, getModule, listRoles } from "./model";

describe("listRoles", () => {
  it("lists all 21 roles with unique slugs", () => {
    const roles = listRoles(framework);
    expect(roles).toHaveLength(21);
    expect(new Set(roles.map((r) => r.slug)).size).toBe(21);
  });

  it("finds a role by slug", () => {
    expect(findRole(framework, "delivery-manager")?.role).toBe("Delivery Manager");
    expect(findRole(framework, "astronaut")).toBeNull();
  });

  it("adds grade 12 above 11, for behaviours only", () => {
    expect(findRole(framework, "delivery-manager")?.grades).toEqual([
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ]);
    expect(findRole(framework, "content-designer")?.grades).toEqual(["7", "8", "9", "10"]);
  });
});

describe("buildPathway", () => {
  it("builds a pathway for every grade each role offers", () => {
    for (const role of listRoles(framework)) {
      for (const grade of role.grades) {
        expect(
          buildPathway(framework, role.slug, grade),
          `${role.role} at ${grade}`,
        ).not.toBeNull();
      }
    }
  });

  it("returns null for a grade the role doesn't offer, or an unknown role", () => {
    // Delivery Manager runs from grade 7 to 11, plus 12.
    expect(buildPathway(framework, "delivery-manager", "6")).toBeNull();
    expect(buildPathway(framework, "content-designer", "12")).toBeNull();
    expect(buildPathway(framework, "astronaut", "9")).toBeNull();
  });

  it("lists craft skills with the expected level at the grade", () => {
    const pathway = buildPathway(framework, "delivery-manager", "9")!;
    expect(pathway.craftSkills).toHaveLength(8);
    expect(pathway.craftSkills[0]).toEqual({
      kind: "skill",
      key: "s:Agile and lean knowledge",
      slug: "agile-and-lean-knowledge",
      name: "Agile and lean knowledge",
      target: "Skilled",
    });
  });

  it("marks skills with no expectation at the grade", () => {
    const pathway = buildPathway(framework, "service-desk-analyst", "6")!;
    expect(
      pathway.craftSkills.find((s) => s.name === "Problem management (Tech)")?.target,
    ).toBeNull();
    // Grade 12 is behaviours only, so no craft skill has a target.
    const head = buildPathway(framework, "delivery-manager", "12")!;
    expect(head.craftSkills.every((s) => s.target === null)).toBe(true);
  });

  it("lists the 5 behaviours at the band for the grade", () => {
    const junior = buildPathway(framework, "software-engineer", "7")!;
    expect(junior.behaviours).toHaveLength(5);
    expect(junior.behaviours.every((b) => b.target === "6/7")).toBe(true);
    const head = buildPathway(framework, "software-engineer", "12")!;
    expect(head.behaviours.every((b) => b.target === "12")).toBe(true);
  });

  it("lists the 3 consulting pillars with their modules", () => {
    const pathway = buildPathway(framework, "delivery-manager", "9")!;
    expect(pathway.consulting.map((p) => p.pillar)).toEqual([
      "Client Relationships",
      "Collaborative Working",
      "Commercial Stewardship",
    ]);
    expect(pathway.consulting.map((p) => p.modules.length)).toEqual([6, 6, 5]);
  });

  it("lists every module once, in display order", () => {
    const pathway = buildPathway(framework, "delivery-manager", "9")!;
    expect(pathway.modules).toHaveLength(8 + 5 + 17);
    expect(new Set(pathway.modules.map((m) => m.key)).size).toBe(30);
    expect(pathway.modules[0]!.kind).toBe("skill");
    expect(pathway.modules.at(-1)!.kind).toBe("consulting");
  });
});

describe("getModule", () => {
  it("shows every described level with the target flagged", () => {
    const mod = getModule(
      framework,
      resources,
      "delivery-manager",
      "9",
      "agile-and-lean-knowledge",
    );
    if (mod?.kind !== "skill") throw new Error("expected a skill module");
    expect(mod.target).toBe("Skilled");
    expect(mod.levels.map((l) => [l.level, l.isTarget])).toEqual([
      ["Learner", false],
      ["Contributor", false],
      ["Skilled", true],
      ["Expert", false],
      ["Leader", false],
    ]);
    expect(mod.targetUndescribed).toBe(false);
  });

  it("flags a target level the framework doesn't describe yet", () => {
    // Functional Consultants need Skilled coding at grade 10, but Skilled has no descriptors.
    const mod = getModule(
      framework,
      resources,
      "functional-consultant",
      "10",
      "coding-and-scripting",
    );
    if (mod?.kind !== "skill") throw new Error("expected a skill module");
    expect(mod.target).toBe("Skilled");
    expect(mod.targetUndescribed).toBe(true);
    expect(mod.levels.map((l) => l.level)).toEqual(["Learner", "Contributor"]);
  });

  it("has no target when the skill isn't expected at the grade", () => {
    const mod = getModule(
      framework,
      resources,
      "service-desk-analyst",
      "6",
      "problem-management-tech",
    );
    if (mod?.kind !== "skill") throw new Error("expected a skill module");
    expect(mod.target).toBeNull();
    expect(mod.targetUndescribed).toBe(false);
    expect(mod.levels.some((l) => l.isTarget)).toBe(false);
  });

  it("includes the skill definition", () => {
    const mod = getModule(
      framework,
      resources,
      "content-designer",
      "8",
      "accessibility-and-inclusion-content-design",
    );
    expect(mod?.definition).toMatch(/^Contributing to an inclusive design culture/);
  });

  it("returns null for a skill that isn't part of the role, or an unknown module", () => {
    expect(
      getModule(framework, resources, "delivery-manager", "9", "product-ownership"),
    ).toBeNull();
    expect(getModule(framework, resources, "delivery-manager", "9", "juggling")).toBeNull();
    expect(
      getModule(framework, resources, "delivery-manager", "6", "agile-and-lean-knowledge"),
    ).toBeNull();
  });

  it("shows every behaviour band with the target flagged", () => {
    const mod = getModule(framework, resources, "software-engineer", "6", "developing-your-craft");
    if (mod?.kind !== "behaviour") throw new Error("expected a behaviour module");
    expect(mod.target).toBe("6/7");
    expect(mod.levels.map((l) => l.label)).toEqual([
      "Junior / Graduate (6/7)",
      "Mid (8)",
      "Senior (9)",
      "Lead (10)",
      "Principal (11)",
      "Head of (12)",
    ]);
    expect(mod.levels[0]!.isTarget).toBe(true);
  });

  it("describes where a consulting module sits", () => {
    const mod = getModule(framework, resources, "delivery-manager", "9", "navigating-conflict");
    if (mod?.kind !== "consulting") throw new Error("expected a consulting module");
    expect(mod).toMatchObject({
      key: "c:Navigating conflict",
      pillar: "Client Relationships",
      stage: "fluency",
      foundation: false,
      links: {
        impact: "Client delivery",
        behaviour: "Communicating and collaborating",
        behaviourSlug: "communicating-and-collaborating",
      },
    });
    expect(mod.pillarModules).toHaveLength(6);
  });

  it("lists up to five tagged learning resources", () => {
    const mod = getModule(
      framework,
      resources,
      "delivery-manager",
      "9",
      "agile-and-lean-knowledge",
    )!;
    const titles = mod.resources.map((r) => r.title);
    expect(titles).toContain("Agile delivery (Service Manual)");
    expect(titles).toContain("The Scrum Guide");
    expect(mod.resources.length).toBeLessThanOrEqual(5);
    expect(mod.resources.every((r) => r.frameworkTags.includes("Agile and lean knowledge"))).toBe(
      true,
    );
  });

  it("returns no resources when none are tagged", () => {
    const mod = getModule(framework, [], "delivery-manager", "9", "agile-and-lean-knowledge");
    expect(mod?.resources).toEqual([]);
  });
});
