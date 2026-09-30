import { createAuth, UnauthenticatedError } from "./index";
import type { AuthProvider } from "./types";

const user = { id: "u1", email: "u1@example.com", name: "User One" };

function fakeProvider(signedIn: typeof user | null): AuthProvider {
  return {
    getUser: async () => signedIn,
    signInOptions: () => [],
    signIn: async () => {},
    signOut: async () => {},
  };
}

describe("auth", () => {
  it("returns the signed-in user", async () => {
    const auth = createAuth(fakeProvider(user));

    await expect(auth.getCurrentUser()).resolves.toEqual(user);
    await expect(auth.requireUser()).resolves.toEqual(user);
  });

  it("requireUser throws when nobody is signed in", async () => {
    const auth = createAuth(fakeProvider(null));

    await expect(auth.getCurrentUser()).resolves.toBeNull();
    await expect(auth.requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
