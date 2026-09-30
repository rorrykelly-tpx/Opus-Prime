"use client";

import Link from "next/link";

import { assess, moduleStatus } from "@/lib/pathways/assessment";
import {
  bandForGrade,
  BEHAVIOUR_BANDS,
  expectedLevel,
  formatDate,
  gradeLabel,
  moduleHref,
  nextGrade,
  pathwayHref,
  PROFICIENCY_LEVELS,
  slugify,
} from "@/lib/pathways/framework";
import {
  coursesFor,
  isKnowledgeGap,
  knowledgeLabel,
  knowledgeOf,
  topicFor,
  topicName,
} from "@/lib/pathways/knowledge";
import { getModule } from "@/lib/pathways/model";
import type { Grade, ModuleDetail, Role } from "@/types/pathways";

import { CourseList } from "./CourseList";
import { Loading } from "./Loading";
import { NotFoundView } from "./NotFoundView";
import { usePathways } from "./PathwaysProvider";
import { QuizPanel } from "./QuizPanel";
import { usePathwayRoute } from "./use-pathway-route";

interface ModuleViewProps {
  roleSlug: string;
  grade: string;
  moduleSlug: string;
}

export function ModuleView({ roleSlug, grade, moduleSlug }: ModuleViewProps) {
  const route = usePathwayRoute(roleSlug, grade);
  const { framework, resources } = usePathways();
  if (route.status === "loading") return <Loading />;
  if (route.status === "missing") return <NotFoundView title="Module not found" />;
  const mod = getModule(framework, resources, slugify(route.role.role), route.grade, moduleSlug);
  if (!mod) return <NotFoundView title="Module not found" />;
  // Keyed so the quiz and anything else local reset when moving between modules.
  return <Module key={mod.key} role={route.role} grade={route.grade} mod={mod} />;
}

function Module({ role, grade, mod }: { role: Role; grade: Grade; mod: ModuleDetail }) {
  const { framework, knowledge, profile, evidence, store } = usePathways();
  const a = assess(framework, role, grade, evidence);
  const es = a.es;
  const status = moduleStatus(mod, profile, es);
  // The grade to compare against: where the evidence says to aim, or the next grade up.
  const nextFor = a.target !== grade ? a.target : nextGrade(role, grade);
  const topic = topicFor(mod.kind, mod.name);

  const myEvidence = evidence.filter((e) =>
    mod.kind === "skill"
      ? e.tags.skills.some((s) => s.name === mod.name)
      : mod.kind === "behaviour"
        ? e.tags.behaviours.some((b) => b.name === mod.name)
        : e.tags.consulting.includes(mod.pillar),
  );

  function toggleRead() {
    const read = !status.read;
    store.updateProfile((p) => {
      const next = { ...p.read };
      if (read) next[mod.key] = true;
      else delete next[mod.key];
      return { ...p, read: next };
    });
    if (read) store.toast("Marked as read");
  }

  return (
    <section className="plain">
      <div className="wrap">
        <p className="crumbs">
          <Link href={pathwayHref(role.role, grade)}>My pathway</Link> /{" "}
          {mod.kind === "skill"
            ? "Craft skills"
            : mod.kind === "behaviour"
              ? "Behaviours"
              : mod.pillar}
        </p>
        <h1>{mod.name}</h1>
        {mod.definition && <p className="sub">{mod.definition}</p>}
        <div className="row" style={{ marginBottom: 24 }}>
          <span
            className="track"
            aria-label={`Read ${status.read ? "done" : "to do"}, quiz ${status.quiz ? "passed" : "to do"}, evidence ${status.evidence ? "logged" : "to do"}`}
          >
            <i className={status.read ? "done" : ""}>Read</i>
            <i className={status.quiz ? "done" : ""}>Quiz</i>
            <i className={status.evidence ? "done" : ""}>Evidence</i>
          </span>
        </div>
        <div className="cols">
          <div>
            <h2>What good looks like</h2>
            {mod.kind === "skill" && (
              <SkillLevels
                mod={mod}
                role={role}
                nextFor={nextFor}
                have={haveSkill(es.skill[mod.name])}
              />
            )}
            {mod.kind === "behaviour" && (
              <BehaviourLevels
                mod={mod}
                nextFor={nextFor}
                have={mod.name in es.beh ? BEHAVIOUR_BANDS[es.beh[mod.name]!]! : null}
              />
            )}
            {mod.kind === "consulting" && <WhereThisSits mod={mod} role={role} grade={grade} />}
            <p style={{ marginTop: 14 }}>
              {status.read && <span className="muted">You&apos;ve marked this as read. </span>}
              {/* One button whose label changes, so keyboard focus stays put when it's pressed. */}
              <button
                type="button"
                className={status.read ? "linkbtn" : "btn ghost small"}
                onClick={toggleRead}
              >
                {status.read ? "Undo" : "Mark as read"}
              </button>
            </p>
            <h2 style={{ marginTop: 36 }}>Test yourself</h2>
            <div id="quiz" className="panel">
              <QuizPanel mod={mod} topic={topic} />
            </div>
          </div>
          <div>
            <div className="panel pastel lilac">
              <h3>Your evidence</h3>
              {myEvidence.length ? (
                <ul className="res">
                  {myEvidence.map((e) => (
                    <li key={e.id}>
                      <Link href="/pathways/year">{e.title}</Link>
                      <small>{formatDate(e.date)}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small">Nothing logged against this yet.</p>
              )}
              <p>
                <Link className="btn small" href="/pathways/year">
                  Add evidence
                </Link>
              </p>
            </div>
            {topic && knowledge.topics.some((t) => t.id === topic) && (
              <TopicCourses topic={topic} />
            )}
            <div className="panel">
              <h3>Learn more</h3>
              {mod.resources.length ? (
                <ul className="res">
                  {mod.resources.map((r) => (
                    <li key={r.id}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.title}
                      </a>
                      <small>{r.description}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small">No learning resources are linked to this module yet.</p>
              )}
              <p className="hint">External sites open in a new tab.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TopicCourses({ topic }: { topic: string }) {
  const { knowledge, profile, certs } = usePathways();
  const k = knowledgeOf(topic, profile, certs);
  const gap = isKnowledgeGap(k);
  const completed = new Set(certs.map((c) => c.title.toLowerCase()));
  return (
    <div className={gap ? "panel pastel sky" : "panel"}>
      <h3>Courses: {topicName(knowledge, topic)}</h3>
      <p className="small">
        Your knowledge: <strong>{knowledgeLabel(k)}</strong>
        {gap ? ". We suggest one of these courses." : "."}
      </p>
      <CourseList courses={coursesFor(knowledge, topic)} completed={completed} />
      <p>
        <Link className="btn small" href={`/pathways/courses/${topic}`}>
          Upload a certificate
        </Link>
      </p>
    </div>
  );
}

function haveSkill(index: number | undefined) {
  return index === undefined ? null : PROFICIENCY_LEVELS[index]!;
}

function SkillLevels({
  mod,
  role,
  nextFor,
  have,
}: {
  mod: Extract<ModuleDetail, { kind: "skill" }>;
  role: Role;
  nextFor: Grade | null;
  have: (typeof PROFICIENCY_LEVELS)[number] | null;
}) {
  const next = nextFor ? expectedLevel(role, mod.name, nextFor) : null;
  return (
    <>
      <div className="levels">
        {mod.levels.map((l) => (
          <details key={l.level} open={l.isTarget || l.level === next}>
            <summary>
              <span className="lv">{l.label}</span>
              {l.isTarget && <span className="flag now">Expected at your grade</span>}
              {l.level === next && next !== mod.target && nextFor && (
                <span className="flag next">Expected at {gradeLabel(nextFor)}</span>
              )}
              {l.level === have && <span className="flag have">Your evidence shows this</span>}
            </summary>
            <ul>
              {l.descriptors.map((d, i) => (
                // Descriptors are static and can repeat, so position is the stable key.
                <li key={i}>{d}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      {mod.targetUndescribed && mod.target && (
        <p className="note">
          The framework expects {mod.target} for this skill at your grade, but doesn&apos;t describe
          that level yet. Ask your Head of Practice what good looks like.
        </p>
      )}
    </>
  );
}

function BehaviourLevels({
  mod,
  nextFor,
  have,
}: {
  mod: Extract<ModuleDetail, { kind: "behaviour" }>;
  nextFor: Grade | null;
  have: (typeof BEHAVIOUR_BANDS)[number] | null;
}) {
  const next = nextFor ? bandForGrade(nextFor) : null;
  return (
    <div className="levels">
      {mod.levels.map((l) => (
        <details key={l.level} open={l.isTarget || l.level === next}>
          <summary>
            <span className="lv">{l.label}</span>
            {l.isTarget && <span className="flag now">Expected at your grade</span>}
            {l.level === next && next !== mod.target && (
              <span className="flag next">Your next step</span>
            )}
            {l.level === have && <span className="flag have">Your evidence shows this</span>}
          </summary>
          <ul>
            {l.descriptors.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

function WhereThisSits({
  mod,
  role,
  grade,
}: {
  mod: Extract<ModuleDetail, { kind: "consulting" }>;
  role: Role;
  grade: Grade;
}) {
  return (
    <>
      <div className="panel pastel pink">
        <h3>Where this sits</h3>
        <p>
          {mod.name} is {mod.foundation ? "a foundation module" : "a module"} at{" "}
          <strong>{mod.stage}</strong> stage in {mod.pillar}.
        </p>
        <p className="small">
          We suggest literacy for grades 6 to 8, fluency for 8 to 10, and mastery for 10 and above.
          Check this against how the programme is run.
        </p>
        <p className="small">
          It supports the{" "}
          <Link href={moduleHref(role.role, grade, mod.links.behaviour)}>
            {mod.links.behaviour}
          </Link>{" "}
          behaviour and the {mod.links.impact} impact.
        </p>
      </div>
      <h3>Other modules in {mod.pillar}</h3>
      <ul className="mods">
        {mod.pillarModules.map((m) => {
          const here = m.slug === mod.slug;
          return (
            <li key={m.key}>
              <Link
                className="mod"
                href={moduleHref(role.role, grade, m.name)}
                aria-current={here ? "page" : undefined}
              >
                <span className="mn">
                  {m.name}
                  <span className="stage">{m.stage}</span>
                  {here && <span className="here">You&apos;re here</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
