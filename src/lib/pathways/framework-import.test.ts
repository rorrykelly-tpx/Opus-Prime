import { framework } from "@tests/pathways-data";

import {
  applyFrameworkTabs,
  frameworkTabKind,
  rowsToRoles,
  rowsToSkills,
  splitStatements,
} from "./framework-import";

describe("framework spreadsheets", () => {
  it("recognises tabs by name or header", () => {
    expect(frameworkTabKind("Skills by role", [])).toBe("roles");
    expect(frameworkTabKind("Sheet1", [["Skill", "Definition"]])).toBe("defs");
    expect(frameworkTabKind("Sheet2", [["Impact", "Definition"]])).toBe("imp");
    expect(frameworkTabKind("Notes", [["Anything"]])).toBeNull();
  });

  it("splits descriptor cells into statements", () => {
    expect(splitStatements("• one thing\n• another thing")).toEqual(["one thing", "another thing"]);
    expect(splitStatements("Currently not defined")).toEqual([]);
  });

  it("rebuilds skills and roles, reporting skills with no definition", () => {
    const skills = rowsToSkills([
      ["Skill", "Definition", "Learner", "Contributor"],
      ["Testing", "Checks things", "tests with help", "tests alone"],
    ]);
    expect(skills[0]).toMatchObject({
      name: "Testing",
      levels: { Learner: ["tests with help"], Contributor: ["tests alone"], Skilled: [] },
    });
    const { roles, missing } = rowsToRoles(
      [
        ["Capability", "Practice", "Job role", "Skill", "6", "7", "8", "9", "10", "11"],
        ["Tech", "QA", "Tester", "testing", "", "Learner", "Contributor", "", "", ""],
        ["Tech", "QA", "Tester", "Juggling", "Learner", "", "", "", "", ""],
      ],
      skills,
    );
    expect(roles).toEqual([
      {
        capability: "Tech",
        practice: "QA",
        role: "Tester",
        grades: ["7", "8"],
        skills: [
          {
            name: "Testing",
            expected: {
              "6": null,
              "7": "Learner",
              "8": "Contributor",
              "9": null,
              "10": null,
              "11": null,
            },
          },
        ],
      },
    ]);
    expect([...missing]).toEqual(["Juggling"]);
  });

  it("refuses files with no framework tabs", () => {
    expect(applyFrameworkTabs({}, {}, framework.skills)).toMatchObject({ ok: false });
  });
});
