import "server-only";

import type { User } from "@/types";

/**
 * Anything that can say who is making the current request. The dev provider
 * implements this today; an SSO provider will implement it later without
 * callers changing.
 */
export interface AuthProvider {
  /** Resolve the signed-in user, or `null` if nobody is signed in. */
  getUser(): Promise<User | null>;
}
