"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { pathwayHref } from "@/lib/pathways";
import type { Grade, RoleOption } from "@/types/pathways";

import { GradePicker } from "./GradePicker";
import { RolePicker } from "./RolePicker";

interface PathwayBuilderProps {
  roles: RoleOption[];
  initialRoleSlug?: string;
  initialGrade?: Grade;
}

type BuilderError = { field: "role" | "grade"; message: string };

export function PathwayBuilder({ roles, initialRoleSlug, initialGrade }: PathwayBuilderProps) {
  const router = useRouter();
  const [roleSlug, setRoleSlug] = useState<string | null>(initialRoleSlug ?? null);
  const [grade, setGrade] = useState<Grade | null>(initialGrade ?? null);
  const [error, setError] = useState<BuilderError | null>(null);

  const role = roles.find((r) => r.slug === roleSlug) ?? null;
  const errorId = "pathway-builder-error";

  function chooseRole(slug: string) {
    setRoleSlug(slug);
    setError(null);
    const next = roles.find((r) => r.slug === slug);
    // Grades differ between roles, so drop a grade the new role doesn't have.
    if (grade && !next?.grades.includes(grade)) setGrade(null);
  }

  function chooseGrade(next: Grade) {
    setGrade(next);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) {
      setError({ field: "role", message: "Choose your role" });
      return;
    }
    if (!grade) {
      setError({ field: "grade", message: "Choose your grade" });
      return;
    }
    router.push(pathwayHref(role.slug, grade));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      <RolePicker
        roles={roles}
        value={roleSlug}
        onChange={chooseRole}
        errorId={error?.field === "role" ? errorId : undefined}
      />
      <GradePicker
        role={role}
        value={grade}
        onChange={chooseGrade}
        errorId={error?.field === "grade" ? errorId : undefined}
      />
      <div className="space-y-3">
        <p id={errorId} role="alert" className="font-medium text-red-700 empty:hidden">
          {error?.message}
        </p>
        <button
          type="submit"
          className="rounded-md bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
        >
          Build my pathway
        </button>
      </div>
    </form>
  );
}
