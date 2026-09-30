import { knowledge, profileWith, framework, role, seededRandom } from "@tests/pathways-data";

import {
  isKnowledgeGap,
  knowledgeGaps,
  knowledgeLabel,
  knowledgeOf,
  roleTopics,
  subjectQuestions,
  topicFor,
} from "./knowledge";

describe("subject knowledge", () => {
  it("maps skills to topics, consulting modules to one topic and behaviours to none", () => {
    expect(topicFor("skill", "Testing (data)")).toBe("qa-testing");
    expect(topicFor("skill", "Data modelling, cleansing and enrichment")).toBe("data-modelling");
    expect(topicFor("consulting", "Navigating conflict")).toBe("consulting");
    expect(topicFor("behaviour", "Owning and delivering")).toBeNull();
  });

  it("gives every skill in every role a topic that has questions and courses", () => {
    const ids = new Set(knowledge.topics.map((t) => t.id));
    for (const r of framework.roles) {
      for (const t of roleTopics(r)) expect(ids.has(t), `${r.role}: ${t}`).toBe(true);
    }
  });

  it("treats a score under 60% without a certificate as a gap", () => {
    const profile = profileWith({ knowledge: { "qa-testing": 0.4, "data-modelling": 0.8 } });
    const certs = [
      { id: "c1", title: "x", provider: "", date: "", url: "", topic: "data-engineering" },
    ];
    expect(isKnowledgeGap(knowledgeOf("qa-testing", profile, certs))).toBe(true);
    expect(isKnowledgeGap(knowledgeOf("data-modelling", profile, certs))).toBe(false);
    expect(isKnowledgeGap(knowledgeOf("data-engineering", profile, certs))).toBe(false);
    expect(knowledgeGaps(role("Data Engineer"), profile, certs)).toContain("data-architecture");
    expect(knowledgeLabel(knowledgeOf("data-engineering", profile, certs))).toBe("Certificate");
    expect(knowledgeLabel(knowledgeOf("qa-testing", profile, certs))).toBe("40%");
    expect(knowledgeLabel(knowledgeOf("security", profile, certs))).toBe("Not tested yet");
  });

  it("asks five subject questions with shuffled options and the right answer tracked", () => {
    const qs = subjectQuestions(knowledge, "qa-testing", seededRandom(3));
    const bank = knowledge.topics.find((t) => t.id === "qa-testing")!.questions;
    expect(qs).toHaveLength(5);
    for (const q of qs) {
      const original = bank.find((b) => b.q === q.q)!;
      expect(q.options[q.correct]).toBe(original.options[original.correct]);
      expect([...q.options].sort()).toEqual([...original.options].sort());
    }
  });
});
