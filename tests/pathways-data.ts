import frameworkJson from "@/data/framework.json";
import knowledgeJson from "@/data/knowledge.json";
import resourcesJson from "@/data/resources.json";
import { frameworkSchema, knowledgeSchema, resourcesSchema } from "@/lib/pathways/schemas";
import { blankProfile } from "@/lib/pathways/storage";
import type { Evidence, EvidenceTags, Profile } from "@/types/pathways";

// The committed data, parsed the same way the server parses it, for tests of the browser code.
export const framework = frameworkSchema.parse(frameworkJson);
export const resources = resourcesSchema.parse(resourcesJson).resources;
export const knowledge = knowledgeSchema.parse(knowledgeJson);

export function role(name: string) {
  const found = framework.roles.find((r) => r.role === name);
  if (!found) throw new Error(`No role called ${name}`);
  return found;
}

export function profileWith(patch: Partial<Profile> = {}): Profile {
  return { ...blankProfile(), ...patch };
}

let nextId = 0;
export function evidenceWith(tags: Partial<EvidenceTags>): Evidence {
  nextId++;
  return {
    id: `e${nextId}`,
    title: `Evidence ${nextId}`,
    date: "2026-05-01",
    text: "",
    summary: "",
    files: [],
    tags: { skills: [], behaviours: [], impacts: [], consulting: [], ...tags },
    createdAt: 0,
  };
}

/** A seeded random number generator, so shuffled quizzes are repeatable in tests. */
export function seededRandom(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
