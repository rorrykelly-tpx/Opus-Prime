import "server-only";

import { env } from "@/lib/env";
import type { User } from "@/types";

import { createDevAuthProvider } from "./dev-provider";
import type { AuthProvider } from "./types";

export type { AuthProvider, SignInOption } from "./types";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "UnauthenticatedError";
  }
}

export function createAuth(provider: AuthProvider) {
  return {
    getCurrentUser(): Promise<User | null> {
      return provider.getUser();
    },
    async requireUser(): Promise<User> {
      const user = await provider.getUser();
      if (!user) throw new UnauthenticatedError();
      return user;
    },
    signInOptions: () => provider.signInOptions(),
    signIn: (optionId: string) => provider.signIn(optionId),
    signOut: () => provider.signOut(),
  };
}

// Register the SSO provider here when it's added, and extend AUTH_PROVIDER in env.ts.
const providers: Record<typeof env.AUTH_PROVIDER, () => AuthProvider> = {
  dev: () => createDevAuthProvider(),
};

export const { getCurrentUser, requireUser, signInOptions, signIn, signOut } = createAuth(
  providers[env.AUTH_PROVIDER](),
);
