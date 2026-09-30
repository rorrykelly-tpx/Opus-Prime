import { z } from "zod";

import type {
  Certificate,
  Evidence,
  Framework,
  KnowledgeCatalogue,
  LearningResource,
  Profile,
} from "@/types/pathways";

import { BEHAVIOUR_BANDS, CONSULTING_STAGES, GRADES, PROFICIENCY_LEVELS } from "./framework";

// Validation for everything the app reads from outside its own code: committed data files,
// uploaded framework spreadsheets and what's stored in the browser.

const proficiencyLevel = z.enum(PROFICIENCY_LEVELS);
const grade = z.enum(GRADES);
const band = z.enum(BEHAVIOUR_BANDS);
const descriptors = z.array(z.string().min(1));

export const skillSchema = z.object({
  name: z.string().min(1),
  definition: z.string(),
  levels: z.record(proficiencyLevel, descriptors),
});

export const roleSchema = z.object({
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
});

export const behaviourSchema = z.object({
  name: z.string().min(1),
  definition: z.string(),
  bands: z.record(band, descriptors),
});

export const impactSchema = z.object({ name: z.string().min(1), definition: z.string() });

export const frameworkSchema = z.object({
  version: z.string().min(1),
  proficiencyLevels: z.array(proficiencyLevel),
  skills: z.array(skillSchema),
  roles: z.array(roleSchema),
  behaviours: z.array(behaviourSchema),
  impacts: z.array(impactSchema),
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

/** Parts of the framework replaced by uploaded spreadsheets (a preview in this browser only). */
export const frameworkOverrideSchema = z.object({
  skills: z.array(skillSchema).optional(),
  roles: z.array(roleSchema).optional(),
  behaviours: z.array(behaviourSchema).optional(),
  impacts: z.array(impactSchema).optional(),
});
export type FrameworkOverride = z.infer<typeof frameworkOverrideSchema>;

export const resourcesSchema = z.object({
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

export const knowledgeSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      questions: z
        .array(
          z
            .object({
              q: z.string().min(1),
              options: z.array(z.string().min(1)).min(2),
              correct: z.number().int().min(0),
              explain: z.string(),
            })
            .refine((q) => q.correct < q.options.length, "correct must index an option"),
        )
        .min(1),
    }),
  ),
  courses: z.array(
    z.object({
      topic: z.string().min(1),
      courses: z.array(
        z.object({
          title: z.string().min(1),
          provider: z.string().min(1),
          url: z.url({ protocol: /^https?$/ }),
          cost: z.string(),
          cert: z.boolean(),
        }),
      ),
    }),
  ),
}) satisfies z.ZodType<KnowledgeCatalogue>;

const score = z.number().min(0).max(1);

// Stored data is parsed leniently (`catch`) so one bad field doesn't wipe a consultant's profile.
export const profileSchema = z.object({
  role: z.string().nullable().catch(null),
  grade: grade.nullable().catch(null),
  read: z.record(z.string(), z.boolean()).catch({}),
  quiz: z
    .record(
      z.string(),
      z.object({ know: score.optional(), subj: score.optional(), at: z.number().optional() }),
    )
    .catch({}),
  shareWith: z.array(z.string()).catch([]),
  shareNames: z.record(z.string(), z.string()).catch({}),
  plan: z
    .object({
      intro: z.string(),
      actions: z.array(z.object({ title: z.string(), detail: z.string(), area: z.string() })),
      at: z.number(),
    })
    .nullable()
    .catch(null),
  tracker: z.enum(["tree", "track"]).catch("tree"),
  milestone: z.number().catch(0),
  knowledge: z.record(z.string(), score).catch({}),
  updatedAt: z.number().optional().catch(undefined),
}) satisfies z.ZodType<Profile>;

export const evidenceTagsSchema = z.object({
  skills: z
    .array(z.object({ name: z.string(), level: proficiencyLevel, why: z.string().catch("") }))
    .catch([]),
  behaviours: z.array(z.object({ name: z.string(), band, why: z.string().catch("") })).catch([]),
  impacts: z.array(z.string()).catch([]),
  consulting: z.array(z.string()).catch([]),
});

export const evidenceSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  date: z.string(),
  text: z.string().catch(""),
  summary: z.string().catch(""),
  files: z.array(z.string()).catch([]),
  tags: evidenceTagsSchema,
  createdAt: z.number().catch(0),
  source: z.object({ file: z.string(), sheet: z.string(), row: z.number() }).optional(),
}) satisfies z.ZodType<Evidence>;

export const certificateSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  provider: z.string().catch(""),
  date: z.string().catch(""),
  topic: z.string(),
  url: z.string().catch(""),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  hasFile: z.boolean().optional(),
}) satisfies z.ZodType<Certificate>;
