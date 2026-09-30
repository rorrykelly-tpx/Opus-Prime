import { fireEvent, render, screen } from "@testing-library/react";

import { READ_PROGRESS_STORAGE_KEY } from "@/lib/read-progress";

import { MarkAsRead } from "./MarkAsRead";
import { PathwayProgress } from "./PathwayProgress";

describe("MarkAsRead", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("marks a module as read, updates progress and can be undone", () => {
    render(
      <>
        <PathwayProgress moduleSlugs={["navigating-conflict", "systemic-leadership"]} />
        <MarkAsRead slug="navigating-conflict" />
      </>,
    );
    expect(screen.getByText("0 of 2 modules read (0%)")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Mark as read" });
    button.focus();
    fireEvent.click(button);

    expect(screen.getByText("1 of 2 modules read (50%)")).toBeInTheDocument();
    expect(screen.getByText("You've marked this as read.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Marked as read.");
    expect(JSON.parse(window.localStorage.getItem(READ_PROGRESS_STORAGE_KEY)!)).toContain(
      "navigating-conflict",
    );
    // The same button is relabelled, so keyboard focus isn't lost.
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(undo).toHaveFocus();

    fireEvent.click(undo);
    expect(screen.getByText("0 of 2 modules read (0%)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeInTheDocument();
  });
});
