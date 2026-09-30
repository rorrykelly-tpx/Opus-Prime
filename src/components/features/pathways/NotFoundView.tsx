"use client";

import Link from "next/link";

import { pathwayHref } from "@/lib/pathways/framework";

import { usePathways } from "./PathwaysProvider";

export function NotFoundView({ title = "Page not found" }: { title?: string }) {
  const { profile } = usePathways();
  const back =
    profile.role && profile.grade ? pathwayHref(profile.role, profile.grade) : "/pathways";
  return (
    <section className="plain">
      <div className="wrap">
        <h1>{title}</h1>
        <p>
          We couldn&apos;t find that. The role may not have that grade, or the link may be out of
          date.
        </p>
        <p>
          <Link href={back}>
            {back === "/pathways" ? "Choose your role and grade" : "Back to my pathway"}
          </Link>
        </p>
      </div>
    </section>
  );
}
