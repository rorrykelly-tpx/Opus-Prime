import type {
  Certificate,
  Course,
  KnowledgeCatalogue,
  ModuleKind,
  Profile,
  Role,
  SubjectQuestion,
} from "@/types/pathways";

import { shuffle } from "./framework";

// Subject knowledge: which topic each skill draws on, the subject quiz and knowledge gaps.

/** A skill's topic is the first rule its name matches. Order matters. */
const TOPIC_RULES: [RegExp, string][] = [
  [/^emerging/i, "emerging-tech"],
  [/^capability building|^collaboration \(/i, "capability"],
  [/^accessibility/i, "accessibility"],
  [/^data governance|^data management/i, "data-governance"],
  [/data modelling|data model/i, "data-modelling"],
  [/data integration design|metadata|data life cycle|data standards/i, "data-architecture"],
  [/data analysis|analysis and synthesis/i, "data-analysis"],
  [/data development|data engineering|programming and build \(data/i, "data-engineering"],
  [
    /^testing \(data\)|^functional testing|^automation and testing|^non-functional|^test analysis|^technical breadth \(testing\)|^communication \(testing\)/i,
    "qa-testing",
  ],
  [
    /^customer service|^user focus \(cloud\)|^asset|^continual service|^service focus|^service reporting|^service management|^problem management \(tech\)/i,
    "service-management",
  ],
  [
    /agile|momentum|making a process|lifecycle perspective \(delivery\)|problem management \(delivery\)|team collaboration|strategic thinking and planning/i,
    "agile-delivery",
  ],
  [/financial/i, "project-finance"],
  [
    /product ownership|outcomes and benefits|working within constraints|strategic ownership|life cycle management|value release/i,
    "product",
  ],
  [
    /business analysis|business model|process improvement|context, problem|digital and data systems|requirements|user-centred service integration/i,
    "business-analysis",
  ],
  [/impact analysis/i, "impact-evaluation"],
  [/design research/i, "user-research"],
  [/content design/i, "content-design"],
  [/org design/i, "org-design"],
  [/interaction design/i, "interaction-design"],
  [/service design|design strategy/i, "service-design"],
  [/security/i, "security"],
  [/cloud|infrastructure|availability|troubleshooting/i, "cloud-infra"],
  [
    /enterprise|governance and assurance|strategic thinking|solution architecture|lifecycle perspective \(tech\)/i,
    "architecture-strategy",
  ],
  [
    /programming|coding|prototyping|modern standards|systems design|systems integration|systems analysis|technical specialism|user focus/i,
    "software-engineering",
  ],
];

/** Consulting modules share one topic; behaviours have none. */
export const CONSULTING_TOPIC = "consulting";

/** A subject quiz score under this, with no certificate, is a knowledge gap. */
export const KNOWLEDGE_PASS = 0.6;

export function topicFor(kind: ModuleKind, name: string): string | null {
  if (kind === "consulting") return CONSULTING_TOPIC;
  if (kind === "behaviour") return null;
  return TOPIC_RULES.find(([re]) => re.test(name))?.[1] ?? null;
}

export function roleTopics(role: Role): string[] {
  const topics = role.skills.map((s) => topicFor("skill", s.name)).filter((t) => t !== null);
  return [...new Set(topics), CONSULTING_TOPIC];
}

export function topicName(catalogue: KnowledgeCatalogue, topic: string): string {
  return catalogue.topics.find((t) => t.id === topic)?.name ?? topic;
}

export function coursesFor(catalogue: KnowledgeCatalogue, topic: string): Course[] {
  return catalogue.courses.find((c) => c.topic === topic)?.courses ?? [];
}

/** Five questions from the topic's bank, with the options shuffled. */
export function subjectQuestions(
  catalogue: KnowledgeCatalogue,
  topic: string,
  random: () => number = Math.random,
): SubjectQuestion[] {
  const bank = catalogue.topics.find((t) => t.id === topic)?.questions ?? [];
  return shuffle(bank, random)
    .slice(0, 5)
    .map((q) => {
      const order = shuffle(
        q.options.map((_, i) => i),
        random,
      );
      return {
        q: q.q,
        options: order.map((i) => q.options[i]!),
        correct: order.indexOf(q.correct),
        explain: q.explain,
      };
    });
}

export interface TopicKnowledge {
  /** Best subject quiz score, or null if not tested. */
  score: number | null;
  /** Whether a certificate covers the topic. */
  cert: boolean;
}

export function knowledgeOf(topic: string, profile: Profile, certs: Certificate[]): TopicKnowledge {
  return {
    score: profile.knowledge[topic] ?? null,
    cert: certs.some((c) => c.topic === topic),
  };
}

export function isKnowledgeGap(k: TopicKnowledge): boolean {
  return !k.cert && (k.score === null || k.score < KNOWLEDGE_PASS);
}

export function knowledgeGaps(role: Role, profile: Profile, certs: Certificate[]): string[] {
  return roleTopics(role).filter((t) => isKnowledgeGap(knowledgeOf(t, profile, certs)));
}

export function knowledgeLabel(k: TopicKnowledge): string {
  if (k.cert) return "Certificate";
  return k.score === null ? "Not tested yet" : `${Math.round(k.score * 100)}%`;
}
