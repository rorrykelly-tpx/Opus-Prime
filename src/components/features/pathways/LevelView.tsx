"use client";

import Link from "next/link";

import {
  assess,
  nextSteps,
  overallChip,
  overallRating,
  rateAgainst,
  type NextStepKind,
} from "@/lib/pathways/assessment";
import {
  bandLabel,
  BEHAVIOUR_BANDS,
  formatDate,
  gradeLabel,
  moduleHref,
  plural,
  PROFICIENCY_LEVELS,
} from "@/lib/pathways/framework";
import {
  isKnowledgeGap,
  knowledgeLabel,
  knowledgeOf,
  roleTopics,
  topicName,
} from "@/lib/pathways/knowledge";
import type { Grade, Role } from "@/types/pathways";

import { Loading } from "./Loading";
import { usePathways } from "./PathwaysProvider";
import { RatingChip } from "./RatingChip";
import { Stairs } from "./Stairs";
import { useChosenRole } from "./use-pathway-route";
import { Wave } from "./Wave";

const KIND_LABEL: Record<NextStepKind, string> = {
  skill: "Craft skill",
  behaviour: "Behaviour",
  consulting: "Consulting core",
  impact: "Impact",
  knowledge: "Knowledge",
};

export function LevelView() {
  const route = useChosenRole();
  if (route.status !== "ok") return <Loading />;
  return <Level role={route.role} grade={route.grade} />;
}

/** Whether evidence reaches a level, for the next-grade column. */
function reaches<L extends string>(have: L | null, want: L, scale: readonly L[]) {
  return have !== null && scale.indexOf(have) >= scale.indexOf(want);
}

function Level({ role, grade }: { role: Role; grade: Grade }) {
  const { framework, knowledge, profile, evidence, certs, demo } = usePathways();
  const a = assess(framework, role, grade, evidence);
  const steps = nextSteps({ framework, knowledge, assessment: a, profile, certs, demo });
  const r = overallRating(framework, a);
  const plan = profile.plan;
  const J = demo;
  const Your = J ? "Julia's" : "Your";
  const showNext = a.target !== grade;
  const first = a.checks[0];

  return (
    <>
      <div className="band sky pastel">
        <div className="wrap">
          <p className="sub">
            {J ? "Where is Julia?" : "Where am I?"} {gradeLabel(grade)}
          </p>
          <h1>{r.label}</h1>
          <p>
            <span className={`rate rate-${overallChip(r.key)} big`}>
              {r.met} met, {r.part} partially met, {r.total - r.met - r.part} not met
            </span>{" "}
            <span className="small">
              out of {r.total} expectations for {gradeLabel(grade)}
            </span>
          </p>
          <p>
            {a.estimate ? (
              <>
                {Your} evidence places {J ? "her" : "you"} at{" "}
                <strong>{gradeLabel(a.estimate)}</strong>. {Your} grade is {gradeLabel(grade)}.
              </>
            ) : (
              first && (
                <>
                  To place {J ? "Julia" : "you"} at {gradeLabel(first.grade)}, the evidence needs at
                  least 3 of the 5 behaviours
                  {first.skillsTotal
                    ? ` and ${Math.ceil(first.skillsTotal * 0.7)} of the ${first.skillsTotal} craft skills`
                    : ""}{" "}
                  at that level. So far there {first.behavioursMet === 1 ? "is" : "are"}{" "}
                  {first.behavioursMet} {plural(first.behavioursMet, "behaviour")}
                  {first.skillsTotal
                    ? ` and ${first.skillsMet} craft ${plural(first.skillsMet, "skill")}`
                    : ""}
                  .
                </>
              )
            )}
          </p>
          <Stairs role={role} grade={grade} estimate={a.estimate} />
          <p className="note" style={{ marginTop: 22, background: "transparent" }}>
            This is a guide for conversations with {J ? "Julia's" : "your"} line manager, not a
            grading decision. It only knows what&apos;s been logged.
          </p>
        </div>
      </div>
      <Wave />
      <section className="plain">
        <div className="wrap">
          <h2>Evidence against expectations</h2>
          <p className="small">
            Ratings use the progression assessment wording. <strong>Met</strong>: evidence at the
            expected level. <strong>Partially met</strong>: evidence one level below.{" "}
            <strong>Not met</strong>: further below, or no evidence yet. <strong>Exceeded</strong>:
            evidence above the expected level.
          </p>
          <div className="tables" style={{ marginTop: 14 }}>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Craft skill</th>
                    <th scope="col">Evidence</th>
                    <th scope="col">{gradeLabel(grade)} expects</th>
                    <th scope="col">Rating</th>
                    {showNext && <th scope="col">{gradeLabel(a.target)}</th>}
                  </tr>
                </thead>
                <tbody>
                  {a.skillRows.map((x) => {
                    const rating = rateAgainst(x.have, x.now, PROFICIENCY_LEVELS);
                    return (
                      <tr key={x.name}>
                        <th scope="row" style={{ fontWeight: 400 }}>
                          <Link href={moduleHref(role.role, grade, x.name)}>{x.name}</Link>
                        </th>
                        <td>{x.have ?? "None yet"}</td>
                        <td>{x.now ?? "Not set"}</td>
                        <td>
                          {rating ? (
                            <>
                              <RatingChip rating={rating} />
                              {rating === "not" && !x.have && (
                                <>
                                  <br />
                                  <span className="small muted">No evidence yet</span>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="muted">Not set</span>
                          )}
                        </td>
                        {showNext &&
                          (x.next ? (
                            <td
                              className={reaches(x.have, x.next, PROFICIENCY_LEVELS) ? "ok" : "gap"}
                            >
                              {x.next}
                              {reaches(x.have, x.next, PROFICIENCY_LEVELS) ? " ✓" : ""}
                            </td>
                          ) : (
                            <td className="muted">Not set</td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Behaviour</th>
                    <th scope="col">Evidence</th>
                    <th scope="col">{gradeLabel(grade)} expects</th>
                    <th scope="col">Rating</th>
                    {showNext && <th scope="col">{gradeLabel(a.target)}</th>}
                  </tr>
                </thead>
                <tbody>
                  {a.behaviourRows.map((x) => {
                    const rating = rateAgainst(x.have, x.now, BEHAVIOUR_BANDS);
                    const ok = reaches(x.have, x.next, BEHAVIOUR_BANDS);
                    return (
                      <tr key={x.name}>
                        <th scope="row" style={{ fontWeight: 400 }}>
                          <Link href={moduleHref(role.role, grade, x.name)}>{x.name}</Link>
                        </th>
                        <td>{x.have ? bandLabel(x.have) : "None yet"}</td>
                        <td>{bandLabel(x.now)}</td>
                        <td>
                          <RatingChip rating={rating} />
                          {rating === "not" && !x.have && (
                            <>
                              <br />
                              <span className="small muted">No evidence yet</span>
                            </>
                          )}
                        </td>
                        {showNext && (
                          <td className={ok ? "ok" : "gap"}>
                            {bandLabel(x.next)}
                            {ok ? " ✓" : ""}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      <section className="plain" style={{ paddingTop: 0 }}>
        <div className="wrap cols">
          <div>
            <h2>What to do next</h2>
            <p>
              Aiming for{" "}
              {a.target === grade ? `fully meeting ${gradeLabel(a.target)}` : gradeLabel(a.target)}.
              These are the biggest gaps, most important first.
            </p>
            {steps.length ? (
              <ol className="next">
                {steps.map((s) => (
                  <li key={`${s.kind}:${s.name}`}>
                    <Link href={s.href}>
                      <strong>{s.name}</strong>
                    </Link>{" "}
                    <span className="muted small">{KIND_LABEL[s.kind]}</span>
                    {s.rating && (
                      <>
                        {" "}
                        <RatingChip rating={s.rating} />
                      </>
                    )}
                    <br />
                    {s.text}
                    {s.statements.length > 0 && (
                      <blockquote className="small">
                        {s.statements.map((st, i) => (
                          <span key={i}>
                            {i > 0 && <br />}
                            {st}
                          </span>
                        ))}
                      </blockquote>
                    )}
                    {s.course && (
                      <p className="small" style={{ margin: "6px 0 0" }}>
                        Suggested course:{" "}
                        <a href={s.course.url} target="_blank" rel="noopener noreferrer">
                          {s.course.title}
                          <span className="vh"> (opens in a new tab)</span>
                        </a>
                        , {s.course.provider}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                No gaps in the evidence. Talk to {J ? "Julia's" : "your"} line manager about the
                next step.
              </p>
            )}
            <div className="panel" style={{ marginTop: 24 }}>
              <h3>A 3-month plan</h3>
              {plan ? (
                <>
                  <p>{plan.intro}</p>
                  <ol className="next">
                    {plan.actions.map((x) => (
                      <li key={x.title}>
                        <strong>{x.title}</strong>
                        <br />
                        {x.detail}
                        {x.area && (
                          <>
                            <br />
                            <span className="small muted">Builds: {x.area}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                  <p className="hint">Made {formatDate(plan.at)}.</p>
                </>
              ) : (
                <p className="small">
                  A plan turns the gaps into practical actions for the next 3 months.
                </p>
              )}
              <p className="hint">
                Making new plans needs an AI service, which isn&apos;t set up for this site yet.
              </p>
            </div>
          </div>
          <div>
            <div className="panel pastel lilac">
              <h3>Knowledge base</h3>
              <ul className="res">
                {roleTopics(role).map((t) => {
                  const k = knowledgeOf(t, profile, certs);
                  return (
                    <li key={t}>
                      <strong>{topicName(knowledge, t)}</strong>: {knowledgeLabel(k)}{" "}
                      {isKnowledgeGap(k) ? (
                        <span className="rate rate-partial">Gap</span>
                      ) : (
                        <span className="rate rate-met">Good</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p>
                <Link className="btn small" href="/pathways/courses">
                  See suggested courses
                </Link>
              </p>
            </div>
            <h3>Impact this year</h3>
            <ul className="res">
              {framework.impacts.map((i) => {
                const n = a.impactCount[i.name] ?? 0;
                return (
                  <li key={i.name}>
                    <strong>{i.name}</strong>: {n} {plural(n, "piece")} of evidence
                  </li>
                );
              })}
            </ul>
            <p className="hint">
              How we place you on a grade: the evidence needs to meet at least 70% of the craft
              skill levels and 3 of the 5 behaviour bands at that grade, and every grade below it.
              The overall rating counts Met as 1 and Partially met as a half: all met is Meeting,
              half or more is Partially meeting.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
