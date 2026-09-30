"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DEMO_PERSON } from "@/lib/pathways/demo";
import { gradeLabel, moduleHref, pathwayHref } from "@/lib/pathways/framework";

import { usePathways } from "./PathwaysProvider";

/** The presentation-mode banner, with a tour of the main pages. */
export function DemoBar() {
  const { demo, profile } = usePathways();
  const pathname = usePathname();
  if (!demo || !profile.role || !profile.grade) return null;

  const first = DEMO_PERSON.name.split(" ")[0];
  const stops: [string, string][] = [
    [pathwayHref(profile.role, profile.grade), `${first}'s pathway`],
    [moduleHref(profile.role, profile.grade, "Testing (data)"), "A module: Testing (data)"],
    ["/pathways/year", "Her year"],
    ["/pathways/courses", "Courses and certificates"],
    ["/pathways/level", `Where is ${first}?`],
  ];

  return (
    <div className="demobar">
      <div className="wrap">
        <span className="persona" aria-hidden="true">
          {DEMO_PERSON.initial}
        </span>
        <p>
          <strong>Demo: {DEMO_PERSON.name}</strong>, {profile.role}, {gradeLabel(profile.grade)}.
          Partially meeting expectations. Nothing you do in the demo is saved.
        </p>
        <nav className="tour" aria-label="Demo tour">
          <ol>
            {stops.map(([href, label]) => (
              <li key={href}>
                <Link href={href} aria-current={pathname === href ? "step" : undefined}>
                  {label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}
