import { fireEvent, screen } from "@testing-library/react";

import { loadProfile } from "@/lib/pathways/storage";
import { renderPathways, testUser } from "@tests/render-pathways";

import { HomeView } from "./HomeView";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

describe("HomeView", () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it("builds a pathway from capability, role and grade", () => {
    renderPathways(<HomeView />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Grow in your craft" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Build my pathway/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Tech and Data/ }));
    fireEvent.click(screen.getByRole("button", { name: /Data Engineer/ }));
    // Grade 12 follows 11, for behaviours only.
    expect(
      screen.getByRole("button", { name: /Head of \(12\).*Behaviours only/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Senior (9)" }));
    expect(screen.getByRole("button", { name: "Senior (9)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Build my pathway" }));
    expect(push).toHaveBeenCalledWith("/pathways/data-engineer/9");
    expect(loadProfile(testUser.id)).toMatchObject({ role: "Data Engineer", grade: "9" });
  });

  it("offers only the grades the role has, and says where it starts", () => {
    renderPathways(<HomeView />);
    fireEvent.click(screen.getByRole("button", { name: /Design/ }));
    fireEvent.click(screen.getByRole("button", { name: /Impact Analyst/ }));
    const grades = screen
      .getByRole("group", { name: "What's your current grade?" })
      .querySelectorAll("button");
    expect([...grades].map((b) => b.textContent)).toEqual(["Senior (9)", "Lead (10)"]);
    expect(
      screen.getByText("This role starts at Senior (9) in the framework."),
    ).toBeInTheDocument();
  });

  it("clears the role and grade when the capability changes", () => {
    renderPathways(<HomeView />);
    fireEvent.click(screen.getByRole("button", { name: /Delivery/ }));
    fireEvent.click(screen.getByRole("button", { name: /Delivery Manager/ }));
    fireEvent.click(screen.getByRole("button", { name: /Design/ }));
    expect(
      screen.queryByRole("group", { name: "What's your current grade?" }),
    ).not.toBeInTheDocument();
  });
});
