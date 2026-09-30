import { evidenceWith, framework } from "@tests/pathways-data";

import { createAppStore } from "./app-store";
import * as storage from "./storage";

describe("app store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    // jsdom has no canvas; the demo's sample certificates just have no image.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  it("isn't ready on the server, and loads saved data on the client", () => {
    storage.saveProfile("alice", { ...storage.blankProfile(), role: "Data Engineer", grade: "9" });
    const store = createAppStore("alice", framework);
    expect(store.getServerSnapshot().ready).toBe(false);
    expect(store.getSnapshot()).toMatchObject({
      ready: true,
      demo: false,
      profile: { role: "Data Engineer" },
    });
  });

  it("forgets a saved role that isn't in the framework any more", () => {
    storage.saveProfile("alice", { ...storage.blankProfile(), role: "Astronaut", grade: "9" });
    expect(createAppStore("alice", framework).getSnapshot().profile.role).toBeNull();
  });

  it("saves profile changes and evidence for the user", () => {
    const store = createAppStore("alice", framework);
    store.getSnapshot();
    store.updateProfile((p) => ({
      ...p,
      role: "Data Engineer",
      grade: "9",
      read: { "s:Testing (data)": true },
    }));
    store.saveEvidence(evidenceWith({ impacts: ["Client delivery"] }));
    const reloaded = createAppStore("alice", framework).getSnapshot();
    expect(reloaded.profile.read).toEqual({ "s:Testing (data)": true });
    expect(reloaded.evidence).toHaveLength(1);
  });

  it("shows Julia in the demo without saving anything, and restores the real data after", () => {
    const store = createAppStore("alice", framework);
    store.getSnapshot();
    store.updateProfile((p) => ({ ...p, role: "Content Designer", grade: "8" }));

    const julia = store.enterDemo();
    expect(julia).toMatchObject({ role: "Data Engineer", grade: "9" });
    expect(store.getSnapshot()).toMatchObject({ demo: true });
    expect(store.getSnapshot().evidence).toHaveLength(9);
    store.updateProfile((p) => ({ ...p, tracker: "track" }));
    store.saveEvidence(evidenceWith({}));
    expect(storage.loadProfile("alice")).toMatchObject({
      role: "Content Designer",
      tracker: "tree",
    });
    expect(storage.loadEvidence("alice")).toHaveLength(0);

    const back = store.exitDemo();
    expect(back).toMatchObject({ role: "Content Designer", grade: "8" });
    expect(store.getSnapshot()).toMatchObject({ demo: false, evidence: [] });
  });

  it("keeps the demo on across a reload in the same tab", () => {
    createAppStore("alice", framework).enterDemo();
    expect(createAppStore("alice", framework).getSnapshot()).toMatchObject({
      demo: true,
      profile: { role: "Data Engineer" },
    });
  });

  it("celebrates a milestone once", () => {
    const store = createAppStore("alice", framework);
    store.getSnapshot();
    store.updateProfile((p) => ({ ...p, role: "Delivery Manager", grade: "12" }));
    // Each module has three steps, so reading all 30 modules is a third of the way: past 25%.
    store.updateProfile((p) => ({
      ...p,
      read: Object.fromEntries(
        [
          ...framework.roles
            .find((r) => r.role === "Delivery Manager")!
            .skills.map((s) => `s:${s.name}`),
          ...framework.behaviours.map((b) => `b:${b.name}`),
          ...framework.consultingPillars.flatMap((c) => c.modules.map((m) => `c:${m.name}`)),
        ].map((k) => [k, true]),
      ),
    }));
    expect(store.getSnapshot().toast).toBe("🐨 Milestone reached: First branch!");
    expect(store.getSnapshot().profile.milestone).toBe(25);
  });
});
