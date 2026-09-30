import { gradeLabel } from "@/lib/pathways";
import type { Grade, RoleOption } from "@/types/pathways";

interface GradePickerProps {
  role: RoleOption | null;
  value: Grade | null;
  onChange: (grade: Grade) => void;
  errorId?: string;
}

export function GradePicker({ role, value, onChange, errorId }: GradePickerProps) {
  const hintId = "grade-hint";
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");
  const firstGrade = role?.grades[0];

  return (
    <fieldset aria-describedby={describedBy}>
      <legend>
        <h2 className="text-2xl font-semibold">What&apos;s your current grade?</h2>
      </legend>
      <p id={hintId} className="mt-2 text-slate-700">
        {firstGrade
          ? `This role starts at ${gradeLabel(firstGrade)} in the framework.`
          : "Choose your role first. We'll then show the grades that exist for it."}
      </p>
      {role && (
        <div className="mt-4 flex flex-wrap gap-2">
          {role.grades.map((grade) => (
            <label
              key={grade}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-400 px-3 py-2 hover:bg-slate-50 has-checked:border-indigo-700 has-checked:bg-indigo-50"
            >
              <input
                type="radio"
                name="grade"
                value={grade}
                checked={value === grade}
                onChange={() => onChange(grade)}
                className="size-4 accent-indigo-700"
              />
              {gradeLabel(grade)}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
