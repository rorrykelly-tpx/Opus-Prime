import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { PathwaysProvider } from "@/components/features/pathways/PathwaysProvider";

import { framework, knowledge, resources } from "./pathways-data";

export const testUser = { id: "test-user", email: "test.user@example.com", name: "Test User" };

/** Renders pathway UI inside the provider, with the committed framework data. */
export function renderPathways(ui: ReactNode) {
  return render(
    <PathwaysProvider
      user={testUser}
      framework={framework}
      resources={resources}
      knowledge={knowledge}
    >
      {ui}
    </PathwaysProvider>,
  );
}
