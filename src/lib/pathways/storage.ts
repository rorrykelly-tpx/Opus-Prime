import { z } from "zod";

import type { Certificate, Evidence, EvidenceTags, Profile } from "@/types/pathways";

import {
  certificateSchema,
  evidenceSchema,
  frameworkOverrideSchema,
  profileSchema,
  type FrameworkOverride,
} from "./schemas";

// Browser storage for a consultant's pathway. Until there's a database, everything lives in
// this browser, keyed by the signed-in user's id so two people on one machine don't mix data.
// Reads validate what they find, because storage can be edited or left over from old versions.

export function blankProfile(): Profile {
  return {
    role: null,
    grade: null,
    read: {},
    quiz: {},
    shareWith: [],
    shareNames: {},
    plan: null,
    tracker: "tree",
    milestone: 0,
    knowledge: {},
  };
}

export function emptyTags(): EvidenceTags {
  return { skills: [], behaviours: [], impacts: [], consulting: [] };
}

const userKey = (userId: string, name: string) => `lp:${userId}:${name}`;
const THEME_KEY = "lp-theme";
const FRAMEWORK_OVERRIDE_KEY = "lp-fw-override";
const DEMO_KEY = "lp-demo";

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Returns false when storage is full or blocked, so callers can tell the consultant. */
function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do: storage is unavailable.
  }
}

/** Parses each item on its own, dropping any that are invalid rather than losing the list. */
function parseList<T>(schema: z.ZodType<T>, raw: unknown): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function loadProfile(userId: string): Profile {
  const raw = read(userKey(userId, "profile"));
  const parsed = profileSchema.safeParse(raw ?? {});
  return parsed.success ? { ...blankProfile(), ...parsed.data } : blankProfile();
}

export function saveProfile(userId: string, profile: Profile): boolean {
  return write(userKey(userId, "profile"), { ...profile, updatedAt: Date.now() });
}

export function loadEvidence(userId: string): Evidence[] {
  return parseList(evidenceSchema, read(userKey(userId, "evidence")));
}

export function saveEvidence(userId: string, evidence: Evidence[]): boolean {
  return write(userKey(userId, "evidence"), evidence);
}

export function loadCertificates(userId: string): Certificate[] {
  return parseList(certificateSchema, read(userKey(userId, "certs")));
}

export function saveCertificates(userId: string, certs: Certificate[]): boolean {
  return write(userKey(userId, "certs"), certs);
}

const certFileKey = (userId: string, id: string) => userKey(userId, `certfile:${id}`);

export function loadCertificateFile(userId: string, id: string): string | null {
  const raw = read(certFileKey(userId, id));
  return typeof raw === "string" ? raw : null;
}

export function saveCertificateFile(userId: string, id: string, dataUrl: string): boolean {
  return write(certFileKey(userId, id), dataUrl);
}

export function removeCertificateFile(userId: string, id: string) {
  remove(certFileKey(userId, id));
}

export type Theme = "light" | "dark";

export function saveTheme(theme: Theme) {
  write(THEME_KEY, theme);
}

/** Runs before the page paints (see the root layout), so it must stay dependency-free. */
export const THEME_INIT_SCRIPT = `try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)}));if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export function loadFrameworkOverride(): FrameworkOverride | null {
  const raw = read(FRAMEWORK_OVERRIDE_KEY);
  if (raw === null) return null;
  const parsed = frameworkOverrideSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function saveFrameworkOverride(override: FrameworkOverride): boolean {
  return write(FRAMEWORK_OVERRIDE_KEY, override);
}

export function clearFrameworkOverride() {
  remove(FRAMEWORK_OVERRIDE_KEY);
}

// The demo lasts for the browser tab, like the prototype's presentation mode.
export function isDemoOn(): boolean {
  try {
    return window.sessionStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemoOn(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(DEMO_KEY, "1");
    else window.sessionStorage.removeItem(DEMO_KEY);
  } catch {
    // Storage is unavailable; the demo just won't survive a reload.
  }
}
