import type { ActiveFramework, Certificate, Evidence, Framework, Profile } from "@/types/pathways";

import { moduleProgress, summariseEvidence } from "./assessment";
import { demoData, drawDemoCertificate } from "./demo";
import { findRoleByName, slugify } from "./framework";
import { buildPathway } from "./model";
import type { FrameworkOverride } from "./schemas";
import * as storage from "./storage";

// The consultant's pathway data in the browser: profile, evidence and certificates, the demo,
// the framework preview and toasts. It's an external store (read with useSyncExternalStore),
// so browser storage is only read on the client and hydration always matches the server.

export const MILESTONES = [25, 50, 75, 100] as const;

export const TRACKERS = {
  tree: {
    label: "Tree climb",
    names: ["First branch", "Halfway up", "Into the leaves", "Top of the tree"],
    start: "At the roots",
    emoji: "🐨",
  },
  track: {
    label: "Race track",
    names: ["First marker", "Halfway", "Final stretch", "Finish line"],
    start: "On the start line",
    emoji: "🏁",
  },
} as const;

export const STORAGE_FAILED =
  "Couldn't save in this browser. Storage may be full or blocked. Try freeing some space.";

export interface AppSnapshot {
  /** False until browser storage has been read. */
  ready: boolean;
  demo: boolean;
  profile: Profile;
  evidence: Evidence[];
  certs: Certificate[];
  override: FrameworkOverride | null;
  toast: string;
}

interface Data {
  profile: Profile;
  evidence: Evidence[];
  certs: Certificate[];
}

export function activeFramework(
  builtin: Framework,
  override: FrameworkOverride | null,
): ActiveFramework {
  return { ...builtin, ...(override ?? {}), overridden: override !== null };
}

export type AppStore = ReturnType<typeof createAppStore>;

export function createAppStore(userId: string, builtin: Framework) {
  const initial: AppSnapshot = {
    ready: false,
    demo: false,
    profile: storage.blankProfile(),
    evidence: [],
    certs: [],
    override: null,
    toast: "",
  };
  let snapshot = initial;
  let loaded = false;
  let real: Data | null = null;
  let demoFiles = new Map<string, string>();
  let animated = false;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingImport: File | null = null;
  const listeners = new Set<() => void>();

  function set(patch: Partial<AppSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((l) => l());
  }

  function toast(message: string) {
    set({ toast: message });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: "" }), 2600);
  }

  function readReal(): Data {
    return {
      profile: storage.loadProfile(userId),
      evidence: storage.loadEvidence(userId),
      certs: storage.loadCertificates(userId),
    };
  }

  function demoPatch(): Partial<AppSnapshot> {
    const data = demoData();
    // next/font gives the heading font a generated family name, so read it from the page.
    const headingFont =
      getComputedStyle(document.body).getPropertyValue("--font-oswald").trim() || "Oswald";
    demoFiles = new Map(data.certs.map((c) => [c.id, drawDemoCertificate(c, headingFont)]));
    animated = false;
    return { demo: true, ...data };
  }

  function load() {
    loaded = true;
    const override = storage.loadFrameworkOverride();
    const data = readReal();
    // A role that no longer exists (after a framework update) sends the consultant back to choose.
    if (
      data.profile.role &&
      !findRoleByName(activeFramework(builtin, override), data.profile.role)
    ) {
      data.profile = { ...data.profile, role: null, grade: null };
    }
    let patch: Partial<AppSnapshot> = { ready: true, override, ...data };
    if (storage.isDemoOn()) {
      real = data;
      patch = { ...patch, ...demoPatch() };
    }
    snapshot = { ...snapshot, ...patch };
  }

  /** Celebrates each progress milestone once, and lowers the mark if progress drops. */
  function checkMilestone() {
    const { profile, evidence, override } = snapshot;
    if (!profile.role || !profile.grade) return;
    const fw = activeFramework(builtin, override);
    const pathway = buildPathway(fw, slugify(profile.role), profile.grade);
    if (!pathway) return;
    const { pct } = moduleProgress(pathway.modules, profile, summariseEvidence(evidence));
    const index = MILESTONES.filter((m) => pct >= m).length - 1;
    const reached = index >= 0 ? MILESTONES[index]! : 0;
    if (reached === profile.milestone) return;
    if (reached > profile.milestone) {
      const tracker = TRACKERS[profile.tracker];
      toast(`${tracker.emoji} Milestone reached: ${tracker.names[index]}!`);
    }
    writeProfile({ ...profile, milestone: reached });
  }

  function writeProfile(profile: Profile) {
    set({ profile });
    if (!snapshot.demo && !storage.saveProfile(userId, profile)) toast(STORAGE_FAILED);
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): AppSnapshot {
      if (!loaded) load();
      return snapshot;
    },
    getServerSnapshot(): AppSnapshot {
      return initial;
    },

    toast,

    updateProfile(change: (p: Profile) => Profile) {
      writeProfile(change(snapshot.profile));
      checkMilestone();
    },

    saveEvidence(e: Evidence): boolean {
      const exists = snapshot.evidence.some((x) => x.id === e.id);
      const evidence = exists
        ? snapshot.evidence.map((x) => (x.id === e.id ? e : x))
        : [...snapshot.evidence, e];
      set({ evidence });
      let ok = true;
      if (!snapshot.demo) {
        ok = storage.saveEvidence(userId, evidence);
        if (!ok) toast(STORAGE_FAILED);
      }
      checkMilestone();
      return ok;
    },

    deleteEvidence(id: string) {
      const evidence = snapshot.evidence.filter((x) => x.id !== id);
      set({ evidence });
      if (!snapshot.demo) storage.saveEvidence(userId, evidence);
      checkMilestone();
    },

    /** Returns false if the browser couldn't store it (usually because the file is too big). */
    saveCertificate(cert: Certificate, dataUrl: string | null): boolean {
      const meta: Certificate = { ...cert, hasFile: !!dataUrl };
      const certs = snapshot.certs.some((c) => c.id === meta.id)
        ? snapshot.certs.map((c) => (c.id === meta.id ? meta : c))
        : [...snapshot.certs, meta];
      if (snapshot.demo) {
        if (dataUrl) demoFiles.set(meta.id, dataUrl);
      } else {
        if (dataUrl && !storage.saveCertificateFile(userId, meta.id, dataUrl)) return false;
        if (!storage.saveCertificates(userId, certs)) {
          storage.removeCertificateFile(userId, meta.id);
          return false;
        }
      }
      set({ certs });
      return true;
    },

    deleteCertificate(id: string) {
      const certs = snapshot.certs.filter((c) => c.id !== id);
      set({ certs });
      if (snapshot.demo) {
        demoFiles.delete(id);
        return;
      }
      storage.removeCertificateFile(userId, id);
      storage.saveCertificates(userId, certs);
    },

    certificateFile(cert: Certificate): string | null {
      return snapshot.demo
        ? (demoFiles.get(cert.id) ?? null)
        : storage.loadCertificateFile(userId, cert.id);
    },

    /** Switches to Julia's data. Returns her profile so the caller can show her pathway. */
    enterDemo(): Profile {
      if (!snapshot.demo) {
        real = { profile: snapshot.profile, evidence: snapshot.evidence, certs: snapshot.certs };
      }
      storage.setDemoOn(true);
      set(demoPatch());
      return snapshot.profile;
    },

    /** Back to the consultant's own data. Returns their profile. */
    exitDemo(): Profile {
      const data = real ?? readReal();
      real = null;
      demoFiles = new Map();
      storage.setDemoOn(false);
      set({ demo: false, ...data });
      return snapshot.profile;
    },

    saveFrameworkOverride(override: FrameworkOverride): boolean {
      if (!storage.saveFrameworkOverride(override)) return false;
      set({ override });
      return true;
    },

    resetFramework() {
      storage.clearFrameworkOverride();
      set({ override: null });
    },

    /** The tracker animates the first time the pathway is shown in a page load or demo. */
    shouldAnimatePathway(): boolean {
      return !animated;
    },
    markPathwayAnimated() {
      animated = true;
    },

    /** Hands a spreadsheet dropped on My year to the importer. */
    setPendingImport(file: File | null) {
      pendingImport = file;
    },
    peekPendingImport(): File | null {
      return pendingImport;
    },
    takePendingImport(): File | null {
      const file = pendingImport;
      pendingImport = null;
      return file;
    },
  };
}
