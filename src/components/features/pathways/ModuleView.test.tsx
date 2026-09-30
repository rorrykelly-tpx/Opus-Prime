import { fireEvent, screen, within } from "@testing-library/react";

import { loadProfile } from "@/lib/pathways/storage";
import { renderPathways, testUser } from "@tests/render-pathways";

import { ModuleView } from "./ModuleView";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/pathways/functional-consultant/10/modules/coding-and-scripting",
}));

describe("ModuleView", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows what good looks like, and flags a level the framework doesn't describe", () => {
    renderPathways(
      <ModuleView roleSlug="functional-consultant" grade="10" moduleSlug="coding-and-scripting" />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Coding and scripting" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The framework expects Skilled for this skill at your grade, but doesn't describe/,
      ),
    ).toHaveTextContent("Ask your Head of Practice what good looks like.");
    // Opening the pathway makes it the consultant's own.
    expect(loadProfile(testUser.id)).toMatchObject({ role: "Functional Consultant", grade: "10" });
  });

  it("marks a module as read, keeps focus on the button and can undo it", () => {
    renderPathways(
      <ModuleView roleSlug="functional-consultant" grade="10" moduleSlug="coding-and-scripting" />,
    );
    const button = screen.getByRole("button", { name: "Mark as read" });
    button.focus();
    fireEvent.click(button);
    expect(screen.getByText(/You've marked this as read/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
    expect(loadProfile(testUser.id).read).toEqual({ "s:Coding and scripting": true });
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(loadProfile(testUser.id).read).toEqual({});
  });

  it("runs the framework quiz and records the best score", () => {
    renderPathways(
      <ModuleView roleSlug="delivery-manager" grade="9" moduleSlug="agile-and-lean-knowledge" />,
    );
    const quiz = within(document.getElementById("quiz")!);
    fireEvent.click(quiz.getByRole("button", { name: "Knowing the framework" }));
    for (let i = 0; i < 5; i++) {
      expect(quiz.getByText(`Knowing the framework. Question ${i + 1} of 5`)).toBeInTheDocument();
      fireEvent.click(quiz.getAllByRole("button")[0]!);
      expect(quiz.getByText(/^(Correct\.|Not quite\.)$/)).toBeInTheDocument();
      fireEvent.click(quiz.getByRole("button", { name: i < 4 ? "Next question" : "See my score" }));
    }
    expect(quiz.getByRole("status")).toHaveTextContent(/^\d\/5$/);
    const score = loadProfile(testUser.id).quiz["s:Agile and lean knowledge"];
    expect(score?.know).toBeGreaterThanOrEqual(0);
    fireEvent.click(quiz.getByRole("button", { name: "Done" }));
    expect(quiz.getByText(/Best scores: framework \d+%/)).toBeInTheDocument();
  });

  it("lists tagged resources and a course for the skill's topic", () => {
    renderPathways(
      <ModuleView roleSlug="delivery-manager" grade="9" moduleSlug="agile-and-lean-knowledge" />,
    );
    expect(screen.getByRole("link", { name: "The Scrum Guide" })).toHaveAttribute(
      "href",
      "https://scrumguides.org/scrum-guide.html",
    );
    expect(screen.getByRole("heading", { name: "Courses: Agile delivery" })).toBeInTheDocument();
  });
});
