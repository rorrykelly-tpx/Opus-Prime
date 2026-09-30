import { useSyncExternalStore } from "react";
import { z } from "zod";

// Phase 1 keeps "Mark as read" in this browser only, until there is a database (spec 0001, §8).
export const READ_PROGRESS_STORAGE_KEY = "learning-pathways:read-modules:v1";

const CHANGE_EVENT = "learning-pathways:read-modules-change";
const storedSchema = z.array(z.string());
const EMPTY: ReadonlySet<string> = new Set();

// Kept in memory as well so marking still works when storage is blocked (e.g. private browsing).
let current: ReadonlySet<string> | null = null;

function load(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(READ_PROGRESS_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    return parsed.success ? new Set(parsed.data) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist(slugs: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(READ_PROGRESS_STORAGE_KEY, JSON.stringify([...slugs]));
  } catch {
    // Storage is unavailable; progress lasts for this page session only.
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    // Another tab changed progress, or storage was cleared.
    if (event.key === READ_PROGRESS_STORAGE_KEY || event.key === null) {
      current = load();
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function getReadModules(): ReadonlySet<string> {
  current ??= load();
  return current;
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

export function setModuleRead(slug: string, read: boolean) {
  const next = new Set(getReadModules());
  if (read) next.add(slug);
  else next.delete(slug);
  current = next;
  persist(next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Slugs of the modules marked as read in this browser. Empty during server rendering. */
export function useReadModules(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getReadModules, getServerSnapshot);
}
