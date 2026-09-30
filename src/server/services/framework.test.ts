import frameworkJson from "@/data/framework.json";
import resourcesJson from "@/data/resources.json";

import { findFrameworkProblems, frameworkSource, parseFrameworkSource } from "./framework";

const clone = <T>(value: T): T => structuredClone(value);

describe("framework data", () => {
  it("loads the committed framework with the expected counts", () => {
    const { framework, resources } = frameworkSource;
    expect(framework.roles).toHaveLength(21);
    expect(framework.skills).toHaveLength(111);
    expect(framework.proficiencyLevels).toHaveLength(6);
    expect(framework.behaviours).toHaveLength(5);
    expect(framework.impacts).toHaveLength(3);
    expect(framework.consultingPillars).toHaveLength(3);
    expect(resources.length).toBeGreaterThan(0);
  });

  it("has no cross-reference problems in the committed data", () => {
    expect(findFrameworkProblems(frameworkSource.framework, frameworkSource.resources)).toEqual([]);
  });

  it("rejects an unknown proficiency level", () => {
    const raw = clone(frameworkJson);
    const firstSkill = raw.roles[0]!.skills[0]!;
    (firstSkill.expected as Record<string, string | null>)["9"] = "Wizard";
    expect(() => parseFrameworkSource(raw, resourcesJson)).toThrow();
  });

  it("rejects a skill level map with a level missing", () => {
    const raw = clone(frameworkJson);
    delete (raw.skills[0]!.levels as Partial<Record<string, string[]>>).Driver;
    expect(() => parseFrameworkSource(raw, resourcesJson)).toThrow();
  });

  it("reports a role that uses an undefined skill", () => {
    const { framework, resources } = clone(frameworkSource);
    framework.roles[0]!.skills.push({ name: "Juggling", expected: { "9": "Skilled" } });
    expect(findFrameworkProblems(framework, resources)).toContain(
      'Role "Delivery Manager" uses undefined skill "Juggling"',
    );
  });

  it("reports module names that clash once slugified", () => {
    const { framework, resources } = clone(frameworkSource);
    const skill = framework.skills[0]!;
    framework.skills.push({ ...skill, name: skill.name.toUpperCase() });
    expect(findFrameworkProblems(framework, resources).join("\n")).toMatch(/URL slug/);
  });

  it("reports a resource tagged with an unknown framework item", () => {
    const { framework, resources } = clone(frameworkSource);
    resources[0]!.frameworkTags.push("Not a real skill");
    expect(findFrameworkProblems(framework, resources).join("\n")).toMatch(
      /tagged with unknown framework item "Not a real skill"/,
    );
  });

  it("rejects resource links that aren't http or https", () => {
    const raw = clone(resourcesJson);
    raw.resources[0]!.url = "javascript:alert(1)";
    expect(() => parseFrameworkSource(frameworkJson, raw)).toThrow();
  });
});
