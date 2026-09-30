"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  assess,
  moduleProgress,
  moduleStatus,
  overallChip,
  overallRating,
  rateAgainst,
  type Assessment,
  type EvidenceSummary,
} from "@/lib/pathways/assessment";
import {
  bandLabel,
  BEHAVIOUR_BANDS,
  CAPABILITY_COLOUR,
  expectedLevel,
  gradeLabel,
  moduleHref,
  PROFICIENCY_LEVELS,
  slugify,
} from "@/lib/pathways/framework";
import { buildPathway } from "@/lib/pathways/model";
import type { Grade, ModuleSummary, Profile, Role } from "@/types/pathways";

import { GameCard } from "./GameCard";
import { Loading } from "./Loading";
import { NotFoundView } from "./NotFoundView";
import { usePathways } from "./PathwaysProvider";
import { RatingChip } from "./RatingChip";
import { Stairs } from "./Stairs";
import { usePathwayRoute } from "./use-pathway-route";
import { Wave } from "./Wave";

export function PathwayView({ roleSlug, grade }: { roleSlug: string; grade: string }) {
  const route = usePathwayRoute(roleSlug, grade);
  if (route.status === "loading") return <Loading />;
  if (route.status === "missing") return <NotFoundView />;
  return <Pathway role={route.role} grade={route.grade} />;
}

interface RowContext {
  role: Role;
  grade: Grade;
  profile: Profile;
  es: EvidenceSummary;
  a: Assessment;
}

function ModuleRow({ mod, ctx }: { mod: ModuleSummary; ctx: RowContext }) {
  const { role, grade, profile, es, a } = ctx;
  const s = moduleStatus(mod, profile, es);
  let meta = "";
  let chip = null;
  if (mod.kind === "skill") {
    const next = a.target !== grade ? expectedLevel(role, mod.name, a.target) : null;
    meta = mod.target
      ? `At your grade: ${mod.target}${next && next !== mod.target ? `. Next grade: ${next}` : ""}`
      : "Not expected at your grade in the framework";
    const have = mod.name in es.skill ? PROFICIENCY_LEVELS[es.skill[mod.name]!]! : null;
    chip = rateAgainst(have, mod.target, PROFICIENCY_LEVELS);
  } else if (mod.kind === "behaviour") {
    meta = `At your grade: ${bandLabel(mod.target)}`;
    const have = mod.name in es.beh ? BEHAVIOUR_BANDS[es.beh[mod.name]!]! : null;
    chip = rateAgainst(have, mod.target, BEHAVIOUR_BANDS);
  } else {
    meta = mod.foundation ? "Foundation module" : "";
  }
  return (
    <li>
      <Link className="mod" href={moduleHref(role.role, grade, mod.name)}>
        <span className="mn">
          {mod.name}
          {mod.kind === "consulting" && <span className="stage">{mod.stage}</span>}
        </span>
        <span className="mm">
          {meta} <RatingChip rating={chip} />
        </span>
        <span
          className="track"
          aria-label={`Read ${s.read ? "done" : "to do"}, quiz ${s.quiz ? "passed" : "to do"}, evidence ${s.evidence ? "logged" : "to do"}`}
        >
          <i className={s.read ? "done" : ""}>Read</i>
          <i className={s.quiz ? "done" : ""}>Quiz</i>
          <i className={s.evidence ? "done" : ""}>Evidence</i>
        </span>
      </Link>
    </li>
  );
}

function Pathway({ role, grade }: { role: Role; grade: Grade }) {
  const { framework, profile, evidence, demo, store } = usePathways();
  // Read once on mount, then marked, so the tracker only animates the first time.
  const [animate] = useState(() => store.shouldAnimatePathway());
  useEffect(() => store.markPathwayAnimated(), [store]);

  const pathway = buildPathway(framework, slugify(role.role), grade);
  if (!pathway) return <NotFoundView />;
  const a = assess(framework, role, grade, evidence);
  const es = a.es;
  const progress = moduleProgress(pathway.modules, profile, es);
  const rating = overallRating(framework, a);
  const colour = CAPABILITY_COLOUR[role.capability] ?? "sky";
  const ctx: RowContext = { role, grade, profile, es, a };

  const group = (mods: ModuleSummary[]) => ({
    done: mods.filter((m) => moduleStatus(m, profile, es).done).length,
    total: mods.length,
  });
  const craft = group(pathway.craftSkills);
  const behaviours = group(pathway.behaviours);
  const consulting = group(pathway.consulting.flatMap((p) => p.modules));

  return (
    <>
      <div className={`band ${colour} pastel`}>
        <div className="wrap">
          <p className="sub">{demo ? "Julia's pathway" : role.practice}</p>
          <h1>{role.role}</h1>
          <p>
            <span className={`rate rate-${overallChip(rating.key)} big`}>{rating.label}</span>{" "}
            <span className="small">for {gradeLabel(grade)}</span>
          </p>
          <p>
            {demo ? "Julia's" : "Your"} grade: <strong>{gradeLabel(grade)}</strong>.{" "}
            {a.estimate ? (
              <>
                {demo ? "Her evidence so far places her" : "Your evidence so far places you"} at{" "}
                <strong>{gradeLabel(a.estimate)}</strong>.
              </>
            ) : (
              "Log some evidence in My year to see where it places you."
            )}
            {!demo && (
              <>
                {" "}
                <Link href="/pathways">Change role or grade</Link>
              </>
            )}
          </p>
          <Stairs role={role} grade={grade} estimate={a.estimate} />
          <h2 style={{ marginTop: 34 }}>Pathway progress</h2>
          <p className="small">
            Each module has three steps: read what good looks like, pass the quiz (80% or more), and
            log evidence at the level for your grade.
          </p>
          <GameCard
            progress={progress}
            tracker={profile.tracker}
            animate={animate}
            onTrackerChange={(tracker) => store.updateProfile((p) => ({ ...p, tracker }))}
          />
        </div>
      </div>
      <Wave />
      <section className="plain">
        <div className="wrap groups">
          <div style={{ "--grp": `var(--${colour})` } as React.CSSProperties}>
            <div className="grp-h">
              <h2>Your craft skills</h2>
              <span className="muted small">
                {craft.done} of {craft.total} complete
              </span>
            </div>
            <p className="muted small">
              The technical skills for {role.role} in the progression framework.
            </p>
            <ul className="mods">
              {pathway.craftSkills.map((m) => (
                <ModuleRow key={m.key} mod={m} ctx={ctx} />
              ))}
            </ul>
          </div>
          <div style={{ "--grp": "var(--lilac)" } as React.CSSProperties}>
            <div className="grp-h">
              <h2>Behaviours</h2>
              <span className="muted small">
                {behaviours.done} of {behaviours.total} complete
              </span>
            </div>
            <p className="muted small">
              How you work, expected of everyone at TPXimpact. These carry the most weight in
              placing your level.
            </p>
            <ul className="mods">
              {pathway.behaviours.map((m) => (
                <ModuleRow key={m.key} mod={m} ctx={ctx} />
              ))}
            </ul>
          </div>
          <div style={{ "--grp": "var(--pink)" } as React.CSSProperties}>
            <div className="grp-h">
              <h2>Consulting core</h2>
              <span className="muted small">
                {consulting.done} of {consulting.total} complete
              </span>
            </div>
            <p className="muted small">
              Our consulting skills programme. Each pillar moves from literacy to fluency to
              mastery. Foundation modules are for everyone.
            </p>
            {pathway.consulting.map((p) => (
              <div key={p.pillar}>
                <h3 className="pillar-h">{p.pillar}</h3>
                <ul className="mods">
                  {p.modules.map((m) => (
                    <ModuleRow key={m.key} mod={m} ctx={ctx} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
