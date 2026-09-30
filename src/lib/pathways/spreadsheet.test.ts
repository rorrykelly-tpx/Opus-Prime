import { framework, role } from "@tests/pathways-data";

import {
  detectRoleGrade,
  detectTable,
  importedEvidence,
  matchItem,
  parseCSV,
  parseGrade,
  parseLevel,
  startImportDraft,
} from "./spreadsheet";

describe("parseCSV", () => {
  it("handles quotes, escaped quotes, CRLF and blank lines", () => {
    expect(parseCSV('a,"b, c"\r\n"say ""hi""",d\n\n')).toEqual([
      ["a", "b, c"],
      ['say "hi"', "d"],
    ]);
    expect(parseCSV("one\ttwo", "\t")).toEqual([["one", "two"]]);
  });
});

describe("matchItem", () => {
  const engineer = role("Data Engineer");

  it("matches exact, bracket-less, old and partial names", () => {
    expect(matchItem(framework, "testing (data)", engineer)).toEqual({
      kind: "s",
      name: "Testing (data)",
    });
    expect(matchItem(framework, "Data management", engineer)).toEqual({
      kind: "s",
      name: "Data management",
    });
    expect(matchItem(framework, "Learning and development", engineer)).toEqual({
      kind: "b",
      name: "Developing your craft",
    });
    expect(matchItem(framework, "Behaviour: Owning and delivering", null)).toEqual({
      kind: "b",
      name: "Owning and delivering",
    });
    expect(matchItem(framework, "Client delivery impact", null)).toEqual({
      kind: "i",
      name: "Client delivery",
    });
  });

  it("doesn't match unrelated text", () => {
    expect(matchItem(framework, "Name", engineer)).toBeNull();
    expect(matchItem(framework, "Overall comments", engineer)).toBeNull();
  });
});

describe("parseLevel and parseGrade", () => {
  const engineer = role("Data Engineer");

  it("reads skill levels as written, as numbers or relative to the grade", () => {
    expect(parseLevel("s", "Skilled", "Testing (data)", engineer, "9")).toBe("Skilled");
    expect(parseLevel("s", "Advanced practitioner", "Testing (data)", engineer, "9")).toBe(
      "Skilled",
    );
    expect(parseLevel("s", "4", "Testing (data)", engineer, "9")).toBe("Expert");
    // Data Engineers need Skilled testing at 9, so "working towards" means Contributor.
    expect(parseLevel("s", "Working towards", "Testing (data)", engineer, "9")).toBe("Contributor");
    expect(parseLevel("s", "Meeting", "Testing (data)", engineer, "9")).toBe("Skilled");
    expect(parseLevel("s", "", "Testing (data)", engineer, "9")).toBeNull();
  });

  it("reads behaviour bands from grades or wording", () => {
    expect(parseLevel("b", "Senior", "Owning and delivering", engineer, "8")).toBe("9");
    expect(parseLevel("b", "Exceeding", "Owning and delivering", engineer, "8")).toBe("9");
    expect(parseLevel("b", "Grade 7", "Owning and delivering", engineer, "8")).toBe("6/7");
    expect(parseLevel("i", "Met", "Client delivery", engineer, "8")).toBeNull();
  });

  it("reads grades from numbers or names", () => {
    expect(parseGrade("Grade 10")).toBe("10");
    expect(parseGrade("Principal consultant")).toBe("11");
    expect(parseGrade("Head of Practice")).toBe("12");
    expect(parseGrade("nothing here")).toBeNull();
  });
});

const assessment = {
  name: "Your self assessment",
  rows: [
    ["Name", "Jo Bloggs"],
    ["Job title", "Data Engineer"],
    ["Current grade", "Senior (9)"],
    [],
    ["Skill or behaviour", "Self assessment rating", "Evidence", "Line manager comments"],
    ["Testing (data)", "Contributor", "I added dbt tests to the core models.", ""],
    [
      "Owning and delivering",
      "Meeting",
      "I fixed a failed overnight load and told the client.",
      "Agree",
    ],
    ["Client delivery", "", "Lots of client work.", ""],
    ["Something we don't have", "Skilled", "", ""],
  ],
};

describe("detectTable and detectRoleGrade", () => {
  it("finds the header row and the item, level, evidence and manager columns", () => {
    const t = detectTable(framework, assessment, role("Data Engineer"));
    expect(t).toMatchObject({ on: true, header: 4, item: 0, level: 1, evidence: [2], manager: 3 });
  });

  it("finds the role and grade in the first rows", () => {
    expect(detectRoleGrade(framework, [assessment], "assessment.xlsx")).toEqual({
      role: "Data Engineer",
      grade: "9",
    });
    expect(
      detectRoleGrade(framework, [{ name: "Sheet1", rows: [] }], "Service Designer 2026.xlsx").role,
    ).toBe("Service Designer");
  });
});

describe("startImportDraft and importedEvidence", () => {
  it("turns a self assessment into tagged evidence", () => {
    const draft = startImportDraft(framework, "jo.xlsx", [assessment], { role: null, grade: null });
    expect(draft).toMatchObject({
      role: "Data Engineer",
      grade: "9",
      setProfile: true,
      tab: "Your self assessment",
    });
    expect(draft.rows.map((r) => [r.match, r.level])).toEqual([
      ["s|Testing (data)", "Contributor"],
      ["b|Owning and delivering", "9"],
      ["i|Client delivery", null],
    ]);
    expect(draft.skipped.map((r) => r.raw)).toEqual(["Something we don't have"]);

    const evidence = importedEvidence(draft, "2026-09-30", 1);
    expect(evidence).toHaveLength(3);
    expect(evidence[0]).toMatchObject({
      title: "Testing (data): from my assessment",
      date: "2026-09-30",
      text: "I added dbt tests to the core models.",
      summary: 'Imported from sheet "Your self assessment", row 6. Self-assessed: Contributor.',
      tags: {
        skills: [{ name: "Testing (data)", level: "Contributor", why: "From your assessment" }],
      },
    });
    expect(evidence[1]!.tags.behaviours).toEqual([
      { name: "Owning and delivering", band: "9", why: "From your assessment" },
    ]);
    expect(evidence[2]!.tags.impacts).toEqual(["Client delivery"]);
    // Re-importing the same file gives the same ids, so evidence is replaced, not duplicated.
    expect(importedEvidence(draft, "2026-10-01").map((e) => e.id)).toEqual(
      evidence.map((e) => e.id),
    );
  });
});
