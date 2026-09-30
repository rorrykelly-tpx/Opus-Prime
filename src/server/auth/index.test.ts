import { DEV_USER } from "./dev-provider";
import { createAuth, getCurrentUser, requireUser, UnauthenticatedError } from "./index";

describe("auth", () => {
  it("resolves the dev user by default", async () => {
    await expect(getCurrentUser()).resolves.toEqual(DEV_USER);
    await expect(requireUser()).resolves.toEqual(DEV_USER);
  });

  it("requireUser throws when nobody is signed in", async () => {
    const auth = createAuth({ getUser: async () => null });

    await expect(auth.getCurrentUser()).resolves.toBeNull();
    await expect(auth.requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
