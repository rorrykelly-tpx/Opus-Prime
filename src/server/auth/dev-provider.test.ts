import {
  createDevAuthProvider,
  DEV_SESSION_COOKIE,
  DEV_USERS,
  type CookieJar,
} from "./dev-provider";

function fakeCookies(): CookieJar {
  const store = new Map<string, string>();
  return {
    get: (name) => (store.has(name) ? { value: store.get(name)! } : undefined),
    set: (name, value) => store.set(name, value),
    delete: (name) => store.delete(name),
  };
}

describe("dev auth provider", () => {
  const [first, second] = DEV_USERS;
  let jar: CookieJar;
  let provider: ReturnType<typeof createDevAuthProvider>;

  beforeEach(() => {
    jar = fakeCookies();
    provider = createDevAuthProvider(async () => jar);
  });

  it("is signed out until a test user is chosen", async () => {
    await expect(provider.getUser()).resolves.toBeNull();
  });

  it("offers every test user as a sign-in option", () => {
    expect(provider.signInOptions().map((option) => option.id)).toEqual(DEV_USERS.map((u) => u.id));
  });

  it("signs in as the chosen user, can switch, and signs out", async () => {
    await provider.signIn(first!.id);
    await expect(provider.getUser()).resolves.toEqual(first);

    await provider.signIn(second!.id);
    await expect(provider.getUser()).resolves.toEqual(second);

    await provider.signOut();
    await expect(provider.getUser()).resolves.toBeNull();
  });

  it("rejects an unknown user and ignores a tampered cookie", async () => {
    await expect(provider.signIn("nobody")).rejects.toThrow("Unknown test user");

    jar.set(DEV_SESSION_COOKIE, "nobody", {});
    await expect(provider.getUser()).resolves.toBeNull();
  });
});
