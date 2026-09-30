"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CAPABILITY_COLOUR,
  findRoleByName,
  gradeLabel,
  gradeLadder,
  pathwayHref,
  plural,
} from "@/lib/pathways/framework";
import type { Grade } from "@/types/pathways";

import { Loading } from "./Loading";
import { usePathways } from "./PathwaysProvider";
import { Wave } from "./Wave";

export function HomeView() {
  const { ready } = usePathways();
  return ready ? <Home /> : <Loading />;
}

function Home() {
  const { framework, profile, store } = usePathways();
  const router = useRouter();
  const saved = findRoleByName(framework, profile.role);
  // Start from the consultant's current choice, so "Change role or grade" keeps it selected.
  const [cap, setCap] = useState<string | null>(saved?.capability ?? null);
  const [roleName, setRoleName] = useState<string | null>(saved?.role ?? null);
  const [grade, setGrade] = useState<Grade | null>(saved ? profile.grade : null);
  const [building, setBuilding] = useState(false);

  const capabilities = [...new Set(framework.roles.map((r) => r.capability))];
  const roles = cap ? framework.roles.filter((r) => r.capability === cap) : [];
  const practices = [...new Set(roles.map((r) => r.practice))];
  const role = findRoleByName(framework, roleName);

  function build() {
    if (!role || !grade) return;
    setBuilding(true);
    store.updateProfile((p) => ({ ...p, role: role.role, grade, plan: null }));
    router.push(pathwayHref(role.role, grade));
  }

  return (
    <>
      <div className="band mint pastel">
        <div className="wrap">
          <p className="sub">TPXimpact learning pathways</p>
          <h1>Grow in your craft</h1>
          <p>
            Choose your role and grade. We&apos;ll build your pathway from the progression
            framework: the skills your role needs, the behaviours expected at each grade, and our
            consulting skills. Then log what you do through the year and see where your evidence
            places you.
          </p>
          {profile.role && profile.grade && (
            <p>
              <Link className="btn" href={pathwayHref(profile.role, profile.grade)}>
                Continue as {profile.role}, {gradeLabel(profile.grade)}
              </Link>
            </p>
          )}
        </div>
      </div>
      <Wave />
      <section className="plain">
        <div className="wrap">
          <div className="steps">
            <div role="group" aria-labelledby="step-cap">
              <div className="step-h">
                <span className="step-n" aria-hidden="true">
                  1
                </span>
                <span className="step-t" id="step-cap">
                  Which capability are you in?
                </span>
              </div>
              <div className="choices">
                {capabilities.map((c) => {
                  const count = framework.roles.filter((r) => r.capability === c).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      className="choice cap"
                      aria-pressed={cap === c}
                      onClick={() => {
                        setCap(c);
                        setRoleName(null);
                        setGrade(null);
                      }}
                    >
                      <span
                        className="sw"
                        aria-hidden="true"
                        style={{ background: `var(--${CAPABILITY_COLOUR[c] ?? "sky"})` }}
                      />
                      {c}
                      <small>
                        {count} {plural(count, "role")}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>

            {cap && (
              <div role="group" aria-labelledby="step-role">
                <div className="step-h">
                  <span className="step-n" aria-hidden="true">
                    2
                  </span>
                  <span className="step-t" id="step-role">
                    What&apos;s your role?
                  </span>
                </div>
                {practices.map((practice) => (
                  <div key={practice} role="group" aria-label={practice}>
                    <p className="small muted" style={{ margin: "10px 0 6px" }}>
                      {practice}
                    </p>
                    <div className="choices">
                      {roles
                        .filter((r) => r.practice === practice)
                        .map((r) => (
                          <button
                            key={r.role}
                            type="button"
                            className="choice"
                            aria-pressed={roleName === r.role}
                            onClick={() => {
                              setRoleName(r.role);
                              setGrade(null);
                            }}
                          >
                            {r.role}
                            <small>
                              Grades {r.grades[0]}–{gradeLadder(r).at(-1)}
                            </small>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {role && (
              <div role="group" aria-labelledby="step-grade">
                <div className="step-h">
                  <span className="step-n" aria-hidden="true">
                    3
                  </span>
                  <span className="step-t" id="step-grade">
                    What&apos;s your current grade?
                  </span>
                </div>
                <div className="choices">
                  {gradeLadder(role).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className="choice"
                      aria-pressed={grade === g}
                      onClick={() => setGrade(g)}
                    >
                      {gradeLabel(g)}
                      {g === "12" && <small>Behaviours only</small>}
                    </button>
                  ))}
                </div>
                {role.grades[0] && +role.grades[0] >= 9 && (
                  <p className="hint">
                    This role starts at {gradeLabel(role.grades[0])} in the framework.
                  </p>
                )}
              </div>
            )}

            {role && grade && (
              <div>
                <button type="button" className="btn" onClick={build} disabled={building}>
                  Build my pathway
                </button>
              </div>
            )}
          </div>

          <div className="panel pastel sky" style={{ marginTop: 40, maxWidth: 760 }}>
            <h3>Already done a progression assessment?</h3>
            <p>
              Upload the Excel file instead. We&apos;ll read your role, grade, levels and evidence
              from it and set up your whole pathway in one go.
            </p>
            <Link className="btn small" href="/pathways/import">
              Import my assessment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
