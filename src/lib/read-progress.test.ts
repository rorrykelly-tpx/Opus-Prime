import { READ_PROGRESS_STORAGE_KEY } from "./read-progress";

// Re-importing gives a fresh in-memory cache, like a page reload.
async function freshStore() {
  vi.resetModules();
  return import("./read-progress");
}

describe("read progress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty", async () => {
    const { getReadModules } = await freshStore();
    expect(getReadModules().size).toBe(0);
  });

  it("persists read modules across reloads", async () => {
    const first = await freshStore();
    first.setModuleRead("agile-and-lean-knowledge", true);
    first.setModuleRead("navigating-conflict", true);

    const second = await freshStore();
    expect([...second.getReadModules()].sort()).toEqual([
      "agile-and-lean-knowledge",
      "navigating-conflict",
    ]);
  });

  it("undoes a read module", async () => {
    const store = await freshStore();
    store.setModuleRead("agile-and-lean-knowledge", true);
    store.setModuleRead("agile-and-lean-knowledge", false);

    const reloaded = await freshStore();
    expect(reloaded.getReadModules().has("agile-and-lean-knowledge")).toBe(false);
  });

  it("ignores corrupt stored data", async () => {
    window.localStorage.setItem(READ_PROGRESS_STORAGE_KEY, "{not json");
    const { getReadModules } = await freshStore();
    expect(getReadModules().size).toBe(0);
  });

  it("ignores stored data of the wrong shape", async () => {
    window.localStorage.setItem(READ_PROGRESS_STORAGE_KEY, JSON.stringify({ a: 1 }));
    const { getReadModules } = await freshStore();
    expect(getReadModules().size).toBe(0);
  });

  it("keeps working in memory when storage is blocked", async () => {
    const store = await freshStore();
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    store.setModuleRead("navigating-conflict", true);
    expect(store.getReadModules().has("navigating-conflict")).toBe(true);
    setItem.mockRestore();
  });
});
