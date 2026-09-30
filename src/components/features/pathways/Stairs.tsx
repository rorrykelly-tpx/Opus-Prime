import { GRADE_NAMES, gradeLabel, gradeLadder } from "@/lib/pathways/framework";
import { cn } from "@/lib/utils";
import type { Grade, Role } from "@/types/pathways";

interface StairsProps {
  role: Role;
  grade: Grade;
  estimate: Grade | null;
  /** Talks about "them" rather than "you", e.g. in the demo. */
  them?: boolean;
}

/** The role's grades as a staircase: the consultant's grade, and how far their evidence reaches. */
export function Stairs({ role, grade, estimate, them = false }: StairsProps) {
  const ladder = gradeLadder(role);
  const reached = estimate ? ladder.indexOf(estimate) : -1;
  const label =
    `Grades for ${role.role}. ${them ? "Their" : "Your"} grade is ${gradeLabel(grade)}.` +
    (estimate
      ? `${them ? " Their evidence places them at " : " Your evidence places you at "}${gradeLabel(estimate)}.`
      : "");
  return (
    <>
      <div className="stairs" role="img" aria-label={label}>
        {ladder.map((g, i) => (
          <div key={g} className={cn("stair", i <= reached && "reached", g === grade && "current")}>
            <div className="tag">{g === grade ? (them ? "Their grade" : "Your grade") : ""}</div>
            <div className="blk" style={{ height: 70 + i * 26 }}>
              <span className="g">{g}</span>
              <span className="l">{GRADE_NAMES[g]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend">
        <span className="lg-r">Evidence shows {them ? "them" : "you"} working at this level</span>
        <span className="lg-c">{them ? "Their" : "Your"} current grade</span>
      </div>
    </>
  );
}
