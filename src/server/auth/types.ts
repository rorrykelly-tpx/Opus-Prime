import "server-only";

import type { User } from "@/types";

/** One choice on the sign-in page: a test user for the dev provider, the company login for SSO. */
export interface SignInOption {
  id: string;
  label: string;
  detail?: string;
}

/**
 * Anything that can say who is making the current request, and start or end
 * a session. The dev provider implements this today; an SSO provider will
 * implement it later without callers or the UI changing.
 */
export interface AuthProvider {
  /** Resolve the signed-in user, or `null` if nobody is signed in. */
  getUser(): Promise<User | null>;
  signInOptions(): SignInOption[];
  /** Start a session for the chosen option. An SSO provider redirects to the identity provider instead of returning. */
  signIn(optionId: string): Promise<void>;
  signOut(): Promise<void>;
}
