import "server-only";

import { z } from "zod";

import frameworkJson from "@/data/framework.json";
import resourcesJson from "@/data/resources.json";
import {
  BEHAVIOUR_BANDS,
  CONSULTING_STAGES,
  GRADES,
  PROFICIENCY_LEVELS,
  slugify,
} from "@/lib/pathways";
import type { Framework, LearningResource } from "@/types/pathways";

const proficiencyLevel = z.enum(PROFICIENCY_LEVELS);
const grade = z.enum(GRADES);
const descriptors = z.array(z.string().min(1));

const frameworkSchema = z.object({
  version: z.string().min(1),
  proficiencyLevels: z.array(proficiencyLevel),
  skills: z.array(
    z.object({
      name: z.string().min(1),
      definition: z.string(),
      levels: z.record(proficiencyLevel, descriptors),
    }),
  ),
  roles: z.array(
    z.object({
      capability: z.string().min(1),
      practice: z.string().min(1),
      role: z.string().min(1),
      grades: z.array(grade).min(1),
      skills: z.array(
        z.object({
          name: z.string().min(1),
          expected: z.partialRecord(grade, proficiencyLevel.nullable()),
        }),
      ),
    }),
  ),
  behaviours: z.array(
    z.object({
      name: z.string().min(1),
      definition: z.string(),
      bands: z.record(z.enum(BEHAVIOUR_BANDS), descriptors),
    }),
  ),
  impacts: z.array(z.object({ name: z.string().min(1), definition: z.string() })),
  consultingPillars: z.array(
    z.object({
      pillar: z.string().min(1),
      summary: z.string(),
      links: z.object({ impact: z.string(), behaviour: z.string() }),
      modules: z.array(
        z.object({
          name: z.string().min(1),
          stage: z.enum(CONSULTING_STAGES),
          foundation: z.boolean(),
        }),
      ),
    }),
  ),
}) satisfies z.ZodType<Framework>;

const resourcesSchema = z.object({
  resources: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      url: z.url({ protocol: /^https?$/ }),
      description: z.string(),
      format: z.enum(["website", "document", "presentation", "book", "course", "article"]),
      frameworkTags: z.array(z.string()),
    }),
  ),
}) satisfies z.ZodType<{ resources: LearningResource[] }>;

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

/**
 * Checks what the schema can't: cross references between items, and that the names used to
 * build URLs are unique once slugified.
 */
export function findFrameworkProblems(
  framework: Framework,
  resources: LearningResource[],
): string[] {
  const problems: string[] = [];
  const skillNames = new Set(framework.skills.map((s) => s.name));
  const behaviourNames = new Set(framework.behaviours.map((b) => b.name));
  const impactNames = new Set(framework.impacts.map((i) => i.name));
  const consultingNames = framework.consultingPillars.flatMap((p) => p.modules.map((m) => m.name));

  if (framework.proficiencyLevels.join() !== PROFICIENCY_LEVELS.join()) {
    problems.push(`Proficiency levels must be ${PROFICIENCY_LEVELS.join(", ")}, in that order`);
  }

  for (const role of framework.roles) {
    for (const skill of role.skills) {
      if (!skillNames.has(skill.name)) {
        problems.push(`Role "${role.role}" uses undefined skill "${skill.name}"`);
      }
    }
    for (const name of findDuplicates(role.skills.map((s) => s.name))) {
      problems.push(`Role "${role.role}" lists skill "${name}" more than once`);
    }
    for (const g of findDuplicates(role.grades)) {
      problems.push(`Role "${role.role}" lists grade ${g} more than once`);
    }
  }

  for (const pillar of framework.consultingPillars) {
    if (!behaviourNames.has(pillar.links.behaviour)) {
      problems.push(
        `Pillar "${pillar.pillar}" links to unknown behaviour "${pillar.links.behaviour}"`,
      );
    }
    if (!impactNames.has(pillar.links.impact)) {
      problems.push(`Pillar "${pillar.pillar}" links to unknown impact "${pillar.links.impact}"`);
    }
  }

  const moduleNames = [...skillNames, ...behaviourNames, ...consultingNames];
  for (const slug of findDuplicates(moduleNames.map(slugify))) {
    problems.push(`More than one module has the URL slug "${slug}"`);
  }
  if (moduleNames.some((name) => slugify(name) === "")) {
    problems.push("A module name has no letters or digits to build a URL from");
  }
  for (const slug of findDuplicates(framework.roles.map((r) => slugify(r.role)))) {
    problems.push(`More than one role has the URL slug "${slug}"`);
  }

  const knownTags = new Set(moduleNames);
  for (const id of findDuplicates(resources.map((r) => r.id))) {
    problems.push(`More than one resource has the id "${id}"`);
  }
  for (const resource of resources) {
    for (const tag of resource.frameworkTags) {
      if (!knownTags.has(tag)) {
        problems.push(`Resource "${resource.id}" is tagged with unknown framework item "${tag}"`);
      }
    }
  }

  return problems;
}

export interface FrameworkSource {
  framework: Framework;
  resources: LearningResource[];
}

/** Validates raw framework and resource data. Throws with every problem found. */
export function parseFrameworkSource(
  rawFramework: unknown,
  rawResources: unknown,
): FrameworkSource {
  const framework = frameworkSchema.parse(rawFramework);
  const { resources } = resourcesSchema.parse(rawResources);
  const problems = findFrameworkProblems(framework, resources);
  if (problems.length > 0) {
    throw new Error(`Invalid framework data:\n- ${problems.join("\n- ")}`);
  }
  return { framework, resources };
}

// Parsed once per server instance. framework.test.ts parses the committed data so CI catches
// bad data before it's deployed.
export const frameworkSource: FrameworkSource = parseFrameworkSource(frameworkJson, resourcesJson);
