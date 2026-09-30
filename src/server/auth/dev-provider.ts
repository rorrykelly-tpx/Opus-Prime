import "server-only";

import type { User } from "@/types";

import type { AuthProvider } from "./types";

export const DEV_USER: User = {
  id: "dev-user",
  email: "dev.user@example.com",
  name: "Dev User",
};

// Stand-in until SSO lands: every request is treated as the same user, so
// per-user features can be built and demoed without a login flow.
export const devAuthProvider: AuthProvider = {
  async getUser() {
    return DEV_USER;
  },
};
