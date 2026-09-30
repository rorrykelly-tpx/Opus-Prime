"use client";

import { useEffect, useRef, useState } from "react";

import { QUIZ_PASS } from "@/lib/pathways/assessment";
import { subjectQuestions, topicName } from "@/lib/pathways/knowledge";
import {
  frameworkQuestions,
  QUIZ_KIND_LABEL,
  scoreAnswers,
  type QuizKind,
} from "@/lib/pathways/quiz";
import { cn } from "@/lib/utils";
import type { ModuleDetail, SubjectQuestion } from "@/types/pathways";

import { usePathways } from "./PathwaysProvider";

interface Quiz {
  kind: QuizKind;
  questions: SubjectQuestion[];
  i: number;
  answers: number[];
}

interface QuizPanelProps {
  mod: ModuleDetail;
  /** The subject knowledge topic for this module, if it has one. */
  topic: string | null;
}

export function QuizPanel({ mod, topic }: QuizPanelProps) {
  const { framework, knowledge, profile, store } = usePathways();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answered = quiz && quiz.i < quiz.questions.length ? quiz.answers[quiz.i] : undefined;

  // Answering disables the options, so move focus to the feedback's button.
  useEffect(() => {
    if (answered !== undefined) nextRef.current?.focus();
  }, [answered]);

  const hasSubject = topic !== null && knowledge.topics.some((t) => t.id === topic);
  const canKnow = frameworkQuestions(framework, mod).length >= 3;

  function start(kind: QuizKind) {
    const questions =
      kind === "subj" && topic
        ? subjectQuestions(knowledge, topic)
        : frameworkQuestions(framework, mod);
    setQuiz({ kind, questions, i: 0, answers: [] });
  }

  function answer(option: number) {
    if (!quiz || quiz.answers[quiz.i] !== undefined) return;
    const answers = [...quiz.answers];
    answers[quiz.i] = option;
    setQuiz({ ...quiz, answers });
  }

  function next() {
    if (!quiz) return;
    const i = quiz.i + 1;
    setQuiz({ ...quiz, i });
    if (i < quiz.questions.length) return;
    const score = scoreAnswers(quiz.questions, quiz.answers);
    store.updateProfile((p) => {
      const scores = p.quiz[mod.key] ?? {};
      const best = Math.max(scores[quiz.kind] ?? 0, score);
      const knowledgeScores =
        quiz.kind === "subj" && topic
          ? { ...p.knowledge, [topic]: Math.max(p.knowledge[topic] ?? 0, score) }
          : p.knowledge;
      return {
        ...p,
        quiz: { ...p.quiz, [mod.key]: { ...scores, [quiz.kind]: best, at: Date.now() } },
        knowledge: knowledgeScores,
      };
    });
  }

  if (quiz && quiz.i < quiz.questions.length) {
    const q = quiz.questions[quiz.i]!;
    return (
      <>
        <div className="qmeta">
          {QUIZ_KIND_LABEL[quiz.kind]}
          {quiz.kind === "subj" && topic ? `: ${topicName(knowledge, topic)}` : ""}. Question{" "}
          {quiz.i + 1} of {quiz.questions.length}
        </div>
        <div className="q" id="quiz-question">
          {q.q}
        </div>
        <div className="opts" role="group" aria-labelledby="quiz-question">
          {q.options.map((o, i) => (
            <button
              key={`${quiz.i}-${i}`}
              type="button"
              className={cn(
                "opt",
                answered !== undefined && i === q.correct && "right",
                answered !== undefined && i === answered && i !== q.correct && "wrong",
              )}
              disabled={answered !== undefined}
              onClick={() => answer(i)}
            >
              {o}
            </button>
          ))}
        </div>
        {answered !== undefined && (
          <>
            <div className="fb" aria-live="polite">
              <strong>{answered === q.correct ? "Correct." : "Not quite."}</strong> {q.explain}
            </div>
            <button ref={nextRef} type="button" className="btn small" onClick={next}>
              {quiz.i + 1 < quiz.questions.length ? "Next question" : "See my score"}
            </button>
          </>
        )}
      </>
    );
  }

  if (quiz) {
    const correct = quiz.answers.filter((a, i) => a === quiz.questions[i]?.correct).length;
    const passed = correct / quiz.questions.length >= QUIZ_PASS;
    return (
      <>
        <div className="score" role="status">
          {correct}/{quiz.questions.length}
        </div>
        <p>
          {passed
            ? "Passed. This counts towards your module progress."
            : "Not passed yet. You need 80% or more. Read the levels again and have another go."}
        </p>
        <div className="row">
          <button type="button" className="btn small" onClick={() => start(quiz.kind)}>
            Try again
          </button>
          <button type="button" className="btn ghost small" onClick={() => setQuiz(null)}>
            Done
          </button>
        </div>
      </>
    );
  }

  const scores = profile.quiz[mod.key] ?? {};
  const best = (
    [
      ["know", "framework"],
      ["subj", "subject knowledge"],
    ] as const
  )
    .filter(([k]) => scores[k] !== undefined)
    .map(([k, label]) => `${label} ${Math.round((scores[k] ?? 0) * 100)}%`);

  return (
    <>
      <p>Pass any of these with 80% or more to complete this step.</p>
      <div className="quizopts">
        {hasSubject && topic && (
          <div>
            <button type="button" className="btn small" onClick={() => start("subj")}>
              Subject knowledge: {topicName(knowledge, topic)}
            </button>
            <p className="hint">
              Checks what you know about the subject itself. Your score feeds your knowledge base on
              the Courses page.
            </p>
          </div>
        )}
        {canKnow && (
          <div>
            <button type="button" className="btn ghost small" onClick={() => start("know")}>
              Knowing the framework
            </button>
            <p className="hint">Which level does each statement describe?</p>
          </div>
        )}
      </div>
      {best.length > 0 && <p className="hint">Best scores: {best.join(", ")}.</p>}
    </>
  );
}
