import {
  bandForGrade,
  bandLabel,
  gradeLabel,
  isGrade,
  slugify,
  summariseProgress,
} from "./pathways";

describe("pathway helpers", () => {
  it("labels grades", () => {
    expect(gradeLabel("6")).toBe("Graduate (6)");
    expect(gradeLabel("9")).toBe("Senior (9)");
  });

  it("puts grades 6 and 7 in one behaviour band", () => {
    expect(bandForGrade("6")).toBe("6/7");
    expect(bandForGrade("7")).toBe("6/7");
    expect(bandForGrade("8")).toBe("8");
    expect(bandLabel("6/7")).toBe("Junior / Graduate (6/7)");
    expect(bandLabel("10")).toBe("Lead (10)");
  });

  it("recognises valid grades only", () => {
    expect(isGrade("11")).toBe(true);
    expect(isGrade("6/7")).toBe(false);
    expect(isGrade("13")).toBe(false);
  });

  it("slugifies framework names", () => {
    expect(slugify("Problem management (Delivery)")).toBe("problem-management-delivery");
    expect(slugify("Context, problem and solution")).toBe("context-problem-and-solution");
    expect(slugify("Interaction and Product Designer")).toBe("interaction-and-product-designer");
  });

  it("summarises progress against the pathway only", () => {
    const read = new Set(["a", "c", "not-in-pathway"]);
    expect(summariseProgress(["a", "b", "c"], read)).toEqual({ read: 2, total: 3, percent: 67 });
    expect(summariseProgress([], read)).toEqual({ read: 0, total: 0, percent: 0 });
  });
});
