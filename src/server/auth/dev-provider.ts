import "server-only";

import { cookies } from "next/headers";

import type { User } from "@/types";

import type { AuthProvider } from "./types";

// `id` of the first user matches the old fixed dev user, so progress already
// saved in the browser against it is kept.
export const DEV_USERS: readonly User[] = [
  { id: "dev-user", email: "dev.user@example.com", name: "Dev User" },
  { id: "dev-user-2", email: "sam.taylor@example.com", name: "Sam Taylor" },
  { id: "dev-user-3", email: "priya.shah@example.com", name: "Priya Shah" },
];

export const DEV_SESSION_COOKIE = "dev-session";

/** The subset of Next's cookie store the dev provider uses, so tests can pass a fake. */
export interface CookieJar {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: Record<string, unknown>): unknown;
  delete(name: string): unknown;
}

// Stand-in until SSO lands: pick a test user on the sign-in page and their id
// is kept in a plain cookie. It isn't signed, so anyone can be any test user.
// That's fine for fake accounts and is why this must not hold real data.
export function createDevAuthProvider(
  getCookies: () => Promise<CookieJar> = cookies,
): AuthProvider {
  return {
    async getUser() {
      const id = (await getCookies()).get(DEV_SESSION_COOKIE)?.value;
      return DEV_USERS.find((user) => user.id === id) ?? null;
    },

    signInOptions() {
      return DEV_USERS.map((user) => ({ id: user.id, label: user.name, detail: user.email }));
    },

    async signIn(optionId) {
      if (!DEV_USERS.some((user) => user.id === optionId)) {
        throw new Error(`Unknown test user: ${optionId}`);
      }
      (await getCookies()).set(DEV_SESSION_COOKIE, optionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    },

    async signOut() {
      (await getCookies()).delete(DEV_SESSION_COOKIE);
    },
  };
}
