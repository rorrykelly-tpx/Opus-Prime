"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { DEMO_PERSON } from "@/lib/pathways/demo";
import { pathwayHref } from "@/lib/pathways/framework";

import { usePathways } from "./PathwaysProvider";
import { ThemeToggle } from "./ThemeToggle";

type Section = "home" | "pathway" | "year" | "courses" | "level" | "share" | "";

function sectionOf(pathname: string): Section {
  if (pathname === "/pathways") return "home";
  const first = pathname.split("/")[2] ?? "";
  if (first === "year" || first === "import") return "year";
  if (first === "courses" || first === "level" || first === "share") return first;
  if (first === "data") return "";
  return "pathway";
}

export function SiteHeader() {
  const { ready, demo, profile, user, store } = usePathways();
  const pathname = usePathname();
  const router = useRouter();
  const active = sectionOf(pathname);
  const first = DEMO_PERSON.name.split(" ")[0];

  const links: [string, string, Section][] =
    profile.role && profile.grade
      ? [
          [pathwayHref(profile.role, profile.grade), demo ? "Pathway" : "My pathway", "pathway"],
          ["/pathways/year", demo ? "Year" : "My year", "year"],
          ["/pathways/courses", "Courses", "courses"],
          ["/pathways/level", demo ? `Where is ${first}?` : "Where am I?", "level"],
          ["/pathways/share", "Sharing", "share"],
        ]
      : [["/pathways", "Choose your role", "home"]];

  function toggleDemo() {
    if (!ready) return;
    const p = demo ? store.exitDemo() : store.enterDemo();
    router.push(p.role && p.grade ? pathwayHref(p.role, p.grade) : "/pathways");
    store.toast(demo ? "Demo ended" : `Demo started: you're seeing ${first}'s pathway`);
  }

  return (
    <header className="top">
      <div className="wrap">
        <button
          className="demo-btn"
          type="button"
          aria-pressed={demo}
          title={`Presentation mode: see the site as ${first}`}
          onClick={toggleDemo}
        >
          {demo ? "Exit demo" : "Demo"}
        </button>
        <Link className="brand" href="/pathways" aria-label="TPXimpact learning pathways, home">
          <span className="wm">
            TP<span className="x">X</span>impact
          </span>
          <span className="prod">Learning pathways</span>
        </Link>
        <nav className="main" aria-label="Main">
          {ready &&
            links.map(([href, label, key]) => (
              <Link key={key} href={href} aria-current={key === active ? "page" : undefined}>
                {label}
              </Link>
            ))}
        </nav>
        <span className="who" title={user.email}>
          <span className="vh">Signed in as </span>
          {user.name}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
