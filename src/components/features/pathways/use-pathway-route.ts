"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  findRoleByName,
  findRoleBySlug,
  gradeLadder,
  isGrade,
  pathwayHref,
} from "@/lib/pathways/framework";
import type { Grade, Role } from "@/types/pathways";

import { usePathways } from "./PathwaysProvider";

export type RouteState =
  { status: "loading" } | { status: "missing" } | { status: "ok"; role: Role; grade: Grade };

/**
 * The role and grade in a pathway URL. The URL is the source of truth, so opening a pathway
 * makes it the consultant's own. In the demo, other pathways redirect to Julia's.
 */
export function usePathwayRoute(roleSlug: string, gradeParam: string): RouteState {
  const { ready, demo, framework, profile, store } = usePathways();
  const router = useRouter();
  const pathname = usePathname();

  const role = findRoleBySlug(framework, roleSlug);
  const grade =
    isGrade(gradeParam) && role && gradeLadder(role).includes(gradeParam) ? gradeParam : null;
  const matchesProfile = role?.role === profile.role && grade === profile.grade;

  useEffect(() => {
    if (!ready || !role || !grade || matchesProfile) return;
    if (demo) {
      if (profile.role && profile.grade) {
        const current = pathwayHref(role.role, grade);
        router.replace(pathname.replace(current, pathwayHref(profile.role, profile.grade)));
      }
      return;
    }
    store.updateProfile((p) => ({
      ...p,
      role: role.role,
      grade,
      // A plan is written for one role and grade.
      plan: null,
    }));
  }, [
    demo,
    grade,
    matchesProfile,
    pathname,
    profile.grade,
    profile.role,
    ready,
    role,
    router,
    store,
  ]);

  if (!ready) return { status: "loading" };
  if (!role || !grade) return { status: "missing" };
  if (demo && !matchesProfile) return { status: "loading" };
  return { status: "ok", role, grade };
}

/** The consultant's chosen role and grade, or a redirect to choose one. */
export function useChosenRole(): RouteState {
  const { ready, framework, profile } = usePathways();
  const router = useRouter();
  const role = findRoleByName(framework, profile.role);
  const grade =
    role && profile.grade && gradeLadder(role).includes(profile.grade) ? profile.grade : null;

  useEffect(() => {
    if (ready && (!role || !grade)) router.replace("/pathways");
  }, [grade, ready, role, router]);

  if (!ready || !role || !grade) return { status: "loading" };
  return { status: "ok", role, grade };
}
