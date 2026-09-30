import { fireEvent, render, screen } from "@testing-library/react";

import type { RoleOption } from "@/types/pathways";

import { PathwayBuilder } from "./PathwayBuilder";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const roles: RoleOption[] = [
  {
    slug: "delivery-manager",
    capability: "Delivery",
    practice: "Delivery Management",
    role: "Delivery Manager",
    grades: ["7", "8", "9", "10", "11"],
  },
  {
    slug: "impact-analyst",
    capability: "Design",
    practice: "Research and Analysis",
    role: "Impact Analyst",
    grades: ["9", "10"],
  },
];

const buildButton = () => screen.getByRole("button", { name: "Build my pathway" });

describe("PathwayBuilder", () => {
  beforeEach(() => push.mockClear());

  it("groups roles by capability and practice", () => {
    render(<PathwayBuilder roles={roles} />);
    expect(screen.getByRole("heading", { name: "Delivery" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Research and Analysis" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Impact Analyst" })).toBeInTheDocument();
  });

  it("offers only the grades that exist for the chosen role", () => {
    render(<PathwayBuilder roles={roles} />);
    expect(screen.queryByRole("radio", { name: /Senior/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Impact Analyst" }));
    const grades = screen
      .getAllByRole("radio", { name: /\(\d+\)$/ })
      .map((r) => r.closest("label")?.textContent);
    expect(grades).toEqual(["Senior (9)", "Lead (10)"]);
    expect(
      screen.getByText("This role starts at Senior (9) in the framework."),
    ).toBeInTheDocument();
  });

  it("goes to a URL that encodes the role and grade", () => {
    render(<PathwayBuilder roles={roles} />);
    fireEvent.click(screen.getByRole("radio", { name: "Delivery Manager" }));
    fireEvent.click(screen.getByRole("radio", { name: "Lead (10)" }));
    fireEvent.click(buildButton());
    expect(push).toHaveBeenCalledWith("/pathways/delivery-manager/10");
  });

  it("clears a grade the newly chosen role doesn't have", () => {
    render(<PathwayBuilder roles={roles} />);
    fireEvent.click(screen.getByRole("radio", { name: "Delivery Manager" }));
    fireEvent.click(screen.getByRole("radio", { name: "Junior (7)" }));
    fireEvent.click(screen.getByRole("radio", { name: "Impact Analyst" }));
    fireEvent.click(buildButton());

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose your grade");
  });

  it("keeps a grade the newly chosen role also has", () => {
    render(<PathwayBuilder roles={roles} />);
    fireEvent.click(screen.getByRole("radio", { name: "Delivery Manager" }));
    fireEvent.click(screen.getByRole("radio", { name: "Senior (9)" }));
    fireEvent.click(screen.getByRole("radio", { name: "Impact Analyst" }));
    fireEvent.click(buildButton());
    expect(push).toHaveBeenCalledWith("/pathways/impact-analyst/9");
  });

  it("asks for a role before building", () => {
    render(<PathwayBuilder roles={roles} />);
    fireEvent.click(buildButton());
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose your role");
  });

  it("starts from a prefilled role and grade", () => {
    render(<PathwayBuilder roles={roles} initialRoleSlug="impact-analyst" initialGrade="10" />);
    expect(screen.getByRole("radio", { name: "Impact Analyst" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Lead (10)" })).toBeChecked();
  });
});
