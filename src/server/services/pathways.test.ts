import { frameworkSource, type FrameworkSource } from "./framework";
import { buildPathway, findRole, getModule, listRoles } from "./pathways";

describe("listRoles", () => {
  it("lists all 21 roles with unique slugs", () => {
    const roles = listRoles();
    expect(roles).toHaveLength(21);
    expect(new Set(roles.map((r) => r.slug)).size).toBe(21);
  });

  it("finds a role by slug", () => {
    expect(findRole("delivery-manager")?.role).toBe("Delivery Manager");
    expect(findRole("astronaut")).toBeNull();
  });
});

describe("buildPathway", () => {
  it("builds a pathway for every grade each role offers", () => {
    for (const role of listRoles()) {
      for (const grade of role.grades) {
        expect(buildPathway(role.slug, grade), `${role.role} at ${grade}`).not.toBeNull();
      }
    }
  });

  it("returns null for a grade the role doesn't offer", () => {
    // Delivery Manager runs from grade 7 to 11.
    expect(buildPathway("delivery-manager", "6")).toBeNull();
    expect(buildPathway("delivery-manager", "12")).toBeNull();
  });

  it("returns null for an unknown role", () => {
    expect(buildPathway("astronaut", "9")).toBeNull();
  });

  it("lists craft skills with the expected level at the grade", () => {
    const pathway = buildPathway("delivery-manager", "9")!;
    expect(pathway.role.role).toBe("Delivery Manager");
    expect(pathway.craftSkills).toHaveLength(8);
    expect(pathway.craftSkills[0]).toEqual({
      kind: "skill",
      slug: "agile-and-lean-knowledge",
      name: "Agile and lean knowledge",
      target: "Skilled",
    });
  });

  it("marks skills with no expectation at the grade", () => {
    const pathway = buildPathway("service-desk-analyst", "6")!;
    const skill = pathway.craftSkills.find((s) => s.name === "Problem management (Tech)");
    expect(skill?.target).toBeNull();
  });

  it("lists the 5 behaviours at the band for the grade", () => {
    const junior = buildPathway("software-engineer", "7")!;
    expect(junior.behaviours).toHaveLength(5);
    expect(junior.behaviours.every((b) => b.target === "6/7")).toBe(true);

    const lead = buildPathway("software-engineer", "10")!;
    expect(lead.behaviours.every((b) => b.target === "10")).toBe(true);
  });

  it("lists the 3 consulting pillars with their modules", () => {
    const pathway = buildPathway("delivery-manager", "9")!;
    expect(pathway.consulting.map((p) => p.pillar)).toEqual([
      "Client Relationships",
      "Collaborative Working",
      "Commercial Stewardship",
    ]);
    expect(pathway.consulting.map((p) => p.modules.length)).toEqual([6, 6, 5]);
    expect(pathway.consulting[0]!.modules[0]).toMatchObject({
      kind: "consulting",
      stage: "literacy",
      foundation: true,
    });
  });

  it("lists every module slug once for progress", () => {
    const pathway = buildPathway("delivery-manager", "9")!;
    expect(pathway.moduleSlugs).toHaveLength(8 + 5 + 17);
    expect(new Set(pathway.moduleSlugs).size).toBe(pathway.moduleSlugs.length);
  });
});

describe("getModule", () => {
  it("shows the target skill level with the levels either side", () => {
    const mod = getModule("delivery-manager", "9", "agile-and-lean-knowledge");
    expect(mod?.kind).toBe("skill");
    if (mod?.kind !== "skill") return;
    expect(mod.target).toBe("Skilled");
    expect(mod.levels.map((l) => [l.level, l.isTarget])).toEqual([
      ["Contributor", false],
      ["Skilled", true],
      ["Expert", false],
    ]);
    expect(mod.levels.every((l) => l.descriptors.length > 0)).toBe(true);
    expect(mod.targetUndescribed).toBe(false);
  });

  it("includes the skill definition", () => {
    const mod = getModule("content-designer", "8", "accessibility-and-inclusion-content-design");
    expect(mod?.definition).toMatch(/^Contributing to an inclusive design culture/);
  });

  it("shows only the level above when the target is the lowest level", () => {
    const mod = getModule("delivery-manager", "7", "agile-and-lean-knowledge");
    if (mod?.kind !== "skill") throw new Error("expected a skill module");
    expect(mod.levels.map((l) => l.level)).toEqual(["Learner", "Contributor"]);
  });

  it("flags a target level the framework doesn't describe yet", () => {
    // Functional Consultants need Skilled coding at grade 10, but Skilled has no descriptors.
    const mod = getModule("functional-consultant", "10", "coding-and-scripting");
    if (mod?.kind !== "skill") throw new Error("expected a skill module");
    expect(mod.target).toBe("Skilled");
    expect(mod.targetUndescribed).toBe(true);
    // Expert is also undescribed, so only the described level below is shown for context.
    expect(mod.levels.map((l) => [l.level, l.descriptors.length > 0])).toEqual([
      ["Contributor", true],
      ["Skilled", false],
    ]);
  });

  it("shows every described level when the skill isn't expected at the grade", () => {
    const mod = getModule("service-desk-analyst", "6", "problem-management-tech");
    if (mod?.kind !== "skill") throw new Error("expected a skill module");
    expect(mod.target).toBeNull();
    expect(mod.targetUndescribed).toBe(false);
    expect(mod.levels.map((l) => l.level)).toEqual(["Learner", "Contributor", "Skilled", "Expert"]);
    expect(mod.levels.some((l) => l.isTarget)).toBe(false);
  });

  it("returns null for a skill that isn't part of the role", () => {
    expect(getModule("delivery-manager", "9", "product-ownership")).toBeNull();
  });

  it("returns null for an unknown module, role or grade", () => {
    expect(getModule("delivery-manager", "9", "juggling")).toBeNull();
    expect(getModule("astronaut", "9", "agile-and-lean-knowledge")).toBeNull();
    expect(getModule("delivery-manager", "6", "agile-and-lean-knowledge")).toBeNull();
  });

  it("shows the behaviour band for the grade with the bands either side", () => {
    const junior = getModule("software-engineer", "6", "developing-your-craft");
    if (junior?.kind !== "behaviour") throw new Error("expected a behaviour module");
    expect(junior.target).toBe("6/7");
    expect(junior.levels.map((l) => [l.label, l.isTarget])).toEqual([
      ["Junior / Graduate (6/7)", true],
      ["Mid (8)", false],
    ]);

    const principal = getModule("delivery-manager", "11", "developing-your-craft");
    if (principal?.kind !== "behaviour") throw new Error("expected a behaviour module");
    expect(principal.levels.map((l) => l.level)).toEqual(["10", "11", "12"]);
  });

  it("describes where a consulting module sits", () => {
    const mod = getModule("delivery-manager", "9", "navigating-conflict");
    if (mod?.kind !== "consulting") throw new Error("expected a consulting module");
    expect(mod).toMatchObject({
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
    expect(mod.pillarModules.some((m) => m.slug === "navigating-conflict")).toBe(true);
  });

  it("lists the learning resources tagged to the module", () => {
    const mod = getModule("delivery-manager", "9", "agile-and-lean-knowledge")!;
    const titles = mod.resources.map((r) => r.title);
    expect(titles).toContain("Agile delivery (Service Manual)");
    expect(titles).toContain("The Scrum Guide");
    expect(mod.resources.every((r) => r.frameworkTags.includes("Agile and lean knowledge"))).toBe(
      true,
    );
  });

  it("returns no resources when none are tagged", () => {
    const untagged: FrameworkSource = { ...frameworkSource, resources: [] };
    const mod = getModule("delivery-manager", "9", "agile-and-lean-knowledge", untagged);
    expect(mod?.resources).toEqual([]);
  });
});
