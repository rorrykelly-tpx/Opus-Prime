import { evidenceWith } from "@tests/pathways-data";

import * as storage from "./storage";

describe("browser storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("keeps each user's data apart", () => {
    storage.saveProfile("alice", { ...storage.blankProfile(), role: "Data Engineer", grade: "9" });
    expect(storage.loadProfile("alice").role).toBe("Data Engineer");
    expect(storage.loadProfile("bob").role).toBeNull();
  });

  it("survives corrupt or out-of-date data", () => {
    window.localStorage.setItem("lp:alice:profile", "{not json");
    expect(storage.loadProfile("alice")).toEqual(storage.blankProfile());
    window.localStorage.setItem(
      "lp:alice:profile",
      JSON.stringify({
        role: "Data Engineer",
        grade: "99",
        tracker: "rocket",
        read: { "s:x": true },
      }),
    );
    const p = storage.loadProfile("alice");
    expect(p).toMatchObject({
      role: "Data Engineer",
      grade: null,
      tracker: "tree",
      read: { "s:x": true },
    });
  });

  it("drops invalid evidence rather than the whole list", () => {
    window.localStorage.setItem(
      "lp:alice:evidence",
      JSON.stringify([evidenceWith({}), { id: "" }, "nonsense", evidenceWith({})]),
    );
    expect(storage.loadEvidence("alice")).toHaveLength(2);
  });
});
